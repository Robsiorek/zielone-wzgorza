/**
 * POST /api/public/quote-preview — Batch minimum prices for variants.
 *
 * E1: Returns fromPriceMinor per variant (cheapest night in range).
 * Used by widget to show "od X zł/noc" on availability listing.
 *
 * Body: { checkIn, checkOut, variantIds: string[] }
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, apiServerError } from "@/lib/api-response";
import { getMinPrices, getNightDates } from "@/lib/pricing-engine";
import { quotePreviewLimiter } from "@/lib/rate-limiter";

const MAX_NIGHTS = 60;

export async function POST(request: NextRequest) {
  try {
    // Rate limit
    const limited = quotePreviewLimiter.check(request);
    if (limited) return limited;

    const body = await request.json();
    const { checkIn, checkOut, variantIds } = body;

    if (!checkIn || !checkOut) return apiError("checkIn i checkOut są wymagane");
    if (!variantIds?.length) return apiError("variantIds jest wymagane");
    if (variantIds.length > 50) return apiError("Maksymalnie 50 wariantów na raz");

    const nights = getNightDates(checkIn, checkOut);
    if (nights.length === 0) return apiError("Data wyjazdu musi być po dacie przyjazdu");
    if (nights.length > MAX_NIGHTS) return apiError(`Maksymalnie ${MAX_NIGHTS} nocy`);

    const results = await getMinPrices(prisma, variantIds, checkIn, checkOut);

    return apiSuccess({
      prices: results,
      nights: nights.length,
      checkIn,
      checkOut,
    });
  } catch (error) {
    return apiServerError(error);
  }
}
