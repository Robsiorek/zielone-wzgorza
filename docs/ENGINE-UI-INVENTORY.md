# Engine UI — Inventory Map

> Wewnętrzny mental map Engine UI design system. Inventory-level — 1 linia per component, brak prop signatures. Zapobiega duplikacji w future Parts.
>
> **Ostatnia aktualizacja:** 2026-05-10 (post Part 9: Skeleton + Loading System)

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

`src/components/engine-ui/` zawiera 16 sub-directories + 19 root-level composite files. Total: ~107 component files.

| Directory | Components | Purpose |
|---|---|---|
| `a11y/` | 2 | Accessibility utilities (VisuallyHidden + mergeRefs) |
| `button/` | 7 | Button primitives |
| `chip/` | 8 | Badge / Chip / Tag family |
| `hooks/` | 8 | Custom React hooks |
| `interaction/` | 1 | Pressable wrapper |
| `layout/` | 9 | Stack, Inline, ActionRow etc. |
| `loading/` | 2 | Spinner + LoadingOverlay (Part 9) |
| `media/` | 8 | Image + media frames + overlays |
| `nav/` | 5 | Chevron, NavigationArrow, TabTrigger etc. |
| `overlay/` | 5 | BottomSheet + Backdrop + DragHandle |
| `primitives/` | 1 | Popover (Radix wrapper) |
| `skeleton/` | 6 | Skeleton family (Part 9) |
| `surface/` | 3 | CardSurface, PanelSurface, ScrollFade |
| `text/` | 9 | Typography primitives |
| `tokens/` | 4 .ts | Token const exports |
| (root) | 19 | Composite/legacy components |

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

8 custom hooks. Wszystkie używają namespace import (`import * as React from "react"`) — codebase convention.

- `useDelayedLoading` — anti-flash debouncing dla skeleton/spinner (Part 9 Stage 9)
- `useFocusTrap` — focus trap dla modal/sheet contexts
- `useFocusVisible` — focus-visible state detection
- `useHover` — pointer hover state (NIE touch)
- `useKeyboardShortcut` — keyboard shortcut binding z cleanup
- `usePress` — press/active state z multi-input support
- `useReducedMotion` — OS-level prefers-reduced-motion
- `useWidgetTheme` — theme application dla embedded widgets

---

## Lab integration

`/admin/engine-ui-lab` — internal preview surface. **15 sections + 7 helpers.**

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
- ✅ Part 9 — Skeleton + Loading System (11 stages, 8 components + 1 hook + 1 refactor)
- ⬜ Part 10 — Inputs / Form fields (greenfield: zero existing input/field/textarea/select w engine-ui)
- ⬜ Parts 11-14 — TBD

---

## Last update procedure

Po każdym Part deploy update'uj ten dokument:

1. Dodaj nowe components do appropriate category section (1 linia per component, format: `` `Name` — purpose (Part X) ``).
2. Update **Engine UI directories** count jeśli new directory created.
3. Update **Lab integration** section table jeśli new Lab section dodana.
4. Update **Roadmap** — mark completed Part with ✅.
5. Update top header **Ostatnia aktualizacja** date.
6. Commit message: `chore(docs): update Engine UI inventory (post Part X)`.

**Plik path:** `docs/ENGINE-UI-INVENTORY.md`

**Cel:** prevent duplikację (np. zanim zaczniesz Part 11, sprawdź czy podobne components już istnieją); maintain mental map systemu dla future Parts.
