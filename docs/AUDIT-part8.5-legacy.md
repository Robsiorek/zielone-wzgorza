# AUDIT Part 8.5 — Legacy Components Refactor

**Data:** 2026-05-09
**Cel:** identyfikacja legacy components do refactoru na primitywy Parts 1-8.
**Tryb:** read-only audit. Żaden plik nie został zmodyfikowany.

---

## Scope audytu

Audyt obejmuje 6 komponentów wskazanych przez Roberta + 4.7 jako kandydatów Część 8.5:

1. `src/components/engine-ui/ImageCarousel.tsx`
2. `src/components/engine-ui/ResultCard.tsx`
3. `src/components/engine-ui/SearchBar.tsx`
4. `src/components/engine-ui/GuestPicker.tsx`
5. `src/components/engine-ui/Stepper.tsx`
6. `src/components/booking/ResourceCard.tsx`

**Co jest poza scope tego audytu (ale godne uwagi):**
W `src/components/engine-ui/` na poziomie root żyje także seria innych legacy composites
nie zorganizowanych w podkatalogi Parts 1-8:

- `AvailabilityBadge.tsx`, `DatePickerTabs.tsx`, `DateRangePicker.tsx`,
  `FavoriteButton.tsx` (kolizja nazwy z Part 2 `./button/FavoriteButton`!),
  `FeatureChips.tsx`, `FlexibleDatePicker.tsx`, `Modal.tsx`,
  `PopoverItem.tsx`, `PriceBlock.tsx`, `ResultsEmptyState.tsx`,
  `ResultsHeader.tsx`, `ResultsSkeleton.tsx`, `SegmentedControl.tsx`.

Część z tych plików (`Modal`, `FavoriteButton`, `FeatureChips`, `PriceBlock`)
**jest importowana przez ResultCard** i również wymagałaby refactoru lub
co najmniej weryfikacji w trakcie Część 8.5. Otwarte pytanie #1 do 4.7.

---

## Summary table

| # | Plik | Linii | Hardcoded eui-* | External legacy deps | State hooks | Priority | Estymata |
|---|---|---|---|---|---|---|---|
| 1 | `booking/ResourceCard.tsx` | 176 | **0** (pure Tailwind!) | 0 | brak | **1** | low |
| 2 | `engine-ui/Stepper.tsx` | 199 | 5 | 0 | useCallback | **(2)** | low — patrz Q3 |
| 3 | `engine-ui/ImageCarousel.tsx` | 131 | 8 | 0 | ref + useState + useEffect | **2** | medium (scroll-snap, lazy load) |
| 4 | `engine-ui/GuestPicker.tsx` | 287 | 9 | 1 (Stepper) | useState + useEffect (draft/sync) | **3** | medium |
| 5 | `engine-ui/ResultCard.tsx` | 247 | **29** | 5 (ImageCarousel, FavoriteButton, PriceBlock, Modal, FeatureChips) | 2× useState | **4** | medium-high |
| 6 | `engine-ui/SearchBar.tsx` | 337 | 16 | 2 (DatePickerTabs, GuestPicker) | 2× useState | **5** | high (segment orchestration, 2 warianty) |

**Total:** 1 377 linii TSX do refactoru. Wszystkie 6 plików plus pozostające `eui-*` klasy w `globals.css`.

**Blast radius (production usage poza engine-ui/lab):**

| Komponent | Production call sites |
|---|---|
| `ImageCarousel` | 0 (tylko `ResultCard` wewnętrznie) |
| `ResultCard` | 0 (tylko Lab specimens) |
| `SearchBar` | 0 (tylko Lab specimens) |
| `GuestPicker` | 0 (Lab + wewnątrz `SearchBar`) |
| `Stepper` | 0 (tylko wewnątrz `GuestPicker`) |
| `ResourceCard` | **1** (`src/components/booking/ExploreView.tsx`) |

To jest **bardzo nisko-ryzykowny refactor** — niemal wszystko żyje w Lab + wewnętrznie. Jedyna realna produkcja to `ResourceCard` w jednym miejscu.

---

## Detailed analysis

### 1. `src/components/booking/ResourceCard.tsx` — Priority 1

- **Lokalizacja:** `src/components/booking/ResourceCard.tsx`
- **Linii:** 176
- **Aktualne imports:**
  ```ts
  import React from "react";
  import { Users, BedDouble, Search, ImageOff } from "lucide-react";
  import { DynamicIcon } from "@/components/ui/dynamic-icon";
  ```
