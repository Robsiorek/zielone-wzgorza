# DESIGN SYSTEM — Zielone Wzgórza Admin Panel
# Wersja 1.6 | Kwiecień 2026
# Ten plik jest JEDYNYM źródłem prawdy dla stylu wizualnego panelu.
# Czytaj go na starcie KAŻDEGO czatu przed generowaniem kodu.

## 1. FUNDAMENT

### Font
Plus Jakarta Sans (Google Fonts), fallback: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto

### Kolorystyka (CSS variables)
- `--primary: 214 89% 52%` — niebieski akcent (hover: /0.85)
- `--background: 210 20% 98%` — tło strony (jasne)
- `--card: 0 0% 100%` — tło kart (białe)
- `--foreground: 220 15% 12%` — tekst główny
- `--muted-foreground: 220 8% 52%` — tekst pomocniczy
- `--border: 220 13% 91%` — ramki
- `--destructive: 0 72% 51%` — czerwony (błędy, usuwanie)
- `--radius: 16px` — base radius (karty: 20px)

### Dark mode
Pełne wsparcie, zmienne w `.dark {}` w globals.css.

---

## 2. HIERARCHIA RAMEK (BORDER)

Trzy poziomy — NIGDY nie mieszaj:

| Grubość | Zastosowanie |
|---------|-------------|
| **2px** | Karty (`.bubble`), przyciski (`.btn-bubble`), aktywne taby |
| **1px** | Inputy (`.input-bubble`), dropdown, table separatory |
| **0px** | Tab wrapper, nieaktywne taby, wewnętrzne separatory |

---

## 3. TYPOGRAFIA — rozmiary fontów

| Kontekst | Rozmiar | Waga | Klasa |
|----------|---------|------|-------|
| Tytuł strony (h2) | text-xl | font-bold | `text-xl font-bold tracking-tight` |
| Podtytuł strony | text-[13px] | normal | `text-[13px] text-muted-foreground mt-1` |
| Nagłówek sekcji/karty | text-[14px] | font-semibold | `text-[14px] font-semibold` |
| Label formularza | text-[12px] | font-semibold | `text-[12px] font-semibold text-muted-foreground` |
| Tekst body | text-[13px] | normal | `text-[13px]` |
| Tekst pomocniczy | text-[12px] | normal | `text-[12px] text-muted-foreground` |
| Tekst mały | text-[11px] | normal | `text-[11px] text-muted-foreground` |
| Caption/hint | text-[11px] | normal | `text-[11px] text-muted-foreground/60` |
| Nagłówek tabeli | text-[11px] | font-bold | `text-[11px] font-bold text-muted-foreground uppercase tracking-wider` |
| Komórka tabeli | text-[13px] | normal | `text-[13px] text-muted-foreground` |
| Badge/tag | text-[11px] | font-semibold | `text-[11px] font-semibold px-2 py-0.5 rounded-full` |
| Tag mały | text-[9px] | font-medium | `text-[9px] px-1.5 py-0.5 rounded-full font-medium` |
| Przycisk | text-[13px] | font-semibold | wbudowane w `.btn-bubble` |
| Mono (ID, numery) | text-[12px] | normal | `text-[12px] text-muted-foreground font-mono` |

---

## 4. SPACING — TWARDE ZASADY

### Strona
- Przestrzeń między sekcjami strony: `space-y-4`
- Animacja wejścia: `fade-in-up`
- Max szerokość formularzy: `max-w-[800px]`

### Nagłówek strony
```
<div class="flex items-center justify-between">
  <div>
    <h2 class="text-xl font-bold tracking-tight">Tytuł</h2>
    <p class="text-[13px] text-muted-foreground mt-1">Podtytuł</p>
  </div>
  <button class="btn-bubble btn-primary-bubble px-5 py-2.5 text-[13px]">
    <Plus class="h-4 w-4" /> Akcja
  </button>
</div>
```

### Karta (bubble)
- Klasa: `.bubble`
- Padding wewnętrzny: `px-5 py-4` (20px x 16px)
- Między kartami: `gap-4` lub `space-y-4`

### Formularz (wewnątrz karty/sekcji)
- Padding sekcji: `px-5 py-5` (20px dookoła)
- Odstęp między polami: `space-y-5` (20px)
- Grid kolumn: `grid grid-cols-1 sm:grid-cols-2 gap-4`
- Grid 3 kolumn: `grid grid-cols-1 sm:grid-cols-3 gap-4`
- Label nad inputem: `mb-1.5` (6px)

### Accordion sekcja (formularz klienta itp.)
```
<div class="bubble" style="overflow: visible">
  <button class="w-full flex items-center justify-between px-5 py-4">
    <h3 class="text-[14px] font-semibold">Tytuł</h3>
    <ChevronDown/Right />
  </button>
  {open && <div class="px-5 pb-5 pt-5 border-t border-border/50" style="overflow: visible">
    <div class="space-y-5">...</div>
  </div>}
</div>
```

### Tabela
- Wrapper: `.bubble.overflow-x-auto`
- Klasa tabeli: `.table-bubble.w-full`
- Header: `px-4 py-2.5 text-[11px]` (z globals.css)
- Komórka: `px-3 py-3 text-[13px]` (listy) lub `px-4 py-3.5` (detale)
- Separator: `border-t border-border/50`
- Hover: `hover:bg-muted/30 transition-colors`

### Przycisk akcje (dolna belka formularza)
```
<div class="flex gap-3 pt-2 pb-8">
  <button class="btn-bubble btn-primary-bubble px-6 py-3 text-[13px]">Zapisz</button>
  <button class="btn-bubble btn-secondary-bubble px-6 py-3 text-[13px]">Anuluj</button>
</div>
```

---

## 5. KOMPONENTY

### Input
- Klasa: `input-bubble h-11`
- Wysokość: **ZAWSZE h-11** (44px) — dotyczy text, email, number, date, select
- Textarea: `input-bubble min-h-[80px] resize-y` (bez h-11)
- Placeholder: automatycznie `text-muted-foreground/60`

### BubbleSelect (dropdown)
- Reużywalny komponent: `<BubbleSelect options={[]} value={} onChange={} />`
- Z labelem: `<BubbleSelect label="Nazwa" ... />`
- Border: 1px (z kodu komponentu)
- Dropdown renderuje się w portalu — nie ucina się przez overflow rodzica

### BubbleDatePicker (data)
- Reużywalny komponent: `<BubbleDatePicker value="2026-03-18" onChange={} />`
- Z labelem: `<BubbleDatePicker label="Data od" ... />`
- Props: `value` (YYYY-MM-DD), `onChange`, `label?`, `placeholder?`, `min?`, `max?`, `className?`
- Polskie nazwy miesięcy i dni (Pn–Nd)
- Nawigacja miesięcy ze strzałkami + klik na nazwę miesiąca wraca do dzisiaj
- Dziś: kropka pod numerem + przycisk quick-action "Dzisiaj"
- Wybrany dzień: `bg-primary text-primary-foreground` (pill)
- Dropdown renderuje się w portalu (z-index: 99999) — nie ucina się w SlidePanel
- Border: 1px (trigger), animacja: scaleIn + slideCalLeft/slideCalRight na zmianie miesiąca

