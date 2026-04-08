/**
 * GET  /api/users — List users (OWNER only)
 * POST /api/users — Create user (OWNER only)
 *
 * D0: Master Plan 153, 155
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { apiSuccess, apiError, apiUnauthorized, apiForbidden, apiServerError } from "@/lib/api-response";
import { getAuthContext, hasMinRole } from "@/lib/require-auth";

function generatePassword(length = 12): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%";
  let pw = "";
  for (let i = 0; i < length; i++) {
    pw += chars[Math.floor(Math.random() * chars.length)];
  }
  return pw;
}

// ══════════════════════════════════════════════════════════════════════
// GET — List users
// ══════════════════════════════════════════════════════════════════════

export async function GET() {
  try {
    const auth = await getAuthContext();
    if (!auth) return apiUnauthorized();
    if (!hasMinRole(auth, "OWNER")) return apiForbidden("Tylko właściciel może zarządzać użytkownikami");

    const users = await prisma.user.findMany({
      select: {
        id: true, email: true, firstName: true, lastName: true,
        role: true, phone: true, avatar: true, isActive: true, lastLoginAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    });

    return apiSuccess({ users });
  } catch (error) {
    return apiServerError(error);
  }
}

// ══════════════════════════════════════════════════════════════════════
// POST — Create user
// ══════════════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth) return apiUnauthorized();
    if (!hasMinRole(auth, "OWNER")) return apiForbidden("Tylko właściciel może tworzyć użytkowników");

    const body = await request.json();

    if (!body.email?.trim()) return apiError("Email jest wymagany");
    if (!body.firstName?.trim()) return apiError("Imię jest wymagane");
    if (!body.lastName?.trim()) return apiError("Nazwisko jest wymagane");
    if (!body.role || !["OWNER", "MANAGER", "RECEPTION"].includes(body.role)) {
      return apiError("Nieprawidłowa rola. Dozwolone: OWNER, MANAGER, RECEPTION");
    }

    // Check duplicate email
    const existing = await prisma.user.findUnique({ where: { email: body.email.trim() } });
    if (existing) return apiError("Użytkownik z tym adresem email już istnieje");

    // Generate temporary password
    const tempPassword = generatePassword();
    const hashedPassword = await hashPassword(tempPassword);

    const user = await prisma.user.create({
      data: {
        email: body.email.trim().toLowerCase(),
        password: hashedPassword,
        firstName: body.firstName.trim(),
        lastName: body.lastName.trim(),
        role: body.role,
        phone: body.phone?.trim() || null,
        isActive: true,
        mustChangePassword: true,
      },
      select: {
        id: true, email: true, firstName: true, lastName: true,
        role: true, phone: true, isActive: true, createdAt: true,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: auth.user.id,
        action: "USER_CREATED",
        entity: "User",
        entityId: user.id,
        changes: { email: user.email, role: user.role, createdBy: auth.user.email },
      },
    });

    // Return tempPassword ONCE — UI shows "copy now, won't be shown again"
    return apiSuccess({ user, tempPassword }, 201);
  } catch (error) {
    return apiServerError(error);
  }
}
