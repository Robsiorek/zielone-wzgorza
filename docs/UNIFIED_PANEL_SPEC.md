# SPECYFIKACJA: Unified Creation Panel (UnifiedPanel)
# Wspólny SlidePanel do tworzenia Rezerwacji / Ofert / Blokad
# Wersja 1.0 | Marzec 2026
# STATUS: ✅ ZREALIZOWANE — komponent w src/components/unified-panel/

---

## 1. CEL

Jeden komponent `UnifiedPanel` zastępuje:
- `CalendarActionPanel` (543 linii) — timeline mini-formularz
- `OfferCreator` (723 linie) — 4-krokowy kreator ofert na osobnej stronie
- `BookingCreator` (495 linii) — formularz rezerwacji na osobnej stronie
- `BlockCreatorPanel` (274 linie) — panel blokad

**Łącznie ~2035 linii → jeden system ~1200-1500 linii** (reusable sekcje).

Używany wszędzie:
- Timeline → klik na zakres → otwiera się z prefill (daty + zasób)
- Lista rezerwacji → "Dodaj rezerwację" → otwiera się pusty
- Lista ofert → "Nowa oferta" → otwiera się pusty
- Menu "Dodaj blokadę" → otwiera się pusty lub z prefill

---

## 2. ARCHITEKTURA PLIKÓW

```
src/components/unified-panel/
  unified-panel.tsx              — główny wrapper (SlidePanel + taby + routing)
  sections/
    dates-section.tsx            — daty + noce (shared)
    client-section.tsx           — wyszukiwarka klienta (shared: booking + offer)
    resources-section.tsx        — zasoby + multi-select + dostępność (shared)
    pricing-section.tsx          — ceny per zasób, goście (booking + offer)
    details-booking-section.tsx  — źródło, status, notatki (booking-specific)
    details-offer-section.tsx    — źródło, ważność, akcja po exp., notatki (offer-specific)
    details-block-section.tsx    — nazwa, notatka (block-specific)
    summary-section.tsx          — sticky bottom podsumowanie (shared)
```

---

## 3. KOMPONENT GŁÓWNY: UnifiedPanel

### Props
```typescript
interface UnifiedPanelProps {
  open: boolean;
  onClose: () => void;
  onCreated: (type: "booking" | "offer" | "block", startDate: string) => void;
  initialTab?: "booking" | "offer" | "block";
  prefill?: {
    resourceId?: string;
    resourceName?: string;
    resourceUnitNumber?: string | null;
    startDate?: string;
    endDate?: string;
    clientId?: string;
  };
}
```

### SlidePanel
- Szerokość: **800px** (desktop), **100%** (mobile)
- Scroll: pionowy, wewnętrzny
- Sticky: header z tabami (top) + podsumowanie (bottom)

### Taby (header)
```
[ 📅 Rezerwacja ]  [ 📄 Oferta ]  [ 🔒 Blokada ]
```
- Kolor akcentu: emerald / blue / slate
- Zmiana taba **NIE** resetuje: dat, klienta, zasobów (jeśli kompatybilne)
- Zmiana na "Blokada" → ukrywa sekcje: klient, cena, szczegóły oferty
- Zmiana na "Oferta" → pokazuje: ważność, akcja po wygaśnięciu
- Reset WSZYSTKIEGO → tylko przy otwarciu panelu (useEffect [open])

---

## 4. SEKCJE (od góry do dołu)

### 4.1 DatesSection (shared — zawsze widoczna)

```
┌──────────────────────────────────────────┐
│  📅 Termin pobytu                         │
│                                           │
│  Przyjazd          Wyjazd                 │
│  [  05.03.2026  ]  [  10.03.2026  ]      │
│                                           │
│              5 nocy                       │
└──────────────────────────────────────────┘
```

- `BubbleDatePicker` × 2 (start, end)
- Noce: auto-kalkulacja z `nightsBetween()`
- Min start: dzisiaj
- Min end: start + 1 dzień
- Zmiana dat → **reset zasobów** (dostępność się zmienia)
- Prefill z timeline: daty wypełnione

### 4.2 ClientSection (booking + offer, ukryta dla block)

```
┌──────────────────────────────────────────┐
│  👤 Klient                                │
│                                           │
│  [  🔍 Szukaj klienta...              ]  │
│                                           │
│  ┌─────────────────────────────────────┐  │
│  │ Jan Kowalski                        │  │
│  │ jan@example.com • +48 500 100 200   │  │
│  │                              [  ✕ ] │  │
│  └─────────────────────────────────────┘  │
│                                           │
│  + Dodaj nowego klienta                   │
└──────────────────────────────────────────┘
```

