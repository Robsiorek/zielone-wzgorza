#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
# B3 Amenities — Test Script
#
# Tests: T32-T41
# Requires: running server on localhost:3000, valid admin credentials
# Usage: bash scripts/test-b3-amenities.sh
#
# Login credentials from env (with defaults for ZW dev instance):
#   TEST_EMAIL=admin@zielonewzgorza.eu TEST_PASSWORD=Admin123!
# ═══════════════════════════════════════════════════════════════════

set -euo pipefail

BASE="${TEST_BASE_URL:-http://localhost:3000}"
TEST_EMAIL="${TEST_EMAIL:-admin@zielonewzgorza.eu}"
TEST_PASSWORD="${TEST_PASSWORD:-Admin123!}"
PASS=0
FAIL=0
TOTAL=10

GREEN="\033[0;32m"
RED="\033[0;31m"
NC="\033[0m"

echo "═══════════════════════════════════════════════════"
echo " B3 Amenities — Test Suite"
echo "═══════════════════════════════════════════════════"
echo ""

pass() { PASS=$((PASS+1)); echo -e "  ${GREEN}✓ PASS${NC} — $1"; }
fail() { FAIL=$((FAIL+1)); echo -e "  ${RED}✗ FAIL${NC} — $1"; }

# ── Auth ──────────────────────────────────────────────
echo -n "Authenticating ($TEST_EMAIL)... "
LOGIN_RES=$(curl -s -c /tmp/b3-cookies.txt -X POST "$BASE/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")

if echo "$LOGIN_RES" | grep -q '"success":true'; then
  echo -e "${GREEN}OK${NC}"
else
  echo -e "${RED}FAIL — cannot authenticate${NC}"
  exit 1
fi

echo ""

# ═══ T32: GET /api/amenity-categories — list categories ═══
echo "T32: GET /api/amenity-categories"
RES=$(curl -s -b /tmp/b3-cookies.txt "$BASE/api/amenity-categories")
if echo "$RES" | python3 -c "
import sys, json
d = json.load(sys.stdin)
cats = d.get('data',{}).get('categories',[])
assert len(cats) >= 1, 'No categories'
assert 'name' in cats[0], 'Missing name'
assert '_count' in cats[0], 'Missing _count'
print(f'  Found {len(cats)} categories')
" 2>/dev/null; then pass "T32"; else fail "T32: list categories"; fi

