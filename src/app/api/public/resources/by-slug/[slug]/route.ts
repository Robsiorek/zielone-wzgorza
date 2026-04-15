/**
 * GET /api/public/resources/by-slug/[slug] — Public resource detail by slug.
 *
 * B5a: Public domain contract for headless engine.
 * Thin route adapter. Query + DTO mapping delegated to public-resource-service.
 *
 * Slug-based lookup for human-readable, SEO-neutral, front-agnostic URLs.
 * Same frozen DTO shape as /api/public/resources/[id].
 *
 * No auth required. Rate limited: 60 req/min per IP.
 * Only returns ACTIVE resources visible in widget.
 */

import { NextRequest } from "next/server";
import { apiSuccess, apiNotFound, apiServerError } from "@/lib/api-response";
import { catalogLimiter } from "@/lib/rate-limiter";
import { getPublicResourceBySlug } from "@/lib/public-resource-service";

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const limited = catalogLimiter.check(request);
    if (limited) return limited;

    const slug = params.slug?.trim();
    if (!slug) return apiNotFound("Zasób nie znaleziony");

    const resource = await getPublicResourceBySlug(slug);
    if (!resource) return apiNotFound("Zasób nie znaleziony");

    return apiSuccess({ resource });
  } catch (error) {
    return apiServerError(error);
  }
}