### Przycisk (button)
| Wariant | Klasa | Użycie |
|---------|-------|--------|
| Primary | `btn-bubble btn-primary-bubble px-5 py-2.5 text-[13px]` | Główna akcja (Dodaj, Zapisz) |
| Secondary | `btn-bubble btn-secondary-bubble px-5 py-2.5 text-[13px]` | Anuluj, filtry, nawigacja |
| Danger | `btn-bubble btn-danger-bubble px-4 py-2.5 text-[13px]` | Usuń (czerwony border+tekst) |
| Icon | `btn-icon-bubble h-9 w-9` | Strzałka wstecz, edycja w tabeli |
| Small icon (tabela) | `h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted` | Eye, Pencil w wierszach |

### Toggle switch (zamiast checkbox)
**NIGDY** nie używaj natywnych `<input type="checkbox">` — zawsze toggle switch.
Pełny wzorzec: patrz sekcja 20.
```
<button class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors
  ${checked ? 'bg-primary' : 'bg-muted-foreground/20'}">
  <span class="inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform
    ${checked ? 'translate-x-6' : 'translate-x-1'}" />
</button>
```

### Taby
- Wrapper: `.tabs-bubble` (flex gap-1, bg-muted/50, rounded-full, p-1)
- Tab: `.tab-bubble` (px-4 py-2, text-[13px], rounded-full)
- Aktywny: `.tab-bubble .tab-bubble-active`
- Count badge: `.count-bubble` (min-w-[22px] h-[22px] text-[10px])
- **Responsywność**: wrapper z `overflow-x-auto scrollbar-hide`, taby z `min-w-max whitespace-nowrap`
- **Scrollbar**: ZAWSZE `scrollbar-hide` na wrapperze — ukrywa pasek, scroll działa
- **Auto-scroll**: gdy tab zmienia się (np. z hash URL), scroll wrapper do aktywnego taba (ref + scrollTo inline center)
- **Hash routing**: jeśli moduł ma taby, obsługiwać hash w URL (np. `/pricing#promos`). Sidebar linkuje z hash. Komponent przechwytuje `history.pushState`/`replaceState` (bo Next.js client-side navigation nie odpala `hashchange`) — NIE używać `setInterval`

### SlidePanel
- Komponent: `<SlidePanel open={} onClose={} title="">`
- Z-index: 9999
- Overlay: ciemny, klik zamyka
- Wewnętrzny padding: w komponencie (nie dodawaj extra)

### Modale / Dialogi (globalna zasada)
- Overlay: `bg-black/25` + `backdrop-filter: blur(4px)` na cały ekran
- **ZASADA: Gdy tło jest rozmyte (blur), modal NIE MA bordera.** Border + blur = rozmyty brzeg, wygląda źle. Zamiast tego stosujemy subtelny cień: `box-shadow: 0 8px 40px rgba(0,0,0,0.12)`.
- Renderowanie: ZAWSZE przez `createPortal(dialog, document.body)` — żaden modal NIE renderuje się inline w divie (blur pokrywa tylko parent div zamiast całej strony)
- Zaokrąglenie: `rounded-[20px]`
- Max-width: 420-440px
- Layout: ikona w boxie (h-10 w-10 rounded-xl) + tytuł obok + opis pod tytułem. Separator. Przyciski na dole justify-end.
- Komponent generyczny: `<ConfirmDialog>` (props: open, onConfirm, onCancel, title, message, variant)

### UnitBadge (numerowanie zasobów)
- Komponent: `<UnitBadge number={X} size="sm|md" />`
- Import: `import { UnitBadge } from "@/components/ui/unit-badge"`
- Wygląd: pilka `bg-primary/10 text-primary` z tekstem `NR. X` (bold, tracking-wide)
- **ZASADA: Nigdy nie używamy `#3`, `#5`, `#9` do oznaczania zasobów.** Zawsze `<UnitBadge>` z `NR. X` na kolorowym tle.
- Rozmiary: `sm` (9px font, px-1.5) do tabel i list, `md` (10px, px-2) do kart i szczegółów

### Skeleton loader (shimmer)
- Bazowy: `<Skeleton className="h-4 w-32 rounded-lg" />`
- Klasa: `rounded-xl bg-muted/60 shimmer` (animacja fali światła)
- **ZASADA: Skeletony NIGDY nie mają `fade-in-up`, `stagger` ani żadnych animacji wejścia.** Skeleton pojawia się natychmiast i stoi stabilnie — jedyny ruch to shimmer. Animacja `fade-in-up` odpala się dopiero na prawdziwym contencie po załadowaniu danych.
- Dedykowane skeletony modułów:
  - `<ResourcesSkeleton />` — header + 5 tabów + searchbar + 6 kart grid
  - `<PricingSkeleton />` — header + 4 taby + 3 karty grid
  - `<ClientsSkeleton />` — header + toolbar (search + 3 filtry) + 8 wierszy tabeli + paginacja
- Każdy nowy moduł powinien dostać swój `<ModuleSkeleton />` odzwierciedlający layout strony
- Import: `import { ResourcesSkeleton, PricingSkeleton, ClientsSkeleton, Skeleton } from "@/components/ui/skeleton"`
- Użycie: `if (loading) return <ModuleSkeleton />;`

### Focus states (accessibility)
- Wszystkie interaktywne elementy mają `:focus-visible` ring
- Inputy: `border-color: primary` + `box-shadow: 0 0 0 3px hsl(var(--primary) / 0.1)`
- Przyciski, taby, icon buttons: `box-shadow: 0 0 0 3px hsl(var(--primary) / 0.15)`
- Dropdown items: `bg-accent text-accent-foreground` na focus-visible
- NIGDY nie usuwaj focus bez zastępstwa — `outline: none` tylko z `box-shadow` ring

### Toast (notyfikacje)
- Provider: `<ToastProvider>` w root layout — opakowuje `{children}`
- Hook: `const { success, error, info, warning } = useToast()`
- Użycie: `success("Zapisano")`, `error("Błąd", "Nie udało się zapisać")`
- 4 typy: `success` (zielony), `error` (czerwony), `info` (niebieski), `warning` (żółty)
- Pozycja: fixed bottom-right, z-index 99999
- Auto-dismiss po 4s, klik X zamyka wcześniej
- Animacja: wjeżdża z prawej (`toastIn`), znika z fade+slide
- Styl: `rounded-2xl`, border kolorowy, ikona + tytuł + opcjonalny opis
- Import: `import { useToast } from "@/components/ui/toast"`

### Status badge
```
<span class="text-[11px] font-semibold px-2 py-0.5 rounded-full {colorClasses}">
  {label}
</span>
```
Kolory per status — definiuj jako obiekt config na górze komponentu.

### Ikona w nagłówku (avatar)
```
<div class="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
  <Icon class="h-3.5 w-3.5 text-primary" />
</div>
```
Duży (szczegóły): `h-10 w-10`, ikona `h-5 w-5`

---

## 6. SZUKAJKA + FILTRY (toolbar)

```
<div class="flex items-center gap-3 flex-wrap">
  <div class="relative flex-1 min-w-[200px]">
    <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
    <input class="input-bubble input-bubble-search h-11 w-full"
      style={search ? { paddingRight: 36 } : undefined}
      placeholder="Szukaj..." />
    {search && (
      <button onClick={() => setSearch("")}
        class="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-muted
        flex items-center justify-center text-muted-foreground
        hover:bg-muted-foreground/20 hover:text-foreground transition-all">
        <X class="h-3 w-3" />
      </button>
    )}
  </div>
  <BubbleSelect ... class="w-[160px]" />
</div>
```
- Szukajka: ZAWSZE `h-11`, klasa `input-bubble-search` (padding-left: 40px, nadpisuje @apply px-4)
- Ikona X: pojawia się gdy search niepusty, klik czyści i wraca focus. paddingRight: 36 jako inline style (warunkowy)
- Filtry BubbleSelect: `w-[160px]` (chyba że dłuższa treść)

