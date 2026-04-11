/**
 * PUT /api/resources/[id]/amenities — Replace resource amenity assignments.
 *
 * Full replace pattern (deleteMany + createMany in transaction).
 * Same as PUT /resources/[id]/beds (§2.6 pattern).
 *
 * Body: { amenityIds: ["id1", "id2", ...] }
 *
 * Invariants:
 *   - All amenityIds must reference existing, active Amenity records
 *   - No duplicate amenityIds in payload
 *   - Max 100 amenities per resource
 *   - DB: @@unique([resourceId, amenityId])
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, apiNotFound, apiServerError } from "@/lib/api-response";
import { getAuthContext, hasMinRole } from "@/lib/require-auth";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Auth — MANAGER+
    const auth = await getAuthContext();
    if (!auth) return apiError("Brak autoryzacji", 401, "UNAUTHORIZED");
    if (!hasMinRole(auth, "MANAGER")) return apiError("Brak uprawnień", 403, "FORBIDDEN");

    const resourceId = params.id;
    const body = await request.json();
    const { amenityIds } = body;

    // Validate resource exists + get propertyId
    const resource = await prisma.resource.findUnique({
      where: { id: resourceId },
      select: { id: true, propertyId: true },
    });
    if (!resource) return apiNotFound("Zasób nie znaleziony");

    // Validate amenityIds array
    if (!Array.isArray(amenityIds)) {
      return apiError("Pole amenityIds musi być tablicą", 400, "VALIDATION");
    }

    if (amenityIds.length > 100) {
      return apiError("Maksymalnie 100 udogodnień na zasób", 400, "VALIDATION");
    }

    // Empty array = clear all amenities (valid operation)
    if (amenityIds.length === 0) {
      await prisma.resourceAmenity.deleteMany({ where: { resourceId } });
      return apiSuccess({ amenities: [] });
    }

    // Check for duplicates
    const uniqueIds = new Set(amenityIds);
    if (uniqueIds.size !== amenityIds.length) {
      return apiError("Lista amenityIds zawiera duplikaty", 400, "VALIDATION");
    }

    // Validate all amenityIds exist + isActive + same property
    const existingAmenities = await prisma.amenity.findMany({
      where: { id: { in: amenityIds } },
      select: { id: true, isActive: true, propertyId: true, name: true },
    });

    if (existingAmenities.length !== amenityIds.length) {
      const foundIds = new Set(existingAmenities.map((a) => a.id));
      const missing = amenityIds.filter((id: string) => !foundIds.has(id));
      return apiError(
        `Nieznane udogodnienia: ${missing.join(", ")}`,
        400,
        "VALIDATION"
      );
    }

    // Check isActive
    const inactive = existingAmenities.filter((a) => !a.isActive);
    if (inactive.length > 0) {
      return apiError(
        `Nieaktywne udogodnienia: ${inactive.map((a) => a.name).join(", ")}`,
        400,
        "VALIDATION"
      );
    }

    // Check propertyId scope (multi-property safe)
    if (resource.propertyId) {
      const wrongProperty = existingAmenities.filter((a) => a.propertyId !== resource.propertyId);
      if (wrongProperty.length > 0) {
        return apiError(
          `Udogodnienia z innego obiektu: ${wrongProperty.map((a) => a.name).join(", ")}`,
          400,
          "VALIDATION"
        );
      }
    }

    // Full replace in transaction (§2.6 pattern)
    const result = await prisma.$transaction(async (tx) => {
      await tx.resourceAmenity.deleteMany({ where: { resourceId } });

      await tx.resourceAmenity.createMany({
        data: amenityIds.map((amenityId: string) => ({
          resourceId,
          amenityId,
        })),
      });

      return tx.resourceAmenity.findMany({
        where: { resourceId },
        include: {
          amenity: {
            select: {
              id: true,
              name: true,
              slug: true,
              iconKey: true,
              category: {
                select: { id: true, name: true, slug: true },
              },
            },
          },
        },
      });
    });

    // Flatten for response
    const amenities = result.map((ra) => ({
      id: ra.amenity.id,
      name: ra.amenity.name,
      slug: ra.amenity.slug,
      iconKey: ra.amenity.iconKey,
      categoryId: ra.amenity.category.id,
      categoryName: ra.amenity.category.name,
      categorySlug: ra.amenity.category.slug,
    }));

    return apiSuccess({ amenities });
  } catch (error) {
    return apiServerError(error);
  }
}
