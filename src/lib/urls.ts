/**
 * URL helpers — all URLs built from ENV config.
 * Change domain/subdomain/path by editing .env only.
 *
 * ENV vars:
 *   NEXT_PUBLIC_ADMIN_BASE_URL  — admin panel (e.g. https://dev.zielonewzgorza.eu/admin)
 *   NEXT_PUBLIC_ENGINE_BASE_URL — public engine (e.g. https://dev.zielonewzgorza.eu)
 *   NEXT_PUBLIC_API_BASE_URL    — API root (e.g. https://dev.zielonewzgorza.eu/admin)
 *   NEXT_PUBLIC_FRONT_BASE_URL  — marketing site (e.g. https://zielonewzgorza.eu)
 */

function stripTrailingSlash(url: string): string {
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

function buildUrl(base: string, path: string): string {
  const cleanBase = stripTrailingSlash(base);
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${cleanBase}${cleanPath}`;
}

/** Admin panel URL — /admin/offers, /admin/clients etc. */
export function getAdminUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_ADMIN_BASE_URL
    || (typeof window !== "undefined" ? `${window.location.origin}/admin` : "http://localhost:3000/admin");
  return buildUrl(base, path);
}

/** Public engine URL — /offer/:token, /booking/:id, /pay/:id */
export function getEngineUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_ENGINE_BASE_URL
    || (typeof window !== "undefined" ? window.location.origin : "http://localhost:3000");
  return buildUrl(base, path);
}

/** API URL — /api/offers, /api/timeline etc. */
export function getApiUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL
    || (typeof window !== "undefined" ? window.location.origin : "http://localhost:3000");
  return buildUrl(base, path);
}

/** Marketing front URL — zielonewzgorza.eu/kontakt etc. */
export function getFrontUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_FRONT_BASE_URL || "https://zielonewzgorza.eu";
  return buildUrl(base, path);
}
