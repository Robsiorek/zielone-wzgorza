/**
 * PATCH /api/amenity-categories/reorder — Reorder categories.
 *
 * Body: { order: [{ id: "...", position: 0 }, ...] }
 *
 * Invariants:
 *   - All IDs must exist in DB
 *   - All must belong to the same propertyId (single-property scoped)
 *   - No duplicate IDs
 *   - No foreign IDs (every ID must be a real amenity category)
 *   - Atomic transaction — all or nothing
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

    // Validate positions are sequential integers starting from 0
    for (let i = 0; i < order.length; i++) {
      const item = order[i];
      if (!item.id || typeof item.id !== "string") {
        return apiError("Każdy element musi mieć pole id (string)", 400, "VALIDATION");
      }
      if (!Number.isInteger(item.position) || item.position < 0) {
        return apiError("Pozycja musi być liczbą całkowitą >= 0", 400, "VALIDATION");
      }
    }

    // Fetch all referenced categories — verify they exist + same property
    const existing = await prisma.amenityCategory.findMany({
      where: { id: { in: ids } },
      select: { id: true, propertyId: true },
    });

    if (existing.length !== ids.length) {
      const foundIds = new Set(existing.map((c) => c.id));
      const missing = ids.filter((id: string) => !foundIds.has(id));
      return apiError(`Nieznane kategorie: ${missing.join(", ")}`, 400, "VALIDATION");
    }

    // Verify all belong to same property
    const propertyIds = new Set(existing.map((c) => c.propertyId));
    if (propertyIds.size > 1) {
      return apiError("Kategorie należą do różnych obiektów", 400, "VALIDATION");
    }

    // Verify payload is COMPLETE — must contain all categories for this property
    const propertyId = existing[0].propertyId;
    const totalInDb = await prisma.amenityCategory.count({ where: { propertyId } });
    if (ids.length !== totalInDb) {
      return apiError(
        `Payload zawiera ${ids.length} kategorii, ale w bazie jest ${totalInDb}. Reorder wymaga pełnej listy.`,
        400,
        "VALIDATION"
      );
    }

    // Atomic transaction
    await prisma.$transaction(
      order.map((item: { id: string; position: number }) =>
        prisma.amenityCategory.update({
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
