#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
# B4 Property Content — Test Script
#
# Tests: T42-T57
# Requires: running server on localhost:3000, valid admin credentials
# Usage: bash scripts/test-b4-property-content.sh
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
TOTAL=16

GREEN="\033[0;32m"
RED="\033[0;31m"
NC="\033[0m"

echo "═══════════════════════════════════════════════════"
echo " B4 Property Content — Test Suite"
echo "═══════════════════════════════════════════════════"
echo ""

pass() { PASS=$((PASS+1)); echo -e "  ${GREEN}✓ PASS${NC} — $1"; }
fail() { FAIL=$((FAIL+1)); echo -e "  ${RED}✗ FAIL${NC} — $1"; }

# ── Auth ──────────────────────────────────────────────
echo -n "Authenticating ($TEST_EMAIL)... "
LOGIN_RES=$(curl -s -c /tmp/b4-cookies.txt -X POST "$BASE/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")

if echo "$LOGIN_RES" | grep -q '"success":true'; then
  echo -e "${GREEN}OK${NC}"
else
  echo -e "${RED}FAIL — cannot authenticate${NC}"
  exit 1
fi

echo ""

# ═══ T42: GET /api/property-content — empty (frozen shape with nulls) ═══
echo "T42: GET /api/property-content (empty)"
RES=$(curl -s -b /tmp/b4-cookies.txt "$BASE/api/property-content")
if echo "$RES" | python3 -c "
import sys, json
d = json.load(sys.stdin)
pc = d.get('data',{}).get('propertyContent',{})
assert pc.get('heroTitle') is None, 'heroTitle should be null'
assert pc.get('guestCountry') == 'PL', 'guestCountry should default to PL'
assert 'directionsDescription' in pc, 'Missing directionsDescription field'
print('  Frozen shape OK (all nulls + country=PL)')
" 2>/dev/null; then pass "T42"; else fail "T42: empty property content"; fi

# ═══ T43: PATCH /api/property-content — upsert (create) ═══
echo "T43: PATCH /api/property-content (upsert create)"
RES=$(curl -s -b /tmp/b4-cookies.txt -X PATCH "$BASE/api/property-content" \
  -H "Content-Type: application/json" \
  -d '{"heroTitle":"Zielone Wzgórza","heroSubtitle":"Twoje miejsce na wypoczynek","shortDescription":"Ośrodek nad jeziorem"}')
if echo "$RES" | python3 -c "
import sys, json
d = json.load(sys.stdin)
pc = d.get('data',{}).get('propertyContent',{})
assert pc.get('heroTitle') == 'Zielone Wzgórza', f'Wrong heroTitle: {pc.get(\"heroTitle\")}'
assert pc.get('heroSubtitle') == 'Twoje miejsce na wypoczynek', 'Wrong heroSubtitle'
assert pc.get('shortDescription') == 'Ośrodek nad jeziorem', 'Wrong shortDescription'
print('  Created with 3 fields')
" 2>/dev/null; then pass "T43"; else fail "T43: upsert create"; fi

# ═══ T44: PATCH /api/property-content — partial update ═══
echo "T44: PATCH /api/property-content (partial update)"
RES=$(curl -s -b /tmp/b4-cookies.txt -X PATCH "$BASE/api/property-content" \
  -H "Content-Type: application/json" \
  -d '{"guestContactPhone":"+48 123 456 789","guestCity":"Stare Jabłonki"}')
if echo "$RES" | python3 -c "
import sys, json
d = json.load(sys.stdin)
pc = d.get('data',{}).get('propertyContent',{})
assert pc.get('guestContactPhone') == '+48 123 456 789', 'Wrong phone'
assert pc.get('guestCity') == 'Stare Jabłonki', 'Wrong city'
assert pc.get('heroTitle') == 'Zielone Wzgórza', 'heroTitle should be preserved'
print('  Partial update OK, previous fields preserved')
" 2>/dev/null; then pass "T44"; else fail "T44: partial update"; fi

# ═══ T45: GET /api/property-content — after upsert ═══
echo "T45: GET /api/property-content (after upsert)"
RES=$(curl -s -b /tmp/b4-cookies.txt "$BASE/api/property-content")
if echo "$RES" | python3 -c "
import sys, json
d = json.load(sys.stdin)
pc = d.get('data',{}).get('propertyContent',{})
assert pc.get('heroTitle') == 'Zielone Wzgórza', 'heroTitle missing'
assert pc.get('guestContactPhone') == '+48 123 456 789', 'phone missing'
assert pc.get('fullDescription') is None, 'fullDescription should still be null'
print('  All fields consistent')
" 2>/dev/null; then pass "T45"; else fail "T45: GET after upsert"; fi

