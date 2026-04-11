# SPECYFIKACJA: Timeline / Kalendarz — Zielone Wzgórza Admin Panel
# Wersja 1.0 | Marzec 2026
# STATUS: ✅ ZREALIZOWANE — działający moduł kalendarza.
# TYP: Spec architektoniczny (częściowo historyczny układ plików).
#   Źródło prawdy implementacji = kod w src/components/calendar/ + MP.
# UWAGA: calendar-action-panel.tsx i block-creator-panel.tsx zostały zastąpione
# przez UnifiedPanel (patrz UNIFIED_PANEL_SPEC.md).

---

## 1. ARCHITEKTURA PLIKÓW

```
src/
  components/calendar/
    calendar-content.tsx       — główny komponent (state, data loading, nawigacja, panele)
    calendar-grid.tsx          — siatka Gantt (render, pozycjonowanie, selekcja, handoff)
    calendar-entry.tsx         — pojedynczy blok na timeline (kolory, tooltip, badge)
    calendar-detail-panel.tsx  — SlidePanel po kliknięciu bloku (szczegóły + usuwanie blokad)
    calendar-action-panel.tsx  — SlidePanel po selekcji zakresu (taby: rezerwacja/oferta/blokada)
    block-creator-panel.tsx    — SlidePanel z menu "Dodaj blokadę" (multi-select zasobów)
    calendar-skeleton.tsx      — shimmer skeleton podczas ładowania
  lib/
    dates.ts                   — helpery dat (dateForDB, parseLocalDate, toDateStr, todayStr, nightsBetween)
  app/api/
    timeline/route.ts          — GET /api/timeline?startDate=&endDate=
    blocks/route.ts            — GET (lista) + POST (tworzenie blokad, batch w transakcji)
    blocks/[id]/route.ts       — PATCH (edycja) + DELETE (usuwanie blokady)
    bookings/route.ts          — GET (lista) + POST (tworzenie rezerwacji w transakcji)
```

---

## 2. MODEL DANYCH (Prisma → PostgreSQL)

### TimelineEntry
```
model TimelineEntry {
  id          String              @id @default(cuid())
  type        TimelineEntryType   // BOOKING | OFFER | BLOCK
  status      TimelineEntryStatus // ACTIVE | CANCELLED
  resourceId  String
  startDate   DateTime            @db.Date    ← PostgreSQL DATE (YYYY-MM-DD)
  endDate     DateTime            @db.Date    ← PostgreSQL DATE (YYYY-MM-DD)
  label       String?
  color       String?
  note        String?
  offerId     String?             ← FK do Offer (nullable)
  bookingId   String?             ← FK do Booking (nullable)
  
  @@index([resourceId, startDate, endDate])
  @@index([type, status])
}
```

### Semantyka dat
- `startDate` = dzień przyjazdu / start blokady (inclusive)
- `endDate` = dzień wyjazdu / koniec blokady (exclusive w logice, inclusive wizualnie)
- Rezerwacja 5-10 marca: startDate=2026-03-05, endDate=2026-03-10
  - Gość jest od 5 do 10 marca włącznie (checkout do określonej godziny)
  - Następna rezerwacja może zaczynać się 10 marca (checkout A = checkin B)
  - Backend walidacja: `startDate < newEnd AND endDate > newStart` → 10 < 10 = false = brak konfliktu

### Relacje
- TimelineEntry → Resource (zawsze)
- TimelineEntry → Booking (opcjonalnie, dla type=BOOKING)
- TimelineEntry → Offer (opcjonalnie, dla type=OFFER)
- Type BLOCK nie ma FK do Booking ani Offer

---

## 3. API

### GET /api/timeline
**Params:** `startDate`, `endDate` (YYYY-MM-DD), opcjonalnie `resourceId`, `type`, `includeInactive`

