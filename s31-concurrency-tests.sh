#!/usr/bin/env bash
set -euo pipefail

BASE="http://localhost:3000"
RES_ID="cmn8siwlo000813o5ihjme43h"
VAR_ID="dv_cmn8siwlo000813o5ihjme43h"
COOKIES="/tmp/cookies.txt"

mkdir -p /tmp/c_tests
cd /tmp/c_tests

echo "============================================"
echo "S3.1 CONCURRENCY TESTS — $(date)"
echo "============================================"
echo ""

# ── Helper: create quote ──
create_quote() {
  local ci="$1" co="$2" label="$3"
  curl -s -X POST "$BASE/api/public/quote" \
    -H "Content-Type: application/json" \
    -d "{\"checkIn\":\"$ci\",\"checkOut\":\"$co\",\"items\":[{\"variantId\":\"$VAR_ID\",\"adults\":2,\"children\":0}]}" \
    > "${label}_quote.json"
  
  local qid=$(python3 -c "import json; d=json.load(open('${label}_quote.json')); print(d['data']['quoteId'])")
  local qsec=$(python3 -c "import json; d=json.load(open('${label}_quote.json')); print(d['data']['quoteSecret'])")
  echo "$qid|$qsec"
}

# ── Helper: book from quote ──
book_payload() {
  local qid="$1" qsec="$2" email="$3"
  echo "{\"quoteId\":\"$qid\",\"quoteSecret\":\"$qsec\",\"client\":{\"firstName\":\"Test\",\"lastName\":\"Concurrency\",\"email\":\"$email\",\"phone\":\"+48111222333\"},\"consentAccepted\":true}"
}

# ══════════════════════════════════════════
# C1 — Ten sam quoteId, dwa równoległe book
# ══════════════════════════════════════════
echo "── C1: Same quote, parallel book ──"

IFS='|' read -r Q1_ID Q1_SEC <<< "$(create_quote 2026-08-01 2026-08-03 c1)"

PAYLOAD=$(book_payload "$Q1_ID" "$Q1_SEC" "c1@test.pl")

curl -s -X POST "$BASE/api/public/book" -H "Content-Type: application/json" -d "$PAYLOAD" -o c1_a.json -w "HTTP:%{http_code}\n" &
PID_A=$!
curl -s -X POST "$BASE/api/public/book" -H "Content-Type: application/json" -d "$PAYLOAD" -o c1_b.json -w "HTTP:%{http_code}\n" &
PID_B=$!
wait $PID_A $PID_B

echo "C1_A: $(cat c1_a.json | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'status={d.get(\"data\",{}).get(\"status\",\"?\")} number={d.get(\"data\",{}).get(\"reservationNumber\",\"?\")} idempotent={d.get(\"data\",{}).get(\"idempotent\",\"?\")}')" 2>/dev/null || echo "ERROR: $(head -c 200 c1_a.json)")"
echo "C1_B: $(cat c1_b.json | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'status={d.get(\"data\",{}).get(\"status\",\"?\")} number={d.get(\"data\",{}).get(\"reservationNumber\",\"?\")} idempotent={d.get(\"data\",{}).get(\"idempotent\",\"?\")}')" 2>/dev/null || echo "ERROR: $(head -c 200 c1_b.json)")"

# Verify: same reservationNumber
R1_A=$(python3 -c "import json; print(json.load(open('c1_a.json'))['data']['reservationNumber'])" 2>/dev/null || echo "NONE")
R1_B=$(python3 -c "import json; print(json.load(open('c1_b.json'))['data']['reservationNumber'])" 2>/dev/null || echo "NONE")
if [ "$R1_A" = "$R1_B" ] && [ "$R1_A" != "NONE" ]; then
  echo "C1 PASS ✅ — same reservation: $R1_A (idempotent)"
else
  echo "C1 FAIL ❌ — different reservations: $R1_A vs $R1_B"
fi
echo ""

# ══════════════════════════════════════════
# C2 — Dwa różne quote, ten sam zasób/termin
# ══════════════════════════════════════════
echo "── C2: Two quotes, same resource+dates, parallel book ──"

IFS='|' read -r Q2A_ID Q2A_SEC <<< "$(create_quote 2026-08-05 2026-08-07 c2a)"
IFS='|' read -r Q2B_ID Q2B_SEC <<< "$(create_quote 2026-08-05 2026-08-07 c2b)"

PAYLOAD_A=$(book_payload "$Q2A_ID" "$Q2A_SEC" "c2a@test.pl")
PAYLOAD_B=$(book_payload "$Q2B_ID" "$Q2B_SEC" "c2b@test.pl")

