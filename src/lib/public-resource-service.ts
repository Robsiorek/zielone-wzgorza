/**
 * public-resource-service.ts — Shared query + DTO mapper for public resource detail.
 *
 * B5a: Single source of truth for resource detail query and public DTO shape.
 * Used by:
 *   - GET /api/public/resources/[id]   (lookup by UUID)
 *   - GET /api/public/resources/by-slug/[slug] (lookup by slug)
 *
 * Design decisions:
 *   - One Prisma select definition (RESOURCE_DETAIL_SELECT)
 *   - One DTO mapper (toPublicResourceDTO)
 *   - Two thin lookup functions (by id, by slug)
 *   - Route handlers are thin adapters: rate limit → lookup → response
 *   - No internal fields leak to public API
 *   - Frozen public shape — clients can rely on this structure
 */

import { prisma } from "@/lib/prisma";
import { getStorageProvider } from "@/lib/storage/media-storage";
import { getBedTypeLabel } from "@/lib/bed-types";

// ═══════════════════════════════════════════
// Prisma select — single definition
// ═══════════════════════════════════════════

/**
 * Shared select clause for public resource detail.
 * Used by both lookup-by-id and lookup-by-slug.
 */
const RESOURCE_DETAIL_SELECT = {
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
    orderBy: { sortOrder: "asc" as const },
    select: {
      id: true,
      name: true,
      capacity: true,
      isDefault: true,
      unitNumber: true,
    },
  },
  images: {
    orderBy: { position: "asc" as const },
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
    orderBy: { bedType: "asc" as const },
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
} as const;

/** Base where clause: only active resources visible in widget */
const ACTIVE_VISIBLE_WHERE = {
  status: "ACTIVE" as const,
  visibleInWidget: true,
};

// ═══════════════════════════════════════════
// DTO mapper — single definition
// ═══════════════════════════════════════════

/**
 * Transform raw Prisma resource into frozen public DTO.
 *
 * - Images: storageKey → runtime public URLs (ADR-11, ADR-12)
 * - Beds: bedType → human-readable label
 * - Amenities: flatten ResourceAmenity join → flat shape
 * - No internal fields (storageKey, thumbnailKey, mediumKey stripped)
 */
export function toPublicResourceDTO(resource: any) {
  const provider = getStorageProvider();

  return {
    ...resource,
    images: resource.images.map((img: any) => ({
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
    beds: resource.beds.map((bed: any) => ({
      bedType: bed.bedType,
      quantity: bed.quantity,
      label: getBedTypeLabel(bed.bedType),
    })),
    amenities: resource.amenities.map((ra: any) => ({
      id: ra.amenity.id,
      slug: ra.amenity.slug,
      name: ra.amenity.name,
      icon: ra.amenity.iconKey,
      categorySlug: ra.amenity.category.slug,
    })),
  };
}

// ═══════════════════════════════════════════
// Lookup functions
// ═══════════════════════════════════════════

/**
 * Fetch public resource detail by UUID.
 * Returns enriched DTO or null if not found / not active / not visible.
 */
export async function getPublicResourceById(id: string) {
  const resource = await prisma.resource.findFirst({
    where: { id, ...ACTIVE_VISIBLE_WHERE },
    select: RESOURCE_DETAIL_SELECT,
  });
  if (!resource) return null;
  return toPublicResourceDTO(resource);
}

/**
 * Fetch public resource detail by slug.
 * Returns enriched DTO or null if not found / not active / not visible.
 */
export async function getPublicResourceBySlug(slug: string) {
  const resource = await prisma.resource.findFirst({
    where: { slug, ...ACTIVE_VISIBLE_WHERE },
    select: RESOURCE_DETAIL_SELECT,
  });
  if (!resource) return null;
  return toPublicResourceDTO(resource);
}
