/**
 * Timeline Service — wspólna logika dla dostępności zasobów.
 *
 * v5.0 — Multi-Type Resources (ACCOMMODATION / TIME_SLOT / QUANTITY_TIME)
 * FK: reservationId + reservationItemId
 *
 * ZASADY:
 * 1. TimelineEntry = jedyne źródło prawdy dla dostępności
 * 2. Każde tworzenie/edycja rezerwacji MUSI przejść przez ten serwis
 * 3. ACCOMMODATION + TIME_SLOT: DB EXCLUSION CONSTRAINT (btree_gist) jest ostatnią linią obrony
 * 4. QUANTITY_TIME: SUM(quantityReserved) <= Resource.totalUnits (logika aplikacyjna)
 * 5. Daty: DateTime wszędzie (startAt/endAt). ACCOMMODATION = date + operational time (checkIn/checkOut z category override → global fallback). DST-safe via date-fns-tz.
 * 6. Ten plik NIE importuje api-response — rzuca błędy, caller je obsługuje
 */

import type { PrismaClient } from "@prisma/client";

type TxClient = Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">;

// ── Error types ──

export class ConflictError extends Error {
  public resourceName: string;
  public conflictType: "BOOKING" | "BLOCK" | "OFFER";

  constructor(resourceName: string, conflictType: "BOOKING" | "BLOCK" | "OFFER") {
    const typeLabel = conflictType === "BOOKING" ? "Rezerwacja" : conflictType === "BLOCK" ? "Blokada" : "Oferta";
    super(`Zasób "${resourceName}" jest zajęty (${typeLabel})`);
    this.name = "ConflictError";
    this.resourceName = resourceName;
    this.conflictType = conflictType;
  }
}

export class QuantityExceededError extends Error {
  public resourceName: string;
  public available: number;
  public requested: number;

