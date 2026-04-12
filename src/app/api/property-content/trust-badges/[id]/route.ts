/**
 * PATCH  /api/property-content/trust-badges/[id] — Update trust badge
 * DELETE /api/property-content/trust-badges/[id] — Delete trust badge
 *
 * B4: Trust badge management. Pattern from B3 amenities/[id].
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, apiNotFound, apiServerError } from "@/lib/api-response";
import { getAuthContext, hasMinRole } from "@/lib/require-auth";
import { isValidIconKey } from "@/lib/amenity-icons";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await getAuthContext();
    if (!auth) return apiError("Brak autoryzacji", 401, "UNAUTHORIZED");
    if (!hasMinRole(auth, "MANAGER")) return apiError("Brak uprawnień", 403, "FORBIDDEN");

    const existing = await prisma.trustBadge.findUnique({
      where: { id: params.id },
      select: { id: true, propertyId: true },
    });
    if (!existing) return apiNotFound("Badge nie znaleziony");

    const body = await request.json();
    const data: Record<string, unknown> = {};

    if (body.label !== undefined) {
      const label = typeof body.label === "string" ? body.label.trim() : "";
      if (!label) return apiError("Nazwa badge jest wymagana", 400, "VALIDATION");
      if (label.length > 100) return apiError("Nazwa badge: maksymalnie 100 znaków", 400, "VALIDATION");
      data.label = label;
    }

    if (body.iconKey !== undefined) {
      if (!body.iconKey) return apiError("Ikona jest wymagana", 400, "VALIDATION");
      if (!isValidIconKey(body.iconKey)) {
        return apiError(`Nieznana ikona: "${body.iconKey}"`, 400, "VALIDATION");
      }
      data.iconKey = body.iconKey;
    }

    if (body.description !== undefined) {
      if (body.description === null || body.description === "") {
        data.description = null;
      } else if (typeof body.description !== "string") {
        return apiError("Opis musi być tekstem", 400, "VALIDATION");
      } else if (body.description.trim().length > 300) {
        return apiError("Opis badge: maksymalnie 300 znaków", 400, "VALIDATION");
      } else {
        data.description = body.description.trim();
      }
    }

    if (body.isActive !== undefined) {
      data.isActive = Boolean(body.isActive);
    }

    if (Object.keys(data).length === 0) {
      return apiError("Brak pól do aktualizacji", 400, "VALIDATION");
    }

    const badge = await prisma.trustBadge.update({
      where: { id: params.id },
      data,
    });

    return apiSuccess({ trustBadge: badge });
  } catch (error) {
    return apiServerError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await getAuthContext();
    if (!auth) return apiError("Brak autoryzacji", 401, "UNAUTHORIZED");
    if (!hasMinRole(auth, "MANAGER")) return apiError("Brak uprawnień", 403, "FORBIDDEN");

    const existing = await prisma.trustBadge.findUnique({
      where: { id: params.id },
      select: { id: true },
    });
    if (!existing) return apiNotFound("Badge nie znaleziony");

    await prisma.trustBadge.delete({ where: { id: params.id } });
    return apiSuccess({ deleted: true });
  } catch (error) {
    return apiServerError(error);
  }
}
