/**
 * POST /api/reservations/[id]/no-show
 * CONFIRMED → NO_SHOW via reservation-transition service.
 *
 * Hook queries bookingDetails directly with typed select —
 * zero casts, zero as unknown, zero as any.
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, apiServerError } from "@/lib/api-response";
import { transitionReservationStatus, TransitionError } from "@/lib/reservation-transition";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const result = await prisma.$transaction(async (tx) => {
      return transitionReservationStatus(tx, params.id, {
        targetStatus: "NO_SHOW",
        changedBy: "ADMIN",
        note: "Gość nie stawił się",

        beforeUpdate: async (txInner, state, fullReservation) => {
          if (state.type !== "BOOKING") {
            throw new TransitionError("Niestawienie dotyczy tylko rezerwacji (BOOKING)", 400, "INVALID_OPERATION");
          }

          // Query bookingDetails with explicit typed select — zero casts
          const bookingDetails = await txInner.bookingDetails.findUnique({
            where: { reservationId: params.id },
            select: { checkedInAt: true },
          });

          if (bookingDetails?.checkedInAt) {
            throw new TransitionError("Zameldowany gość nie może być oznaczony jako niestawienie", 400, "ALREADY_CHECKED_IN");
          }

          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const checkInDate = new Date(fullReservation.checkIn);
          checkInDate.setHours(0, 0, 0, 0);
          const checkOutDate = new Date(fullReservation.checkOut);
          checkOutDate.setHours(0, 0, 0, 0);

          if (today < checkInDate) {
            throw new TransitionError("Niestawienie można oznaczyć od dnia przyjazdu", 400, "TOO_EARLY");
          }
          if (today >= checkOutDate) {
            throw new TransitionError("Niestawienie można oznaczyć przed zakończeniem pobytu", 400, "TOO_LATE");
          }
        },
      });
    });

    return apiSuccess(result);
  } catch (error) {
    if (error instanceof TransitionError) return apiError(error.message, error.status, error.code);
    return apiServerError(error);
  }
}
