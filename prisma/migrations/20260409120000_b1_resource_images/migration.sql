-- B1: Resource Images — upgrade stub to full media model
-- Existing table has: id, resourceId, url, alt, sortOrder, isPrimary, createdAt
--
-- PRECONDITION: Table resource_images MUST be empty.
-- This migration adds NOT NULL columns without defaults — existing rows would be lost.
-- The assertion below will ABORT the migration if any rows exist.

-- Step 0: Hard assertion — table must be empty
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "resource_images" LIMIT 1) THEN
    RAISE EXCEPTION '[B1 MIGRATION ABORTED] Tabela resource_images nie jest pusta. '
      'Ta migracja wymaga pustej tabeli (stub z init). '
      'Przed uruchomieniem wyczyść dane ręcznie lub skontaktuj się z deweloperem.';
  END IF;
END $$;

-- Step 1: Add new columns (NOT NULL safe — table verified empty above)
ALTER TABLE "resource_images" ADD COLUMN "storageKey" TEXT NOT NULL;
ALTER TABLE "resource_images" ADD COLUMN "thumbnailKey" TEXT NOT NULL;
ALTER TABLE "resource_images" ADD COLUMN "mediumKey" TEXT NOT NULL;
ALTER TABLE "resource_images" ADD COLUMN "mimeType" TEXT NOT NULL;
ALTER TABLE "resource_images" ADD COLUMN "width" INTEGER NOT NULL;
ALTER TABLE "resource_images" ADD COLUMN "height" INTEGER NOT NULL;
ALTER TABLE "resource_images" ADD COLUMN "sizeBytes" INTEGER NOT NULL;
ALTER TABLE "resource_images" ADD COLUMN "checksum" TEXT NOT NULL;
ALTER TABLE "resource_images" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Step 2: Rename columns (sortOrder -> position, isPrimary -> isCover)
ALTER TABLE "resource_images" RENAME COLUMN "sortOrder" TO "position";
ALTER TABLE "resource_images" RENAME COLUMN "isPrimary" TO "isCover";

-- Step 3: Drop legacy url column (ADR-11: storageKey only, no persisted URL)
ALTER TABLE "resource_images" DROP COLUMN "url";

-- Step 4: Add unique constraint on storageKey
CREATE UNIQUE INDEX "resource_images_storageKey_key" ON "resource_images"("storageKey");

-- Step 5: Add unique constraint on (resourceId, position)
CREATE UNIQUE INDEX "resource_images_resourceId_position_key" ON "resource_images"("resourceId", "position");

-- Step 6: Partial unique index — max one cover per resource (raw SQL, not expressible in Prisma)
CREATE UNIQUE INDEX "resource_images_cover_unique" ON "resource_images"("resourceId") WHERE "isCover" = true;
