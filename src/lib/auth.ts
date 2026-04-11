import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { prisma } from "./prisma";

if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET environment variable is required");
const JWT_SECRET: string = process.env.JWT_SECRET;
const TOKEN_NAME = "zw_admin_token";
const TOKEN_EXPIRY = 60 * 60 * 24 * 7;

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;  // UserRole: OWNER | MANAGER | RECEPTION
  avatar: string | null;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function createToken(user: AuthUser): string {
  return jwt.sign({ sub: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

export function verifyToken(token: string): { sub: string; email: string; role: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { sub: string; email: string; role: string };
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(TOKEN_NAME)?.value;
    if (!token) return null;
    const payload = verifyToken(token);
    if (!payload) return null;
    const user = await prisma.user.findUnique({
      where: { id: payload.sub, isActive: true },
      select: { id: true, email: true, firstName: true, lastName: true, role: true, avatar: true },
    });
    return user;
  } catch {
    return null;
  }
}

export function setAuthCookie(token: string): string {
  return `${TOKEN_NAME}=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${TOKEN_EXPIRY}`;
}

export function clearAuthCookie(): string {
  return `${TOKEN_NAME}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`;
}
