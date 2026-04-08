/**
 * PATCH /api/users/[id] — Edit user (OWNER only)
 *
 * D0: Master Plan 153
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, apiUnauthorized, apiForbidden, apiNotFound, apiServerError } from "@/lib/api-response";
import { getAuthContext, hasMinRole } from "@/lib/require-auth";

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await getAuthContext();
    if (!auth) return apiUnauthorized();
    if (!hasMinRole(auth, "OWNER")) return apiForbidden("Tylko właściciel może edytować użytkowników");

    const body = await request.json();
    const userId = params.id;

    const existing = await prisma.user.findUnique({ where: { id: userId } });
    if (!existing) return apiNotFound("Użytkownik nie znaleziony");

    // Validate role if changing
    if (body.role && !["OWNER", "MANAGER", "RECEPTION"].includes(body.role)) {
      return apiError("Nieprawidłowa rola");
    }

    // Check email uniqueness if changing
    if (body.email && body.email.trim().toLowerCase() !== existing.email) {
      const dup = await prisma.user.findUnique({ where: { email: body.email.trim().toLowerCase() } });
      if (dup) return apiError("Użytkownik z tym adresem email już istnieje");
    }

    const updateData: any = {};
    if (body.firstName !== undefined) updateData.firstName = body.firstName.trim();
    if (body.lastName !== undefined) updateData.lastName = body.lastName.trim();
    if (body.email !== undefined) updateData.email = body.email.trim().toLowerCase();
    if (body.phone !== undefined) updateData.phone = body.phone?.trim() || null;
    if (body.role !== undefined) updateData.role = body.role;

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true, email: true, firstName: true, lastName: true,
        role: true, phone: true, isActive: true, createdAt: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: auth.user.id,
        action: "USER_UPDATED",
        entity: "User",
        entityId: userId,
        changes: { fields: Object.keys(updateData), updatedBy: auth.user.email },
      },
    });

    return apiSuccess({ user });
  } catch (error) {
    return apiServerError(error);
  }
}
