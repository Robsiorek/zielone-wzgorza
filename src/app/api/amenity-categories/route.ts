/**
 * GET  /api/amenity-categories — List all amenity categories
 * POST /api/amenity-categories — Create a new category
 *
 * B3: Categories group amenities (e.g. ROOM_FEATURES, KITCHEN).
 * Property-scoped (single property for now).
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

export async function GET() {
  try {
    const auth = await getAuthContext();
    if (!auth) return apiError("Brak autoryzacji", 401, "UNAUTHORIZED");

    const propertyId = await getPropertyId();

    const categories = await prisma.amenityCategory.findMany({
      where: { propertyId },
      orderBy: { position: "asc" },
      include: {
        _count: { select: { amenities: true } },
      },
    });

    return apiSuccess({ categories });
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
    const { name, iconKey } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return apiError("Nazwa kategorii jest wymagana", 400, "VALIDATION");
    }

    if (name.trim().length > 100) {
      return apiError("Nazwa kategorii: maksymalnie 100 znaków", 400, "VALIDATION");
    }

    if (iconKey && !isValidIconKey(iconKey)) {
      return apiError(`Nieznana ikona: "${iconKey}"`, 400, "VALIDATION");
    }

    const propertyId = await getPropertyId();

    // Generate slug (polish-safe transliteration)
    const baseSlug = name.trim().toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[ąáà]/g, "a").replace(/[ćč]/g, "c").replace(/[ęéè]/g, "e")
      .replace(/[łl]/g, "l").replace(/[ńñ]/g, "n").replace(/[óöò]/g, "o")
      .replace(/[śš]/g, "s").replace(/[źżž]/g, "z")
      .replace(/[^a-z0-9-]/g, "");
    let slug = baseSlug;
    let counter = 1;
    while (await prisma.amenityCategory.findUnique({ where: { propertyId_slug: { propertyId, slug } } })) {
      slug = `${baseSlug}-${counter++}`;
      if (counter > 50) return apiError("Nie udało się wygenerować unikalnego slug", 400, "VALIDATION");
    }

    // Position: max + 1
    const maxPos = await prisma.amenityCategory.aggregate({
      where: { propertyId },
      _max: { position: true },
    });
    const position = (maxPos._max.position ?? -1) + 1;

    try {
      const category = await prisma.amenityCategory.create({
        data: {
          propertyId,
          name: name.trim(),
          slug,
          iconKey: iconKey || null,
          position,
        },
        include: {
          _count: { select: { amenities: true } },
        },
      });

      return apiSuccess({ category }, 201);
    } catch (createError: any) {
      // Race condition: slug taken between check and insert → 409
      if (createError?.code === "P2002") {
        return apiError("Kategoria o tej nazwie już istnieje (slug conflict)", 409, "CONFLICT");
      }
      throw createError;
    }
  } catch (error) {
    return apiServerError(error);
  }
}
