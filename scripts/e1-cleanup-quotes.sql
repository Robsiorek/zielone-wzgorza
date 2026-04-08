-- ═══════════════════════════════════════════════════════════════════════
-- E1: Quote table created by prisma db push.
-- This script: cleanup expired quotes (run as cron daily).
-- ═══════════════════════════════════════════════════════════════════════

-- Cleanup: delete quotes older than 30 days past expiry
DELETE FROM quotes WHERE "expiresAt" < NOW() - INTERVAL '30 days';

-- Verify
DO $$
DECLARE
  v_total INT;
  v_expired INT;
  v_used INT;
BEGIN
  SELECT COUNT(*) INTO v_total FROM quotes;
  SELECT COUNT(*) INTO v_expired FROM quotes WHERE "expiresAt" < NOW();
  SELECT COUNT(*) INTO v_used FROM quotes WHERE "usedAt" IS NOT NULL;
  RAISE NOTICE 'Quotes: % total, % expired (kept 30d), % used', v_total, v_expired, v_used;
END $$;