- Wyszukiwarka z debounce 300ms
- Dropdown wyników: nazwa, email, telefon, typ (firma/osoba)
- Po wyborze: karta klienta z przyciskiem usunięcia
- Opcja: "Dodaj nowego klienta" (inline mini-formularz lub redirect)
- Wymagany dla rezerwacji i oferty
- Ukryty dla blokady

### 4.3 ResourcesSection (shared — zawsze widoczna)

```
┌──────────────────────────────────────────┐
│  🏠 Zasoby                    [ + Dodaj ] │
│                                           │
│  ☑ Domek Stolarza (NR. 2)     180 zł/noc │
│    └ 🔴 Zajęty 05-08.03                  │
│  ☑ Domek Kowala (NR. 3)       200 zł/noc │
│    └ ✅ Dostępny                          │
│  ☐ Domek Młynarza (NR. 4)     180 zł/noc │
│    └ ✅ Dostępny                          │
│                                           │
│  Osoby: Dorośli [2] [-][+]               │
│         Dzieci  [1] [-][+]               │
└──────────────────────────────────────────┘
```

- Ładuje się PO wyborze dat (wymaga startDate + endDate)
- Dostępność: check per zasób vs timeline
- Zajęte: label "Zajęty DD-DD.MM" + czerwony indicator + disabled checkbox
- Soft-blocked (oferty): żółty indicator "Oferta DD-DD.MM" (można wybrać)
- Multi-select: checkboxy
- Przycisk "Dodaj kolejny zasób" → rozwija listę
- Prefill z timeline: pierwszy zasób zaznaczony
- Cena za noc: edytowalny input per zasób (domyślnie z cennika)
- Goście (dorośli + dzieci): ± counter (booking + offer)

### 4.4 DetailsSection (tab-specific)

**Booking:**
```
┌──────────────────────────────────────────┐
│  📋 Szczegóły rezerwacji                  │
│                                           │
│  Źródło:  [ Telefon         ▾ ]          │
│  Status:  [ Potwierdzona    ▾ ]          │
│  Uwagi gościa:    [                    ] │
│  Notatka wewnętrzna: [                 ] │
└──────────────────────────────────────────┘
```

**Offer:**
```
┌──────────────────────────────────────────┐
│  📋 Szczegóły oferty                      │
│                                           │
│  Źródło zapytania:  [ E-mail      ▾ ]   │
│  Ważność oferty:     [ 14.04.2026    ]   │
│  Po wygaśnięciu:     [ Anuluj      ▾ ]   │
│  Notatka wewnętrzna: [                 ] │
└──────────────────────────────────────────┘
```

**Block:**
```
┌──────────────────────────────────────────┐
│  📋 Szczegóły blokady                     │
│                                           │
│  Nazwa:    [ Obozy letnie 2026       ]   │
│  Notatka:  [                          ]  │
└──────────────────────────────────────────┘
```

### 4.5 SummarySection (sticky bottom — shared)

```
┌──────────────────────────────────────────┐
│  Podsumowanie                             │
│                                           │
│  Domek Stolarza   5 nocy × 180 zł = 900 zł │
│  Domek Kowala     5 nocy × 200 zł = 1000 zł │
│  ─────────────────────────────────────── │
│  Razem: 1 900 zł         3 osoby         │
│                                           │
│  [ Zapisz rezerwację                    ] │
└──────────────────────────────────────────┘
```

- Sticky na dole panelu (zawsze widoczne)
- Lista: zasób × noce × cena = kwota
- Total: suma + liczba osób
- Blokada: uproszczone (zasoby + daty, bez cen)
- Przycisk submit: kolor per tab (emerald/blue/slate)
- Disabled jeśli brakuje wymaganych pól

---

## 5. PROGRESSIVE DISCLOSURE (sekcje aktywują się od góry)

| Sekcja | Aktywna gdy | Disabled state |
|---|---|---|
| Daty | Zawsze | — |
| Klient | Zawsze (booking/offer) | — |
| Zasoby | startDate + endDate ustawione | "Wybierz daty aby zobaczyć dostępność" |
| Ceny | Min 1 zasób wybrany | — |
| Szczegóły | Min 1 zasób wybrany | — |
| Podsumowanie | Min 1 zasób wybrany | Pusty footer z disabled button |

---

## 6. PREFILL SCENARIOS

### Z timeline (klik na zakres → "Dodaj rezerwację/ofertę/blokadę")
```typescript
prefill = {
  resourceId: "xxx",
  resourceName: "Domek Stolarza",
  resourceUnitNumber: "2",
  startDate: "2026-03-05",
  endDate: "2026-03-10",
}
initialTab = "booking" | "offer" | "block"
```
→ Daty wypełnione, zasób pre-selected, user może dodać kolejne zasoby.

### Z listy rezerwacji → "Dodaj rezerwację"
```typescript
prefill = undefined
initialTab = "booking"
```
→ Wszystko puste, user wypełnia od góry.

