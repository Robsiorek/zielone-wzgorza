/**
 * GET /api/public/resources-catalog — Public resource catalog for booking widget.
 *
 * E2: Returns resources visible in widget for public booking.
 * Triple filter: status=ACTIVE + visibleInWidget=true + category.type=ACCOMMODATION
 * Only resources with at least 1 active variant are returned.
 *
 * No auth required. Rate limited: 60 req/min per IP.
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiServerError } from "@/lib/api-response";
import { catalogLimiter } from "@/lib/rate-limiter";
import { getStorageProvider } from "@/lib/storage/media-storage";

export async function GET(request: NextRequest) {
  try {
    const limited = catalogLimiter.check(request);
    if (limited) return limited;

    const resources = await prisma.resource.findMany({
      where: {
        status: "ACTIVE",
        visibleInWidget: true,
        category: {
          isActive: true,
          type: "ACCOMMODATION",
        },
        variants: {
          some: { isActive: true },
        },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        unitNumber: true,
        description: true,
        shortDesc: true,
        maxCapacity: true,
        categoryId: true,
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            type: true,
          },
        },
        variants: {
          where: { isActive: true },
          orderBy: { sortOrder: "asc" },
          select: {
            id: true,
            name: true,
            capacity: true,
            isDefault: true,
            unitNumber: true,
          },
        },
        images: {
          orderBy: { position: "asc" },
          select: {
            id: true,
            storageKey: true,
            thumbnailKey: true,
            mediumKey: true,
            alt: true,
            position: true,
            isCover: true,
          },
        },
        amenities: {
          select: {
            id: true,
            name: true,
            icon: true,
          },
        },
      },
      orderBy: [
        { category: { sortOrder: "asc" } },
        { sortOrder: "asc" },
      ],
    });

    // Enrich images with runtime public URLs (ADR-11, ADR-12)
    const provider = getStorageProvider();
    const enrichedResources = resources.map((r) => ({
      ...r,
      images: r.images.map((img) => ({
        id: img.id,
        alt: img.alt,
        position: img.position,
        isCover: img.isCover,
        urls: {
          original: provider.getPublicUrl(img.storageKey),
          medium: provider.getPublicUrl(img.mediumKey),
          thumbnail: provider.getPublicUrl(img.thumbnailKey),
        },
      })),
    }));

    return apiSuccess({
      resources: enrichedResources,
      count: enrichedResources.length,
    });
  } catch (error) {
    return apiServerError(error);
  }
}
