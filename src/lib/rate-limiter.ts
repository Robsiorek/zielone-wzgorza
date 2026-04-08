/**
 * Rate Limiter — in-memory, per IP, for public endpoints.
 *
 * E1: Protects /api/public/* from abuse.
 * Sliding window: tracks timestamps per IP, prunes old entries.
 * Returns 429 when limit exceeded.
 *
 * Usage:
 *   const limiter = createRateLimiter({ windowMs: 60000, maxRequests: 60 });
 *   // In route handler:
 *   const limited = limiter.check(request);
 *   if (limited) return limited; // 429 Response
 *
 * Limitations: in-memory, per-process. Resets on PM2 restart.
 * Future: swap to Redis for multi-process/multi-server.
 */

import { NextRequest } from "next/server";

interface RateLimiterConfig {
  windowMs: number;    // time window in ms (e.g. 60000 = 1 min)
  maxRequests: number; // max requests per window per IP
}

interface RateLimiterInstance {
  check(request: NextRequest): Response | null;
}

const ipMap = new Map<string, Map<string, number[]>>();

// Cleanup stale IPs every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [limiterId, ips] of ipMap) {
    for (const [ip, timestamps] of ips) {
      const fresh = timestamps.filter(t => now - t < 300000); // 5 min
      if (fresh.length === 0) {
        ips.delete(ip);
      } else {
        ips.set(ip, fresh);
      }
    }
    if (ips.size === 0) ipMap.delete(limiterId);
  }
}, 300000);

let limiterCounter = 0;

export function createRateLimiter(config: RateLimiterConfig): RateLimiterInstance {
  const limiterId = `limiter_${++limiterCounter}`;
  ipMap.set(limiterId, new Map());

  return {
    check(request: NextRequest): Response | null {
      const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
        || request.headers.get("x-real-ip")
        || "unknown";

      const ips = ipMap.get(limiterId) || (() => { const m = new Map<string, number[]>(); ipMap.set(limiterId, m); return m; })();
      const now = Date.now();

      // Get or create timestamps for this IP
      let timestamps = ips.get(ip) || [];

      // Prune old timestamps outside window
      timestamps = timestamps.filter(t => now - t < config.windowMs);

      if (timestamps.length >= config.maxRequests) {
        const retryAfter = Math.ceil((timestamps[0] + config.windowMs - now) / 1000);
        return new Response(
          JSON.stringify({
            success: false,
            error: "Zbyt wiele zapytań. Spróbuj ponownie za chwilę.",
            code: "RATE_LIMITED",
          }),
          {
            status: 429,
            headers: {
              "Content-Type": "application/json",
              "Retry-After": String(Math.max(1, retryAfter)),
              "X-RateLimit-Limit": String(config.maxRequests),
              "X-RateLimit-Remaining": "0",
              "X-RateLimit-Reset": String(Math.ceil((timestamps[0] + config.windowMs) / 1000)),
            },
          }
        );
      }

      // Record this request
      timestamps.push(now);
      ips.set(ip, timestamps);

      return null; // not limited
    },
  };
}

// ── Pre-configured limiters for public endpoints ──

/** 60 req/min — availability (read-only, cacheable) */
export const availabilityLimiter = createRateLimiter({ windowMs: 60000, maxRequests: 60 });

/** 30 req/min — quote-preview (batch, heavier) */
export const quotePreviewLimiter = createRateLimiter({ windowMs: 60000, maxRequests: 30 });

/** 10 req/min — quote (full calculation + DB write) */
export const quoteLimiter = createRateLimiter({ windowMs: 60000, maxRequests: 10 });

/** 5 req/min — book (reservation creation, heaviest) */
export const bookLimiter = createRateLimiter({ windowMs: 60000, maxRequests: 5 });

/** 60 req/min — resources catalog (read-only, cacheable) */
export const catalogLimiter = createRateLimiter({ windowMs: 60000, maxRequests: 60 });
