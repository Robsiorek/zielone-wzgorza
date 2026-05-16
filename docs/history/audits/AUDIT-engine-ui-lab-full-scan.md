# Engine UI Lab Full System Scan

**Data:** 2026-05-16 · **Typ:** read-only (zero zmian kodu / commitów) · **Metoda:** sekcja-po-sekcji, czytane pliki + ocena sensu
**Zakres:** EngineUiLab.tsx + 16 sekcji + helpery Lab + komponenty engine-ui + ENGINE-UI-INVENTORY.md + DESIGN_SYSTEM.md
**Powiązany:** `docs/AUDIT-engine-ui-lab-governance.md` (system-level drift — focus-ring/CardSurface/mergeClass; NIE powtarzam tu, referuję).

---

## 1. Executive summary

**Lab wewnętrznie jest dość spójny.** 16 sekcji, sidebar==render order 1:1, hierarchia primitive→composite intencjonalna, helpery jednorodne (ComponentShowcase wszędzie). Większość duplikacji o które pytasz to **świadome warstwowanie**, nie przypadkowy dług.

**ALE największy problem jest PONAD Labem — kolizja source-of-truth dwóch design systemów:**

- **`DESIGN_SYSTEM.md` (v1.8, kwiecień 2026)** w nagłówku: *"Ten plik jest JEDYNYM źródłem prawdy dla stylu wizualnego panelu. Czytaj go na starcie KAŻDEGO czatu."* Opisuje system **admin `.bubble` / Plus Jakarta Sans / `<BubbleSelect>` / border 2px-karty-1px-inputy / `--radius:16px`**.
- **Engine UI** to ODRĘBNY system: `.eui-*` / **Manrope** (hardcoded, FoundationsSection desc) / `Select` (input/Select.tsx) / `--eui-*` token scale / B-neutral focus.
- Te dwa systemy współistnieją, a starszy dokument **agresywnie rości sobie uniwersalną władzę** ("KAŻDEGO czatu"). Nowy czat czytający DESIGN_SYSTEM.md wygeneruje `.bubble`/Plus Jakarta sprzeczne z Engine UI. **To jest dokładnie "rozjazd przez zmianę czatów" — ale na poziomie systemu-systemów, nie sekcji Lab.**

**Drugorzędne (z governance audit, nadal otwarte):** focus-ring drift (input grey halo vs system brand-blue ring), CardSurface contract gap (ResultCard/ResourceCard `!important` bypass), `mergeClass` 5×, inventory liczniki +6, martwa rodzina `.eui-carousel-*`, chip grey-900 razor (globals.css:4717).

**Wewnątrz-Labowe duplikacje:** jedna realnie myląca (Foundations showcase `title="Typografia"` koliduje nazwą z sekcją `Typografia`). Reszta to poprawne tokens-vs-components / primitive-vs-composite warstwowanie — wymaga jedynie dokumentacji jako zasada, nie scalania.

---

## 2. Section-by-section audit

Status: ✅ OK · ⚠️ needs clarification · ❌ duplicate/confusing

