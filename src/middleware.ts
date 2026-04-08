import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Ingress layer: generate/validate X-Request-Id, then route guard.
 *
 * Every response gets X-Request-Id header. Every request gets
 * x-request-id propagated to route handlers via request headers.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── requestId: ingress layer ──
  const clientId = request.headers.get("x-request-id") || "";
  const requestId =
    clientId.length <= 128 && UUID_REGEX.test(clientId)
      ? clientId
      : crypto.randomUUID();

  // Propagate requestId to route handlers via request headers
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-request-id", requestId);

  // Helper: create NextResponse.next() with requestId on both request and response
  const next = () => {
    const response = NextResponse.next({ request: { headers: requestHeaders } });
    response.headers.set("X-Request-Id", requestId);
    return response;
  };

  // Helper: create JSON error response with requestId
  const jsonError = (body: Record<string, unknown>, status: number) => {
    const response = NextResponse.json({ ...body, requestId }, { status });
    response.headers.set("X-Request-Id", requestId);
    return response;
  };

  // Helper: create redirect with requestId
  const redirect = (url: URL) => {
    const response = NextResponse.redirect(url);
    response.headers.set("X-Request-Id", requestId);
    return response;
  };

  // ── Route guard (existing logic) ──

  if (pathname.startsWith("/_next") || pathname.startsWith("/favicon") || pathname.includes(".")) {
    return next();
  }

  if (pathname.startsWith("/offer/") || pathname.startsWith("/booking") || pathname.startsWith("/reservation/") || pathname.startsWith("/pay/")) {
    return next();
  }

  if (pathname.startsWith("/api/public/") || pathname.startsWith("/api/auth/") || pathname === "/api/health") {
    return next();
  }

  // Internal endpoints (cron jobs) — secured by x-cron-secret header
  if (pathname.startsWith("/api/internal/")) {
    const cronSecret = process.env.CRON_SECRET;
    const headerSecret = request.headers.get("x-cron-secret");
    if (!cronSecret || headerSecret !== cronSecret) {
      return jsonError({ error: "Unauthorized" }, 401);
    }
    return next();
  }

  if (pathname.startsWith("/api/")) {
    const token = request.cookies.get("zw_admin_token")?.value;
    if (!token) return jsonError({ error: "Unauthorized" }, 401);
    return next();
  }

  if (pathname === "/admin/login") {
    return next();
  }

  if (!pathname.startsWith("/admin")) {
    return next();
  }

  const token = request.cookies.get("zw_admin_token")?.value;
  if (!token) {
    const loginUrl = new URL("/admin/login", request.url);
    return redirect(loginUrl);
  }

  return next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
