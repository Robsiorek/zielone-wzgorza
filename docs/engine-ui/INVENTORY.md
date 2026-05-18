> # ✅ CANONICAL — ENGINE UI SOURCE OF TRUTH
> **Dotyczy `.eui-*` / `--eui-*` / Manrope / Engine UI Lab / przyszłego booking frontu.**
> To jest **jedyne źródło prawdy** dla Engine UI design system.
> Stary admin / `.bubble` / Plus Jakarta = **legacy/transitional** → `docs/legacy/DESIGN_SYSTEM.md`.
> Styl/DNA (focus/border/radius/elevation/personality): **`docs/engine-ui/VISUAL-DNA.md`** (konstytucja stylu — pierwszeństwo przed historycznymi blueprintami).
> Nowy czat AI: zacznij tutaj + `VISUAL-DNA.md` + `LAB-CONVENTIONS.md`. Mapa: `docs/README.md`.

---

# Engine UI — Inventory Map

> Wewnętrzny mental map Engine UI design system. Inventory-level — 1 linia per component, brak prop signatures. Zapobiega duplikacji w future Parts.
>
> **Ostatnia aktualizacja:** 2026-05-19 (post Part 13: Commerce + Utility — finalny Part). Reorganizacja docs/ 2026-05-16 (Stage 1 governance consolidation).

---

## TOC

