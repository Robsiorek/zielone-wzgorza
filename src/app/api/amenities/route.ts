/**
 * GET  /api/amenities — List all amenities (with category, resource count)
 * POST /api/amenities — Create a new amenity
 *
 * B3: Amenities are property-scoped, belong to a category.
 * iconKey validated against amenity-icons registry.
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, apiServerError } from "@/lib/api-response";
import { getAuthContext, hasMinRole } from "@/lib/require-auth";
import { isValidIconKey } from "@/lib/amenity-icons";

/** Get the single property ID (single-property system) */
async function getPropertyId(): Promise<string> {
  const prop = await prisma.property.findFirst({ select: { id: true } });
  if (!prop) throw new Error("Brak property w bazie");
  return prop.id;
}

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth) return apiError("Brak autoryzacji", 401, "UNAUTHORIZED");

    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("categoryId");

    const propertyId = await getPropertyId();
    const where: Record<string, unknown> = { propertyId };
    if (categoryId) where.categoryId = categoryId;

    const amenities = await prisma.amenity.findMany({
      where,
      orderBy: [{ category: { position: "asc" } }, { position: "asc" }],
      include: {
        category: { select: { id: true, name: true, slug: true } },
        _count: { select: { resources: true } },
      },
    });

    return apiSuccess({ amenities });
  } catch (error) {
    return apiServerError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth) return apiError("Brak autoryzacji", 401, "UNAUTHORIZED");
    if (!hasMinRole(auth, "MANAGER")) return apiError("Brak uprawnień", 403, "FORBIDDEN");

    const body = await request.json();
    const { name, categoryId, iconKey } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return apiError("Nazwa udogodnienia jest wymagana", 400, "VALIDATION");
    }
    if (name.trim().length > 100) {
      return apiError("Nazwa udogodnienia: maksymalnie 100 znaków", 400, "VALIDATION");
    }

    if (!categoryId || typeof categoryId !== "string") {
      return apiError("Kategoria jest wymagana", 400, "VALIDATION");
    }

    if (!iconKey || typeof iconKey !== "string") {
      return apiError("Ikona jest wymagana", 400, "VALIDATION");
    }
    if (!isValidIconKey(iconKey)) {
      return apiError(`Nieznana ikona: "${iconKey}"`, 400, "VALIDATION");
    }

    // Verify category exists
    const category = await prisma.amenityCategory.findUnique({
      where: { id: categoryId },
      select: { id: true, propertyId: true },
    });
    if (!category) return apiError("Kategoria nie znaleziona", 400, "VALIDATION");

    const propertyId = category.propertyId;

    // Generate slug (polish-safe transliteration)
    const baseSlug = name.trim().toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[ąáà]/g, "a").replace(/[ćč]/g, "c").replace(/[ęéè]/g, "e")
      .replace(/[łl]/g, "l").replace(/[ńñ]/g, "n").replace(/[óöò]/g, "o")
      .replace(/[śš]/g, "s").replace(/[źżž]/g, "z")
      .replace(/[^a-z0-9-]/g, "");
    let slug = baseSlug;
    let counter = 1;
    while (await prisma.amenity.findUnique({ where: { propertyId_slug: { propertyId, slug } } })) {
      slug = `${baseSlug}-${counter++}`;
      if (counter > 50) return apiError("Nie udało się wygenerować unikalnego slug", 400, "VALIDATION");
    }

    // Position: max within category + 1
    const maxPos = await prisma.amenity.aggregate({
      where: { categoryId },
      _max: { position: true },
    });
    const position = (maxPos._max.position ?? -1) + 1;

    try {
      const amenity = await prisma.amenity.create({
        data: {
          propertyId,
          categoryId,
          name: name.trim(),
          slug,
          iconKey,
          position,
        },
        include: {
          category: { select: { id: true, name: true, slug: true } },
          _count: { select: { resources: true } },
        },
      });

      return apiSuccess({ amenity }, 201);
    } catch (createError: any) {
      // Race condition: slug taken between check and insert → 409
      if (createError?.code === "P2002") {
        return apiError("Udogodnienie o tej nazwie już istnieje (slug conflict)", 409, "CONFLICT");
      }
      throw createError;
    }
  } catch (error) {
    return apiServerError(error);
  }
}
