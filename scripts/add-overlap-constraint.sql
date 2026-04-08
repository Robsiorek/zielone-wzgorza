-- ============================================================
-- MIGRATION: Add overlap exclusion constraint to timeline_entries
-- 
-- Prevents double-booking at DATABASE level.
-- Even if two requests hit simultaneously, DB blocks the overlap.
--
-- Semantics: [) = start inclusive, end exclusive
-- This means: checkout day A = checkin day B → NO conflict (correct)
--
-- Run this ONCE on the production database.
-- ============================================================

-- Step 1: Enable btree_gist extension (required for EXCLUDE with mixed types)
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Step 2: Add exclusion constraint
-- Only applies to ACTIVE entries (cancelled ones don't block)
ALTER TABLE timeline_entries
ADD CONSTRAINT no_resource_overlap
EXCLUDE USING gist (
  resource_id WITH =,
  daterange(start_date, end_date, '[)') WITH &&
) WHERE (status = 'ACTIVE');

-- ============================================================
-- VERIFICATION: Run after migration to check for existing overlaps
-- If this returns rows, you have pre-existing overlaps to fix manually.
-- ============================================================

-- SELECT a.id AS entry_a, b.id AS entry_b, a.resource_id, 
--        a.start_date AS a_start, a.end_date AS a_end,
--        b.start_date AS b_start, b.end_date AS b_end
-- FROM timeline_entries a
-- JOIN timeline_entries b ON a.resource_id = b.resource_id 
--   AND a.id < b.id
--   AND a.status = 'ACTIVE' AND b.status = 'ACTIVE'
--   AND a.start_date < b.end_date AND a.end_date > b.start_date;
