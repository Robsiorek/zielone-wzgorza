/**
 * POST /api/reservations/[id]/confirm
 * Thin wrapper: PENDING → CONFIRMED via reservation-transition service.
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, apiServerError } from "@/lib/api-response";
import { emailService } from "@/lib/email-service";
import { transitionReservationStatus, TransitionError } from "@/lib/reservation-transition";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json().catch(() => ({}));

    const result = await prisma.$transaction(async (tx) => {
      return transitionReservationStatus(tx, params.id, {
        targetStatus: "CONFIRMED",
        changedBy: "ADMIN",
        note: body.note || "Rezerwacja potwierdzona",
      });
    });

    // Email after commit — query with typed include for email data
    if (!result.idempotent) {
      const res = await prisma.reservation.findUnique({
        where: { id: params.id },
        include: {
          client: { select: { firstName: true, lastName: true, email: true } },
          items: { include: { resource: { select: { name: true } } } },
          bookingDetails: { select: { token: true } },
        },
      });
      if (res?.client?.email) {
        emailService.sendStatusChange(
          { id: res.id, number: res.number, checkIn: res.checkIn, checkOut: res.checkOut, nights: res.nights, adults: res.adults, children: res.children, totalMinor: res.totalMinor, requiredDepositMinor: res.requiredDepositMinor || 0, status: "CONFIRMED", items: res.items, bookingDetails: res.bookingDetails },
          { firstName: res.client.firstName || "", lastName: res.client.lastName || "", email: res.client.email },
          "CONFIRMED",
        );
      }
    }

    return apiSuccess(result);
  } catch (error) {
    if (error instanceof TransitionError) return apiError(error.message, error.status, error.code);
    return apiServerError(error);
  }
}
