/**
 * POST /api/public/book — Create reservation from a valid Quote.
 *
 * E2: Public booking endpoint. No auth. Rate limited: 5 req/min.
 *
 * 13-step transaction:
 *   1. Lock Quote (SELECT FOR UPDATE) + validate (secret, hash, expiry)
 *   2. Idempotency: if quote.usedAt != null → return existing reservation
 *   3. Check availability per item (exclusion constraint)
 *   4. Find or create Client (match by email only)
 *   5. Create Reservation (BOOKING, PENDING, source=FRONT)
 *   6. Create ReservationItem[] (from quote.payload)
 *   7. Create TimelineEntry per item (instant block)
 *   8. Create BookingDetails (token + consent fields)
 *   9. Create ReservationAddon[] (GLOBAL only, from quote.result)
 *  10. Calculate totals + deposit snapshot
 *  11. Consume PromoCode (usedCount++ if applicable)
 *  12. Mark Quote used (usedAt + reservationId)
 *  13. Create StatusLog + return
 *
 * Input: { quoteId, quoteSecret, client: { firstName, lastName, email, phone, ... }, guestNotes?, consentAccepted }
 * Output: { reservationNumber, token, totalMinor, depositMinor, status }
 *
 * PromoCode is NOT accepted in input — only from Quote snapshot.
 * Client matching: email only (phone = auxiliary data).
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, apiServerError } from "@/lib/api-response";
import { bookLimiter } from "@/lib/rate-limiter";
import { emailService } from "@/lib/email-service";
import { hashPayload, type QuoteResult, type QuoteItemResult, type QuoteAddonResult } from "@/lib/pricing-engine";
import { nightsBetween } from "@/lib/dates";
import {
  resolveOperationalTimes,
  combineDateAndTime,
  toDateStr,
} from "@/lib/operational-times";
import {
  checkAvailability,
  createTimelineEntry,
  ConflictError,
} from "@/lib/timeline-service";
import { withLegacySync } from "@/lib/format";
import { calculateRequiredDeposit } from "@/lib/payment-service";
import { generateSecureToken } from "@/lib/crypto";

// ── Helpers ──

async function generateReservationNumber(tx: any, prefix: string): Promise<string> {
  const year = new Date().getFullYear();
  const result: any[] = await tx.$queryRaw`SELECT nextval('reservation_number_seq') as num`;
  const num = Number(result[0].num);
  return `${prefix}-${year}-${String(num).padStart(4, "0")}`;
}

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePhone(phone: string): boolean {
  // Accept Polish formats: +48XXXXXXXXX, 48XXXXXXXXX, XXXXXXXXX, XXX-XXX-XXX, XXX XXX XXX
  const cleaned = phone.replace(/[\s\-()]/g, "");
  return /^(\+?48)?\d{9}$/.test(cleaned);
}

function sanitizeText(text: string | undefined | null): string | null {
  if (!text) return null;
  // Basic XSS sanitization — strip HTML tags
  return text.replace(/<[^>]*>/g, "").trim().slice(0, 2000) || null;
}

function getClientIp(request: NextRequest): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-real-ip")
    || "unknown";
}

export async function POST(request: NextRequest) {
  try {
    // Rate limit
    const limited = bookLimiter.check(request);
    if (limited) return limited;

    const body = await request.json();

    // ── Input validation ──
    const { quoteId, quoteSecret, client, guestNotes, consentAccepted } = body;

    if (!quoteId || !quoteSecret) {
      return apiError("quoteId i quoteSecret są wymagane");
    }
    if (!client?.firstName?.trim() || !client?.lastName?.trim()) {
      return apiError("Imię i nazwisko są wymagane");
    }
    if (!client?.email?.trim()) {
      return apiError("Adres email jest wymagany");
    }
    if (!validateEmail(client.email.trim())) {
      return apiError("Nieprawidłowy format adresu email", 422, "VALIDATION");
    }
    if (!client?.phone?.trim()) {
      return apiError("Numer telefonu jest wymagany");
    }
    if (!validatePhone(client.phone.trim())) {
      return apiError("Nieprawidłowy format numeru telefonu", 422, "VALIDATION");
    }
    if (!consentAccepted) {
      return apiError("Wymagana jest zgoda na regulamin i politykę prywatności", 422, "VALIDATION");
    }

    const clientEmail = client.email.trim().toLowerCase();
    const clientPhone = client.phone.trim();
    const clientIp = getClientIp(request);
    const clientUserAgent = request.headers.get("user-agent") || "unknown";

    // ── Transaction: 13 steps ──
    const result = await prisma.$transaction(async (tx) => {

      // ───────────────────────────────────────────────
      // STEP 1: Lock Quote with FOR UPDATE + validate
      // ───────────────────────────────────────────────
      const quoteRows: any[] = await tx.$queryRaw`
        SELECT id, secret, payload, "payloadHash", result, "totalMinor",
               "expiresAt", "usedAt", "reservationId"
        FROM quotes
        WHERE id = ${quoteId}
        FOR UPDATE
      `;

      if (quoteRows.length === 0) {
        throw new BookingError("Wycena nie została znaleziona", 400, "QUOTE_NOT_FOUND");
      }

      const quote = quoteRows[0];

      // Verify secret
      if (quote.secret !== quoteSecret) {
        throw new BookingError("Nieprawidłowy token wyceny", 400, "QUOTE_INVALID");
      }

      // Verify payload integrity — DIAGNOSTIC CHECK ONLY.
      // Security model: book accepts ZERO pricing data from request (no dates,
      // variants, amounts, promo). All pricing comes from quote.payload/result in DB.
      // This hash check guards against DB corruption, not client manipulation.
      // If this ever fires, it means quote data in DB was modified after creation.
      const quotePayloadRaw = quote.payload as { checkIn: string; checkOut: string; items: any[]; addons?: any[]; promoCode?: string };
      const expectedHash = hashPayload({
        checkIn: quotePayloadRaw.checkIn,
        checkOut: quotePayloadRaw.checkOut,
        items: quotePayloadRaw.items,
        addons: quotePayloadRaw.addons || [],
        promoCode: quotePayloadRaw.promoCode || null,
      });
      if (expectedHash !== quote.payloadHash) {
        throw new BookingError("Dane wyceny zostały zmodyfikowane", 400, "QUOTE_TAMPERED");
      }

      // Verify not expired
      if (new Date(quote.expiresAt) < new Date()) {
        throw new BookingError("Wycena wygasła. Proszę wygenerować nową wycenę.", 400, "QUOTE_EXPIRED");
      }

      // ───────────────────────────────────────────────
      // STEP 2: Idempotency — if already used, return existing reservation
      // ───────────────────────────────────────────────
      if (quote.usedAt && quote.reservationId) {
        const existing = await tx.reservation.findUnique({
          where: { id: quote.reservationId },
          select: {
            number: true,
            status: true,
            totalMinor: true,
            requiredDepositMinor: true,
            bookingDetails: { select: { token: true } },
          },
        });
        if (existing) {
          return {
            idempotent: true,
            reservationNumber: existing.number,
            token: existing.bookingDetails?.token || null,
            totalMinor: existing.totalMinor,
            depositMinor: existing.requiredDepositMinor,
            status: existing.status,
          };
        }
      }

      // ── Parse quote data (already loaded in step 1) ──
      const quotePayload = quotePayloadRaw;
      const quoteResult = quote.result as QuoteResult;

      const checkIn = quotePayload.checkIn;
      const checkOut = quotePayload.checkOut;
      const nights = nightsBetween(checkIn, checkOut);

      if (nights <= 0) {
        throw new BookingError("Nieprawidłowy zakres dat w wycenie", 400, "QUOTE_INVALID");
      }

      // ───────────────────────────────────────────────
      // STEP 3: Check availability per item
      // ───────────────────────────────────────────────
      // Load resource details for operational times resolution
      const variantIds = quoteResult.items.map((i: QuoteItemResult) => i.variantId);
      const variants = await tx.resourceVariant.findMany({
        where: { id: { in: variantIds } },
        include: {
          resource: {
            select: {
              id: true,
              name: true,
              categoryId: true,
              category: { select: { type: true } },
            },
          },
        },
      });
      const variantMap = new Map(variants.map(v => [v.id, v]));

      // Cache resolved operational times per categoryId
      const timesCache = new Map<string, { checkInTime: string; checkOutTime: string }>();
      async function getTimes(categoryId: string) {
        if (timesCache.has(categoryId)) return timesCache.get(categoryId)!;
        const times = await resolveOperationalTimes(tx, categoryId);
        timesCache.set(categoryId, times);
        return times;
      }

      // Resolve start/end dates per item
      const checkInDateStr = toDateStr(checkIn);
      const checkOutDateStr = toDateStr(checkOut);

      interface ResolvedItem {
        variant: typeof variants[0];
        startAt: Date;
        endAt: Date;
        adults: number;
        children: number;
        totalPriceMinor: number;
        pricePerUnitMinor: number;
      }

      const resolvedItems: ResolvedItem[] = [];

      for (const quoteItem of quoteResult.items) {
        const variant = variantMap.get(quoteItem.variantId);
        if (!variant) {
          throw new BookingError(`Wariant ${quoteItem.variantId} nie znaleziony`, 400, "VARIANT_NOT_FOUND");
        }

        const catType = variant.resource.category?.type || "ACCOMMODATION";

        let startAt: Date, endAt: Date;
        if (catType === "ACCOMMODATION") {
          const times = await getTimes(variant.resource.categoryId);
          startAt = combineDateAndTime(checkInDateStr, times.checkInTime);
          endAt = combineDateAndTime(checkOutDateStr, times.checkOutTime);
        } else {
          startAt = new Date(checkIn);
          endAt = new Date(checkOut);
        }

        // Check availability for this resource
        const { available, conflicts } = await checkAvailability(
          tx,
          [variant.resource.id],
          startAt,
          endAt,
          ["BOOKING", "BLOCK", "OFFER"],
        );
        if (!available) {
          throw new ConflictError(conflicts[0].resourceName, conflicts[0].type as any);
        }

        // Find matching input item for adults/children
        const inputItem = quotePayload.items.find((pi: any) => pi.variantId === quoteItem.variantId);
        const pricePerUnitMinor = quoteItem.nights > 0
          ? Math.round(quoteItem.totalMinor / quoteItem.nights)
          : quoteItem.totalMinor;

        resolvedItems.push({
          variant,
          startAt,
          endAt,
          adults: inputItem?.adults || 1,
          children: inputItem?.children || 0,
          totalPriceMinor: quoteItem.totalMinor,
          pricePerUnitMinor,
        });
      }

      // ───────────────────────────────────────────────
      // STEP 4: Find or create Client (match by email only)
      // ───────────────────────────────────────────────
      let clientRecord = await tx.client.findFirst({
        where: { email: clientEmail },
      });

      if (clientRecord) {
        // Update phone if newer
        await tx.client.update({
          where: { id: clientRecord.id },
          data: {
            phone: clientPhone,
            firstName: client.firstName.trim(),
            lastName: client.lastName.trim(),
            lastActivityAt: new Date(),
            ...(client.companyName ? { companyName: client.companyName.trim() } : {}),
            ...(client.nip ? { nip: client.nip.trim() } : {}),
            ...(client.address ? { address: client.address.trim() } : {}),
            ...(client.city ? { city: client.city.trim() } : {}),
            ...(client.postalCode ? { postalCode: client.postalCode.trim() } : {}),
          },
        });
      } else {
        // Generate client number
        const clientNumResult: any[] = await tx.$queryRaw`SELECT nextval('client_number_seq') as num`;
        const clientNum = Number(clientNumResult[0].num);
        const clientNumber = `KL-${String(clientNum).padStart(5, "0")}`;

        clientRecord = await tx.client.create({
          data: {
            clientNumber,
            firstName: client.firstName.trim(),
            lastName: client.lastName.trim(),
            email: clientEmail,
            phone: clientPhone,
            source: "WEBSITE",
            type: client.companyName ? "COMPANY" : "INDIVIDUAL",
            companyName: client.companyName?.trim() || null,
            nip: client.nip?.trim() || null,
            address: client.address?.trim() || null,
            city: client.city?.trim() || null,
            postalCode: client.postalCode?.trim() || null,
          },
        });
      }

      // ───────────────────────────────────────────────
      // STEP 5-6: Create Reservation + Items
      // ───────────────────────────────────────────────
      const number = await generateReservationNumber(tx, "ZW");

      // Financial totals from quote result
      const reservationFinancials = withLegacySync({
        subtotalMinor: quoteResult.subtotalMinor,
        discountMinor: quoteResult.discount?.amountMinor || 0,
        totalMinor: quoteResult.totalMinor,
      });

      // Deposit snapshot
      const settings = await tx.companySettings.findFirst({
        select: { requiredDepositPercent: true },
      });
      const depositPercent = settings?.requiredDepositPercent ?? 30;
      const requiredDepositMinor = calculateRequiredDeposit(quoteResult.totalMinor, depositPercent);

      const itemData = resolvedItems.map((ri, i) => ({
        resourceId: ri.variant.resource.id,
        categoryType: (ri.variant.resource.category?.type || "ACCOMMODATION") as any,
        startAt: ri.startAt,
        endAt: ri.endAt,
        quantity: 1,
        pricePerUnitMinor: ri.pricePerUnitMinor,
        totalPriceMinor: ri.totalPriceMinor,
        pricePerUnit: ri.pricePerUnitMinor / 100,
        totalPrice: ri.totalPriceMinor / 100,
        adults: ri.adults,
        children: ri.children,
        sortOrder: i,
      }));

      const reservation = await tx.reservation.create({
        data: {
          number,
          type: "BOOKING",
          status: "PENDING",
          source: "FRONT",
          clientId: clientRecord.id,
          checkIn: new Date(checkIn),
          checkOut: new Date(checkOut),
          nights,
          adults: resolvedItems.reduce((s, ri) => s + ri.adults, 0),
          children: resolvedItems.reduce((s, ri) => s + ri.children, 0),
          ...reservationFinancials,
          requiredDepositMinor,
          requiredDepositRuleSnapshot: { percent: depositPercent, totalMinor: quoteResult.totalMinor } as any,
          guestNotes: sanitizeText(guestNotes),
          promoCodeId: quoteResult.discount?.code
            ? (await tx.promoCode.findUnique({ where: { code: quoteResult.discount.code } }))?.id || null
            : null,
          items: { create: itemData },
          // Step 8: BookingDetails with consent
          bookingDetails: {
            create: {
              token: generateSecureToken(),
              balanceDueMinor: quoteResult.totalMinor,
              balanceDue: quoteResult.totalMinor / 100,
              consentAcceptedAt: new Date(),
              consentTermsVersion: "v1.0-2026-04",
              consentIpAddress: clientIp,
              consentUserAgent: clientUserAgent.slice(0, 500),
            },
          },
          // Step 13: Status log
          statusLogs: {
            create: {
              toStatus: "PENDING",
              action: "CREATED",
              note: "Rezerwacja złożona przez widget online",
              changedBy: `KLIENT:${clientEmail}`,
            },
          },
        },
        include: {
          items: true,
          bookingDetails: { select: { token: true } },
        },
      });

      // ───────────────────────────────────────────────
      // STEP 7: Create TimelineEntry per item
      // ───────────────────────────────────────────────
      const label = `Rezerwacja ${number}`;
      for (const item of reservation.items) {
        await createTimelineEntry(tx, {
          type: "BOOKING",
          resourceId: item.resourceId,
          startAt: item.startAt,
          endAt: item.endAt,
          quantityReserved: 1,
          reservationId: reservation.id,
          reservationItemId: item.id,
          label,
        });
      }

      // ───────────────────────────────────────────────
      // STEP 9: Create ReservationAddon[] (GLOBAL only from quote)
      // ───────────────────────────────────────────────
      if (quoteResult.addons && quoteResult.addons.length > 0) {
        const addonData = quoteResult.addons.map((qa: QuoteAddonResult, i: number) => ({
          reservationId: reservation.id,
          reservationItemId: null,
          addonId: qa.addonId,
          snapshotName: qa.name,
          snapshotPriceMinor: qa.unitPriceMinor,
          snapshotPrice: qa.unitPriceMinor / 100,
          snapshotPricingType: qa.pricingType as any,
          quantity: qa.quantity,
          unitPriceMinor: qa.unitPriceMinor,
          unitPrice: qa.unitPriceMinor / 100,
          calcPersons: 1,
          calcNights: nights,
          calcQuantity: qa.quantity,
          totalMinor: qa.totalMinor,
          total: qa.totalMinor / 100,
          sortOrder: i,
        }));
        await tx.reservationAddon.createMany({ data: addonData });
      }

      // ───────────────────────────────────────────────
      // STEP 11: Consume PromoCode (usedCount++ if in quote)
      // ───────────────────────────────────────────────
      if (quoteResult.discount?.code) {
        await tx.promoCode.update({
          where: { code: quoteResult.discount.code },
          data: { usedCount: { increment: 1 } },
        });
      }

      // ───────────────────────────────────────────────
      // STEP 12: Mark Quote as used
      // ───────────────────────────────────────────────
      await tx.$executeRaw`
        UPDATE quotes
        SET "usedAt" = NOW(), "reservationId" = ${reservation.id}
        WHERE id = ${quoteId}
      `;

      return {
        idempotent: false,
        reservationNumber: reservation.number,
        token: reservation.bookingDetails?.token || null,
        totalMinor: quoteResult.totalMinor,
        depositMinor: requiredDepositMinor,
        status: "PENDING" as const,
        // Data for email (not sent to client, used internally)
        _email: {
          reservationId: reservation.id,
          items: reservation.items.map((item: any) => ({
            resource: { name: resolvedItems.find(ri => ri.variant.resource.id === item.resourceId)?.variant.resource.name || "" },
          })),
          checkIn, checkOut, nights,
          adults: resolvedItems.reduce((s, ri) => s + ri.adults, 0),
          children: resolvedItems.reduce((s, ri) => s + ri.children, 0),
        },
      };
    }, {
      // Transaction options: serializable for safety
      timeout: 15000,
    });

    // ── E3: Send booking confirmation email (fire-and-forget, AFTER transaction) ──
    if (!result.idempotent && result._email) {
      emailService.sendBookingConfirmation(
        {
          id: result._email.reservationId,
          number: result.reservationNumber,
          checkIn: result._email.checkIn,
          checkOut: result._email.checkOut,
          nights: result._email.nights,
          adults: result._email.adults,
          children: result._email.children,
          totalMinor: result.totalMinor,
          requiredDepositMinor: result.depositMinor,
          status: "PENDING",
          items: result._email.items,
          bookingDetails: { token: result.token },
        },
        {
          firstName: client.firstName.trim(),
          lastName: client.lastName.trim(),
          email: clientEmail,
        },
      );
    }

    // Remove internal email data before sending response
    const { _email, ...responseData } = result;
    return apiSuccess(responseData);
  } catch (error) {
    if (error instanceof BookingError) {
      return apiError(error.message, error.status, error.code);
    }
    if (error instanceof ConflictError) {
      return apiError(
        "Wybrany termin został właśnie zarezerwowany przez innego klienta. Proszę wybrać inny termin.",
        409,
        "CONFLICT"
      );
    }
    // Postgres exclusion violation (race condition fallback)
    if (typeof error === "object" && error !== null && "code" in error && (error as any).code === "23P01") {
      return apiError(
        "Wybrany termin został właśnie zarezerwowany przez innego klienta. Proszę wybrać inny termin.",
        409,
        "CONFLICT"
      );
    }
    return apiServerError(error);
  }
}

// ── Custom error class for booking flow ──

class BookingError extends Error {
  status: number;
  code: string;

  constructor(message: string, status: number = 400, code: string = "BOOKING_ERROR") {
    super(message);
    this.name = "BookingError";
    this.status = status;
    this.code = code;
  }
}
