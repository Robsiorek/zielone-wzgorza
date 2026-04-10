#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
# B2 Resource Content — Test Script
# Separate from test-critical.sh and test-b1-media.sh
#
# Tests: T25-T31
# Requires: running server on localhost:3000, valid admin credentials
# Usage: bash scripts/test-b2-content.sh
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
TOTAL=7

GREEN="\033[0;32m"
RED="\033[0;31m"
NC="\033[0m"

echo "═══════════════════════════════════════════════════"
echo " B2 Resource Content — Test Suite"
echo "═══════════════════════════════════════════════════"
echo ""

# ── Auth ──────────────────────────────────────────────
echo -n "Authenticating ($TEST_EMAIL)... "
LOGIN_RES=$(curl -s -c /tmp/b2-cookies.txt -X POST "$BASE/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")

if echo "$LOGIN_RES" | grep -q '"success":true'; then
  echo -e "${GREEN}OK${NC}"
else
  echo -e "${RED}FAIL — cannot authenticate${NC}"
  exit 1
fi

# ── Find test resource ────────────────────────────────
RESOURCE_ID=$(curl -s -b /tmp/b2-cookies.txt "$BASE/api/resources" | \
  python3 -c "
import sys, json
data = json.load(sys.stdin)
resources = data.get('data', {}).get('resources', [])
for r in resources:
    if r.get('category', {}).get('type') == 'ACCOMMODATION':
        print(r['id'])
        break
" 2>/dev/null || echo "")

if [ -z "$RESOURCE_ID" ]; then
  echo -e "${RED}No ACCOMMODATION resource found${NC}"
  exit 1
fi
echo "Test resource: $RESOURCE_ID"
echo ""

# ═══════════════════════════════════════════════════════
# T25 — PUT beds: replace → 200
# ═══════════════════════════════════════════════════════
echo -n "T25  PUT beds replace → 200 .................. "
BEDS_RES=$(curl -s -w "\n%{http_code}" -b /tmp/b2-cookies.txt \
  -X PUT "$BASE/api/resources/$RESOURCE_ID/beds" \
  -H "Content-Type: application/json" \
  -d '{"beds":[{"bedType":"DOUBLE","quantity":1},{"bedType":"SINGLE","quantity":2}]}')

BEDS_CODE=$(echo "$BEDS_RES" | tail -1)
BEDS_BODY=$(echo "$BEDS_RES" | sed '$d')

BEDS_COUNT=$(echo "$BEDS_BODY" | python3 -c "
import sys, json
data = json.load(sys.stdin)
beds = data.get('data', {}).get('beds', [])
print(len(beds))
" 2>/dev/null || echo "0")

if [ "$BEDS_CODE" = "200" ] && [ "$BEDS_COUNT" = "2" ]; then
  echo -e "${GREEN}PASS${NC}"
  PASS=$((PASS+1))
else
  echo -e "${RED}FAIL (HTTP $BEDS_CODE, beds=$BEDS_COUNT)${NC}"
  FAIL=$((FAIL+1))
fi

# ═══════════════════════════════════════════════════════
# T26 — PUT beds: invalid bedType → 400
# ═══════════════════════════════════════════════════════
echo -n "T26  PUT beds invalid type → 400 ............. "
INVALID_RES=$(curl -s -w "\n%{http_code}" -b /tmp/b2-cookies.txt \
  -X PUT "$BASE/api/resources/$RESOURCE_ID/beds" \
  -H "Content-Type: application/json" \
  -d '{"beds":[{"bedType":"WATERBED","quantity":1}]}')

INVALID_CODE=$(echo "$INVALID_RES" | tail -1)

if [ "$INVALID_CODE" = "400" ]; then
  echo -e "${GREEN}PASS${NC}"
  PASS=$((PASS+1))
else
  echo -e "${RED}FAIL (HTTP $INVALID_CODE)${NC}"
  FAIL=$((FAIL+1))
fi

# ═══════════════════════════════════════════════════════
# T27 — PUT beds: duplicate bedType → 400
# ═══════════════════════════════════════════════════════
echo -n "T27  PUT beds duplicate type → 400 ........... "
DUP_RES=$(curl -s -w "\n%{http_code}" -b /tmp/b2-cookies.txt \
  -X PUT "$BASE/api/resources/$RESOURCE_ID/beds" \
  -H "Content-Type: application/json" \
  -d '{"beds":[{"bedType":"DOUBLE","quantity":1},{"bedType":"DOUBLE","quantity":2}]}')

DUP_CODE=$(echo "$DUP_RES" | tail -1)

if [ "$DUP_CODE" = "400" ]; then
  echo -e "${GREEN}PASS${NC}"
  PASS=$((PASS+1))
else
  echo -e "${RED}FAIL (HTTP $DUP_CODE)${NC}"
  FAIL=$((FAIL+1))
fi

# ═══════════════════════════════════════════════════════
# T28 — PUT beds: empty array → 200, beds cleared
# ═══════════════════════════════════════════════════════
echo -n "T28  PUT beds empty → 200, cleared ........... "
EMPTY_RES=$(curl -s -w "\n%{http_code}" -b /tmp/b2-cookies.txt \
  -X PUT "$BASE/api/resources/$RESOURCE_ID/beds" \
  -H "Content-Type: application/json" \
  -d '{"beds":[]}')

EMPTY_CODE=$(echo "$EMPTY_RES" | tail -1)
EMPTY_BODY=$(echo "$EMPTY_RES" | sed '$d')

EMPTY_COUNT=$(echo "$EMPTY_BODY" | python3 -c "
import sys, json
data = json.load(sys.stdin)
print(len(data.get('data', {}).get('beds', ['x'])))
" 2>/dev/null || echo "-1")

if [ "$EMPTY_CODE" = "200" ] && [ "$EMPTY_COUNT" = "0" ]; then
  echo -e "${GREEN}PASS${NC}"
  PASS=$((PASS+1))
else
  echo -e "${RED}FAIL (HTTP $EMPTY_CODE, beds=$EMPTY_COUNT)${NC}"
  FAIL=$((FAIL+1))
fi

# ═══════════════════════════════════════════════════════
# T29 — PATCH resource: B2 content fields → 200
# ═══════════════════════════════════════════════════════
echo -n "T29  PATCH resource content fields → 200 ..... "
PATCH_RES=$(curl -s -w "\n%{http_code}" -b /tmp/b2-cookies.txt \
  -X PATCH "$BASE/api/resources/$RESOURCE_ID" \
  -H "Content-Type: application/json" \
  -d '{"shortDescription":"Testowy krótki opis","longDescription":"# Testowy opis\n\nPełny opis w Markdown.","bedroomCount":2,"bathroomCount":1,"areaSqm":45}')

PATCH_CODE=$(echo "$PATCH_RES" | tail -1)
PATCH_BODY=$(echo "$PATCH_RES" | sed '$d')

PATCH_OK=$(echo "$PATCH_BODY" | python3 -c "
import sys, json
data = json.load(sys.stdin)
r = data.get('data', {}).get('resource', {})
ok = (r.get('shortDescription') == 'Testowy krótki opis'
  and r.get('bedroomCount') == 2
  and r.get('bathroomCount') == 1
  and r.get('areaSqm') == 45)
print('OK' if ok else 'FAIL')
" 2>/dev/null || echo "FAIL")

if [ "$PATCH_CODE" = "200" ] && [ "$PATCH_OK" = "OK" ]; then
  echo -e "${GREEN}PASS${NC}"
  PASS=$((PASS+1))
else
  echo -e "${RED}FAIL (HTTP $PATCH_CODE, check=$PATCH_OK)${NC}"
  FAIL=$((FAIL+1))
fi

# ═══════════════════════════════════════════════════════
# T30 — GET resource: beds + new fields in response
# ═══════════════════════════════════════════════════════
echo -n "T30  GET resource includes B2 fields ......... "

# First put beds back for verification
curl -s -b /tmp/b2-cookies.txt \
  -X PUT "$BASE/api/resources/$RESOURCE_ID/beds" \
  -H "Content-Type: application/json" \
  -d '{"beds":[{"bedType":"QUEEN","quantity":1}]}' > /dev/null

GET_RES=$(curl -s -b /tmp/b2-cookies.txt "$BASE/api/resources/$RESOURCE_ID")

GET_OK=$(echo "$GET_RES" | python3 -c "
import sys, json
data = json.load(sys.stdin)
r = data.get('data', {}).get('resource', {})
has_beds = len(r.get('beds', [])) > 0
has_short = 'shortDescription' in r
has_long = 'longDescription' in r
has_area = 'areaSqm' in r
has_bed_count = 'bedroomCount' in r
has_bath_count = 'bathroomCount' in r
print('OK' if all([has_beds, has_short, has_long, has_area, has_bed_count, has_bath_count]) else 'FAIL')
" 2>/dev/null || echo "FAIL")

if [ "$GET_OK" = "OK" ]; then
  echo -e "${GREEN}PASS${NC}"
  PASS=$((PASS+1))
else
  echo -e "${RED}FAIL${NC}"
  FAIL=$((FAIL+1))
fi

# ═══════════════════════════════════════════════════════
# T31 — GET public catalog: B2 fields present
# ═══════════════════════════════════════════════════════
echo -n "T31  Public catalog includes B2 fields ....... "

CATALOG_RES=$(curl -s "$BASE/api/public/resources-catalog")

CATALOG_OK=$(echo "$CATALOG_RES" | python3 -c "
import sys, json
data = json.load(sys.stdin)
resources = data.get('data', {}).get('resources', [])
if len(resources) == 0:
    print('EMPTY')
else:
    r = resources[0]
    has_short = 'shortDescription' in r
    has_long = 'longDescription' in r
    has_area = 'areaSqm' in r
    has_beds = 'beds' in r
    print('OK' if all([has_short, has_long, has_area, has_beds]) else 'FAIL')
" 2>/dev/null || echo "FAIL")

if [ "$CATALOG_OK" = "OK" ]; then
  echo -e "${GREEN}PASS${NC}"
  PASS=$((PASS+1))
else
  echo -e "${RED}FAIL ($CATALOG_OK)${NC}"
  FAIL=$((FAIL+1))
fi

# ── Cleanup test data ─────────────────────────────────
echo ""
echo "Cleaning up test data..."
curl -s -b /tmp/b2-cookies.txt -X PATCH "$BASE/api/resources/$RESOURCE_ID" \
  -H "Content-Type: application/json" \
  -d '{"shortDescription":null,"longDescription":null,"bedroomCount":null,"bathroomCount":null,"areaSqm":null}' > /dev/null
curl -s -b /tmp/b2-cookies.txt -X PUT "$BASE/api/resources/$RESOURCE_ID/beds" \
  -H "Content-Type: application/json" \
  -d '{"beds":[]}' > /dev/null
rm -f /tmp/b2-cookies.txt

# ═══════════════════════════════════════════════════════
echo ""
echo "═══════════════════════════════════════════════════"
if [ $FAIL -eq 0 ]; then
  echo -e " B2 Content: ${GREEN}$PASS/$TOTAL PASS${NC}"
else
  echo -e " B2 Content: ${RED}$FAIL FAIL${NC} / $TOTAL total"
fi
echo "═══════════════════════════════════════════════════"

exit $FAIL
