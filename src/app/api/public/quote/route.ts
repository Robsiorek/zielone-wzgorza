/**
 * POST /api/public/quote — Full price quote with breakdown.
 *
 * E1: Creates Quote record in DB with:
 *   - quoteId + secret (anti-enumeration)
 *   - payloadHash (SHA-256 verification)
 *   - expiresAt (30 min default)
 *   - single-use (usedAt + reservationId)
 *
 * Body: { checkIn, checkOut, items: [{ variantId, adults?, children? }], addons?: [...], promoCode? }
 * Response: full breakdown + quoteId + quoteSecret + expiresAt
 */

import { NextRequest } from "next/server";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, apiServerError } from "@/lib/api-response";
import { calculateQuote, hashPayload, getNightDates, type QuoteInput } from "@/lib/pricing-engine";
import { quoteLimiter } from "@/lib/rate-limiter";

const QUOTE_TTL_MINUTES = 30;
const MAX_NIGHTS = 60;

function generateSecret(): string {
  return randomBytes(16).toString("hex"); // 32 hex chars
}

export async function POST(request: NextRequest) {
  try {
    // Rate limit
    const limited = quoteLimiter.check(request);
    if (limited) return limited;

    const body = await request.json();

    // Validate input
    if (!body.checkIn || !body.checkOut) return apiError("checkIn i checkOut są wymagane");
    if (!body.items?.length) return apiError("items jest wymagane (min 1 wariant)");
    if (body.items.length > 10) return apiError("Maksymalnie 10 wariantów w jednym quote");

    const nightDates = getNightDates(body.checkIn, body.checkOut);
    if (nightDates.length === 0) return apiError("Data wyjazdu musi być po dacie przyjazdu");
    if (nightDates.length > MAX_NIGHTS) return apiError(`Maksymalnie ${MAX_NIGHTS} nocy`);

    const input: QuoteInput = {
      checkIn: body.checkIn,
      checkOut: body.checkOut,
      items: body.items.map((i: any) => ({
        variantId: i.variantId,
        adults: i.adults,
        children: i.children,
      })),
      addons: body.addons?.map((a: any) => ({
        addonId: a.addonId,
        quantity: Number(a.quantity || 1),
      })),
      promoCode: body.promoCode?.toUpperCase() || undefined,
    };

    // Calculate quote
    const result = await calculateQuote(prisma, input);

    // If errors → return result with errors (no quote saved)
    if (result.errors.length > 0) {
      return apiSuccess({
        quote: null,
        result,
      });
    }

    // Persist quote in DB
    const secret = generateSecret();
    const payloadForHash = {
      checkIn: input.checkIn,
      checkOut: input.checkOut,
      items: input.items,
      addons: input.addons || [],
      promoCode: input.promoCode || null,
    };
    const pHash = hashPayload(payloadForHash);
    const expiresAt = new Date(Date.now() + QUOTE_TTL_MINUTES * 60 * 1000);

    const quote = await prisma.quote.create({
      data: {
        secret,
        payload: payloadForHash as any,
        payloadHash: pHash,
        result: result as any,
        totalMinor: result.totalMinor,
        expiresAt,
      },
    });

    return apiSuccess({
      quoteId: quote.id,
      quoteSecret: secret,
      expiresAt: expiresAt.toISOString(),
      result,
    });
  } catch (error) {
    return apiServerError(error);
  }
}
