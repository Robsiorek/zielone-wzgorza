-- ═══════════════════════════════════════════════════════════════════════
-- E1: Create default variants for resources that don't have any.
--
-- Pricing engine (PriceEntry) requires variants. Resources without
-- variants get a default one with: name=resource name, capacity from
-- resource.maxCapacity, basePriceMinor=0 (prices come from PriceEntry).
--
-- Safe to run multiple times (ON CONFLICT DO NOTHING).
-- ═══════════════════════════════════════════════════════════════════════

INSERT INTO resource_variants (
  id, "resourceId", name, slug, capacity,
  "basePriceMinor", "sortOrder", "isActive", "isDefault",
  "createdAt", "updatedAt"
)
SELECT
  'dv_' || r.id,
  r.id,
  r.name,
  r.slug || '-default',
  COALESCE(r."maxCapacity", 4),
  0,
  0,
  true,
  true,
  NOW(),
  NOW()
FROM resources r
WHERE r.id NOT IN (SELECT DISTINCT "resourceId" FROM resource_variants)
ON CONFLICT DO NOTHING;

-- Verify
DO $$
DECLARE
  v_resources INT;
  v_with_variants INT;
  v_without INT;
BEGIN
  SELECT COUNT(*) INTO v_resources FROM resources;
  SELECT COUNT(DISTINCT "resourceId") INTO v_with_variants FROM resource_variants;
  v_without := v_resources - v_with_variants;
  RAISE NOTICE 'E1: % resources total, % with variants, % without (should be 0)', v_resources, v_with_variants, v_without;
END $$;