---

## 7. PAGINACJA

```
<div class="flex items-center justify-between text-[12px] text-muted-foreground">
  <span>Strona {page} z {totalPages}</span>
  <div class="flex gap-1">
    <button class="btn-bubble btn-secondary-bubble px-3 py-1.5 text-[11px]"><ChevronLeft /></button>
    <button class="btn-bubble btn-secondary-bubble px-3 py-1.5 text-[11px]"><ChevronRight /></button>
  </div>
</div>
```

---

## 8. RESPONSYWNOŚĆ

### Zasada: desktop-first, mobile acceptable

| Breakpoint | Zachowanie |
|-----------|-----------|
| Desktop (lg+) | Pełna tabela, wszystkie kolumny, sidebar otwarty |
| Tablet (md) | Ukryj mniej ważne kolumny (`hidden md:table-cell`), sidebar collapsed |
| Mobile (sm) | Grid 1 kolumna, taby scrollowalne, sidebar hamburger |

### Kolumny tabeli — co chować:
- ZAWSZE widoczne: ID, Nazwa/Klient, Status, Akcje
- `hidden md:table-cell`: Kontakt, Email
- `hidden lg:table-cell`: Segment, Liczniki (rez/oferty)
- `hidden xl:table-cell`: Aktywność, Data

### Gridy formularza:
- `grid grid-cols-1 sm:grid-cols-2 gap-4` — domyślny
- `grid grid-cols-1 sm:grid-cols-3 gap-4` — Kod/Miasto/Kraj

---

## 9. ANIMACJE

| Animacja | Klasa | Użycie |
|---------|-------|--------|
| Wejście strony | `fade-in-up` | Na głównym `<div>` strony |
| Hover karty | `transition-all duration-200` | Na `.bubble` |
| Hover wiersza | `transition-colors` | Na `<tr>` w tabeli |
| SlidePanel | `slide-in` | Wbudowane |
| Dropdown | `fade-in-scale` | W BubbleSelect |
| Stagger | `.stagger > *` | Lista kart z opóźnieniem |

---

## 10. EMPTY STATES

```
<div class="py-16 text-center">
  <Icon class="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
  <p class="text-[14px] font-medium text-muted-foreground">Brak danych</p>
  <p class="text-[12px] text-muted-foreground/60 mt-1">Opis co zrobić</p>
</div>
```

---

## 11. PLACEHOLDER MODUŁU

```
<div class="bubble px-5 py-8 text-center text-muted-foreground text-[13px]">
  <Icon class="h-8 w-8 mx-auto mb-3 text-muted-foreground/30" />
  Tekst placeholdera
</div>
```

---

## 12. NAWIGACJA (SIDEBAR)

### Logo
- Tekst: "Zielone Wzgórza" (15px bold) + "PANEL ADMINISTRACYJNY" (10px uppercase semibold muted)
- Zwinięty: "ZW" (14px bold primary)
- BEZ ikonki — czysto tekstowe

### Desktop (expanded)
- Każdy item: ikona w boxie `h-8 w-8 rounded-xl bg-muted` + tekst `text-[13px] font-semibold`
- Aktywny: `bg-primary/8`, ikona `bg-primary/15 text-primary`, pasek `w-[3px] h-5 bg-primary` po lewej
- Tekst: `text-foreground/80` (NIE text-muted-foreground — za jasne)
- Sub-items: accordion z pionową linią `borderLeft: 2px solid border`, mini ikona `h-6 w-6 rounded-lg`
- Grupy oddzielone `border-t border-border/50` z `mt-5 pt-5`

### Mobile
- Każdy item to **pełna karta** z `border: 2px solid border`, `rounded-2xl`, `px-4 py-3.5`, ikona `h-10 w-10`
- Items z children: klik otwiera **pełnoekranowy sub-page** (`fixed inset-0 z-[60]`, animacja `slideFromRight`)
- Sub-page: przycisk wstecz (ArrowLeft w bubble 2px border) + duże karty per sub-item (`rounded-[20px]`, ikona `h-12 w-12`)
- Scroll: `overflow-y-auto` na nav, spacer `h-8` na dole

### Collapsed (desktop)
- Ikona only: `h-10 w-10 rounded-2xl`, aktywny: `bg-primary/10 text-primary`
- Logo: "ZW"

---

## 12.1. FORM STATES — STANDARD

### Hook: `useFormSubmit()`
```
import { useFormSubmit, apiCall } from "@/hooks/use-form-submit";

const { saving, error, submit, retry, clearError } = useFormSubmit();

// W onClick przycisku:
await submit({
  action: () => apiCall("/api/seasons", { method: "POST", body: JSON.stringify(form) }),
  successMessage: "Sezon dodany",
  onSuccess: () => { loadData(); setPanelOpen(false); },
  resetAfter: true,
  onReset: () => setForm(initialForm),
});
```

### Obowiązkowe zachowania (wymuszane przez hook):
1. **Loading** — `saving` blokuje przycisk (`disabled={saving}`), ikona zamienia się na `Loader2 animate-spin`
2. **Double-submit prevention** — lock ref blokuje ponowne kliknięcie
3. **Success** — toast `success()` z wiadomością, wywołanie `onSuccess` callback
4. **Error** — toast `error()` z komunikatem z API (lub fallback), `error` state dostępny w komponencie
5. **Retry** — `retry()` powtarza ostatnią nieudaną akcję
6. **Reset** — opcjonalne czyszczenie formularza po sukcesie

### Helper: `apiCall(url, options)`
- Wrapper na `fetch` z automatycznym `Content-Type: application/json`
- Wyciąga error message z response JSON (`data.error` lub `data.message`)
- Rzuca `Error` z czytelnym komunikatem przy !res.ok

### Przycisk submit — WZORZEC:
```
<button
  onClick={handleSave}
  disabled={saving || !formValid}
  class="btn-bubble btn-primary-bubble px-5 py-2.5 text-[13px] disabled:opacity-50"
>
  {saving ? <Loader2 class="h-4 w-4 animate-spin" /> : <Check class="h-4 w-4" />}
  {saving ? "Zapisywanie..." : "Zapisz"}
</button>
```

### Error state na inputach (TODO — przygotować):
- Klasa: `input-bubble-error` — `border-color: destructive`, `box-shadow: 0 0 0 3px hsl(destructive / 0.1)`
- Komunikat pod polem: `text-[11px] text-destructive mt-1`
- Walidacja: po submit, mapuj błędy z API na pola formularza

### Zasady:
- NIGDY nie rób ręcznego `setSaving(true)` / `setSaving(false)` — ZAWSZE przez `useFormSubmit`
- NIGDY nie łap błędów cicho (`catch (e) { console.error(e) }`) — ZAWSZE pokaż toast
- NIGDY nie rób `fetch` bezpośrednio w komponentach — ZAWSZE przez `apiCall()`
- Przycisk ZAWSZE `disabled` gdy `saving` lub formularz niewalidny
- Po sukcesie ZAWSZE toast + odświeżenie danych

