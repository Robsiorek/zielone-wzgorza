#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
# CRITICAL REGRESSION TESTS — Zielone Wzgórza Admin
#
# 18 testów na krytyczne ścieżki systemu.
# Odpalane po większych zmianach / przed deployem nowej warstwy.
#
# Użycie:
#   cd /var/www/admin && bash scripts/test-critical.sh
#
# Wymagania:
#   - Serwer działa (pm2 status zw-admin)
#   - Admin zalogowany (cookie w /tmp/zw-test-cookies.txt)
# ═══════════════════════════════════════════════════════════════

set -uo pipefail

BASE="http://localhost:3000"
COOKIES="/tmp/zw-test-cookies.txt"
TMPDIR="/tmp/zw-tests"
PASS=0
FAIL=0
TOTAL=0

# ── Kolory ──
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# ── Helpers ──
mkdir -p "$TMPDIR"

log_pass() {
  PASS=$((PASS + 1))
  TOTAL=$((TOTAL + 1))
  echo -e "  ${GREEN}✅ PASS${NC} — $1"
}

log_fail() {
  FAIL=$((FAIL + 1))
  TOTAL=$((TOTAL + 1))
  echo -e "  ${RED}❌ FAIL${NC} — $1"
  if [ -n "${2:-}" ]; then echo -e "         ${RED}$2${NC}"; fi
}

# Extract JSON field (simple, no jq dependency)
json_field() {
  python3 -c "import sys,json; d=json.load(sys.stdin); print($1)" 2>/dev/null
}

# ── Auth ──
echo ""
echo "═══════════════════════════════════════════════════════════"
echo " CRITICAL REGRESSION TESTS — $(date '+%Y-%m-%d %H:%M:%S')"
echo "═══════════════════════════════════════════════════════════"
echo ""

echo "Logowanie admina..."
LOGIN_RESULT=$(curl -s -X POST "$BASE/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@zielonewzgorza.eu","password":"Admin123!"}' \
  -c "$COOKIES")

LOGIN_OK=$(echo "$LOGIN_RESULT" | json_field "d.get('success', False)")
if [ "$LOGIN_OK" != "True" ]; then
  echo -e "${RED}BŁĄD: Nie udało się zalogować. Przerwanie testów.${NC}"
  echo "$LOGIN_RESULT"
  exit 1
fi
echo -e "Zalogowano jako admin.\n"

# ── Dynamiczne daty (zawsze 300+ dni w przyszłości) ──
# Generuje 3 pary dat na testy (T1, T3, T4)
D1_IN=$(date -d "+330 days" '+%Y-%m-%d')
D1_OUT=$(date -d "+332 days" '+%Y-%m-%d')
D3_IN=$(date -d "+340 days" '+%Y-%m-%d')
D3_OUT=$(date -d "+342 days" '+%Y-%m-%d')
D4_IN=$(date -d "+350 days" '+%Y-%m-%d')
D4_OUT=$(date -d "+352 days" '+%Y-%m-%d')

# ── Pre-cleanup: anuluj WSZYSTKIE stare rezerwacje testowe ──
echo "Pre-cleanup — czyszczę stare rezerwacje testowe..."
for SEARCH_TERM in "Test+Regression" "Test+A" "Test+B" "Public+Test"; do
  for RES_ID_PRE in $(curl -s "$BASE/api/reservations?search=$SEARCH_TERM&limit=50" -b "$COOKIES" 2>/dev/null | \
    python3 -c "import sys,json; [print(r['id']) for r in json.load(sys.stdin).get('data',{}).get('reservations',[]) if r.get('status') not in ('CANCELLED',)]" 2>/dev/null); do
    curl -s -X POST "$BASE/api/reservations/$RES_ID_PRE/cancel" \
      -H "Content-Type: application/json" -b "$COOKIES" \
      -d '{"cancelReason":"Test pre-cleanup"}' > /dev/null 2>&1
  done
done
echo "Pre-cleanup done."
echo ""

