/**
 * PATCH /api/resource-categories/[id] — Update category (including time overrides)
 *
 * D 159-162: checkInTimeOverride / checkOutTimeOverride
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, apiUnauthorized, apiForbidden, apiNotFound, apiServerError } from "@/lib/api-response";
import { getAuthContext, hasMinRole } from "@/lib/require-auth";
import { isValidTimeFormat } from "@/lib/operational-times";

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await getAuthContext();
    if (!auth) return apiUnauthorized();
    if (!hasMinRole(auth, "OWNER")) return apiForbidden();

    const body = await request.json();
    const categoryId = params.id;

    const existing = await prisma.resourceCategory.findUnique({ where: { id: categoryId } });
    if (!existing) return apiNotFound("Kategoria nie znaleziona");

    const updateData: any = {};

    // Time overrides (null = use global)
    if (body.checkInTimeOverride !== undefined) {
      const val = body.checkInTimeOverride || null;
      if (val && !isValidTimeFormat(val)) return apiError("Nieprawidłowy format godziny zameldowania (HH:MM)");
      updateData.checkInTimeOverride = val;
    }
    if (body.checkOutTimeOverride !== undefined) {
      const val = body.checkOutTimeOverride || null;
      if (val && !isValidTimeFormat(val)) return apiError("Nieprawidłowy format godziny wymeldowania (HH:MM)");
      updateData.checkOutTimeOverride = val;
    }

    if (Object.keys(updateData).length === 0) return apiError("Brak pól do aktualizacji");

    const category = await prisma.resourceCategory.update({
      where: { id: categoryId },
      data: updateData,
    });

    return apiSuccess({ category });
  } catch (error) {
    return apiServerError(error);
  }
}
