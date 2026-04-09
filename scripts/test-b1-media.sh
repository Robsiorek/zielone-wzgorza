#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
# B1 Media Storage — Test Script
# Separate from test-critical.sh (ChatGPT review #5)
#
# Tests: T19-T24
# Requires: running server on localhost:3000, valid admin credentials
# Usage: bash scripts/test-b1-media.sh
#
# This is a manual smoke test designed for the ZW production/dev instance.
# Login credentials can be overridden via env:
#   TEST_EMAIL=admin@zielonewzgorza.eu TEST_PASSWORD=Admin123! bash scripts/test-b1-media.sh
#
# Known limitation: concurrent uploads to the same resource may hit
# a position unique constraint conflict (returns 500 instead of retry).
# This is documented as a B1 known limitation, not a test failure.
# ═══════════════════════════════════════════════════════════════════

set -euo pipefail

BASE="${TEST_BASE_URL:-http://localhost:3000}"
TEST_EMAIL="${TEST_EMAIL:-admin@zielonewzgorza.eu}"
TEST_PASSWORD="${TEST_PASSWORD:-Admin123!}"
PASS=0
FAIL=0
TOTAL=6

# Colors
GREEN="\033[0;32m"
RED="\033[0;31m"
YELLOW="\033[1;33m"
NC="\033[0m"

echo "═══════════════════════════════════════════════════"
echo " B1 Media Storage — Test Suite"
echo "═══════════════════════════════════════════════════"
echo ""

# ── Auth: get cookie ──────────────────────────────────
echo -n "Authenticating ($TEST_EMAIL)... "
LOGIN_RES=$(curl -s -c /tmp/b1-cookies.txt -X POST "$BASE/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")

if echo "$LOGIN_RES" | grep -q '"success":true'; then
  echo -e "${GREEN}OK${NC}"
else
  echo -e "${RED}FAIL — cannot authenticate${NC}"
  echo "$LOGIN_RES"
  exit 1
fi

