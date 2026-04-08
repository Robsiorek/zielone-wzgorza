/**
 * GET /api/public/reservation/[token] — Public reservation view by token.
 *
 * E2: Returns read-only reservation data for the client's confirmation page.
 * Token is from BookingDetails.token (64-char hex, cryptographically secure).
 * No auth required. No sensitive data beyond what the client already knows.
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiNotFound, apiServerError } from "@/lib/api-response";

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;

    if (!token || token.length < 32) {
      return apiNotFound("Rezerwacja nie znaleziona");
    }

    const bookingDetails = await prisma.bookingDetails.findUnique({
      where: { token },
      include: {
        reservation: {
          select: {
            id: true,
            number: true,
            status: true,
            paymentStatus: true,
            checkIn: true,
            checkOut: true,
            nights: true,
            adults: true,
            children: true,
            totalMinor: true,
            subtotalMinor: true,
            discountMinor: true,
            requiredDepositMinor: true,
            guestNotes: true,
            currency: true,
            items: {
              select: {
                adults: true,
                children: true,
                totalPriceMinor: true,
                resource: {
                  select: { name: true },
                },
              },
              orderBy: { sortOrder: "asc" },
            },
            addons: {
              where: { isActive: true },
              select: {
                snapshotName: true,
                quantity: true,
                totalMinor: true,
              },
              orderBy: { sortOrder: "asc" },
            },
          },
        },
      },
    });

    if (!bookingDetails || !bookingDetails.reservation) {
      return apiNotFound("Rezerwacja nie znaleziona");
    }

    const res = bookingDetails.reservation;

    return apiSuccess({
      reservation: {
        number: res.number,
        status: res.status,
        paymentStatus: res.paymentStatus,
        checkIn: res.checkIn,
        checkOut: res.checkOut,
        nights: res.nights,
        adults: res.adults,
        children: res.children,
        totalMinor: res.totalMinor,
        subtotalMinor: res.subtotalMinor,
        discountMinor: res.discountMinor,
        requiredDepositMinor: res.requiredDepositMinor,
        guestNotes: res.guestNotes,
        currency: res.currency,
        items: res.items,
        addons: res.addons,
        bookingDetails: {
          paidAmountMinor: bookingDetails.paidAmountMinor,
          balanceDueMinor: bookingDetails.balanceDueMinor,
          overpaidAmountMinor: bookingDetails.overpaidAmountMinor,
        },
      },
    });
  } catch (error) {
    return apiServerError(error);
  }
}
