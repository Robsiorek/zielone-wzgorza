/**
 * POST /api/reservations/[id]/check-in
 *
 * Operacja domenowa: zameldowanie gościa.
 * NIE jest transitionem statusu — ustawia TYLKO bookingDetails.checkedInAt.
 *
 * Wymagania:
 *   - type = BOOKING
 *   - status = CONFIRMED (jedyny dozwolony)
 *   - today >= checkIn
 *   - checkedInAt must be null (idempotent)
 *
 * Jeśli status = NO_SHOW → admin musi najpierw użyć /confirm
 * (NO_SHOW → CONFIRMED), a potem /check-in. Dwie osobne akcje.
 *
 * Concurrency: FOR UPDATE lock na reservation row.
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, apiServerError } from "@/lib/api-response";

class CheckInError extends Error {
  readonly status: number;
  constructor(message: string, status: number = 400) {
    super(message);
    this.name = "CheckInError";
    this.status = status;
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const result = await prisma.$transaction(async (tx) => {
      // Lock reservation row
      const locked: { id: string; status: string; type: string; checkIn: Date }[] =
        await tx.$queryRaw`
          SELECT id, status, type, "checkIn" FROM reservations
          WHERE id = ${params.id}
          FOR UPDATE
        `;

      if (locked.length === 0) {
        throw new CheckInError("Rezerwacja nie znaleziona", 404);
      }

      const state = locked[0];

      if (state.type !== "BOOKING") {
        throw new CheckInError("Zameldowanie dotyczy tylko rezerwacji (BOOKING)");
      }

      if (state.status === "NO_SHOW") {
        throw new CheckInError(
          "Gość oznaczony jako niestawienie. Najpierw cofnij niestawienie (potwierdź rezerwację), potem zamelduj.",
          409,
        );
      }

      if (state.status !== "CONFIRMED") {
        throw new CheckInError(`Zameldowanie wymaga statusu CONFIRMED. Aktualny: ${state.status}`);
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const checkInDate = new Date(state.checkIn);
      checkInDate.setHours(0, 0, 0, 0);
      if (today < checkInDate) {
        throw new CheckInError("Zameldowanie możliwe od dnia przyjazdu");
      }

      const bookingDetails = await tx.bookingDetails.findUnique({
        where: { reservationId: params.id },
      });

      // Idempotent
      if (bookingDetails?.checkedInAt) {
        const reservation = await tx.reservation.findUnique({
          where: { id: params.id },
          include: { bookingDetails: true, client: true, items: true },
        });
        return { reservation, checkedIn: false, message: "Gość już zameldowany" };
      }

      await tx.bookingDetails.upsert({
        where: { reservationId: params.id },
        create: { reservationId: params.id, checkedInAt: new Date(), balanceDueMinor: 0, balanceDue: 0 },
        update: { checkedInAt: new Date() },
      });

      const reservation = await tx.reservation.findUnique({
        where: { id: params.id },
        include: { bookingDetails: true, client: true, items: true },
      });

      return { reservation, checkedIn: true };
    });

    return apiSuccess(result);
  } catch (error) {
    if (error instanceof CheckInError) return apiError(error.message, error.status);
    return apiServerError(error);
  }
}
