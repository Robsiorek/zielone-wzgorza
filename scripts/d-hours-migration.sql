-- ═══════════════════════════════════════════════════════════════════════
-- D 159-162 MIGRATION: ACCOMMODATION startAt/endAt midnight → operational times
--
-- SCOPE:
--   - Only ACCOMMODATION items (categoryType = 'ACCOMMODATION')
--   - Only items with midnight startAt/endAt (HOUR=0, MINUTE=0)
--   - Uses global CompanySettings.checkInTime/checkOutTime
--   - DST-safe: AT TIME ZONE 'Europe/Warsaw' handles CET/CEST transitions
--
-- Run AFTER: prisma db push (adds checkInTimeOverride/checkOutTimeOverride to ResourceCategory)
-- Run BEFORE: new code that creates items with resolved times
-- ═══════════════════════════════════════════════════════════════════════

-- Step 1: Check what we're about to change
DO $$
DECLARE
  v_count INT;
  v_checkin TEXT;
  v_checkout TEXT;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM reservation_items
  WHERE "categoryType" = 'ACCOMMODATION'
    AND EXTRACT(HOUR FROM "startAt") = 0
    AND EXTRACT(MINUTE FROM "startAt") = 0;

  SELECT "checkInTime", "checkOutTime" INTO v_checkin, v_checkout
  FROM company_settings LIMIT 1;

  RAISE NOTICE 'D159: Found % ACCOMMODATION items with midnight times', v_count;
  RAISE NOTICE 'D159: Global checkIn=%, checkOut=%', v_checkin, v_checkout;
END $$;

-- Step 2: Update ReservationItem.startAt (checkIn date + checkInTime)
-- Logic: take the DATE part of startAt, combine with checkInTime in Warsaw timezone, convert to UTC
UPDATE reservation_items ri
SET "startAt" = (
  -- Extract date, combine with time in Warsaw TZ, then convert to UTC
  (DATE("startAt") || ' ' || cs."checkInTime" || ':00')::timestamp
    AT TIME ZONE 'Europe/Warsaw'
)
FROM company_settings cs
WHERE ri."categoryType" = 'ACCOMMODATION'
  AND EXTRACT(HOUR FROM ri."startAt") = 0
  AND EXTRACT(MINUTE FROM ri."startAt") = 0;

-- Step 3: Update ReservationItem.endAt (checkOut date + checkOutTime)
UPDATE reservation_items ri
SET "endAt" = (
  (DATE("endAt") || ' ' || cs."checkOutTime" || ':00')::timestamp
    AT TIME ZONE 'Europe/Warsaw'
)
FROM company_settings cs
WHERE ri."categoryType" = 'ACCOMMODATION'
  AND EXTRACT(HOUR FROM ri."endAt") = 0
  AND EXTRACT(MINUTE FROM ri."endAt") = 0;

-- Step 4: Update TimelineEntry.startAt/endAt to match their ReservationItem
UPDATE timeline_entries te
SET
  "startAt" = ri."startAt",
  "endAt" = ri."endAt"
FROM reservation_items ri
WHERE te."reservationItemId" = ri.id
  AND ri."categoryType" = 'ACCOMMODATION';

-- Step 5: Verify
DO $$
DECLARE
  v_midnight_items INT;
  v_midnight_timeline INT;
  v_total_items INT;
  v_total_timeline INT;
BEGIN
  SELECT COUNT(*) INTO v_total_items FROM reservation_items WHERE "categoryType" = 'ACCOMMODATION';
  SELECT COUNT(*) INTO v_midnight_items FROM reservation_items
    WHERE "categoryType" = 'ACCOMMODATION'
      AND EXTRACT(HOUR FROM "startAt") = 0 AND EXTRACT(MINUTE FROM "startAt") = 0;

  SELECT COUNT(*) INTO v_total_timeline FROM timeline_entries te
    JOIN reservation_items ri ON te."reservationItemId" = ri.id
    WHERE ri."categoryType" = 'ACCOMMODATION';
  SELECT COUNT(*) INTO v_midnight_timeline FROM timeline_entries te
    JOIN reservation_items ri ON te."reservationItemId" = ri.id
    WHERE ri."categoryType" = 'ACCOMMODATION'
      AND EXTRACT(HOUR FROM te."startAt") = 0 AND EXTRACT(MINUTE FROM te."startAt") = 0;

  RAISE NOTICE 'D159: ACCOMMODATION items: % total, % still midnight (should be 0)', v_total_items, v_midnight_items;
  RAISE NOTICE 'D159: ACCOMMODATION timeline: % total, % still midnight (should be 0)', v_total_timeline, v_midnight_timeline;

  IF v_midnight_items > 0 THEN
    RAISE WARNING 'D159: Some items still have midnight times!';
  ELSE
    RAISE NOTICE 'D159: Migration complete — all times resolved.';
  END IF;
END $$;
