/**
 * POST /api/reservations — Create reservation (BOOKING, OFFER, or BLOCK)
 * GET  /api/reservations — List reservations with filters
 *
 * v5.0 — ReservationItem + multi-type resources
 *
 * POST body accepts items[] (or resources[] for backward compat).
 * Each item creates a ReservationItem + TimelineEntry.
 * Availability check per categoryType: ACCOMMODATION/TIME_SLOT = exclusion, QUANTITY_TIME = SUM.
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, apiServerError } from "@/lib/api-response";
import { nightsBetween } from "@/lib/dates";
import {
  resolveOperationalTimes,
  combineDateAndTime,
  toDateStr as toDateStrOT,
} from "@/lib/operational-times";
import {
  checkAvailability,
  checkQuantityAvailability,
  createTimelineEntry,
  ConflictError,
  QuantityExceededError,
} from "@/lib/timeline-service";
import { calculateReservationTotals } from "@/lib/pricing-service";
import { withLegacySync } from "@/lib/format";
import { calculateRequiredDeposit } from "@/lib/payment-service";
import {
  validateReservationCreate,
  getBlockTypesForType,
  getTimelineLabel,
  getNumberPrefix,
} from "@/lib/reservation-validation";
import { generateSecureToken, hashPin } from "@/lib/crypto";

// ── Number generation ──

async function generateReservationNumber(tx: any, prefix: string): Promise<string> {
  const year = new Date().getFullYear();
  const result: any[] = await tx.$queryRaw`SELECT nextval('reservation_number_seq') as num`;
  const num = Number(result[0].num);
  return `${prefix}-${year}-${String(num).padStart(4, "0")}`;
}

// ── Shared includes for response ──

const reservationInclude = {
  client: {
    select: {
      id: true, firstName: true, lastName: true,
      companyName: true, email: true, phone: true,
      type: true, clientNumber: true,
    },
  },
  items: {
    include: {
      resource: {
        select: {
          id: true, name: true, unitNumber: true,
          category: { select: { name: true, slug: true, type: true } },
        },
      },
    },
    orderBy: { sortOrder: "asc" as const },
  },
  offerDetails: true,
  bookingDetails: true,
};

// ══════════════════════════════════════════════════════════════════════
// POST — Create reservation (atomic: items + availability + timeline)
// ══════════════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 1. Validate input
    const validation = validateReservationCreate(body);
    if (!validation.valid) return apiError(validation.errors.join("; "));

    const type = body.type as "BOOKING" | "OFFER" | "BLOCK";

    // Accept both items[] and resources[] (backward compat)
    const rawItems: any[] = body.items || body.resources || [];

    // Parse dates — use item-level dates if provided, fall back to reservation-level
    const checkIn = new Date(body.checkIn);
    const checkOut = new Date(body.checkOut);
    const nights = nightsBetween(body.checkIn, body.checkOut);

    // 2. Transaction: check availability + create reservation + items + timeline
    const reservation = await prisma.$transaction(async (tx) => {
      const blockTypes = getBlockTypesForType(type);

      // D 159-162: Resolve operational times per category (ACCOMMODATION only)
      // Load resources to get categoryId, then resolve times with category override → global fallback
      const resourceIds = rawItems.map((r: any) => r.resourceId).filter(Boolean);
      const resources = await tx.resource.findMany({
        where: { id: { in: resourceIds } },
        select: { id: true, categoryId: true, category: { select: { type: true } } },
      });
      const resourceMap = new Map(resources.map((r: any) => [r.id, r]));

      // Cache resolved times per categoryId to avoid duplicate queries
      const timesCache = new Map<string, { checkInTime: string; checkOutTime: string }>();
      async function getTimesForCategory(categoryId: string) {
        if (timesCache.has(categoryId)) return timesCache.get(categoryId)!;
        const times = await resolveOperationalTimes(tx, categoryId);
        timesCache.set(categoryId, times);
        return times;
      }

      // Build resolved startAt/endAt per item
      const checkInDateStr = toDateStrOT(checkIn);
      const checkOutDateStr = toDateStrOT(checkOut);

      async function resolveItemDates(item: any) {
        // If item provides explicit startAt/endAt, use them as-is
        if (item.startAt && item.endAt) {
          return { startAt: new Date(item.startAt), endAt: new Date(item.endAt) };
        }
        const resource = resourceMap.get(item.resourceId);
        const categoryType = item.categoryType || resource?.category?.type || "ACCOMMODATION";

        // Only ACCOMMODATION gets operational times
        if (categoryType === "ACCOMMODATION" && resource?.categoryId) {
          const times = await getTimesForCategory(resource.categoryId);
          const itemCheckInDate = item.startAt ? toDateStrOT(new Date(item.startAt)) : checkInDateStr;
          const itemCheckOutDate = item.endAt ? toDateStrOT(new Date(item.endAt)) : checkOutDateStr;
          return {
            startAt: combineDateAndTime(itemCheckInDate, times.checkInTime),
            endAt: combineDateAndTime(itemCheckOutDate, times.checkOutTime),
          };
        }

        // TIME_SLOT / QUANTITY_TIME — fallback to raw checkIn/checkOut
        return { startAt: checkIn, endAt: checkOut };
      }

      // Check availability per item
      for (const item of rawItems) {
        const { startAt: itemStart, endAt: itemEnd } = await resolveItemDates(item);
        const categoryType = item.categoryType || resourceMap.get(item.resourceId)?.category?.type || "ACCOMMODATION";

        if (categoryType === "QUANTITY_TIME") {
          const qty = Number(item.quantity || 1);
          const result = await checkQuantityAvailability(tx, item.resourceId, itemStart, itemEnd, qty);
          if (!result.available) {
            const resource = await tx.resource.findUnique({ where: { id: item.resourceId }, select: { name: true } });
            throw new QuantityExceededError(resource?.name || "Nieznany", result.remainingUnits, qty);
          }
        } else {
          const { available, conflicts } = await checkAvailability(
            tx, [item.resourceId], itemStart, itemEnd, blockTypes,
          );
          if (!available) throw new ConflictError(conflicts[0].resourceName, conflicts[0].type as any);
        }
      }

      // Generate number
      const prefix = getNumberPrefix(type);
      const number = await generateReservationNumber(tx, prefix);

      // Calculate totals from items — ALL in minor units (grosze)
      // Frontend sends pricePerNight/pricePerUnit already in grosze
      const resourceInputs = rawItems.map((r: any) => ({
        pricePerNightMinor: Number(r.pricePerNight || r.pricePerUnit || 0),
        pricePerStayMinor: r.pricePerStay ? Number(r.pricePerStay) : null,
        nights,
      }));
      const addonsTotalMinor = (body.addons || []).reduce((s: number, a: any) => s + Number(a.total || 0), 0);
      const totals = calculateReservationTotals(resourceInputs, [], Number(body.discount || 0));
      // Override with actual addon totals
      totals.subtotalMinor += addonsTotalMinor;
      totals.totalMinor += addonsTotalMinor;

      // Determine initial status
      let initialStatus: "PENDING" | "CONFIRMED" = "PENDING";
      if (type === "BOOKING") initialStatus = (body.status === "PENDING") ? "PENDING" : "CONFIRMED";
      else if (type === "BLOCK") initialStatus = "CONFIRMED";

      // Build item data — prices in minor units + resolved operational times
      const itemDataPromises = rawItems.map(async (r: any, i: number) => {
        const pricePerUnitMinor = Number(r.pricePerNight || r.pricePerUnit || 0);
        const totalPriceMinor = r.pricePerStay
          ? Number(r.pricePerStay)
          : pricePerUnitMinor * nights * Number(r.quantity || 1);
        const { startAt, endAt } = await resolveItemDates(r);
        return {
          resourceId: r.resourceId,
          categoryType: r.categoryType || resourceMap.get(r.resourceId)?.category?.type || "ACCOMMODATION",
          startAt,
          endAt,
          quantity: Number(r.quantity || 1),
          pricePerUnitMinor,
          totalPriceMinor,
          // Legacy sync
          pricePerUnit: pricePerUnitMinor / 100,
          totalPrice: totalPriceMinor / 100,
          adults: Number(r.adults || 0),
          children: Number(r.children || 0),
          capacityOverride: Boolean(r.capacityOverride),
          sortOrder: i,
        };
      });
      const itemData = await Promise.all(itemDataPromises);

      // Reservation financial data — minor units + legacy sync
      const reservationFinancials = withLegacySync({
        subtotalMinor: totals.subtotalMinor,
        discountMinor: totals.discountMinor,
        totalMinor: totals.totalMinor,
      });

      // C1b: Snapshot requiredDepositMinor from CompanySettings (9.7)
      let requiredDepositMinor = 0;
      let requiredDepositRuleSnapshot = null;
      if (type === "BOOKING" && totals.totalMinor > 0) {
        const settings = await tx.companySettings.findFirst({
          select: { requiredDepositPercent: true },
        });
        const depositPercent = settings?.requiredDepositPercent ?? 30;
        requiredDepositMinor = calculateRequiredDeposit(totals.totalMinor, depositPercent);
        requiredDepositRuleSnapshot = { percent: depositPercent, totalMinor: totals.totalMinor };
      }

      // Create reservation with items
      const created = await tx.reservation.create({
        data: {
          number,
          type,
          status: initialStatus,
          propertyId: body.propertyId || null,
          clientId: body.clientId || null,
          assignedUserId: body.assignedUserId || null,
          source: body.source || "PHONE",
          checkIn,
          checkOut,
          nights: Math.max(nights, 0),
          adults: Number(body.adults || 1),
          children: Number(body.children || 0),
          ...reservationFinancials,
          requiredDepositMinor,
          requiredDepositRuleSnapshot: requiredDepositRuleSnapshot || undefined,
          guestNotes: body.guestNotes || null,
          internalNotes: body.internalNotes || null,
          items: { create: itemData },
          statusLogs: {
            create: {
              toStatus: initialStatus,
              action: "CREATED",
              note: type === "BOOKING" ? "Rezerwacja utworzona" : type === "OFFER" ? "Oferta utworzona" : "Blokada utworzona",
              changedBy: "ADMIN",
            },
          },
          ...(type === "BOOKING" ? {
            bookingDetails: {
              create: {
                confirmedAt: initialStatus === "CONFIRMED" ? new Date() : null,
                balanceDueMinor: totals.totalMinor,
                balanceDue: totals.totalMinor / 100,
              },
            },
          } : {}),
          ...(type === "OFFER" ? {
            offerDetails: {
              create: {
                token: generateSecureToken(),
                pin: body.pin ? await hashPin(body.pin) : null,
                expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
                expiryAction: body.expiryAction || "CANCEL",
              },
            },
          } : {}),
        },
        include: { ...reservationInclude, items: true },
      });

      // Create addon snapshots (global + per-item)
      if (body.addons && body.addons.length > 0) {
        // Fetch addon definitions for scope validation
        const addonIds = [...new Set(body.addons.map((a: any) => a.addonId))] as string[];
        const addonDefs = await tx.addon.findMany({
          where: { id: { in: addonIds } },
          select: { id: true, scope: true },
        });
        const addonScopeMap = new Map(addonDefs.map(a => [a.id, a.scope]));

        // Build item category map for ACCOMMODATION check
        const itemCategoryMap = new Map(
          created.items.map((item: any) => [item.resourceId, item.categoryType])
        );

        const addonData = body.addons.map((a: any, i: number) => {
          const scope = addonScopeMap.get(a.addonId) || "GLOBAL";
          let reservationItemId = null;

          if (scope === "PER_ITEM") {
            if (!a.resourceId) throw new Error("Addon per zasób wymaga resourceId");
            const resCat = itemCategoryMap.get(a.resourceId);
            if (resCat && resCat !== "ACCOMMODATION") throw new Error("Udogodnienia per zasób dotyczą tylko noclegów");
            const matchingItem = created.items.find((item: any) =>
              item.resourceId === a.resourceId && (a.sortOrder === undefined || item.sortOrder === a.sortOrder)
            );
            if (matchingItem) reservationItemId = matchingItem.id;
          }
          // scope=GLOBAL → reservationItemId stays null (ignore any resourceId)

          return {
            reservationId: created.id,
            reservationItemId,
            addonId: a.addonId,
            snapshotName: a.snapshotName || a.name || "",
            snapshotPriceMinor: Number(a.snapshotPrice || a.price || 0),
            snapshotPrice: Number(a.snapshotPrice || a.price || 0) / 100,
            snapshotPricingType: a.snapshotPricingType || a.pricingType || "PER_BOOKING",
            quantity: Number(a.quantity || 1),
            unitPriceMinor: Number(a.unitPrice || a.price || 0),
            unitPrice: Number(a.unitPrice || a.price || 0) / 100,
            calcPersons: Number(a.calcPersons || 1),
            calcNights: Number(a.calcNights || 1),
            calcQuantity: Number(a.calcQuantity || a.quantity || 1),
            totalMinor: Number(a.total || 0),
            total: Number(a.total || 0) / 100,
            sortOrder: i,
          };
        });
        await tx.reservationAddon.createMany({ data: addonData });
      }

      // Create timeline entries (linked to reservationItemId)
      const label = getTimelineLabel(type, number);
      for (const item of created.items) {
        await createTimelineEntry(tx, {
          type,
          resourceId: item.resourceId,
          startAt: item.startAt,
          endAt: item.endAt,
          quantityReserved: item.categoryType === "QUANTITY_TIME" ? item.quantity : 1,
          reservationId: created.id,
          reservationItemId: item.id,
          label,
        });
      }

      // Re-fetch with full includes
      return tx.reservation.findUnique({
        where: { id: created.id },
        include: reservationInclude,
      });
    });

    return apiSuccess({ reservation }, 201);
  } catch (error) {
    if (error instanceof ConflictError || error instanceof QuantityExceededError) {
      return apiError(error.message, 409, "CONFLICT");
    }
    return apiServerError(error);
  }
}

// ══════════════════════════════════════════════════════════════════════
// GET — List reservations
// ══════════════════════════════════════════════════════════════════════

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const status = searchParams.get("status");
    const clientId = searchParams.get("clientId");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    const where: any = {};
    if (type) where.type = type;
    if (status) where.status = status;
    if (clientId) where.clientId = clientId;

    if (search) {
      where.OR = [
        { number: { contains: search, mode: "insensitive" } },
        { client: { firstName: { contains: search, mode: "insensitive" } } },
        { client: { lastName: { contains: search, mode: "insensitive" } } },
        { client: { companyName: { contains: search, mode: "insensitive" } } },
        { client: { email: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [reservations, total] = await Promise.all([
      prisma.reservation.findMany({
        where,
        include: {
          ...reservationInclude,
          _count: { select: { addons: true, statusLogs: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.reservation.count({ where }),
    ]);

    return apiSuccess({
      reservations,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return apiServerError(error);
  }
}