---

## 12.2. LOADING PATTERN

### Pierwszy load strony
- Skeleton: `if (initialLoading) return <ModuleSkeleton />;`
- Skeleton NIE ma animacji wejścia (żadnego fade-in-up/stagger)

### Filtrowanie / wyszukiwanie (dane już były załadowane)
- NIE zamieniać na skeleton (niszczy input focus)
- Zamiast tego: delikatny overlay na tabeli `bg-card/60 z-10` z małym spinnerem
- Rozdzielić stan: `initialLoading` (skeleton) vs `filtering` (overlay)

---

## 13. POLSKIE ZNAKI

NIGDY nie używaj Unicode escapes (\u00f3, \u0105 itp.) w stringach JSX.
ZAWSZE pisz polskie znaki bezpośrednio: ą, ć, ę, ł, ń, ó, ś, ź, ż, Ą, Ć, Ę, Ł, Ń, Ó, Ś, Ź, Ż.

Wyjątek: jeśli sed mógłby uszkodzić znaki — wtedy dostarcz plik jako pełny plik (create_file), nigdy sed na polskich znakach.

---

## 14. ZNANE ROZBIEŻNOŚCI DO NAPRAWIENIA

| Problem | Gdzie | Co powinno być |
|---------|-------|----------------|
| Input h-10 zamiast h-11 | client-form-page.tsx (29 miejsc) | h-11 |
| Search h-10 zamiast h-11 | clients-content.tsx | h-11 |
| Table px-3 zamiast px-4 | clients-content.tsx | px-3 py-3 OK dla listy (gęsta) |
| space-y-4 zamiast space-y-5 | client-form-page.tsx (kilka sekcji) | space-y-5 |

---

## 15. KONWENCJE KODU

- `"use client"` na każdym interaktywnym komponencie
- Eksport: `export function NazwaKomponentu()` (named export)
- Strona: `export default function Page()` + `export const dynamic = "force-dynamic"`
- Router push: BEZ `/admin` prefix (basePath dodaje automatycznie)
- Klasy CSS: bezpośrednio w className, nie w osobnych plikach CSS (oprócz globals.css)
- Ikony: lucide-react, rozmiar `h-4 w-4` (standard), `h-3.5 w-3.5` (mały), `h-5 w-5` (duży)

---

## 16. TODO — DO WDROŻENIA W PRZYSZŁOŚCI

### Priorytet wysoki (następne sesje):
- [x] Skeleton loader — shimmer na listach (ResourcesSkeleton, PricingSkeleton, ClientsSkeleton)
- [ ] **MUST** Status system — globalny plik statusów (NEW/CONFIRMED/PAID/CANCELLED itp.) dla wszystkich modułów
- [x] Permissions — RBAC (OWNER/MANAGER/RECEPTION) wdrożone w D0. Brakuje: UI hide per role.
- [x] Toast/notification system — `useToast()` hook + `<ToastProvider>` (success/error/info/warning)
- [~] Error state formularzy — hook `useFormSubmit` gotowy, brakuje `input-bubble-error` CSS class + field-level mapping
- [x] SectionCard — rozwijalne sekcje z animacją, overflow fix (§26)

### Priorytet średni (refactor):
- [ ] Komponenty React: `<Button variant="primary">`, `<Input label="">`, `<FormField>`
- [ ] Tokeny spacingu w tailwind.config.ts
- [ ] Zod request DTO na API routes (type safety)

### Priorytet niski (monitoring):
- [ ] Test border 1.5px na Windows — ewentualnie zmiana na 1px/2px
- [ ] Accessibility audit (focus states, aria labels)
- [ ] ESLint config w repo (.eslintrc) dla deterministycznego CI

---

## 16.1. WZORCE DODANE W MARCU 2026 (Kalendarz + Blokady)

### Dropdown menu (3 kropki / MoreVertical)
```
<div className="relative">
  <button className="btn-icon-bubble h-9 w-9">
    <MoreVertical className="h-4 w-4" />
  </button>
  {open && (
    <div className="absolute right-0 top-full mt-2 bg-card border-2 border-border rounded-2xl z-30 min-w-[200px] py-2 px-2 fade-in-scale"
         style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
      <button className="w-full text-left px-3 py-2.5 hover:bg-muted/50 transition-colors flex items-center gap-3 text-[13px] rounded-xl">
        <Icon className="h-4 w-4 text-primary" /> Akcja
      </button>
    </div>
  )}
</div>
```
Zasady:
- `border-2 rounded-2xl` (bubble style)
- Itemy: `rounded-xl hover:bg-muted/50`
- Shadow: `0 4px 24px rgba(0,0,0,0.08)`
- Zamykanie: click outside (useRef + mousedown listener)
- Animacja: `fade-in-scale`

### Multi-resource badge (Kalendarz Timeline)
Rezerwacja/oferta obejmująca wiele zasobów:
- Na bloku: `<Home className="h-2.5 w-2.5" /> 5x` (text-[9px] font-bold opacity-60)
- Hover na jednym bloku → `ring-2 ring-foreground/30` na WSZYSTKICH powiązanych
- Tooltip: "5 zasobów w rezerwacji"
- Grupowanie po `bookingId` lub `offerId`

### Sekcja klienta w szczegółach rezerwacji
- Avatar: `h-12 w-12 rounded-2xl bg-primary/10`
- Nazwa: `text-[16px] font-bold` — dominuje wizualnie
- Dane kontaktowe: osobne wiersze, klikalne (`mailto:`, `tel:`)
- Każdy kontakt: ikonka (8x8 rounded-lg bg-muted) + label (text-[11px]) + wartość (text-[13px] text-primary)
- Hover na kontakcie: ikonka zmienia bg na `primary/10`, tekst na `primary`

### Tooltip — SYSTEM GLOBALNY (Floating UI)

Jedyny dozwolony system tooltipów w panelu. Oparty o `@floating-ui/react`.
Natywny atrybut `title=""` jest **ZAKAZANY** na elementach HTML w panelu admina.
`title` jako prop komponentu React (SectionCard, SlidePanel, ConfirmDialog) — bez zmian.

**Komponent:** `src/components/ui/tooltip.tsx`

**Użycie:**
```tsx
<Tooltip content="Edytuj">
  <button className="btn-icon-bubble ..."><Pencil /></button>
</Tooltip>
```

**Kiedy obowiązkowy:**
- Icon-only buttons (ołówek, kosz, oko, toggle, strzałki nawigacji)
- Akcje w tabelach (kolumna Akcje)
- Przyciski w toolbarach (ikona bez tekstu)
- Statusy/badge'e (!, ⚠, $, ✓) jeśli znaczenie nieoczywiste

**Kiedy NIE stosować:**
- Przyciski z jawnym tekstem ("Zapisz", "Anuluj", "Nowy dodatek")
- Elementy z opisem obok (label + input)
- Nie spamujemy na wszystkim — tylko tam, gdzie ikona jest jedynym nośnikiem znaczenia

**Mechanika:**
- Wrapper: `<span style="display: inline-flex">` (nie cloneElement)
- Portal: `FloatingPortal` do `document.body`
- Pozycjonowanie: `offset(8)` + `flip({ padding: 8 })` + `shift({ padding: 8 })`
- Arrow: `FloatingArrow` wewnątrz wewnętrznego div (nie na tym samym co `floatingStyles`)
- Animacja: `tooltipIn 0.15s cubic-bezier(0.16, 1, 0.3, 1)` — fade + scale(0.96→1) + translateY(3px→0)
- Delay: 180ms open, 0ms close
- Zamykanie: hover-leave, blur, Escape

