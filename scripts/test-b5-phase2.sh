#!/bin/bash
# ═══════════════════════════════════════════
# B5a Faza 2 — Testy fundamentów
# ═══════════════════════════════════════════
#
# Testy kontraktu technicznego Fazy 2:
# - root (/) renderuje engine entry (nie redirect do /admin)
# - parametry URL są parsowane (daty pre-fill, nie auto-skip — Faza 5)
# - /booking → 307 redirect do /
# - by-slug endpoint działa
# - regresja istniejących API
#
# Uruchom: bash scripts/test-b5-phase2.sh [base_url]
# Default: https://booking.zielonewzgorza.eu

set -euo pipefail

BASE="${1:-https://booking.zielonewzgorza.eu}"
PASS=0
FAIL=0
TOTAL=0

red()   { echo -e "\033[0;31m$1\033[0m"; }
green() { echo -e "\033[0;32m$1\033[0m"; }
blue()  { echo -e "\033[0;34m$1\033[0m"; }

check_http() {
  TOTAL=$((TOTAL+1))
  local label="$1"
  local url="$2"
  local expected_code="$3"

  local actual_code
  actual_code=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "000")

  if [ "$actual_code" = "$expected_code" ]; then
    PASS=$((PASS+1))
    green "  ✅ $label (HTTP $actual_code)"
  else
    FAIL=$((FAIL+1))
    red "  ❌ $label — expected $expected_code, got $actual_code"
  fi
}

check_body_contains() {
  TOTAL=$((TOTAL+1))
  local label="$1"
  local url="$2"
  local needle="$3"

  local body
  body=$(curl -sL "$url" 2>/dev/null)
  if echo "$body" | grep -q "$needle"; then
    PASS=$((PASS+1))
    green "  ✅ $label"
  else
    FAIL=$((FAIL+1))
    red "  ❌ $label — '$needle' not found in response"
  fi
}

check_body_not_contains() {
  TOTAL=$((TOTAL+1))
  local label="$1"
  local url="$2"
  local needle="$3"

  local body
  body=$(curl -sL "$url" 2>/dev/null)
  if echo "$body" | grep -q "$needle"; then
    FAIL=$((FAIL+1))
    red "  ❌ $label — '$needle' found but should not be"
  else
    PASS=$((PASS+1))
    green "  ✅ $label"
  fi
}

check_json_field() {
  TOTAL=$((TOTAL+1))
  local label="$1"
  local url="$2"
  local field="$3"

  local body
  body=$(curl -s "$url" 2>/dev/null)
  if echo "$body" | grep -q "\"$field\""; then
    PASS=$((PASS+1))
    green "  ✅ $label"
  else
    FAIL=$((FAIL+1))
    red "  ❌ $label — field '$field' not found"
  fi
}

echo ""
blue "═══════════════════════════════════════════"
blue "  B5a FAZA 2 — Testy fundamentów"
blue "  Base: $BASE"
blue "═══════════════════════════════════════════"
echo ""

# ══════════════════════════════════════
# Root routing — kontrakt techniczny
# ══════════════════════════════════════
blue "── Root engine entry ──"

# T58: Root zwraca 200 (engine entry, nie redirect)
check_http "T58 GET / → 200 (engine entry)" "$BASE/" "200"

# T58b: Root renderuje engine-root (CSS class .engine-root)
check_body_contains "T58b / contains engine-root class" "$BASE/" "engine-root"

# T58c: Root NIE redirectuje do /admin
check_body_not_contains "T58c / does NOT redirect to admin" "$BASE/" "/admin/dashboard"

# ══════════════════════════════════════
# URL params — pre-fill (Faza 2: BEZ auto-skip)
# ══════════════════════════════════════
blue "── URL params (pre-fill, no auto-skip) ──"

# T59: Valid dates → 200 (widget with pre-filled dates, user still on StepDates)
check_http "T59 GET /?checkIn&checkOut → 200 (pre-fill)" \
  "$BASE/?checkIn=2026-07-10&checkOut=2026-07-14&guests=2" "200"

