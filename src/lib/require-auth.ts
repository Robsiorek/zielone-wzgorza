/**
 * requireAuth — route handler helper for authentication + authorization.
 *
 * D0: Returns { user, permissions } or throws ApiError (401/403).
 * Uses getCurrentUser() which already checks isActive.
 *
 * Usage in route:
 *   const { user, permissions } = await requireAuth();
 *   if (!permissions.includes("confirm")) return apiForbidden();
 */

import { getCurrentUser, type AuthUser } from "@/lib/auth";
import { getPaymentPermissions, type PaymentPermission } from "@/lib/payment-service";
import { apiUnauthorized, apiForbidden } from "@/lib/api-response";

export interface AuthContext {
  user: AuthUser;
  permissions: PaymentPermission[];
}

/**
 * Get authenticated user + permissions.
 * Returns null if not authenticated (caller should return apiUnauthorized).
 */
export async function getAuthContext(): Promise<AuthContext | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  const permissions = getPaymentPermissions(user.role);
  return { user, permissions };
}

/**
 * Check if user has specific permission.
 */
export function hasPermission(ctx: AuthContext, perm: PaymentPermission): boolean {
  return ctx.permissions.includes(perm);
}

/**
 * Check if user role is at least the given role.
 * OWNER > MANAGER > RECEPTION
 * Use for non-payment access control (e.g., CRUD users = OWNER only).
 */
const ROLE_HIERARCHY: Record<string, number> = {
  RECEPTION: 1,
  MANAGER: 2,
  OWNER: 3,
};

export function hasMinRole(ctx: AuthContext, minRole: string): boolean {
  const userLevel = ROLE_HIERARCHY[ctx.user.role] || 0;
  const requiredLevel = ROLE_HIERARCHY[minRole] || 99;
  return userLevel >= requiredLevel;
}
