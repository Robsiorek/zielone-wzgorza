/**
 * GET /api/public/availability — Check resource availability for dates.
 *
 * E1: Public endpoint (no auth). Returns available resources + variants.
 * NO PRICES — use /api/public/quote-preview for prices.
 *
 * Query params:
 *   checkIn=YYYY-MM-DD (required)
 *   checkOut=YYYY-MM-DD (required)
 *   categoryType=ACCOMMODATION (optional filter)
 *   categoryId=xxx (optional filter)
 *   adults=2 (optional capacity filter)
 *   children=1 (optional capacity filter)
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, apiServerError } from "@/lib/api-response";
import { resolveOperationalTimes, combineDateAndTime } from "@/lib/operational-times";
import { checkAvailability, checkQuantityAvailability } from "@/lib/timeline-service";
import { getNightDates } from "@/lib/pricing-engine";
import { availabilityLimiter } from "@/lib/rate-limiter";

const MAX_NIGHTS = 60;

export async function GET(request: NextRequest) {
  try {
    // Rate limit
    const limited = availabilityLimiter.check(request);
    if (limited) return limited;

    const { searchParams } = new URL(request.url);
    const checkIn = searchParams.get("checkIn");
    const checkOut = searchParams.get("checkOut");
    const categoryType = searchParams.get("categoryType");
    const categoryId = searchParams.get("categoryId");
    const adults = Number(searchParams.get("adults") || 0);
    const children = Number(searchParams.get("children") || 0);

    if (!checkIn || !checkOut) return apiError("Parametry checkIn i checkOut są wymagane");

    const nights = getNightDates(checkIn, checkOut);
    if (nights.length === 0) return apiError("Data wyjazdu musi być po dacie przyjazdu");
    if (nights.length > MAX_NIGHTS) return apiError(`Maksymalnie ${MAX_NIGHTS} nocy`);

    // Load resources with variants and categories
    const where: any = { status: 'ACTIVE', category: { isActive: true } };
    if (categoryType) where.category = { ...where.category, type: categoryType };
    if (categoryId) where.categoryId = categoryId;

    const resources = await prisma.resource.findMany({
      where,
      include: {
        category: { select: { id: true, name: true, type: true } },
        _count: { select: { variants: true } },
        variants: {
          where: { isActive: true },
          orderBy: { sortOrder: "asc" },
          select: {
            id: true, name: true, capacity: true, isDefault: true, unitNumber: true,
          },
        },
      },
      orderBy: [{ category: { sortOrder: "asc" } }, { sortOrder: "asc" }],
    });

    // Capacity filter (works on variant.capacity or resource.maxCapacity)
    const minGuests = adults + children;

    // Check availability per resource
    const results = await Promise.all(resources.map(async (resource) => {
      const catType = resource.category.type;

      // Filter variants by capacity
      const suitableVariants = minGuests > 0
        ? resource.variants.filter(v => v.capacity >= minGuests)
        : resource.variants;

      // Resource is bookable even without variants (variants are for pricing only)

      // Resolve operational times for availability check
      const times = await resolveOperationalTimes(prisma, resource.categoryId);
      const startAt = catType === "ACCOMMODATION"
        ? combineDateAndTime(checkIn, times.checkInTime)
        : new Date(checkIn);
      const endAt = catType === "ACCOMMODATION"
        ? combineDateAndTime(checkOut, times.checkOutTime)
        : new Date(checkOut);

      // Check availability
      let isAvailable = true;
      let remainingUnits: number | null = null;

      if (catType === "QUANTITY_TIME") {
        const result = await checkQuantityAvailability(prisma, resource.id, startAt, endAt, 1);
        isAvailable = result.available;
        remainingUnits = result.remainingUnits;
      } else {
        const result = await checkAvailability(prisma, [resource.id], startAt, endAt, ["BOOKING", "OFFER", "BLOCK"]);
        isAvailable = result.available;
      }

      return {
        resourceId: resource.id,
        resourceName: resource.name,
        categoryType: catType,
        categoryName: resource.category.name,
        available: isAvailable,
        remainingUnits,
        maxCapacity: (resource as any).maxCapacity || null,
        variants: suitableVariants.map(v => ({
          variantId: v.id,
          variantName: v.name,
          capacity: v.capacity,
          unitNumber: v.unitNumber,
          isDefault: v.isDefault,
        })),
      };
    }));

    // Filter out nulls and unavailable (but include unavailable with flag)
    const available = results.filter(Boolean);

    return apiSuccess({
      available,
      nights: nights.length,
      checkIn,
      checkOut,
    });
  } catch (error) {
    return apiServerError(error);
  }
}