**Styl:**
- Tło: `hsl(220, 15%, 13%)` (ciemne)
- Tekst: `hsl(220, 10%, 95%)` (jasny)
- borderRadius: 12 (bubble)
- padding: 7px 14px
- fontSize: 12, fontWeight: 500
- Cień: dwuwarstwowy (depth + edge)
- Arrow: ten sam kolor co tło, width 12, height 6

**Architektura (dwa divy):**
- Zewnętrzny div: `ref={refs.setFloating}`, `floatingStyles` (pozycjonowanie Floating UI)
- Wewnętrzny div: tło, padding, animacja, `position: relative` (dla arrow)
- NIGDY nie łączyć animacji `transform` z `floatingStyles` na tym samym elemencie

**Props:**
| Prop | Typ | Default | Opis |
|------|-----|---------|------|
| content | ReactNode | — | Treść tooltipa |
| children | ReactNode | — | Trigger (button, span) |
| side | "top" / "right" / "bottom" / "left" | "top" | Preferowana strona |
| delay | number | 180 | Delay otwarcia (ms) |
| disabled | boolean | false | Wyłącza tooltip |
| maxWidth | number | 280 | Max szerokość (px) |

**Czego NIE robimy:**
- ❌ `title=""` na elementach HTML — twardy zakaz
- ❌ Osobne lokalne implementacje tooltipów w modułach
- ❌ `cloneElement` + ref forwarding (zawodne)
- ❌ Animacja `transform` na elemencie z `floatingStyles` (nadpisuje pozycjonowanie)
- ❌ Tooltip bez portalu (ucina się w overflow kontenerach)

### Drag & drop reorder — WZORZEC GLOBALNY (ADR-17)

Uniwersalny wzorzec przeciągania elementów w panelu. Stosowany w: Zasoby (karty),
Amenities (lista + kategorie), i każdy przyszły moduł z sortowaniem.

**Zasada: zawsze aktywny, tylko za uchwyt.**

Bez przycisku "Sortuj". Użytkownik widzi uchwyt `GripVertical`, chwyta, przeciąga.
Klik na kartę/wiersz = otwiera panel edycji (SlidePanel). Zero konfliktu gestów.

**Separacja gestów:**

```
// Karta (NIE jest draggable — jest drop target + clickable)
<div
  data-item-card={item.id}
  onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move";
    if (draggedId && draggedId !== item.id) setDragOverId(item.id); }}
  onDrop={(e) => handleDrop(e, item.id)}
  onClick={() => openEdit(item)}
  className={cn("bubble-interactive ...",
    isDragOver && "ring-2 ring-primary ring-offset-2"
  )}
>
  {/* Uchwyt — JEDYNY draggable element */}
  <div
    draggable
    onDragStart={(e) => {
      e.stopPropagation();
      const card = e.currentTarget.closest("[data-item-card]");
      if (card instanceof HTMLElement) e.dataTransfer.setDragImage(card, 20, 20);
      e.dataTransfer.effectAllowed = "move";
      setDraggedId(item.id);
    }}
    onDragEnd={handleDragEnd}
    onClick={(e) => e.stopPropagation()}
    className="cursor-grab active:cursor-grabbing text-muted-foreground/30
      hover:text-muted-foreground shrink-0 p-0.5 -m-0.5"
  >
    <GripVertical className="h-4 w-4" />
  </div>
  {/* ...reszta karty... */}
</div>
```

**Wizualne feedback:**

| Element | Klasa | Uwagi |
|---------|-------|-------|
| Uchwyt idle | `text-muted-foreground/30` | Subtelny, widoczny na hover |
| Uchwyt hover | `hover:text-muted-foreground` | Ciemniejszy — sygnał "mogę chwycić" |
| Uchwyt drag | `active:cursor-grabbing` | Kursor zmienia się |
| Drop target | `ring-2 ring-primary ring-offset-2` | Niebieski ring — "tu upuść" |
| Drag image | `setDragImage(card, 20, 20)` | Ghost = cała karta, nie grip |
| Źródło (lista) | `opacity-30 scale-95` | Efekt "odeszło" — działa w flexbox/lista |
| Źródło (grid) | brak efektu | CSS Grid nie reaguje na scale-95 (known limitation) |

**Backend pattern (reorder endpoint):**

```
PATCH /api/{module}/reorder
Body: { order: [{ id: "...", position: 0 }, ...] }
```

Walidacja (7 kroków): auth MANAGER+, array niepusty, no duplicate IDs,
id+position format, all exist in DB, same scope (propertyId / categoryId),
**completeness check** (payload count === DB count). Transakcja all-or-nothing.
Payload = pełny stan kolejności, nadpisuje poprzedni porządek (ADR-18).

**Optimistic update + rollback:**
1. Splice local array → natychmiastowy update UI
2. `handleDragEnd()` → czyści visual states
3. `apiFetch("/api/.../reorder")` w background
4. Sukces → cisza (UI już zaktualizowane)
5. Błąd → `toastError()` + `loadData()` (pełny rollback z serwera)

**Hint UX:** Pod toolbarem na stronach z reorderem:
```
<p className="text-[11px] text-muted-foreground/60 flex items-center gap-1.5">
  <Info className="h-3 w-3 shrink-0" />
  Kliknij element, aby go edytować. Przeciągnij za uchwyt, aby zmienić kolejność.
</p>
```

**Czego NIE robimy:**
- ❌ Przycisk "Sortuj" włączający tryb — zawsze aktywne
- ❌ `draggable` na całej karcie — tylko na GripVertical
- ❌ Partial reorder (podzbiór listy) — zawsze pełna lista
- ❌ DOM manipulacja do efektów (requestAnimationFrame) — React state only
- ❌ DnD biblioteki zewnętrzne — natywny HTML5 Drag and Drop API

### Block creator (Kalendarz → Nowa blokada)
- Flow: daty → dostępność → zasoby
- Daty min: dzisiaj (Od), data Od (Do)
- Po wybraniu dat: API sprawdza timeline, pokazuje dostępne/zajęte
- Zajęte: ikonka kłódki + "Zajęty" + opacity-40 + cursor-not-allowed
- Multi-select: checkboxy + "Zaznacz dostępne"
- Zapis: jedna transakcja, all-or-nothing
- Po zapisie: kalendarz nawiguje do daty blokady

---

## 17. NAGŁÓWKI SEKCJI — JEDNA ZASADA DLA CAŁEGO PROJEKTU

### Wzorzec (źródło prawdy: UnifiedPanel / Edytuj rezerwację)

```
<h3 className="flex items-center gap-2 text-[14px] font-semibold">
  <Icon className="h-4 w-4 text-primary" />
  Tytuł sekcji
</h3>
```

**Zasady:**
- **Rozmiar:** `text-[14px] font-semibold` — czytelny, wyrazisty
- **Ikona:** `h-4 w-4 text-primary` — bezpośrednio kolorowa, BEZ tła (`bg-primary/10` kwadrat)
- **Case:** Normalny — NIE `uppercase`, NIE `tracking-wider`
- **Odstęp:** `mb-3` pod nagłówkiem do treści sekcji
- **Użycie:** Każdy SlidePanel, każda sekcja formularza, każda karta — WSZĘDZIE ten sam wzorzec

