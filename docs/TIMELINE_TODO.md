# Timeline / Kalendarz — status
# Plik zaktualizowany: kwiecień 2026
# Źródło oryginalne: review ChatGPT, marzec 2026
# Większość P0 została zamknięta. Poniżej aktualny stan.

---

## P0 — ZAMKNIĘTE ✅

### 1. EXCLUSION CONSTRAINT ✅
Wdrożone: scripts/add-overlap-constraint.sql (standalone SQL).
Constraint no_resource_overlap na timeline_entries (btree_gist).
Test T18 w test-critical.sh weryfikuje 0 overlapów.
api-response.ts rozpoznaje unique_violation i zwraca 409.

### 3. Source of truth ✅
TimelineEntry = source of truth dla dostępności.
Reservation = dane biznesowe. Synchronizacja w transakcji.

### 6. loadMonth error retry ✅
Naprawione (loaded: false przy błędzie, retry działa).

---

## P0 — OTWARTE

### 2. Edycja rezerwacji — pełny flow
PATCH /api/reservations/[id] z edycją dat/zasobu.
Wymaga: update Reservation + update TimelineEntry w transakcji.
Status: zaplanowane, nie zaimplementowane.

---

## P1 — OTWARTE (do zamknięcia przy rozbudowie)

### 4. Invalidacja cache — stary + nowy zakres
Czeka na punkt 2 (edycja rezerwacji).

### 5. Error handling — rozróżnienie typów
409 → toast o konflikcie, 400 → field-level, 500 → generic.
Częściowo zrobione (409 rozpoznawane), reszta przy polish.

---

## P2 — HARDENING (przed pełną produkcją)

- Unit testy dat (DST, cross-month, edge cases)
- Scroll wstecz (infinite) — limit -12 miesięcy
- Batch endpoint (N miesięcy w 1 request)
- Concurrent edit awareness (polling / WebSocket)
- Mobile UX (landscape hint, touch selection)
