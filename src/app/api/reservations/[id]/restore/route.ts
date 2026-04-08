/**
 * POST /api/reservations/[id]/restore
 * CANCELLED → PENDING via reservation-transition service.
 *
 * Hooks query items/resources directly with typed Prisma select —
 * zero casts, zero as unknown, zero as any.
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, apiServerError } from "@/lib/api-response";
import { transitionReservationStatus, TransitionError } from "@/lib/reservation-transition";
import {
  checkAvailability,
  checkQuantityAvailability,
  createTimelineEntry,
  ConflictError,
  QuantityExceededError,
} from "@/lib/timeline-service";
import { getTimelineLabel } from "@/lib/reservation-validation";

/** Runtime type guard — validates and narrows string to timeline type */
function toTimelineType(type: string): "BOOKING" | "OFFER" | "BLOCK" {
  if (type === "BOOKING" || type === "OFFER" || type === "BLOCK") return type;
  throw new Error(`Nieprawidłowy typ timeline: ${type}`);
}

/** Typed select for items needed by restore hooks */
const RESTORE_ITEM_SELECT = {
  id: true,
  resourceId: true,
  startAt: true,
  endAt: true,
  categoryType: true,
  quantity: true,
} as const;

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await request.json().catch(() => ({}));

    const result = await prisma.$transaction(async (tx) => {
      return transitionReservationStatus(tx, params.id, {
        targetStatus: "PENDING",
        changedBy: "ADMIN",
        note: "Przywrócono anulowaną rezerwację",

        beforeUpdate: async (txInner, _state, _fullReservation) => {
          // Query items with explicit typed select — Prisma provides full typing
          const items = await txInner.reservationItem.findMany({
            where: { reservationId: params.id },
            select: RESTORE_ITEM_SELECT,
          });

          for (const item of items) {
            if (item.categoryType === "QUANTITY_TIME") {
              const avail = await checkQuantityAvailability(
                txInner, item.resourceId, item.startAt, item.endAt, item.quantity,
              );
              if (!avail.available) {
                const resource = await txInner.resource.findUnique({ where: { id: item.resourceId }, select: { name: true } });
                throw new QuantityExceededError(resource?.name || "Nieznany", avail.remainingUnits, item.quantity);
              }
            } else {
              const { available, conflicts } = await checkAvailability(
                txInner, [item.resourceId], item.startAt, item.endAt, ["BOOKING", "BLOCK"],
              );
              if (!available) {
                throw new ConflictError(conflicts[0].resourceName, toTimelineType(conflicts[0].type));
              }
            }
          }
        },

        afterUpdate: async (txInner, _state, fullReservation) => {
          // Query items again with typed select for timeline recreation
          const items = await txInner.reservationItem.findMany({
            where: { reservationId: params.id },
            select: RESTORE_ITEM_SELECT,
          });

          const label = getTimelineLabel(fullReservation.type, fullReservation.number);
          const timelineType = toTimelineType(fullReservation.type);
          for (const item of items) {
            await createTimelineEntry(txInner, {
              type: timelineType,
              resourceId: item.resourceId,
              startAt: item.startAt,
              endAt: item.endAt,
              quantityReserved: item.categoryType === "QUANTITY_TIME" ? item.quantity : 1,
              reservationId: params.id,
              reservationItemId: item.id,
              label,
            });
          }
        },
      });
    });

    return apiSuccess(result);
  } catch (error) {
    if (error instanceof TransitionError) return apiError(error.message, error.status, error.code);
    if (error instanceof ConflictError || error instanceof QuantityExceededError) return apiError(error.message, 409, "CONFLICT");
    return apiServerError(error);
  }
}
