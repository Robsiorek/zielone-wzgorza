/**
 * GET /api/public/resources/[id] — Public resource detail.
 *
 * Full resource data for detail page (B5 frontend).
 * Backend created in B2, UI in B5.
 *
 * Returns: resource + images (with URLs) + descriptions + technical data
 *   + beds (with labels) + variants + category + amenities.
 *
 * No auth required. Rate limited: 60 req/min per IP.
 * Only returns ACTIVE resources visible in widget.
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiNotFound, apiServerError } from "@/lib/api-response";
import { catalogLimiter } from "@/lib/rate-limiter";
import { getStorageProvider } from "@/lib/storage/media-storage";
import { getBedTypeLabel } from "@/lib/bed-types";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const limited = catalogLimiter.check(request);
    if (limited) return limited;

    const resource = await prisma.resource.findFirst({
      where: {
        id: params.id,
        status: "ACTIVE",
        visibleInWidget: true,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        unitNumber: true,
        shortDescription: true,
        longDescription: true,
        maxCapacity: true,
        areaSqm: true,
        bedroomCount: true,
        bathroomCount: true,
        floor: true,
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
            width: true,
            height: true,
          },
        },
        beds: {
          orderBy: { bedType: "asc" },
          select: {
            bedType: true,
            quantity: true,
          },
        },
        amenities: {
          where: { amenity: { isActive: true } },
          select: {
            amenity: {
              select: {
                id: true,
                slug: true,
                name: true,
                iconKey: true,
                category: { select: { slug: true } },
              },
            },
          },
        },
      },
    });

    if (!resource) return apiNotFound("Zasób nie znaleziony");

    // Enrich images with runtime URLs (ADR-11, ADR-12)
    const provider = getStorageProvider();
    const enrichedResource = {
      ...resource,
      images: resource.images.map((img) => ({
        id: img.id,
        alt: img.alt,
        position: img.position,
        isCover: img.isCover,
        width: img.width,
        height: img.height,
        urls: {
          original: provider.getPublicUrl(img.storageKey),
          medium: provider.getPublicUrl(img.mediumKey),
          thumbnail: provider.getPublicUrl(img.thumbnailKey),
        },
      })),
      beds: resource.beds.map((bed) => ({
        bedType: bed.bedType,
        quantity: bed.quantity,
        label: getBedTypeLabel(bed.bedType),
      })),
      // B3: Flatten ResourceAmenity → frozen public shape
      amenities: resource.amenities.map((ra) => ({
        id: ra.amenity.id,
        slug: ra.amenity.slug,
        name: ra.amenity.name,
        icon: ra.amenity.iconKey,
        categorySlug: ra.amenity.category.slug,
      })),
    };

    return apiSuccess({ resource: enrichedResource });
  } catch (error) {
    return apiServerError(error);
  }
}