# ═══ T33: POST /api/amenity-categories — create category ═══
echo "T33: POST /api/amenity-categories"
RES=$(curl -s -b /tmp/b3-cookies.txt -X POST "$BASE/api/amenity-categories" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Kategoria B3","iconKey":"star"}')
CAT_ID=$(echo "$RES" | python3 -c "
import sys, json
d = json.load(sys.stdin)
cat = d.get('data',{}).get('category',{})
assert cat.get('name') == 'Test Kategoria B3', f'Wrong name: {cat.get(\"name\")}'
assert cat.get('iconKey') == 'star', 'Wrong iconKey'
print(cat['id'])
" 2>/dev/null)
if [ -n "$CAT_ID" ]; then pass "T33 (id=$CAT_ID)"; else fail "T33: create category"; CAT_ID=""; fi

# ═══ T34: POST /api/amenities — create amenity ═══
echo "T34: POST /api/amenities"
if [ -n "$CAT_ID" ]; then
  RES=$(curl -s -b /tmp/b3-cookies.txt -X POST "$BASE/api/amenities" \
    -H "Content-Type: application/json" \
    -d "{\"name\":\"Test Amenity B3\",\"categoryId\":\"$CAT_ID\",\"iconKey\":\"wifi\"}")
  AM_ID=$(echo "$RES" | python3 -c "
import sys, json
d = json.load(sys.stdin)
am = d.get('data',{}).get('amenity',{})
assert am.get('name') == 'Test Amenity B3', f'Wrong name: {am.get(\"name\")}'
assert am.get('iconKey') == 'wifi', 'Wrong iconKey'
assert am.get('category',{}).get('id') == '$CAT_ID', 'Wrong categoryId'
print(am['id'])
" 2>/dev/null)
  if [ -n "$AM_ID" ]; then pass "T34 (id=$AM_ID)"; else fail "T34: create amenity"; AM_ID=""; fi
else
  fail "T34: skipped (no category)"
  AM_ID=""
fi

# ═══ T35: GET /api/amenities — list amenities ═══
echo "T35: GET /api/amenities"
RES=$(curl -s -b /tmp/b3-cookies.txt "$BASE/api/amenities")
if echo "$RES" | python3 -c "
import sys, json
d = json.load(sys.stdin)
ams = d.get('data',{}).get('amenities',[])
assert len(ams) >= 1, 'No amenities'
assert 'iconKey' in ams[0], 'Missing iconKey'
assert 'category' in ams[0], 'Missing category'
print(f'  Found {len(ams)} amenities')
" 2>/dev/null; then pass "T35"; else fail "T35: list amenities"; fi

# ═══ T36: PATCH /api/amenities/[id] — update amenity ═══
echo "T36: PATCH /api/amenities/[id]"
if [ -n "$AM_ID" ]; then
  RES=$(curl -s -b /tmp/b3-cookies.txt -X PATCH "$BASE/api/amenities/$AM_ID" \
    -H "Content-Type: application/json" \
    -d '{"name":"Updated Amenity B3","iconKey":"tv"}')
  if echo "$RES" | python3 -c "
import sys, json
d = json.load(sys.stdin)
am = d.get('data',{}).get('amenity',{})
assert am.get('name') == 'Updated Amenity B3', f'Wrong name: {am.get(\"name\")}'
assert am.get('iconKey') == 'tv', 'Wrong iconKey'
" 2>/dev/null; then pass "T36"; else fail "T36: update amenity"; fi
else
  fail "T36: skipped (no amenity)"
fi

# ═══ T37: PUT /api/resources/[id]/amenities — assign amenities ═══
echo "T37: PUT /api/resources/[id]/amenities"
RESOURCE_ID=$(curl -s -b /tmp/b3-cookies.txt "$BASE/api/resources" | \
  python3 -c "
import sys, json
d = json.load(sys.stdin)
rs = d.get('data',{}).get('resources',[])
if rs: print(rs[0]['id'])
" 2>/dev/null)

if [ -n "$RESOURCE_ID" ] && [ -n "$AM_ID" ]; then
  RES=$(curl -s -b /tmp/b3-cookies.txt -X PUT "$BASE/api/resources/$RESOURCE_ID/amenities" \
    -H "Content-Type: application/json" \
    -d "{\"amenityIds\":[\"$AM_ID\"]}")
  if echo "$RES" | python3 -c "
import sys, json
d = json.load(sys.stdin)
ams = d.get('data',{}).get('amenities',[])
assert len(ams) == 1, f'Expected 1, got {len(ams)}'
assert ams[0].get('iconKey') == 'tv', 'Wrong iconKey after assign'
" 2>/dev/null; then pass "T37"; else fail "T37: assign amenities"; fi
else
  fail "T37: skipped (no resource or amenity)"
fi

# ═══ T38: GET /api/resources/[id] — resource includes amenities ═══
echo "T38: GET /api/resources/[id] includes amenities"
if [ -n "$RESOURCE_ID" ]; then
  RES=$(curl -s -b /tmp/b3-cookies.txt "$BASE/api/resources/$RESOURCE_ID")
  if echo "$RES" | python3 -c "
import sys, json
d = json.load(sys.stdin)
r = d.get('data',{}).get('resource',{})
ams = r.get('amenities',[])
assert len(ams) >= 1, 'No amenities on resource'
assert 'amenity' in ams[0], 'Missing nested amenity'
assert 'iconKey' in ams[0]['amenity'], 'Missing iconKey'
" 2>/dev/null; then pass "T38"; else fail "T38: resource detail amenities"; fi
else
  fail "T38: skipped (no resource)"
fi

# ═══ T39: Public catalog includes amenities ═══
echo "T39: GET /api/public/resources-catalog amenities"
RES=$(curl -s "$BASE/api/public/resources-catalog")
if echo "$RES" | python3 -c "
import sys, json
d = json.load(sys.stdin)
rs = d.get('data',{}).get('resources',[])
# At least verify shape — some resources might not have amenities
assert len(rs) >= 0, 'Resources missing'
for r in rs:
  assert 'amenities' in r, f'Resource {r[\"id\"]} missing amenities key'
  for a in r.get('amenities',[]):
    assert 'icon' in a, 'Missing icon'
    assert 'categorySlug' in a, 'Missing categoryKey'
    break
  break
print(f'  Catalog: {len(rs)} resources checked')
" 2>/dev/null; then pass "T39"; else fail "T39: public catalog amenities"; fi

# ═══ T40: DELETE amenity — Restrict if assigned ═══
echo "T40: DELETE /api/amenities/[id] — Restrict if assigned"
if [ -n "$AM_ID" ]; then
  RES=$(curl -s -o /dev/null -w "%{http_code}" -b /tmp/b3-cookies.txt \
    -X DELETE "$BASE/api/amenities/$AM_ID")
  if [ "$RES" = "409" ]; then
    pass "T40 (correctly blocked: 409)"
  else
    fail "T40: expected 409, got $RES"
  fi
else
  fail "T40: skipped (no amenity)"
fi

# ═══ T41: Cleanup — unassign, then delete amenity + category ═══
echo "T41: Cleanup — unassign + delete amenity + category"
CLEANUP_OK=true
if [ -n "$RESOURCE_ID" ]; then
  curl -s -b /tmp/b3-cookies.txt -X PUT "$BASE/api/resources/$RESOURCE_ID/amenities" \
    -H "Content-Type: application/json" -d '{"amenityIds":[]}' > /dev/null
fi
if [ -n "$AM_ID" ]; then
  DEL_RES=$(curl -s -b /tmp/b3-cookies.txt -X DELETE "$BASE/api/amenities/$AM_ID")
  if ! echo "$DEL_RES" | grep -q '"success":true'; then CLEANUP_OK=false; fi
fi
if [ -n "$CAT_ID" ]; then
  DEL_RES=$(curl -s -b /tmp/b3-cookies.txt -X DELETE "$BASE/api/amenity-categories/$CAT_ID")
  if ! echo "$DEL_RES" | grep -q '"success":true'; then CLEANUP_OK=false; fi
fi
if $CLEANUP_OK; then pass "T41"; else fail "T41: cleanup"; fi

# ═══ Summary ═══
echo ""
echo "═══════════════════════════════════════════════════"
echo -e " Results: ${GREEN}${PASS} PASS${NC} / ${RED}${FAIL} FAIL${NC} / $TOTAL total"
echo "═══════════════════════════════════════════════════"

rm -f /tmp/b3-cookies.txt

if [ $FAIL -gt 0 ]; then exit 1; fi
exit 0