| # | Section (id) | Purpose | Overlaps | Consistency | Status | Recommendation |
|---|---|---|---|---|---|---|
| 1 | **Fundamenty** (`foundations`) | Tokeny: Kolory, **Typografia**(skala), Odstępy, Zaokrąglenia, Elevacje, Materiały | Showcase "Typografia" vs sekcja #6 "Typografia"; reszta tokenów bez dup | width:100% pełna szerokość (uzasadnione — skale) | ⚠️ | Przemianować showcase `title="Typografia"` → **"Skala typograficzna (tokeny)"**. Treść OK (tokeny ≠ komponenty), kolizja jest tylko w nazwie |
| 2 | **Ruch** (`motion`) | Krzywe ease + czasy + spring; interaktywne demo | **Brak** — Foundations NIE pokazuje motion (zweryfikowane) | 1 showcase, width:100%, gap 32px | ✅ | Bez zmian. Fundamenty-vs-Ruch = NIE duplikat |
| 3 | **Powierzchnie** (`surface`) | CardSurface(elev/radius/interactive), PanelSurface, ScrollFade, Backdrop, DragHandle, SheetHeader/Footer, BottomSheet | CardSurface tu (primitive) vs Results/ResourceCard (consumer) — warstwa, nie dup. BottomSheet tu vs Select-mobile (użycie) — nie dup | Mixed inline widths (160/180/280/600) — per-component | ⚠️ | Treść OK. CardSurface contract gap (bypass `!important`) = problem PRIMITIVE, nie sekcji (patrz governance audit A2). Needs visual verify spójności szerokości w obrębie sekcji |
| 4 | **Nawigacja** (`nav`) | Chevron, NavigationArrow, PaginationDot, TabTrigger, SortTrigger (13 showcase) | NavigationArrow tu vs GalleryNavButton (Media, kompozycja) — świadome | maxWidth:400 kontener; flex-wrap | ✅ | Bez zmian. Micro-nav primitives, jasne miejsce |
| 5 | **Tagi i badge'y** (`chip`) | Chip/FilterChip/Tag/Badge/TinyBadge/StatusDot/RatingPill/InlineBadge (14) | Chip/Tag używane też w Layout (toolbar demo) — kontekst, nie dup | eui-chip-group flex-wrap | ✅ | Bez zmian. `.eui-chip...outline:hover` grey-900 razor = problem CSS (governance B3), nie taxonomy |
| 6 | **Typografia** (`typography`) | Semantyczne wrappery: Text, SecondaryLink, HelperText, MetaText, InlineMeta, Eyebrow, SectionHeading, PriceText, EmptyStateText (19) | HelperText tu vs użycie w Field(Inputy); PriceText tu vs ResultCard — kontekst | width:100% / maxWidth:320 (truncate) | ⚠️ | Treść OK (desc wprost: "Zero duplikacji tokenów"). Kolizja nazwy z Foundations#1 — rozwiązać po stronie Foundations (rename tam) |
| 7 | **Layout** (`layout`) | Stack, Inline, Spacer, Divider, ActionRow, Toolbar, InlineActions, SectionBlock, StickyBar (14) | Stack/Inline/ActionRow używane w ~5 innych sekcjach jako struktura — to NIE dup (to ich natura: layout primitives) | width:100% maxWidth 360/600 (inline, nie stała) | ✅ | Bez zmian. Użycie Stack/Inline gdzie indziej = poprawne (primitives kompozycyjne). Drobne: zharmonizować inline maxWidth ze stałą jak InputySection |
| 8 | **Media** (`media`) | MediaFrame, ImagePlaceholder, MediaOverlay, MediaBadge, FavoriteOverlay, GalleryNavButton, ImageCounter, ThumbnailStrip + "Full composition" (11) | FavoriteOverlay tu, ale ResultCard używa LegacyFavoriteButton (martwa ścieżka realna); ImageCarousel BRAK w Media | flex:1 1 Xpx maxWidth (basis approach — inny niż reszta) | ⚠️ | Dodać wzmiankę/specimen **ImageCarousel** w Media (konsument Lab nie znajdzie carousela w sidebarze — jest tylko wewnątrz ResultCard). Specimen-width approach odbiega (flex-basis vs width) — needs visual verify |
| 9 | **Popovery** (`popovers`) | Popover(Radix) warianty rozmiaru + PopoverItem (2 showcase, dużo wierszy demo) | Popover = primitive; DatePicker/GuestPicker/Select/ErrorPopover = konsumenci → warstwa, NIE dup | trigger inline + content auto | ✅ | Bez zmian. Świadome warstwowanie (primitive ↓ composites). Udokumentować jako wzorzec |
| 10 | **Picker dat** (`datepicker`) | DatePickerTabs (exact+flexible) w Popoverze (1 showcase) | Element SearchBara (composite) — pokazany osobno = OK (samodzielna wartość) | trigger minWidth:280, popover large | ⚠️ | Form-control rodzina rozproszona w sidebarze (patrz §4 taxonomy). Treść OK. DatePickerTabs = legacy peer (Q1 scope, świadome) |
| 11 | **Picker gości** (`guestpicker`) | GuestPicker (draft/commit, pets) w Popoverze (Standardowy / Bez zwierząt) | Element SearchBara; Stepper w środku (pokazany? Stepper NIE ma własnej sekcji) | trigger inline, popover medium | ⚠️ | **Stepper nie ma sekcji Lab ani showcase** — primitive używany przez GuestPicker, niewidoczny samodzielnie. Rozważyć showcase Stepper (w Inputy lub Forms) |
| 12 | **Pasek wyszukiwania** (`searchbar`) | SearchBar hero+compact (composite: DatePicker+GuestPicker+location) (1) | Najwyższy composite form — łączy #10+#11. Świadoma hierarchia | width:100% maxWidth 860/480 | ✅ | Bez zmian. Pill-shell dług 8.5b udokumentowany (świadome) |
| 13 | **Warstwa wyników** (`results`) | ResultsHeader, ResultCard, ResultsEmptyState, ResultsSkeleton (4) | ResultCard używa CardSurface(bypass), ImageCarousel, LegacyFavoriteButton; ResultsSkeleton vs sekcja Skeleton(#15) | width:100% grid; skeleton maxWidth:360 | ⚠️ | ResultsSkeleton tu vs Skeleton family #15 — to composite-skeleton vs primitive-skeleton (warstwa OK), ale konsument może się gubić. Domain composites (PriceBlock/AvailabilityBadge/FeatureChips) w inventory ale nie w Lab |
| 14 | **Przyciski** (`buttons`) | Button, IconButton, ButtonGroup, ToggleButton, Close/Back/Favorite/ShareButton (7) | `button/FavoriteButton` tu (modern) vs `LegacyFavoriteButton` używany w ResultCard | inline flex-wrap; fullWidth maxWidth:320 | ⚠️ | Pozycja 14/16 — przyciski to fundament, logicznie wcześniej (przy chip/nav). Modern FavoriteButton NIE w root index.ts (governance B2) |
| 15 | **Stany ładowania** (`skeleton`) | Skeleton/SkeletonText/Circle/Image/Card/Region + Spinner + LoadingOverlay (9) | ResultsSkeleton (#13) to composite na tych primitywach — warstwa | fixed widths 320/280/160 per-demo | ✅ | Bez zmian. Rodzina loading zebrana poprawnie. Nazwa "Stany ładowania" trafna |
| 16 | **Inputy** (`inputy`) | Field compound + TextField + Textarea + Select (architektura/rozmiary/stany/ikony/error popover) (10–11) | Select-mobile używa BottomSheet(#3); error popover używa Popover(#9); Field/HelperText vs Typography(#6) | SPECIMEN_STYLE width:100% maxWidth:320 (stała — wzorcowe) | ⚠️ | Ostatnia w sidebarze, oddzielona od pokrewnych form-controls (#10/#11/#12) przez results/buttons/skeleton. Treść OK. Patrz §4 taxonomy |

**Żadna sekcja nie jest ❌ (czysty duplikat).** 1 realna kolizja nazwy (#1↔#6), reszta ⚠️ = warstwowanie do udokumentowania lub porządkowanie nawigacji.

---

## 3. Duplication map

| Duplicate area | Sections/files | Why confusing | Recommendation |
|---|---|---|---|
| **"Typografia" 2×** | Foundations showcase `title="Typografia"` (FoundationsSection.tsx:139) ↔ sekcja `Typografia` (TypographySection.tsx) | Ta sama nazwa = user nie wie czy to to samo. Faktycznie: Foundations=skala/tokeny, Typography=komponenty (Text/HelperText). Sensowny podział, zła nazwa | Rename Foundations showcase → **"Skala typograficzna (tokeny)"**. Zero zmian treści |
| **Fundamenty vs Ruch** | FoundationsSection ↔ MotionSection | Podejrzenie dup | **NIE duplikat** — zweryfikowane: Foundations NIE ma motion showcase. Bez akcji |
| **Powierzchnie vs Results/ResourceCard** | SurfaceSection (CardSurface primitive) ↔ ResultsSection (ResultCard), booking/ResourceCard | Wygląda jak 2× karty | Warstwa primitive↔consumer = OK. Realny problem: CardSurface brak wariantu→`!important` bypass (governance A2), NIE Lab dup |
| **Popovery vs Select/ErrorPopover/DatePicker/GuestPicker** | PopoverSection (Radix prymityw) ↔ Inputy(Select), Inputy(error popover), DatePicker, GuestPicker | 5 miejsc z popoverem | Świadome warstwowanie (1 primitive, N konsumentów). Udokumentować jako zasada w LAB-CONVENTIONS. Bez scalania |
| **Inputy vs SearchBar/DatePicker/GuestPicker** | InputySection ↔ SearchBar/DatePicker/GuestPicker sekcje | Wszystko to "form controls" rozsiane po sidebarze (poz. 10,11,12,16) | NIE dup treści — ale **rozproszenie nawigacyjne**. Fix przez taxonomy (§4), nie merge |
| **Typography vs Text/HelperText/PriceText** | TypographySection ↔ użycia w Inputy(HelperText/Field), Results(PriceText) | HelperText/PriceText "widać" w wielu sekcjach | Komponent-w-kontekście ≠ dup. TypographySection = source-of-truth demo. Kod: `formatPrice` zdublowany 2× (governance C2) |
| **Loading vs Skeleton/Spinner/LoadingOverlay** | SkeletonSection (wszystkie) ↔ ResultsSkeleton (Results) | ResultsSkeleton osobno | Composite-skeleton (Results) na primitywach (#15) — warstwa OK. Bez akcji |
| **Media vs ImageCarousel/ResultCard** | MediaSection ↔ ResultCard(ImageCarousel) | **ImageCarousel nigdzie w sidebarze** — tylko wewnątrz ResultCard | Dodać specimen/wzmiankę ImageCarousel w Media (discoverability) |
| **Layout vs Stack/Inline/ActionRow w innych sekcjach** | LayoutSection ↔ ~5 sekcji używających Stack/Inline | Stack/Inline "wszędzie" | To NATURA layout-primitywów (struktura każdej sekcji). NIE dup. Bez akcji |
| **DESIGN_SYSTEM.md vs ENGINE-UI-INVENTORY.md** | docs/DESIGN_SYSTEM.md (admin .bubble) ↔ ENGINE-UI-INVENTORY.md (engine-ui) | DESIGN_SYSTEM rości "JEDYNE źródło prawdy KAŻDEGO czatu" ale opisuje INNY system | **Najpoważniejsze.** Rozgraniczyć zakresy w nagłówkach obu (patrz §7) |

---

## 4. Proposed taxonomy

Docelowy podział Lab (grupy w sidebarze — czysto nawigacyjne, ZERO zmian komponentów). Obecna płaska lista 16 → 6 grup:

```
FOUNDATIONS
  1. Fundamenty            (tokeny: kolor/typo-scale/space/radius/elev/material)
  2. Ruch                  (motion tokens)

PRIMITIVES
  3. Typografia            (Text/HelperText/MetaText/PriceText/...)
  4. Przyciski             (Button/IconButton/ButtonGroup/...)   ← przesunąć w górę
  5. Tagi i badge'y        (Chip/Tag/Badge/RatingPill/...)
  6. Nawigacja             (Chevron/NavigationArrow/Tab/Sort/...)
  7. Layout                (Stack/Inline/Divider/ActionRow/...)
  8. Media                 (MediaFrame/Overlay/Carousel*/...)     ← dodać ImageCarousel
  9. Powierzchnie          (CardSurface/PanelSurface/ScrollFade)

OVERLAYS / POPOVERS
 10. Popovery              (Popover primitive + PopoverItem)
 11. Sheety / Modale       (BottomSheet/Backdrop/SheetHeader — wydzielić z Powierzchnie?)*

FORM CONTROLS                ← zgrupować rozproszone
 12. Inputy                (Field/TextField/Textarea/Select)
 13. Stepper               (osobny showcase — obecnie niewidoczny)*
 14. Picker dat            (DatePickerTabs)
 15. Picker gości          (GuestPicker)
 16. Pasek wyszukiwania    (SearchBar — composite łączący 14+15)

COMPOSITES / PATTERNS
 17. Warstwa wyników       (ResultCard/ResultsHeader/EmptyState)

LOADING STATES
 18. Stany ładowania       (Skeleton family + Spinner + Overlay)
```

`*` = needs PO decision (czy wydzielać Sheety z Powierzchnie; czy Stepper dostaje showcase). Grupy NIE wymagają zmian sekcji — tylko nagłówki/separatory w `LabSidebar.tsx` + ewentualny reorder tablicy `SIDEBAR_ITEMS` w `EngineUiLab.tsx`.

---

## 5. Rename / merge / move recommendations

| Akcja | Co | Plik/sekcja | Uzasadnienie |
|---|---|---|---|
| **RENAME** | Foundations showcase `title="Typografia"` → `"Skala typograficzna (tokeny)"` | FoundationsSection.tsx:139 | Eliminuje jedyną realną kolizję nazw z sekcją Typografia |
| **MOVE** | "Przyciski" wyżej w sidebarze (poz. 14 → ~4, przy chip/nav) | EngineUiLab.tsx `SIDEBAR_ITEMS` | Przyciski = primitive fundamentalny, nie po composites |
| **GROUP** | Wprowadzić 6 grup nagłówkowych (§4) | LabSidebar.tsx + EngineUiLab.tsx | Form-controls rozproszone (10/11/12/16); grupy = czytelność bez zmian komponentów |
| **ADD** | Specimen/wzmianka ImageCarousel w Media | MediaSection.tsx | ImageCarousel nieodkrywalny (tylko wewnątrz ResultCard) |
| **ADD (opt)** | Showcase Stepper (w Inputy lub osobny) | InputySection.tsx / nowy | Stepper primitive niewidoczny samodzielnie (tylko w GuestPicker) — needs PO decision |
| **NIE merge** | DatePicker/GuestPicker/SearchBar zostają osobno | — | Każdy ma samodzielną wartość demonstracyjną; SearchBar=composite łączący — hierarchia celowa |
| **NIE merge** | ResultsSkeleton zostaje w Results | — | Composite-skeleton ≠ primitive Skeleton; warstwa poprawna |
| **DOC** | Wzorzec "1 primitive → N konsumentów" (Popover, Stack, CardSurface) jako jawna zasada | LAB-CONVENTIONS-responsive.md | Żeby przyszłe czaty nie traktowały warstwowania jako duplikacji do scalenia |

---

## 6. Visual consistency findings

(Pełna analiza DNA w `AUDIT-engine-ui-lab-governance.md` §4 — tu skrót section-scope.)

- **Specimen width — niespójne podejście między sekcjami.** Inputy: stała `SPECIMEN_STYLE {width:100%,maxWidth:320}` (wzorcowe, po fix f6e95ae). Layout: inline `maxWidth:360/600` (bez stałej). Media: `flex:1 1 Xpx` (basis approach — inny model). Surface: hardcoded 160/180/280/600. **Rec:** wspólna konwencja specimen-width per typ (compact 320 / wide 480 / full / grid) — patrz governance audit. needs visual verify czy mix nie zgrzyta obok siebie.
- **Focus language split** (governance §4): inputy grey halo vs reszta brand-blue ring. W Labie widać to gdy obok siebie focusujesz input i Button — różny język. needs PO decision.
- **Radius popover-family**: PopoverContent 24px vs Select-content 16px vs PopoverItem 12px. needs visual verify czy dropdown obok generycznego popovera wygląda jak jeden system.
- **Icon scale**: 14/16/18/20px zależnie od kontekstu (Stepper 14, input 16, chevron 18, PopoverItem koperta 40). Większość uzasadniona, ale needs visual verify w gęstych widokach (np. SearchBar łączący kilka).
- **Chip razor**: `.eui-chip-interactive...outline:hover` grey-900 (globals.css:4717) — niespójny z odrzuconym "black razor" inputów. governance B3.
- **Spójne (OK):** spacing scale (po fixach), input bg (Airbnb white), mobile (BottomSheet ≤767, sidebar sticky po ff16058, showcase padding reduce @768).

---

## 7. Governance rules

**Source of truth — hierarchia (DO USTANOWIENIA, obecnie kolizja):**
1. **Engine UI** (`.eui-*`, Manrope): `ENGINE-UI-INVENTORY.md` = mapa komponentów; `globals.css` (--eui-*) = tokeny/CSS. Autorytatywne dla wszystkiego `engine-ui/*` i Lab.
2. **Admin panel** (`.bubble`, Plus Jakarta): `DESIGN_SYSTEM.md` = jego system. **MUSI dostać nagłówek zawężający zakres** — obecne "JEDYNE źródło prawdy KAŻDEGO czatu" jest fałszywe i niebezpieczne (nowy czat wygeneruje `.bubble`/Plus Jakarta w kodzie Engine UI).
   - **Rec:** nagłówek DESIGN_SYSTEM.md → *"Źródło prawdy dla ADMIN PANEL (.bubble). NIE dotyczy Engine UI — tam: ENGINE-UI-INVENTORY.md + globals.css --eui-*."* I odwrotnie: nagłówek ENGINE-UI-INVENTORY.md → wskazanie że admin panel ma osobny system.

**Kiedy nowy komponent → nowa sekcja Lab:** tylko dla nowej *rodziny* primitywów. Wariant/stan istniejącego → nowy `ComponentShowcase` w istniejącej sekcji. Domain composite → sekcja tylko jeśli ma samodzielną wartość demonstracyjną (jak SearchBar); inaczej pokazać w sekcji konsumenta (jak ResultsSkeleton w Results).

**Gdzie source of truth komponentu:** primitive → `engine-ui/<kat>/` + eksport z `<kat>/index.ts` ORAZ root `index.ts` (barrel parity — łamane przez FavoriteButton). Demo Lab NIGDY nie jest source of truth — tylko prezentacja.

**Kiedy aktualizować inventory:** po KAŻDYM merge dodającym/usuwającym plik engine-ui lub sekcję Lab. Liczniki = realne (rekomendacja: CI skrypt liczy pliki vs inventory, fail przy rozjeździe — jedyna trwała obrona, drift już wystąpił +6).

**Docs (z governance audit B4):** `docs/` = tylko normatywne (ENGINE-UI-INVENTORY, LAB-CONVENTIONS, aktualny master-plan, DESIGN_SYSTEM z poprawionym nagłówkiem). `docs/blueprints/`, `docs/history/` (REPORT/CLOSURE/PROMPT/AUDIT/stare master-plany) — wydzielić.

---

## 8. Cleanup plan

### A) Must fix before Part 11
- **A1. DESIGN_SYSTEM.md vs Engine UI source-of-truth collision.** Poprawić nagłówki obu dokumentów (zawęzić zakres DESIGN_SYSTEM do admin `.bubble`; ENGINE-UI-INVENTORY wskazać rozgraniczenie). *Najwyższy priorytet — bez tego każdy nowy czat ryzykuje generowanie złego systemu.* (dokumentacja, nie kod)
- **A2. Rename Foundations showcase "Typografia" → "Skala typograficzna (tokeny)"** (FoundationsSection.tsx:139). Jedyna realna wewnątrz-Lab kolizja.
- **A3.** (z governance audit) Focus-ring drift decyzja + CardSurface variant + inventory liczniki.

### B) Should fix soon
- **B1. Taxonomy grup w sidebarze** (§4) — 6 grup, reorder "Przyciski" w górę. LabSidebar.tsx + EngineUiLab.tsx. Czysto nawigacyjne.
- **B2.** Dodać ImageCarousel discoverability w Media (MediaSection.tsx).
- **B3.** (governance) modern FavoriteButton → root index.ts; chip grey-900 razor → grey-500/600.
- **B4.** Reorg `docs/` (blueprints/ + history/).

### C) Cleanup later
- **C1.** Showcase Stepper (niewidoczny samodzielnie) — needs PO decision gdzie.
- **C2.** Ujednolicić specimen-width (wspólna konwencja zamiast inline per-sekcja: Layout/Surface/Media vs wzorcowy InputySection SPECIMEN_STYLE).
- **C3.** Martwa `.eui-carousel-*` rodzina (governance C1); `formatPrice` dedup (governance C2); `mergeClass` → wspólny `cx` (governance B1).
- **C4.** Wydzielić Sheety/Modale z Powierzchnie (needs PO decision).
- **C5.** master-plan v2.4 → archiwum; blueprinty → nagłówek statusu.

### D) Acceptable differences (świadome — NIE ruszać)
- Foundations(tokeny) vs Typography(komponenty) — poprawny podział (tylko nazwa do fixu A2).
- Fundamenty vs Ruch — NIE duplikat (zweryfikowane).
- Popover/Stack/CardSurface "wszędzie" — natura primitive↔consumer warstwowania (udokumentować jako zasada, §5 DOC).
- ResultsSkeleton w Results (composite) vs Skeleton family — poprawna warstwa.
- DatePicker/GuestPicker/SearchBar osobno — celowa hierarchia composite.
- Domain composites root-level (Stepper/DatePickerTabs/SearchBar) — świadomy dług 8.5b, udokumentowany.
- Input readonly bg grey-50; Select-content radius 16px≠popover 24px; mobile Tab no-op — świadome (governance §9 D).

---

### Weryfikacja / "needs visual verify"
- Specimen-width spójność obok siebie (Layout/Surface/Media vs Inputy) — §6
- Radius popover-family obok siebie (24/16/12px) — §6
- Icon-scale mix w composite views (SearchBar) — §6
- Sidebar grupowanie (§4 B1) — needs PO decision

Każde finding ma plik/sekcję + rekomendację. Wszystkie 16 sekcji przejrzane (§2, brak pominięć). Zero zmian kodu / commitów — raport-only zgodnie z poleceniem.
