# Engine UI — Full System Governance & Source-of-Truth Audit

**Data:** 2026-05-16 · **Typ:** READ-ONLY (zero kodu / commitów / usuwania / refactorów)
**Konsoliduje:** `AUDIT-engine-ui-lab-governance.md` + `AUDIT-engine-ui-lab-full-scan.md` + nowa weryfikacja źródeł
**Framing (od PO):** Engine UI = **NOWA PRAWDA / future canonical**. Booking front + admin `.bubble` = **legacy/transitional do migracji**. Ten audyt ocenia z tej perspektywy — nie traktuje `.bubble`/DESIGN_SYSTEM jako równorzędnego systemu, lecz jako legacy do zdemotowania.

Każdy finding: **severity** · plik/sekcja · dlaczego problem · drift vs świadome · rekomendacja. Bez AI-optimismu — mocne strony też nazwane wprost.

---

# Executive summary

- **Engine UI ma już realną, czystą osobowość techniczną.** Namespace `.eui-*` jest izolowany: **zero `.bubble`, zero raw Tailwind w primitywach** (zweryfikowane na surface/button/input). To mocna strona — system jest technicznie odseparowany od legacy, nie "przemieszany".
- **Największy problem to NIE kod — to source-of-truth.** `docs/DESIGN_SYSTEM.md` (v1.8, kwiecień 2026) deklaruje w nagłówku: *"Ten plik jest JEDYNYM źródłem prawdy dla stylu wizualnego panelu. Czytaj go na starcie KAŻDEGO czatu."* — ale opisuje **legacy admin `.bubble` / Plus Jakarta Sans / `<BubbleSelect>`**, czyli system, który ma być WYGASZONY. Nowy czat AI czytający ten plik zbuduje deprecated system. **To jest najpoważniejszy governance defect w całym projekcie.** [CRITICAL]
- **Booking front jest legacy w ~95%.** Tylko `ResourceCard.tsx` używa `@/components/engine-ui`; reszta (ExploreView, StepResults, StepClient, BookingWidget, StepQuote) na `.bubble`. To zgodne z framingiem (transitional), ale potwierdza: Engine UI to dziś **wyspa**, nie front. [INTENTIONAL / known]
- **Visual DNA: jedna realna niespójność tożsamościowa** — focus philosophy. Inputy: miękki neutralny grey halo (B-neutral). Reszta systemu (`[class*="eui-"]:focus-visible`): brand-blue podwójny ring (`--eui-focus-ring`). Dwa języki focusu w jednym systemie. [DRIFT, średni-wysoki]
- **CardSurface contract za słaby** → ResultCard i ResourceCard obchodzą primitive `!important`-em (`!bg-transparent !border-0 !shadow-none` / `!border-2`). Recurring (zgłoszone w REPORT-part8.5a P1, nadal otwarte). [DRIFT, średni]
- **Lab wewnętrznie spójny.** 16 sekcji, sidebar==render 1:1, helpery jednorodne. Duplikacje to w 90% świadome warstwowanie (primitive→consumer, tokens→components). Jedna realna kolizja: showcase "Typografia" w Fundamentach vs sekcja Typografia. [DRIFT, niski — tylko nazwa]
- **Drobne, policzalne długi:** `mergeClass` 5×, `formatPrice` 2×, martwa rodzina `.eui-carousel-*`, chip `grey-900` razor hover (globals.css:4717), inventory liczniki +6, `docs/` płaski (3 BLUEPRINT + 3 AUDIT + 2 REPORT + 2 PROMPT + 2 master-plan luzem). [mix DRIFT/cleanup]
- **Korekta poprzedniego audytu:** `FavoriteButton` (modern) **JEST** eksportowany z root `index.ts:227` — wcześniejsze stwierdzenie o braku parity było błędne. Realny problem: ResultCard importuje `LegacyFavoriteButton` zamiast wyeksportowanego modern. Barrel parity = OK.
- **Werdykt skrótem:** Engine UI jest technicznie zdrowym, młodym systemem z czystą izolacją, ale **jego tożsamość jest podkopywana nie przez kod, lecz przez dokumentację, która wskazuje nowym czatom legacy jako prawdę.** Naprawa source-of-truth governance > naprawa jakiegokolwiek komponentu.