# ═══ T46: POST /api/property-content/trust-badges — create badge ═══
echo "T46: POST trust-badges"
RES=$(curl -s -b /tmp/b4-cookies.txt -X POST "$BASE/api/property-content/trust-badges" \
  -H "Content-Type: application/json" \
  -d '{"label":"Bezpłatny parking","iconKey":"car","description":"Parking na terenie ośrodka"}')
BADGE_ID=$(echo "$RES" | python3 -c "
import sys, json
d = json.load(sys.stdin)
b = d.get('data',{}).get('trustBadge',{})
assert b.get('label') == 'Bezpłatny parking', f'Wrong label: {b.get(\"label\")}'
assert b.get('iconKey') == 'car', 'Wrong iconKey'
assert b.get('position') == 0, f'Wrong position: {b.get(\"position\")}'
assert b.get('isActive') == True, 'Should be active'
print(b['id'])
" 2>/dev/null)
if [ -n "$BADGE_ID" ]; then pass "T46 (id=$BADGE_ID)"; else fail "T46: create badge"; BADGE_ID=""; fi

# ═══ T47: GET /api/property-content/trust-badges — list ═══
echo "T47: GET trust-badges"
RES=$(curl -s -b /tmp/b4-cookies.txt "$BASE/api/property-content/trust-badges")
if echo "$RES" | python3 -c "
import sys, json
d = json.load(sys.stdin)
badges = d.get('data',{}).get('trustBadges',[])
assert len(badges) >= 1, f'Expected >= 1 badge, got {len(badges)}'
assert badges[0].get('label') == 'Bezpłatny parking', 'Wrong first badge'
print(f'  Found {len(badges)} badge(s)')
" 2>/dev/null; then pass "T47"; else fail "T47: list badges"; fi

# Create second badge for reorder test
BADGE2_RES=$(curl -s -b /tmp/b4-cookies.txt -X POST "$BASE/api/property-content/trust-badges" \
  -H "Content-Type: application/json" \
  -d '{"label":"WiFi w całym obiekcie","iconKey":"wifi"}')
BADGE2_ID=$(echo "$BADGE2_RES" | python3 -c "
import sys, json
d = json.load(sys.stdin)
print(d.get('data',{}).get('trustBadge',{}).get('id',''))
" 2>/dev/null)

# ═══ T48: PATCH /api/property-content/trust-badges/[id] — update ═══
echo "T48: PATCH trust-badges/[id]"
if [ -n "$BADGE_ID" ]; then
  RES=$(curl -s -b /tmp/b4-cookies.txt -X PATCH "$BASE/api/property-content/trust-badges/$BADGE_ID" \
    -H "Content-Type: application/json" \
    -d '{"label":"Darmowy parking","isActive":false}')
  if echo "$RES" | python3 -c "
import sys, json
d = json.load(sys.stdin)
b = d.get('data',{}).get('trustBadge',{})
assert b.get('label') == 'Darmowy parking', f'Wrong label: {b.get(\"label\")}'
assert b.get('isActive') == False, 'Should be inactive'
assert b.get('iconKey') == 'car', 'iconKey should be preserved'
print('  Updated label + isActive, iconKey preserved')
" 2>/dev/null; then pass "T48"; else fail "T48: update badge"; fi
else
  fail "T48: skipped (no badge)"
fi

# ═══ T49: PATCH /api/property-content/trust-badges/reorder ═══
echo "T49: PATCH trust-badges/reorder"
if [ -n "$BADGE_ID" ] && [ -n "$BADGE2_ID" ]; then
  RES=$(curl -s -b /tmp/b4-cookies.txt -X PATCH "$BASE/api/property-content/trust-badges/reorder" \
    -H "Content-Type: application/json" \
    -d "{\"order\":[{\"id\":\"$BADGE2_ID\",\"position\":0},{\"id\":\"$BADGE_ID\",\"position\":1}]}")
  # Verify via GET that order persisted
  VERIFY=$(curl -s -b /tmp/b4-cookies.txt "$BASE/api/property-content/trust-badges")
  if echo "$VERIFY" | python3 -c "
import sys, json
d = json.load(sys.stdin)
badges = d.get('data',{}).get('trustBadges',[])
assert len(badges) >= 2, f'Expected >= 2 badges, got {len(badges)}'
assert badges[0]['id'] == '$BADGE2_ID', f'First should be badge2, got {badges[0][\"id\"]}'
assert badges[1]['id'] == '$BADGE_ID', f'Second should be badge1, got {badges[1][\"id\"]}'
assert badges[0]['position'] < badges[1]['position'], 'Position order wrong'
print('  Reordered 2 badges — GET confirms new order')
" 2>/dev/null; then pass "T49"; else fail "T49: reorder badges (GET verify)"; fi
else
  fail "T49: skipped (missing badges)"
fi

# ═══ T50: DELETE /api/property-content/trust-badges/[id] ═══
echo "T50: DELETE trust-badges/[id]"
if [ -n "$BADGE_ID" ]; then
  RES=$(curl -s -b /tmp/b4-cookies.txt -X DELETE "$BASE/api/property-content/trust-badges/$BADGE_ID")
  if echo "$RES" | python3 -c "
import sys, json
d = json.load(sys.stdin)
assert d.get('data',{}).get('deleted') == True, 'Should be deleted'
print('  Badge deleted')
" 2>/dev/null; then pass "T50"; else fail "T50: delete badge"; fi
else
  fail "T50: skipped (no badge)"
fi

# ═══ T51: POST /api/property-content/faq — create FAQ item ═══
echo "T51: POST faq"
RES=$(curl -s -b /tmp/b4-cookies.txt -X POST "$BASE/api/property-content/faq" \
  -H "Content-Type: application/json" \
  -d '{"question":"Czy można przyjechać ze zwierzętami?","answer":"Tak, akceptujemy zwierzęta domowe za dodatkową opłatą 50 zł/dobę."}')
FAQ_ID=$(echo "$RES" | python3 -c "
import sys, json
d = json.load(sys.stdin)
f = d.get('data',{}).get('faqItem',{})
assert 'zwierzętami' in f.get('question',''), 'Wrong question'
assert f.get('position') == 0, f'Wrong position: {f.get(\"position\")}'
assert f.get('isActive') == True, 'Should be active'
print(f['id'])
" 2>/dev/null)
if [ -n "$FAQ_ID" ]; then pass "T51 (id=$FAQ_ID)"; else fail "T51: create FAQ"; FAQ_ID=""; fi

# ═══ T52: GET /api/property-content/faq — list ═══
echo "T52: GET faq"
RES=$(curl -s -b /tmp/b4-cookies.txt "$BASE/api/property-content/faq")
if echo "$RES" | python3 -c "
import sys, json
d = json.load(sys.stdin)
items = d.get('data',{}).get('faqItems',[])
assert len(items) >= 1, f'Expected >= 1 FAQ, got {len(items)}'
print(f'  Found {len(items)} FAQ item(s)')
" 2>/dev/null; then pass "T52"; else fail "T52: list FAQ"; fi

# Create second FAQ for reorder test
FAQ2_RES=$(curl -s -b /tmp/b4-cookies.txt -X POST "$BASE/api/property-content/faq" \
  -H "Content-Type: application/json" \
  -d '{"question":"Jak dojechać?","answer":"Najlepiej drogą krajową nr 16 od strony Olsztyna."}')
FAQ2_ID=$(echo "$FAQ2_RES" | python3 -c "
import sys, json
d = json.load(sys.stdin)
print(d.get('data',{}).get('faqItem',{}).get('id',''))
" 2>/dev/null)

# ═══ T53: PATCH /api/property-content/faq/[id] — update ═══
echo "T53: PATCH faq/[id]"
if [ -n "$FAQ_ID" ]; then
  RES=$(curl -s -b /tmp/b4-cookies.txt -X PATCH "$BASE/api/property-content/faq/$FAQ_ID" \
    -H "Content-Type: application/json" \
    -d '{"answer":"Tak! Zwierzęta mile widziane. Opłata 50 zł/dobę.","isActive":false}')
  if echo "$RES" | python3 -c "
import sys, json
d = json.load(sys.stdin)
f = d.get('data',{}).get('faqItem',{})
assert 'mile widziane' in f.get('answer',''), 'Wrong answer'
assert f.get('isActive') == False, 'Should be inactive'
print('  Updated answer + isActive')
" 2>/dev/null; then pass "T53"; else fail "T53: update FAQ"; fi
else
  fail "T53: skipped (no FAQ)"
fi

# ═══ T54: PATCH /api/property-content/faq/reorder ═══
echo "T54: PATCH faq/reorder"
if [ -n "$FAQ_ID" ] && [ -n "$FAQ2_ID" ]; then
  RES=$(curl -s -b /tmp/b4-cookies.txt -X PATCH "$BASE/api/property-content/faq/reorder" \
    -H "Content-Type: application/json" \
    -d "{\"order\":[{\"id\":\"$FAQ2_ID\",\"position\":0},{\"id\":\"$FAQ_ID\",\"position\":1}]}")
  # Verify via GET that order persisted
  VERIFY=$(curl -s -b /tmp/b4-cookies.txt "$BASE/api/property-content/faq")
  if echo "$VERIFY" | python3 -c "
import sys, json
d = json.load(sys.stdin)
items = d.get('data',{}).get('faqItems',[])
assert len(items) >= 2, f'Expected >= 2 FAQ, got {len(items)}'
assert items[0]['id'] == '$FAQ2_ID', f'First should be faq2, got {items[0][\"id\"]}'
assert items[1]['id'] == '$FAQ_ID', f'Second should be faq1, got {items[1][\"id\"]}'
assert items[0]['position'] < items[1]['position'], 'Position order wrong'
print('  Reordered 2 FAQ — GET confirms new order')
" 2>/dev/null; then pass "T54"; else fail "T54: reorder FAQ (GET verify)"; fi
else
  fail "T54: skipped (missing FAQ items)"
fi

# ═══ T55: DELETE /api/property-content/faq/[id] ═══
echo "T55: DELETE faq/[id]"
if [ -n "$FAQ_ID" ]; then
  RES=$(curl -s -b /tmp/b4-cookies.txt -X DELETE "$BASE/api/property-content/faq/$FAQ_ID")
  if echo "$RES" | python3 -c "
import sys, json
d = json.load(sys.stdin)
assert d.get('data',{}).get('deleted') == True, 'Should be deleted'
print('  FAQ item deleted')
" 2>/dev/null; then pass "T55"; else fail "T55: delete FAQ"; fi
else
  fail "T55: skipped (no FAQ)"
fi

# ═══ T56: GET /api/public/property-content — frozen public shape ═══
echo "T56: GET /api/public/property-content"
RES=$(curl -s "$BASE/api/public/property-content")
if echo "$RES" | python3 -c "
import sys, json
d = json.load(sys.stdin)
data = d.get('data', {})
pc = data.get('propertyContent', {})
badges = data.get('trustBadges', [])
faq = data.get('faqItems', [])

# Verify frozen content shape
assert 'heroTitle' in pc, 'Missing heroTitle in public shape'
assert 'directionsDescription' in pc, 'Missing directionsDescription in public shape'
assert pc.get('heroTitle') == 'Zielone Wzgórza', 'heroTitle should be present'

# Verify badges are filtered (only active) — badge1 was deleted, badge2 is active
for b in badges:
    assert 'isActive' not in b, 'isActive should not be in public badge shape'
    assert 'propertyId' not in b, 'propertyId should not be in public shape'
    assert 'id' in b and 'label' in b and 'iconKey' in b, 'Missing badge fields'

# Verify FAQ are filtered (only active) — faq1 was deleted, faq2 is active
for f in faq:
    assert 'isActive' not in f, 'isActive should not be in public FAQ shape'
    assert 'propertyId' not in f, 'propertyId should not be in public shape'
    assert 'id' in f and 'question' in f and 'answer' in f, 'Missing FAQ fields'

print(f'  Public shape OK: content + {len(badges)} badge(s) + {len(faq)} FAQ')
" 2>/dev/null; then pass "T56"; else fail "T56: public property-content"; fi

# ═══ T57: Cleanup — remove test data ═══
echo "T57: Cleanup"
CLEANUP_OK=true

# Delete remaining badge (badge2)
if [ -n "$BADGE2_ID" ]; then
  DEL_RES=$(curl -s -b /tmp/b4-cookies.txt -X DELETE "$BASE/api/property-content/trust-badges/$BADGE2_ID")
  if ! echo "$DEL_RES" | grep -q '"deleted":true'; then
    echo "  Warning: could not delete badge2 ($BADGE2_ID)"
    CLEANUP_OK=false
  fi
fi

# Delete remaining FAQ (faq2)
if [ -n "$FAQ2_ID" ]; then
  DEL_RES=$(curl -s -b /tmp/b4-cookies.txt -X DELETE "$BASE/api/property-content/faq/$FAQ2_ID")
  if ! echo "$DEL_RES" | grep -q '"deleted":true'; then
    echo "  Warning: could not delete faq2 ($FAQ2_ID)"
    CLEANUP_OK=false
  fi
fi

# Reset property content to clean state
RESET_RES=$(curl -s -b /tmp/b4-cookies.txt -X PATCH "$BASE/api/property-content" \
  -H "Content-Type: application/json" \
  -d '{"heroTitle":null,"heroSubtitle":null,"shortDescription":null,"guestContactPhone":null,"guestCity":null}')
if echo "$RESET_RES" | grep -q '"success":true'; then
  true
else
  echo "  Warning: could not reset property content"
  CLEANUP_OK=false
fi

if $CLEANUP_OK; then pass "T57 (cleanup)"; else fail "T57: cleanup incomplete"; fi

# ── Summary ─────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════"
echo -e " Results: ${GREEN}${PASS} PASS${NC} / ${RED}${FAIL} FAIL${NC} / ${TOTAL} total"
echo "═══════════════════════════════════════════════════"

rm -f /tmp/b4-cookies.txt

if [ "$FAIL" -gt 0 ]; then exit 1; fi