- **Imports z engine-ui:** **brak** — komponent w ogóle nie używa Engine UI
- **Hardcoded eui-* klasy:** **0** — całość na surowych Tailwind utilities
- **Hardcoded patterns (Tailwind do migracji):**
  - **Cover image** (linia 88): `<div className="relative aspect-[16/10] bg-muted overflow-hidden">` — klasyczny target dla `<MediaFrame aspectRatio="16:10">` (Part 8)
  - **Empty state** (linie 96-100): `<ImageOff className="h-8 w-8 text-muted-foreground/30" />` w wycentrowanym divie — target dla `<ImagePlaceholder>` (Part 8)
  - **Category badge** (linie 102-106): `absolute top-3 left-3` + `bg-white/90 backdrop-blur-sm text-foreground/80 px-2.5 py-1 rounded-full` — target dla `<MediaOverlay position="top-left">` + `<MediaBadge variant="neutral">` (Part 8) lub `<Badge>` (Part 5)
  - **Meta row** (linie 117-130): `<div className="flex items-center gap-3">` + dwa `<span className="inline-flex items-center gap-1 text-[12px] text-muted-foreground">` — target dla `<Inline gap="sm">` + `<MetaText>` lub `<InlineMeta>` (Part 6 + 7)
  - **Description** (linia 134): `text-[13px] text-muted-foreground mt-2 line-clamp-2 leading-relaxed` — `<Text variant="body-small" color="secondary">` (Part 6)
  - **Amenities chips row** (linie 141-158): `flex flex-wrap gap-1.5` z chipami `text-[11px] ... bg-muted/50 rounded-full px-2 py-0.5` — target dla `<Inline wrap gap="xs">` + `<Tag variant="neutral">` lub `<Chip>` (Part 5 + 7)
  - **Spacer push** (linia 162): `<div className="flex-1 min-h-3" />` — `<Spacer grow />` (Part 7)
  - **CTA button** (linie 165-171): hand-rolled `<button>` z `bg-primary hover:bg-primary/90 ... transition-all active:scale-[0.98]` — target dla `<Button variant="primary" size="md" leadingIcon={Search}>` (Part 2)
  - **Card wrapper** (linia 86): `bg-card rounded-2xl border-2 border-border hover:border-primary/40 ... overflow-hidden flex flex-col` — `<CardSurface variant="bordered" interactive>` (Part 3) wraping `<Stack>` content (Part 7)
  - **Title** (linia 112): `text-[15px] font-semibold text-foreground truncate` — `<Text variant="title-3" element="h3" truncate>` (Part 6) lub utility class `.eui-title-3`
- **State:** brak — komponent w pełni presentational
- **External deps:** React, lucide-react, `DynamicIcon` (project-internal)
- **Mapowanie na primitywy:**
  - root `<div>` → `<CardSurface variant="bordered" interactive onClick={...}>` (Part 3)
  - cover `<div>` → `<MediaFrame aspectRatio="16:10">` + `<MediaOverlay position="top-left"><MediaBadge>...</MediaBadge></MediaOverlay>` (Part 8)
  - empty state → `<ImagePlaceholder size="lg" />` (Part 8)
  - meta row → `<Inline gap="sm">` z `<InlineMeta>` (Part 6 + 7)
  - amenities → `<Inline wrap gap="xs">` + `<Tag>` (Part 5 + 7)
  - CTA → `<Button variant="primary" leadingIcon={<Search/>}>` (Part 2)
  - typography → `.eui-title-3`, `.eui-body-small`, `.eui-caption` utility classes (Part 6)
- **Priority:** **1** — najprostszy refactor, idealny "first contact" z Częścią 8.5
- **Challenges:** brak. Single call site (ExploreView). Zero state. Zero zależności od innych legacy.
- **Rekomendacja:** **rozpocząć Część 8.5 od tego pliku**. Daje szybki feedback loop, walidację że primitywy z Parts 1-8 są wystarczające do realnego use case'u, i niemal zerowe ryzyko regresji.

---

### 2. `src/components/engine-ui/Stepper.tsx` — Priority "2 lub skip"

- **Lokalizacja:** `src/components/engine-ui/Stepper.tsx`
- **Linii:** 199
- **Aktualne imports:**
  ```ts
  import * as React from "react";
  import { Minus, Plus } from "lucide-react";
  ```
- **Imports z engine-ui:** **brak** (forwardRef + lokalne helpery)
- **Hardcoded eui-* klasy (5):**
  - `eui-stepper`, `eui-stepper-sm` (size modifier), `eui-stepper-disabled`, `eui-stepper-btn`, `eui-stepper-value`
