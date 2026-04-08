import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, createToken, setAuthCookie } from "@/lib/auth";
import { apiSuccess, apiError, apiUnauthorized, apiServerError } from "@/lib/api-response";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) return apiError("Email i hasło są wymagane");

    const user = await prisma.user.findUnique({ where: { email, isActive: true } });
    if (!user) return apiUnauthorized("Nieprawidłowy email lub hasło");

    const valid = await verifyPassword(password, user.password);
    if (!valid) return apiUnauthorized("Nieprawidłowy email lub hasło");

    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

    const token = createToken({
      id: user.id, email: user.email, firstName: user.firstName,
      lastName: user.lastName, role: user.role, avatar: user.avatar,
    });

    const response = apiSuccess({
      user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role },
    });
    response.headers.set("Set-Cookie", setAuthCookie(token));
    return response;
  } catch (error) {
    return apiServerError(error);
  }
}
