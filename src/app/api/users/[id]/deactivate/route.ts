/**
 * POST /api/users/[id]/deactivate — Deactivate user (OWNER only, not self)
 *
 * D0: Sets isActive=false. getCurrentUser() checks isActive,
 * so deactivated user loses access immediately on next request.
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, apiUnauthorized, apiForbidden, apiNotFound, apiServerError } from "@/lib/api-response";
import { getAuthContext, hasMinRole } from "@/lib/require-auth";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await getAuthContext();
    if (!auth) return apiUnauthorized();
    if (!hasMinRole(auth, "OWNER")) return apiForbidden("Tylko właściciel może deaktywować użytkowników");

    const userId = params.id;

    if (userId === auth.user.id) {
      return apiError("Nie możesz deaktywować samego siebie");
    }

    const existing = await prisma.user.findUnique({ where: { id: userId } });
    if (!existing) return apiNotFound("Użytkownik nie znaleziony");

    const body = await request.json().catch(() => ({}));
    const activate = body.activate === true;

    const user = await prisma.user.update({
      where: { id: userId },
      data: { isActive: activate },
      select: {
        id: true, email: true, firstName: true, lastName: true,
        role: true, isActive: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: auth.user.id,
        action: activate ? "USER_ACTIVATED" : "USER_DEACTIVATED",
        entity: "User",
        entityId: userId,
        changes: {
          email: existing.email,
          action: activate ? "activate" : "deactivate",
          changedBy: auth.user.email,
        },
      },
    });

    return apiSuccess({ user });
  } catch (error) {
    return apiServerError(error);
  }
}
