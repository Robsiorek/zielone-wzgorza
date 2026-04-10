-- B2: Resource Content — rename fields + new content fields + ResourceBed
--
-- ADR-14: Świadome ujednolicenie nazw pól Resource do kontraktu MP.
-- Wykonane teraz, w B2, zanim dane i integracje się rozrosną.
-- Dotyczy TYLKO tabeli resources (nie resource_categories, variants, addons).

-- Step 1: Rename columns (resources table only)
ALTER TABLE "resources" RENAME COLUMN "shortDesc" TO "shortDescription";
ALTER TABLE "resources" RENAME COLUMN "description" TO "longDescription";

-- Step 2: Convert area from Decimal to Int and rename to areaSqm
ALTER TABLE "resources" ALTER COLUMN "area" TYPE INTEGER USING FLOOR("area")::INTEGER;
ALTER TABLE "resources" RENAME COLUMN "area" TO "areaSqm";

-- Step 3: Add new content fields
ALTER TABLE "resources" ADD COLUMN "bedroomCount" INTEGER;
ALTER TABLE "resources" ADD COLUMN "bathroomCount" INTEGER;

-- Step 4: Create resource_beds table
CREATE TABLE "resource_beds" (
    "id" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "bedType" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "resource_beds_pkey" PRIMARY KEY ("id")
);

-- Step 5: Indexes and constraints
CREATE INDEX "resource_beds_resourceId_idx" ON "resource_beds"("resourceId");
CREATE UNIQUE INDEX "resource_beds_resourceId_bedType_key" ON "resource_beds"("resourceId", "bedType");

-- Step 6: Foreign key (CASCADE on delete — beds removed when resource deleted)
ALTER TABLE "resource_beds" ADD CONSTRAINT "resource_beds_resourceId_fkey"
    FOREIGN KEY ("resourceId") REFERENCES "resources"("id") ON DELETE CASCADE ON UPDATE CASCADE;
