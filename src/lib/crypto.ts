import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";

/** Generate cryptographically secure token — 64 hex chars (32 bytes) */
export function generateSecureToken(): string {
  return randomBytes(32).toString("hex");
}

/** Hash PIN with bcrypt (if provided) */
export async function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, 10);
}

/** Verify PIN against hash */
export async function verifyPin(pin: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pin, hash);
}
