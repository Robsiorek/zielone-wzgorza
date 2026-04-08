/**
 * POST /api/reservations/[id]/convert
 *
 * Two explicit flows:
 *   1. OFFER -> BOOKING  (existing)
 *   2. BLOCK -> BOOKING or OFFER  (new, requires body.targetType + body.clientId)
 *
 * Both flows run in a single DB transaction with SELECT FOR UPDATE lock.
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, apiServerError } from "@/lib/api-response";
import { generateSecureToken } from "@/lib/crypto";
import { calculateRequiredDeposit } from "@/lib/payment-service";
import {
  checkAvailability,
  checkQuantityAvailability,
  cancelTimelineEntries,
  createTimelineEntry,
  ConflictError,
  QuantityExceededError,
  ValidationError,
} from "@/lib/timeline-service";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json().catch(() => ({}));

    const result = await prisma.$transaction(async (tx) => {
      // Lock the reservation row to prevent double convert
      const locked: any[] = await tx.$queryRaw`
        SELECT * FROM "reservations" WHERE "id" = ${params.id} FOR UPDATE
      `;
      if (locked.length === 0) throw new ValidationError("Rezerwacja nie znaleziona");

      const reservation = await tx.reservation.findUnique({
        where: { id: params.id },
        include: { items: true, offerDetails: true, bookingDetails: true },
      });
      if (!reservation) throw new ValidationError("Rezerwacja nie znaleziona");

      // ---- FLOW 1: OFFER -> BOOKING ----
      if (reservation.type === "OFFER") {
        return await convertOfferToBooking(tx, reservation, params.id);
      }

      // ---- FLOW 2: BLOCK -> BOOKING or OFFER ----
      if (reservation.type === "BLOCK") {
        return await convertBlockToReservation(tx, reservation, params.id, body);
      }

      // Idempotency: already a BOOKING
      if (reservation.type === "BOOKING") {
        return { reservation, converted: false, message: "Już jest rezerwacją" };
      }

      throw new ValidationError("Typ " + reservation.type + " nie może być konwertowany");
    });

    return apiSuccess(result);
  } catch (error) {
    if (error instanceof ConflictError || error instanceof QuantityExceededError) {
      return apiError(error.message, 409, "CONFLICT");
    }
    return apiServerError(error);
  }
}

// ════════════════════════════════════════════════════════════
// OFFER -> BOOKING
// ════════════════════════════════════════════════════════════

async function convertOfferToBooking(tx: any, reservation: any, id: string) {
  if (reservation.status !== "PENDING" && reservation.status !== "CONFIRMED") {
    throw new ValidationError("Oferta ma status " + reservation.status + " -- konwersja wymaga PENDING lub CONFIRMED");
  }
  if (reservation.offerDetails?.expiresAt && new Date(reservation.offerDetails.expiresAt) < new Date()) {
    throw new ValidationError("Oferta wygasła -- nie można konwertować");
  }

  for (const item of reservation.items) {
    await checkItemAvailability(tx, item, id);
  }

  const year = new Date().getFullYear();
  const numResult: any[] = await tx.$queryRaw`SELECT nextval('reservation_number_seq') as num`;
  const bookingNumber = "ZW-" + year + "-" + String(Number(numResult[0].num)).padStart(4, "0");
  const oldNumber = reservation.number;

  const updated = await tx.reservation.update({
    where: { id },
    data: { type: "BOOKING", status: "CONFIRMED", number: bookingNumber },
    include: {
      client: true,
      items: { include: { resource: { select: { id: true, name: true, unitNumber: true, category: { select: { name: true, slug: true, type: true } } } } } },
      offerDetails: true,
      bookingDetails: true,
    },
  });

  await tx.bookingDetails.upsert({
    where: { reservationId: id },
    create: {
      reservationId: id, confirmedAt: new Date(),
      paidAmountMinor: 0, paidAmount: 0,
      balanceDueMinor: reservation.totalMinor, balanceDue: reservation.totalMinor / 100,
    },
    update: { confirmedAt: new Date() },
  });

  // C1b: Snapshot requiredDepositMinor
  const settings = await tx.companySettings.findFirst({ select: { requiredDepositPercent: true } });
  const depositPercent = settings?.requiredDepositPercent ?? 30;
  const depositMinor = calculateRequiredDeposit(reservation.totalMinor, depositPercent);
  await tx.reservation.update({
    where: { id },
    data: {
      requiredDepositMinor: depositMinor,
      requiredDepositRuleSnapshot: { percent: depositPercent, totalMinor: reservation.totalMinor },
    },
  });

  if (reservation.offerDetails) {
    await tx.offerDetails.update({ where: { reservationId: id }, data: { acceptedAt: new Date() } });
  }

  await cancelTimelineEntries(tx, { reservationId: id });
  for (const item of reservation.items) {
    await createTimelineEntry(tx, {
      type: "BOOKING",
      resourceId: item.resourceId,
      startAt: item.startAt,
      endAt: item.endAt,
      quantityReserved: item.categoryType === "QUANTITY_TIME" ? item.quantity : 1,
      reservationId: id,
      reservationItemId: item.id,
      label: "Rezerwacja " + bookingNumber,
    });
  }

  await tx.reservationStatusLog.create({
    data: {
      reservationId: id,
      fromStatus: reservation.status,
      toStatus: "CONFIRMED",
      fromType: "OFFER",
      toType: "BOOKING",
      action: "CONVERTED",
      changedBy: "ADMIN",
      note: "Oferta " + oldNumber + " skonwertowana na rezerwację " + bookingNumber,
      metadata: { oldNumber, newNumber: bookingNumber, oldType: "OFFER", newType: "BOOKING" },
    },
  });

  return { reservation: updated, converted: true, flow: "OFFER_TO_BOOKING", oldNumber, newNumber: bookingNumber };
}

// ════════════════════════════════════════════════════════════
// BLOCK -> BOOKING or OFFER
// ════════════════════════════════════════════════════════════

async function convertBlockToReservation(tx: any, reservation: any, id: string, body: any) {
  if (reservation.status === "CANCELLED") {
    throw new ValidationError("Blokada jest anulowana -- nie można konwertować");
  }

  const targetType = body.targetType;
  if (targetType !== "BOOKING" && targetType !== "OFFER") {
    throw new ValidationError("Wymagane pole targetType: BOOKING lub OFFER");
  }
  if (!body.clientId) {
    throw new ValidationError("Wymagany klient (clientId)");
  }

  const client = await tx.client.findUnique({ where: { id: body.clientId } });
  if (!client) throw new ValidationError("Klient nie znaleziony");

  // Items: from body or inherit from block
  const newItems = body.items && body.items.length > 0
    ? body.items
    : reservation.items.map((item: any) => ({
        resourceId: item.resourceId,
        categoryType: item.categoryType,
        startAt: item.startAt,
        endAt: item.endAt,
        quantity: item.quantity,
        adults: item.adults || body.adults || 2,
        children: item.children || body.children || 0,
        pricePerUnit: item.pricePerUnit || 0,
        totalPrice: item.totalPrice || 0,
      }));

  if (newItems.length === 0) throw new ValidationError("Brak pozycji (items)");

  // Availability check (exclude current block)
  for (const item of newItems) {
    const itemData = { ...item, startAt: new Date(item.startAt), endAt: new Date(item.endAt) };
    if (item.categoryType === "QUANTITY_TIME") {
      const result = await checkQuantityAvailability(
        tx, item.resourceId, itemData.startAt, itemData.endAt, item.quantity,
        { excludeReservationId: id },
      );
      if (!result.available) {
        const resource = await tx.resource.findUnique({ where: { id: item.resourceId }, select: { name: true } });
        throw new QuantityExceededError(resource?.name || "Zasób", result.remainingUnits, item.quantity);
      }
    } else {
      const { available, conflicts } = await checkAvailability(
        tx, [item.resourceId], itemData.startAt, itemData.endAt,
        ["BOOKING", "BLOCK"], { excludeReservationId: id },
      );
      if (!available) throw new ConflictError(conflicts[0].resourceName, conflicts[0].type as any);
    }
  }

  // Generate number
  const year = new Date().getFullYear();
  const numResult: any[] = await tx.$queryRaw`SELECT nextval('reservation_number_seq') as num`;
  const seqNum = String(Number(numResult[0].num)).padStart(4, "0");
  const newNumber = targetType === "BOOKING"
    ? "ZW-" + year + "-" + seqNum
    : "OF-" + year + "-" + seqNum;
  const oldNumber = reservation.number;

  // Calculate dates from items
  const allStarts = newItems.map((i: any) => new Date(i.startAt).getTime());
  const allEnds = newItems.map((i: any) => new Date(i.endAt).getTime());
  const checkIn = new Date(Math.min(...allStarts));
  const checkOut = new Date(Math.max(...allEnds));
  const nights = Math.round((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
  const subtotalMinor = Number(body.subtotal || 0);
  const discountMinor = Number(body.discount || 0);
  const totalMinor = Number(body.total || subtotalMinor - discountMinor);

  // C1b: Snapshot requiredDepositMinor for BOOKING
  let blockDepositMinor = 0;
  let blockDepositRule = null;
  if (targetType === "BOOKING" && totalMinor > 0) {
    const settings = await tx.companySettings.findFirst({ select: { requiredDepositPercent: true } });
    const depositPercent = settings?.requiredDepositPercent ?? 30;
    blockDepositMinor = calculateRequiredDeposit(totalMinor, depositPercent);
    blockDepositRule = { percent: depositPercent, totalMinor };
  }

  // 1. Create new reservation FIRST (if this fails, block stays intact)
  const newReservation = await tx.reservation.create({
    data: {
      number: newNumber,
      type: targetType,
      status: targetType === "BOOKING" ? (body.status || "PENDING") : "PENDING",
      clientId: body.clientId,
      propertyId: reservation.propertyId,
      checkIn,
      checkOut,
      nights,
      adults: body.adults || 2,
      children: body.children || 0,
      subtotalMinor, discountMinor, totalMinor,
      subtotal: subtotalMinor / 100, discount: discountMinor / 100, total: totalMinor / 100,
      requiredDepositMinor: blockDepositMinor,
      requiredDepositRuleSnapshot: blockDepositRule || undefined,
      source: body.source || "PHONE",
      guestNotes: body.guestNotes || null,
      internalNotes: body.internalNotes || reservation.internalNotes || null,
      paymentStatus: "UNPAID",
      items: {
        create: newItems.map((item: any, idx: number) => {
          const ppuMinor = Number(item.pricePerUnit || 0);
          const tpMinor = Number(item.totalPrice || 0);
          return {
            resourceId: item.resourceId,
            categoryType: item.categoryType,
            startAt: new Date(item.startAt),
            endAt: new Date(item.endAt),
            quantity: item.quantity || 1,
            adults: item.adults || body.adults || 2,
            children: item.children || body.children || 0,
            pricePerUnitMinor: ppuMinor, pricePerUnit: ppuMinor / 100,
            totalPriceMinor: tpMinor, totalPrice: tpMinor / 100,
            sortOrder: idx,
          };
        }),
      },
      bookingDetails: targetType === "BOOKING" ? {
        create: {
          paidAmountMinor: 0, paidAmount: 0,
          balanceDueMinor: totalMinor, balanceDue: totalMinor / 100,
        },
      } : undefined,
      offerDetails: targetType === "OFFER" ? {
        create: {
          token: generateSecureToken(),
          expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
        },
      } : undefined,
    },
    include: {
      client: true,
      items: { include: { resource: { select: { id: true, name: true, unitNumber: true, category: { select: { name: true, slug: true, type: true } } } } } },
      bookingDetails: true,
      offerDetails: true,
    },
  });

  // 2. Create timeline entries for new reservation
  for (const item of newReservation.items) {
    await createTimelineEntry(tx, {
      type: targetType,
      resourceId: item.resourceId,
      startAt: item.startAt,
      endAt: item.endAt,
      quantityReserved: item.categoryType === "QUANTITY_TIME" ? item.quantity : 1,
      reservationId: newReservation.id,
      reservationItemId: item.id,
      label: (targetType === "BOOKING" ? "Rezerwacja " : "Oferta ") + newNumber,
    });
  }

  // 3. Log new reservation creation
  await tx.reservationStatusLog.create({
    data: {
      reservationId: newReservation.id,
      fromStatus: "PENDING",
      toStatus: newReservation.status,
      action: "CREATED",
      changedBy: "ADMIN",
      note: "Utworzono z blokady " + oldNumber,
      metadata: { sourceBlockId: id, sourceBlockNumber: oldNumber },
    },
  });

  // 4. Cancel block timeline entries (AFTER new reservation exists)
  await cancelTimelineEntries(tx, { reservationId: id });

  // 5. Mark block as CANCELLED
  await tx.reservation.update({
    where: { id },
    data: { status: "CANCELLED" },
  });

  // 6. Log block cancellation
  await tx.reservationStatusLog.create({
    data: {
      reservationId: id,
      fromStatus: reservation.status,
      toStatus: "CANCELLED",
      action: "CONVERTED",
      changedBy: "ADMIN",
      note: "Blokada " + oldNumber + " zamieniona na " + (targetType === "BOOKING" ? "rezerwację" : "ofertę") + " " + newNumber,
      metadata: { reason: "block_conversion", targetNumber: newNumber },
    },
  });

  return {
    reservation: newReservation,
    converted: true,
    flow: "BLOCK_TO_" + targetType,
    cancelledBlockId: id,
    cancelledBlockNumber: oldNumber,
    newNumber,
  };
}

// ════════════════════════════════════════════════════════════
// Shared helper
// ════════════════════════════════════════════════════════════

async function checkItemAvailability(tx: any, item: any, excludeReservationId: string) {
  if (item.categoryType === "QUANTITY_TIME") {
    const result = await checkQuantityAvailability(
      tx, item.resourceId, item.startAt, item.endAt, item.quantity,
      { excludeReservationId },
    );
    if (!result.available) {
      const resource = await tx.resource.findUnique({ where: { id: item.resourceId }, select: { name: true } });
      throw new QuantityExceededError(resource?.name || "Zasób", result.remainingUnits, item.quantity);
    }
  } else {
    const { available, conflicts } = await checkAvailability(
      tx, [item.resourceId], item.startAt, item.endAt,
      ["BOOKING", "BLOCK"], { excludeReservationId },
    );
    if (!available) throw new ConflictError(conflicts[0].resourceName, conflicts[0].type as any);
  }
}
