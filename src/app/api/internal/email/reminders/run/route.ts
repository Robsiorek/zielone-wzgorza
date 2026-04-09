/**
 * POST /api/internal/email/reminders/run
 *
 * E3b: Payment reminder cron job.
 *
 * Strategy: mark-then-send (variant 1 per ChatGPT review).
 * 1. Find candidates (PENDING bookings past deadline)
 * 2. For each: transaction with FOR UPDATE → mark attempt → send
 * 3. On SMTP failure: log in EmailLog, don't retry in same run
 *
 * Auth: x-cron-secret in BOTH middleware AND route handler (double layer).
 * Called by: systemowy cron na VPS (crontab, daily at 9:00).
 *
 * Reminder logic (ChatGPT-approved):
 * - First reminder: paymentReminderCount = 0 AND createdAt <= now - reminderDays
 * - Subsequent:     paymentReminderCount > 0 AND < maxReminders
 *                   AND lastPaymentReminderAt <= now - reminderDays
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, apiServerError } from "@/lib/api-response";
import { emailService } from "@/lib/email-service";

export async function POST(request: NextRequest) {
  try {
    // ── Double auth: route handler check (middleware already checked) ──
    const cronSecret = process.env.CRON_SECRET;
    const headerSecret = request.headers.get("x-cron-secret");
    if (!cronSecret || headerSecret !== cronSecret) {
      return apiError("Unauthorized", 401, "UNAUTHORIZED");
    }

    // ── Load settings ──
    const settings = await prisma.companySettings.findFirst({
      select: {
        reminderEnabled: true,
        reminderDays: true,
        maxReminders: true,
      },
    });

    if (!settings?.reminderEnabled) {
      return apiSuccess({ sent: 0, skipped: 0, errors: 0, reason: "reminders_disabled" });
    }

    const { reminderDays, maxReminders } = settings;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - reminderDays);

    // ── Find candidates ──
    // Two groups: first reminder (count=0, created before cutoff)
    //             subsequent (count>0, count<max, lastReminder before cutoff)
    const candidates = await prisma.reservation.findMany({
      where: {
        status: "PENDING",
        type: "BOOKING",
        client: { email: { not: null } },
        bookingDetails: {
          OR: [
            // First reminder
            { paymentReminderCount: 0 },
            // Subsequent reminder
            {
              paymentReminderCount: { gt: 0, lt: maxReminders },
              lastPaymentReminderAt: { lt: cutoffDate },
            },
          ],
        },
      },
      include: {
        client: true,
        items: { include: { resource: { select: { name: true } } } },
        bookingDetails: true,
      },
    });

    // Filter first reminders by createdAt (can't easily do in Prisma OR)
    const eligible = candidates.filter(r => {
      const bd = r.bookingDetails;
      if (!bd) return false;
      if (bd.paymentReminderCount === 0) {
        // First reminder: check reservation createdAt
        return r.createdAt <= cutoffDate;
      }
      // Subsequent: already filtered by Prisma
      return true;
    });

    let sent = 0;
    let skipped = 0;
    let errors = 0;

    // ── Process each candidate ──
    for (const reservation of eligible) {
      if (!reservation.client?.email || !reservation.bookingDetails) {
        skipped++;
        continue;
      }

      try {
        // Transactional mark-then-send: FOR UPDATE lock to prevent duplicates
        const marked = await prisma.$transaction(async (tx) => {
          // Lock booking details row
          const bd = await tx.$queryRaw<any[]>`
            SELECT "paymentReminderCount", "lastPaymentReminderAt"
            FROM booking_details
            WHERE "reservationId" = ${reservation.id}
            FOR UPDATE
          `;

          if (!bd[0]) return false;

          const count = bd[0].paymentReminderCount;
          const lastAt = bd[0].lastPaymentReminderAt;

          // Re-check conditions under lock
          if (count >= maxReminders) return false;
          if (count === 0 && reservation.createdAt > cutoffDate) return false;
          if (count > 0 && lastAt && new Date(lastAt) > cutoffDate) return false;

          // Mark attempt (before send — variant 1)
          await tx.bookingDetails.update({
            where: { reservationId: reservation.id },
            data: {
              paymentReminderCount: { increment: 1 },
              lastPaymentReminderAt: new Date(),
            },
          });

          return true;
        });

        if (!marked) {
          skipped++;
          continue;
        }

        // Send email (outside transaction — fire-and-forget is NOT used here,
        // cron waits for result to report accurate stats)
        const success = await emailService.sendPaymentReminder(
          {
            id: reservation.id,
            number: reservation.number,
            checkIn: reservation.checkIn,
            checkOut: reservation.checkOut,
            nights: reservation.nights,
            adults: reservation.adults,
            children: reservation.children,
            totalMinor: reservation.totalMinor,
            requiredDepositMinor: reservation.requiredDepositMinor || 0,
            status: "PENDING",
            items: reservation.items,
            bookingDetails: reservation.bookingDetails,
          },
          {
            firstName: reservation.client.firstName || "",
            lastName: reservation.client.lastName || "",
            email: reservation.client.email!,
          },
        );

        if (success) {
          sent++;
        } else {
          errors++;
        }
      } catch (err) {
        console.error(`[REMINDER] Error processing reservation ${reservation.number}:`, err);
        errors++;
      }
    }

    // ── Write cron heartbeat for /api/health ──
    try {
      const fs = await import("fs/promises");
      await fs.mkdir("/var/www/admin/data", { recursive: true });
      await fs.writeFile(
        "/var/www/admin/data/cron-heartbeat.json",
        JSON.stringify({ lastReminderRunAt: new Date().toISOString(), sent, errors }),
      );
    } catch (heartbeatErr) {
      console.error("[REMINDER] Heartbeat write failed:", heartbeatErr);
    }

    return apiSuccess({
      sent,
      skipped,
      errors,
      total: eligible.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return apiServerError(error);
  }
}
