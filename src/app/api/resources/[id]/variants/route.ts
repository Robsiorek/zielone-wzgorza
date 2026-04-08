import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, apiServerError } from "@/lib/api-response";

// GET /api/resources/[id]/variants
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const variants = await prisma.resourceVariant.findMany({
      where: { resourceId: params.id },
      orderBy: { sortOrder: "asc" },
    });
    return apiSuccess({ variants });
  } catch (error) {
    return apiServerError(error);
  }
}

// POST /api/resources/[id]/variants
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const { name, description, capacity, basePrice, isDefault } = body;

    if (!name) {
      return apiError("Nazwa wariantu jest wymagana");
    }

    // Generate slug
    const resourceSlug = (await prisma.resource.findUnique({ where: { id: params.id }, select: { slug: true } }))?.slug || "variant";
    let baseSlug = `${resourceSlug}-${name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")}`;
    let slug = baseSlug;
    let counter = 1;
    while (await prisma.resourceVariant.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter++}`;
    }

    // If setting as default, unset others
    if (isDefault) {
      await prisma.resourceVariant.updateMany({
        where: { resourceId: params.id },
        data: { isDefault: false },
      });
    }

    const variant = await prisma.resourceVariant.create({
      data: {
        resourceId: params.id,
        name,
        slug,
        description: description || null,
        capacity: capacity ? parseInt(capacity) : 1,
        basePriceMinor: basePrice ? Number(basePrice) : null,
        basePrice: basePrice ? Number(basePrice) / 100 : null,
        isDefault: isDefault || false,
        sortOrder: await prisma.resourceVariant.count({ where: { resourceId: params.id } }),
      },
    });

    return apiSuccess({ variant }, 201);
  } catch (error) {
    return apiServerError(error);
  }
}
