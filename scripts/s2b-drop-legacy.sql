-- ═══════════════════════════════════════════════════════════════════════
-- S2b: DROP LEGACY PAYMENT COLUMNS
-- Run ONLY after C1b/C2 stable in production for several days (zero tickets)
-- ═══════════════════════════════════════════════════════════════════════
-- PREREQUISITE: pg_dump -Fc backup BEFORE running this script
-- ═══════════════════════════════════════════════════════════════════════

-- ──────────────────────────────────────────────────────────────
-- 1. Verify no nulls in new columns (safety check)
-- ──────────────────────────────────────────────────────────────
DO $$
DECLARE v_count INT;
BEGIN
  SELECT COUNT(*) INTO v_count FROM payments WHERE kind IS NULL;
  IF v_count > 0 THEN RAISE EXCEPTION 'ABORT: % payments have kind=NULL', v_count; END IF;

  SELECT COUNT(*) INTO v_count FROM payments WHERE "paymentStatus" IS NULL;
  IF v_count > 0 THEN RAISE EXCEPTION 'ABORT: % payments have paymentStatus=NULL', v_count; END IF;

  SELECT COUNT(*) INTO v_count FROM payments WHERE direction IS NULL;
  IF v_count > 0 THEN RAISE EXCEPTION 'ABORT: % payments have direction=NULL', v_count; END IF;

  SELECT COUNT(*) INTO v_count FROM payments WHERE method = 'BANK_TRANSFER';
  IF v_count > 0 THEN RAISE EXCEPTION 'ABORT: % payments still use BANK_TRANSFER', v_count; END IF;

  RAISE NOTICE 'S2b pre-check passed. Safe to drop.';
END $$;

-- ──────────────────────────────────────────────────────────────
-- 2. Drop legacy columns from payments table
-- ──────────────────────────────────────────────────────────────
ALTER TABLE payments DROP COLUMN IF EXISTS type;
ALTER TABLE payments DROP COLUMN IF EXISTS status;
ALTER TABLE payments DROP COLUMN IF EXISTS "paidAt";
ALTER TABLE payments DROP COLUMN IF EXISTS "transactionId";

-- ──────────────────────────────────────────────────────────────
-- 3. Drop legacy enums
-- ──────────────────────────────────────────────────────────────
DROP TYPE IF EXISTS "PaymentType";
DROP TYPE IF EXISTS "PaymentConfirmStatus";

-- ──────────────────────────────────────────────────────────────
-- 4. Remove BANK_TRANSFER from PaymentMethod enum
--    (Cannot drop enum values in Postgres — recreate if needed,
--     but BANK_TRANSFER with 0 rows is harmless. Skip for now.)
-- ──────────────────────────────────────────────────────────────

-- ──────────────────────────────────────────────────────────────
-- 5. Verification
-- ──────────────────────────────────────────────────────────────
DO $$
BEGIN
  -- Check columns are gone
  IF EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payments' AND column_name = 'type') THEN
    RAISE WARNING 'Column "type" still exists!';
  ELSE
    RAISE NOTICE 'Column "type" dropped OK';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payments' AND column_name = 'status') THEN
    RAISE WARNING 'Column "status" still exists!';
  ELSE
    RAISE NOTICE 'Column "status" dropped OK';
  END IF;

  RAISE NOTICE 'S2b drop complete.';
END $$;
