/**
 * POST /api/resources/[id]/images — Upload image for a resource.
 *
 * Flow:
 * 1. Auth (MANAGER+)
 * 2. Validate resource exists + has propertyId
 * 3. Check count < 20
 * 4. Parse multipart, read buffer
 * 5. Validate MIME by magic bytes + size ≤ 5MB
 * 6. Process: EXIF normalize → 3 sizes → WebP → checksum
 * 7. Upload 3 variants to storage
 * 8. DB INSERT (ResourceImage)
 * 9. If DB fails → compensatory cleanup of storage
 * 10. If first image → set isCover=true
 *
 * Compensatory contract (review ChatGPT #4):
 *   Storage → DB. If DB fails → best-effort cleanup of uploaded keys.
 *   If storage fails mid-upload → cleanup already-uploaded keys.
 */

import { NextRequest } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, apiNotFound, apiServerError } from "@/lib/api-response";
import { getAuthContext, hasMinRole } from "@/lib/require-auth";
import { processImage, MAX_IMAGE_SIZE, MAX_IMAGES_PER_RESOURCE } from "@/lib/storage/image-processor";
import {
  getStorageProvider,
  buildImageKeys,
  uploadImageVariants,
  cleanupStorageKeys,
  StorageUploadError,
} from "@/lib/storage/media-storage";
import { enrichImageWithUrls } from "@/lib/storage/image-urls";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Auth — MANAGER or OWNER
    const auth = await getAuthContext();
    if (!auth) return apiError("Brak autoryzacji", 401, "UNAUTHORIZED");
    if (!hasMinRole(auth, "MANAGER")) return apiError("Brak uprawnień", 403, "FORBIDDEN");

    const resourceId = params.id;

    // 2. Validate resource exists + has propertyId
    const resource = await prisma.resource.findUnique({
      where: { id: resourceId },
      select: { id: true, propertyId: true },
    });

    if (!resource) return apiNotFound("Zasób nie znaleziony");
    if (!resource.propertyId) {
      return apiError("Zasób musi mieć przypisaną nieruchomość (propertyId) przed dodaniem zdjęć", 400, "VALIDATION");
    }

    // 3. Check image count limit
    const currentCount = await prisma.resourceImage.count({
      where: { resourceId },
    });

    if (currentCount >= MAX_IMAGES_PER_RESOURCE) {
      return apiError(
        `Osiągnięto limit ${MAX_IMAGES_PER_RESOURCE} zdjęć dla tego zasobu`,
        400,
        "VALIDATION"
      );
    }

    // 4. Parse multipart
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return apiError("Brak pliku w żądaniu. Wyślij plik w polu 'file'", 400, "VALIDATION");
    }

    // 5. Read buffer + validate size
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (buffer.length > MAX_IMAGE_SIZE) {
      return apiError(
        `Plik przekracza limit 5MB (${(buffer.length / 1024 / 1024).toFixed(1)}MB)`,
        400,
        "VALIDATION"
      );
    }

    if (buffer.length === 0) {
      return apiError("Przesłany plik jest pusty", 400, "VALIDATION");
    }

    // 6. Process image (MIME validation, EXIF, resize, WebP, checksum)
    const processed = await processImage(buffer);

    // 7. Build storage keys
    const uuid = randomUUID();
    const keys = buildImageKeys(resource.propertyId, resourceId, uuid);

    // 8. Upload to storage (with partial-failure cleanup)
    const provider = getStorageProvider();
    let uploadedKeys: string[] = [];

    try {
      uploadedKeys = await uploadImageVariants(provider, keys, {
        original: processed.original,
        medium: processed.medium,
        thumbnail: processed.thumbnail,
      });
    } catch (error) {
      if (error instanceof StorageUploadError) {
        // Clean up partially uploaded files
        await cleanupStorageKeys(provider, error.uploadedKeys);
      }
      return apiError("Nie udało się zapisać pliku w storage", 500, "SERVER_ERROR");
    }

    // 9. DB INSERT — if fails, compensatory cleanup of storage
    try {
      // Determine position (next available)
      const maxPos = await prisma.resourceImage.aggregate({
        where: { resourceId },
        _max: { position: true },
      });
      const nextPosition = (maxPos._max.position ?? -1) + 1;

      // First image → isCover = true
      const isFirstImage = currentCount === 0;

      const image = await prisma.resourceImage.create({
        data: {
          resourceId,
          storageKey: keys.storageKey,
          thumbnailKey: keys.thumbnailKey,
          mediumKey: keys.mediumKey,
          mimeType: processed.mimeType,
          width: processed.width,
          height: processed.height,
          sizeBytes: processed.sizeBytes,
          checksum: processed.checksum,
          position: nextPosition,
          isCover: isFirstImage,
        },
      });

      return apiSuccess({ image: enrichImageWithUrls(image) }, 201);
    } catch (dbError) {
      // Compensatory cleanup — remove uploaded files from storage
      console.error("[upload] DB insert failed, cleaning up storage keys:", uploadedKeys);
      await cleanupStorageKeys(provider, uploadedKeys);
      throw dbError; // Re-throw for apiServerError to handle
    }
  } catch (error) {
    return apiServerError(error);
  }
}
