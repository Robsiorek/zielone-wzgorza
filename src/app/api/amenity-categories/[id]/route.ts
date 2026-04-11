/**
 * PATCH  /api/amenity-categories/[id] — Update category
 * DELETE /api/amenity-categories/[id] — Delete category (Restrict if has amenities)
 *
 * B3: Category management.
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

    const existing = await prisma.amenityCategory.findUnique({
      where: { id: params.id },
    });
    if (!existing) return apiNotFound("Kategoria nie znaleziona");

    const body = await request.json();
    const data: Record<string, unknown> = {};

    if (body.name !== undefined) {
      const name = typeof body.name === "string" ? body.name.trim() : "";
      if (!name) return apiError("Nazwa kategorii jest wymagana", 400, "VALIDATION");
      if (name.length > 100) return apiError("Nazwa kategorii: maksymalnie 100 znaków", 400, "VALIDATION");
      data.name = name;
    }

    if (body.iconKey !== undefined) {
      if (body.iconKey && !isValidIconKey(body.iconKey)) {
        return apiError(`Nieznana ikona: "${body.iconKey}"`, 400, "VALIDATION");
      }
      data.iconKey = body.iconKey || null;
    }

    if (body.isActive !== undefined) {
      data.isActive = Boolean(body.isActive);
    }

    if (body.position !== undefined) {
      const pos = parseInt(body.position);
      if (!Number.isInteger(pos) || pos < 0) {
        return apiError("Pozycja musi być liczbą >= 0", 400, "VALIDATION");
      }
      data.position = pos;
    }

    try {
      const category = await prisma.amenityCategory.update({
        where: { id: params.id },
        data,
        include: {
          _count: { select: { amenities: true } },
        },
      });

      return apiSuccess({ category });
    } catch (updateError: any) {
      if (updateError?.code === "P2002") {
        return apiError("Konflikt unikalności (slug lub inna unikalna wartość)", 409, "CONFLICT");
      }
      throw updateError;
    }
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

    const existing = await prisma.amenityCategory.findUnique({
      where: { id: params.id },
      include: { _count: { select: { amenities: true } } },
    });
    if (!existing) return apiNotFound("Kategoria nie znaleziona");

    // Restrict: cannot delete if has amenities → 409 Conflict
    if (existing._count.amenities > 0) {
      return apiError(
        `Nie można usunąć kategorii "${existing.name}" — zawiera ${existing._count.amenities} udogodnień. Najpierw usuń lub przenieś udogodnienia.`,
        409,
        "CONFLICT"
      );
    }

    await prisma.amenityCategory.delete({ where: { id: params.id } });
    return apiSuccess({ deleted: true });
  } catch (error) {
    return apiServerError(error);
  }
}
