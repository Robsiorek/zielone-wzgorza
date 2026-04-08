/**
 * GET/PATCH /api/settings/email — Email configuration.
 *
 * E3: Business settings for email (sender, bank, reminders).
 * SMTP credentials stay in .env — not exposed in API.
 * Auth: OWNER+ for PATCH, any admin for GET.
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, apiUnauthorized, apiForbidden, apiServerError } from "@/lib/api-response";
import { getAuthContext, hasMinRole } from "@/lib/require-auth";

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth) return apiUnauthorized();

    const settings = await prisma.companySettings.findFirst({
      select: {
        senderEmail: true,
        senderName: true,
        replyToEmail: true,
        bankAccountName: true,
        bankAccountIban: true,
        bankName: true,
        reminderEnabled: true,
        reminderDays: true,
        maxReminders: true,
        email: true,
        phone: true,
      },
    });

    // SMTP diagnostics (from .env — never expose password value)
    const smtpHost = process.env.SMTP_HOST || "";
    const smtpPort = process.env.SMTP_PORT || "";
    const smtpSecure = process.env.SMTP_SECURE || "";
    const smtpUser = process.env.SMTP_USER || "";
    const smtpPassword = process.env.SMTP_PASSWORD || "";
    const dryRun = process.env.EMAIL_DRY_RUN === "true";

    const allConfigured = !!(smtpHost && smtpPort && smtpUser && smtpPassword);

    return apiSuccess({
      config: settings || {},
      smtp: {
        configured: allConfigured,
        dryRun,
        fields: {
          host: { ok: !!smtpHost, value: smtpHost || null },
          port: { ok: !!smtpPort, value: smtpPort || null },
          secure: { ok: true, value: smtpSecure === "true" ? "SSL/TLS" : "STARTTLS" },
          user: { ok: !!smtpUser, value: smtpUser || null },
          password: { ok: !!smtpPassword, value: smtpPassword ? "••••••••" : null },
        },
      },
    });
  } catch (error) {
    return apiServerError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth) return apiUnauthorized();
    if (!hasMinRole(auth, "OWNER")) return apiForbidden();

    const body = await request.json();
    const data: any = {};

    // Sender
    if (body.senderEmail !== undefined) {
      const email = body.senderEmail?.trim() || null;
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return apiError("Nieprawidłowy adres email nadawcy");
      }
      data.senderEmail = email;
    }
    if (body.senderName !== undefined) {
      data.senderName = body.senderName?.trim() || "Zielone Wzgórza";
    }
    if (body.replyToEmail !== undefined) {
      const email = body.replyToEmail?.trim() || null;
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return apiError("Nieprawidłowy adres replyTo");
      }
      data.replyToEmail = email;
    }

    // Bank
    if (body.bankAccountName !== undefined) data.bankAccountName = body.bankAccountName?.trim() || "";
    if (body.bankAccountIban !== undefined) data.bankAccountIban = body.bankAccountIban?.trim() || "";
    if (body.bankName !== undefined) data.bankName = body.bankName?.trim() || "";

    // Reminders
    if (body.reminderEnabled !== undefined) data.reminderEnabled = Boolean(body.reminderEnabled);
    if (body.reminderDays !== undefined) {
      const days = parseInt(body.reminderDays);
      if (isNaN(days) || days < 1 || days > 30) {
        return apiError("Dni przypomnienia: 1-30");
      }
      data.reminderDays = days;
    }
    if (body.maxReminders !== undefined) {
      const max = parseInt(body.maxReminders);
      if (isNaN(max) || max < 1 || max > 10) {
        return apiError("Maksymalna liczba przypomnień: 1-10");
      }
      data.maxReminders = max;
    }

    const settings = await prisma.companySettings.update({
      where: { id: "default" },
      data,
      select: {
        senderEmail: true,
        senderName: true,
        replyToEmail: true,
        bankAccountName: true,
        bankAccountIban: true,
        bankName: true,
        reminderEnabled: true,
        reminderDays: true,
        maxReminders: true,
      },
    });

    return apiSuccess({ config: settings });
  } catch (error) {
    return apiServerError(error);
  }
}
