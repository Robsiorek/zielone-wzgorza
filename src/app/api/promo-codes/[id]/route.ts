import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiServerError } from "@/lib/api-response";
import { dateForDB } from "@/lib/dates";

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const data: any = {};
    if (body.code !== undefined) data.code = body.code.toUpperCase();
    if (body.name !== undefined) data.name = body.name;
    if (body.discountType !== undefined) data.discountType = body.discountType;
    if (body.discountValue !== undefined) {
      const dtype = body.discountType || data.discountType;
      if (dtype === "FIXED") {
        data.discountValueMinor = Number(body.discountValue);
        data.discountValue = Number(body.discountValue) / 100;
      } else {
        // PERCENTAGE — value is a percentage, not money
        data.discountValueMinor = Math.round(Number(body.discountValue) * 100);
        data.discountValue = Number(body.discountValue);
      }
    }
    if (body.minBookingValue !== undefined) {
      data.minBookingValueMinor = body.minBookingValue ? Number(body.minBookingValue) : null;
      data.minBookingValue = body.minBookingValue ? Number(body.minBookingValue) / 100 : null;
    }
    if (body.maxUses !== undefined) data.maxUses = body.maxUses ? parseInt(body.maxUses) : null;
    if (body.validFrom !== undefined) data.validFrom = dateForDB(body.validFrom);
    if (body.validUntil !== undefined) data.validUntil = dateForDB(body.validUntil);
    if (body.isActive !== undefined) data.isActive = body.isActive;
    const promo = await prisma.promoCode.update({ where: { id: params.id }, data });
    return apiSuccess({ promo });
  } catch (error) {
    return apiServerError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.promoCode.delete({ where: { id: params.id } });
    return apiSuccess({ deleted: true });
  } catch (error) {
    return apiServerError(error);
  }
}
