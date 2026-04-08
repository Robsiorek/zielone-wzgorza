-- ═══════════════════════════════════════════════════════════════════════
-- C1b MIGRATION: Payment ledger backfill
-- Run AFTER prisma db push adds new columns and enums
-- ═══════════════════════════════════════════════════════════════════════
-- Strategy: db push creates new nullable columns + new enums.
-- This script backfills data from old columns into new columns.
-- Old columns stay as LEGACY until S2b.
-- ═══════════════════════════════════════════════════════════════════════

-- ──────────────────────────────────────────────────────────────
-- 1. PaymentMethod enum: add new values (if db push didn't)
-- ──────────────────────────────────────────────────────────────
DO $$
BEGIN
  -- These are idempotent: "IF NOT EXISTS" semantics via exception handling
  BEGIN ALTER TYPE "PaymentMethod" ADD VALUE 'TRANSFER'; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER TYPE "PaymentMethod" ADD VALUE 'TERMINAL'; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER TYPE "PaymentMethod" ADD VALUE 'BLIK';     EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;

-- ──────────────────────────────────────────────────────────────
-- 2. Backfill kind + direction from old type column
-- ──────────────────────────────────────────────────────────────
UPDATE payments SET
  kind = CASE
    WHEN type = 'PAYMENT'    THEN 'CHARGE'::"PaymentKind"
    WHEN type = 'REFUND'     THEN 'REFUND'::"PaymentKind"
    WHEN type = 'CORRECTION' THEN 'ADJUSTMENT'::"PaymentKind"
    ELSE 'CHARGE'::"PaymentKind"
  END,
  direction = CASE
    WHEN type = 'PAYMENT'    THEN 'IN'::"PaymentDirection"
    WHEN type = 'REFUND'     THEN 'OUT'::"PaymentDirection"
    WHEN type = 'CORRECTION' THEN 'IN'::"PaymentDirection"
    ELSE 'IN'::"PaymentDirection"
  END
WHERE kind IS NULL AND type IS NOT NULL;

-- ──────────────────────────────────────────────────────────────
-- 3. Backfill paymentStatus from old status column
-- ──────────────────────────────────────────────────────────────
UPDATE payments SET
  "paymentStatus" = CASE
    WHEN status = 'PENDING'   THEN 'PENDING'::"PaymentStatus"
    WHEN status = 'CONFIRMED' THEN 'CONFIRMED'::"PaymentStatus"
    WHEN status = 'FAILED'    THEN 'FAILED'::"PaymentStatus"
    ELSE 'PENDING'::"PaymentStatus"
  END
WHERE "paymentStatus" IS NULL AND status IS NOT NULL;

-- ──────────────────────────────────────────────────────────────
-- 4. Backfill method: BANK_TRANSFER → TRANSFER
-- ──────────────────────────────────────────────────────────────
UPDATE payments SET method = 'TRANSFER'::"PaymentMethod"
WHERE method = 'BANK_TRANSFER';

-- ──────────────────────────────────────────────────────────────
-- 5. Backfill occurredAt from paidAt, referenceNumber from transactionId
-- ──────────────────────────────────────────────────────────────
UPDATE payments SET
  "occurredAt" = "paidAt",
  "referenceNumber" = "transactionId"
WHERE "occurredAt" IS NULL AND "paidAt" IS NOT NULL;

UPDATE payments SET "referenceNumber" = "transactionId"
WHERE "referenceNumber" IS NULL AND "transactionId" IS NOT NULL;

-- ──────────────────────────────────────────────────────────────
-- 6. Backfill createdSource = ADMIN_MANUAL for all existing records
-- ──────────────────────────────────────────────────────────────
UPDATE payments SET "createdSource" = 'ADMIN_MANUAL'::"PaymentSource"
WHERE "createdSource" IS NULL;

-- ──────────────────────────────────────────────────────────────
-- 7. Backfill confirmedAt = createdAt for CONFIRMED payments
--    (semantyka: stare potwierdzenia nie mają historii zatwierdzenia,
--     użycie createdAt jako przybliżenia)
-- ──────────────────────────────────────────────────────────────
UPDATE payments SET "confirmedAt" = "createdAt"
WHERE "paymentStatus" = 'CONFIRMED' AND "confirmedAt" IS NULL;

-- ──────────────────────────────────────────────────────────────
-- 8. Recalculate BookingDetails financial projections
--    (paidAmountMinor, balanceDueMinor, overpaidAmountMinor)
-- ──────────────────────────────────────────────────────────────
WITH payment_sums AS (
  SELECT
    p."reservationId",
    COALESCE(SUM(CASE WHEN p."paymentStatus" = 'CONFIRMED' AND p.direction = 'IN' THEN p."amountMinor" ELSE 0 END), 0) AS total_in,
    COALESCE(SUM(CASE WHEN p."paymentStatus" = 'CONFIRMED' AND p.direction = 'OUT' THEN p."amountMinor" ELSE 0 END), 0) AS total_out
  FROM payments p
  WHERE p."paymentStatus" = 'CONFIRMED'
  GROUP BY p."reservationId"
)
UPDATE booking_details bd SET
  "paidAmountMinor" = GREATEST(ps.total_in - ps.total_out, 0),
  "paidAmount" = GREATEST(ps.total_in - ps.total_out, 0) / 100.0,
  "balanceDueMinor" = GREATEST(r."totalMinor" - GREATEST(ps.total_in - ps.total_out, 0), 0),
  "balanceDue" = GREATEST(r."totalMinor" - GREATEST(ps.total_in - ps.total_out, 0), 0) / 100.0,
  "overpaidAmountMinor" = GREATEST(GREATEST(ps.total_in - ps.total_out, 0) - r."totalMinor", 0)
FROM payment_sums ps
JOIN reservations r ON r.id = ps."reservationId"
WHERE bd."reservationId" = ps."reservationId";

-- ──────────────────────────────────────────────────────────────
-- 9. Seed paymentMethodsConfig on CompanySettings
-- ──────────────────────────────────────────────────────────────
UPDATE company_settings SET "paymentMethodsConfig" = '[
  {"method":"CASH","isActive":true,"availableForAdmin":true,"availableForWidget":false,"availableForOnline":false,"requiresConfirmation":false,"displayName":"Gotówka","sortOrder":0},
  {"method":"TRANSFER","isActive":true,"availableForAdmin":true,"availableForWidget":true,"availableForOnline":false,"requiresConfirmation":true,"displayName":"Przelew bankowy","sortOrder":1},
  {"method":"TERMINAL","isActive":true,"availableForAdmin":true,"availableForWidget":false,"availableForOnline":false,"requiresConfirmation":false,"displayName":"Terminal płatniczy","sortOrder":2},
  {"method":"CARD","isActive":true,"availableForAdmin":true,"availableForWidget":false,"availableForOnline":false,"requiresConfirmation":false,"displayName":"Karta","sortOrder":3},
  {"method":"ONLINE","isActive":false,"availableForAdmin":false,"availableForWidget":false,"availableForOnline":true,"requiresConfirmation":false,"displayName":"Płatność online","sortOrder":4},
  {"method":"BLIK","isActive":false,"availableForAdmin":false,"availableForWidget":false,"availableForOnline":true,"requiresConfirmation":false,"displayName":"BLIK","sortOrder":5},
  {"method":"OTHER","isActive":true,"availableForAdmin":true,"availableForWidget":false,"availableForOnline":false,"requiresConfirmation":true,"displayName":"Inna","sortOrder":6}
]'::jsonb
WHERE "paymentMethodsConfig" = '[]'::jsonb OR "paymentMethodsConfig" IS NULL;