**Zwraca:**
```json
{
  "success": true,
  "data": {
    "entries": [
      {
        "id": "...",
        "type": "BOOKING",
        "status": "ACTIVE",
        "resourceId": "...",
        "startDate": "2026-03-05T00:00:00.000Z",  ← Prisma serializuje DATE jako UTC midnight
        "endDate": "2026-03-10T00:00:00.000Z",
        "label": null,
        "resource": { "id": "...", "name": "Domek Stolarza", "unitNumber": "2", "category": { "name": "Domki", "slug": "domki" } },
        "booking": { "id": "...", "bookingNumber": "ZW-2026-0001", "status": "CONFIRMED", "client": { ... } },
        "offer": null
      }
    ],
    "resources": [
      { "id": "...", "name": "Domek Stolarza", "unitNumber": "2", "maxCapacity": 7, "category": { ... } }
    ]
  }
}
```

**Walidacja overlap (query):**
- `where.startDate = { lt: dateForDB(endDate) }` — entry zaczyna się PRZED końcem zakresu
- `where.endDate = { gt: dateForDB(startDate) }` — entry kończy się PO początku zakresu
- Filtr: `status = ACTIVE` (domyślnie, chyba że `includeInactive=true`)

### POST /api/blocks
**Body:** `{ resourceIds: string[], startDate, endDate, label?, note? }`

**Logika (jedna transakcja):**
1. Walidacja: daty, min 1 zasób
2. Dla KAŻDEGO zasobu: sprawdź konflikty (`type IN (BOOKING, BLOCK) AND status = ACTIVE`)
3. Jeśli JAKIKOLWIEK zasób ma konflikt → rollback, zwróć listę zajętych zasobów
4. Jeśli wszystko OK → utwórz TimelineEntry per zasób
5. All-or-nothing — zero częściowych zapisów

### POST /api/bookings
**Body:** `{ clientId, checkIn, checkOut, resources: [{ resourceId, pricePerNight }], status?, source?, ... }`

**Logika (jedna transakcja):**
1. Walidacja klienta, dat, min 1 zasób
2. Dla KAŻDEGO zasobu: sprawdź konflikty na timeline
3. `generateBookingNumber()` z `nextval('booking_number_seq')` wewnątrz transakcji
4. Utwórz: Booking + BookingResource[] + StatusLog + TimelineEntry per zasób
5. All-or-nothing

---

## 4. SYSTEM DAT (src/lib/dates.ts)

### Zasady globalne
1. Daty pobytowe = string YYYY-MM-DD, bez czasu, bez timezone
2. Timestamps (createdAt, updatedAt) = ISO DateTime
3. API przyjmuje i zwraca YYYY-MM-DD
4. ZAKAZANE: `new Date("YYYY-MM-DD")`, `toISOString()`, manipulacja godziną

### Helpery

| Funkcja | Cel | Użycie |
|---|---|---|
| `dateForDB("2026-03-05")` | UTC midnight Date dla Prisma | Backend API routes |
| `parseLocalDate("2026-03-05")` | Local Date dla display | Frontend `toLocaleDateString()` |
| `toDateStr(date)` | Date → "YYYY-MM-DD" (local) | Frontend formatting |
| `todayStr()` | Dzisiejsza data YYYY-MM-DD | Min dates w pickerach |
| `nightsBetween(start, end)` | Liczba nocy (UTC) | Kalkulacje |
| `extractDateStr(str)` | YYYY-MM-DD z ISO timestamp | Internal, obsługuje Prisma output |

### Flow daty przez system
```
Frontend: "2026-03-05" (string)
    ↓ API body
Backend: dateForDB("2026-03-05") → new Date("2026-03-05T00:00:00.000Z")
    ↓ Prisma
PostgreSQL: DATE column = 2026-03-05
    ↓ Prisma read
Backend: "2026-03-05T00:00:00.000Z" (ISO timestamp)
    ↓ API response
Frontend: extractDateStr("2026-03-05T00:00:00.000Z") → "2026-03-05"
    ↓ parseLocalDate
Display: new Date(2026, 2, 5) → "5 marca 2026"
```

---

## 5. FRONTEND — CALENDAR-CONTENT (główny komponent)

### Data loading — architektura per-miesiąc

