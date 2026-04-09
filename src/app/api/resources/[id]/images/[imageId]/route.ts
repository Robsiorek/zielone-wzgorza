/**
 * DELETE /api/resources/[id]/images/[imageId] — Delete image.
 * PATCH  /api/resources/[id]/images/[imageId] — Set cover / alt.
 *
 * Delete compensatory contract (review ChatGPT #4):
 *   1. DB transaction: delete record + reindex positions + reassign cover
 *   2. After COMMIT: best-effort delete from storage
 *   3. If storage delete fails → log warning, DB is source of truth
 *
 * setCover:
 *   Transaction: unset current cover → set new cover.
 *   Partial unique index enforces max 1 cover per resource.
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, apiNotFound, apiServerError } from "@/lib/api-response";
import { getAuthContext, hasMinRole } from "@/lib/require-auth";
import { getStorageProvider, cleanupStorageKeys } from "@/lib/storage/media-storage";
import { enrichImagesWithUrls, enrichImageWithUrls } from "@/lib/storage/image-urls";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string; imageId: string } }
) {
  try {
    // Auth — MANAGER+
    const auth = await getAuthContext();
    if (!auth) return apiError("Brak autoryzacji", 401, "UNAUTHORIZED");
    if (!hasMinRole(auth, "MANAGER")) return apiError("Brak uprawnień", 403, "FORBIDDEN");

    const { id: resourceId, imageId } = params;

    // Find the image (verify it belongs to this resource)
    const image = await prisma.resourceImage.findFirst({
      where: { id: imageId, resourceId },
    });

    if (!image) return apiNotFound("Zdjęcie nie znalezione");

    // Collect keys for post-commit storage cleanup
    const keysToDelete = [image.storageKey, image.mediumKey, image.thumbnailKey];
    const wasCover = image.isCover;
    const deletedPosition = image.position;

    // DB transaction: delete + reindex + reassign cover
    await prisma.$transaction(async (tx) => {
      // Delete the image record
      await tx.resourceImage.delete({
        where: { id: imageId },
      });

      // Reindex positions — two-phase gap-fill (no $executeRawUnsafe)
      const remaining = await tx.resourceImage.findMany({
        where: { resourceId },
        orderBy: { position: "asc" },
        select: { id: true, position: true },
      });

      if (remaining.length > 0) {
        // Phase 1: shift all to negative space (parameterized $executeRaw)
        await tx.$executeRaw`
          UPDATE "resource_images"
          SET "position" = -("position" + 1000),
              "updatedAt" = NOW()
          WHERE "resourceId" = ${resourceId}
        `;

        // Phase 2: set sequential positions via Prisma ORM (fully parameterized)
        for (let i = 0; i < remaining.length; i++) {
          await tx.resourceImage.update({
            where: { id: remaining[i].id },
            data: { position: i },
          });
        }

        // Reassign cover if deleted was cover
        if (wasCover) {
          // remaining is still sorted by old position — first element gets cover
          await tx.resourceImage.update({
            where: { id: remaining[0].id },
            data: { isCover: true },
          });
        }
      }
    });

    // Post-commit: best-effort storage cleanup
    const provider = getStorageProvider();
    await cleanupStorageKeys(provider, keysToDelete);

    // Return updated images list
    const images = await prisma.resourceImage.findMany({
      where: { resourceId },
      orderBy: { position: "asc" },
    });

    return apiSuccess({ images: enrichImagesWithUrls(images) });
  } catch (error) {
    return apiServerError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; imageId: string } }
) {
  try {
    // Auth — MANAGER+
    const auth = await getAuthContext();
    if (!auth) return apiError("Brak autoryzacji", 401, "UNAUTHORIZED");
    if (!hasMinRole(auth, "MANAGER")) return apiError("Brak uprawnień", 403, "FORBIDDEN");

    const { id: resourceId, imageId } = params;
    const body = await request.json();

    // Verify image belongs to this resource
    const existing = await prisma.resourceImage.findFirst({
      where: { id: imageId, resourceId },
    });

    if (!existing) return apiNotFound("Zdjęcie nie znalezione");

    const { isCover, alt } = body;

    // Set cover — transaction: unset old, set new
    if (isCover === true) {
      await prisma.$transaction(async (tx) => {
        // Unset current cover for this resource
        await tx.resourceImage.updateMany({
          where: { resourceId, isCover: true },
          data: { isCover: false },
        });

        // Set new cover
        await tx.resourceImage.update({
          where: { id: imageId },
          data: { isCover: true },
        });
      });
    }

    // Update alt text (can be set independently or together with isCover)
    if (alt !== undefined) {
      await prisma.resourceImage.update({
        where: { id: imageId },
        data: { alt: alt || null },
      });
    }

    // Return updated image
    const updated = await prisma.resourceImage.findUnique({
      where: { id: imageId },
    });

    if (!updated) return apiNotFound("Zdjęcie nie znalezione");

    return apiSuccess({ image: enrichImageWithUrls(updated) });
  } catch (error) {
    return apiServerError(error);
  }
}
