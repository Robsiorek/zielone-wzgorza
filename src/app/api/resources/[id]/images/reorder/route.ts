/**
 * PUT /api/resources/[id]/images/reorder — Reorder images.
 *
 * Body: { imageIds: string[] } — complete ordered list of ALL image IDs for this resource.
 *
 * Strategy: two-phase reorder (review ChatGPT #3, fix review #2):
 *   Phase 1: $executeRaw (parameterized) shifts all positions to negative space
 *   Phase 2: Prisma ORM update() sets each to target position
 *   Zero $executeRawUnsafe. Zero string interpolation in SQL.
 *
 * Why two-phase: @@unique([resourceId, position]) is checked per-statement.
 *   Phase 1 clears all to negative → phase 2 sets 0,1,2... without collisions.
 *
 * Validation:
 *   - imageIds must contain EXACTLY all images for this resource (no more, no less)
 *   - All IDs must belong to this resource
 */

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, apiNotFound, apiServerError } from "@/lib/api-response";
import { getAuthContext, hasMinRole } from "@/lib/require-auth";
import { enrichImagesWithUrls } from "@/lib/storage/image-urls";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Auth — MANAGER+
    const auth = await getAuthContext();
    if (!auth) return apiError("Brak autoryzacji", 401, "UNAUTHORIZED");
    if (!hasMinRole(auth, "MANAGER")) return apiError("Brak uprawnień", 403, "FORBIDDEN");

    const resourceId = params.id;
    const body = await request.json();
    const { imageIds } = body;

    // Validate input
    if (!Array.isArray(imageIds) || imageIds.length === 0) {
      return apiError("Pole imageIds musi być niepustą tablicą", 400, "VALIDATION");
    }

    // Check for duplicates
    if (new Set(imageIds).size !== imageIds.length) {
      return apiError("Tablica imageIds zawiera duplikaty", 400, "VALIDATION");
    }

    // Get all images for this resource
    const existing = await prisma.resourceImage.findMany({
      where: { resourceId },
      select: { id: true },
    });

    if (existing.length === 0) {
      return apiNotFound("Brak zdjęć dla tego zasobu");
    }

    // Verify completeness: imageIds must contain exactly the same set
    const existingIds = new Set(existing.map((img) => img.id));

    if (existingIds.size !== imageIds.length) {
      return apiError(
        `Tablica imageIds musi zawierać dokładnie ${existingIds.size} elementów (wszystkie zdjęcia zasobu)`,
        400,
        "VALIDATION"
      );
    }

    for (const id of imageIds) {
      if (typeof id !== "string" || !existingIds.has(id)) {
        return apiError(
          `Zdjęcie "${id}" nie należy do tego zasobu`,
          400,
          "VALIDATION"
        );
      }
    }

    // Two-phase reorder in transaction
    await prisma.$transaction(async (tx) => {
      // Phase 1: shift all positions to negative space (parameterized, safe)
      // Offset -1000 ensures no collision with target positions 0..N
      await tx.$executeRaw`
        UPDATE "resource_images"
        SET "position" = -("position" + 1000),
            "updatedAt" = NOW()
        WHERE "resourceId" = ${resourceId}
      `;

      // Phase 2: set each image to its target position (Prisma ORM, fully parameterized)
      for (let i = 0; i < imageIds.length; i++) {
        await tx.resourceImage.update({
          where: { id: imageIds[i] },
          data: { position: i },
        });
      }
    });

    // Return updated images
    const images = await prisma.resourceImage.findMany({
      where: { resourceId },
      orderBy: { position: "asc" },
    });

    return apiSuccess({ images: enrichImagesWithUrls(images) });
  } catch (error) {
    return apiServerError(error);
  }
}