# Znajdź dostępny zasób i wariant
echo "Szukam dostępnego zasobu..."
AVAIL=$(curl -s "$BASE/api/public/availability?checkIn=$D1_IN&checkOut=$D1_OUT")
RESOURCE_ID=$(echo "$AVAIL" | json_field "d['data']['available'][0]['resourceId']")
VARIANT_ID=$(echo "$AVAIL" | json_field "d['data']['available'][0]['variants'][0]['variantId']")

if [ -z "$RESOURCE_ID" ] || [ "$RESOURCE_ID" = "None" ]; then
  echo -e "${RED}BŁĄD: Brak dostępnych zasobów na $D1_IN..$D1_OUT. Sprawdź sezony/ceny.${NC}"
  exit 1
fi
echo -e "Zasób: $RESOURCE_ID, Wariant: $VARIANT_ID"
echo -e "Daty testowe: T1=$D1_IN..$D1_OUT  T3=$D3_IN..$D3_OUT  T4=$D4_IN..$D4_OUT\n"

# Znajdź klienta do testów admin
CLIENT_ID=$(curl -s "$BASE/api/clients?limit=1" -b "$COOKIES" | json_field "d['data']['clients'][0]['id']")

# ═══════════════════════════════════════════════
# GRUPA 1: BOOKING CORE
# ═══════════════════════════════════════════════
echo -e "${YELLOW}── GRUPA 1: Booking core ──${NC}"

# T1: Quote → Book (happy path)
echo "T1: Quote → Book (happy path)"
QUOTE=$(curl -s -X POST "$BASE/api/public/quote" \
  -H "Content-Type: application/json" \
  -d "{\"checkIn\":\"$D1_IN\",\"checkOut\":\"$D1_OUT\",\"items\":[{\"variantId\":\"$VARIANT_ID\",\"adults\":2,\"children\":0}]}")
Q_ID=$(echo "$QUOTE" | json_field "d['data']['quoteId']")
Q_SEC=$(echo "$QUOTE" | json_field "d['data']['quoteSecret']")

if [ -z "$Q_ID" ] || [ "$Q_ID" = "None" ]; then
  log_fail "T1" "Quote nie utworzony"
else
  BOOK=$(curl -s -X POST "$BASE/api/public/book" \
    -H "Content-Type: application/json" \
    -d "{\"quoteId\":\"$Q_ID\",\"quoteSecret\":\"$Q_SEC\",\"client\":{\"firstName\":\"Test\",\"lastName\":\"Regression\",\"email\":\"test-reg@test.pl\",\"phone\":\"+48111000001\"},\"consentAccepted\":true}")
  BOOK_OK=$(echo "$BOOK" | json_field "d.get('success', False)")
  BOOK_NUM=$(echo "$BOOK" | json_field "d['data']['reservationNumber']")
  if [ "$BOOK_OK" = "True" ] && [ -n "$BOOK_NUM" ] && [ "$BOOK_NUM" != "None" ]; then
    log_pass "T1 — rezerwacja $BOOK_NUM utworzona"
    T1_NUM="$BOOK_NUM"
  else
    log_fail "T1" "$(echo "$BOOK" | json_field "d.get('error','')")"
    T1_NUM=""
  fi
fi

# T2: Ten sam quote 2x → idempotent
echo "T2: Ten sam quote 2x → idempotent"
if [ -n "${Q_ID:-}" ] && [ "$Q_ID" != "None" ]; then
  BOOK2=$(curl -s -X POST "$BASE/api/public/book" \
    -H "Content-Type: application/json" \
    -d "{\"quoteId\":\"$Q_ID\",\"quoteSecret\":\"$Q_SEC\",\"client\":{\"firstName\":\"Test\",\"lastName\":\"Regression\",\"email\":\"test-reg@test.pl\",\"phone\":\"+48111000001\"},\"consentAccepted\":true}")
  BOOK2_NUM=$(echo "$BOOK2" | json_field "d['data']['reservationNumber']" 2>/dev/null || echo "")
  BOOK2_IDEMP=$(echo "$BOOK2" | json_field "d['data'].get('idempotent', False)" 2>/dev/null || echo "")
  if [ "$BOOK2_NUM" = "$T1_NUM" ]; then
    log_pass "T2 — idempotent, ten sam numer $BOOK2_NUM"
  else
    log_fail "T2" "Oczekiwano $T1_NUM, dostano $BOOK2_NUM"
  fi
