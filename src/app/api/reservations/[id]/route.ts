/**
 * GET   /api/reservations/[id] — Reservation detail
 * PATCH /api/reservations/[id] — Edit DATA only (dates, items, guests, notes)
 *
 * v5.0 — ReservationItem + multi-type resources
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, apiNotFound, apiServerError } from "@/lib/api-response";
import { nightsBetween } from "@/lib/dates";
import {
  resolveOperationalTimes,
  combineDateAndTime,
  toDateStr as toDateStrOT,
} from "@/lib/operational-times";
import {
  cancelTimelineEntries,
  createTimelineEntry,
  checkAvailability,
  checkQuantityAvailability,
  ValidationError,
  ConflictError,
  QuantityExceededError,
} from "@/lib/timeline-service";
import {
  validateReservationEdit,
  getBlockTypesForType,
  getTimelineLabel,
} from "@/lib/reservation-validation";
import { recalculateFinancialProjection } from "@/lib/payment-service";

// ── Helpers ──

function toDateStr(d: Date | string): string {
  if (typeof d === "string") {
    if (!d.includes("T")) return d;
    const dt = new Date(d);
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
  }
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// ── Shared includes ──

const fullInclude = {
  client: true,
  items: {
    include: {
      resource: {
        select: {
          id: true, name: true, unitNumber: true, maxCapacity: true, totalUnits: true,
          category: { select: { name: true, slug: true, type: true } },
        },
      },
    },
    orderBy: { sortOrder: "asc" as const },
  },
  addons: {
    include: { addon: { select: { id: true, name: true, pricingType: true } } },
    orderBy: { sortOrder: "asc" as const },
  },
  offerDetails: true,
  bookingDetails: true,
  statusLogs: { orderBy: { createdAt: "desc" as const }, take: 50 },
  notes: {
    include: { user: { select: { id: true, firstName: true, lastName: true } } },
    orderBy: { createdAt: "desc" as const },
  },
  timelineEntries: { where: { status: "ACTIVE" as const } },
};

// ══════════════════════════════════════════════════════════════════════
// GET — Reservation detail
// ══════════════════════════════════════════════════════════════════════

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const reservation = await prisma.reservation.findUnique({
      where: { id: params.id },
      include: fullInclude,
    });
    if (!reservation) return apiNotFound("Rezerwacja nie znaleziona");
    return apiSuccess({ reservation });
  } catch (error) {
    return apiServerError(error);
  }
}

// ══════════════════════════════════════════════════════════════════════
// PATCH — Edit DATA only (no status changes)
// ══════════════════════════════════════════════════════════════════════

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();

    const validation = validateReservationEdit(body);
    if (!validation.valid) return apiError(validation.errors.join("; "));

    if (body.status) {
      return apiError("Zmiana statusu nie jest dostępna przez PATCH. Użyj: POST /confirm, /cancel, /convert", 400, "VALIDATION");
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. FETCH current
      const current = await tx.reservation.findUnique({
        where: { id: params.id },
        include: { items: true, bookingDetails: true },
      });
      if (!current) throw new ValidationError("Rezerwacja nie znaleziona");
      if (current.status === "CANCELLED") throw new ValidationError("Nie można edytować anulowanej rezerwacji");
      if (current.status === "EXPIRED") throw new ValidationError("Nie można edytować wygasłej rezerwacji");

      // Accept both items[] and resources[] (backward compat)
      const rawItems = body.items || body.resources;
      const isDateOrItemChange = body.checkIn || body.checkOut || rawItems;

      // Soft lock
      if (current.status === "CONFIRMED" && isDateOrItemChange && !body.force) {
        throw new ValidationError("Rezerwacja jest potwierdzona. Aby zmienić daty lub zasoby, wyślij force: true");
      }

      // 2. DETERMINE changes
      const oldCheckIn = toDateStr(current.checkIn);
      const oldCheckOut = toDateStr(current.checkOut);
      const newCheckIn = body.checkIn || oldCheckIn;
      const newCheckOut = body.checkOut || oldCheckOut;
      const datesChanged = newCheckIn !== oldCheckIn || newCheckOut !== oldCheckOut;

      const currentResourceIds = current.items.map(r => r.resourceId).sort();
      const newResourceIds = rawItems?.map((r: any) => r.resourceId).sort() || currentResourceIds;
      const resourceIdsChanged = JSON.stringify(currentResourceIds) !== JSON.stringify(newResourceIds);
      const timelineChanged = datesChanged || resourceIdsChanged;
      // Items replacement cascades-deletes timeline entries, so always rebuild
      const needsTimelineRebuild = timelineChanged || !!rawItems;

      const nights = nightsBetween(newCheckIn, newCheckOut);
      if (nights < 1 && datesChanged) throw new ValidationError("Data wyjazdu musi być po dacie przyjazdu");

      // D 159-162: Resolve operational times per category
      const allResourceIds = [
        ...(rawItems?.map((r: any) => r.resourceId) || []),
        ...current.items.map(r => r.resourceId),
      ].filter(Boolean);
      const resourcesForTimes = await tx.resource.findMany({
        where: { id: { in: [...new Set(allResourceIds)] } },
        select: { id: true, categoryId: true, category: { select: { type: true } } },
      });
      const resourceMapPatch = new Map(resourcesForTimes.map((r: any) => [r.id, r]));

      const timesCachePatch = new Map<string, { checkInTime: string; checkOutTime: string }>();
      async function getTimesForCat(catId: string) {
        if (timesCachePatch.has(catId)) return timesCachePatch.get(catId)!;
        const t = await resolveOperationalTimes(tx, catId);
        timesCachePatch.set(catId, t);
        return t;
      }

      async function resolveItemDatesPatch(resourceId: string, categoryType: string, rawStartAt: any, rawEndAt: any) {
        if (rawStartAt && rawEndAt) {
          return { startAt: new Date(rawStartAt), endAt: new Date(rawEndAt) };
        }
        const res = resourceMapPatch.get(resourceId);
        if (categoryType === "ACCOMMODATION" && res?.categoryId) {
          const times = await getTimesForCat(res.categoryId);
          return {
            startAt: combineDateAndTime(newCheckIn, times.checkInTime),
            endAt: combineDateAndTime(newCheckOut, times.checkOutTime),
          };
        }
        return { startAt: new Date(newCheckIn), endAt: new Date(newCheckOut) };
      }

      // 3. CANCEL old timeline entries (if rebuild needed)
      if (needsTimelineRebuild) {
        await cancelTimelineEntries(tx, { reservationId: params.id });
      }

      // 4. REPLACE ReservationItems (if items provided) — collect new IDs
      let newItems: any[] = [];
      if (rawItems) {
        await tx.reservationItem.deleteMany({ where: { reservationId: params.id } });
        for (let i = 0; i < rawItems.length; i++) {
          const r = rawItems[i];
          const pricePerUnitMinor = Number(r.pricePerNight || r.pricePerUnit || 0);
          const totalPriceMinor = r.pricePerStay
            ? Number(r.pricePerStay)
            : pricePerUnitMinor * nights * Number(r.quantity || 1);
          const catType = r.categoryType || resourceMapPatch.get(r.resourceId)?.category?.type || "ACCOMMODATION";
          const { startAt, endAt } = await resolveItemDatesPatch(r.resourceId, catType, r.startAt, r.endAt);
          const created = await tx.reservationItem.create({
            data: {
              reservationId: params.id,
              resourceId: r.resourceId,
              categoryType: catType,
              startAt,
              endAt,
              quantity: Number(r.quantity || 1),
              pricePerUnitMinor,
              totalPriceMinor,
              pricePerUnit: pricePerUnitMinor / 100,
              totalPrice: totalPriceMinor / 100,
              adults: Number(r.adults || 0),
              children: Number(r.children || 0),
              capacityOverride: Boolean(r.capacityOverride),
              sortOrder: i,
            },
          });
          newItems.push(created);
        }
      }

      // 5. CHECK availability + CREATE timeline entries with reservationItemId
      if (needsTimelineRebuild) {
        const blockTypes = getBlockTypesForType(current.type);
        const label = getTimelineLabel(current.type, current.number);

        // Determine items source: new items from step 4, or existing items with new dates
        const itemsForTimelinePromises = rawItems
          ? newItems.map((item) => Promise.resolve({
              resourceId: item.resourceId,
              categoryType: item.categoryType,
              startAt: item.startAt,
              endAt: item.endAt,
              quantity: item.quantity,
              reservationItemId: item.id,
            }))
          : current.items.map(async (item) => {
              // D 159-162: resolve operational times for existing items on date change
              const { startAt, endAt } = await resolveItemDatesPatch(
                item.resourceId, item.categoryType, null, null
              );
              return {
                resourceId: item.resourceId,
                categoryType: item.categoryType,
                startAt,
                endAt,
                quantity: item.quantity,
                reservationItemId: item.id,
              };
            });
        const itemsForTimeline = await Promise.all(itemsForTimelinePromises);

        // Check availability for each item
        for (const item of itemsForTimeline) {
          if (item.categoryType === "QUANTITY_TIME") {
            const qty = item.quantity || 1;
            const qtyResult = await checkQuantityAvailability(
              tx, item.resourceId, item.startAt, item.endAt, qty,
              { excludeReservationId: params.id },
            );
            if (!qtyResult.available) {
              const resource = await tx.resource.findUnique({ where: { id: item.resourceId }, select: { name: true } });
              throw new QuantityExceededError(resource?.name || "Nieznany", qtyResult.remainingUnits, qty);
            }
          } else {
            const { available, conflicts } = await checkAvailability(
              tx, [item.resourceId], item.startAt, item.endAt,
              blockTypes, { excludeReservationId: params.id },
            );
            if (!available) {
              throw new ConflictError(conflicts[0].resourceName, conflicts[0].type as any);
            }
          }
        }

        // Create new timeline entries — already with correct reservationItemId
        for (const item of itemsForTimeline) {
          await createTimelineEntry(tx, {
            type: current.type as "BOOKING" | "OFFER" | "BLOCK",
            resourceId: item.resourceId,
            startAt: item.startAt,
            endAt: item.endAt,
            quantityReserved: item.categoryType === "QUANTITY_TIME" ? (item.quantity || 1) : 1,
            reservationId: params.id,
            reservationItemId: item.reservationItemId,
            label,
          });
        }

        // D 159-162: Update existing ReservationItem dates when dates change (no rawItems)
        if (!rawItems && datesChanged) {
          for (const item of itemsForTimeline) {
            await tx.reservationItem.update({
              where: { id: item.reservationItemId },
              data: { startAt: item.startAt, endAt: item.endAt },
            });
          }
        }
      }

      // 6. REPLACE addons (if provided)
      // Use newItems from step 4 for resourceId → reservationItemId mapping
      const itemsForMapping = newItems.length > 0 ? newItems : await tx.reservationItem.findMany({
        where: { reservationId: params.id },
        orderBy: { sortOrder: "asc" },
      });

      if (body.addons !== undefined) {
        await tx.reservationAddon.deleteMany({ where: { reservationId: params.id } });

        if (body.addons && body.addons.length > 0) {
          for (let i = 0; i < body.addons.length; i++) {
            const a = body.addons[i];
            let reservationItemId = null;
            if (a.resourceId) {
              const match = itemsForMapping.find((item: any) =>
                item.resourceId === a.resourceId && (a.sortOrder === undefined || item.sortOrder === a.sortOrder)
              );
              if (match) reservationItemId = match.id;
            }
            const snapshotPriceMinor = Number(a.snapshotPrice || 0);
            const unitPriceMinor = Number(a.unitPrice || 0);
            const addonTotalMinor = Number(a.total || 0);
            await tx.reservationAddon.create({
              data: {
                reservationId: params.id,
                reservationItemId,
                addonId: a.addonId,
                snapshotName: a.snapshotName || "",
                snapshotPriceMinor,
                snapshotPrice: snapshotPriceMinor / 100,
                snapshotPricingType: a.snapshotPricingType || "PER_BOOKING",
                quantity: Number(a.quantity || 1),
                unitPriceMinor,
                unitPrice: unitPriceMinor / 100,
                calcPersons: Number(a.calcPersons || 1),
                calcNights: Number(a.calcNights || 1),
                calcQuantity: Number(a.calcQuantity || a.quantity || 1),
                totalMinor: addonTotalMinor,
                total: addonTotalMinor / 100,
                sortOrder: i,
              },
            });
          }
        }
      }

      // 7. RECALCULATE totals — all in minor units
      if (rawItems || body.addons !== undefined) {
        const currentItemsForTotals = await tx.reservationItem.findMany({ where: { reservationId: params.id } });
        const resourcesSubtotalMinor = currentItemsForTotals.reduce((s, item) => s + item.totalPriceMinor, 0);

        const currentAddons = await tx.reservationAddon.findMany({ where: { reservationId: params.id } });
        const addonsTotalMinor = currentAddons.reduce((s, a) => s + a.totalMinor, 0);

        const discountMinor = Number(body.discount ?? current.discountMinor ?? 0);
        const subtotalMinor = resourcesSubtotalMinor + addonsTotalMinor;
        const totalMinor = Math.max(0, subtotalMinor - discountMinor);

        await tx.reservation.update({
          where: { id: params.id },
          data: {
            subtotalMinor, discountMinor, totalMinor,
            subtotal: subtotalMinor / 100, discount: discountMinor / 100, total: totalMinor / 100,
          },
        });

        if (current.bookingDetails) {
          // C1b: Use centralized recalc (accounts for all CONFIRMED payments)
          await recalculateFinancialProjection(tx, params.id);
        }
      }

      // 8. UPDATE core fields
      const updateData: any = {};
      if (body.clientId) updateData.clientId = body.clientId;
      if (body.checkIn) { updateData.checkIn = new Date(body.checkIn); updateData.nights = nights; }
      if (body.checkOut) { updateData.checkOut = new Date(body.checkOut); updateData.nights = nights; }
      if (body.adults !== undefined) updateData.adults = body.adults;
      if (body.children !== undefined) updateData.children = body.children;
      if (body.source) updateData.source = body.source;
      if (body.guestNotes !== undefined) updateData.guestNotes = body.guestNotes;
      if (body.internalNotes !== undefined) updateData.internalNotes = body.internalNotes;
      if (body.requiresAttention !== undefined) updateData.requiresAttention = body.requiresAttention;
      if (body.assignedUserId !== undefined) updateData.assignedUserId = body.assignedUserId || null;

      const updated = await tx.reservation.update({
        where: { id: params.id },
        data: updateData,
        include: fullInclude,
      });

      // 9. STATUS LOG
      if (needsTimelineRebuild) {
        await tx.reservationStatusLog.create({
          data: {
            reservationId: params.id,
            fromStatus: current.status,
            toStatus: current.status,
            action: "EDITED",
            changedBy: "ADMIN",
            note: timelineChanged ? "Zmieniono daty/zasoby" : "Zmieniono dane rezerwacji",
          },
        });
      }

      return {
        reservation: updated,
        timelineChanged: needsTimelineRebuild,
        oldRange: needsTimelineRebuild ? { checkIn: oldCheckIn, checkOut: oldCheckOut } : null,
        newRange: needsTimelineRebuild ? { checkIn: newCheckIn, checkOut: newCheckOut } : null,
      };
    });

    return apiSuccess(result);
  } catch (error) {
    if (error instanceof ConflictError || error instanceof QuantityExceededError) {
      return apiError(error.message, 409, "CONFLICT");
    }
    return apiServerError(error);
  }
}