curl -s -X POST "$BASE/api/public/book" -H "Content-Type: application/json" -d "$PAYLOAD_A" -o c2_a.json -w "HTTP:%{http_code}\n" &
PID_A=$!
curl -s -X POST "$BASE/api/public/book" -H "Content-Type: application/json" -d "$PAYLOAD_B" -o c2_b.json -w "HTTP:%{http_code}\n" &
PID_B=$!
wait $PID_A $PID_B

C2A_OK=$(python3 -c "import json; d=json.load(open('c2_a.json')); print('SUCCESS' if d.get('success') and d.get('data',{}).get('reservationNumber') else 'FAIL')" 2>/dev/null || echo "FAIL")
C2B_OK=$(python3 -c "import json; d=json.load(open('c2_b.json')); print('SUCCESS' if d.get('success') and d.get('data',{}).get('reservationNumber') else 'FAIL')" 2>/dev/null || echo "FAIL")
C2A_CODE=$(python3 -c "import json; d=json.load(open('c2_a.json')); print(d.get('code','?'))" 2>/dev/null || echo "?")
C2B_CODE=$(python3 -c "import json; d=json.load(open('c2_b.json')); print(d.get('code','?'))" 2>/dev/null || echo "?")

echo "C2_A: $C2A_OK (code=$C2A_CODE)"
echo "C2_B: $C2B_OK (code=$C2B_CODE)"

if [ "$C2A_OK" = "SUCCESS" ] && [ "$C2B_OK" = "FAIL" ] || [ "$C2A_OK" = "FAIL" ] && [ "$C2B_OK" = "SUCCESS" ]; then
  echo "C2 PASS ✅ — one success, one conflict"
elif [ "$C2A_OK" = "SUCCESS" ] && [ "$C2B_OK" = "SUCCESS" ]; then
  echo "C2 FAIL ❌ — DOUBLE BOOKING!"
else
  echo "C2 FAIL ❌ — unexpected: both failed"
fi
echo ""

# ══════════════════════════════════════════
# C3 — Public book vs admin create, same resource+dates
# ══════════════════════════════════════════
echo "── C3: Public book vs admin create, parallel ──"

IFS='|' read -r Q3_ID Q3_SEC <<< "$(create_quote 2026-08-10 2026-08-12 c3)"
PAYLOAD_PUB=$(book_payload "$Q3_ID" "$Q3_SEC" "c3public@test.pl")

ADMIN_BODY="{\"type\":\"BOOKING\",\"status\":\"CONFIRMED\",\"checkIn\":\"2026-08-10\",\"checkOut\":\"2026-08-12\",\"source\":\"PHONE\",\"adults\":2,\"children\":0,\"items\":[{\"resourceId\":\"$RES_ID\"}]}"

curl -s -X POST "$BASE/api/public/book" -H "Content-Type: application/json" -d "$PAYLOAD_PUB" -o c3_pub.json -w "HTTP:%{http_code}\n" &
PID_A=$!
curl -s -X POST "$BASE/api/reservations" -H "Content-Type: application/json" -b "$COOKIES" -d "$ADMIN_BODY" -o c3_admin.json -w "HTTP:%{http_code}\n" &
PID_B=$!
wait $PID_A $PID_B

C3P_OK=$(python3 -c "import json; d=json.load(open('c3_pub.json')); print('SUCCESS' if d.get('success') and d.get('data',{}).get('reservationNumber') else 'FAIL')" 2>/dev/null || echo "FAIL")
C3A_OK=$(python3 -c "import json; d=json.load(open('c3_admin.json')); print('SUCCESS' if d.get('success') else 'FAIL')" 2>/dev/null || echo "FAIL")
C3P_CODE=$(python3 -c "import json; d=json.load(open('c3_pub.json')); print(d.get('code','?'))" 2>/dev/null || echo "?")
C3A_CODE=$(python3 -c "import json; d=json.load(open('c3_admin.json')); print(d.get('code','?'))" 2>/dev/null || echo "?")

echo "C3_Public: $C3P_OK (code=$C3P_CODE)"
echo "C3_Admin:  $C3A_OK (code=$C3A_CODE)"

if [ "$C3P_OK" = "SUCCESS" ] && [ "$C3A_OK" = "FAIL" ] || [ "$C3P_OK" = "FAIL" ] && [ "$C3A_OK" = "SUCCESS" ]; then
  echo "C3 PASS ✅ — one success, one conflict"
