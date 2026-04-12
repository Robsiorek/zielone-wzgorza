-- B4: Property Content — guest-facing content for property
--
-- 3 new tables: property_content (singleton), trust_badges (list), faq_items (list)
-- Architectural rule: CompanySettings = operations, PropertyContent = content, Resource = product

-- Step 1: Create property_content table (singleton per property)
CREATE TABLE "property_content" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "heroTitle" TEXT,
    "heroSubtitle" TEXT,
    "shortDescription" TEXT,
    "fullDescription" TEXT,
    "locationDescription" TEXT,
    "checkInDescription" TEXT,
    "checkOutDescription" TEXT,
    "parkingDescription" TEXT,
    "petsDescription" TEXT,
    "childrenDescription" TEXT,
    "quietHoursDescription" TEXT,
    "houseRules" TEXT,
    "cancellationPolicy" TEXT,
    "paymentPolicy" TEXT,
    "guestContactPhone" TEXT,
    "guestContactEmail" TEXT,
    "guestContactWhatsapp" TEXT,
    "guestAddressLine" TEXT,
    "guestPostalCode" TEXT,
    "guestCity" TEXT,
    "guestCountry" TEXT DEFAULT 'PL',
    "googleMapsUrl" TEXT,
    "directionsDescription" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "property_content_pkey" PRIMARY KEY ("id")
);

-- Step 2: Unique index on propertyId (singleton enforcement)
CREATE UNIQUE INDEX "property_content_propertyId_key" ON "property_content"("propertyId");

-- Step 3: FK property_content → properties
ALTER TABLE "property_content" ADD CONSTRAINT "property_content_propertyId_fkey"
    FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Step 4: Create trust_badges table
CREATE TABLE "trust_badges" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "iconKey" TEXT NOT NULL,
    "description" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "trust_badges_pkey" PRIMARY KEY ("id")
);

-- Step 5: Index for trust_badges
CREATE INDEX "trust_badges_propertyId_position_idx" ON "trust_badges"("propertyId", "position");

-- Step 6: FK trust_badges → properties
ALTER TABLE "trust_badges" ADD CONSTRAINT "trust_badges_propertyId_fkey"
    FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Step 7: Create faq_items table
CREATE TABLE "faq_items" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "faq_items_pkey" PRIMARY KEY ("id")
);

-- Step 8: Index for faq_items
CREATE INDEX "faq_items_propertyId_position_idx" ON "faq_items"("propertyId", "position");

-- Step 9: FK faq_items → properties
ALTER TABLE "faq_items" ADD CONSTRAINT "faq_items_propertyId_fkey"
    FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
