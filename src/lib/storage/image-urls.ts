/**
 * B1 Image URL enrichment.
 *
 * Converts Prisma ResourceImage records to ResourceImageWithUrls
 * by generating public URLs from storageKey via the active MediaStorageProvider.
 *
 * ADR-11: URLs never persisted — generated runtime.
 * ADR-12: Direct public URL from R2 (prod) or local streaming endpoint (dev).
 */

import { getStorageProvider } from "./media-storage";
import type { ResourceImage } from "@prisma/client";
import type { ResourceImageWithUrls } from "@/types/media";

/**
 * Enrich a single ResourceImage with public URLs.
 */
export function enrichImageWithUrls(image: ResourceImage): ResourceImageWithUrls {
  const provider = getStorageProvider();

  return {
    id: image.id,
    resourceId: image.resourceId,
    storageKey: image.storageKey,
    thumbnailKey: image.thumbnailKey,
    mediumKey: image.mediumKey,
    mimeType: image.mimeType,
    width: image.width,
    height: image.height,
    sizeBytes: image.sizeBytes,
    checksum: image.checksum,
    alt: image.alt,
    position: image.position,
    isCover: image.isCover,
    createdAt: image.createdAt.toISOString(),
    updatedAt: image.updatedAt.toISOString(),
    urls: {
      original: provider.getPublicUrl(image.storageKey),
      medium: provider.getPublicUrl(image.mediumKey),
      thumbnail: provider.getPublicUrl(image.thumbnailKey),
    },
  };
}

/**
 * Enrich an array of ResourceImages with public URLs.
 */
export function enrichImagesWithUrls(images: ResourceImage[]): ResourceImageWithUrls[] {
  return images.map(enrichImageWithUrls);
}