else
  log_fail "T2" "Brak quote z T1"
fi

# T3: Dwa quote na ten sam slot → conflict
echo "T3: Dwa quote na ten sam slot → conflict"
QA=$(curl -s -X POST "$BASE/api/public/quote" \
  -H "Content-Type: application/json" \
  -d "{\"checkIn\":\"$D3_IN\",\"checkOut\":\"$D3_OUT\",\"items\":[{\"variantId\":\"$VARIANT_ID\",\"adults\":2,\"children\":0}]}")
QA_ID=$(echo "$QA" | json_field "d['data']['quoteId']")
QA_SEC=$(echo "$QA" | json_field "d['data']['quoteSecret']")

QB=$(curl -s -X POST "$BASE/api/public/quote" \
  -H "Content-Type: application/json" \
  -d "{\"checkIn\":\"$D3_IN\",\"checkOut\":\"$D3_OUT\",\"items\":[{\"variantId\":\"$VARIANT_ID\",\"adults\":2,\"children\":0}]}")
QB_ID=$(echo "$QB" | json_field "d['data']['quoteId']")
QB_SEC=$(echo "$QB" | json_field "d['data']['quoteSecret']")

BOOKA=$(curl -s -X POST "$BASE/api/public/book" \
  -H "Content-Type: application/json" \
  -d "{\"quoteId\":\"$QA_ID\",\"quoteSecret\":\"$QA_SEC\",\"client\":{\"firstName\":\"Test\",\"lastName\":\"A\",\"email\":\"testa@test.pl\",\"phone\":\"+48111000002\"},\"consentAccepted\":true}")
BOOKB=$(curl -s -X POST "$BASE/api/public/book" \
  -H "Content-Type: application/json" \
  -d "{\"quoteId\":\"$QB_ID\",\"quoteSecret\":\"$QB_SEC\",\"client\":{\"firstName\":\"Test\",\"lastName\":\"B\",\"email\":\"testb@test.pl\",\"phone\":\"+48111000003\"},\"consentAccepted\":true}")

A_OK=$(echo "$BOOKA" | json_field "d.get('success', False)")
B_OK=$(echo "$BOOKB" | json_field "d.get('success', False)")

if { [ "$A_OK" = "True" ] && [ "$B_OK" = "False" ]; } || { [ "$A_OK" = "False" ] && [ "$B_OK" = "True" ]; }; then
  log_pass "T3 — jeden sukces, jeden conflict"
elif [ "$A_OK" = "True" ] && [ "$B_OK" = "True" ]; then
  log_fail "T3" "DOUBLE BOOKING!"
else
  log_fail "T3" "Oba failed: A=$A_OK B=$B_OK"
fi

# T4: Admin vs public → conflict
echo "T4: Admin vs public na ten sam slot → conflict"
QP=$(curl -s -X POST "$BASE/api/public/quote" \
  -H "Content-Type: application/json" \
  -d "{\"checkIn\":\"$D4_IN\",\"checkOut\":\"$D4_OUT\",\"items\":[{\"variantId\":\"$VARIANT_ID\",\"adults\":2,\"children\":0}]}")
QP_ID=$(echo "$QP" | json_field "d['data']['quoteId']")
QP_SEC=$(echo "$QP" | json_field "d['data']['quoteSecret']")

# Book public first
BOOK_PUB=$(curl -s -X POST "$BASE/api/public/book" \
  -H "Content-Type: application/json" \
  -d "{\"quoteId\":\"$QP_ID\",\"quoteSecret\":\"$QP_SEC\",\"client\":{\"firstName\":\"Public\",\"lastName\":\"Test\",\"email\":\"pub@test.pl\",\"phone\":\"+48111000004\"},\"consentAccepted\":true}")
