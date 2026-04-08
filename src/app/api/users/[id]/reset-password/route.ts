/**
 * POST /api/users/[id]/reset-password — Generate new temporary password (OWNER only)
 *
 * D0: Returns tempPassword ONCE in response. Not stored in plaintext.
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { apiSuccess, apiUnauthorized, apiForbidden, apiNotFound, apiServerError } from "@/lib/api-response";
import { getAuthContext, hasMinRole } from "@/lib/require-auth";

function generatePassword(length = 12): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%";
  let pw = "";
  for (let i = 0; i < length; i++) {
    pw += chars[Math.floor(Math.random() * chars.length)];
  }
  return pw;
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await getAuthContext();
    if (!auth) return apiUnauthorized();
    if (!hasMinRole(auth, "OWNER")) return apiForbidden("Tylko właściciel może resetować hasła");

    const userId = params.id;
    const existing = await prisma.user.findUnique({ where: { id: userId } });
    if (!existing) return apiNotFound("Użytkownik nie znaleziony");

    const tempPassword = generatePassword();
    const hashedPassword = await hashPassword(tempPassword);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword, mustChangePassword: true },
    });

    await prisma.auditLog.create({
      data: {
        userId: auth.user.id,
        action: "USER_PASSWORD_RESET",
        entity: "User",
        entityId: userId,
        changes: { email: existing.email, resetBy: auth.user.email },
      },
    });

    return apiSuccess({ tempPassword });
  } catch (error) {
    return apiServerError(error);
  }
}