### Gdzie stosujemy

| Komponent | Sekcje |
|-----------|--------|
| UnifiedPanel (Edytuj rezerwację) | 📅 Termin pobytu, 👤 Klient, 🏠 Zasoby, 📦 Globalne opłaty, 📄 Szczegóły |
| CalendarDetailPanel (Slide panel) | 👤 Klient, 🚪 Zameldowanie, 📅 Termin, 🏠 Zasoby, ✨ Sprzątanie, 💲 Rozliczenia, 📄 Pozostałe, ℹ️ Informacje |
| PaymentPanel (Rozliczenia) | 📊 Podsumowanie, 🕐 Historia płatności |
| ReservationDetail (Karta) | ℹ️ Informacje, 💲 Rozliczenia |

### Czego NIE robimy

- ❌ `uppercase tracking-wider` — NIGDY na nagłówkach sekcji
- ❌ `bg-primary/10` kwadrat wokół ikony — nie w nagłówkach sekcji slide paneli i formularzy
- ❌ `text-[11px]`, `text-[12px]`, `text-[13px]` na nagłówkach sekcji — ZAWSZE `text-[14px]`
- ❌ `text-muted-foreground` na nagłówkach sekcji — tekst jest domyślny (ciemny) z `font-semibold`

### Wyjątek: subheadery (podgrupy wewnątrz sekcji)

Podtytuły wewnątrz sekcji (np. "Oczekujące (3)", "Potwierdzone (5)") to NIE nagłówki sekcji:

```
<span className="text-[12px] font-semibold text-muted-foreground">Oczekujące</span>
```

Te są celowo mniejsze i szare — subtelne, BEZ ikony.

### Wyjątek: SectionCard w kliencie (accordion z `bg-primary/10`)

`SectionCard` na stronie klienta to accordion z bubble border + ikona w kwadracie:

```
<div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center">
  <Icon className="h-4 w-4 text-primary" />
</div>
<h3 className="text-[14px] font-semibold">Tytuł</h3>
```

To jest jedyny wzorzec, gdzie ikona ma tło — bo to klikalna karta (accordion trigger).
W zwykłych sekcjach (nie-accordion) ikona jest BEZ tła.

---

## 18. NAWIGACJA WSTECZ W SLIDEPANEL

### Pozycja: pod title bar, w content area (nie w tytule)

```
<SlidePanel open={open} onClose={onClose} title="Tytuł">
  {/* Back button — PIERWSZY element w content, pod title bar + separator */}
  <div className="mb-5">
    <button onClick={onBack} className="btn-icon-bubble h-10 w-10">
      <ArrowLeft className="h-4 w-4" />
    </button>
  </div>
  {/* ... reszta contentu ... */}
</SlidePanel>
```

**Zasady:**
- Klasa: `btn-icon-bubble h-10 w-10` — identyczna jak na stronie Profil klienta
- Border-radius: `rounded-2xl` (16px, z klasy `.btn-icon-bubble`) — NIE `rounded-full`
- Pozycja: pod tytułem i linią oddzielającą, NIE w samym tytule
- Margin: `mb-5` (20px) pod strzałką do contentu
- Ikona: `<ArrowLeft className="h-4 w-4" />`

---

## 19. SLIDEPANEL — ZASADY RENDEROWANIA

### Nigdy nie renderuj warunkowo

```
// ❌ ŹLE — React odmontowuje natychmiast, brak animacji zamykania
{panelOpen && <SlidePanel open={panelOpen} onClose={...} />}

// ✅ DOBRZE — SlidePanel odgrywa animację wjazdu i wyjazdu
<SlidePanel open={panelOpen} onClose={...} />
```

SlidePanel wewnętrznie obsługuje `visible` state — gdy `open` zmienia się
z `true` na `false`, odgrywa animację wyjazdu (translateX 250ms) zanim
się odmontuje.

### Stack paneli (3 poziomy)

```
Level 1: CalendarDetailPanel (szczegóły rezerwacji)
  └─ Level 2: PaymentPanel (rozliczenia) — always rendered
       └─ Level 3: PaymentFormPanel (nowa operacja) — always rendered
```

Klik w overlay zamyka bieżący panel. Strzałka ← cofa o jeden poziom.

---

## 20. TOGGLE SWITCH (zamiast checkbox)

NIGDY nie używaj natywnych `<input type="checkbox">` w formularzach.
Zawsze stosuj toggle switch:

```
<button
  type="button"
  onClick={() => setValue(!value)}
  className="flex items-center gap-3 w-full text-left"
>
  <span className={cn(
    "relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0",
    value ? "bg-primary" : "bg-muted-foreground/20"
  )}>
    <span className={cn(
      "inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform",
      value ? "translate-x-6" : "translate-x-1"
    )} />
  </span>
  <span className="text-[12px] text-muted-foreground">Opis opcji</span>
</button>
```


## 21. BUBBLE-INTERACTIVE HOVER — ZASADA GLOBALNA

`bubble-interactive:hover` zmienia **tylko** `border-color` na `hsl(var(--primary))`.

**Zakazane:** `transform: translateY(-1px)` lub jakiekolwiek przesunięcie/podniesienie karty na hover.

Dotyczy globalnie: Zasoby, Użytkownicy, i każdy przyszły moduł z kartami.

```css
.bubble-interactive:hover {
  border-color: hsl(var(--primary));
  /* BEZ transform, BEZ shadow change, BEZ scale */
}
```


## 22. AVATAR UPLOAD — WZORZEC

Avatar w SlidePanel edycji użytkownika:
- Rozmiar: `h-16 w-16 rounded-2xl`
- Zdjęcie: `object-cover` | Brak: inicjały w `bg-primary/10 text-primary text-[20px] font-bold`
- Hover overlay: `bg-black/40` z ikoną Camera (white, opacity transition)
- Linki: "Zmień zdjęcie" (`text-primary hover:underline`) + "Usuń" (`text-destructive hover:underline`)
- Info: `text-[10px] text-muted-foreground` — "JPG, PNG lub WebP, max 5 MB"

Avatar na karcie użytkownika:
- Rozmiar: `h-12 w-12 rounded-2xl`
- Zdjęcie: `object-cover` | Brak: inicjały w `bg-primary/10 text-primary text-[15px] font-bold`

Storage: `src/lib/avatar-storage.ts` — interfejs AvatarStorageProvider (save/delete/getStream).
Provider: LocalDiskStorage w `data/avatars/{userId}/{randomId}.ext`. Gotowe na S3/R2.
Klucz generowany serwerowo. Streaming przez createReadStream. Cache: immutable.


## 23. CONFIRM DIALOG — WZORZEC

Modal potwierdzenia (dezaktywacja, usuwanie):
```
fixed inset-0 z-50 bg-black/50 flex items-center justify-center
  bubble mx-4 max-w-[400px] p-6
    h3 text-[16px] font-bold mb-2
    p  text-[13px] text-muted-foreground mb-5
    div flex gap-3 justify-end
      btn-bubble btn-secondary-bubble — Anuluj
      btn-bubble btn-danger-bubble — Akcja destrukcyjna
```