PUB_OK=$(echo "$BOOK_PUB" | json_field "d.get('success', False)")

# Admin on same dates/resource
ADMIN_BODY="{\"type\":\"BOOKING\",\"status\":\"CONFIRMED\",\"checkIn\":\"$D4_IN\",\"checkOut\":\"$D4_OUT\",\"source\":\"PHONE\",\"clientId\":\"$CLIENT_ID\",\"adults\":2,\"children\":0,\"items\":[{\"resourceId\":\"$RESOURCE_ID\"}]}"
BOOK_ADM=$(curl -s -X POST "$BASE/api/reservations" \
  -H "Content-Type: application/json" -b "$COOKIES" \
  -d "$ADMIN_BODY")
ADM_OK=$(echo "$BOOK_ADM" | json_field "d.get('success', False)")

if { [ "$PUB_OK" = "True" ] && [ "$ADM_OK" = "False" ]; } || { [ "$PUB_OK" = "False" ] && [ "$ADM_OK" = "True" ]; }; then
  log_pass "T4 — jeden sukces, jeden conflict"
elif [ "$PUB_OK" = "True" ] && [ "$ADM_OK" = "True" ]; then
  log_fail "T4" "DOUBLE BOOKING!"
else
  log_fail "T4" "Nieoczekiwany wynik: PUB=$PUB_OK ADM=$ADM_OK"
fi

# ═══════════════════════════════════════════════
# GRUPA 2: RESERVATION LIFECYCLE
# ═══════════════════════════════════════════════
echo ""
echo -e "${YELLOW}── GRUPA 2: Reservation lifecycle ──${NC}"

# Znajdź ID rezerwacji z T1
if [ -n "${T1_NUM:-}" ] && [ "$T1_NUM" != "None" ]; then
  T1_ID=$(curl -s "$BASE/api/reservations?search=$T1_NUM" -b "$COOKIES" | json_field "d['data']['reservations'][0]['id']")
else
  T1_ID=""
fi

# T5: Confirm (PENDING → CONFIRMED)
echo "T5: Confirm (PENDING → CONFIRMED)"
if [ -n "$T1_ID" ] && [ "$T1_ID" != "None" ]; then
  CONF=$(curl -s -X POST "$BASE/api/reservations/$T1_ID/confirm" \
    -H "Content-Type: application/json" -b "$COOKIES" -d '{}')
  CONF_OK=$(echo "$CONF" | json_field "d.get('success', False)")
  if [ "$CONF_OK" = "True" ]; then
    log_pass "T5 — $T1_NUM confirmed"
  else
    log_fail "T5" "$(echo "$CONF" | json_field "d.get('error','')")"
  fi
else
  log_fail "T5" "Brak rezerwacji z T1"
fi

# T6: Confirm na CONFIRMED → idempotent
echo "T6: Confirm na CONFIRMED → idempotent"
if [ -n "$T1_ID" ] && [ "$T1_ID" != "None" ]; then
  CONF2=$(curl -s -X POST "$BASE/api/reservations/$T1_ID/confirm" \
    -H "Content-Type: application/json" -b "$COOKIES" -d '{}')
  CONF2_OK=$(echo "$CONF2" | json_field "d.get('success', False)")
  CONF2_IDEMP=$(echo "$CONF2" | json_field "d['data'].get('idempotent', False)")
  if [ "$CONF2_OK" = "True" ] && [ "$CONF2_IDEMP" = "True" ]; then
    log_pass "T6 — idempotent confirm"
  else
    log_fail "T6" "success=$CONF2_OK idempotent=$CONF2_IDEMP"
  fi
else
  log_fail "T6" "Brak rezerwacji"
fi

# T7: Cancel (CONFIRMED → CANCELLED)
echo "T7: Cancel (CONFIRMED → CANCELLED)"
if [ -n "$T1_ID" ] && [ "$T1_ID" != "None" ]; then
  CANC=$(curl -s -X POST "$BASE/api/reservations/$T1_ID/cancel" \
    -H "Content-Type: application/json" -b "$COOKIES" \
    -d '{"cancelReason":"Test regression"}')
  CANC_OK=$(echo "$CANC" | json_field "d.get('success', False)")
  if [ "$CANC_OK" = "True" ]; then
    log_pass "T7 — cancelled"
  else
    log_fail "T7" "$(echo "$CANC" | json_field "d.get('error','')")"
  fi
