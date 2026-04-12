/**
 * PATCH /api/property-content/trust-badges/reorder — Reorder trust badges.
 *
 * Body: { order: [{ id: "...", position: 0 }, ...] }
 *
 * B4: Same 7-step validation as B3 amenities/reorder (ADR-18).
 * Completeness check: payload count === DB count for property.
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, apiServerError } from "@/lib/api-response";
import { getAuthContext, hasMinRole } from "@/lib/require-auth";

export async function PATCH(request: NextRequest) {
  try {
    // Step 1: Auth MANAGER+
    const auth = await getAuthContext();
    if (!auth) return apiError("Brak autoryzacji", 401, "UNAUTHORIZED");
    if (!hasMinRole(auth, "MANAGER")) return apiError("Brak uprawnień", 403, "FORBIDDEN");

    const { order } = await request.json();

    // Step 2: Array niepusty
    if (!order || !Array.isArray(order) || order.length === 0) {
      return apiError("Tablica kolejności jest wymagana", 400, "VALIDATION");
    }

    // Step 3: No duplicate IDs
    const ids = order.map((item: { id: string }) => item.id);
    const uniqueIds = new Set(ids);
    if (uniqueIds.size !== ids.length) {
      return apiError("Lista zawiera duplikaty ID", 400, "VALIDATION");
    }

    // Step 4: id + position format
    for (const item of order) {
      if (!item.id || typeof item.id !== "string") {
        return apiError("Każdy element musi mieć pole id (string)", 400, "VALIDATION");
      }
      if (!Number.isInteger(item.position) || item.position < 0) {
        return apiError("Pozycja musi być liczbą całkowitą >= 0", 400, "VALIDATION");
      }
    }

    // Step 5: All exist in DB
    const existing = await prisma.trustBadge.findMany({
      where: { id: { in: ids } },
      select: { id: true, propertyId: true },
    });

    if (existing.length !== ids.length) {
      const foundIds = new Set(existing.map((b) => b.id));
      const missing = ids.filter((id: string) => !foundIds.has(id));
      return apiError(`Nieznane badge: ${missing.join(", ")}`, 400, "VALIDATION");
    }

    // Step 6: Same propertyId scope
    const propertyIds = new Set(existing.map((b) => b.propertyId));
    if (propertyIds.size > 1) {
      return apiError("Badge należą do różnych obiektów", 400, "VALIDATION");
    }

    // Step 7: Completeness check — payload count === DB count
    const propertyId = existing[0].propertyId;
    const totalInDb = await prisma.trustBadge.count({ where: { propertyId } });
    if (ids.length !== totalInDb) {
      return apiError(
        `Payload zawiera ${ids.length} badge, ale obiekt ma ${totalInDb}. Reorder wymaga pełnej listy.`,
        400,
        "VALIDATION"
      );
    }

    // Atomic transaction
    await prisma.$transaction(
      order.map((item: { id: string; position: number }) =>
        prisma.trustBadge.update({
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
