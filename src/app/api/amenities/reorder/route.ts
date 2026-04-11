/**
 * PATCH /api/amenities/reorder — Reorder amenities within a category.
 *
 * Body: { order: [{ id: "...", position: 0 }, ...] }
 *
 * Invariants:
 *   - All IDs must exist in DB
 *   - All must belong to the SAME categoryId (within-category reorder only)
 *   - All must belong to the same propertyId
 *   - No duplicate IDs
 *   - Atomic transaction
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, apiServerError } from "@/lib/api-response";
import { getAuthContext, hasMinRole } from "@/lib/require-auth";

export async function PATCH(request: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth) return apiError("Brak autoryzacji", 401, "UNAUTHORIZED");
    if (!hasMinRole(auth, "MANAGER")) return apiError("Brak uprawnień", 403, "FORBIDDEN");

    const { order } = await request.json();

    if (!order || !Array.isArray(order) || order.length === 0) {
      return apiError("Tablica kolejności jest wymagana", 400, "VALIDATION");
    }

    // Validate no duplicate IDs
    const ids = order.map((item: { id: string }) => item.id);
    const uniqueIds = new Set(ids);
    if (uniqueIds.size !== ids.length) {
      return apiError("Lista zawiera duplikaty ID", 400, "VALIDATION");
    }

    // Validate positions are integers >= 0
    for (const item of order) {
      if (!item.id || typeof item.id !== "string") {
        return apiError("Każdy element musi mieć pole id (string)", 400, "VALIDATION");
      }
      if (!Number.isInteger(item.position) || item.position < 0) {
        return apiError("Pozycja musi być liczbą całkowitą >= 0", 400, "VALIDATION");
      }
    }

    // Fetch all referenced amenities — verify they exist + same category + same property
    const existing = await prisma.amenity.findMany({
      where: { id: { in: ids } },
      select: { id: true, categoryId: true, propertyId: true },
    });

    if (existing.length !== ids.length) {
      const foundIds = new Set(existing.map((a) => a.id));
      const missing = ids.filter((id: string) => !foundIds.has(id));
      return apiError(`Nieznane udogodnienia: ${missing.join(", ")}`, 400, "VALIDATION");
    }

    // Verify all belong to same category (within-category reorder)
    const categoryIds = new Set(existing.map((a) => a.categoryId));
    if (categoryIds.size > 1) {
      return apiError(
        "Reorder dozwolony tylko w obrębie jednej kategorii. Przesłane udogodnienia należą do różnych kategorii.",
        400,
        "VALIDATION"
      );
    }

    // Verify all belong to same property
    const propertyIds = new Set(existing.map((a) => a.propertyId));
    if (propertyIds.size > 1) {
      return apiError("Udogodnienia należą do różnych obiektów", 400, "VALIDATION");
    }

    // Verify payload is COMPLETE — must contain all amenities for this category
    const categoryId = existing[0].categoryId;
    const totalInDb = await prisma.amenity.count({ where: { categoryId } });
    if (ids.length !== totalInDb) {
      return apiError(
        `Payload zawiera ${ids.length} udogodnień, ale kategoria ma ${totalInDb}. Reorder wymaga pełnej listy.`,
        400,
        "VALIDATION"
      );
    }

    // Atomic transaction
    await prisma.$transaction(
      order.map((item: { id: string; position: number }) =>
        prisma.amenity.update({
          where: { id: item.id },
          data: { position: item.position },
        })
      )
    );

    return apiSuccess({ updated: order.length });
  } catch (error) {
    return apiServerError(error);
  }
}