---

# What Engine UI currently IS

Faktyczny stan (nie aspiracja):

- **Technicznie:** ~119 plików, 17 podkatalogów `engine-ui/` + 20 root-level composites; 16 sekcji Lab; pełna skala tokenów (`--eui-*`: 10 radius, 12 space, 13 grey, 5 elev, 1 focus-ring); namespace `.eui-*` czysty.
- **Dojrzałe rodziny (source-of-truth, zero legacy peerów):** Typography (`text/*`), Layout (`layout/*`), Loading (`skeleton/*`+`loading/*`), Media (`media/*`), Nav micro (`nav/*`), Chip (`chip/*`), Inputs primitives (`input/*`: Field/TextField/Textarea/Select).
- **Niedokończone (świadomy dług 8.5b, udokumentowany w JSDoc):** domain composites root-level — GuestPicker, SearchBar, Stepper, DatePickerTabs, SegmentedControl, ResultCard. Częściowo zrefaktorowane na primitywy, z `!important` bypassami i pill-shell coupling.
- **Zasięg produkcyjny:** wyspa. 1 komponent na booking froncie (ResourceCard). Reszta frontu i admin = legacy `.bubble`.
- **Osobowość wizualna:** Airbnb-like premium — białe inputy, miękkie border-strong (grey-300), neutralny soft focus halo, radius sm (8px) dla kontrolek, Manrope. Spójna dla inputów/Select po ostatnich rundach PO. Reszta systemu (Button/Chip/Card) wciąż na starszym brand-blue focus ring → patrz Visual DNA.

---

# What is legacy vs canonical

| Warstwa | Status | Dowód |
|---|---|---|
| `engine-ui/*` + `engine-ui-lab/*` + `.eui-*` + `--eui-*` + Manrope | **CANONICAL (future truth)** | Framing PO; namespace czysty; aktywnie rozwijany (Part 8.5a→10b) |
| `ENGINE-UI-INVENTORY.md` + `globals.css --eui-*` + `LAB-CONVENTIONS-responsive.md` | **CANONICAL docs** | Aktualizowane post-Part; opisują realny stan |
| `booking/ResourceCard.tsx` | **CANONICAL beachhead** | Jedyny konsument engine-ui na froncie |
| Booking front (ExploreView/StepResults/StepClient/BookingWidget/StepQuote…) | **LEGACY / transitional** | `.bubble` klasy; do migracji na Engine UI |
| Admin panel `.bubble` / `.btn-bubble` / `.input-bubble` / `<BubbleSelect>` | **LEGACY** | Stary system; DESIGN_SYSTEM.md go opisuje |
| `docs/DESIGN_SYSTEM.md` (v1.8) | **LEGACY udający CANONICAL** [CRITICAL] | Nagłówek "JEDYNE źródło prawdy KAŻDEGO czatu" — opisuje legacy `.bubble`/Plus Jakarta |
| `LegacyFavoriteButton.tsx` (root) | **LEGACY peer** | Modern `button/FavoriteButton` istnieje i jest eksportowany; ResultCard wciąż na legacy |
| `.eui-carousel-*` rodzina CSS | **LEGACY martwy kod** | Zastąpiona `.eui-image-carousel-track` |
| `master-plan-v2_4.md` | **LEGACY** | Współistnieje z v2_5 (nowszy) |
| BLUEPRINT-part8.5a/9/10, REPORT-*, PROMPT-CLI-*, CLOSURE-* | **HISTORY** (nie normatywne) | Operacyjne/post-mortem; nie opisują "co jest", lecz "co robiono" |

---

# Current system identity

**Szczerze, bez optymizmu:**

