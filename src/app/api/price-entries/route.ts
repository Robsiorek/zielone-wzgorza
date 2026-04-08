import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, apiServerError } from "@/lib/api-response";
import { dateForDB } from "@/lib/dates";

// GET /api/price-entries?ratePlanId=...&seasonId=...&variantId=...
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ratePlanId = searchParams.get("ratePlanId");
    const seasonId = searchParams.get("seasonId");
    const variantId = searchParams.get("variantId");

    const where: any = {};
    if (ratePlanId) where.ratePlanId = ratePlanId;
    if (seasonId) where.seasonId = seasonId;
    if (variantId) where.variantId = variantId;

    const entries = await prisma.priceEntry.findMany({
      where,
      include: {
        variant: { include: { resource: { select: { id: true, name: true, unitNumber: true, category: { select: { name: true, slug: true } } } } } },
        ratePlan: { select: { id: true, name: true } },
        season: { select: { id: true, name: true } },
      },
      orderBy: [{ variant: { resource: { sortOrder: "asc" } } }, { variant: { sortOrder: "asc" } }],
    });

    return apiSuccess({ entries });
  } catch (error) {
    return apiServerError(error);
  }
}

// POST /api/price-entries - bulk upsert prices
export async function POST(request: NextRequest) {
  try {
    const { prices } = await request.json();

    if (!prices || !Array.isArray(prices)) {
      return apiError("Tablica cen jest wymagana");
    }

    let created = 0;
    let updated = 0;

    for (const p of prices) {
      if (!p.variantId || !p.ratePlanId || p.price === undefined) continue;

      const existing = await prisma.priceEntry.findFirst({
        where: {
          variantId: p.variantId,
          ratePlanId: p.ratePlanId,
          seasonId: p.seasonId || null,
          date: p.date ? dateForDB(p.date) : null,
        },
      });

      if (existing) {
        const priceMinor = Number(p.price);
        await prisma.priceEntry.update({
          where: { id: existing.id },
          data: { priceMinor, price: priceMinor / 100 },
        });
        updated++;
      } else {
        const priceMinor = Number(p.price);
        await prisma.priceEntry.create({
          data: {
            variantId: p.variantId,
            ratePlanId: p.ratePlanId,
            seasonId: p.seasonId || null,
            date: p.date ? dateForDB(p.date) : null,
            priceMinor,
            price: priceMinor / 100,
          },
        });
        created++;
      }
    }

    return apiSuccess({ created, updated });
  } catch (error) {
    return apiServerError(error);
  }
}