else
  log_fail "T7" "Brak rezerwacji"
fi

# T8: Cancel na CANCELLED → idempotent
echo "T8: Cancel na CANCELLED → idempotent"
if [ -n "$T1_ID" ] && [ "$T1_ID" != "None" ]; then
  CANC2=$(curl -s -X POST "$BASE/api/reservations/$T1_ID/cancel" \
    -H "Content-Type: application/json" -b "$COOKIES" \
    -d '{"cancelReason":"Test regression 2"}')
  CANC2_OK=$(echo "$CANC2" | json_field "d.get('success', False)")
  CANC2_IDEMP=$(echo "$CANC2" | json_field "d['data'].get('idempotent', False)")
  if [ "$CANC2_OK" = "True" ] && [ "$CANC2_IDEMP" = "True" ]; then
    log_pass "T8 — idempotent cancel"
  else
    log_fail "T8" "success=$CANC2_OK idempotent=$CANC2_IDEMP"
  fi
else
  log_fail "T8" "Brak rezerwacji"
fi

# T9: Restore (CANCELLED → PENDING)
echo "T9: Restore (CANCELLED → PENDING)"
if [ -n "$T1_ID" ] && [ "$T1_ID" != "None" ]; then
  REST=$(curl -s -X POST "$BASE/api/reservations/$T1_ID/restore" \
    -H "Content-Type: application/json" -b "$COOKIES" -d '{}')
  REST_OK=$(echo "$REST" | json_field "d.get('success', False)")
  if [ "$REST_OK" = "True" ]; then
    # Verify it's PENDING not CONFIRMED
    REST_STATUS=$(curl -s "$BASE/api/reservations?search=$T1_NUM" -b "$COOKIES" | json_field "d['data']['reservations'][0]['status']")
    if [ "$REST_STATUS" = "PENDING" ]; then
      log_pass "T9 — restored to PENDING"
    else
      log_fail "T9" "Oczekiwano PENDING, dostano $REST_STATUS"
    fi
  else
    log_fail "T9" "$(echo "$REST" | json_field "d.get('error','')")"
  fi
else
  log_fail "T9" "Brak rezerwacji"
fi

# T10: Niedozwolone przejście (PENDING → FINISHED) → 409
echo "T10: Niedozwolone przejście → 409"
if [ -n "$T1_ID" ] && [ "$T1_ID" != "None" ]; then
  # No-show wymaga CONFIRMED + date check, więc na PENDING powinno dać błąd
  NOSHOW=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/reservations/$T1_ID/no-show" \
    -H "Content-Type: application/json" -b "$COOKIES" -d '{}')
  if [ "$NOSHOW" = "409" ] || [ "$NOSHOW" = "400" ]; then
    log_pass "T10 — niedozwolone przejście zablokowane (HTTP $NOSHOW)"
  else
    log_fail "T10" "Oczekiwano 400/409, dostano HTTP $NOSHOW"
  fi
else
  log_fail "T10" "Brak rezerwacji"
fi

# ═══════════════════════════════════════════════
# GRUPA 3: PAYMENTS / LEDGER
# ═══════════════════════════════════════════════
echo ""
echo -e "${YELLOW}── GRUPA 3: Payments / ledger ──${NC}"

# Potwierdź rezerwację z T9 (PENDING → CONFIRMED) żeby móc testować płatności
if [ -n "$T1_ID" ] && [ "$T1_ID" != "None" ]; then
  curl -s -X POST "$BASE/api/reservations/$T1_ID/confirm" \
    -H "Content-Type: application/json" -b "$COOKIES" -d '{}' > /dev/null
fi