- [Engine UI directories](#engine-ui-directories)
- [Components by category](#components-by-category)
- [Composite Components (root-level)](#composite-components-root-level)
- [Hooks](#hooks)
- [Lab integration](#lab-integration)
- [Design tokens](#design-tokens)
- [Roadmap](#roadmap)
- [Last update procedure](#last-update-procedure)

---

## Engine UI directories

`src/components/engine-ui/` zawiera 17 sub-directories + 20 root-level files. Total: ~129 plików.

> **Files** = literalna liczba plików w katalogu (incl. `index.ts` / utility `.ts`).
> Reproducible: `for d in src/components/engine-ui/*/; do echo "$d $(ls $d|wc -l)"; done`.
> Zaktualizowane 2026-05-16 (Stage 2 — counts zsynchronizowane z kodem).

| Directory | Files | Purpose |
|---|---|---|
| `a11y/` | 2 | Accessibility utilities (VisuallyHidden + mergeRefs) |
| `button/` | 8 | Button primitives |
| `chip/` | 9 | Badge / Chip / Tag family |
| `feedback/` | 4 | Alert/Banner + EmptyState/ErrorState + Tooltip (Part 12) |
| `hooks/` | 10 | Custom React hooks |
| `input/` | 10 | Field compound + TextField + Textarea + Select + useFieldId (Parts 10a/10b) + Checkbox/CheckboxGroup/Radio/RadioGroup/Switch (Part 11) |
| `interaction/` | 1 | Pressable wrapper |
| `layout/` | 11 | Stack, Inline, ActionRow etc. |
| `loading/` | 3 | Spinner + LoadingOverlay (Part 9) |
| `media/` | 10 | Image + media frames + overlays |
| `nav/` | 6 | Chevron, NavigationArrow, TabTrigger etc. |
| `overlay/` | 6 | BottomSheet + Backdrop + DragHandle |
| `primitives/` | 1 | Popover (Radix wrapper) |
| `skeleton/` | 7 | Skeleton family (Part 9) |
| `surface/` | 4 | CardSurface, PanelSurface, ScrollFade |
| `text/` | 12 | Typography primitives + NightsMeta/PriceBadge (Part 13) |
| `tokens/` | 5 | Token const exports + cx() joiner (.ts) |
| (root) | 20 | Composite/legacy components |

---

## Components by category

### Skeleton

- `Skeleton` — foundation primitive z shimmer animation (Part 9 Stage 1)
- `SkeletonText` — multi-line text placeholder z lastLineWidth (Part 9 Stage 2)
- `SkeletonCircle` — avatar/icon placeholder z size tokens (Part 9 Stage 3)
- `SkeletonImage` — aspect-ratio image placeholder, reuse Part 8 (Part 9 Stage 4)
- `SkeletonCard` — composite card layout placeholder (Part 9 Stage 5)
- `SkeletonRegion` — a11y wrapper z aria-busy + conditional aria-live (Part 9 Stage 6)

### Loading

- `Spinner` — standalone loading spinner, 3 variants × 3 sizes (Part 9 Stage 7)
- `LoadingOverlay` — backdrop blur overlay, container/fullscreen variants (Part 9 Stage 8)

### Text (Typography primitives)

- `Text` — root typography primitive, 10 variants × 9 colors
- `HelperText` — form field helper text, 4 variants z auto-icons
- `MetaText` — sekundarne metadata (timestamps, hints)
- `SectionHeading` — heading dla content sections
- `Eyebrow` — over-title small label
- `PriceText` — formatowana cena
- `EmptyStateText` — text dla empty states
- `InlineMeta` — inline metadata separator
- `SecondaryLink` — pomocniczy link styling
- `NightsMeta` — preset MetaText: liczba nocy + kanoniczny formatter `formatNights`/`nightsLabel` (Part 13 Stage 1)
- `PriceBadge` — promo-flag przy cenie; token `var(--eui-success)`, klasa `.eui-price-flag` (Part 13 Stage 2)

### Chip (Badge family)

- `Badge` — color-coded status badge
- `Chip` — interactive selectable chip
- `FilterChip` — filter selector z toggle
- `InlineBadge` — small inline badge
- `RatingPill` — gwiazdki + numerical rating
- `StatusDot` — small status indicator
- `Tag` — tag z optional close action
- `TinyBadge` — minimalny badge dla counts/dots

### Button

- `Button` — primary button primitive
- `IconButton` — icon-only button z accessibility
- `BackButton` — wstecz/cofnij button
- `CloseButton` — × close button (modals/dismissible)
- `FavoriteButton` — heart toggle button
- `ShareButton` — share action button
- `ButtonGroup` — segmented button container

### Input (Form fields foundation)

- `Field` — compound root z FieldContext (id propagation, aria wiring) (Part 10a Stage 1)
- `FieldLabel` — label slot z auto htmlFor (Part 10a Stage 1)
- `FieldControl` — wrapper injektujący id/aria/required/disabled przez cloneElement (Part 10a Stage 1)
- `FieldMessage` — helper/error message slot z auto aria-describedby (Part 10a Stage 1)
- `TextField` — single-line input z error popover (Part 10a Stage 2)
- `Textarea` — multi-line input z error popover (Part 10a Stage 3)
- `Select` — single-select dropdown; Popover (desktop) / BottomSheet (mobile); aria-activedescendant pattern (Part 10b)
- `Checkbox` — native input sr-only + custom box; tri-mode; indeterminate (Part 11 Stage 1)
- `CheckboxGroup` — multi-select + "select all" indeterminate; FieldContext-aware (Part 11 Stage 1)
- `Radio` — native input sr-only + custom dot; tri-mode (Part 11 Stage 2)
- `RadioGroup` — single-select; shared name → native keyboard arrows; role=radiogroup (Part 11 Stage 2)
- `Switch` — native input type=checkbox role=switch + custom track/thumb (Part 11 Stage 3)
- `useFieldId` — hook generujący stable ID set (label/control/error) (Part 10a Stage 1)

### Feedback (Part 12)

- `Alert` — inline severity box (info/success/warning/error); role=alert|status (Part 12 Stage 1)
- `Banner` — page-level full-width square modyfikator Alert (Part 12 Stage 1)
- `EmptyState` — ikona+EmptyStateText+opcjonalny CTA; tone neutral/error (Part 12 Stage 2)
- `ErrorState` — preset EmptyState (error tint + onRetry) (Part 12 Stage 2)
- `Tooltip` — @floating-ui chip; hover+focus+tap-toggle (D6); portal root=.engine-root (Part 12 Stage 3)

### Layout

- `Stack` — flex column z gap tokens
- `Inline` — flex row z gap + align
- `ActionRow` — title + actions row
- `InlineActions` — group inline buttons
- `Divider` — horizontal/vertical divider line
- `SectionBlock` — content block z header
- `Spacer` — flex spacer pusher
- `StickyBar` — sticky bottom bar
- `Toolbar` — toolbar container
- `gap-size.ts` — gap token utility (NIE component)

### Media

- `MediaFrame` — image container z aspect-ratio
- `ImagePlaceholder` — fallback dla missing/loading images
- `MediaBadge` — overlay badge na media
- `MediaOverlay` — overlay z backdrop dla media
- `FavoriteOverlay` — heart overlay na media
- `GalleryNavButton` — strzałka prev/next w galleries
- `ImageCounter` — "1/N" wskaźnik w galleries
- `ThumbnailStrip` — pasek miniaturek
- `aspect-ratio.ts` — AspectRatio type + aspectToValue() (NIE component)

### Nav

- `Chevron` — strzałka indicator (›)
- `NavigationArrow` — circular arrow button (gallery prev/next)
- `PaginationDot` — kropka indicator pagination
- `SortTrigger` — sort selector trigger
- `TabTrigger` — tab button trigger

### Overlay (Modal/Sheet primitives)

- `BottomSheet` — mobile-first bottom sheet, 3 height variants (full/auto/half)
- `Backdrop` — modal backdrop z blur
- `DragHandle` — drag handle dla swipe-to-dismiss
- `SheetHeader` — sheet/modal header
- `SheetFooter` — sheet/modal footer

### Surface

- `CardSurface` — card-styled wrapper
- `PanelSurface` — panel-styled wrapper
- `ScrollFade` — scroll edge fade overlay

### Primitives

- `Popover` — Radix popover wrapper z scroll-dismiss

### Interaction

- `Pressable` — touchable wrapper z press feedback

### A11y

- `VisuallyHidden` — visually hidden but screen-reader-readable
- `mergeRefs.ts` — utility do mergowania React refs (NIE component)

### Tokens

- `tokens/index.ts` — main tokens barrel
- `tokens/interaction.ts` — interaction state tokens (hover, focus, etc.)
- `tokens/motion.ts` — motion duration/easing tokens
- `tokens/shape.ts` — radius/border tokens

---

## Composite Components (root-level)

19 components na root-level `engine-ui/` to legacy/composite z Parts 1-8 (przed organizacją w sub-directories). Część zawiera reusable patterns wciąż używane w booking flow + Lab demos.

- `AvailabilityBadge` — wskaźnik dostępności (booked/available)
- `DatePickerTabs` — tabs dla picker dat (specific/flexible)
- `DateRangePicker` — picker zakresu dat (check-in / check-out)
- `FeatureChips` — grid feature chips dla resource details
- `FlexibleDatePicker` — flexible-dates picker (np. "weekend")
- `GuestPicker` — picker liczby gości (adults/children/infants)
- `ImageCarousel` — carousel dla galerii zdjęć
- `LegacyFavoriteButton` — stary FavoriteButton (przed Part 2 refactor)
- `Modal` — legacy modal component (NIE BottomSheet)
- `PopoverItem` — menu item w popover (NIE Radix wrapper)
- `PriceBlock` — block z ceną + rozkładem (per-night, total, etc.)
- `ResultCard` — card dla pojedynczego resource w result list
- `ResultsEmptyState` — empty state z 0 wyników
- `ResultsHeader` — header z liczbą wyników + sort
- `ResultsSkeleton` — skeleton dla results list (Part 9 Stage 10 refactored na primitive composition)
- `results-types.ts` — TypeScript types dla results domain (NIE component)
- `SearchBar` — main search bar (combined date+guest+location)
- `SegmentedControl` — segmented toggle (3-state radio)
- `Stepper` — multi-step indicator + nav

---

## Hooks

9 custom hooks z `hooks/` + 1 hook z `input/`. Wszystkie używają namespace import (`import * as React from "react"`) — codebase convention.

- `useDelayedLoading` — anti-flash debouncing dla skeleton/spinner (Part 9 Stage 9)
- `useFieldId` — stable ID set dla Field compound (Part 10a Stage 1, lokalizacja: `input/`)
- `useFocusTrap` — focus trap dla modal/sheet contexts
- `useFocusVisible` — focus-visible state detection
- `useHover` — pointer hover state (NIE touch)
- `useIsMobile` — viewport ≤767px detection (Part 10b Stage 0; extracted from BottomSheet for reuse by Select)
- `useKeyboardShortcut` — keyboard shortcut binding z cleanup
- `usePress` — press/active state z multi-input support
- `useReducedMotion` — OS-level prefers-reduced-motion
- `useWidgetTheme` — theme application dla embedded widgets

---

## Lab integration

`/admin/engine-ui-lab` — internal preview surface. **16 sections + 7 helpers.**

**Route:** `src/app/admin/(panel)/engine-ui-lab/page.tsx`

### Lab helpers

- `EngineUiLab` — main entry (mounts sections + sidebar)
- `LabSidebar` — sticky nav z IntersectionObserver active tracking
- `LabSection` — section wrapper z id + title + icon + description
- `ComponentShowcase` — 2-zone preview card (white + grey info)
- `Specimen` / `SpecimenInfo` — metadata badges
- `DebugPanel` — debug controls panel
- `CodeSnippet` — code block z copy button (`code` prop, NIE children)

### Lab sections

| # | id | label (PL) | Demonstrates |
|---|---|---|---|
| 1 | `foundations` | Fundamenty | Tokens (colors, typography, spacing) |
| 2 | `motion` | Ruch | Easings + durations + reduced-motion |
| 3 | `surface` | Powierzchnie | CardSurface, PanelSurface, ScrollFade |
| 4 | `nav` | Nawigacja | Chevron, NavigationArrow, PaginationDot, SortTrigger, TabTrigger |
| 5 | `chip` | Tagi i badge'y | Wszystkie `chip/*` components |
| 6 | `typography` | Typografia | Text + HelperText + 7 typography composites |
| 7 | `layout` | Layout | Stack, Inline, ActionRow, Divider, etc. |
| 8 | `media` | Media | MediaFrame, ImagePlaceholder, ThumbnailStrip + overlays |
| 9 | `popovers` | Popovery | Popover primitive z scroll-dismiss |
| 10 | `datepicker` | Picker dat | DateRangePicker + FlexibleDatePicker + DatePickerTabs |
| 11 | `guestpicker` | Picker gości | GuestPicker + Stepper |
| 12 | `searchbar` | Pasek wyszukiwania | SearchBar (combined widget) |
| 13 | `results` | Warstwa wyników | ResultsHeader + ResultCard + ResultsSkeleton + ResultsEmptyState |
| 14 | `buttons` | Przyciski | Button + IconButton + 5 specialized buttons |
| 15 | `skeleton` | Stany ładowania | Skeleton family + Spinner + LoadingOverlay + useDelayedLoading (Part 9 NEW) |
| 16 | `inputy` | Inputy | Field compound + TextField + Textarea + error popover (Part 10a) + Select (Part 10b) + Form Controls (Part 11) |
| 17 | `feedback` | Feedback | Alert/Banner + EmptyState/ErrorState + Tooltip (Part 12) |
| 18 | `commerce` | Commerce / Utility | NightsMeta + PriceBadge (Part 13 NEW) |

---

## Design tokens

Wszystkie tokeny w `src/styles/globals.css` linie 502-665. **~120 `--eui-*` tokens + 9 semantic Tailwind tokens** (HSL triplets).

### Token families

| Family | Count | Range/Values |
|---|---|---|
| Grey scale | 13 | grey-0 (#fff) → grey-1000 (#000), hex literals |
| Surface / text / border | 8 | text-primary/secondary/muted, surface, surface-raised, border, border-strong, border-focus |
| Brand + semantic colors | 14 | brand + foreground, danger/success/warning/info × 3 (color + foreground + bg-soft), brand-soft, brand-softer |
| Typography (font-*) | 14 | family + 4 weights + 10 sizes (xs 12px → 5xl 48px) |
| Line-height + tracking | 4 + 4 | tight/snug/normal/relaxed; display/hero/title/normal |
| Spacing | 12 | space-0 (0) → space-11 (80px) |
| Radius | 10 | xs (4) → 4xl (32) + pill/full (9999) |
| Elevation | 5 | elev-1 → elev-5 (box-shadow stacks) |
| Material (frosted glass) | 6 | thin/regular/thick × bg/filter |
| Easing | 7 | standard/enter/exit/linear + 3 spring variants |
| Duration | 5 | instant 100ms → slower 580ms |
| Z-index | 6 | base (0) → toast (200) |
| Focus | 1 | focus-ring composite |

### Semantic Tailwind tokens (HSL triplets)

9 tokens × 3 sets (light/dark/widget): `--background`, `--foreground`, `--card`, `--primary`, `--muted`, `--accent`, `--destructive`, `--border`, `--ring`.

**Source of truth:** `src/styles/globals.css` linia 502+ (token defs) i linie 10-72 (semantic Tailwind variants).

### Token format conventions

- Grey scale + semantic colors → **hex literals** (np. `--eui-grey-500: #717171`, `--eui-danger: #dc2626`)
- Brand → **HSL triplet z hsl() wrapper** (np. `--eui-brand: hsl(var(--primary, 214 89% 52%))`)
- Empirical rule (Part 9 lessons): hex tokeny używaj raw `var(...)`, HSL triplet tokeny owijaj `hsl(var(...))`. NIE mieszać.

---

## Roadmap

- ✅ Part 1-8 — Foundation, Buttons, Forms, Nav, Surface, Typography, Layout, Media
- ✅ Part 8.5a — Refactor legacy (ResourceCard, ImageCarousel, Stepper, GuestPicker, ResultCard, SearchBar)
- ✅ Part 9 — Skeleton + Loading System (11 stages, 8 components + 1 hook + 1 refactor)
- ✅ Part 10a — Inputs Foundation (Field compound + TextField + Textarea + useFieldId + error popover)
- ✅ Part 10b — Select (Popover desktop + BottomSheet mobile; aria-activedescendant; greenfield listbox/option)
- ✅ Governance consolidation (Stage 1→3.6) — docs source-of-truth, Visual DNA freeze, focus/radius convergence
- ✅ **Part 11 — Form Controls**: Checkbox · CheckboxGroup · Radio · RadioGroup · Switch (tri-mode, native+custom, B-neutral focus)
- ✅ **Part 12 — Feedback + State**: Alert · Banner · EmptyState · ErrorState · Tooltip (tokeny semantic, B-neutral focus, @floating-ui portal=.engine-root). Toast → odroczony do **Part 12.1** (osobna architektura: useToast/Provider/queue)
- ✅ **Part 13 — Commerce + Utility** (final, przycięty w pre-checku): **NightsMeta** (+ kanoniczny `formatNights`/`nightsLabel`) · **PriceBadge** (token `var(--eui-success)`, `.eui-price-flag`, addytywnie — PriceBlock/ResultCard nietknięte, migracja = cleanup-later). **DROP** (PO D1, zero duplikatów dla odkrywalności): ReviewSummary→`RatingPill`, PolicyLink→`SecondaryLink external`, AmenityChip→`FeatureChips`. **DEFER** (PO D2, brak popytu engine-ui — popyt w legacy admin = nie-konsument): SortMenu · Pagination · Breadcrumb
- ⬜ Part 14 — (free / TBD): rezerwa na odroczone SortMenu/Pagination/Breadcrumb gdy booking front realnie ich potrzeba

> **Decyzje PO (2026-05-17):** Slider deferred (NIE w Part 11 MVP) · FilterPill
> NIE robimy (FilterChip wystarcza) · SegmentedControl/Stepper zostają root-level
> (ewent. przeniesienie → 8.5b) · Part 13+14 scalone w Part 13.
> Zakres komponentów = canonical; szczegóły przez pre-check/blueprint per Part.

---

## Last update procedure

Po każdym Part deploy update'uj ten dokument:

1. Dodaj nowe components do appropriate category section (1 linia per component, format: `` `Name` — purpose (Part X) ``).
2. Update **Engine UI directories** count jeśli new directory created.
3. Update **Lab integration** section table jeśli new Lab section dodana.
4. Update **Roadmap** — mark completed Part with ✅.
5. Update top header **Ostatnia aktualizacja** date.
6. Commit message: `chore(docs): update Engine UI inventory (post Part X)`.

**Plik path:** `docs/engine-ui/INVENTORY.md` (przeniesiony z `docs/ENGINE-UI-INVENTORY.md` w reorg 2026-05-16)

**Cel:** prevent duplikację (np. zanim zaczniesz Part 11, sprawdź czy podobne components już istnieją); maintain mental map systemu dla future Parts.