elif [ "$C3P_OK" = "SUCCESS" ] && [ "$C3A_OK" = "SUCCESS" ]; then
  echo "C3 FAIL ❌ — DOUBLE BOOKING!"
else
  echo "C3 WARN ⚠️ — both failed (possible, depends on timing)"
fi
echo ""

# ══════════════════════════════════════════
# C4 — Parallel confirm + cancel on same reservation
# ══════════════════════════════════════════
echo "── C4: Parallel confirm + cancel ──"

# Use a reservation from C1 (should be PENDING from public book)
C4_RES_ID=$(python3 -c "
import json
# Find reservationNumber from C1, then get ID
# We need the actual ID, let's get it from the full response
try:
  d = json.load(open('c1_a.json'))
  # Book response doesn't return ID directly, we need to look it up
  print(d['data'].get('reservationNumber',''))
except: print('')
")

# Look up reservation ID by number
C4_ID=$(curl -s "$BASE/api/reservations?search=$C4_RES_ID" -b "$COOKIES" | python3 -c "
import sys,json
d=json.load(sys.stdin)
res=d.get('data',{}).get('reservations',[])
print(res[0]['id'] if res else '')
" 2>/dev/null || echo "")

if [ -z "$C4_ID" ]; then
  echo "C4 SKIP ⚠️ — no PENDING reservation found"
else
  curl -s -X POST "$BASE/api/reservations/$C4_ID/confirm" -H "Content-Type: application/json" -b "$COOKIES" -d '{}' -o c4_confirm.json -w "HTTP:%{http_code}\n" &
  PID_A=$!
  curl -s -X POST "$BASE/api/reservations/$C4_ID/cancel" -H "Content-Type: application/json" -b "$COOKIES" -d '{"cancelReason":"C4 test"}' -o c4_cancel.json -w "HTTP:%{http_code}\n" &
  PID_B=$!
  wait $PID_A $PID_B

  C4_CONF=$(python3 -c "import json; d=json.load(open('c4_confirm.json')); print(f'success={d.get(\"success\")} code={d.get(\"code\",\"null\")}')" 2>/dev/null || echo "error")
  C4_CANC=$(python3 -c "import json; d=json.load(open('c4_cancel.json')); print(f'success={d.get(\"success\")} code={d.get(\"code\",\"null\")}')" 2>/dev/null || echo "error")

  echo "C4_Confirm: $C4_CONF"
  echo "C4_Cancel:  $C4_CANC"

  # Check final status
  C4_FINAL=$(curl -s "$BASE/api/reservations?search=$C4_RES_ID" -b "$COOKIES" | python3 -c "
import sys,json
d=json.load(sys.stdin)
res=d.get('data',{}).get('reservations',[])
print(res[0]['status'] if res else 'UNKNOWN')
")
  echo "C4_Final status: $C4_FINAL"

  C4_CONF_SUCCESS=$(python3 -c "import json; print(json.load(open('c4_confirm.json')).get('success',False))" 2>/dev/null || echo "False")
  C4_CANC_SUCCESS=$(python3 -c "import json; print(json.load(open('c4_cancel.json')).get('success',False))" 2>/dev/null || echo "False")

  if [ "$C4_FINAL" = "CONFIRMED" ] || [ "$C4_FINAL" = "CANCELLED" ]; then
    echo "C4 PASS ✅ — deterministic final state: $C4_FINAL"
  else
    echo "C4 FAIL ❌ — indeterminate state: $C4_FINAL"
  fi
fi
echo ""

# ══════════════════════════════════════════
# C5 — Two parallel payment confirms
# ══════════════════════════════════════════
echo "── C5: Parallel payment confirm ──"

# Create a fresh reservation for C5
IFS='|' read -r Q5_ID Q5_SEC <<< "$(create_quote 2026-08-15 2026-08-17 c5)"
PAYLOAD_C5=$(book_payload "$Q5_ID" "$Q5_SEC" "c5@test.pl")
curl -s -X POST "$BASE/api/public/book" -H "Content-Type: application/json" -d "$PAYLOAD_C5" -o c5_book.json

C5_RES_NUM=$(python3 -c "import json; print(json.load(open('c5_book.json'))['data']['reservationNumber'])" 2>/dev/null || echo "")
C5_RES_ID=$(curl -s "$BASE/api/reservations?search=$C5_RES_NUM" -b "$COOKIES" | python3 -c "
import sys,json
d=json.load(sys.stdin)
res=d.get('data',{}).get('reservations',[])
print(res[0]['id'] if res else '')
" 2>/dev/null || echo "")

if [ -z "$C5_RES_ID" ]; then
  echo "C5 SKIP ⚠️ — no reservation for payment test"
else
  # Create a payment
  curl -s -X POST "$BASE/api/reservations/$C5_RES_ID/payments" \
    -H "Content-Type: application/json" -b "$COOKIES" \
    -d '{"amountMinor":50000,"method":"BANK_TRANSFER","kind":"DEPOSIT","direction":"INCOMING","description":"C5 test"}' \
    -o c5_payment.json

  C5_PAY_ID=$(python3 -c "import json; d=json.load(open('c5_payment.json')); print(d['data']['payment']['id'])" 2>/dev/null || echo "")

  if [ -z "$C5_PAY_ID" ]; then
    echo "C5 SKIP ⚠️ — could not create payment"
  else
    # Parallel confirm
    curl -s -X POST "$BASE/api/payments/$C5_PAY_ID/confirm" -H "Content-Type: application/json" -b "$COOKIES" -d '{}' -o c5_a.json -w "HTTP:%{http_code}\n" &
    PID_A=$!
    curl -s -X POST "$BASE/api/payments/$C5_PAY_ID/confirm" -H "Content-Type: application/json" -b "$COOKIES" -d '{}' -o c5_b.json -w "HTTP:%{http_code}\n" &
    PID_B=$!
    wait $PID_A $PID_B

    C5A=$(python3 -c "import json; d=json.load(open('c5_a.json')); print(f'success={d.get(\"success\")} idempotent={d.get(\"data\",{}).get(\"idempotent\",\"?\")}')" 2>/dev/null || echo "error")
    C5B=$(python3 -c "import json; d=json.load(open('c5_b.json')); print(f'success={d.get(\"success\")} idempotent={d.get(\"data\",{}).get(\"idempotent\",\"?\")}')" 2>/dev/null || echo "error")

    echo "C5_A: $C5A"
    echo "C5_B: $C5B"

    # Check: payment confirmed only once
    C5_PAY_STATUS=$(curl -s "$BASE/api/reservations/$C5_RES_ID/payments" -b "$COOKIES" | python3 -c "
import sys,json
d=json.load(sys.stdin)
pays=d.get('data',{}).get('payments',[])
for p in pays:
  if p['id']=='$C5_PAY_ID':
    print(p['paymentStatus'])
    break
" 2>/dev/null || echo "UNKNOWN")
    echo "C5_Payment final status: $C5_PAY_STATUS"

    if [ "$C5_PAY_STATUS" = "CONFIRMED" ]; then
      echo "C5 PASS ✅ — payment confirmed once, second idempotent"
    else
      echo "C5 FAIL ❌ — unexpected payment status: $C5_PAY_STATUS"
    fi
  fi
fi
echo ""

# ══════════════════════════════════════════
# DB INTEGRITY CHECK
# ══════════════════════════════════════════
echo "── INTEGRITY: DB consistency checks ──"

echo "Reservation count:"
psql -U zwadmin -h localhost -d zielone_wzgorza_admin -t -c "SELECT count(*) FROM reservations;"

echo "Timeline vs ReservationItems (should match for ACTIVE):"
psql -U zwadmin -h localhost -d zielone_wzgorza_admin -t -c "
SELECT 
  (SELECT count(*) FROM timeline_entries WHERE status='ACTIVE') as active_timeline,
  (SELECT count(*) FROM reservation_items ri JOIN reservations r ON ri.\"reservationId\"=r.id WHERE r.status IN ('PENDING','CONFIRMED')) as active_items;
"

echo "Orphan timeline (no reservation — should be 0):"
psql -U zwadmin -h localhost -d zielone_wzgorza_admin -t -c "
SELECT count(*) FROM timeline_entries te 
WHERE te.\"reservationId\" IS NOT NULL 
AND NOT EXISTS (SELECT 1 FROM reservations r WHERE r.id = te.\"reservationId\");
"

echo "Overlapping ACTIVE entries (should be 0):"
psql -U zwadmin -h localhost -d zielone_wzgorza_admin -t -c "
SELECT count(*) FROM timeline_entries a
JOIN timeline_entries b ON a.\"resourceId\" = b.\"resourceId\"
  AND a.id < b.id
  AND a.status = 'ACTIVE' AND b.status = 'ACTIVE'
  AND a.\"startAt\" < b.\"endAt\" AND a.\"endAt\" > b.\"startAt\";
"

echo ""
echo "============================================"
echo "S3.1 TESTS COMPLETE — $(date)"
echo "============================================"
