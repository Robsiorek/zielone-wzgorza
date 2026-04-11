/**
 * PATCH  /api/amenities/[id] — Update amenity
 * DELETE /api/amenities/[id] — Delete amenity (Restrict if assigned to resources)
 *
 * B3: Amenity management.
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

    const existing = await prisma.amenity.findUnique({
      where: { id: params.id },
      select: { id: true, propertyId: true },
    });
    if (!existing) return apiNotFound("Udogodnienie nie znalezione");

    const body = await request.json();
    const data: Record<string, unknown> = {};

    if (body.name !== undefined) {
      const name = typeof body.name === "string" ? body.name.trim() : "";
      if (!name) return apiError("Nazwa udogodnienia jest wymagana", 400, "VALIDATION");
      if (name.length > 100) return apiError("Nazwa: maksymalnie 100 znaków", 400, "VALIDATION");
      data.name = name;
    }

    if (body.iconKey !== undefined) {
      if (!body.iconKey) return apiError("Ikona jest wymagana", 400, "VALIDATION");
      if (!isValidIconKey(body.iconKey)) {
        return apiError(`Nieznana ikona: "${body.iconKey}"`, 400, "VALIDATION");
      }
      data.iconKey = body.iconKey;
    }

    if (body.categoryId !== undefined) {
      const cat = await prisma.amenityCategory.findUnique({
        where: { id: body.categoryId },
        select: { id: true, propertyId: true, isActive: true, name: true },
      });
      if (!cat) return apiError("Kategoria nie znaleziona", 400, "VALIDATION");
      // Multi-property safe: category must belong to same property as amenity
      if (cat.propertyId !== existing.propertyId) {
        return apiError(
          `Kategoria "${cat.name}" należy do innego obiektu`,
          400,
          "VALIDATION"
        );
      }
      // Block reassignment to inactive category
      if (!cat.isActive) {
        return apiError(
          `Kategoria "${cat.name}" jest nieaktywna`,
          400,
          "VALIDATION"
        );
      }
      data.categoryId = body.categoryId;
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
      const amenity = await prisma.amenity.update({
        where: { id: params.id },
        data,
        include: {
          category: { select: { id: true, name: true, slug: true } },
          _count: { select: { resources: true } },
        },
      });

      return apiSuccess({ amenity });
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

    const existing = await prisma.amenity.findUnique({
      where: { id: params.id },
      include: { _count: { select: { resources: true } } },
    });
    if (!existing) return apiNotFound("Udogodnienie nie znalezione");

    // Restrict: cannot delete if assigned to resources → 409 Conflict
    if (existing._count.resources > 0) {
      return apiError(
        `Nie można usunąć "${existing.name}" — jest przypisane do ${existing._count.resources} zasobów. Najpierw odepnij udogodnienie od zasobów.`,
        409,
        "CONFLICT"
      );
    }

    await prisma.amenity.delete({ where: { id: params.id } });
    return apiSuccess({ deleted: true });
  } catch (error) {
    return apiServerError(error);
  }
}