Inline ConfirmDialog (wewnątrz SlidePanel, np. reset hasła):
```
rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3.5
  p text-[13px] font-semibold mb-1 — pytanie
  p text-[11px] text-muted-foreground mb-3 — ostrzeżenie
  flex gap-3 — przyciski (btn-danger-bubble + btn-secondary-bubble)
```


## 24. GODZINY OPERACYJNE — WZORZEC RESOLVING

Hierarchia: `ResourceCategory.checkInTimeOverride` → fallback → `CompanySettings.checkInTime`.

**Plik:** `src/lib/operational-times.ts`
- `resolveOperationalTimes(tx, categoryId)` → `{ checkInTime, checkOutTime }`
- `combineDateAndTime(dateStr, timeStr)` → UTC Date (DST-safe, `date-fns-tz`)
- `isValidTimeFormat(time)` → boolean (regex `^\d{2}:\d{2}$`, 0–23/0–59, null OK)

**ACCOMMODATION items:** `startAt = date + resolvedCheckInTime`, `endAt = date + resolvedCheckOutTime`
**TIME_SLOT / QUANTITY_TIME:** bez resolving (raw checkIn/checkOut)

**UI wzorzec (config tab):**
SectionCard "Godziny per kategoria" — lista ACCOMMODATION kategorii z BubbleSelect per kategoria.
Pierwsza opcja w BubbleSelect: `{ value: "", label: "Globalne (HH:MM)" }` = null w DB = dziedziczenie.
Auto-save przy zmianie (optimistic + PATCH `/api/resource-categories/[id]`).

**WAŻNE:** Nigdy `new Date().setHours()` dla Warsaw time. Zawsze `fromZonedTime()` z `date-fns-tz`.


## 25. PUBLICZNE API — WZORZEC (E1)

Endpointy w `/api/public/*` — bez auth, z rate limiterem.

**Rate limiter:** `src/lib/rate-limiter.ts` — in-memory, per IP, sliding window.
- availability: 60 req/min
- quote-preview: 30 req/min
- quote: 10 req/min
Response 429 + `Retry-After` + `X-RateLimit-*` headers.

**Error model:** Każdy response z `errors[]` + `warnings[]`. Errors blokują zapis (np. Quote nie trafia do DB). Warnings informacyjne (np. brak season label).

**Reguła cenowa:** Brak ceny dla ACCOMMODATION/TIME_SLOT = error. Brak ceny dla QUANTITY_TIME = warning. Zero-price tylko jeśli świadomie w danych (PriceEntry z priceMinor=0).

**Quote anti-enumeration:** `quoteId` (cuid) + `quoteSecret` (32 hex) — oba wymagane. Brak PII w response.


## 26. SECTIONCARD — WZORZEC ROZWIJALNYCH SEKCJI (B2)

Komponent: `<SectionCard>` (`src/components/ui/section-card.tsx`).
Rozwijalna belka z ikoną, tytułem, opisem i treścią.

```
<SectionCard
  title="Tytuł sekcji"
  description="Opcjonalny opis."
  icon={IconComponent}
  defaultOpen={false}
>
  {/* zawartość sekcji */}
</SectionCard>
```

**Zasady:**
- Wrapper: `.bubble` z `overflow: visible` (dla dropdownów)
- Trigger: `w-full flex items-center gap-3 px-5 py-4 hover:bg-muted/20`
- Ikona: `h-8 w-8 rounded-xl bg-primary/10` z `h-4 w-4 text-primary`
  (jedyny wzorzec gdzie ikona ma tło — bo to klikalna karta accordion)
- Tytuł: `text-[14px] font-semibold`
- Opis: `text-[11px] text-muted-foreground`
- Chevron: `ChevronDown` (open) / `ChevronRight` (closed)
- Animacja: CSS Grid (`section-collapse` / `section-open` w globals.css)
- Overflow fix: delayed `overflow: visible` po 320ms od otwarcia
  (pozwala BubbleSelect/dropdown nie być ucinanym)
- **ZAWSZE** renderuj children w DOM (nigdy `{open && ...}`)
- Props opcjonalny `action` — element renderowany na belce obok chevron

**Kiedy używać:**
- Panel zasobu (6 sekcji)
- Formularz klienta (accordion sekcje)
- Każde miejsce gdzie formularz ma logiczne grupy pól

**Czym SectionCard NIE jest:**
- Nie jest nagłówkiem sekcji (§17) — to jest klikalna karta z borderem
- Nie jest zwykłym `.bubble` — ma animację open/close


## 27. PANEL ZASOBU — DOCELOWY WZORZEC INLINE EDYCJI (B2)

Panel zasobu (SlidePanel "Właściwości zasobu") to wzorzec dla
enterprise inline editing. Brak osobnego trybu edycji.

**panelMode: `"create" | "view"`** — dwa tryby, nie trzy.
- Create: prosty formularz (nazwa + kategoria), POST, zamknij.
- View: hero + 6 SectionCards, każda edytowalna inline.

**Hero zasobu:**
- Bez bordera (`.bubble`) — wyróżnia się brakiem ramki
- Tytuł: `text-xl font-bold tracking-tight` (DS §3 h2) + UnitBadge
- Badges: status (kolorowy) + widoczność w widgecie (niebieski/czerwony)
- Stats grid 2×2: ikona w `bg-background` boxie + liczba `text-[18px] font-bold`
  + etykieta w jednej linii (`flex items-baseline`)

**7 sekcji SectionCard (wszystkie `defaultOpen={false}`):**
1. Ustawienia zasobu → PATCH /resources/[id]
2. Treści → PATCH /resources/[id]
3. Dane techniczne → PATCH /resources/[id]
4. Łóżka → PUT /resources/[id]/beds
5. Zdjęcia → images endpoints (B1)
6. Warianty sprzedażowe → variants endpoints
7. Udogodnienia → PUT /resources/[id]/amenities (B3)

**Izolacja stref zapisu:**
- Każda sekcja: własny useState, własny save button, własny toast
- Żadna sekcja nie nadpisuje pól innej sekcji
- formData w create zawiera TYLKO name + categoryId

**Zasady formularzy w sekcjach:**
- Input: `input-bubble h-11` (§5)
- Textarea: `input-bubble min-h-[80px] resize-y` (§5)
- Spacing: `space-y-5` (§4)
- Label: `text-[12px] font-semibold text-muted-foreground mb-1.5`
  z ikoną `h-3.5 w-3.5` (§3)
- Grid: `grid grid-cols-1 sm:grid-cols-2 gap-4` (§8)
- Button: `btn-bubble btn-primary-bubble px-5 py-2.5 text-[13px]` (§5)
- Submit text: `saving ? "Zapisywanie..." : "Zapisz ..."` (§12.1)
- Dropdown: BubbleSelect (portal, §5) — NIGDY natywny `<select>`
- Toggle: wzorzec z §20 — NIGDY checkbox
- Inline row delete: `h-7 w-7 rounded-lg` + `hover:bg-destructive/10`

## 28. FLOATING UI — STANDARD POZYCJONOWANIA PANELU (ADR-20)

**Jedyny dozwolony system** pozycjonowania dropdownów, pickerów i popupów
w panelu. Oparty o `@floating-ui/react` z `strategy: 'fixed'`.

**Hook:** `src/hooks/use-floating-dropdown.ts`

