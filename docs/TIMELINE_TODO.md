# CRITICAL TODO — Timeline / Kalendarz
# Wynik review ChatGPT, marzec 2026
# Priorytetyzowane: P0 = blokery produkcji, P1 = zaraz po, P2 = hardening

---

## P0 — BLOKERY PRODUKCJI (zrobić przed wdrożeniem)

### 1. Race condition — EXCLUSION CONSTRAINT [DATABASE]
**Problem:** Dwa równoczesne requesty mogą stworzyć overlapping rezerwacje.
**Fix:** PostgreSQL exclusion constraint na timeline_entries.

```sql
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE timeline_entries
ADD CONSTRAINT no_resource_overlap
EXCLUDE USING gist (
  resource_id WITH =,
  daterange(start_date, end_date, '[)') WITH &&
) WHERE (status = 'ACTIVE');
```

**Efekt:** DB blokuje overlap na poziomie bazy. Backend łapie unique_violation error i zwraca 409.
**Uwaga:** `[)` = start inclusive, end exclusive — pasuje do naszej semantyki (checkout = checkin OK).
**Status:** ❌ Nie zrobione

### 2. Edycja rezerwacji — pełny flow [BACKEND + FRONTEND]
**Problem:** Brak edycji dat/zasobu rezerwacji. Recepcja musi DELETE + CREATE.
**Scope:**
- PATCH /api/bookings/[id] — zmiana dat, zasobu, klienta, statusu
- W JEDNEJ transakcji: update Booking + update/delete/create TimelineEntry
- Walidacja overlap na NOWY zakres (exclusion constraint łapie to automatycznie)
- Frontend: formularz edycji w SlidePanel lub osobna strona
- Cache: invalidateMonths(oldStart, oldEnd) + invalidateMonths(newStart, newEnd)
**Status:** ❌ Nie zrobione

### 3. Source of truth — zasada [ARCHITEKTURA]
**Decyzja (zatwierdzona):**
- TimelineEntry = source of truth dla DOSTĘPNOŚCI (overlap detection)
- Booking = dane biznesowe (klient, płatności, statusy)
- NIGDY nie zmieniać Booking bez zmiany TimelineEntry w tej samej transakcji
- Booking.checkIn/checkOut MUSZĄ być zsynchronizowane z TimelineEntry.startDate/endDate
**Status:** ✅ Zasada ustalona, wymaga enforcement przy edycji (punkt 2)

---

## P1 — ZARAZ PO STARCIE

### 4. Invalidacja cache — stary + nowy zakres [FRONTEND]
**Problem:** Edycja rezerwacji z marca na maj → marzec nie jest invalidowany w cache.
**Fix:** Każdy PATCH/DELETE musi przekazywać STARY zakres do invalidateMonths:
```typescript
// Przed edycją
invalidateMonths(oldStartDate, oldEndDate);
// Po edycji
invalidateMonths(newStartDate, newEndDate);
```
**Status:** ❌ Nie zrobione (czeka na punkt 2)

### 5. Error handling — rozróżnienie typów [FRONTEND]
**Problem:** Wszystkie errory → ten sam toast.
**Fix:**
- 409 → "Ten termin jest już zajęty" (osobny toast z info o konflikcie)
- 400 → "Sprawdź dane formularza" + field-level errors
- 500 → "Wystąpił błąd serwera, spróbuj ponownie"
- Network error → "Brak połączenia z serwerem"
**Status:** ❌ Nie zrobione

### 6. loadMonth error retry [FRONTEND]
**Problem:** Błąd API → loaded: true z pustymi entries → miesiąc nigdy nie będzie ponownie załadowany.
**Fix:**
- Błąd → loaded: false, loading: false, error: true
- UI: ikona warning na miesiącu z błędem
- Retry: klik na warning lub automatyczny retry po 5s (max 3 próby)
**Status:** ✅ Naprawione w tej sesji (patrz commit)

---

## P2 — HARDENING (przed pełną produkcją)

### 7. Testy
- Unit: dates.ts (checkout=checkin, 1 noc, cross-month, DST, invalid range)
- Integration: POST /api/blocks (overlap, multi-resource, all-or-nothing)
- Integration: POST /api/bookings (conflict, booking number seq)
- E2E: click-click selection → action panel → create → verify on timeline

### 8. Scroll wstecz (infinite)
- Analogiczna logika jak scroll w prawo
- Limit: -12 miesięcy od dziś

### 9. Batch endpoint
- Jeden request na N miesięcy zamiast N requestów
- Optymalizacja initial load (6 calls → 1)

### 10. Concurrent edit awareness
- Polling co 30s na widoczne miesiące (lub WebSocket)
- Toast: "Kalendarz został zaktualizowany przez innego użytkownika"

### 11. Mobile UX
- Landscape hint na telefonie
- Touch-friendly selection (long press zamiast click-click?)