**Cache:**
```typescript
monthCache: Record<string, MonthData>
// key = "YYYY-MM", np. "2026-03"
// MonthData = { entries: TimelineEntry[], loaded: boolean, loading: boolean }
```

**Initial load:** 6 miesięcy (bieżący -1 do +4). Każdy miesiąc = osobne API call.

**Infinite scroll:** Scroll w prawo blisko krawędzi (600px) → automatycznie rozszerza `loadedRange` o +3 miesiące → `loadMonth()` tylko dla NOWYCH miesięcy.

**Guards (ref-based):**
- `loadingMonths: Set<string>` — zapobiega równoległym fetch tego samego miesiąca
- `loadedMonthsRef: Set<string>` — zapobiega ponownemu fetch
- `expanding: boolean` — zapobiega wielokrotnemu trigger z scroll event
- `loadMonthRef` — stable ref pattern, effects NIE zależą od `loadMonth` identity

**Merge entries:**
```typescript
allEntries = deduplicate po id z wszystkich loaded months w cache
```
Rezerwacja 28.03→03.04 jest w cache "2026-03" i "2026-04" — po merge pojawia się RAZ.

**Invalidacja (po dodaniu/edycji/usunięciu):**
- `invalidateMonths(startDate, endDate?)` — czyści TYLKO dotknięte miesiące
- Czyści ref guards (`loadedMonthsRef`, `loadingMonths`)
- Reloaduje te miesiące
- Reszta cache zostaje nietknięta — zero flickera
- `handleDataRefresh()` — invaliduje TYLKO aktualnie widoczne miesiące (z scroll position)
- `handleBlockCreated(startDate)` — invaliduje miesiąc + następny (safety) + scroll do daty

### Max zakres
```typescript
const maxMonthNum = today.getFullYear() * 12 + today.getMonth() + 24;
const maxYear = Math.floor(maxMonthNum / 12);
const maxMonth = maxMonthNum % 12;
```
Jedno źródło prawdy — używane w: timeline, picker, walidacja.

### Initial scroll
- `handleScrollMount(el)` — callback wywoływany przez CalendarGrid gdy scroll container się montuje
- Ustawia `el.scrollLeft` synchronicznie na pozycję dzisiejszego dnia
- Backup `useEffect([days])` — na wypadek gdy mount nastąpił przed załadowaniem danych
- `hasScrolledInitial` ref guard — odpala się dokładnie raz

### Visible month label
- `visibleMonthLabel` state, inicjalizowany z dzisiejszego miesiąca
- Aktualizowany na scroll event — oblicza miesiąc z `el.scrollLeft + el.clientWidth / 3`

---

## 6. FRONTEND — CALENDAR-GRID (siatka Gantt)

### Layout
- Frozen lewa kolumna: 200px — nazwy zasobów z UnitBadge, grupowane po kategoriach
- Scrollowalna prawa sekcja: `colWidth = 42px` per dzień (widok month)
- Header: nazwy miesięcy (top row) + dni tygodnia + numer dnia (bottom row)
- Row height: 48px per zasób
- Weekendy: `bg-muted/10`, dzisiaj: `bg-primary/5` + pionowa linia

### computePositions(entries, resourceId, days)
**Input:** lista entries, ID zasobu, tablica dni
**Output:** `PositionedEntry[]` z kolumnami, lane'ami, clip flagami

**Kolumny (UTC, bez DST):**
```typescript
const rangeStartUTC = dateForDB(toDateStr(days[0]));
startCol = diff(eStart, rangeStart) / DAY_MS
logicalEndCol = diff(eEnd, rangeStart) / DAY_MS     ← exclusive, do lane overlap
endCol = logicalEndCol + 1 (jeśli nie clipped right) ← inclusive, do renderowania
```

**Lane algorithm:**
- Sortuj po startCol, potem logicalEndCol
- Dla każdego entry: znajdź overlapping entries (j < i, `b.startCol < a.logicalEndCol && b.logicalEndCol > a.startCol`)
- Jeśli overlap → przydziel najniższy wolny lane
- Max 2 lane'y widoczne, reszta → `+N` overflow badge
- Checkout A = checkin B: `logicalEndCol` == `startCol` → NIE jest overlap → ten sam lane