# ── Helper: find first ACCOMMODATION resource with propertyId ──
RESOURCE_ID=$(curl -s -b /tmp/b1-cookies.txt "$BASE/api/resources" | \
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
  echo -e "${RED}No ACCOMMODATION resource found — cannot test${NC}"
  exit 1
fi
echo "Test resource: $RESOURCE_ID"
echo ""

# ── Helper: create test JPEG (valid magic bytes) ──────
create_test_image() {
  # Valid 1x1 PNG (tested: sharp processes it correctly)
  python3 -c "
import struct, zlib
raw = b'\x00\xff\x00\x00'
comp = zlib.compress(raw)
def chunk(ctype, data):
    c = ctype + data
    crc = struct.pack('>I', zlib.crc32(c) & 0xffffffff)
    return struct.pack('>I', len(data)) + c + crc
ihdr = chunk(b'IHDR', struct.pack('>IIBBBBB', 1, 1, 8, 2, 0, 0, 0))
idat = chunk(b'IDAT', comp)
iend = chunk(b'IEND', b'')
with open('/tmp/b1-test.png', 'wb') as f:
    f.write(b'\x89PNG\r\n\x1a\n' + ihdr + idat + iend)
" > /dev/null
}

# ── Helper: create invalid file (text with .jpg extension) ──
create_fake_image() {
  echo "This is not a JPEG file" > /tmp/b1-fake.png
}

# ── Cleanup: delete all test images before tests ──────
echo "Cleaning up existing test images..."
EXISTING=$(curl -s -b /tmp/b1-cookies.txt "$BASE/api/resources/$RESOURCE_ID" | \
  python3 -c "
import sys, json
data = json.load(sys.stdin)
images = data.get('data', {}).get('resource', {}).get('images', [])
for img in images:
    print(img['id'])
" 2>/dev/null || echo "")

for IMG_ID in $EXISTING; do
  curl -s -b /tmp/b1-cookies.txt -X DELETE "$BASE/api/resources/$RESOURCE_ID/images/$IMG_ID" > /dev/null 2>&1
done
echo ""

# ═══════════════════════════════════════════════════════
# T19 — Upload valid JPEG → 201, image in response
# ═══════════════════════════════════════════════════════
echo -n "T19  Upload valid image → 201 ............... "
create_test_image

UPLOAD_RES=$(curl -s -w "\n%{http_code}" -b /tmp/b1-cookies.txt \
  -X POST "$BASE/api/resources/$RESOURCE_ID/images" \
  -F "file=@/tmp/b1-test.png")

HTTP_CODE=$(echo "$UPLOAD_RES" | tail -1)
BODY=$(echo "$UPLOAD_RES" | sed '$d')

if [ "$HTTP_CODE" = "201" ] && echo "$BODY" | grep -q '"storageKey"'; then
  IMAGE_ID_1=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['image']['id'])" 2>/dev/null || echo "")
  echo -e "${GREEN}PASS${NC}"
  PASS=$((PASS+1))
else
  echo -e "${RED}FAIL (HTTP $HTTP_CODE)${NC}"
  FAIL=$((FAIL+1))
fi

# ═══════════════════════════════════════════════════════
# T20 — Upload fake JPEG (text file) → 400
# ═══════════════════════════════════════════════════════
echo -n "T20  MIME reject (fake JPEG) → 400 .......... "
create_fake_image

MIME_RES=$(curl -s -w "\n%{http_code}" -b /tmp/b1-cookies.txt \
  -X POST "$BASE/api/resources/$RESOURCE_ID/images" \
  -F "file=@/tmp/b1-fake.png")

MIME_CODE=$(echo "$MIME_RES" | tail -1)

if [ "$MIME_CODE" = "400" ]; then
  echo -e "${GREEN}PASS${NC}"
  PASS=$((PASS+1))
else
  echo -e "${RED}FAIL (HTTP $MIME_CODE)${NC}"
  FAIL=$((FAIL+1))
fi

# ═══════════════════════════════════════════════════════
# T21 — Set cover → isCover=true, old cover removed
# ═══════════════════════════════════════════════════════
echo -n "T21  Set cover → partial unique OK ........... "

# Upload second image
UPLOAD2_RES=$(curl -s -b /tmp/b1-cookies.txt \
  -X POST "$BASE/api/resources/$RESOURCE_ID/images" \
  -F "file=@/tmp/b1-test.png")

IMAGE_ID_2=$(echo "$UPLOAD2_RES" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['image']['id'])" 2>/dev/null || echo "")

# Set second image as cover
COVER_RES=$(curl -s -b /tmp/b1-cookies.txt \
  -X PATCH "$BASE/api/resources/$RESOURCE_ID/images/$IMAGE_ID_2" \
  -H "Content-Type: application/json" \
  -d '{"isCover":true}')

IS_COVER=$(echo "$COVER_RES" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['image']['isCover'])" 2>/dev/null || echo "")

# Verify old cover is removed
DETAIL=$(curl -s -b /tmp/b1-cookies.txt "$BASE/api/resources/$RESOURCE_ID")
COVER_COUNT=$(echo "$DETAIL" | python3 -c "
import sys, json
data = json.load(sys.stdin)
images = data.get('data', {}).get('resource', {}).get('images', [])
print(sum(1 for i in images if i.get('isCover')))
" 2>/dev/null || echo "0")

if [ "$IS_COVER" = "True" ] && [ "$COVER_COUNT" = "1" ]; then
  echo -e "${GREEN}PASS${NC}"
  PASS=$((PASS+1))
else
  echo -e "${RED}FAIL (isCover=$IS_COVER, coverCount=$COVER_COUNT)${NC}"
  FAIL=$((FAIL+1))
fi

# ═══════════════════════════════════════════════════════
# T22 — Reorder → positions updated
# ═══════════════════════════════════════════════════════
echo -n "T22  Reorder → positions updated ............. "

# Reverse the order
REORDER_RES=$(curl -s -b /tmp/b1-cookies.txt \
  -X PUT "$BASE/api/resources/$RESOURCE_ID/images/reorder" \
  -H "Content-Type: application/json" \
  -d "{\"imageIds\":[\"$IMAGE_ID_2\",\"$IMAGE_ID_1\"]}")

REORDER_OK=$(echo "$REORDER_RES" | python3 -c "
import sys, json
data = json.load(sys.stdin)
images = data.get('data', {}).get('images', [])
if len(images) >= 2 and images[0]['id'] == '$IMAGE_ID_2' and images[0]['position'] == 0:
    print('OK')
else:
    print('FAIL')
" 2>/dev/null || echo "FAIL")

if [ "$REORDER_OK" = "OK" ]; then
  echo -e "${GREEN}PASS${NC}"
  PASS=$((PASS+1))
else
  echo -e "${RED}FAIL${NC}"
  FAIL=$((FAIL+1))
fi

# ═══════════════════════════════════════════════════════
# T23 — Delete → record removed, positions reindexed
# ═══════════════════════════════════════════════════════
echo -n "T23  Delete → record removed ................. "

DEL_RES=$(curl -s -w "\n%{http_code}" -b /tmp/b1-cookies.txt \
  -X DELETE "$BASE/api/resources/$RESOURCE_ID/images/$IMAGE_ID_2")

DEL_CODE=$(echo "$DEL_RES" | tail -1)
DEL_BODY=$(echo "$DEL_RES" | sed '$d')

REMAINING_COUNT=$(echo "$DEL_BODY" | python3 -c "
import sys, json
data = json.load(sys.stdin)
print(len(data.get('data', {}).get('images', [])))
" 2>/dev/null || echo "-1")

if [ "$DEL_CODE" = "200" ] && [ "$REMAINING_COUNT" = "1" ]; then
  echo -e "${GREEN}PASS${NC}"
  PASS=$((PASS+1))
else
  echo -e "${RED}FAIL (HTTP $DEL_CODE, remaining=$REMAINING_COUNT)${NC}"
  FAIL=$((FAIL+1))
fi

# ═══════════════════════════════════════════════════════
# T24 — Limit: 21st image → 400
# ═══════════════════════════════════════════════════════
echo -n "T24  Limit 20 images → 21st rejected ........ "

# First cleanup remaining test image
if [ -n "$IMAGE_ID_1" ]; then
  curl -s -b /tmp/b1-cookies.txt -X DELETE "$BASE/api/resources/$RESOURCE_ID/images/$IMAGE_ID_1" > /dev/null 2>&1
fi

# Upload 20 images
LIMIT_OK=true
for i in $(seq 1 20); do
  UP_RES=$(curl -s -w "\n%{http_code}" -b /tmp/b1-cookies.txt \
    -X POST "$BASE/api/resources/$RESOURCE_ID/images" \
    -F "file=@/tmp/b1-test.png")
  UP_CODE=$(echo "$UP_RES" | tail -1)
  if [ "$UP_CODE" != "201" ]; then
    echo -e "${RED}FAIL (upload $i returned $UP_CODE)${NC}"
    LIMIT_OK=false
    FAIL=$((FAIL+1))
    break
  fi
done

if [ "$LIMIT_OK" = true ]; then
  # 21st should fail
  UP21_RES=$(curl -s -w "\n%{http_code}" -b /tmp/b1-cookies.txt \
    -X POST "$BASE/api/resources/$RESOURCE_ID/images" \
    -F "file=@/tmp/b1-test.png")
  UP21_CODE=$(echo "$UP21_RES" | tail -1)

  if [ "$UP21_CODE" = "400" ]; then
    echo -e "${GREEN}PASS${NC}"
    PASS=$((PASS+1))
  else
    echo -e "${RED}FAIL (21st image returned $UP21_CODE, expected 400)${NC}"
    FAIL=$((FAIL+1))
  fi
fi

# ── Cleanup test images ───────────────────────────────
echo ""
echo "Cleaning up test images..."
CLEANUP_IDS=$(curl -s -b /tmp/b1-cookies.txt "$BASE/api/resources/$RESOURCE_ID" | \
  python3 -c "
import sys, json
data = json.load(sys.stdin)
images = data.get('data', {}).get('resource', {}).get('images', [])
for img in images:
    print(img['id'])
" 2>/dev/null || echo "")

for CID in $CLEANUP_IDS; do
  curl -s -b /tmp/b1-cookies.txt -X DELETE "$BASE/api/resources/$RESOURCE_ID/images/$CID" > /dev/null 2>&1
done

# ── Cleanup temp files ────────────────────────────────
rm -f /tmp/b1-test.png /tmp/b1-fake.png /tmp/b1-cookies.txt

# ═══════════════════════════════════════════════════════
# Results
# ═══════════════════════════════════════════════════════
echo ""
echo "═══════════════════════════════════════════════════"
if [ $FAIL -eq 0 ]; then
  echo -e " B1 Media: ${GREEN}$PASS/$TOTAL PASS${NC}"
else
  echo -e " B1 Media: ${RED}$FAIL FAIL${NC} / $TOTAL total"
fi
echo "═══════════════════════════════════════════════════"

exit $FAIL
