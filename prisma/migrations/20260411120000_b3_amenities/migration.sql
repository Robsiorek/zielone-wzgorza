-- B3: Amenities system — categories + amenities + resource assignment
--
-- Old resource_amenities had flat name+icon fields and is empty.
-- Safe to drop and recreate with proper FK to new Amenity model.

-- Step 1: Drop old resource_amenities table (empty, no data loss)
DROP TABLE IF EXISTS "resource_amenities";

-- Step 2: Create amenity_categories table
CREATE TABLE "amenity_categories" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "iconKey" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "amenity_categories_pkey" PRIMARY KEY ("id")
);

-- Step 3: Indexes for amenity_categories
CREATE UNIQUE INDEX "amenity_categories_propertyId_slug_key" ON "amenity_categories"("propertyId", "slug");
CREATE INDEX "amenity_categories_propertyId_position_idx" ON "amenity_categories"("propertyId", "position");

-- Step 4: Create amenities table
CREATE TABLE "amenities" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "iconKey" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "amenities_pkey" PRIMARY KEY ("id")
);

-- Step 5: Indexes for amenities
CREATE UNIQUE INDEX "amenities_propertyId_slug_key" ON "amenities"("propertyId", "slug");
CREATE INDEX "amenities_propertyId_categoryId_position_idx" ON "amenities"("propertyId", "categoryId", "position");

-- Step 6: FK amenities → amenity_categories (RESTRICT — cannot delete category with amenities)
ALTER TABLE "amenities" ADD CONSTRAINT "amenities_categoryId_fkey"
    FOREIGN KEY ("categoryId") REFERENCES "amenity_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Step 7: Recreate resource_amenities with amenityId FK
CREATE TABLE "resource_amenities" (
    "id" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "amenityId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "resource_amenities_pkey" PRIMARY KEY ("id")
);

-- Step 8: Indexes for resource_amenities
CREATE UNIQUE INDEX "resource_amenities_resourceId_amenityId_key" ON "resource_amenities"("resourceId", "amenityId");
CREATE INDEX "resource_amenities_amenityId_idx" ON "resource_amenities"("amenityId");

-- Step 9: FK resource_amenities → resources (CASCADE — amenity assignments removed with resource)
ALTER TABLE "resource_amenities" ADD CONSTRAINT "resource_amenities_resourceId_fkey"
    FOREIGN KEY ("resourceId") REFERENCES "resources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 10: FK resource_amenities → amenities (RESTRICT — cannot delete amenity assigned to resources)
ALTER TABLE "resource_amenities" ADD CONSTRAINT "resource_amenities_amenityId_fkey"
    FOREIGN KEY ("amenityId") REFERENCES "amenities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