**Half-day handoff:**
- `halfEnd = true` gdy entry nie jest clipped i endCol > logicalEndCol
- `halfStart = true` gdy inny entry ma logicalEndCol === this.startCol
- CalendarEntry: left/width offset o `colWidth / 2` dla half days
- Handoff marker: ikonka `ArrowLeftRight` w kółku na granicy, animacja `scaleX` na strzałkach

### Click-click selection
**Phases:** `idle` → `selecting` → `confirmed`

**Flow:**
1. Klik 1 (idle): start selection, `startCol = endCol = clickedCol`, phase → `selecting`
2. Mouse move (selecting): rozciąga `endCol`, floating tooltip przy kursorze
3. Klik 2 (selecting): potwierdza zakres, phase → `confirmed`, action bubble
4. Klik 3 lub ESC (confirmed): reset
5. Klik na inny zasób podczas selecting: restart na nowym zasobie
6. Ten sam dzień 2x: reset (0 nocy)

**Floating info (portal):**
- Podąża za kursorem (`mousePos.x + 16, mousePos.y - 40`)
- Nazwa zasobu + NR., zakres dat, liczba nocy

**Action bubble (portal):**
- Pozycja: na końcu selekcji, clamped do viewport
- Header: nazwa zasobu + daty + noce
- 3 opcje: Dodaj rezerwację / blokadę / ofertę
- Zamyka się: ESC, klik poza, wybór akcji

**Dates calculation:**
```typescript
selectionNights = endCol - startCol + 1  // inclusive
startDate = toDateStr(days[startCol])
endDate = toDateStr(addDays(days[endCol], 1))  // checkout = day after last selected
```

### Hover
- Idle phase: hover na komórce → `bg-primary/25`
- Cursor: `pointer` (nie crosshair)

---

## 7. FRONTEND — CALENDAR-ENTRY (blok na timeline)

### Kolorystyka — status drives color

| Typ | Styl | Kolor |
|---|---|---|
| BOOKING NEW | solid border | niebieski (blue-100) |
| BOOKING PENDING | solid border | żółty (amber-100) |
| BOOKING CONFIRMED | solid border | zielony (emerald-100) |
| BOOKING CHECKED_IN | solid border | fioletowy (purple-100) |
| BOOKING CHECKED_OUT | solid border | szary (gray-100) |
| BOOKING CANCELLED | solid border | czerwony (red-100) |
| BOOKING NO_SHOW | solid border | pomarańczowy (orange-100) |
| OFFER (każdy status) | **dashed border** | niebieski jasny (blue-50) |
| BLOCK | solid border | grafitowy (slate-200) + ikonka kłódki |

### Zawartość bloku
- Kłódka (Lock) — tylko dla BLOCK
- Multi-resource badge: `🏠 3x` — gdy rezerwacja obejmuje >1 zasób
- Nazwa klienta/firmy — główny tekst
- Numer rezerwacji — subtelny badge (`bg-black/5 text-[9px]`)

### Multi-resource cross-highlight
- `resourceCountMap`: oblicza ile zasobów ma każda rezerwacja/oferta (po bookingId/offerId)
- Hover na jednym bloku → `ring-2 ring-foreground/30` na WSZYSTKICH blokach z tym samym groupId
- `highlightedGroupId` state w CalendarGrid

### Tooltip (portal na document.body)
- Header: typ (uppercase) + numer (mono) + kolorowy badge statusu PL
- Klient: ikonka (firma/osoba) + nazwa bold
- Daty: ikona Calendar + pełna data PL
- Noce: ikona Clock + "X nocy"
- Multi-resource: ikona Home + "X zasobów w rezerwacji"
- Blokada note: italic
- Pozycjonowanie: center above, flip below jeśli brak miejsca, arrow tracks anchor
- Dismiss: scroll (capture=true), resize, mouseLeave (75ms delay)

