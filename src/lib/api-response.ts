import { NextResponse } from "next/server";
import { getRequestId } from "@/lib/request-context";

/**
 * Standard API response format.
 * Every endpoint uses this — no exceptions.
 *
 * Success: { success: true, data: {...}, error: null, code: null }
 * Error:   { success: false, data: null, error: "message", code: "ERROR_CODE", requestId: "uuid" }
 *
 * Error codes:
 *   VALIDATION  — 400 — invalid input
 *   CONFLICT    — 409 — resource overlap / availability conflict
 *   NOT_FOUND   — 404 — resource not found
 *   UNAUTHORIZED — 401 — not logged in
 *   SERVER_ERROR — 500 — unexpected
 *
 * requestId is included in ALL error responses for debugging.
 * Success responses omit requestId (available via X-Request-Id header).
 */

export function apiSuccess(data: any, status: number = 200) {
  return NextResponse.json({ success: true, data, error: null, code: null }, { status });
}

export function apiError(error: string, status: number = 400, code: string = "VALIDATION") {
  let requestId: string | undefined;
  try { requestId = getRequestId(); } catch { /* outside request context */ }
  return NextResponse.json(
    { success: false, data: null, error, code, ...(requestId ? { requestId } : {}) },
    { status },
  );
}

export function apiNotFound(message: string = "Nie znaleziono") {
  return apiError(message, 404, "NOT_FOUND");
}

export function apiConflict(message: string = "Konflikt dostępności") {
  return apiError(message, 409, "CONFLICT");
}

export function apiUnauthorized(message: string = "Brak autoryzacji") {
  return apiError(message, 401, "UNAUTHORIZED");
}

export function apiForbidden(message: string = "Brak uprawnień") {
  return apiError(message, 403, "FORBIDDEN");
}

/** Check if error is a PostgreSQL exclusion constraint violation. */
export function isOverlapViolation(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const err = error as { code?: string; meta?: { code?: string }; message?: string };
  if (err.code === "23P01") return true;
  if (err.meta?.code === "23P01") return true;
  if (typeof err.message === "string" && err.message.includes("no_resource_overlap")) return true;
  if (typeof err.message === "string" && err.message.includes("exclusion")) return true;
  return false;
}

/** Handle errors from API routes. Recognizes ConflictError, ValidationError, DB constraint. */
export function apiServerError(error: unknown) {
  // ConflictError from timeline-service
  if (error instanceof Error && error.name === "ConflictError") {
    return apiConflict(error.message);
  }
  // ValidationError from timeline-service
  if (error instanceof Error && error.name === "ValidationError") {
    return apiError(error.message, 400, "VALIDATION");
  }
  // DB exclusion constraint violation
  if (isOverlapViolation(error)) {
    return apiConflict("Ten termin jest już zajęty dla tego zasobu");
  }
  // Application-level thrown errors (e.g. from $transaction)
  if (error instanceof Error && !error.message.includes("Internal")) {
    return apiError(error.message, 400, "VALIDATION");
  }
  const message = error instanceof Error ? error.message : "Wewnętrzny błąd serwera";
  let requestId: string | undefined;
  try { requestId = getRequestId(); } catch { /* outside request context */ }
  console.error(`[rid=${requestId || "unknown"}] API Error:`, error);
  return apiError(message, 500, "SERVER_ERROR");
}