  constructor(resourceName: string, available: number, requested: number) {
    super(`Zasób "${resourceName}": dostępne ${available}, żądano ${requested}`);
    this.name = "QuantityExceededError";
    this.resourceName = resourceName;
    this.available = available;
    this.requested = requested;
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

// ── Check availability (ACCOMMODATION + TIME_SLOT — exclusion 1:1) ──

export interface AvailabilityResult {
  available: boolean;
  conflicts: { resourceId: string; resourceName: string; type: string }[];
}

export interface CheckAvailabilityOptions {
  excludeReservationId?: string;
  excludeEntryId?: string;
}

/**
 * Check if resources are available in the given date range.
 * For ACCOMMODATION and TIME_SLOT only (1:1 blocking).
 * QUANTITY_TIME uses checkQuantityAvailability instead.
 */
export async function checkAvailability(
  tx: TxClient,
  resourceIds: string[],
  startAt: Date,
  endAt: Date,
  blockTypes: ("BOOKING" | "BLOCK" | "OFFER")[] = ["BOOKING", "BLOCK"],
  options?: CheckAvailabilityOptions,
): Promise<AvailabilityResult> {
  const conflicts: AvailabilityResult["conflicts"] = [];

  for (const resourceId of resourceIds) {
    const where: any = {
      resourceId,
      status: "ACTIVE",
      type: { in: blockTypes },
      startAt: { lt: endAt },
      endAt: { gt: startAt },
    };
    if (options?.excludeReservationId) where.reservationId = { not: options.excludeReservationId };
    if (options?.excludeEntryId) where.id = { not: options.excludeEntryId };

    const found = await tx.timelineEntry.findFirst({
      where,
      include: { resource: { select: { name: true } } },
    });

    if (found) {
      conflicts.push({ resourceId, resourceName: found.resource.name, type: found.type });
    }
  }

  return { available: conflicts.length === 0, conflicts };
}

// ── Check availability (QUANTITY_TIME — SUM based) ──

export interface QuantityAvailabilityResult {
  available: boolean;
  totalUnits: number;
  usedUnits: number;
  remainingUnits: number;
}

/**
 * Check if enough quantity is available for QUANTITY_TIME resources.
 * SUM(quantityReserved) for overlapping ACTIVE entries <= Resource.totalUnits
 *
 * RACE CONDITION PROTECTION:
 * Uses SELECT ... FOR UPDATE on resource row to acquire row-level lock.
 * This prevents two concurrent requests from reading the same SUM and both passing.
 * The lock is held until the transaction commits.
 */
export async function checkQuantityAvailability(
  tx: TxClient,
  resourceId: string,
  startAt: Date,
  endAt: Date,
  requestedQuantity: number,
  options?: CheckAvailabilityOptions,
): Promise<QuantityAvailabilityResult> {
  // Row-level lock on resource — prevents concurrent reads of same availability
  const locked: any[] = await tx.$queryRaw`
    SELECT "totalUnits" FROM "resources" WHERE "id" = ${resourceId} FOR UPDATE
  `;
  if (locked.length === 0) throw new ValidationError("Zasób nie istnieje");
  const totalUnits = locked[0].totalUnits as number;

  // Find overlapping active entries
  const where: any = {
    resourceId,
    status: "ACTIVE",
    startAt: { lt: endAt },
    endAt: { gt: startAt },
  };
  if (options?.excludeReservationId) where.reservationId = { not: options.excludeReservationId };

  const overlapping = await tx.timelineEntry.findMany({
    where,
    select: { quantityReserved: true },
  });

  const usedUnits = overlapping.reduce((sum, e) => sum + e.quantityReserved, 0);
  const remainingUnits = totalUnits - usedUnits;

  return {
    available: requestedQuantity <= remainingUnits,
    totalUnits,
    usedUnits,
    remainingUnits,
  };
}

// ── Create timeline entry ──

export interface CreateTimelineEntryInput {
  type: "BOOKING" | "OFFER" | "BLOCK";
  resourceId: string;
  startAt: Date;
  endAt: Date;
  quantityReserved?: number;
  reservationId?: string;
  reservationItemId?: string;
  label?: string;
  note?: string;
}

/**
 * Create a single timeline entry.
 * Caller must be inside a transaction.
 */
export async function createTimelineEntry(tx: TxClient, input: CreateTimelineEntryInput) {
  return tx.timelineEntry.create({
    data: {
      type: input.type,
      resourceId: input.resourceId,
      startAt: input.startAt,
      endAt: input.endAt,
      quantityReserved: input.quantityReserved || 1,
      reservationId: input.reservationId || null,
      reservationItemId: input.reservationItemId || null,
      label: input.label || null,
      note: input.note || null,
    },
  });
}

// ── Cancel timeline entries (soft-delete: status → CANCELLED) ──

export async function cancelTimelineEntries(
  tx: TxClient,
  filter: { reservationId?: string; reservationItemId?: string; id?: string },
) {
  const where: any = { status: "ACTIVE" };
  if (filter.reservationId) where.reservationId = filter.reservationId;
  if (filter.reservationItemId) where.reservationItemId = filter.reservationItemId;
  if (filter.id) where.id = filter.id;

  return tx.timelineEntry.updateMany({ where, data: { status: "CANCELLED" } });
}

// ── Replace reservation timeline entries (cancel + check + create — atomic) ──

/**
 * Replace all timeline entries for a reservation.
 * Supports mixed types (ACCOMMODATION items + QUANTITY_TIME items in one reservation).
 *
 * For each item:
 *   ACCOMMODATION/TIME_SLOT → checkAvailability (exclusion 1:1)
 *   QUANTITY_TIME → checkQuantityAvailability (SUM based)
 *
 * Order: CHECK first → CANCEL second → CREATE third.
 * MUST be called inside a transaction.
 */
export async function replaceReservationTimelineEntries(
  tx: TxClient,
  reservationId: string,
  entryType: "BOOKING" | "OFFER" | "BLOCK",
  items: {
    resourceId: string;
    categoryType: string;
    startAt: Date;
    endAt: Date;
    quantity?: number;
    reservationItemId?: string;
  }[],
  label: string,
  blockTypes: ("BOOKING" | "BLOCK" | "OFFER")[] = ["BOOKING", "BLOCK"],
) {
  // 1. Check availability for ALL items FIRST
  for (const item of items) {
    if (item.categoryType === "QUANTITY_TIME") {
      const qty = item.quantity || 1;
      const result = await checkQuantityAvailability(
        tx, item.resourceId, item.startAt, item.endAt, qty,
        { excludeReservationId: reservationId },
      );
      if (!result.available) {
        const resource = await tx.resource.findUnique({ where: { id: item.resourceId }, select: { name: true } });
        throw new QuantityExceededError(resource?.name || "Nieznany", result.remainingUnits, qty);
      }
    } else {
      // ACCOMMODATION or TIME_SLOT — exclusion 1:1
      const { available, conflicts } = await checkAvailability(
        tx, [item.resourceId], item.startAt, item.endAt,
        blockTypes, { excludeReservationId: reservationId },
      );
      if (!available) {
        throw new ConflictError(conflicts[0].resourceName, conflicts[0].type as any);
      }
    }
  }

  // 2. Cancel existing entries
  await cancelTimelineEntries(tx, { reservationId });

  // 3. Create new entries
  for (const item of items) {
    await createTimelineEntry(tx, {
      type: entryType,
      resourceId: item.resourceId,
      startAt: item.startAt,
      endAt: item.endAt,
      quantityReserved: item.categoryType === "QUANTITY_TIME" ? (item.quantity || 1) : 1,
      reservationId,
      reservationItemId: item.reservationItemId || undefined,
      label,
    });
  }
}

// ── Convenience: check + create for single item ──

export async function createTimelineEntryWithCheck(
  tx: TxClient,
  input: CreateTimelineEntryInput & { categoryType?: string },
  blockTypes: ("BOOKING" | "BLOCK" | "OFFER")[] = ["BOOKING", "BLOCK"],
) {
  if (input.categoryType === "QUANTITY_TIME") {
    const qty = input.quantityReserved || 1;
    const result = await checkQuantityAvailability(
      tx, input.resourceId, input.startAt, input.endAt, qty,
    );
    if (!result.available) {
      const resource = await tx.resource.findUnique({ where: { id: input.resourceId }, select: { name: true } });
      throw new QuantityExceededError(resource?.name || "Nieznany", result.remainingUnits, qty);
    }
  } else {
    const { available, conflicts } = await checkAvailability(
      tx, [input.resourceId], input.startAt, input.endAt, blockTypes,
    );
    if (!available) {
      throw new ConflictError(conflicts[0].resourceName, conflicts[0].type as any);
    }
  }
  return createTimelineEntry(tx, input);
}