- **Czy Engine UI ma wyraźną osobowość?** TECHNICZNIE tak (czysty namespace, tokeny, primitywy). WIZUALNIE — w 80%. Inputy/Select/Field mają już dopracowaną, jednorodną osobowość premium (Airbnb-like) po wielu rundach PO. Ale Button/Chip/Card focus nadal mówi innym językiem (brand-blue ring) niż inputy (neutral halo).
- **Czy czuć kilka stylów?** TAK, dwa: (1) "stary Engine UI" — brand-blue `--eui-focus-ring`, chip `grey-900` razor hover; (2) "nowy Engine UI" — B-neutral soft focus, białe inputy, miękki border. Różnica narosła przez iteracje PO, które dotknęły TYLKO inputy.
- **Co najbardziej psuje spójność?** Focus philosophy split (input vs reszta). Drugorzędnie: CardSurface bypass `!important` (sygnał że primitive nie wyraża intencji kart).
- **Co wygląda najbardziej legacy?** `.eui-chip-interactive...outline:hover { grey-900 }` (czarny razor — dokładnie to co PO odrzucił dla inputów); martwa rodzina `.eui-carousel-*`; `LegacyFavoriteButton`.
- **Co wygląda najbardziej future-canonical?** `input/*` (Field/TextField/Textarea/Select) — tri-mode API, B-neutral focus, PopoverItem-style opcje, Airbnb white bg. To jest wzorzec docelowej osobowości; reszta systemu powinna do niego konwergować, nie odwrotnie.

---

# Lab architecture audit