# T60: Valid dates + slug → 200 (widget with pre-filled dates + slug stored)
check_http "T60 GET /?dates+resource → 200 (pre-fill+slug)" \
  "$BASE/?checkIn=2026-07-10&checkOut=2026-07-14&resource=domek-hobbita-1" "200"

# T61: Invalid date → 200 (graceful fallback to engine entry)
check_http "T61 GET /?checkIn=invalid → 200 (fallback)" \
  "$BASE/?checkIn=not-a-date&checkOut=2026-07-14" "200"

# ══════════════════════════════════════
# Legacy /booking redirect
# ══════════════════════════════════════
blue "── Legacy /booking redirect ──"

# T62: /booking → 307 (temporary redirect to /)
check_http "T62 GET /booking → 307" "$BASE/booking" "307"

# T63: /booking with params → 307
check_http "T63 GET /booking?params → 307" \
  "$BASE/booking?checkIn=2026-07-10&checkOut=2026-07-14" "307"

# ══════════════════════════════════════
# API: by-slug endpoint
# ══════════════════════════════════════
blue "── API: by-slug endpoint ──"

# Get a valid slug from catalog
FIRST_SLUG=$(curl -s "$BASE/api/public/resources-catalog" 2>/dev/null \
  | grep -o '"slug":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -n "$FIRST_SLUG" ]; then
  check_json_field "T64 by-slug/$FIRST_SLUG → resource" \
    "$BASE/api/public/resources/by-slug/$FIRST_SLUG" "resource"

  check_json_field "T65 by-slug has images" \
    "$BASE/api/public/resources/by-slug/$FIRST_SLUG" "images"

  check_json_field "T66 by-slug has beds" \
    "$BASE/api/public/resources/by-slug/$FIRST_SLUG" "beds"

  check_json_field "T67 by-slug has amenities" \
    "$BASE/api/public/resources/by-slug/$FIRST_SLUG" "amenities"

  check_json_field "T68 by-slug has longDescription" \
    "$BASE/api/public/resources/by-slug/$FIRST_SLUG" "longDescription"
else
  TOTAL=$((TOTAL+5))
  FAIL=$((FAIL+5))
  red "  ❌ T64-T68 — brak zasobów w katalogu (slug not found)"
fi

# T69: Non-existent slug → 404
check_http "T69 by-slug/nonexistent → 404" \
  "$BASE/api/public/resources/by-slug/this-slug-does-not-exist-xyz" "404"

# ══════════════════════════════════════
# Regresja istniejących API
# ══════════════════════════════════════
blue "── Regresja: istniejące API ──"

check_json_field "T70 resources-catalog → resources" \
  "$BASE/api/public/resources-catalog" "resources"

check_json_field "T71 property-content → propertyContent" \
  "$BASE/api/public/property-content" "propertyContent"

check_json_field "T72 widget-config → success" \
  "$BASE/api/public/widget-config" "success"

# ══════════════════════════════════════
# Admin nadal działa
# ══════════════════════════════════════
blue "── Regresja: admin panel ──"

# T73: /admin → 302 redirect to login (no token) or 200 (valid token)
ADMIN_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/admin" 2>/dev/null || echo "000")
TOTAL=$((TOTAL+1))
if [ "$ADMIN_CODE" = "302" ] || [ "$ADMIN_CODE" = "307" ] || [ "$ADMIN_CODE" = "200" ]; then
  PASS=$((PASS+1))
  green "  ✅ T73 /admin accessible (HTTP $ADMIN_CODE)"
else
  FAIL=$((FAIL+1))
  red "  ❌ T73 /admin — expected 302/307/200, got $ADMIN_CODE"
fi

# ══════════════════════════════════════
# Summary
# ══════════════════════════════════════
echo ""
blue "═══════════════════════════════════════════"
if [ $FAIL -eq 0 ]; then
  green "  WYNIK: $PASS/$TOTAL PASS ✅"
else
  red "  WYNIK: $PASS/$TOTAL PASS, $FAIL FAIL ❌"
fi
blue "═══════════════════════════════════════════"
echo ""

exit $FAIL
