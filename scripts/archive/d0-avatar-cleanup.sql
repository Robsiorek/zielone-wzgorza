-- ═══════════════════════════════════════════════════════════════
-- D0: Clean old avatar URLs (one-time migration)
-- Old format: /avatars/{userId}.ext or /api/avatars/{userId}.ext
-- New format: /api/avatars/{userId}/{randomId}.ext
-- Run AFTER deploy of avatar-v3
-- ═══════════════════════════════════════════════════════════════

UPDATE users
SET avatar = NULL
WHERE avatar IS NOT NULL
  AND avatar NOT LIKE '/api/avatars/%/%';

-- Verify
DO $$
DECLARE
  v_old INT;
  v_new INT;
BEGIN
  SELECT COUNT(*) INTO v_old FROM users WHERE avatar IS NOT NULL AND avatar NOT LIKE '/api/avatars/%/%';
  SELECT COUNT(*) INTO v_new FROM users WHERE avatar IS NOT NULL AND avatar LIKE '/api/avatars/%/%';
  RAISE NOTICE 'Old format avatars remaining: % (should be 0)', v_old;
  RAISE NOTICE 'New format avatars: %', v_new;
END $$;