---

## 8. PANELE (SlidePanel)

### CalendarDetailPanel
- Otwiera się po kliknięciu bloku na timeline
- Pokazuje: typ, numer, status, daty, noce, zasób, klient (kliknij → profil)
- BLOCK: przycisk "Usuń blokadę" z ConfirmDialog
- BOOKING/OFFER: przycisk "Otwórz rezerwację/ofertę"

### CalendarActionPanel (szeroki, 640px)
- Otwiera się po click-click selection na timeline
- 3 taby: Rezerwację | Ofertę | Blokadę (z ikonami, kolorami)
- Shared header: zasób (nazwa + NR.) + daty (BubbleDatePicker z min) + noce
- Tab Rezerwacja: client search, goście ±, cena/noc, źródło, status, notatki
- Tab Blokada: nazwa, notatka
- Tab Oferta: client search, cena/noc, notatki
- Przełączanie tabów zachowuje WSZYSTKIE dane (client, ceny, daty)
- Reset TYLKO przy otwarciu panelu (useEffect [open])
- Submit → API → toast → invalidateMonths → scroll do daty → close panel

### BlockCreatorPanel (z menu "Dodaj blokadę")
- Flow: daty → system sprawdza dostępność → pokazuje zasoby
- Zajęte: kłódka + "Zajęty" + disabled
- Multi-select: checkboxy + "Zaznacz dostępne"
- Zapis: jedna transakcja, all-or-nothing
- Data "Od" min = dzisiaj, "Do" min = "Od"

---

## 9. NAWIGACJA KALENDARZA

### Toolbar (od lewej do prawej)
1. **Tytuł**: "Kalendarz" + subtitle
2. **"Dodaj rezerwację"** — btn-primary → `/admin/reservations/new`
3. **3 kropki (MoreVertical)** → dropdown: Dodaj blokadę, Dodaj ofertę
4. **Szukaj rezerwacji** — input z debounce 300ms → dropdown wyników (klient, numer, daty, status PL)
5. **← → strzałki** — smooth scroll o ~30 dni
6. **"Dziś"** — smooth scroll do dzisiejszego dnia
7. **Aktualny miesiąc** — dynamicznie z scroll position
8. **Ikona kalendarza** → mini-calendar picker

### Date picker (mini-calendar)
- BubbleSelect: miesiąc + rok
- Strzałki ← → nawigują po miesiącach
- Siatka dni: Pn-Nd, dzisiaj = primary
- Max: `maxYear`/`maxMonth` — lata i miesiące filtrowane, strzałka → disabled
- Klik na dzień → `jumpToDate()` → expand range jeśli trzeba → `pendingScrollTarget` → scroll po load

### Legenda + stats
- 3 taby-filtry: Rezerwacja (emerald) | Oferta (blue) | Blokada (slate) — klik toggle
- Ikony + liczby: 🏠 14 | 📅 60 | 📄 7 | 🔒 8
- Spinner gdy ładuje kolejne miesiące

---

## 10. SORTOWANIE ZASOBÓW

### Źródło prawdy
- Pole `sortOrder` w modelu Resource
- API: `PATCH /api/resources/reorder` — batch update w transakcji
- Używane WSZĘDZIE: `/api/resources`, `/api/timeline`, kalendarz, formularze

### Drag & drop UI (zakładka Zasoby)
- Przycisk "Sortuj" toggle
- W trybie sort: grip handle (GripVertical), cursor grab
- Dragging: źródło `opacity-30 scale-95`, cel `ring-2 ring-primary`
- Po drop: optimistic update + batch PATCH
- Kolejność dictates display w CAŁYM panelu

---

## 11. ZNANE EDGE CASES I DECYZJE

### Checkout = Checkin (A.endDate === B.startDate)
- Backend: NIE jest konfliktem (`endDate > startDate` = false)
- Timeline: ten sam lane (logicalEndCol overlap = false)
- Wizualnie: half-day offset + handoff marker (ArrowLeftRight, animowany)