### Z listy ofert → "Nowa oferta"
```typescript
prefill = undefined
initialTab = "offer"
```
→ Wszystko puste.

### Z profilu klienta → "Dodaj rezerwację"
```typescript
prefill = { clientId: "xxx" }
initialTab = "booking"
```
→ Klient pre-selected, reszta pusta.

---

## 7. API CALLS (submit)

### Tab: Rezerwacja → POST /api/bookings
```json
{
  "clientId": "xxx",
  "checkIn": "2026-03-05",
  "checkOut": "2026-03-10",
  "resources": [
    { "resourceId": "aaa", "pricePerNight": 180 },
    { "resourceId": "bbb", "pricePerNight": 200 }
  ],
  "adults": 2,
  "children": 1,
  "source": "PHONE",
  "status": "CONFIRMED",
  "guestNotes": "",
  "internalNotes": ""
}
```

### Tab: Oferta → POST /api/offers
```json
{
  "clientId": "xxx",
  "checkIn": "2026-03-05",
  "checkOut": "2026-03-10",
  "resources": [
    { "resourceId": "aaa", "pricePerNight": 180 }
  ],
  "adults": 2,
  "children": 1,
  "source": "EMAIL",
  "note": "",
  "expiresAt": "2026-04-14",
  "expiryAction": "CANCEL"
}
```

### Tab: Blokada → POST /api/blocks
```json
{
  "resourceIds": ["aaa", "bbb"],
  "startDate": "2026-03-05",
  "endDate": "2026-03-10",
  "label": "Obozy letnie 2026",
  "note": ""
}
```

---

## 8. CO USUWAMY PO WDROŻENIU

| Plik | Akcja |
|---|---|
| `calendar-action-panel.tsx` (543 L) | ❌ Usunięty |
| `block-creator-panel.tsx` (274 L) | ❌ Usunięty |
| `offer-creator.tsx` (723 L) | ❌ Usunięty |
| `booking-creator.tsx` (495 L) | ❌ Usunięty |
| `offers/new/page.tsx` | → otwiera UnifiedPanel (tab=offer) |
| `reservations/new/page.tsx` | → otwiera UnifiedPanel (tab=booking) |

---

## 9. PLAN IMPLEMENTACJI (kolejność)

### Faza 1: Wspólne sekcje
1. `DatesSection` — wyciągnięte z istniejącego kodu
2. `ClientSection` — wyciągnięte z booking-creator + offer-creator
3. `ResourcesSection` — merge logiki z obu kreatorów + availability check
4. `SummarySection` — nowe, sticky bottom

### Faza 2: UnifiedPanel wrapper
5. `UnifiedPanel` — SlidePanel + taby + routing sekcji + submit
6. Integracja z `calendar-content.tsx` (zastępuje CalendarActionPanel)
7. Integracja z `calendar-content.tsx` (zastępuje BlockCreatorPanel)

### Faza 3: Podstrony
8. `reservations/new/page.tsx` → otwiera UnifiedPanel
9. `offers/new/page.tsx` → otwiera UnifiedPanel
10. Usunięcie starych komponentów

### Faza 4: Hardening
11. Testy edge cases (multi-resource, prefill, tab switch)
12. Mobile responsiveness
13. Keyboard navigation (Tab, Enter, Escape)

---

## 10. RYZYKA I DECYZJE

### ⚠️ Tab switch — co resetować?
**Decyzja:** Daty + klient + zasoby → zachowane. Szczegóły (source, status) → reset per tab.
**Ryzyko:** User zmienia z "Oferta" na "Rezerwacja" → czy source "EMAIL" ma zostać?
**Propozycja:** Source options różnią się per tab → reset source przy zmianie taba.

### ⚠️ ResourcesSection — complexity
To najcięższy komponent (dostępność, multi-select, ceny, occupied labels).
Istniejąca logika z offer-creator i booking-creator jest RÓŻNA:
- Offer: softBlockedResourceIds (oferty nie blokują hard)
- Booking: blockedResources (hard block)
**Decyzja:** Jeden komponent, prop `blockMode: "hard" | "soft"`.

### ⚠️ Rozmiar panelu
800px to dużo. Na 1366px ekranie zostaje 566px widocznego tła.
**Propozycja:** 800px desktop, 100% mobile, opcjonalnie 700px na mniejszych ekranach.

### ⚠️ Prefill + "Dodaj kolejny zasób"
Timeline prefill daje 1 zasób. User klika "Dodaj kolejny" → rozwija pełną listę.
**Zachowanie:** Prefilled zasób = checkbox checked + disabled (nie można odznaczyć?).
**Propozycja:** Prefilled zasób = checked, ALE można odznaczyć. User ma pełną kontrolę.
