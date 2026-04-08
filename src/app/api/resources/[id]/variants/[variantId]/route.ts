import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiServerError } from "@/lib/api-response";

// PUT /api/resources/[id]/variants/[variantId]
export async function PUT(request: NextRequest, { params }: { params: { id: string; variantId: string } }) {
  try {
    const body = await request.json();
    const { name, description, capacity, basePrice, isDefault, isActive } = body;

    if (isDefault) {
      await prisma.resourceVariant.updateMany({
        where: { resourceId: params.id },
        data: { isDefault: false },
      });
    }

    const data: any = {};
    if (name !== undefined) data.name = name;
    if (description !== undefined) data.description = description || null;
    if (capacity !== undefined) data.capacity = parseInt(capacity) || 1;
    if (basePrice !== undefined) {
      data.basePriceMinor = basePrice ? Number(basePrice) : null;
      data.basePrice = basePrice ? Number(basePrice) / 100 : null;
    }
    if (isDefault !== undefined) data.isDefault = isDefault;
    if (isActive !== undefined) data.isActive = isActive;

    const variant = await prisma.resourceVariant.update({
      where: { id: params.variantId },
      data,
    });

    return apiSuccess({ variant });
  } catch (error) {
    return apiServerError(error);
  }
}

// DELETE /api/resources/[id]/variants/[variantId]
export async function DELETE(request: NextRequest, { params }: { params: { id: string; variantId: string } }) {
  try {
    await prisma.resourceVariant.delete({ where: { id: params.variantId } });
    return apiSuccess({ deleted: true });
  } catch (error) {
    return apiServerError(error);
  }
}