-- ──────────────────────────────────────────────────────────────
-- 10. VERIFICATION
-- ──────────────────────────────────────────────────────────────
DO $$
DECLARE
  v_count INT;
BEGIN
  SELECT COUNT(*) INTO v_count FROM payments WHERE kind IS NULL;
  IF v_count > 0 THEN RAISE WARNING 'C1b: % payments still have kind=NULL', v_count; END IF;

  SELECT COUNT(*) INTO v_count FROM payments WHERE direction IS NULL;
  IF v_count > 0 THEN RAISE WARNING 'C1b: % payments still have direction=NULL', v_count; END IF;

  SELECT COUNT(*) INTO v_count FROM payments WHERE "paymentStatus" IS NULL;
  IF v_count > 0 THEN RAISE WARNING 'C1b: % payments still have paymentStatus=NULL', v_count; END IF;

  SELECT COUNT(*) INTO v_count FROM payments WHERE method = 'BANK_TRANSFER';
  IF v_count > 0 THEN RAISE WARNING 'C1b: % payments still have method=BANK_TRANSFER (should be TRANSFER)', v_count; END IF;

  SELECT COUNT(*) INTO v_count FROM payments WHERE "createdSource" IS NULL;
  IF v_count > 0 THEN RAISE WARNING 'C1b: % payments still have createdSource=NULL', v_count; END IF;

  RAISE NOTICE 'C1b backfill verification complete.';
END $$;
