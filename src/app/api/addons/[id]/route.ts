import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, apiNotFound, apiServerError } from "@/lib/api-response";

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const addon = await prisma.addon.findUnique({
      where: { id: params.id },
      include: {
        _count: { select: { reservationAddons: true } },
      },
    });

    if (!addon) return apiNotFound("Dodatek nie znaleziony");
    return apiSuccess({ addon });
  } catch (error) {
    return apiServerError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const existing = await prisma.addon.findUnique({ where: { id: params.id } });
    if (!existing) return apiNotFound("Dodatek nie znaleziony");

    const body = await request.json();
    const data: any = {};

    if (body.name !== undefined) {
      if (!body.name.trim()) return apiError("Nazwa nie może być pusta");
      data.name = body.name.trim();
    }
    if (body.description !== undefined) data.description = body.description?.trim() || null;
    if (body.pricingType !== undefined) {
      const valid = ["PER_BOOKING", "PER_NIGHT", "PER_PERSON", "PER_PERSON_NIGHT", "PER_UNIT"];
      if (!valid.includes(body.pricingType)) return apiError("Nieprawidłowy typ rozliczenia");
      data.pricingType = body.pricingType;
    }
    if (body.price !== undefined) {
      if (Number(body.price) < 0) return apiError("Cena musi być >= 0");
      const priceMinor = Number(body.price);
      data.priceMinor = priceMinor;
      data.price = priceMinor / 100;
    }
    if (body.selectType !== undefined) {
      const valid = ["CHECKBOX", "QUANTITY", "SELECT"];
      if (!valid.includes(body.selectType)) return apiError("Nieprawidłowy sposób wyboru");
      data.selectType = body.selectType;
    }
    if (body.isRequired !== undefined) data.isRequired = body.isRequired === true;
    if (body.isActive !== undefined) data.isActive = body.isActive === true;
    if (body.scope !== undefined) {
      const valid = ["GLOBAL", "PER_ITEM"];
      if (!valid.includes(body.scope)) return apiError("Nieprawidłowy zakres");
      // Block scope change if addon is used in reservations
      if (body.scope !== existing.scope) {
        const usageCount = await prisma.reservationAddon.count({ where: { addonId: params.id } });
        if (usageCount > 0) return apiError("Nie można zmienić zakresu dodatku, który jest używany w rezerwacjach (" + usageCount + ")");
      }
      data.scope = body.scope;
    }
    if (body.sortOrder !== undefined) data.sortOrder = Number(body.sortOrder);

    const addon = await prisma.addon.update({
      where: { id: params.id },
      data,
      include: {
        _count: { select: { reservationAddons: true } },
      },
    });

    return apiSuccess({ addon });
  } catch (error) {
    return apiServerError(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const existing = await prisma.addon.findUnique({
      where: { id: params.id },
      include: { _count: { select: { reservationAddons: true } } },
    });
    if (!existing) return apiNotFound("Dodatek nie znaleziony");

    // Soft delete — deactivate if used in reservations
    if (existing._count.reservationAddons > 0) {
      const addon = await prisma.addon.update({
        where: { id: params.id },
        data: { isActive: false },
      });
      return apiSuccess({ addon, softDeleted: true });
    }

    // Hard delete if never used
    await prisma.addon.delete({ where: { id: params.id } });
    return apiSuccess({ deleted: true });
  } catch (error) {
    return apiServerError(error);
  }
}
