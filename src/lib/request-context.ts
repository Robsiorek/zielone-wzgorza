/**
 * Request Context — app access layer for requestId.
 *
 * Usage in route handlers:
 *   import { getRequestId } from "@/lib/request-context";
 *   const rid = getRequestId();
 *
 * requestId is set by middleware (ingress layer) on every request.
 * This helper reads it from Next.js headers().
 */

import { headers } from "next/headers";
import { NextRequest } from "next/server";

const REQUEST_ID_HEADER = "x-request-id";
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Get requestId from current request context (server components / route handlers).
 * Falls back to generating a new UUID if not available.
 */
export function getRequestId(): string {
  try {
    const headersList = headers();
    return headersList.get(REQUEST_ID_HEADER) || generateRequestId();
  } catch {
    // headers() not available outside request context
    return generateRequestId();
  }
}

/**
 * Get requestId from a NextRequest object (for use in route handlers
 * that receive the request parameter directly).
 */
export function getRequestIdFromRequest(request: NextRequest): string {
  return request.headers.get(REQUEST_ID_HEADER) || generateRequestId();
}

/**
 * Validate a client-supplied requestId.
 * Must be a valid UUID and under 128 characters.
 */
export function isValidRequestId(value: string): boolean {
  return value.length <= 128 && UUID_REGEX.test(value);
}

/**
 * Generate a new requestId (UUID v4).
 */
export function generateRequestId(): string {
  return crypto.randomUUID();
}

/**
 * Log a request start. Call at the beginning of route handlers.
 */
export function logRequestStart(method: string, path: string, requestId: string): void {
  console.log(`[rid=${requestId}] → ${method} ${path}`);
}

/**
 * Log a request end. Call before returning response.
 */
export function logRequestEnd(
  method: string,
  path: string,
  requestId: string,
  status: number,
  startTime: number,
): void {
  const duration = Date.now() - startTime;
  const level = status >= 500 ? "ERROR" : status >= 400 ? "WARN" : "INFO";
  console.log(`[rid=${requestId}] ← ${status} ${method} ${path} (${duration}ms) [${level}]`);
}