```tsx
const { refs, floatingStyles, getReferenceProps, getFloatingProps, open, setOpen } =
  useFloatingDropdown({
    placement: 'bottom-start',  // default
    offsetPx: 6,                // default
    fixedWidth: 296,            // opcjonalnie
    matchWidth: true,           // opcjonalnie (szerokość triggera)
    interaction: 'click',       // default, lub 'hover'
  });
```

**Controlled mode** (gdy komponent ma dodatkową logikę przy otwarciu):
```tsx
useFloatingDropdown({
  onOpenChange: (next) => {
    if (next) prepareState(); // logika przy otwarciu
  },
});
```

**Trigger:** `ref={refs.setReference} {...getReferenceProps()}`
**Dropdown:** `<FloatingPortal><div ref={refs.setFloating} style={floatingStyles} {...getFloatingProps()}>...</div></FloatingPortal>`

**Co hook załatwia (zero tego w komponentach):**
- `useFloating({ strategy: 'fixed', whileElementsMounted: autoUpdate })`
- `offset` + `flip({ padding: 8 })` + `shift({ padding: 8 })`
- `size()` (matchWidth / fixedWidth / maxHeight)
- `useClick` lub `useHover` + `useFocus`
- `useDismiss` (Escape + click outside)
- z-index z `FloatingZContext` (domyślnie Z.DROPDOWN, w SlidePanel → Z.PANEL_DROPDOWN)

**SKALA Z-INDEX — jedyne źródło prawdy: `src/lib/z-layers.ts`**

| Warstwa | Token | z-index | Uwagi |
|---------|-------|---------|-------|
| Content | — | 0–10 | Calendar entries, sticky headers lokalne |
| Calendar overlays | — | 80, 90 | Cursor follower, action bubble (wyjątki) |
| Floating dropdowns | Z.DROPDOWN | 100 | Page-level: selecty, datepickery, tooltips |
| Topbar + sidebar | Z.TOPBAR | 200 | Sticky topbar, desktop sidebar |
| Topbar user menu | Z.TOPBAR_MENU | 210 | Dropdown profilu w topbarze |
| Mobile sidebar | Z.SIDEBAR_MOBILE | 250 | Full-screen overlay |
| SlidePanel | Z.SLIDE_PANEL | 300 | Overlay + panel |
| Panel dropdowns | Z.PANEL_DROPDOWN | 400 | Dropdowny WEWNĄTRZ SlidePanel |
| ConfirmDialog | Z.CONFIRM | 500 | Potwierdzenia, modalne dialogi |
| Toast | Z.TOAST | 600 | Notyfikacje — zawsze widoczne |
| Loading | Z.LOADING | 700 | App-wide loading overlay |

**Kluczowy mechanizm — FloatingZContext:**
- SlidePanel owija children w `<FloatingZContext.Provider value={Z.PANEL_DROPDOWN}>`
- Każdy dropdown wewnątrz automatycznie dostaje z-index 400 (> panel 300)
- Na poziomie strony domyślnie 100 (< topbar 200)
- Zero zmian w komponentach — Context robi to za nas
- Hook czyta z kontekstu: `const zIndex = useFloatingZ()`
- Standalone komponenty (BubbleSelect, Tooltip) też czytają `useFloatingZ()`

**ZAKAZ:**
- ❌ Hardcoded `zIndex: 99999` — NIGDY WIĘCEJ
- ❌ `z-[9999]`, `z-[99999]` w Tailwind — zastąpione tokenami
- ❌ Nowe warstwy bez wpisu w z-layers.ts

**Zachowanie (standard jak Booking.com):**
- Scroll strony przy otwartym dropdownie → element SIEDZI pod triggerem
- Nie jedzie ze scrollem
- Nie ucina się w overflow kontenerach (portal)
- Flip na górę jeśli nie ma miejsca pod spodem
- Dismiss na Escape i klik poza

**Komponenty na hooku:**
- BubbleDatePicker (fixedWidth: 296)
- BubbleRangePicker (fixedWidth: 320)
- BubbleColorPicker (fixedWidth: 280)

**Komponenty na Floating UI bezpośrednio:**
- Tooltip (useHover + arrow — dedykowany komponent §16.1)
- BubbleSelect (matchWidth)
- SearchableSelect (matchWidth)
- CalendarEntry tooltip (useHover + arrow, placement: 'top')

**Udokumentowane wyjątki (NIE na Floating UI):**

Floating UI jest obowiązkowy dla overlays zakotwiczonych do elementu DOM.
Coordinate-anchored overlays (pozycja z kursora lub kalkulacji gridu)
są osobną kategorią wyjątków:
- Calendar grid cursor follower — podąża za kursorem (mousePos), brak DOM triggera
- Calendar grid action bubble — pozycja obliczana z kolumn gridu, brak DOM triggera
- SlidePanel / ConfirmDialog — modale, nie dropdowny

**Zasada dwóch divów (GLOBALNA — nie tylko tooltip):**
- Zewnętrzny div: `ref={refs.setFloating}`, `style={floatingStyles}` — pozycjonowanie
- Wewnętrzny div: tło, padding, border, animacja (`animation: scaleIn ...`)
- NIGDY nie łączyć animacji `transform` (scale, translateY) z `floatingStyles`
  na tym samym elemencie — nadpisuje `transform: translate(x,y)` z Floating UI
- Ten sam wzorzec dotyczy tooltipów (§16.1), pickerów i każdego nowego overlay

**Rules of Hooks — zakaz bezwzględny:**
- Hooki Floating UI (`useClick`, `useHover`, `useDismiss`, `useFocus`)
  wywołujemy WYŁĄCZNIE na top level komponentu/hooka
- NIGDY w `useMemo`, `useCallback`, warunku `if` ani helperze
- Tryb przełączamy przez flagę `enabled` na hooku:
  `useClick(context, { enabled: interaction === "click" })`
  `useHover(context, { enabled: interaction === "hover" })`
- To jest reguła Reacta, nie konwencja — łamanie daje niestabilne rerendery

**Controlled vs uncontrolled — standard API hooka:**
- `open?: boolean` — controlled open state (gdy podany, hook nie trzyma stanu)
- `defaultOpen?: boolean` — initial state dla uncontrolled mode (default: false)
- `onOpenChange?: (open: boolean) => void` — callback, działa w obu trybach
- Zakaz alternatywnych nazw: ❌ `externalOpen`, `isOpen`, `shown`, `visible`

**Twardy ZAKAZ:**
- ❌ `getBoundingClientRect()` + ręczne `top/left` do pozycjonowania dropdownów
- ❌ `createPortal(…, document.body)` dla dropdownów (użyj `FloatingPortal`)
- ❌ Ręczny `useEffect` na click outside / Escape (hook to robi)
- ❌ Ręczny `useEffect` na scroll dismiss (autoUpdate to robi)
- ❌ Klasa CSS `dropdown-bubble` z `position: absolute` — koliduje z Floating UI
- ❌ Osobne implementacje pozycjonowania w modułach
- ❌ Hooki Floating UI w `useMemo` / warunku / helperze (Rules of Hooks)
- ❌ Animacja `transform` na elemencie z `floatingStyles` (nadpisuje pozycjonowanie)

**Nowy dropdown = 3 kroki:**
1. `useFloatingDropdown({ placement, fixedWidth })` w komponencie
2. `ref={refs.setReference} {...getReferenceProps()}` na trigger
3. `<FloatingPortal>` + `ref={refs.setFloating} style={floatingStyles}` na dropdown