### Cross-month entries
- Rezerwacja 28.03→03.04: w cache obu miesięcy
- Merge: `Set<id>` deduplikacja — pojawia się raz w `allEntries`
- `computePositions`: operuje na ciągłym `days[]` array, nie na granicach cache

### DST (zmiana czasu)
- `computePositions` używa UTC dates (`dateForDB`) — zero DST
- Display: `parseLocalDate` → local Date → `toLocaleDateString`
- Nights: `nightsBetween` → UTC diff

### Blokady
- Typ BLOCK, kolor slate (grafitowy), ikonka kłódki
- Brak FK do Booking/Offer
- Brak klienta
- Usuwanie: hard delete (nie soft delete)
- Multi-create: jedna transakcja, all-or-nothing

### Oferty
- Dashed border na timeline (odróżnienie od rezerwacji)
- Kolor niebieski (niezależnie od statusu oferty)
- Status badge w tooltip (Szkic/Wysłana/Zaakceptowana/Wygasła/Anulowana)

---

## 12. POTENCJALNE MINY / TODO

### ⚠️ Wydajność
- 6 API calls na start (per miesiąc) — OK teraz, docelowo rozważyć batch endpoint
- Merge `allEntries` przelicza się na każdy `monthCache` change — OK przy <1000 entries
- `computePositions` per resource per render — OK przy <30 zasobów

### ⚠️ Invalidacja przy edycji rezerwacji
- Obecnie: invaliduje miesiąc startDate + następny
- Ryzyko: edycja daty rezerwacji z marca na maj — stary marzec NIE jest invalidowany
- TODO: `invalidateMonths(oldStartDate, oldEndDate)` + `invalidateMonths(newStartDate, newEndDate)`

### ⚠️ Concurrent edits
- Brak optimistic locking — dwa adminy mogą edytować ten sam zakres
- Walidacja konfliktów jest per-transakcja, więc nie zapisze duplikatu
- Ale UI jednego admina nie odświeży się automatycznie (brak WebSocket/polling)

### ⚠️ Brak scroll wstecz (infinite)
- Obecnie range startuje od bieżący miesiąc -1
- Scroll w lewo poza ten zakres nie rozszerza range
- TODO: analogiczna logika jak scroll w prawo, ale z limitem -12 miesięcy

### ⚠️ Error handling w loadMonth
- Catch: ustawia `loaded: true` z pustymi entries — miesiąc NIE będzie ponownie ładowany
- Brak UI wskazującego na błąd ładowania konkretnego miesiąca
- TODO: retry logic lub error state per miesiąc

### ⚠️ CalendarActionPanel — oferta
- Prosty formularz (klient + cena + notatki)
- NIE obsługuje pełnego kreatora ofert (addony, multi-resource, kalkulacje)
- Pełny kreator ofert: osobna strona `/admin/offers/new`

### ⚠️ Mobile
- Grid: horizontal scroll na touch (WebkitOverflowScrolling: touch, overscroll-x-contain)
- Hint "Obróć telefon" — TODO
- SlidePanel: full width na mobile — działa
- Date picker: może wymagać responsywnych poprawek

---

## 13. PODSUMOWANIE STANU PLIKÓW (line counts)

| Plik | Linie | Rola |
|---|---|---|
| calendar-content.tsx | 649 | State, loading, nawigacja, panele |
| calendar-grid.tsx | 607 | Siatka Gantt, pozycjonowanie, selekcja, handoff |
| calendar-action-panel.tsx | 543 | SlidePanel z tabami (rezerwacja/oferta/blokada) |
| calendar-entry.tsx | 421 | Blok na timeline (kolory, tooltip, badge) |
| block-creator-panel.tsx | 274 | Panel blokad (multi-select, dostępność) |
| calendar-detail-panel.tsx | 260 | Panel szczegółów (po kliknięciu bloku) |
| calendar-skeleton.tsx | 50 | Shimmer skeleton |
| dates.ts | 112 | Helpery dat |
| **TOTAL** | **2916** | |
