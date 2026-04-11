-- ═══════════════════════════════════════════════════════════════════════
-- D0 MIGRATION: User roles + settings cleanup
-- Run AFTER prisma db push adds UserRole enum + new columns
-- ═══════════════════════════════════════════════════════════════════════

-- ──────────────────────────────────────────────────────────────
-- 1. Backfill existing users: "admin" → OWNER
-- ──────────────────────────────────────────────────────────────
-- Note: db push creates UserRole enum and changes column type.
-- Prisma will cast existing string values. If that fails,
-- this script handles it manually.

-- If role column is still String (db push didn't auto-cast):
-- UPDATE users SET role = 'OWNER' WHERE role = 'admin';

-- ──────────────────────────────────────────────────────────────
-- 2. Rename lastLogin → lastLoginAt
-- ──────────────────────────────────────────────────────────────
-- Prisma db push may create new column and leave old one.
-- Copy data if both exist:
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'lastLogin')
  AND EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'lastLoginAt') THEN

    UPDATE users SET "lastLoginAt" = "lastLogin" WHERE "lastLoginAt" IS NULL AND "lastLogin" IS NOT NULL;
    ALTER TABLE users DROP COLUMN IF EXISTS "lastLogin";
    RAISE NOTICE 'Renamed lastLogin → lastLoginAt (data copied, old column dropped)';

  ELSIF EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'lastLogin')
  AND NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'lastLoginAt') THEN

    ALTER TABLE users RENAME COLUMN "lastLogin" TO "lastLoginAt";
    RAISE NOTICE 'Renamed lastLogin → lastLoginAt (direct rename)';

  ELSE
    RAISE NOTICE 'lastLoginAt already exists or lastLogin missing — no action needed';
  END IF;
END $$;

-- ──────────────────────────────────────────────────────────────
-- 3. Ensure mustChangePassword column exists with default
-- ──────────────────────────────────────────────────────────────
-- db push should handle this, but set existing users to false:
UPDATE users SET "mustChangePassword" = false WHERE "mustChangePassword" IS NULL;

-- ──────────────────────────────────────────────────────────────
-- 4. Verification
-- ──────────────────────────────────────────────────────────────
DO $$
DECLARE
  v_count INT;
  v_role TEXT;
BEGIN
  SELECT COUNT(*) INTO v_count FROM users;
  RAISE NOTICE 'D0: % users in database', v_count;

  SELECT role::text INTO v_role FROM users LIMIT 1;
  RAISE NOTICE 'D0: First user role = %', v_role;

  IF EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'lastLogin') THEN
    RAISE WARNING 'D0: Old column lastLogin still exists!';
  ELSE
    RAISE NOTICE 'D0: lastLogin column gone — OK';
  END IF;

  RAISE NOTICE 'D0 migration verification complete.';
END $$;
