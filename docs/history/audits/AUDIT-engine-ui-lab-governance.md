# Engine UI Lab System Governance Audit

**Data:** 2026-05-16 · **Typ:** read-only audit (zero zmian kodu) · **Audytor:** design-system review
**Zakres:** engine-ui-lab/*, engine-ui/*, globals.css (Engine UI), ENGINE-UI-INVENTORY.md
**Werdykt:** System jest **strukturalnie spójny**, ale ma **3 realne drift-y** powstałe przez iteracyjne rundy PO/CLI — żaden nie jest krytyczny, ale jeden (focus-ring split) jest user-perceivable i powinien być rozstrzygnięty przed Part 11.

---

## 1. Executive summary

- **Lab nawigacja: zdrowa.** 16 sekcji, sidebar order == render order (1:1), zero kolizji nazw, zero pojęciowych duplikatów. Hierarchia primitive→composite→feature intencjonalna i czytelna.
- **Focus-ring DRIFT (headline).** System ma DWA sprzeczne języki focusu: globalny `--eui-focus-ring` = niebieski podwójny ring (4px brand) na każdym `[class*="eui-"]:focus-visible`, ale inputy (TextField/Textarea/Select) nadpisane miękkim szarym halo (B-neutral, 8% grey). Button/Chip/Card nadal niebieskie. W jednym formularzu input ma szary focus, przycisk niebieski. Niezadokumentowane.
- **CardSurface contract misaligned (recurring).** Brak wariantu `bare`/`bordered` → ResultCard i ResourceCard obchodzą primitive `!important`-em (`!bg-transparent !border-0 !shadow-none` / `!border-2`). To samo zgłoszone już w REPORT-part8.5a (P1) — drift się utrwala, nie został rozwiązany.
- **`mergeClass` zduplikowany 5×** (DateRangePicker, Stepper, SearchBar, PopoverItem, GuestPicker) — identyczne ciało. Shared `cn()` istnieje w `lib/utils.ts` ale jest oparty o `twMerge` (Tailwind) — NIE nadaje się 1:1 dla `.eui-*` klas; potrzebny lekki wspólny `cx` w engine-ui.
- **`formatPrice` zduplikowany 2×** (ResultCard, PriceBlock) — identyczna logika, brak wspólnego eksportu.
- **Dead CSS: rodzina `.eui-carousel-*`** (≈100 linii, globals.css ~2511–2615) zastąpiona przez `.eui-image-carousel-track` — martwy kod, część klas (`.eui-carousel-arrow`) jeszcze referowana.
- **"Czarna żyletka" wciąż w systemie:** `.eui-chip-interactive.eui-chip-variant-outline:hover { border-color: grey-900 }` (globals.css:4717) — dokładnie ten razor który inputy odrzuciły; chip niespójny.
- **Inventory drift +6 plików.** ENGINE-UI-INVENTORY.md zaniża liczniki katalogów (hooks 8→10, layout 9→11, media 8→10, text 9→10, itd.). Lista sekcji Lab (16) i roadmap — zgodne.
- **Legacy peer aktywny:** `LegacyFavoriteButton` (root) używany przez ResultCard mimo że `button/FavoriteButton` jest source-of-truth (ale NIE eksportowany z root `index.ts` — modern wersja "niewidoczna" dla konsumentów barrela).
- **Docs: brak jawnej hierarchii source-of-truth.** 13 dokumentów (BLUEPRINT/REPORT/CLOSURE/PROMPT/AUDIT/master-plan v2.4+v2.5). Inventory jest de-facto canonical ale dryfuje; blueprinty mogą udawać normatywne.

---

## 2. System map

| Family | Source of truth | Lab section | Status | Comments |
|---|---|---|---|---|
| Typography/Text | `text/*` (Text, HelperText, MetaText, PriceText, SecondaryLink, Eyebrow, SectionHeading, InlineMeta, EmptyStateText) | `typography` (Typografia) | ✅ clean | Single source, brak legacy peerów |
| Buttons | `button/*` (Button, IconButton, ButtonGroup, Back/Close/Share/FavoriteButton) | `buttons` (Przyciski) | ⚠️ | `button/FavoriteButton` NIE w root index.ts; `LegacyFavoriteButton` (root) nadal aktywny w ResultCard |
| Forms/Inputs (primitives) | `input/*` (Field+sub, TextField, Textarea, Select, useFieldId) | `inputy` (Inputy) | ✅ clean | Tri-mode API spójne |
| Forms (domain composites) | root: GuestPicker, SearchBar, Stepper, DatePickerTabs, SegmentedControl, DateRange/FlexibleDatePicker | `guestpicker`, `searchbar`, `datepicker` | ⚠️ partial refactor | JSDoc-y "Stage N deferred"; pill-shell 8.5b odłożony — świadome |
| Popover/Dropdown | `primitives/Popover` (Radix) | `popovers` | ✅ | Select desktop + error popover reużywają; intencjonalne warstwy |
| Select | `input/Select.tsx` | `inputy` | ✅ | Desktop Popover / mobile BottomSheet; opcje reużywają `.eui-popover-item` |
| Cards/Surfaces | `surface/CardSurface` | `surface` (Powierzchnie) | ❌ contract misaligned | ResultCard + ResourceCard obchodzą `!important` (brak wariantu bare/bordered) |
| ResultCard / ResourceCard | root `ResultCard`, `booking/ResourceCard` | `results` (ResultCard) | ⚠️ | ResourceCard poza engine-ui (booking/); oba bypass CardSurface |
| Media | `media/*` (MediaFrame, Overlay, Badge, ImagePlaceholder, GalleryNavButton, ImageCounter, ThumbnailStrip, FavoriteOverlay) | `media` (Media) | ✅ | `FavoriteOverlay` istnieje ale ResultCard używa LegacyFavoriteButton zamiast niej |
| ImageCarousel | root `ImageCarousel` | `results` (pośrednio przez ResultCard) | ⚠️ | Brak własnej sekcji Lab; demonstrowany tylko wewnątrz ResultCard |
| Loading | `skeleton/*` + `loading/*` (Spinner, LoadingOverlay) | `skeleton` (Stany ładowania) | ✅ clean | Rodzina zebrana poprawnie |
| Layout | `layout/*` (Stack, Inline, ActionRow, Toolbar, StickyBar, SectionBlock, Spacer, Divider) | `layout` (Layout) | ✅ | gap-size token util współdzielony |
| Motion | `tokens/motion` + inline MotionDemo | `motion` (Ruch) | ✅ | Tokeny + demo |
| Navigation (micro) | `nav/*` (Chevron, NavigationArrow, PaginationDot, TabTrigger, SortTrigger) | `nav` (Nawigacja) | ✅ clean |
| Foundations/Tokens | `globals.css` (--eui-*) + `tokens/*` | `foundations` (Fundamenty) | ✅ | Tokeny kompletne (10 radius, 12 space, 13 grey, 5 elev) |

---

## 3. Duplication map

| Item | Duplicate/conflict | Files | Severity | Recommendation |
|---|---|---|---|---|
| `mergeClass()` | 5× identyczna definicja; `cn()` istnieje ale twMerge-based (nie dla `.eui-*`) | DateRangePicker:120, Stepper:87, SearchBar:89, PopoverItem:81, GuestPicker:132 | **Średni** | Dodać jeden lekki `cx` w `engine-ui/(a11y\|tokens)/cx.ts` (`parts.filter(Boolean).join(" ")`), zamienić 5 lokalnych. NIE używać `cn()`/twMerge — eui to nie Tailwind utilities |
| `formatPrice(minor,currency)` | 2× identyczna logika | ResultCard:71, PriceBlock:31 | Niski | Wyeksportować z `@/lib/booking-params` lub `text/PriceText` helper; oba importują |
| Focus-ring language | Globalny brand-blue ring vs input grey halo (patrz §4) | globals.css:665,698–701 vs 5760+/5856+/6009+ | **Średni-wysoki** | Decyzja governance: propagować B-neutral do `--eui-focus-ring` ALBO udokumentować inputy jako świadomy wyjątek |
| `LegacyFavoriteButton` | Legacy peer modern `button/FavoriteButton` | root `LegacyFavoriteButton.tsx` (ResultCard, SearchBar) vs `button/FavoriteButton.tsx` | Niski | 8.5b: ResultCard → modern FavoriteButton; usunąć legacy. Tymczasowo: dodać modern do root index.ts |
| `.eui-carousel-*` rodzina | Zastąpiona `.eui-image-carousel-track` | globals.css ~2511–2615 | Niski | Cleanup-later: usunąć martwe reguły (zachować `.eui-carousel-arrow` jeśli wciąż ref.) — wymaga grep przed usunięciem |
| `.eui-popover-item` reuse | Select opcje + PopoverItem komponent dzielą klasy (intencjonalne) | Select.tsx, PopoverItem.tsx, globals.css | OK | Nie duplikat — świadomy reuse; udokumentować jako wzorzec |

---

## 4. Visual DNA drift

| Area | Current patterns | Drift | Recommendation |
|---|---|---|---|
| **Focus ring** | System: `--eui-focus-ring` = `0 0 0 2px surface, 0 0 0 4px border-focus(brand BLUE)` na `[class*="eui-"]:focus-visible`. Inputy: `box-shadow: 0 0 0 3px color-mix(grey-900 8%)` na `:focus` (B-neutral, NEUTRALNY szary) | **TAK — user-perceivable.** Button/Chip/Card = niebieski podwójny ring; TextField/Textarea/Select = miękki szary halo. W jednym formularzu dwa różne języki focusu. Powstało przez rundy PO (odrzucony niebieski, odrzucony razor → grey). Niezadokumentowane | **Decyzja PO/architekt:** albo (a) zaktualizować `--eui-focus-ring` na neutralny grey (propaguje na cały system, spójność), albo (b) jawna reguła w LAB-CONVENTIONS: "inputy mają neutralny focus, kontrolki akcji brand ring — celowo". Bez decyzji to losowy drift |
| **Border focus/hover** | Inputy: hover/focus = grey-500 (#717171, miękki). Chip outline:hover = **grey-900** (#111, razor) | TAK | `.eui-chip-interactive.eui-chip-variant-outline:hover` (globals.css:4717) → zmienić grey-900 na grey-500/600 dla spójności z odrzuconym "razor" |
| **Radius** | Inputy/Button/SearchBar = sm (8px). PopoverContent = 2xl (24px). PopoverItem = md (12px). Select-content override = lg (16px). Card = md–2xl (zmienne) | Częściowy — popover rodzina niespójna (content 24px vs select-content 16px vs item 12px) | Średni: skonsolidować dropdown radius (Select-content 16px to świadomy fix #2 — OK; ale generyczny PopoverContent 24px vs item 12px wygląda jak dryf). Needs visual verify czy 24px popover obok 16px select wygląda spójnie |
| **Background (inputs)** | rest=grey-0, focus=grey-0, disabled=grey-100, readonly=grey-50 | Spójne (Airbnb pattern, świadomy fix 5) | OK — readonly grey-50 to świadoma decyzja (NIE flagowane przez PO) |
| **Elevation** | 5 tokenów elev-1..5; Card używa przez elevation prop; popover elev-4 | Spójne | OK |
| **Icon scale** | Inputy iconLeft 16px; Select chevron 18px; PopoverItem icon koperta 40px; Stepper ikony 14px | Lekki dryf (różne rozmiary ikon per kontekst) — w większości uzasadnione kontekstem | Niski — needs visual verify czy mix 14/16/18/20 w jednym widoku nie zgrzyta |
| **Spacing** | 12-stopniowa skala; Lab specimeny `width:100% maxWidth:320` (po fix f6e95ae) | Spójne po ostatnich fixach | OK |
| **Mobile** | Select→BottomSheet ≤767px; Lab sidebar sticky (po fix ff16058); showcase padding reduce @768px | Spójne | OK — `useIsMobile` 767px hardcoded (ewent. token, niski priorytet) |

---

## 5. Lab navigation audit

**Co jest dobrze:**
- Sidebar order == render order, 1:1 (zero rozjazdu) — zweryfikowane.
- Polskie nazwy spójne, ikona per sekcja, IntersectionObserver active-tracking, sticky (naprawione).
- Hierarchia warstw intencjonalna: `popovers` (Radix prymityw) → `datepicker`/`guestpicker`/`searchbar` (composites na Popover) → użytkownik rozumie warstwowanie.

**Co jest mylące / do rozważenia:**
- **Kolejność tematyczna nie grupuje rodzin.** Sekwencja: foundations, motion, surface, nav, chip, typography, layout, media, popovers, datepicker, guestpicker, searchbar, results, buttons, skeleton, **inputy**. Formularze (`inputy`) są OSTATNIE, a `datepicker/guestpicker/searchbar` (też form-controls) w środku, oddzielone od `inputy` przez `results`. **Rekomendacja:** zgrupować form-family sąsiadująco (inputy → datepicker → guestpicker → searchbar) lub dodać wizualne grupy w sidebarze (sekcje: Foundations / Primitives / Forms / Composites). Needs PO decision — to porządkowanie, nie bug.
- **`buttons` po `results`/`searchbar`** — przyciski to fundament, logicznie bliżej `chip`/`nav` na początku. Obecnie nr 14/16.
- **ImageCarousel bez własnej sekcji** — demonstrowany tylko wewnątrz ResultCard (`results`). Konsument Lab szukający "carousel" nie znajdzie go w sidebarze. Rekomendacja: albo wzmianka w `media`, albo świadomie zostawić (jest domain composite, nie primitive).
- **Brak sekcji dla root-level domain composites** (PriceBlock, AvailabilityBadge, FeatureChips, ResultsHeader/EmptyState) — część pokazana w `results`, część wcale. Nie blokujące (to domain, nie design-system primitives), ale inventory je listuje → konsument może szukać w Lab i nie znaleźć.

**Do scalenia / przeniesienia / przemianowania:** nic pilnego. Największa wartość: **wprowadzić grupy w sidebarze** (Foundations / Primitives / Forms / Composites / States) — to czysto nawigacyjne, zero zmian komponentów.

---

## 6. Component family audit

- **Typography/Text** — ✅ Source: `text/*`. Zero legacy/duplikatów. Demo `typography` (19 showcase). Najczystsza rodzina. Bez akcji.
- **Buttons** — ⚠️ Source: `button/*`. Problem: `button/FavoriteButton` NIE eksportowany z root `engine-ui/index.ts` → konsumenci barrela widzą tylko `LegacyFavoriteButton`; ResultCard importuje legacy. **Rec:** dodać modern do root index.ts (B), zaplanować ResultCard→modern (8.5b).
- **Forms/Inputs** — ⚠️ Primitives `input/*` czyste. Domain composites (GuestPicker/SearchBar/Stepper/DatePickerTabs) w root z JSDoc "Stage N deferred" — świadomy dług 8.5b (pill-shell coupling). Brak tracking-issue poza JSDoc/raportami. **Rec:** jeden tracking dokument 8.5b zamiast rozproszonych JSDoc-ów.
- **Popovers/Dropdowns** — ✅ Source: `primitives/Popover`. Select + error-popover reużywają poprawnie. Radius popover rodziny niespójny (§4) — needs visual verify.
- **Cards/Results** — ❌ Najpoważniejszy contract gap. `CardSurface` nie ma `variant` dla "bare" (transparent, Airbnb listing) ani "bordered" (explore card) → ResultCard `!bg-transparent !border-0 !shadow-none`, ResourceCard `!border-2 !bg-card`. Recurring (P1 w REPORT-part8.5a, nierozwiązane). **Rec:** rozszerzyć CardSurface o `variant: "elevated" | "bare" | "bordered"` PRZED kolejnymi kartami — inaczej każda nowa karta = nowy `!important`.
- **Media** — ✅ Source `media/*` czyste. `FavoriteOverlay` istnieje ale ResultCard używa LegacyFavoriteButton → FavoriteOverlay martwa ścieżka w realnym użyciu. **Rec:** przy 8.5b ResultCard → FavoriteOverlay+modern.
- **Loading** — ✅ `skeleton/*`+`loading/*` zebrane, demo `skeleton`. Bez akcji.
- **Layout** — ✅ `layout/*`, gap-size token util współdzielony poprawnie. Bez akcji.
- **Motion** — ✅ tokeny + demo. Bez akcji.
- **Navigation** — ✅ `nav/*` czyste. Bez akcji.

---

## 7. Docs / inventory drift

**Aktualne (traktować jako source-of-truth):**
- `ENGINE-UI-INVENTORY.md` — de-facto canonical mapa komponentów + roadmap. **ALE** liczniki katalogów zaniżone (+6 plików realnie: hooks 8→10, layout 9→11, media 8→10, text 9→10, button 7→8, chip 8→9, loading 2→3, nav 5→6, overlay 5→6, skeleton 6→7, surface 3→4). Lista 16 sekcji Lab + roadmap (Part 10b ✅) — **zgodne**. Header "post Part 10b 2026-05-15" — aktualny.
- `globals.css` (linie ~502–665) — canonical tokeny + reguły CSS. Autorytatywne.
- `LAB-CONVENTIONS-responsive.md` — aktualne (po fixach #3/#7 z ostatnich rund).

**Stare / ryzyko udawania source-of-truth:**
- `master-plan-v2_4.md` + `master-plan-v2_5.md` — dwie wersje obok siebie; v2.5 prawdopodobnie superseduje v2.4. **Rec:** zarchiwizować v2.4 (przenieść do `docs/archive/` lub dopisać "SUPERSEDED BY v2.5" w nagłówku).
- `BLUEPRINT-part*.md` (8.5a, 9, 10) — prescriptive specs, podpisane "FINAL"; mogą być mylone z normatywnym stanem. Realny stan = kod. **Rec:** nagłówek "Spec/intent — stan faktyczny w kodzie + ENGINE-UI-INVENTORY".
- `PROMPT-CLI-*.md`, `REPORT-*.md`, `CLOSURE-*.md`, `AUDIT-*.md` — operacyjne/historyczne, NIE normatywne. Obecnie luzem w `docs/` obok inventory → szum.

**W kodzie ale nie w inventory:** ~6 plików (głównie nowe hooki/utility w hooks/, tokens/, layout/). Brak ghost-komponentów (nic w inventory czego nie ma w kodzie). Wszystkie sekcje Lab w inventory istnieją.

---

## 8. Recommended governance rules

**Gdzie trafia nowy komponent:**
- Primitive (bezstanowy, reużywalny, system-level) → `engine-ui/<kategoria>/`, eksport z `<kategoria>/index.ts` ORAZ root `engine-ui/index.ts` (barrel parity — obecnie łamane przez FavoriteButton).
- Domain composite (zależny od booking/logiki, łączy primitywy) → root `engine-ui/` LUB `components/booking/`, NIE udawać primitive.
- Helper/util współdzielony → jeden plik (np. `engine-ui/tokens/cx.ts`), nigdy lokalna kopia (zasada: jeśli ten sam helper pojawia się 2× → ekstrakcja).

**Kiedy nowa sekcja Lab:** tylko dla nowej *rodziny* primitywów (nie dla pojedynczego wariantu). Wariant istniejącego → rozszerz istniejącą sekcję (nowy `ComponentShowcase`). Domain composite → sekcja tylko jeśli ma samodzielną wartość demonstracyjną.

**Kiedy rozszerzać istniejącą sekcję:** nowy wariant/stan/rozmiar istniejącego primitive; nowy primitive tej samej rodziny (np. kolejny `Skeleton*` → `skeleton`).

**Kiedy blueprint:** tylko dla Part-scale pracy (wieloetapowej, z decyzjami architektonicznymi). Blueprint = intent PRZED, nie zapis stanu. Po zamknięciu Part → nagłówek "SUPERSEDED — stan w kodzie/inventory".

**Kiedy aktualizować inventory:** po KAŻDYM merge dodającym/usuwającym plik w `engine-ui/` lub sekcję Lab. Liczniki katalogów = realne (rozważyć CI check: skrypt liczy pliki vs inventory, fail przy rozjeździe — to jedyna trwała obrona przed drift).

**Gdzie trzymać prompts/reports/blueprints:** wydzielić z płaskiego `docs/`:
- `docs/` — tylko normatywne: `ENGINE-UI-INVENTORY.md`, `LAB-CONVENTIONS-responsive.md`, aktualny `master-plan`.
- `docs/blueprints/` — BLUEPRINT-* (z nagłówkiem statusu).
- `docs/history/` — REPORT-*, CLOSURE-*, PROMPT-CLI-*, AUDIT-*, master-plan stare wersje.
- Reguła: dokument operacyjny/historyczny NIGDY w katalogu z inventory (eliminuje "udawanie source-of-truth").

---

## 9. Cleanup plan

### A) Must fix before Part 11
- **A1. Rozstrzygnąć focus-ring drift** (§4). Decyzja PO/architekt: neutral propaguje na `--eui-focus-ring` ALBO jawna reguła wyjątku w LAB-CONVENTIONS. Bez tego każdy nowy primitive losowo dziedziczy niebieski ring sprzeczny z inputami. *(decyzja, nie kod — ale blokuje spójność Part 11)*
- **A2. CardSurface variant system** (`elevated`/`bare`/`bordered`). Recurring contract gap (P1 8.5a, nadal otwarty). Każda nowa karta bez tego = kolejny `!important` bypass.
- **A3. Inventory liczniki → realne** + dopisać ~6 nieudokumentowanych plików. Tani fix, ale inventory jest canonical — drift podważa zaufanie do całej governance.

### B) Should fix soon
- **B1.** Jeden wspólny `cx` w engine-ui, zamienić 5× `mergeClass` (NIE przez `cn()`/twMerge — eui ≠ Tailwind utilities).
- **B2.** `button/FavoriteButton` → root `engine-ui/index.ts` (barrel parity); zaplanować ResultCard → modern (eliminacja LegacyFavoriteButton).
- **B3.** `.eui-chip-interactive...outline:hover` grey-900 → grey-500/600 (eliminacja ostatniego "razor" niespójnego z inputami).
- **B4.** Reorganizacja `docs/` (blueprints/ + history/) — eliminuje "udawanie source-of-truth".

### C) Cleanup later
- **C1.** Usunąć martwą rodzinę `.eui-carousel-*` (po grep-weryfikacji że `.eui-carousel-arrow` faktycznie nieużywana lub przenieść).
- **C2.** `formatPrice` → wspólny eksport (ResultCard + PriceBlock).
- **C3.** Sidebar Lab: grupy (Foundations/Primitives/Forms/Composites/States) + reorder form-family sąsiadująco. *(needs PO decision — UX porządkowy)*
- **C4.** `master-plan-v2_4` → archiwum; blueprinty → nagłówek statusu.
- **C5.** `useIsMobile` 767px → token CSS/const (jeśli breakpoint kiedyś zmienny).

### D) Acceptable differences (świadome, NIE ruszać)
- Input readonly bg = grey-50 (świadoma decyzja, semantycznie "not editable", PO nie flagował).
- Root-level domain composites (GuestPicker/SearchBar/Stepper/DatePickerTabs) — świadomy dług 8.5b (pill-shell coupling), udokumentowany.
- Select-content radius 16px ≠ generyczny PopoverContent 24px — świadomy fix #2 (clipping). *(needs visual verify czy obok siebie OK, ale per-se uzasadnione)*
- `.eui-popover-item` reuse w Select — intencjonalny wzoriec (visual reuse + poprawna semantyka listbox), nie duplikat.
- Mobile BottomSheet Tab no-op — udokumentowana decyzja architekta (D6).

---

### Załączniki / weryfikacja
- "needs visual verify": radius popover-family obok siebie (§4), icon-scale mix 14/16/18/20 w jednym widoku (§4), sidebar grupowanie (§5 C3).
- Każdy finding ma plik/sekcję + rekomendację (powyżej). Zero zmian kodu wykonanych — raport-only zgodnie z poleceniem.
