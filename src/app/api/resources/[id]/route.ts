import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiNotFound, apiServerError } from "@/lib/api-response";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const resource = await prisma.resource.findUnique({
      where: { id: params.id },
      include: {
        category: true,
        variants: { orderBy: { sortOrder: "asc" } },
        images: { orderBy: { sortOrder: "asc" } },
        amenities: true,
      },
    });
    if (!resource) return apiNotFound("Zasób nie znaleziony");
    return apiSuccess({ resource });
  } catch (error) {
    return apiServerError(error);
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const { name, categoryId, description, shortDesc, maxCapacity, status, totalUnits, location, unitNumber } = body;

    const data: any = {};
    if (name) {
      data.name = name;
      data.slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    }
    if (categoryId) data.categoryId = categoryId;
    if (description !== undefined) data.description = description || null;
    if (shortDesc !== undefined) data.shortDesc = shortDesc || null;
    if (maxCapacity !== undefined) data.maxCapacity = maxCapacity ? parseInt(maxCapacity) : null;
    if (totalUnits !== undefined) data.totalUnits = parseInt(totalUnits) || 1;
    if (location !== undefined) data.location = location || null;
    if (unitNumber !== undefined) data.unitNumber = unitNumber || null;
    if (status) data.status = status;
    if (body.visibleInWidget !== undefined) data.visibleInWidget = Boolean(body.visibleInWidget);

    const resource = await prisma.resource.update({
      where: { id: params.id },
      data,
      include: { category: true, variants: true, images: true, amenities: true },
    });

    return apiSuccess({ resource });
  } catch (error) {
    return apiServerError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.resource.delete({ where: { id: params.id } });
    return apiSuccess({ deleted: true });
  } catch (error) {
    return apiServerError(error);
  }
}
