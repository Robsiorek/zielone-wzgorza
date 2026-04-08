import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiNotFound, apiServerError } from "@/lib/api-response";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ratePlan = await prisma.ratePlan.findUnique({
      where: { id: params.id },
      include: {
        parent: { select: { id: true, name: true } },
        children: { select: { id: true, name: true, modifierType: true, modifierValue: true } },
        priceEntries: { include: { variant: { include: { resource: { select: { name: true } } } }, season: true } },
      },
    });
    if (!ratePlan) return apiNotFound("Plan nie znaleziony");
    return apiSuccess({ ratePlan });
  } catch (error) {
    return apiServerError(error);
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const data: any = {};
    if (body.name !== undefined) data.name = body.name;
    if (body.description !== undefined) data.description = body.description || null;
    if (body.parentId !== undefined) data.parentId = body.parentId || null;
    if (body.modifierType !== undefined) data.modifierType = body.modifierType || null;
    if (body.modifierValue !== undefined) {
      data.modifierValue = body.modifierValue ? parseFloat(body.modifierValue) : null;
      // modifierValueMinor only for FIXED type (PLN, not percentage)
      const mType = body.modifierType || "PERCENTAGE";
      data.modifierValueMinor = (body.modifierValue && mType === "FIXED")
        ? Number(body.modifierValue) : null;
    }
    if (body.cancellationPolicy !== undefined) data.cancellationPolicy = body.cancellationPolicy;
    if (body.cancellationDays !== undefined) data.cancellationDays = body.cancellationDays ? parseInt(body.cancellationDays) : null;
    if (body.isActive !== undefined) data.isActive = body.isActive;
    if (body.isDefault !== undefined) {
      if (body.isDefault) await prisma.ratePlan.updateMany({ data: { isDefault: false } });
      data.isDefault = body.isDefault;
    }

    const ratePlan = await prisma.ratePlan.update({
      where: { id: params.id },
      data,
      include: { parent: { select: { id: true, name: true } } },
    });
    return apiSuccess({ ratePlan });
  } catch (error) {
    return apiServerError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.ratePlan.delete({ where: { id: params.id } });
    return apiSuccess({ deleted: true });
  } catch (error) {
    return apiServerError(error);
  }
}