# T11: Utwórz płatność
echo "T11: Utwórz płatność"
if [ -n "$T1_ID" ] && [ "$T1_ID" != "None" ]; then
  PAY=$(curl -s -X POST "$BASE/api/reservations/$T1_ID/payments" \
    -H "Content-Type: application/json" -b "$COOKIES" \
    -d '{"amountMinor":10000,"method":"BANK_TRANSFER","kind":"CHARGE","direction":"IN","description":"Test regression"}')
  PAY_OK=$(echo "$PAY" | json_field "d.get('success', False)")
  PAY_ID=$(echo "$PAY" | json_field "d['data']['payment']['id']" 2>/dev/null || echo "")
  if [ "$PAY_OK" = "True" ] && [ -n "$PAY_ID" ] && [ "$PAY_ID" != "None" ]; then
    log_pass "T11 — płatność $PAY_ID utworzona"
  else
    log_fail "T11" "$(echo "$PAY" | json_field "d.get('error','')")"
    PAY_ID=""
  fi
else
  log_fail "T11" "Brak rezerwacji"
  PAY_ID=""
fi

# T12: Potwierdź płatność
echo "T12: Potwierdź płatność"
if [ -n "$PAY_ID" ] && [ "$PAY_ID" != "None" ]; then
  PAYCONF=$(curl -s -X POST "$BASE/api/payments/$PAY_ID/confirm" \
    -H "Content-Type: application/json" -b "$COOKIES" -d '{}')
  PAYCONF_OK=$(echo "$PAYCONF" | json_field "d.get('success', False)")
  if [ "$PAYCONF_OK" = "True" ]; then
    log_pass "T12 — płatność potwierdzona"
  else
    log_fail "T12" "$(echo "$PAYCONF" | json_field "d.get('error','')")"
  fi
else
  log_fail "T12" "Brak płatności z T11"
fi

# T13: Potwierdź ponownie → idempotent
echo "T13: Potwierdź ponownie → idempotent"
if [ -n "$PAY_ID" ] && [ "$PAY_ID" != "None" ]; then
  PAYCONF2=$(curl -s -X POST "$BASE/api/payments/$PAY_ID/confirm" \
    -H "Content-Type: application/json" -b "$COOKIES" -d '{}')
  PAYCONF2_OK=$(echo "$PAYCONF2" | json_field "d.get('success', False)")
  PAYCONF2_IDEMP=$(echo "$PAYCONF2" | json_field "d['data'].get('idempotent', False)")
  if [ "$PAYCONF2_OK" = "True" ] && [ "$PAYCONF2_IDEMP" = "True" ]; then
    log_pass "T13 — idempotent payment confirm"
  else
    log_fail "T13" "success=$PAYCONF2_OK idempotent=$PAYCONF2_IDEMP"
  fi
else
  log_fail "T13" "Brak płatności"
fi

# T14: Reject na CONFIRMED → 409 (terminal state)
echo "T14: Reject na CONFIRMED payment → błąd"
if [ -n "$PAY_ID" ] && [ "$PAY_ID" != "None" ]; then
  PAYREJ=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/payments/$PAY_ID/reject" \
    -H "Content-Type: application/json" -b "$COOKIES" -d '{"reason":"test"}')
  if [ "$PAYREJ" = "409" ] || [ "$PAYREJ" = "400" ]; then
    log_pass "T14 — reject na CONFIRMED zablokowany (HTTP $PAYREJ)"
  else
    log_fail "T14" "Oczekiwano 400/409, dostano HTTP $PAYREJ"
  fi
else
  log_fail "T14" "Brak płatności"
fi

# ═══════════════════════════════════════════════
# GRUPA 4: HEALTH + INTEGRITY
# ═══════════════════════════════════════════════
echo ""
echo -e "${YELLOW}── GRUPA 4: Health + integrity ──${NC}"

# T15: Health endpoint działa
echo "T15: Health endpoint"
HEALTH=$(curl -s "$BASE/api/health")
HEALTH_STATUS=$(echo "$HEALTH" | json_field "d.get('status', '')")
if [ "$HEALTH_STATUS" = "healthy" ] || [ "$HEALTH_STATUS" = "degraded" ]; then
  log_pass "T15 — health: $HEALTH_STATUS"
