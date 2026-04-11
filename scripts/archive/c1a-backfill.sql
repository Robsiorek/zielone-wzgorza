-- ═══════════════════════════════════════════════════════════════════════
-- C1a MIGRATION: Minor units (grosze) backfill
-- Run AFTER prisma migrate deploy adds the new *Minor columns
-- ═══════════════════════════════════════════════════════════════════════

-- 1. Reservation
UPDATE "reservations" SET
  "subtotalMinor" = ROUND("subtotal" * 100),
  "discountMinor" = ROUND("discount" * 100),
  "totalMinor" = ROUND("total" * 100)
WHERE "subtotalMinor" = 0 AND ("subtotal" > 0 OR "discount" > 0 OR "total" > 0);

-- 2. ReservationItem
UPDATE "ReservationItem" SET
  "pricePerUnitMinor" = ROUND("pricePerUnit" * 100),
  "totalPriceMinor" = ROUND("totalPrice" * 100)
WHERE "pricePerUnitMinor" = 0 AND ("pricePerUnit" > 0 OR "totalPrice" > 0);

-- 3. ReservationAddon
UPDATE "reservation_addons" SET
  "snapshotPriceMinor" = ROUND("snapshotPrice" * 100),
  "unitPriceMinor" = ROUND("unitPrice" * 100),
  "totalMinor" = ROUND("total" * 100)
WHERE "snapshotPriceMinor" = 0 AND ("snapshotPrice" > 0 OR "unitPrice" > 0 OR "total" > 0);

-- 4. BookingDetails
UPDATE "booking_details" SET
  "paidAmountMinor" = ROUND("paidAmount" * 100),
  "balanceDueMinor" = ROUND("balanceDue" * 100)
WHERE "paidAmountMinor" = 0 AND ("paidAmount" > 0 OR "balanceDue" > 0);

-- 5. Addon (katalog)
UPDATE "addons" SET
  "priceMinor" = ROUND("price" * 100)
WHERE "priceMinor" = 0 AND "price" > 0;

-- 6. Payment
UPDATE "payments" SET
  "amountMinor" = ROUND("amount" * 100)
WHERE "amountMinor" = 0 AND "amount" > 0;

-- 7. PriceEntry (cennik)
UPDATE "price_entries" SET
  "priceMinor" = ROUND("price" * 100)
WHERE "priceMinor" = 0 AND "price" > 0;

-- 8. PromoCode
UPDATE "promo_codes" SET
  "discountValueMinor" = ROUND("discountValue" * 100),
  "minBookingValueMinor" = ROUND("minBookingValue" * 100)
WHERE "discountValueMinor" = 0 AND ("discountValue" > 0 OR "minBookingValue" > 0);

-- 9. RatePlan (only FIXED modifiers are money — PERCENTAGE stays as-is)
UPDATE "rate_plans" SET
  "modifierValueMinor" = ROUND("modifierValue" * 100)
WHERE "modifierType" = 'FIXED' AND "modifierValue" IS NOT NULL AND "modifierValueMinor" IS NULL;

-- 10. ResourceVariant
UPDATE "resource_variants" SET
  "basePriceMinor" = ROUND("basePrice" * 100)
WHERE "basePrice" IS NOT NULL AND "basePriceMinor" IS NULL;

-- ═══════════════════════════════════════════════════════════════════════
-- VERIFICATION: check that all records have Minor values
-- ═══════════════════════════════════════════════════════════════════════
DO $$
DECLARE
  v_count INT;
BEGIN
  SELECT COUNT(*) INTO v_count FROM "reservations" WHERE "total" > 0 AND "totalMinor" = 0;
  IF v_count > 0 THEN RAISE WARNING 'C1a: % reservations still have totalMinor=0', v_count; END IF;

  SELECT COUNT(*) INTO v_count FROM "ReservationItem" WHERE "totalPrice" > 0 AND "totalPriceMinor" = 0;
  IF v_count > 0 THEN RAISE WARNING 'C1a: % ReservationItems still have totalPriceMinor=0', v_count; END IF;

  SELECT COUNT(*) INTO v_count FROM "reservation_addons" WHERE "total" > 0 AND "totalMinor" = 0;
  IF v_count > 0 THEN RAISE WARNING 'C1a: % ReservationAddons still have totalMinor=0', v_count; END IF;

  SELECT COUNT(*) INTO v_count FROM "booking_details" WHERE "balanceDue" > 0 AND "balanceDueMinor" = 0;
  IF v_count > 0 THEN RAISE WARNING 'C1a: % BookingDetails still have balanceDueMinor=0', v_count; END IF;

  SELECT COUNT(*) INTO v_count FROM "addons" WHERE "price" > 0 AND "priceMinor" = 0;
  IF v_count > 0 THEN RAISE WARNING 'C1a: % Addons still have priceMinor=0', v_count; END IF;

  SELECT COUNT(*) INTO v_count FROM "price_entries" WHERE "price" > 0 AND "priceMinor" = 0;
  IF v_count > 0 THEN RAISE WARNING 'C1a: % PriceEntries still have priceMinor=0', v_count; END IF;

  RAISE NOTICE 'C1a backfill verification complete.';
END $$;
