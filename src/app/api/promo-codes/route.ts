import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, apiServerError } from "@/lib/api-response";
import { dateForDB } from "@/lib/dates";

export async function GET() {
  try {
    const codes = await prisma.promoCode.findMany({
      orderBy: { createdAt: "desc" },
    });
    return apiSuccess({ codes });
  } catch (error) {
    return apiServerError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, name, discountType, discountValue, minBookingValue, maxUses, validFrom, validUntil } = body;

    if (!code || !name || !discountType || !discountValue || !validFrom || !validUntil) {
      return apiError("Wszystkie pola są wymagane");
    }

    const promo = await prisma.promoCode.create({
      data: {
        code: code.toUpperCase(),
        name,
        discountType,
        // PERCENTAGE: discountValue is a percentage (not money) — Minor irrelevant
        // FIXED: discountValue comes in grosze from frontend
        discountValueMinor: discountType === "FIXED" ? Number(discountValue) : Math.round(Number(discountValue) * 100),
        discountValue: discountType === "FIXED" ? Number(discountValue) / 100 : Number(discountValue),
        // minBookingValue is always money → grosze
        minBookingValueMinor: minBookingValue ? Number(minBookingValue) : null,
        minBookingValue: minBookingValue ? Number(minBookingValue) / 100 : null,
        maxUses: maxUses ? parseInt(maxUses) : null,
        validFrom: dateForDB(validFrom),
        validUntil: dateForDB(validUntil),
      },
    });

    return apiSuccess({ promo }, 201);
  } catch (error) {
    return apiServerError(error);
  }
}