else
  log_fail "T15" "health status: $HEALTH_STATUS"
fi

# T16: RequestId w response header
echo "T16: RequestId w response"
RID=$(curl -sI "$BASE/api/health" | grep -i "x-request-id" | head -1)
if echo "$RID" | grep -qi "x-request-id:"; then
  log_pass "T16 — X-Request-Id present"
else
  log_fail "T16" "Brak X-Request-Id w response"
fi

# T17: Brak orphan timeline entries
echo "T17: Brak orphan timeline entries"
ORPHANS=$(curl -s "$BASE/api/health?detail=true" -b "$COOKIES" > /dev/null && \
  psql -U zwadmin -h localhost -d zielone_wzgorza_admin -t -c \
  "SELECT count(*) FROM timeline_entries te WHERE te.\"reservationId\" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM reservations r WHERE r.id = te.\"reservationId\");" 2>/dev/null || echo "ERROR")
ORPHANS=$(echo "$ORPHANS" | tr -d ' ')
if [ "$ORPHANS" = "0" ]; then
  log_pass "T17 — 0 orphanów"
elif [ "$ORPHANS" = "ERROR" ]; then
  log_fail "T17" "Nie udało się sprawdzić (psql niedostępny)"
else
  log_fail "T17" "$ORPHANS orphan timeline entries!"
fi

# T18: Brak overlapping ACTIVE entries
echo "T18: Brak overlapping ACTIVE entries"
OVERLAPS=$(psql -U zwadmin -h localhost -d zielone_wzgorza_admin -t -c \
  "SELECT count(*) FROM timeline_entries a JOIN timeline_entries b ON a.\"resourceId\" = b.\"resourceId\" AND a.id < b.id AND a.status = 'ACTIVE' AND b.status = 'ACTIVE' AND a.\"startAt\" < b.\"endAt\" AND a.\"endAt\" > b.\"startAt\";" 2>/dev/null || echo "ERROR")
OVERLAPS=$(echo "$OVERLAPS" | tr -d ' ')
if [ "$OVERLAPS" = "0" ]; then
  log_pass "T18 — 0 overlapów"
elif [ "$OVERLAPS" = "ERROR" ]; then
  log_fail "T18" "Nie udało się sprawdzić (psql niedostępny)"
else
  log_fail "T18" "$OVERLAPS overlapping ACTIVE entries!"
fi

# ═══════════════════════════════════════════════
# CLEANUP — anuluj rezerwacje testowe
# ═══════════════════════════════════════════════
echo ""
echo "Cleanup — anuluję rezerwacje testowe..."
for SEARCH_TERM in "Test+Regression" "Test+A" "Test+B" "Public+Test"; do
  for RES_ID_CLEAN in $(curl -s "$BASE/api/reservations?search=$SEARCH_TERM&limit=50" -b "$COOKIES" 2>/dev/null | \
    python3 -c "import sys,json; [print(r['id']) for r in json.load(sys.stdin).get('data',{}).get('reservations',[]) if r.get('status') not in ('CANCELLED',)]" 2>/dev/null); do
    curl -s -X POST "$BASE/api/reservations/$RES_ID_CLEAN/cancel" \
      -H "Content-Type: application/json" -b "$COOKIES" \
      -d '{"cancelReason":"Test cleanup"}' > /dev/null 2>&1
  done
done
echo "Cleanup done."

# ═══════════════════════════════════════════════
# PODSUMOWANIE
# ═══════════════════════════════════════════════
echo ""
echo "═══════════════════════════════════════════════════════════"
if [ "$FAIL" -eq 0 ]; then
  echo -e " ${GREEN}WYNIK: $PASS/$TOTAL PASS — WSZYSTKIE TESTY PRZESZŁY${NC}"
else
  echo -e " ${RED}WYNIK: $PASS/$TOTAL PASS, $FAIL FAIL${NC}"
fi
echo " $(date '+%Y-%m-%d %H:%M:%S')"
echo "═══════════════════════════════════════════════════════════"
echo ""

exit $FAIL