- **Co już jest dobrze:**
  - `React.forwardRef` ✓ (zgodnie z Engine UI rule #2)
  - `role="spinbutton"` + pełna ARIA implementacja ✓
  - Klawiaturowa nawigacja (Arrows, Home, End) ✓
  - Brak Tailwind utilities — czysty CSS tokeny ✓
- **State:** tylko `useCallback` dla `commit`
- **External deps:** React, lucide-react
- **Migracja na primitywy:**
  - `<button className="eui-stepper-btn">` → `<IconButton size="sm" shape="circle" variant="ghost">` (Part 2). **UWAGA:** hard pattern: stepper buttons są blisko-2-bok (− [val] +) — `IconButton` musi działać w tym ciasnym layoucie.
  - `<div className="eui-stepper">` → `<Inline gap="xs" align="center">` (Part 7) lub zostaw jako custom shell — Stepper to osobny formalny primitive (Part 11 Form Controls)
  - Typography pos `<span className="eui-stepper-value">` → utility class `.eui-body` lub `.eui-title-3` (Part 6) z atrybutami spinbutton
- **Priority:** **uwarunkowane** — patrz Q3 do 4.7
- **Challenges:** brak
- **Rekomendacja warunkowa:**
  - **Opcja A** (skip Część 8.5): Stepper jest **planowanym primitywem Part 11 (Form Controls)**. Jeśli Robert/4.7 chcą refactorować Stepper formalnie w ramach Part 11 — pominąć go w Częsci 8.5 i zostawić jak jest (kod już jest a11y-correct + forwardRef).
  - **Opcja B** (refactor light): zamienić tylko lucide-buttony na `<IconButton>` (Part 2) + utility class `.eui-body` na value, zostawić strukturę. Gain: spójność z Part 2.
  - **Opcja C** (refactor pełny w Część 11): zostawić w Część 8.5, refactor wykonać przy okazji Part 11.

---

### 3. `src/components/engine-ui/ImageCarousel.tsx` — Priority 2

- **Lokalizacja:** `src/components/engine-ui/ImageCarousel.tsx`
- **Linii:** 131
- **Aktualne imports:**
  ```ts
  import * as React from "react";
  import { ChevronLeft, ChevronRight } from "lucide-react";
  import type { ResultImage } from "./results-types";
  ```
- **Imports z engine-ui (jako primitywy):** **brak** — komponent jest "pre-Part 8"
- **Hardcoded eui-* klasy (8):**
  - `eui-carousel`, `eui-carousel-track`, `eui-carousel-slide`, `eui-carousel-img`,
    `eui-carousel-placeholder`, `eui-carousel-arrow`, `eui-carousel-prev`, `eui-carousel-next`,
    `eui-carousel-dots`, `eui-carousel-dot`, `eui-carousel-dot-active`
- **Hardcoded patterns:**
  - **Inline SVG placeholder** (linie 60-64): hand-rolled `<svg>` ikona obrazu — duplikat funkcjonalności `<ImagePlaceholder>` (Part 8)
  - **Hand-rolled arrow buttons** (linie 91-108): native `<button>` z `<ChevronLeft/Right size={16} />` — duplikat `<GalleryNavButton>` (Part 8) lub `<NavigationArrow>` (Part 4)
  - **Dot indicators** (linie 114-127): hand-rolled `<span>` z toggled active class — duplikat `<PaginationDot>` (Part 4)
  - **Image element** (linie 76-83): surowy `<img>` z lazy/eager — kandydat do owijania w `<MediaFrame>` (Part 8) lub osobne primitywy `Image` (jeśli powstanie)
  - **CSS scroll-snap track**: cała mechanika scroll-snap musi pozostać (CSS w `globals.css` `.eui-carousel-track`) — primitywy Part 8 nie zawierają jeszcze scroll-snap container; **otwarte pytanie #2 do 4.7**
- **State:** `useRef<HTMLDivElement>` (scroll container) + `useState(activeIndex)` + `useEffect` (scroll listener z `passive: true`)
- **External deps:** React, lucide-react
- **Mapowanie na primitywy:**
  - `<div className="eui-carousel-placeholder"> + <svg>` → `<ImagePlaceholder size="lg">` (Part 8)
  - `<button className="eui-carousel-arrow eui-carousel-prev">` → `<GalleryNavButton direction="prev">` (Part 8)
  - `<button className="eui-carousel-arrow eui-carousel-next">` → `<GalleryNavButton direction="next">` (Part 8)
  - `<span className="eui-carousel-dot ...">` → `<PaginationDot active={i === activeIndex}>` (Part 4)
  - `<div className="eui-carousel-dots">` → `<Inline gap="xs" justify="center">` (Part 7) jeśli Part 4 nie ma własnego container
  - `<div className="eui-carousel-track">` + `<div className="eui-carousel-slide">` + `<img className="eui-carousel-img">` → **otwarte:** wewnątrz Part 8 nie ma "ScrollSnapTrack" prymitywu. Możliwe rozwiązania:
    - (a) zachować custom scroll-snap CSS (cienka warstwa `.eui-carousel-track`) wokół `<MediaFrame>` slidów
    - (b) zaproponować Part 8.5 nowy primitive `<ScrollSnapTrack>` (rzadkie, ale precedens dla detail-view gallery)
- **Priority:** **2** — autonomiczny (zero zależności od innych legacy), średnia trudność
- **Challenges:**
  - **scroll-snap CSS** musi pozostać działający po refactor — najpoważniejszy ryzyk
  - **lazy loading** pierwsza klatka eager, reszta lazy — pattern do zachowania
  - **scroll listener** `passive: true` + cleanup w `useEffect` — kontynuacja
  - **nawigacja klikiem strzałek** — `e.stopPropagation()` żeby nie odpalić card.onClick (ResultCard); `<GalleryNavButton>` musi propagować ten kontrakt
  - **arrows visible only on hover (desktop)** — to CSS-driven (`.eui-carousel-arrow` opacity), nie TSX
- **Rekomendacja:** refactor **2nd in line** po ResourceCard. Zachować mechanikę scroll-snap, podmienić wszystkie sub-komponenty na primitywy Part 4 + 8.

---

### 4. `src/components/engine-ui/GuestPicker.tsx` — Priority 3

- **Lokalizacja:** `src/components/engine-ui/GuestPicker.tsx`
- **Linii:** 287
- **Aktualne imports:**
  ```ts
  import * as React from "react";
  import { User, Users, Baby, Dog } from "lucide-react";
  import { Stepper } from "./Stepper";
  import { type BookingParty } from "@/lib/booking-params";
  ```
- **Imports z engine-ui (jako primitywy):** `Stepper` (legacy, peer)
- **Hardcoded eui-* klasy (9):**
  - `eui-guestpicker`, `eui-guestpicker-row`, `eui-guestpicker-icon`,
    `eui-guestpicker-label`, `eui-guestpicker-title`, `eui-guestpicker-subtitle`,
    `eui-guestpicker-subtitle-link`, `eui-guestpicker-footer`,
    `eui-guestpicker-link`, `eui-guestpicker-apply`
- **Hardcoded patterns:**
  - **Row layout** (linie 240-266): `<div class="eui-guestpicker-row">` z 3 sekcjami (icon | label | stepper) — `<Inline gap="md" align="center">` (Part 7) lub `<ActionRow>` (Part 7)
  - **Title + subtitle stack** (linie 244-258): `<div class="eui-guestpicker-label">` z `<span>` title + `<a>`/`<span>` subtitle — `<Stack gap="xs">` (Part 7) z `<Text variant="body" weight="medium">` + `<Text variant="body-small" color="secondary">` (Part 6)
  - **Subtitle link** (linie 246-254): hand-rolled `<a>` z target `_blank` rel `noopener noreferrer` — kandydat na `<SecondaryLink>` (Part 6)
  - **Footer** (linie 269-285): `<div class="eui-guestpicker-footer">` z `<button class="eui-guestpicker-link">` (Wyczyść) + `<button class="eui-guestpicker-apply">` (Zastosuj) — target dla `<ActionRow justify="space-between">` (Part 7) z `<Button variant="ghost">Wyczyść</Button>` + `<Button variant="primary">Zastosuj</Button>` (Part 2)
- **State:** `useState<BookingParty>(draft)` + `useEffect` resync po `value` change
- **Pattern do zachowania:** draft/commit model (linie 147-180) — explicit design decision (handoff §5.5, ChatGPT correction)
- **External deps:** React, lucide-react, lokalny `Stepper`, `BookingParty` z `@/lib/booking-params`
- **Mapowanie na primitywy:**
  - root `<div>` → `<Stack gap="md">` (Part 7) lub zostawić custom shell (popover-fitting)
  - Row → `<Inline gap="md" align="center">` (Part 7) z 3 dziećmi:
    - icon `<div>` → `<div>` z lucide ikoną size 20 (zostaw — to ikoniczna pozycja w panelu)
    - label `<div>` → `<Stack gap="xs">` (Part 7) z `<Text>` titlem i `<Text>` lub `<SecondaryLink>` subtitlem
    - `<Stepper>` → `<Stepper>` (sam siebie — patrz #2)
  - Footer → `<ActionRow justify="space-between">` (Part 7) lub `<InlineActions>` (Part 7) z dwoma `<Button>` (Part 2)
  - Typography:
    - title → `.eui-body` + medium weight, lub `<Text variant="body" weight="medium">`
    - subtitle → `.eui-body-small` + secondary color
- **Priority:** **3**
- **Challenges:**
  - **Draft/commit model**: trzeba pieczołowicie zachować podczas refactoru (regresja byłaby trudna do złapania w Lab — ChatGPT review §5.5 to obowiązkowe contract)
  - **Stepper dependency**: jeśli wybór Q3 = "skip Stepper / Part 11", GuestPicker zostawia legacy Stepper jako import — OK
  - **Row composition stress test**: każdy row ma 3 sekcje + responsive behavior — sprawdzić czy `<Inline>` Parts 7 zadowolnie obsługuje konkretne breakpointy
- **Rekomendacja:** refactor **3rd in line**. Bezpiecznie po ImageCarousel (które nie wymaga GuestPicker).

---

### 5. `src/components/engine-ui/ResultCard.tsx` — Priority 4

- **Lokalizacja:** `src/components/engine-ui/ResultCard.tsx`
- **Linii:** 247
- **Aktualne imports:**
  ```ts
  import * as React from "react";
  import { Star, Tag, X as XIcon } from "lucide-react";
  import type { ResultCardData } from "./results-types";
  import { ImageCarousel } from "./ImageCarousel";
  import { FavoriteButton } from "./FavoriteButton";   // ← legacy at root, kolizja z Part 2!
  import { PriceBlock } from "./PriceBlock";            // ← legacy at root
  import { Modal } from "./Modal";                       // ← legacy at root
  import { FeatureChips } from "./FeatureChips";        // ← legacy at root
  import { Popover, PopoverTrigger, PopoverContent } from "./primitives/Popover";
  ```
- **Imports z engine-ui (jako primitywy):** Popover (z primitives — OK), `ImageCarousel/FavoriteButton/Modal/PriceBlock/FeatureChips` to **wszystko legacy at root**
- **Hardcoded eui-* klasy (29 — najwięcej z całego scope):**
  - card shell: `eui-card`, `eui-card-unavailable`, `eui-card-image`, `eui-card-content`, `eui-card-favorite`
  - title row: `eui-card-title-row`, `eui-card-name`, `eui-card-rating`, `eui-card-rating-count`
  - subtitle: `eui-card-subtitle`
  - badge: `eui-card-badge`
  - bottom row: `eui-card-bottom`
  - price: `eui-card-price-area`, `eui-card-price-trigger`, `eui-card-price-amount`, `eui-card-price-unit`, `eui-card-price-total-hint`, `eui-card-price-detail`, `eui-card-price-detail-header`, `eui-card-price-detail-title`, `eui-card-price-detail-close`, `eui-card-price-detail-row`, `eui-card-price-total`, `eui-card-price-badge`
  - amenities: `eui-card-amenities-link`, `eui-amenities-list`, `eui-amenities-category`, `eui-amenities-cat-name`, `eui-amenities-items`, `eui-amenities-item`
- **Hardcoded patterns:**
  - **Article/role=button keyboard handler** (linie 103-113): manualny `onKeyDown` z `Enter` — kandydat na owijanie w `<Pressable>` (Part 1) lub `<CardSurface interactive>` (Part 3)
  - **Image area** (linie 115-129): `<div className="eui-card-image">` + `<ImageCarousel>` + absolute `<span eui-card-badge>` + absolute `<FavoriteButton eui-card-favorite>` — klasyczny `<MediaFrame>` + `<MediaOverlay top-left>` `<MediaBadge>` + `<MediaOverlay top-right>` `<FavoriteOverlay>` (Part 8)
  - **Rating pill** (linie 137-142): `<Star>` + score + count — duplikat `<RatingPill>` (Part 5)
  - **Inline meta row** (title + rating): `<div eui-card-title-row>` flex z space-between — `<ActionRow justify="space-between">` (Part 7)
  - **Subtitle**: `<p eui-card-subtitle>` 1-line truncate — `<Text variant="body-small" color="secondary" truncate>` (Part 6)
  - **Bottom row** (linie 151-217): price area + amenities link — `<ActionRow justify="space-between">` (Part 7)
  - **Price popover trigger** (linie 153-161): `<button>` z amount + unit — `<PriceText>` (Part 6) wrapped w `<Popover>` trigger, z amount jako `<span>` 600 weight (lub utility `.eui-title-3`)
  - **Price detail panel** (linie 163-198): hand-rolled grid z header + close + rows + total + badge — kandydat na `<PanelSurface>` (Part 3) + `<Stack>` (Part 7) + `<Text>` (Part 6) + `<CloseButton>` (Part 2) + `<Tag>` (Part 5)
  - **Amenities link** (linie 209-216): `<button eui-card-amenities-link>` — `<SecondaryLink as="button">` (Part 6) lub `<Button variant="ghost" size="sm">` (Part 2)
  - **Amenities Modal** (linie 222-244): `<Modal>` (legacy) — target dla `<BottomSheet>` (Part 3) na mobile + popover/dialog na desktop
- **State:** 2× `useState` (`amenitiesOpen`, `priceOpen`)
- **External deps:** lucide-react, **5 legacy peers** (ImageCarousel, FavoriteButton, PriceBlock, Modal, FeatureChips), Popover primitive
- **Mapowanie na primitywy (high level):**
  - root `<article>` → `<CardSurface interactive>` lub `<Pressable as="article">` (Part 1/3)
  - image `<div>` → `<MediaFrame aspectRatio="...">` + `<MediaOverlay>` (Part 8) wraping refactored ImageCarousel (lub composing nowy carousel z primitywów)
  - badge → `<MediaBadge>` (Part 8) lub `<Badge>` (Part 5) inside `<MediaOverlay>`
  - rating → `<RatingPill score={...} count={...}>` (Part 5)
  - title row → `<ActionRow>` (Part 7) z `<Text variant="title-3">` + `<RatingPill>`
  - subtitle → `<Text variant="body-small" color="secondary" truncate>` (Part 6)
  - bottom row → `<ActionRow justify="space-between">` (Part 7)
  - price popover trigger → `<button>` (zachować) opakowujące `<PriceText amountMinor={...} per="noc">` (Part 6)
  - price detail content → `<PanelSurface>` + `<Stack gap="md">` (Part 3 + 7) + `<ActionRow>` rows
  - amenities link → `<SecondaryLink as="button">` (Part 6)
  - Modal → `<BottomSheet>` na mobile lub `<PanelSurface>` w `<Dialog>` na desktop (Part 3)
- **Priority:** **4** — 5 legacy zależności + Modal trzeba refactorować razem (lub FacileBottomSheet, decyzja 4.7)
- **Challenges:**
  - **Najpoważniejszy refactor scope** — 29 klas, 5 legacy peers
  - **Popover-based price detail**: `Popover.Content` przekazuje `size="small"` (custom size) — sprawdzić czy `Part 3 PanelSurface + Popover` da ten layout
  - **Modal → BottomSheet substitution**: na mobile BottomSheet jest Airbnb-correct, ale na desktop "amenities modal" oczekuje wycentrowanego dialogu — potrzebna decyzja desktop pattern
  - **`isUnavailable` styling**: cała grayscale logika opadnie na `<CardSurface variant="...">` — sprawdzić czy istnieje `disabled`/`unavailable` variant (jeśli nie — dodać lokalny modifier class)
  - **`onSelect` z Enter keyboard**: jeśli przejdziemy na `<CardSurface interactive onClick>` — verify że Enter działa jak click (powinno; `<Pressable>` to gwarantuje)
- **Rekomendacja:** refactor **4th in line**. Wcześniej rozstrzygnąć Q1 (legacy peers ResultCard).

---

### 6. `src/components/engine-ui/SearchBar.tsx` — Priority 5

- **Lokalizacja:** `src/components/engine-ui/SearchBar.tsx`
- **Linii:** 337
- **Aktualne imports:**
  ```ts
  import * as React from "react";
  import { Search, Baby, Dog } from "lucide-react";
  import { format } from "date-fns";
  import { pl } from "date-fns/locale";
  import { Popover, PopoverTrigger, PopoverContent } from "./primitives/Popover";
  import { DatePickerTabs } from "./DatePickerTabs";   // ← legacy peer
  import { GuestPicker } from "./GuestPicker";          // ← legacy peer
  import { type BookingSearchCriteria, type BookingParty, type FlexibleDuration, effectiveGuests } from "@/lib/booking-params";
  ```
- **Imports z engine-ui (jako primitywy):** Popover. Pozostałe peers: `DatePickerTabs` (legacy, **poza scope**), `GuestPicker` (legacy w scope, #4)
- **Hardcoded eui-* klasy (16):**
  - shell: `eui-searchbar`, `eui-variant-hero`, `eui-variant-compact`, `eui-searchbar-open`
  - segments: `eui-searchbar-segment`, `eui-searchbar-segment-label`, `eui-searchbar-segment-value`, `eui-segment-active`, `eui-placeholder`
  - divider: `eui-searchbar-divider`, `eui-divider-hidden`
  - submit: `eui-searchbar-submit`, `eui-submit-compact`
  - guest summary chips: `eui-searchbar-guest-summary`, `eui-searchbar-guest-chip`
  - popover slide-in: `eui-popover-slide-in`
- **Hardcoded patterns:**
  - **Pill shell** (linie 322-335): root `<div>` z `eui-searchbar` + variant modifier — pill kształt, hero=60px / compact=48px. Nie ma direct primitywa Part 1-8 dla "search pill" — kandydat na **niestandardowy shell** lub `<PanelSurface variant="pill">` (sprawdzić czy Part 3 to wspiera)
  - **Segments** (linie 230-241, 264-276): `<button eui-searchbar-segment>` — to nie jest standardowy `<Button>` (Part 2), bo ma label + value w stack i specific behavior. Możliwe owijanie w `<Pressable>` (Part 1) z lokalną kompozycją typografii.
  - **Active segment styling**: `eui-segment-active` — modifier dla "open popover" state. Decyzja: lokalny modifier zostaje (nie da się wyrazić w primitywach) lub `<Pressable data-state="open">` (Part 1)
  - **Divider** (linie 305-313): `<span eui-searchbar-divider>` z visibility logic — kandydat na `<Divider orientation="vertical">` (Part 7) lub local custom (bo logika visibility jest specyficzna)
  - **Submit button** (linie 326-334): hand-rolled `<button>` z `<Search>` icon + opcjonalnie text — target dla `<Button variant="primary" size="md" leadingIcon={<Search/>}>` (Part 2) lub `<IconButton>` w wariancie compact
  - **Guest summary chips** (linie 108-122): `<span eui-searchbar-guest-summary>` z embedded `<span eui-searchbar-guest-chip>` (lucide ikona + count) — kandydat na `<Inline gap="xs">` (Part 7) + `<TinyBadge>` (Part 5) lub custom mini-chip
- **State:** 2× `useState` (`activeSegment`, `autoAdvanced`)
- **External deps:** React, lucide-react, date-fns + pl locale, Popover, DatePickerTabs, GuestPicker, booking-params
- **Mapowanie na primitywy:**
  - shell `<div>` → custom shell `<div className="eui-searchbar eui-searchbar-pill">` (utrzymać; brak primitywa) **lub** `<Inline align="center" className="eui-searchbar-pill">`
  - segment `<button>` → `<Pressable as="button">` (Part 1) z `<Stack gap="xs" align="start">` (Part 7) z `<Text variant="caption">` label + `<Text variant="body" weight="medium">` value
  - divider → `<Divider orientation="vertical">` (Part 7) jeśli supports `aria-hidden` + visibility class
  - submit → `<Button variant="primary" leadingIcon={<Search/>}>` (Part 2) — w hero "Szukaj" widoczne, w compact iconOnly
  - guest summary chip → `<TinyBadge>` (Part 5) w `<Inline>` (Part 7)
- **Priority:** **5** — najtrudniejszy, na końcu
- **Challenges:**
  - **Pill shell**: brak directowego primitywa, custom CSS musi pozostać
  - **Variant compose** (hero/compact): zmiany rozmiarowe + iconOnly — wszystkie wpięte w 1 component
  - **Divider visibility logic** (linie 207-209): sprzętowe ukrywanie dividera gdy sąsiedni segment otwarty — sprawdzić czy `<Divider hidden>` lub custom class
  - **`autoAdvanced` flow**: po wyborze daty automatyczne otwarcie GuestPicker z animacją `eui-popover-slide-in` — pattern do zachowania
  - **Date formatting** (date-fns + pl locale): zostaje 1:1
  - **Guard at submit** (linie 184-194): re-open `when` segment jeśli criteria niekompletne — to UX pattern do zachowania
  - **Zależność od GuestPicker (#4)**: lepiej refactorować po GuestPicker
  - **Zależność od DatePickerTabs (legacy poza scope)**: pozostaje legacy — Q1 do 4.7
- **Rekomendacja:** refactor **last (5th)**. Wymaga gotowego GuestPicker (#4). DatePickerTabs zostaje untouched.

---

## Migration order rekomendacja

Bazując na: zależnościach, blast radius, złożoności, ryzyku regresji.

| # | Plik | Czemu w tym miejscu |
|---|---|---|
| 1 | `booking/ResourceCard.tsx` | Zero zależności od innych legacy. 1 call site (ExploreView). Pure Tailwind → primitywy. **Idealny "first contact"**. |
| 2 | `engine-ui/ImageCarousel.tsx` | Autonomiczny (zero legacy peers). Średni rozmiar (131 lin). Patrz Q2 (scroll-snap). |
| 3 | `engine-ui/Stepper.tsx` *(opcjonalnie, patrz Q3)* | Bez zależności. Albo light refactor (lucide → IconButton), albo skip i poczekaj na Part 11. |
| 4 | `engine-ui/GuestPicker.tsx` | Zależy od (potentially-refactored) Stepper. Draft/commit model do zachowania. |
| 5 | `engine-ui/ResultCard.tsx` | 5 legacy peers — wymaga rozstrzygnięcia Q1 (Modal/FavoriteButton/PriceBlock/FeatureChips). Najwięcej eui-* klas (29). |
| 6 | `engine-ui/SearchBar.tsx` | Zależy od GuestPicker. Najdłuższy plik (337 lin). Pill shell custom. |

**Atomic discipline:** zgodnie z CLAUDE.md "Atomic changes (KRYTYCZNE)" — refactor **jeden plik na raz**, build + smoke test + git commit po każdym, dopiero potem następny.

**Stage 2 (CSS cleanup):** zgodnie z CLAUDE.md sekcja "CSS legacy cleanup", **NIE usuwać** klas `.eui-card-*`, `.eui-carousel-*`, `.eui-stepper-*`, `.eui-guestpicker-*`, `.eui-searchbar-*` z `globals.css` w tej samej iteracji co refactor TSX. Cleanup jako osobny PR po stabilizacji wszystkich 6 plików.

---

## Otwarte pytania dla 4.7

### Q1 — Scope Część 8.5: tylko 6 plików, czy też legacy peers ResultCard?

`ResultCard` importuje **5 legacy plików at root** w `src/components/engine-ui/`:

- `FavoriteButton.tsx` (kolizja nazwy z `./button/FavoriteButton` z Part 2!)
- `PriceBlock.tsx`
- `Modal.tsx`
- `FeatureChips.tsx`
- (oraz `ImageCarousel.tsx` — w scope)

Plus pozostałe legacy at root (poza scope ResultCard): `AvailabilityBadge`, `DatePickerTabs`, `DateRangePicker`, `FlexibleDatePicker`, `PopoverItem`, `ResultsHeader`, `ResultsEmptyState`, `ResultsSkeleton`, `SegmentedControl`.

**Pytanie:** czy Część 8.5 obejmuje TYLKO 6 wskazanych plików (a `Modal` / `FavoriteButton` legacy zostają jako peers w `ResultCard`), czy refactor wciąga też te 4-5 plików razem?

**Implikacja dla decyzji:**
- **Opcja A** (tylko 6): ResultCard wciąż importuje `Modal`, `FavoriteButton` (legacy) — Część 8.5 jest niekompletna ale szybsza
- **Opcja B** (12+ plików): kompletny refactor, ale scope rośnie 2×
- **Opcja C** (rozdzielić na Część 8.5a + 8.5b): pierwsze 6 + ResourceCard, potem peers ResultCard

### Q2 — `<ScrollSnapTrack>` primitive dla ImageCarousel?

Part 8 dał `MediaFrame`, `MediaOverlay`, `GalleryNavButton`, `ImageCounter`, `ThumbnailStrip` — ale **nie ma "ScrollSnapTrack"** primitywa do horizontal scroll-snap gallery (jak w `ImageCarousel`).

**Pytanie:** podczas refactoru ImageCarousel:
- **Opcja A:** zachować custom CSS `.eui-carousel-track` (3-4 reguły scroll-snap) jako lokalny CSS, owijając tracki sub-komponentami z Parts 4 + 8
- **Opcja B:** dodać do Part 8 nowy primitive `<ScrollSnapTrack>` (rzadko używany — tylko w gallery)
- **Opcja C:** zaczekać na hipotetyczny Part 13 (Booking Commerce) gdzie pojawi się detail-view gallery

### Q3 — Stepper: refactor teraz czy w ramach Part 11?

`engine-ui/Stepper.tsx` **już jest** dobrze napisany (forwardRef + a11y + brak Tailwind), ale w roadmapie:

> **Part 11: Form Controls** ⏳

Czyli Stepper teoretycznie jest "future Part 11 primitive".

**Pytanie:**
- **Opcja A** (**rekomendowana**): zostawić w spokoju w Część 8.5, formalny refactor → Part 11
- **Opcja B** (light refactor): podmienić tylko `<button class="eui-stepper-btn">` na `<IconButton>` (Part 2)
- **Opcja C** (full refactor w 8.5): pełna kompozycja primitywów teraz, w Part 11 tylko cementowanie API

### Q4 — Czy `<RatingPill>` w Part 5 obsługuje "Star + score + count" pattern?

W ResultCard: `<Star size={14} fill="currentColor"/> + score.toFixed(2) + (count)`. Sprawdzić czy `<RatingPill score={...} count={...}>` z Part 5 daje identyczny visual + ARIA, czy potrzebny override.

### Q5 — Modal → BottomSheet substitution na desktop?

ResultCard otwiera `<Modal>` z amenities — na mobile Airbnb-style `<BottomSheet>` (Part 3) byłby idealny, ale na desktop oczekiwany jest wycentrowany dialog. Czy:

- **Opcja A:** dodać do Part 3 osobny `<Dialog>` na desktop + `<BottomSheet>` na mobile (responsive switch)
- **Opcja B:** użyć tylko `<BottomSheet>` na obu (mobile-first)
- **Opcja C:** zostawić legacy `Modal.tsx` jako peer dla desktop dialog use case

### Q6 — `<CardSurface variant="unavailable">` istnieje?

ResultCard ma `eui-card-unavailable` modifier — grayscale + reduced opacity + cursor not-allowed. Sprawdzić czy CardSurface (Part 3) ma `disabled` / `unavailable` variant, czy lokalny modifier class musi pozostać.

---

## Co NIE zmienia się w Część 8.5

- **Domain logic** (`@/lib/booking-params.ts`, `BookingSearchCriteria`, `effectiveGuests`, ...): bez zmian
- **`ResultCardData`, `ResultImage`, `AmenityCategory` typy** w `results-types.ts`: bez zmian
- **Popover primitives** (`./primitives/Popover`): zostaje (nie jest legacy, jest właściwy primitive Engine UI)
- **`useWidgetTheme` hook**: bez zmian
- **`globals.css` legacy klasy**: zostają w pliku do osobnego CSS cleanup PR po stabilizacji TSX
- **DatePickerTabs / DateRangePicker / FlexibleDatePicker** (poza scope): zostają legacy

---

## Sygnały które wykluczyłem z audytu

- Performance (np. memoization potencjalna w `ResultCard`/`SearchBar`) — to nie scope refactoru tokeny → primitywy
- Type safety improvements — refactor zachowuje istniejące API dla każdego komponentu
- Test coverage — `scripts/test-critical.sh` pokrywa endpointy backendu, nie te komponenty UI
- i18n — wszystkie hardcoded polskie stringi pozostają (zgodne z konwencją projektu)

---

**Audit closed.** Ready for 4.7 to write blueprint Część 8.5.