- **Struktura:** `EngineUiLab.tsx` → `SIDEBAR_ITEMS` (16) → render 1:1 z sidebarem (zero rozjazdu, zweryfikowane). Helpery jednorodne: `ComponentShowcase` (white preview + grey info), `LabSection`, `SpecimenInfo`, `DebugPanel`, `CodeSnippet`, `LabSidebar` (sticky, IntersectionObserver). [✅ mocna strona]
- **Płaska lista 16 bez grup** — form-controls rozproszone (Inputy #16, DatePicker #10, GuestPicker #11, SearchBar #12, przedzielone Results/Buttons/Skeleton). Przyciski (fundament) na poz. 14. [DRIFT nawigacyjny, niski — UX, nie bug]
- **Braki odkrywalności:** `ImageCarousel` i `Stepper` nie mają żadnego miejsca w sidebarze — tylko wewnątrz ResultCard/GuestPicker. Konsument Lab ich nie znajdzie. [DRIFT, niski]
- **Helpery = czysta governance** — jeden wzorzec prezentacji wszędzie. [✅]

---

# Section-by-section audit

(Pełna tabela 16 sekcji: `AUDIT-engine-ui-lab-full-scan.md` §2. Tu — esencja + status.)

| # | Sekcja | Verdykt | Severity |
|---|---|---|---|
| 1 | Fundamenty | Tokeny OK; showcase `title="Typografia"` koliduje nazwą z #6 | niski (rename) |
| 2 | Ruch | Czyste, brak dup z Fundamentami (zweryfikowane) | ✅ |
| 3 | Powierzchnie | CardSurface primitive OK; bypass `!important` to problem PRIMITIVE nie sekcji | średni (patrz Primitive) |
| 4 | Nawigacja | Micro-nav, jasne miejsce | ✅ |
| 5 | Tagi i badge'y | OK; chip grey-900 razor = problem CSS | niski (CSS) |
| 6 | Typografia | Czyste, "zero dup tokenów" w desc; kolizja nazwy z #1 | niski |
| 7 | Layout | Stack/Inline "wszędzie" = natura primitywów, NIE dup | ✅ |
| 8 | Media | OK; brak ImageCarousel discoverability; specimen-width inny model | niski |
| 9 | Popovery | Primitive↔consumer warstwa, świadome | ✅ |
| 10 | Picker dat | OK; rozproszenie form-family (taxonomy) | niski |
| 11 | Picker gości | OK; Stepper niewidoczny samodzielnie | niski |
| 12 | Pasek wyszukiwania | Composite top, hierarchia celowa | ✅ |
| 13 | Warstwa wyników | ResultCard bypass CardSurface; domain composites poza Lab | średni |
| 14 | Przyciski | Pozycja za nisko; LegacyFavoriteButton w ResultCard | niski |
| 15 | Stany ładowania | Rodzina zebrana poprawnie | ✅ |
| 16 | Inputy | Wzorcowy SPECIMEN_STYLE; oddzielony od form-family | niski |

**Żadna sekcja nie jest czystym duplikatem.** Jedna kolizja nazw (#1↔#6). Reszta ⚠️ = warstwowanie do udokumentowania lub porządkowanie nawigacji.

---

# Visual DNA audit

| Oś | Stan | Drift vs świadome | Severity · Rekomendacja |
|---|---|---|---|
| **Focus philosophy** | Inputy: `box-shadow 0 0 0 3px color-mix(grey-900 8%)` neutralny halo. Reszta: `--eui-focus-ring` = brand-blue podwójny ring na `[class*="eui-"]:focus-visible` | **DRIFT** (PO iteracje dotknęły tylko inputów) | **WYSOKI.** NEEDS DECISION: albo propagować B-neutral do `--eui-focus-ring` (cały system konwerguje do nowej osobowości), albo jawna reguła "inputy ≠ kontrolki akcji" w LAB-CONVENTIONS. Bez decyzji każdy nowy primitive losowo dziedziczy stary niebieski |
| **Border philosophy** | Inputy: grey-300 default → grey-500 hover/focus (miękkie). Chip outline:hover: **grey-900** razor (globals.css:4717) | DRIFT (relikt starego stylu) | średni. grey-900 → grey-500/600 dla spójności z nową osobowością |
| **Radius philosophy** | Kontrolki: sm 8px (spójne). Popover-family: Content 24px / Select-content 16px / PopoverItem 12px | częściowy drift | średni. needs visual verify czy 24 obok 16 wygląda jak jeden system |
| **Input philosophy** | Białe bg, border-strong, neutral focus, disabled=grey-100, readonly=grey-50 | ✅ ŚWIADOME (Airbnb pattern, dopracowane przez PO) | OK — to wzorzec docelowy |
| **Hover philosophy** | Inputy/Select: grey-500 border (po naprawie). Chip: grey-900. Card: brak/elevation | mieszane | niski (spójnie z border fix) |
| **Elevation** | 5 tokenów, Card via prop, popover elev-4 | ✅ spójne | OK |
| **Spacing** | 12-skala, Lab specimen po fixach (SPECIMEN_STYLE) | ✅ spójne po f6e95ae | OK; ujednolicić inline maxWidth w Layout/Surface/Media do wzorca InputySection |
| **Icon sizing** | 14/16/18/20/40px per kontekst | w większości uzasadnione | niski. needs visual verify w composite views (SearchBar) |
| **Motion language** | Spring overshoot = "premium signal", tokeny + demo | ✅ spójne, intencjonalne | OK |
| **Density / weight** | Kontrolki 36/44/52px, spójne mirror TextField↔Select | ✅ | OK |

**Werdykt DNA:** system ma JEDNĄ docelową estetykę (widać ją w `input/*`), ale **nie jest jeszcze w pełni zaaplikowana** — Button/Chip/Card focus to relikt poprzedniej epoki. To nie chaos, to niedokończona konwergencja.

---

# Primitive contract audit

| Primitive | Contract | Bypass / problem | Severity · Drift? |
|---|---|---|---|
| **CardSurface** | elevation/radius/interactive/padding — brak `variant` dla "bare"/"bordered" | ResultCard:`!bg-transparent !border-0 !shadow-none`; ResourceCard:`!border-2 !bg-card` | **średni, DRIFT.** Contract za słaby — nie wyraża realnych potrzeb kart. Recurring (8.5a P1, otwarte). Rec: `variant: "elevated"|"bare"|"bordered"` PRZED kolejnymi kartami |
| **Popover** (Radix) | size/align/side; reużywany przez Select/error/DatePicker/GuestPicker | brak bypassu — świadome warstwowanie | ✅ |
| `input/*` (Field/TextField/Textarea/Select) | tri-mode (compound/standalone/bare); FieldControl cloneElement | brak bypassu | ✅ wzorcowe |
| Button/IconButton | wrap Pressable | brak bypassu | ✅ |
| **LegacyFavoriteButton** vs `button/FavoriteButton` | dwa równoległe | ResultCard importuje legacy mimo że modern eksportowany z root | niski, DRIFT (consumer nie zmigrowany; nie barrel) |
| Layout (Stack/Inline) | gap-size token util | brak bypassu, współdzielony util | ✅ |

**Werdykt:** primitywy są naprawdę source-of-truth z JEDNYM wyjątkiem kontraktowym (CardSurface za słaby → `!important`). To nie "primitywy obchodzone wszędzie" — to jeden konkretny, powtarzalny gap.

---

# Duplication audit

(Pełne mapy: governance §3 + full-scan §3.) Esencja, z rozróżnieniem:

**Prawdziwa duplikacja (do konsolidacji):**
- `mergeClass()` 5× identyczne (DateRangePicker:120, Stepper:87, SearchBar:89, PopoverItem:81, GuestPicker:132). `cn()` w lib/utils istnieje ale twMerge-based (NIE dla `.eui-*`). → wspólny lekki `cx`. [średni]
- `formatPrice()` 2× (ResultCard:71, PriceBlock:31). [niski]
- Showcase `title="Typografia"` (Foundations) vs sekcja Typografia — kolizja NAZWY (treść = tokeny vs komponenty, sensowna). [niski, rename]
- `.eui-carousel-*` martwa rodzina vs `.eui-image-carousel-track`. [niski cleanup]
- Docs: 2 master-plan (v2.4 legacy + v2.5); DESIGN_SYSTEM vs ENGINE-UI-INVENTORY (różne systemy, kolizja autorytetu). [CRITICAL — patrz Docs governance]

**Świadome warstwowanie (NIE ruszać):**
- Popover (primitive) ↔ Select/DatePicker/GuestPicker/error (konsumenci).
- Stack/Inline/ActionRow w ~5 sekcjach = natura layout-primitywów.
- ResultsSkeleton (composite) ↔ Skeleton family (primitive).
- HelperText/PriceText w Typography ↔ użycia w Inputy/Results = komponent-w-kontekście.
- `.eui-popover-item` reuse w Select = intencjonalny wzorzec (visual reuse + poprawna semantyka listbox).

---

# CSS governance audit

- **Namespace:** `.eui-*` czysty — zero `.bubble`, zero raw Tailwind w primitywach (zweryfikowane). [✅ mocna strona]
- **`!important`:** tylko ResultCard/ResourceCard na CardSurface (parity-override, udokumentowane w komentarzu). Nie rozlane. [średni — to objaw słabego contractu, nie złej dyscypliny CSS]
- **Martwe klasy:** rodzina `.eui-carousel-*` (~100 linii, globals.css ~2511–2615) zastąpiona; część (`.eui-carousel-arrow`) może być wciąż ref. — wymaga grep przed usunięciem. [niski cleanup]
- **Relikt starego stylu:** `.eui-chip-interactive...outline:hover { border-color: grey-900 }` (4717) — czarny razor sprzeczny z nową osobowością inputów. [średni, DRIFT]
- **Stale komentarze:** zweryfikowano — brak realnej sprzeczności "contextual vs small" (komentarz odnosi się do propa, nie klasy). [OK]
- **Focus reguły globalne:** `.engine-root [class*="eui-"]:focus-visible { box-shadow: var(--eui-focus-ring) }` (brand-blue) vs nadpisania inputów (grey halo). [WYSOKI — patrz Visual DNA]

---

# Export / file governance audit

- **Barrel parity:** root `index.ts` eksportuje FavoriteButton (227), TextField/Textarea/Select (340+), Field family. **Parity OK** (korekta wcześniejszego błędnego findingu). [✅]
- **Niezmigrowany konsument:** ResultCard importuje `LegacyFavoriteButton` (root file) zamiast eksportowanego modern. To nie brak eksportu — to nieukończona migracja. [niski, DRIFT]
- **Orphan/legacy files:** `LegacyFavoriteButton.tsx` (świadomy peer, do usunięcia w 8.5b); root-level domain composites (świadomy dług, JSDoc-udokumentowane). [INTENTIONAL/known]
- **Discoverability drift:** ImageCarousel, Stepper — brak ekspozycji w Lab. [niski]
- **Inventory liczniki:** zaniżone +6 plików (hooks 8→10, layout 9→11, media 8→10, text 9→10, +button/chip/loading/nav/overlay/skeleton/surface po +1). [średni — canonical doc dryfuje]

---

# Docs governance audit

`docs/` płaski, ~20 plików, mieszane autorytety:

| Plik | Realny status | Problem |
|---|---|---|
| `DESIGN_SYSTEM.md` v1.8 | **LEGACY** (admin `.bubble`) | Nagłówek "JEDYNE źródło prawdy KAŻDEGO czatu" → **steruje nowe AI na legacy** [CRITICAL] |
| `ENGINE-UI-INVENTORY.md` | **CANONICAL** (engine-ui) | Liczniki +6 drift; brak wskazania że DESIGN_SYSTEM to inny/legacy system |
| `LAB-CONVENTIONS-responsive.md` | **CANONICAL** | OK (po fixach #3/#7) |
| `master-plan-v2_4.md` / `v2_5.md` | v2.4 LEGACY, v2.5 ? | Dwie wersje obok siebie, brak "SUPERSEDED" |
| `BLUEPRINT-part8.5a/9/10` | HISTORY (spec/intent) | Mogą udawać "co jest" zamiast "co planowano" |
| `REPORT-*`, `CLOSURE-*`, `PROMPT-CLI-*`, `AUDIT-*` (w tym ten) | HISTORY/operacyjne | Luzem obok canonical = szum dla nowego AI |
| `TIMELINE_*`, `UNIFIED_PANEL_SPEC`, `nginx-engine.conf` | Inne domeny (nie design system) | Mieszają zakresy w jednym folderze |

**Werdykt:** nowy czat AI wpuszczony w `docs/` NIE wie co jest prawdą. DESIGN_SYSTEM.md aktywnie kłamie o swoim zakresie. To jest mechanizm "rozjazdu przez zmianę czatów" w czystej formie.

---

# Recommended target structure

**Zasada:** jeden canonical wskaźnik na wejściu, legacy/history fizycznie oddzielone, Engine UI z własnym folderem docs.

---

# Exact proposed docs structure

```
docs/
  README.md                      ← NOWY. Mapa: "Engine UI = canonical → docs/engine-ui/.
                                    Admin .bubble = legacy → docs/legacy/DESIGN_SYSTEM.md.
                                    Nowy czat: czytaj docs/engine-ui/INVENTORY.md."
  engine-ui/                     ← CANONICAL (jedyna prawda Engine UI)
    INVENTORY.md                 (← ENGINE-UI-INVENTORY.md, + nagłówek "CANONICAL")
    LAB-CONVENTIONS.md           (← LAB-CONVENTIONS-responsive.md)
    DESIGN-DNA.md                ← NOWY (opcjonalnie): radius/focus/border philosophy spisane
  legacy/
    DESIGN_SYSTEM.md             ← PRZENIEŚĆ. Nagłówek: "LEGACY admin .bubble. NIE dla Engine UI."
    master-plan-v2_4.md
  history/
    blueprints/  BLUEPRINT-part8.5a|9|10.md
    reports/     REPORT-*, CLOSURE-*, PROMPT-CLI-*, AUDIT-*
  ops/           nginx-engine.conf, TIMELINE_*, UNIFIED_PANEL_SPEC.md
  master-plan-v2_5.md            ← canonical strategiczny (jeśli aktualny)
```

(To jest PROPOZYCJA — przeniesienia plików = osobna decyzja/zadanie, NIE w tym raporcie. Hard rule: zero usuwania/ruszania.)

---

# Exact proposed folder structure

`src/components/engine-ui/` — bez zmian strukturalnych teraz. Docelowo (post-8.5b): root-level domain composites (GuestPicker/SearchBar/Stepper/DatePickerTabs/SegmentedControl/ResultCard) → podkatalogi `domain/` lub odpowiednie rodziny, po dokończeniu refaktoru. [NEEDS DECISION — poza zakresem audytu]

---

# Exact proposed governance rules

1. **Jeden canonical entry:** `docs/README.md` wskazuje `docs/engine-ui/INVENTORY.md` jako jedyną prawdę. Każdy inny dokument MUSI mieć w nagłówku jeden z tagów: `CANONICAL` / `LEGACY` / `HISTORY` / `OPS`.
2. **DESIGN_SYSTEM.md:** nagłówek natychmiast zawęzić (NEEDS DECISION czy przenieść do legacy/) — "Dotyczy WYŁĄCZNIE admin `.bubble`. Engine UI: patrz docs/engine-ui/."
3. **Nowy primitive:** `engine-ui/<rodzina>/` + eksport z `<rodzina>/index.ts` ORAZ root `index.ts`. Demo Lab ≠ source-of-truth.
4. **Nowa sekcja Lab:** tylko nowa RODZINA. Wariant → nowy ComponentShowcase. Composite → sekcja tylko przy samodzielnej wartości.
5. **Inventory update:** po każdym merge zmieniającym pliki engine-ui/sekcje. **CI check** (skrypt: liczba plików vs inventory, fail przy rozjeździe) — jedyna trwała obrona; drift już wystąpił.
6. **Visual DNA:** jeden token focusu dla całego systemu. Wyjątek = jawna, udokumentowana reguła, nie milczący override.
7. **Primitive contract:** jeśli ≥2 konsumentów obchodzi primitive `!important`-em → to sygnał braku variantu, nie "potrzeba override". Rozszerzyć primitive.
8. **Legacy boundary:** `.bubble` i `.eui-*` nigdy w jednym komponencie. Migracja front→Engine UI: per-komponent, ResourceCard jako wzorzec.

---

# Must fix before Part 11

| # | Finding | Severity | Drift? | Rekomendacja |
|---|---|---|---|---|
| M1 | `DESIGN_SYSTEM.md` rości "JEDYNE źródło prawdy KAŻDEGO czatu", opisuje legacy | **CRITICAL** | DRIFT | Zawęzić nagłówek do admin `.bubble`; dodać `docs/README.md` z canonical pointerem. (dokumentacja — można zrobić bez kodu) |
| M2 | Focus philosophy split (input neutral vs system brand-blue) | WYSOKI | DRIFT | **NEEDS DECISION:** propagować B-neutral na `--eui-focus-ring` czy udokumentować wyjątek. Blokuje spójność każdego nowego primitive |
| M3 | CardSurface contract za słaby → `!important` bypass (recurring) | średni | DRIFT | Zaprojektować `variant: elevated\|bare\|bordered` przed kolejnymi kartami |
| M4 | Inventory liczniki +6; brak rozgraniczenia vs DESIGN_SYSTEM | średni | DRIFT | Poprawić liczniki; dopisać "Engine UI ≠ admin .bubble" |

---

# Should fix soon

| # | Finding | Severity | Rekomendacja |
|---|---|---|---|
| S1 | Rename Foundations showcase "Typografia" → "Skala typograficzna (tokeny)" | niski | FoundationsSection.tsx:139 |
| S2 | chip `grey-900` razor hover | średni | globals.css:4717 → grey-500/600 |
| S3 | `mergeClass` 5× → wspólny `cx` (NIE cn()/twMerge) | średni | engine-ui/(tokens\|a11y)/cx.ts |
| S4 | ResultCard → modern FavoriteButton (eliminacja LegacyFavoriteButton path) | niski | przy 8.5b |
| S5 | Lab taxonomy: grupy w sidebarze + "Przyciski" wyżej | niski | LabSidebar.tsx + EngineUiLab.tsx |
| S6 | ImageCarousel + Stepper discoverability w Lab | niski | MediaSection / InputySection |

---

# Cleanup later

- C1: martwa `.eui-carousel-*` rodzina (po grep-weryfikacji `.eui-carousel-arrow`).
- C2: `formatPrice` dedup (ResultCard+PriceBlock → wspólny eksport).
- C3: ujednolicić specimen-width (Layout/Surface/Media inline → wzorzec InputySection SPECIMEN_STYLE).
- C4: `docs/` reorg (engine-ui/ + legacy/ + history/ + ops/) — osobne zadanie.
- C5: master-plan v2.4 → legacy/; blueprinty → nagłówek HISTORY.
- C6: radius popover-family ujednolicić (needs visual verify).

---

# Acceptable intentional differences

- Tokeny (Foundations) vs komponenty (Typography) — poprawny podział (tylko nazwa S1).
- Fundamenty vs Ruch — NIE duplikat (zweryfikowane).
- Popover/Stack/CardSurface "wszędzie" — natura primitive↔consumer.
- ResultsSkeleton w Results vs Skeleton family — poprawna warstwa.
- DatePicker/GuestPicker/SearchBar osobno — celowa hierarchia composite.
- Root-level domain composites — świadomy dług 8.5b, JSDoc-udokumentowany.
- Input readonly bg grey-50; Select-content radius 16≠popover 24; mobile Tab no-op — świadome (governance §9 D).
- Booking front legacy `.bubble` — świadomy stan transitional (framing PO).
- `--eui-focus-ring` brand-blue — był świadomą decyzją PIERWOTNIE; stał się driftem dopiero gdy inputy odeszły do B-neutral. NIE bug per se — NEEDS DECISION którą stronę uznać za canonical.

---

# Final verdict

**Engine UI jest zdrowym, młodym systemem z czystą architekturą techniczną — ale jego TOŻSAMOŚĆ jest niedokończona i podkopywana przez dokumentację, nie przez kod.**

Mocne strony (realne, nie optymizm): czysty namespace bez przecieków legacy, dojrzałe rodziny primitywów, wzorcowy `input/*` jako docelowa osobowość, spójna struktura Lab i helperów, świadomie udokumentowany dług 8.5b.

Najcięższy problem **nie jest w `src/`** — jest w `docs/`: legacy `DESIGN_SYSTEM.md` mówi nowym czatom AI, że stary `.bubble` to "jedyna prawda". Dopóki to stoi, każdy nowy AI ma 50% szans pójść w złym kierunku — i to jest dokładny mechanizm rozjazdu, który zaobserwowałeś. **Naprawa source-of-truth governance (M1) ma wyższy priorytet niż jakikolwiek fix komponentu.**

Drugi problem: system jest w połowie konwergencji do nowej osobowości (B-neutral, Airbnb white) — inputy już tam są, Button/Chip/Card jeszcze nie. To nie chaos, to niedokończona migracja stylu (M2 — NEEDS DECISION).

Nic w kodzie nie jest "zepsute". Wszystko jest spójne LUB świadomie odłożone LUB wymaga JEDNEJ decyzji kierunkowej (focus). Engine UI jest bliżej "future canonical" niż się wydaje — pod warunkiem, że governance dokumentacji przestanie wskazywać legacy jako prawdę.

**FORCED HALT. Zero implementacji. Raport-only zgodnie z hard rules.**
