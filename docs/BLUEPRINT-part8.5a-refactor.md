# BLUEPRINT — Część 8.5a: REFACTOR LEGACY (First Wave)

**Wersja:** v1.1
**Data:** 9 maja 2026 (v1.0) → 9 maja 2026 (v1.1 post-ChatGPT review)
**Autor:** 4.7 (Senior Architect, claude.ai chat)
**Bazuje na:** `docs/AUDIT-part8.5-legacy.md` (commit `25c4d7e`, 437 linii)
**Kontekst:** Część 8.5 split na 8.5a (6 plików) + 8.5b (legacy peers) per ChatGPT + Robert green light
**Status:** READY FOR FINAL REVIEW (ChatGPT v1.1)
**Implementator:** Claude Code (lokalnie na VPS, claude-opus-4-6)
**Estymata:** 8 stages × 30-45 min = ~4.5-6.5h pracy łącznie (vs ~30h w starym workflow)

**v1.1 changes (post-ChatGPT review):**
1. ✅ Added "NO PROP API CHANGES policy" (sekcja 3, explicit)
2. ✅ Added "NO STATE LIFECYCLE CHANGES policy" (sekcja 3, explicit)
3. ✅ Stage 5 split na **5A** (structural shell) + **5B** (interactive systems)
4. ✅ SearchBar Stage 6: explicit mobile smoke test (~25 punktów)
5. ✅ ResourceCard Stage 1: production caution (screenshots desktop+mobile, optional Lighthouse)

---

## 📋 Spis treści

1. [Wprowadzenie + filozofia](#1-wprowadzenie--filozofia)
2. [Decyzje architektoniczne (Q1-Q6)](#2-decyzje-architektoniczne)
3. [REFACTOR DISCIPLINE — fundament 8.5a](#3-refactor-discipline)
4. [Strategy — 8 stages atomic](#4-strategy)
5. [Stage 0: FavoriteButton kolizji rename](#stage-0-favoritebutton-rename)
6. [Stage 1: ResourceCard refactor](#stage-1-resourcecard)
7. [Stage 2: ImageCarousel refactor](#stage-2-imagecarousel)
8. [Stage 3: Stepper light refactor](#stage-3-stepper-light)
9. [Stage 4: GuestPicker refactor](#stage-4-guestpicker)
10. [Stage 5A: ResultCard structural shell](#stage-5a-resultcard-structural)
11. [Stage 5B: ResultCard interactive systems](#stage-5b-resultcard-interactive)
12. [Stage 6: SearchBar refactor](#stage-6-searchbar)
13. [CSS legacy cleanup strategy](#cleanup-strategy)
14. [Lab specimens updates](#lab-specimens)
15. [Rollback procedures](#rollback)
16. [Manual QA per stage](#manual-qa)
17. [Out of scope (8.5b reference)](#out-of-scope)
18. [Plan dependencies dla Część 8.5b](#plan-85b)
19. [Master Plan update](#master-plan-update)

---

## 1. Wprowadzenie + filozofia

### Co to jest Część 8.5a

Część 8.5a to **REFACTOR LEGACY** — pierwszy duży refactor w projekcie zwracający 6 komponentów legacy (ResourceCard, ImageCarousel, Stepper, GuestPicker, ResultCard, SearchBar) na primitywy z Parts 1-8.

**Zakres total:** ~1377 linii TSX, 67 hardcoded `eui-*` klas, 8 zewnętrznych zależności legacy.

**Blast radius:**
- ResourceCard: **1 production call site** (`ExploreView.tsx`)
- Wszystkie pozostałe: 0 production sites (Lab + wewnętrznie)

### Co Część 8.5a NIE jest

❌ **NIE jest visual modernization** — żadnych "ulepszeń" designu
❌ **NIE jest behavior upgrade** — żadnych nowych features
❌ **NIE jest performance optimization** — memoization, lazy loading dodatkowe → out of scope
❌ **NIE jest typescript improvement** — istniejące API zachowane 1:1
❌ **NIE jest CSS cleanup** — legacy klasy zostają w globals.css do Część 8.5b
❌ **NIE jest Modal refactor** — odłożone do Część 8.5b
❌ **NIE jest legacy peers refactor** (FavoriteButton legacy, PriceBlock, FeatureChips) — odłożone do 8.5b

### Co Część 8.5a JEST

✅ **Behavior preservation refactor** — ten sam visual + funkcjonalność
✅ **Structure replacement** — hand-rolled HTML → primitywy z Parts 1-8
✅ **Atomic discipline** — 1 plik = 1 stage = 1 commit = niezależny rollback
✅ **CardSurface composition pattern** — jeden wzorzec na wszystkie kartowe komponenty
✅ **Tokenized styling** — utility classes Part 6 zamiast hardcoded font-size/spacing

### Filozofia naczelna

> **"Same UI, nowe primitives pod spodem"**

Po deploy 8.5a użytkownik **NIE POWINIEN** zauważyć żadnej różnicy w UI. Tylko code reviewer i przyszły developer dostrzegą że teraz pliki są **2-3× krótsze** i kompozycyjne zamiast hand-rolled.

**Phrase kluczowa:**

> "If you find yourself improving the design, STOP. That's a different PR."

---

## 2. Decyzje architektoniczne

Wszystkie 6 pytań z audytu (Q1-Q6) **rozstrzygnięte** z green light od Robert i ChatGPT:

### Q1: Scope — split 8.5a + 8.5b ✅

**Decyzja:** Część 8.5 dzielimy na dwa osobne blueprinty:

**8.5a — First Wave** (TEN dokument):
- 6 plików core
- Stage 0: FavoriteButton kolizji rename
- Stages 1-6: per-file refactor
- Total: ~1377 linii TSX → primitywy

**8.5b — Cleanup Wave** (later, osobny blueprint):
- Modal → BottomSheet (mobile) + Dialog (desktop, requires Part 3 extension)
- FavoriteButton legacy → use Part 2 FavoriteButton
- PriceBlock → migracja na Part 6 PriceText
- FeatureChips → migracja na Part 5 Chip/Tag
- (opcjonalnie) AvailabilityBadge, ResultsHeader, ResultsEmptyState, ResultsSkeleton, SegmentedControl

**Korzyść split:**
- 8.5a daje wymierne progress (Master Checklist 8/14 → 8.5/14)
- 8.5b nie blokuje Part 9 (Skeleton)
- Refactor Modal/Dialog wymaga rozszerzenia Part 3 — zasługuje na własny blueprint
- Mental load: 6 plików w 1 sesji manageable, 12+ plików = chaos

### Q2: ScrollSnapTrack primitive ✅

**Decyzja:** **Custom CSS lokalny** w ImageCarousel. Brak nowego primitive.

**Uzasadnienie:**
- scroll-snap to detail implementacji ImageCarousel, NIE systemic primitive
- ~5 linii reguł CSS w klasie `.eui-image-carousel-track`
- YAGNI — Część 13 (Booking Commerce, detail-view gallery) może wprowadzić formal `<ScrollSnapTrack>` jeśli pattern się powtórzy
- Convention "custom CSS dla rzadkich patterns" już istnieje (`.eui-button-pill`, `.eui-section-block-divider`)

### Q3: Stepper teraz czy Part 11 ✅

**Decyzja:** **Light refactor TERAZ** w Stage 3.

**Co zmieniamy:**
- `<button class="eui-stepper-btn">` → `<IconButton size="sm" shape="circle" variant="ghost">`
- `<span class="eui-stepper-value">` → dodać `eui-body` utility class

**Co NIE zmieniamy:**
- Public API (props, ref forwarding)
- Behavior (arrow keys, role=spinbutton, ARIA)
- Internal state management (useCallback dla commit)

**Uzasadnienie:**
- Stepper już jest a11y-correct + forwardRef + zero Tailwind
- Pełen formal refactor (struktura, walidacja, error states) → Part 11 (Form Controls)
- Light refactor w 8.5a: tylko cosmetic alignment z Engine UI conventions
- Backward compatible z GuestPicker (Stage 4)

### Q4: RatingPill obsługa Star+score+count ✅

**Decyzja:** **TAK, używamy z Airbnb-style separator visual upgrade**.

**Empirycznie potwierdzone (Claude Code audit):**
- `src/components/engine-ui/chip/RatingPill.tsx` istnieje (42 linie)
- Pełna sygnatura:

```tsx
interface RatingPillProps extends React.HTMLAttributes<HTMLSpanElement> {
  score: number;
  count?: number;
  variant?: "solid" | "soft" | "inline";
  size?: "sm" | "md";
  formatScore?: (score: number) => string;  // default: (s) => s.toFixed(2)
}
```

**Visual change (jedyny w 8.5a):**
- ResultCard PRZED: `Star · 4.85 (123)` (count w nawiasie)
- ResultCard PO: `Star · 4.85 · 123` (count po separatorze, bez nawiasów)

**Uzasadnienie tej **JEDYNEJ** zmiany visual:**
- Airbnb (nasz benchmark per CLAUDE.md) używa formatu z separatorem
- RatingPill już istnieje i wymusza ten format
- Trzymanie nawiasów wymagałoby extension props lub lokalnej kompozycji
- ResultCard ma 0 production call sites → zerowe ryzyko regression visual u użytkowników
- To jest **świadoma normalizacja do istniejącego primitive**, nie redesign

### Q5: Modal → BottomSheet/Dialog ✅

**Decyzja:** **Odłożone do 8.5b**.

**W 8.5a:** Modal pozostaje legacy peer. ResultCard wciąż importuje `<Modal>` z `./Modal`.

**Uzasadnienie:**
Modal/BottomSheet/Dialog refactor wymaga:
- Focus management (focus trap, restore on close)
- Portal rendering (.engine-root container)
- Scroll locking (body scroll prevent)
- Escape key handling
- Backdrop click to close
- inert background
- Z-index system integration (var(--eui-z-overlay))
- Mobile ergonomics (BottomSheet swipe to dismiss)
- Desktop centered Dialog responsive switch
- Animation timings

To jest **osobna duża zmiana** (rozszerzenie Part 3) zasługująca na własny blueprint.

### Q6: CardSurface variant unavailable ✅

**Decyzja:** **Lokalny modifier `.eui-result-card-unavailable` + aria-disabled + interactive=false**.

**Empirycznie potwierdzone (Claude Code audit):**
- `src/components/engine-ui/surface/CardSurface.tsx` (34 linie)
- 4 osie config: `elevation`, `radius`, `interactive`, `padding`
- Brak variant/state — nie ma `disabled`/`unavailable`

**Pattern dla ResultCard (z Claude Code audit):**

```tsx
<CardSurface
  elevation="raised"
  radius="xl"
  interactive={!isUnavailable && !!onSelect}
  padding={0}
  onClick={!isUnavailable ? handleCardClick : undefined}
  role={onSelect ? "button" : undefined}
  tabIndex={onSelect && !isUnavailable ? 0 : undefined}
  aria-disabled={isUnavailable || undefined}
  className={isUnavailable ? "eui-result-card-unavailable" : undefined}
>
  {/* MediaFrame + Stack content */}
</CardSurface>
```

**Korzyści tego patternu:**
- `interactive=false` gdy unavailable → no hover/focus state
- `aria-disabled=true` → screen reader ogłasza
- Lokalny modifier `.eui-result-card-unavailable` → grayscale visual
- Bez modyfikacji Part 3 (CardSurface API zachowane)
- Component-specific styling (inne karty mogą mieć różne unavailable visual)

**Future:** Część 12 (Feedback + State) może dodać formal `state="unavailable"` variant do CardSurface jeśli pattern się powtórzy w 2+ komponentach.

---

## 3. REFACTOR DISCIPLINE

> **Ta sekcja jest fundamentem 8.5a. Read it twice.**

### Zasada naczelna

> **"Visual diff: should be ZERO from user perspective."**

Po deploy każdego stage, użytkownik otwierający aplikację **nie powinien zauważyć żadnej zmiany**. Tylko developer otwierający kod zobaczy że teraz plik ma 2-3× mniej linii.

### ✅ DOZWOLONE (structural refactor)

1. **Wymiana hand-rolled HTML na primitywy:**
   - `<div className="aspect-[16/10] relative bg-muted overflow-hidden">` → `<MediaFrame aspectRatio="16:10">`
   - `<button className="bg-primary hover:bg-primary/90 ...">` → `<Button variant="primary">`
   - `<div className="flex items-center gap-3">` → `<Inline gap="sm">`

2. **Dodawanie utility classes z Part 6:**
   - `.eui-body` na text descriptions
   - `.eui-caption` na meta info
   - `.eui-title-3` na nagłówki kart
   - `.eui-label` na badges/buttons

3. **Kompozycja primitywów zamiast hand-rolled struktury:**
   - `<MediaFrame>` + `<MediaOverlay>` + `<MediaBadge>` zamiast 3 zagnieżdżonych divów
   - `<CardSurface>` + `<Stack>` zamiast manualnego flex column
   - `<ActionRow>` zamiast `<div className="flex justify-between">`

### ✅ DOZWOLONE (mikroskopijne różnice — ChatGPT amendment)

Te różnice są **strukturalnie nieuniknione** i akceptowalne:

1. **Tokenized spacing** — jeśli `<Inline gap="md">` daje `var(--eui-space-3)` (12px) gdy hand-rolled było `gap-3` (12px Tailwind = same), super. Jeśli pixel-level diff = 0-2px wynikający z primitywu — OK.

2. **Border-radius** — `var(--eui-radius-2xl)` może mieć minimalnie inne pixele niż hand-rolled `rounded-2xl`. Jeśli różnica < 2px, akceptowalne.

3. **Font inheritance** — `.eui-body` może mieć letter-spacing różne mikroskopijnie od hand-rolled. To NORMALIZACJA, jest pożądana.

4. **Hover states** — primitywy mają consistent hover (np. `<CardSurface interactive>` = `hover:border-primary/40`). Jeśli hand-rolled było `hover:border-blue-500/40`, normalizacja na brand kolor jest OK.

5. **Focus rings** — wszystkie primitywy mają consistent focus ring. Drobne różnice w kolor/radius są OK.

### ✅ DOZWOLONE (1 explicit upgrade)

**Tylko jeden:** RatingPill format `(count)` → `· count` w ResultCard. Q4 zatwierdzone.

### 🔒 NO PROP API CHANGES policy (ChatGPT enhancement v1.1)

**Public props API MUST remain backward compatible** unless explicitly approved in this blueprint.

Refactor często przypadkiem zmienia API w subtelny sposób — a parent komponenty się rozwalają.

**ZABRONIONE bez explicit zatwierdzenia:**

- ❌ Zmiana **default values** propsów (np. `size` default `"md"` → `"sm"`)
- ❌ Zmiana **callback signatures** (np. `onChange(value)` → `onChange(value, meta)`)
- ❌ Zmiana **callback timing** (np. callback wywoływany on-change → on-blur)
- ❌ Zmiana **null/undefined semantics** (np. `value: undefined` interpretowane jako `0` zamiast empty)
- ❌ Zmiana **optionality** propsów (required → optional lub odwrotnie)
- ❌ Zmiana **event propagation** (np. dodanie/usunięcie `e.stopPropagation()` gdzie nie było)
- ❌ Zmiana **ref forwarding behavior** (forwardRef target może się zmienić, ale public API tego — nie)

**Verification per-stage:**

```bash
# Sprawdź czy interface props nie zmienił się (compare git diff)
git diff <commit-przed-stage> -- <plik>.tsx | grep -E "interface.*Props|onChange|defaultProps"
# Wszystkie zmiany w props interfaces MUSZĄ być uzasadnione w blueprintcie
```

**Wyjątek:** jeśli **podczas implementacji** Claude Code odkryje że **istnieje konkretne uzasadnienie** dla zmiany API (np. typowe naprawienie bug-u), wtedy:
1. STOP — nie commituj
2. Pokaż Robert proposed change + uzasadnienie
3. Robert decyduje: akceptacja lub trzymamy stare API

### 🔒 NO STATE LIFECYCLE CHANGES policy (ChatGPT enhancement v1.1)

**Internal state management MUST remain functionally identical** unless explicitly approved.

To jest klasyczny "niewinny refactor który potem rozwala UX". Optimizations pretending to be refactor:

**ZABRONIONE bez explicit zatwierdzenia:**

- ❌ Dodanie **debounce/throttle** gdzie nie było (zmienia callback timing)
- ❌ Dodanie **useMemo** dla "optymalizacji" (zmienia reference equality, może rozwalić deps)
- ❌ Dodanie **useCallback** dla "optymalizacji" (zmienia reference equality)
- ❌ Zmiana **lazy state init** (`useState(0)` → `useState(() => 0)` lub odwrotnie — zmienia inicjalizację)
- ❌ **Moving state up/down** (lifting state to parent lub pushing down to child)
- ❌ **Async transitions** (dodanie `useTransition`, `startTransition`)
- ❌ **Suspense boundaries** dodanie/usunięcie
- ❌ Zmiana **useEffect dependencies** (nawet jeśli "wydaje się ze powinno być inaczej")
- ❌ Zmiana **kolejności useState/useEffect calls**
- ❌ **Splitting/merging** state (np. 1× useState({x, y}) → 2× useState — może zmienić render batching)

**Why this matters:**

State lifecycle changes są **niewykrywalne** w typowym smoke teście. Mogą się ujawnić tylko w:
- Specific user flows (np. "wpisuję szybko, a potem czekam — dlaczego nie commituje?")
- Race conditions (np. "kliknąłem 2× a state się rozjechał")
- Edge cases (np. "external prop change podczas user editing")

**Verification per-stage:**

```bash
# Sprawdź czy hooks calls i depsy są identyczne
git diff <commit-przed-stage> -- <plik>.tsx | grep -E "useState|useEffect|useCallback|useMemo|useRef"
# Każda zmiana w hookach MUSI być uzasadniona w blueprintcie
```

**Wyjątek:** taki sam jak NO PROP API CHANGES — jeśli odkryjemy realny bug podczas implementacji, STOP + Robert decision.

### ❌ ZABRONIONE (visual modernization)

**Bez explicit zgody Robert:**

- ❌ Zmiana spacingów "bo wygląda lepiej" (np. `gap-3` → `gap-4`)
- ❌ Reorganizacja layoutu (np. column → row, lub permutacja kolumn)
- ❌ Dodawanie animacji których nie było (transitions, transforms)
- ❌ Zmiana color tokens (np. `text-muted-foreground` → `text-gray-600`)
- ❌ Modyfikacja shadow strength (`shadow-sm` → `shadow-md`)
- ❌ Modyfikacja border-radius semantyki (`rounded-2xl` → `rounded-3xl`)
- ❌ Dodawanie hover effects którego nie było
- ❌ "Ulepszanie" focus states
- ❌ Dodawanie skeleton loading
- ❌ Modyfikacja transition timings
- ❌ Dodawanie micro-interactions

### Decision tree — "structural refactor" vs "visual modernization"

| Pytanie | Odpowiedź | Klasyfikacja |
|---|---|---|
| Czy zmieniam DOM structure / HTML semantics? | TAK | ✅ STRUCTURAL |
| Czy zmieniam composition (primitywy zamiast manual)? | TAK | ✅ STRUCTURAL |
| Czy daje pixel-level diff bo prymityw normalizuje? | TAK | ✅ ACCEPTABLE |
| Czy świadomie poprawiasz "to wyglądało źle"? | TAK | ❌ MODERNIZATION |
| Czy dodajesz feature/animacja którego nie było? | TAK | ❌ MODERNIZATION |
| Czy zmieniasz layout dla "lepszego UX"? | TAK | ❌ MODERNIZATION |

### Verification per-stage

Każdy stage kończy się weryfikacją:

1. **Visual screenshot comparison:**
   - Przed (z git stash lub backup)
   - Po
   - Side-by-side: layout IDENTICAL, colors IDENTICAL, spacing pixel-level diff OK

2. **Functional equivalence:**
   - Każda interakcja działa tak samo (click, keyboard, touch)
   - Każdy callback wywoływany w tym samym momencie
   - Każdy keyboard shortcut zachowany
   - State management nieuszkodzone

3. **Build + smoke test:**
   - `./node_modules/.bin/next build` → success
   - `pm2 restart zw-admin` → online
   - `curl /admin/engine-ui-lab` → 200 OK
   - `curl /admin/dashboard` → 200 OK
   - DevTools console: zero new errors

### Postawa "Behavior Preservation Refactor"

**Wewnętrzne mantry developera implementującego 8.5a:**

- "Refactor != redesign"
- "Refactor != upgrade"
- "Refactor = ten sam kod, lepiej zorganizowany"
- "If it ain't broke, don't fix it"
- "Different PR" — gdy widzisz design opportunity → log w `docs/POST-8.5-IMPROVEMENTS.md`, NIE rób teraz

---

## 4. Strategy

### Atomic discipline (KRYTYCZNE)

**Każdy stage = niezależny commit.** Pełen cycle:

```
1. Backup PRZED (git status czysty + tarball backup)
2. Edit pliku (Claude Code, z explicit Robert zgoda na każdy Edit)
3. Verify polskie znaki
4. Build (./node_modules/.bin/next build)
5. Jeśli build OK → pm2 restart zw-admin
6. Smoke test (curl + browser check)
7. Visual diff comparison (screenshot)
8. Functional equivalence test
9. Robert akceptuje → git commit
10. git push
11. NEXT stage
```

**JEDEN plik na raz.** Nie 2 równolegle. Nie "po drodze poprawimy też X".

### Stages overview

| Stage | Plik | Linii | Priority | Estymata | Visual diff oczekiwany |
|---|---|---|---|---|---|
| **0** | FavoriteButton kolizji rename | (rename + 1 import) | 0 | 5 min | ZERO |
| **1** | `booking/ResourceCard.tsx` | 176 | 1 | 30-45 min | mikroskopijne (primitywy) |
| **2** | `engine-ui/ImageCarousel.tsx` | 131 | 2 | 30-45 min | mikroskopijne |
| **3** | `engine-ui/Stepper.tsx` (LIGHT) | 199 | 3 | 15-20 min | mikroskopijne |
| **4** | `engine-ui/GuestPicker.tsx` | 287 | 4 | 45-60 min | mikroskopijne |
| **5A** | `engine-ui/ResultCard.tsx` — structural shell | 247 (split A) | 5 | 30-45 min | mikroskopijne |
| **5B** | `engine-ui/ResultCard.tsx` — interactive systems | (cont.) | 5 | 30-45 min | mikroskopijne + RatingPill |
| **6** | `engine-ui/SearchBar.tsx` | 337 | 6 | 60-90 min | mikroskopijne |

**Total:** ~4.5-6.5h skupionej pracy (vs ~30h w starym workflow chat→tarball→FileZilla→SSH).

> **Stage 5 split rationale (ChatGPT v1.1):** ResultCard ma 29 hardcoded eui-* klas, 5 legacy peers, 2× useState, popover, modal, keyboard handling, click propagation. Split na 5A (structural shell) + 5B (interactive systems) **znacząco redukuje ryzyko regresji** — każdy commit jest niezależnie verifyowalny, każda kategoria zmian ma osobny revert.

### Dependencies between stages

```
Stage 0 (FavoriteButton rename) ── prerequisite ──→ Stage 5A (ResultCard imports)
Stage 1 (ResourceCard) ── independent ──→ deployable immediately
Stage 2 (ImageCarousel) ── prerequisite ──→ Stage 5A (ResultCard używa ImageCarousel)
Stage 3 (Stepper light) ── prerequisite ──→ Stage 4 (GuestPicker imports Stepper)
Stage 4 (GuestPicker) ── prerequisite ──→ Stage 6 (SearchBar imports GuestPicker)
Stage 5A (ResultCard structural) ── prerequisite ──→ Stage 5B (ResultCard interactive)
Stage 5B (ResultCard interactive) ── independent z perspektywy stage 6
Stage 6 (SearchBar) ── last (depends on Stage 4 GuestPicker)
```

**Realizowalna kolejność (sequential):**

```
Stage 0 → Stage 1 → Stage 2 → Stage 3 → Stage 4 → Stage 5A → Stage 5B → Stage 6
```

**REKOMENDACJA:** sequential. Mikro-optymalizacja niewarta cognitive overhead.

### Rollback strategy per-stage

Każdy stage ma niezależny commit. Jeśli stage X powoduje regresję:

```bash
# Cofnięcie ostatniego stage
git revert HEAD
./node_modules/.bin/next build
pm2 restart zw-admin

# Lub bardziej drastyczne — reset do pre-stage state
git reset --hard <commit-przed-stage>  # tylko jeśli nie pushed!
```

**KAŻDY stage ma własny commit message** zawierający stage number — łatwy revert.

---

<a id="stage-0-favoritebutton-rename"></a>

## Stage 0: FavoriteButton kolizji rename

**Czas:** 5 min
**Pliki dotykane:** 2 (rename + 1 import update)
**Visual diff:** ZERO
**Behavior diff:** ZERO

### Problem

W projekcie istnieją DWA komponenty o nazwie `FavoriteButton`:

1. **Legacy:** `src/components/engine-ui/FavoriteButton.tsx`
2. **Part 2:** `src/components/engine-ui/button/FavoriteButton.tsx`

ResultCard (Stage 5) importuje **legacy** wersję:

```tsx
// src/components/engine-ui/ResultCard.tsx
import { FavoriteButton } from "./FavoriteButton";  // ← legacy at root
```

Ta kolizja nazw:
- Utrudnia czytanie kodu (który `FavoriteButton`?)
- Powoduje confusion w narzędziach (autocomplete, refactor tools)
- Blokuje czysty refactor — Stage 5 chce użyć Part 2 `FavoriteButton`, ale legacy ma inne API

### Rozwiązanie

**Rename legacy:** `FavoriteButton.tsx` → `LegacyFavoriteButton.tsx`

To jest **PRE-refactor cleanup** który umożliwia bezpieczny refactor ResultCard w Stage 5 (gdzie legacy → Part 2 `FavoriteButton`).

### Implementacja

#### Krok 0.1: Verify obecny stan

```bash
# Pokaż oba pliki
ls -la src/components/engine-ui/FavoriteButton.tsx
ls -la src/components/engine-ui/button/FavoriteButton.tsx

# Pokaż importy legacy (powinno być 1: ResultCard)
grep -rn 'from ["\x27]./FavoriteButton["\x27]' src/components/engine-ui/
grep -rn 'from ["\x27]@/components/engine-ui/FavoriteButton["\x27]' src/

# Pokaż importy Part 2 (powinno być 0+ — może być w Lab)
grep -rn 'from ["\x27]./button/FavoriteButton["\x27]' src/components/engine-ui/
grep -rn 'from ["\x27]@/components/engine-ui/button/FavoriteButton["\x27]' src/
```

**Oczekiwany wynik:**
- Legacy importowany 1 raz (ResultCard)
- Part 2 może być importowany w Lab (button section)

#### Krok 0.2: Rename file

```bash
git mv src/components/engine-ui/FavoriteButton.tsx \
       src/components/engine-ui/LegacyFavoriteButton.tsx
```

**Uwaga:** używamy `git mv` (nie `mv`) — git tracking rename jako rename, nie delete + create. Zachowuje historię.

#### Krok 0.3: Update import w ResultCard

```bash
# Zmiana w src/components/engine-ui/ResultCard.tsx
# Przed:
#   import { FavoriteButton } from "./FavoriteButton";
# Po:
#   import { FavoriteButton as LegacyFavoriteButton } from "./LegacyFavoriteButton";
```

**TSX zmiany w ResultCard:**

```tsx
// PRZED:
import { FavoriteButton } from "./FavoriteButton";

// W JSX:
<FavoriteButton
  onToggle={onFavoriteToggle}
  isFavorite={isFavorite}
  className="eui-card-favorite"
/>

// PO:
import { FavoriteButton as LegacyFavoriteButton } from "./LegacyFavoriteButton";

// W JSX:
<LegacyFavoriteButton
  onToggle={onFavoriteToggle}
  isFavorite={isFavorite}
  className="eui-card-favorite"
/>
```

**Powód aliasu `FavoriteButton as LegacyFavoriteButton`:**
- Eksport pliku zostaje `FavoriteButton` (nie chcemy zmieniać API komponentu w Stage 0)
- Lokalna nazwa `LegacyFavoriteButton` jest jasna w kodzie ResultCard
- Stage 5 (ResultCard refactor) użyje Part 2 `FavoriteButton` — eliminacja `LegacyFavoriteButton`

### Verification Stage 0

```bash
# 1. File rename
ls src/components/engine-ui/LegacyFavoriteButton.tsx  # Should exist
ls src/components/engine-ui/FavoriteButton.tsx 2>&1   # Should NOT exist

# 2. Import update
grep -n "LegacyFavoriteButton" src/components/engine-ui/ResultCard.tsx
# Powinno znaleźć: import + 1 użycie w JSX

# 3. Brak orphaned references
grep -rn 'from ["\x27]./FavoriteButton["\x27]' src/components/engine-ui/
# Powinno być EMPTY (ResultCard zaktualizowane)

# 4. Polskie znaki check (defensywnie, choć to TS file)
grep -P '\\u0[01][0-9a-f]{2}' src/components/engine-ui/LegacyFavoriteButton.tsx
grep -P '\\u0[01][0-9a-f]{2}' src/components/engine-ui/ResultCard.tsx
# Powinno być EMPTY

# 5. Build
./node_modules/.bin/next build
# Should pass

# 6. Smoke test
pm2 restart zw-admin
sleep 3
curl -sf http://localhost:3000/admin/engine-ui-lab && echo OK
curl -sf http://localhost:3000/admin/dashboard && echo OK
```

### Commit Stage 0

```
chore(engine-ui): rename legacy FavoriteButton → LegacyFavoriteButton

Pre-refactor cleanup — rozwiązanie kolizji nazw przed Część 8.5a Stage 5
(ResultCard refactor który użyje Part 2 FavoriteButton).

Zmiany:
- Rename src/components/engine-ui/FavoriteButton.tsx → LegacyFavoriteButton.tsx
- Update import w ResultCard.tsx (alias as LegacyFavoriteButton)

Public API zachowane (eksport pliku nadal `FavoriteButton`).
Visual diff: ZERO. Behavior diff: ZERO.

Część 8.5a Stage 0 ✅
```

---

<a id="stage-1-resourcecard"></a>

## Stage 1: ResourceCard refactor

**Czas:** 30-45 min
**Pliki dotykane:** 1 (ResourceCard.tsx) + 0 CSS + 1 Lab specimen
**Visual diff oczekiwany:** mikroskopijne (primitywy normalizują tokenized spacing)
**Functional diff oczekiwany:** ZERO
**Production impact:** 1 call site (ExploreView.tsx) — wymaga screenshot before/after

### Cel

Refactor `src/components/booking/ResourceCard.tsx` (176 linii, pure Tailwind, 0 hardcoded eui-* klas) na primitywy z Parts 1-8.

**Idealny "first contact" z 8.5a:**
- Najprostszy plik
- Zero zależności od innych legacy
- Pure Tailwind → primitywy = czyste mapowanie
- 1 production call site = pełna kontrola

### Obecny stan (z audit, linia po linii)

| Linia | Wzorzec obecny | Target primitive |
|---|---|---|
| 86 | `<div className="bg-card rounded-2xl border-2 border-border hover:border-primary/40 ... overflow-hidden flex flex-col">` (root card wrapper) | `<CardSurface elevation="raised" radius="2xl" interactive padding={0}>` (Part 3) |
| 88 | `<div className="relative aspect-[16/10] bg-muted overflow-hidden">` (cover container) | `<MediaFrame aspectRatio="16:10">` (Part 8) |
| 96-100 | `<ImageOff className="h-8 w-8 text-muted-foreground/30" />` w wycentrowanym divie (empty state) | `<ImagePlaceholder size="lg" />` (Part 8) |
| 102-106 | `<div className="absolute top-3 left-3"><span className="bg-white/90 backdrop-blur-sm text-foreground/80 px-2.5 py-1 rounded-full text-[11px] font-medium">{category}</span></div>` (badge) | `<MediaOverlay position="top-left"><MediaBadge variant="neutral">{category}</MediaBadge></MediaOverlay>` (Part 8) |
| 112 | `<h3 className="text-[15px] font-semibold text-foreground truncate">{name}</h3>` (title) | `<h3 className="eui-title-3">{name}</h3>` (Part 6 utility class) |
| 117-130 | `<div className="flex items-center gap-3"><span className="inline-flex items-center gap-1 text-[12px] text-muted-foreground"><Users className="h-3.5 w-3.5" /><span>{capacity}</span></span> ... </div>` (meta row) | `<Inline gap="sm" align="center"><InlineMeta icon={<Users />} label={capacity} /> ... </Inline>` (Part 7 + Part 6) |
| 134 | `<p className="text-[13px] text-muted-foreground mt-2 line-clamp-2 leading-relaxed">{description}</p>` (description) | `<p className="eui-body-small text-muted-foreground mt-2 line-clamp-2">{description}</p>` (Part 6 utility class) |
| 141-158 | `<div className="flex flex-wrap gap-1.5">{amenities.map(...)}</div>` z `<span className="text-[11px] ... bg-muted/50 rounded-full px-2 py-0.5">` (chips) | `<Inline wrap gap="xs">{amenities.map(a => <Tag variant="neutral" size="sm">{a}</Tag>)}</Inline>` (Part 7 + Part 5) |
| 162 | `<div className="flex-1 min-h-3" />` (spacer push) | `<Spacer grow />` (Part 7) |
| 165-171 | `<button className="bg-primary hover:bg-primary/90 ... transition-all active:scale-[0.98]">` (CTA) | `<Button variant="primary" size="md" leadingIcon={<Search />}>` (Part 2) |

### Target stan — pełen TSX (~80 linii vs 176 obecnych)

```tsx
"use client";

import * as React from "react";
import { Users, BedDouble, Search, ImageOff } from "lucide-react";
import { DynamicIcon } from "@/components/ui/dynamic-icon";

import { CardSurface } from "@/components/engine-ui/surface/CardSurface";
import { MediaFrame } from "@/components/engine-ui/media/MediaFrame";
import { MediaOverlay } from "@/components/engine-ui/media/MediaOverlay";
import { MediaBadge } from "@/components/engine-ui/media/MediaBadge";
import { ImagePlaceholder } from "@/components/engine-ui/media/ImagePlaceholder";
import { Inline } from "@/components/engine-ui/layout/Inline";
import { Spacer } from "@/components/engine-ui/layout/Spacer";
import { InlineMeta } from "@/components/engine-ui/text/InlineMeta";
import { Tag } from "@/components/engine-ui/chip/Tag";
import { Button } from "@/components/engine-ui/button/Button";

export interface ResourceCardProps {
  id: string;
  name: string;
  category?: string;
  description?: string;
  imageUrl?: string;
  capacity?: number;
  bedCount?: number;
  amenities?: Array<{ icon?: string; label: string }>;
  onSelect?: (id: string) => void;
}

export const ResourceCard = React.forwardRef<HTMLDivElement, ResourceCardProps>(
  function ResourceCard(
    { id, name, category, description, imageUrl, capacity, bedCount, amenities = [], onSelect },
    ref
  ) {
    const handleClick = () => onSelect?.(id);

    return (
      <CardSurface
        ref={ref}
        elevation="raised"
        radius="2xl"
        interactive={!!onSelect}
        padding={0}
        onClick={onSelect ? handleClick : undefined}
        role={onSelect ? "button" : undefined}
        tabIndex={onSelect ? 0 : undefined}
        className="flex flex-col h-full"
      >
        {/* Cover image z empty state + category badge */}
        <MediaFrame aspectRatio="16:10">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={name}
              loading="lazy"
              className="w-full h-full object-cover"
            />
          ) : (
            <ImagePlaceholder size="lg" icon={<ImageOff />} />
          )}
          {category && (
            <MediaOverlay position="top-left">
              <MediaBadge variant="neutral">{category}</MediaBadge>
            </MediaOverlay>
          )}
        </MediaFrame>

        {/* Content */}
        <div className="flex-1 flex flex-col p-4">
          <h3 className="eui-title-3 truncate">{name}</h3>

          <Inline gap="sm" align="center" className="mt-1">
            {capacity !== undefined && (
              <InlineMeta icon={<Users className="h-3.5 w-3.5" />} label={`${capacity} osób`} />
            )}
            {bedCount !== undefined && (
              <InlineMeta icon={<BedDouble className="h-3.5 w-3.5" />} label={`${bedCount} łóżek`} />
            )}
          </Inline>

          {description && (
            <p className="eui-body-small text-muted-foreground mt-2 line-clamp-2">{description}</p>
          )}

          {amenities.length > 0 && (
            <Inline wrap gap="xs" className="mt-3">
              {amenities.map((a, i) => (
                <Tag key={i} variant="neutral" size="sm">
                  {a.icon && <DynamicIcon name={a.icon} className="h-3 w-3 mr-1" />}
                  {a.label}
                </Tag>
              ))}
            </Inline>
          )}

          <Spacer grow />

          {onSelect && (
            <Button
              variant="primary"
              size="md"
              leadingIcon={<Search className="h-4 w-4" />}
              className="mt-3 w-full"
            >
              Zobacz dostępność
            </Button>
          )}
        </div>
      </CardSurface>
    );
  }
);
```

### Diff highlights

| Aspekt | Przed | Po | Komentarz |
|---|---|---|---|
| Linii TSX | 176 | ~80 | -54% kompresja przez kompozycję |
| Hand-rolled `<button>` | 1 (CTA) | 0 (Button) | a11y + focus + hover from primitive |
| Hand-rolled badge | 1 (category span) | 0 (MediaBadge) | spójna semantyka |
| Hand-rolled image container | 1 (aspect-[16/10] div) | 0 (MediaFrame) | aspect ratio przez prop |
| Hand-rolled spacer | 1 (`flex-1 min-h-3`) | 0 (Spacer grow) | semantic + tested |
| Tailwind text-[Xpx] | 4 | 0 | utility classes Part 6 |

### Dodatkowe założenia (do potwierdzenia z Claude Code podczas implementacji)

1. **InlineMeta props:** `icon` + `label`. Audit wskazał ten primitive z Part 6/7 — Claude Code podczas implementacji sprawdzi exact props.

2. **Tag size="sm":** weryfikacja czy Tag z Part 5 ma size="sm". Jeśli nie — fallback do `<Tag variant="neutral">` bez size prop.

3. **Button leadingIcon:** weryfikacja czy Button z Part 2 ma `leadingIcon` prop. Jeśli inaczej (np. `iconLeft`), użyć właściwej nazwy.

**Uwaga:** te pomniejsze szczegóły API NIE są blockerami blueprintu. Claude Code dostosuje exact prop names po sprawdzeniu plików primitywów. Liczy się **strukturalna kompozycja**.

### Lab specimen update

`src/components/booking-lab/sections/ResourceCardSection.tsx` (jeśli istnieje) lub `src/components/engine-ui-lab/sections/ResourceCardSection.tsx`:

- Sprawdzić czy ResourceCard ma sekcję w Lab
- Jeśli tak — zachować specimens, weryfikować że nadal działają
- Jeśli nie — Stage 1 NIE wprowadza nowej sekcji Lab (out of scope, w 8.5a żadnych nowych Lab sekcji)

### Verification Stage 1

```bash
# 1. Build
./node_modules/.bin/next build

# 2. Polish chars
grep -rP '\\u0[01][0-9a-f]{2}' src/components/booking/ResourceCard.tsx
# Should be EMPTY

# 3. Type check
# Build już to robi — jeśli build pass, types OK

# 4. Smoke test
pm2 restart zw-admin && sleep 3
curl -sf http://localhost:3000/admin/engine-ui-lab && echo OK
curl -sf http://localhost:3000/admin/dashboard && echo OK
curl -sf http://localhost:3000/explore && echo OK   # ExploreView!

# 5. Visual verification (manualnie)
# - Otwórz /explore w browser
# - Karta resource powinna wyglądać IDENTYCZNIE jak przed
# - Click działa
# - Hover state OK
# - Keyboard Tab/Enter działa (a11y)
```

### Functional equivalence test

W browser na `/explore`:

| Test | Oczekiwany rezultat |
|---|---|
| Click na kartę | onSelect(id) wywołane (sprawdzić w DevTools console) |
| Hover na kartę | border highlight (visual) |
| Tab przez kartę | focus ring widoczny, Enter aktywuje onSelect |
| Empty image (no imageUrl) | ImagePlaceholder + ImageOff icon widoczne |
| Long description | line-clamp-2 zachowany |
| Long amenities list | wrap działa |
| Brak onSelect prop | karta NIE jest klikalna, brak focus ring |

### 🎯 Production caution dla Stage 1 (ChatGPT v1.1)

> **ResourceCard jest jedynym komponentem z 8.5a używanym w produkcji** (`ExploreView.tsx`). Dodatkowa staranność:

#### Pre-stage screenshot baseline

```bash
# PRZED Stage 1 — screenshot baseline w przeglądarce:
# 1. Otwórz /explore na desktop (1920×1080)
# 2. Screenshot całej karty z różnymi stanami:
#    - Z imageUrl
#    - Bez imageUrl (empty state)
#    - Z długim opisem (line-clamp test)
#    - Z dużą liczbą amenities (wrap test)
# 3. Zapisz w /tmp/resource-card-before-desktop.png
# 4. Otwórz na mobile viewport (375×667 — DevTools)
# 5. Screenshot mobile state
# 6. Zapisz w /tmp/resource-card-before-mobile.png
```

#### Post-stage screenshot comparison

```bash
# PO deploy Stage 1 — screenshot post:
# 1. Te same scenariusze co baseline
# 2. /tmp/resource-card-after-desktop.png
# 3. /tmp/resource-card-after-mobile.png

# Side-by-side comparison:
# - Layout: IDENTYCZNY (lub mikroskopijne tokenized diff)
# - Colors: IDENTYCZNE
# - Spacing: pixel-level diff <2px OK
# - Hover state: consistent z primitywami
```

#### Optional Lighthouse sanity check

```bash
# Tylko jeśli Robert ma czas — opcjonalne:
# 1. Chrome DevTools → Lighthouse → Performance + Accessibility
# 2. Run audit na /explore PRZED Stage 1
# 3. Zapisz score
# 4. Po Stage 1 → run audit ponownie
# 5. Sprawdź czy:
#    - Performance score: NIE niższe (mikroskopijne diff OK)
#    - Accessibility score: NIE niższe (powinno być takie samo lub wyższe — primitywy a11y-correct)
```

**Powód dodatkowej staranności:** ResourceCard to jedyny komponent w 8.5a który widzą prawdziwi użytkownicy. Inne komponenty (ImageCarousel, ResultCard, etc.) są tylko w Lab + wewnętrznie. Regresja w ResourceCard = realny user impact, regresja w innych = "just developer-visible".

### Commit Stage 1

```
feat(engine-ui): refactor ResourceCard na primitywy Parts 1-8 (Część 8.5a Stage 1)

Refactor src/components/booking/ResourceCard.tsx z hand-rolled Tailwind
na kompozycję primitywów Engine UI:

- root <div> → <CardSurface elevation=raised radius=2xl interactive>
- cover image → <MediaFrame aspectRatio="16:10">
- empty state → <ImagePlaceholder size=lg icon={<ImageOff />}>
- category badge → <MediaOverlay top-left> + <MediaBadge variant=neutral>
- title → .eui-title-3 utility class
- meta row → <Inline gap=sm> + <InlineMeta>
- description → .eui-body-small utility class
- amenities chips → <Inline wrap gap=xs> + <Tag variant=neutral>
- spacer → <Spacer grow>
- CTA → <Button variant=primary leadingIcon={<Search />}>

Linii TSX: 176 → ~80 (-54% kompresja przez kompozycję).

Visual diff: mikroskopijne (tokenized spacing/radius z primitywów,
zgodne z 8.5a discipline "Same UI, nowe primitives pod spodem").

Functional diff: ZERO.

Production call site: src/components/booking/ExploreView.tsx weryfikowane.

Część 8.5a Stage 1 ✅
```

### Rollback Stage 1

```bash
git revert HEAD
./node_modules/.bin/next build
pm2 restart zw-admin
```

Stage 1 nie ma zewnętrznych zależności — rollback bezpieczny i niezależny.

---

<a id="stage-2-imagecarousel"></a>

## Stage 2: ImageCarousel refactor

**Czas:** 30-45 min
**Pliki dotykane:** 1 (ImageCarousel.tsx) + 1 CSS section (zachować/dostosować)
**Visual diff oczekiwany:** mikroskopijne
**Functional diff oczekiwany:** ZERO
**Production impact:** 0 (tylko Lab + ResultCard wewnętrznie)

### Cel

Refactor `src/components/engine-ui/ImageCarousel.tsx` (131 linii, 8 hardcoded eui-* klas) na primitywy z Part 4 + Part 8.

**ZACHOWAĆ:**
- scroll-snap CSS w `.eui-image-carousel-track` (Q2 decision)
- Lazy loading (eager dla active, lazy dla reszty)
- Scroll listener with `passive: true`
- `e.stopPropagation()` w arrow onClick (żeby nie odpalić card.onClick)
- Arrows visible only on hover (CSS-driven, nie TSX)
- State: useRef + useState + useEffect

**REPLACE:**
- Hand-rolled placeholder SVG → ImagePlaceholder
- Hand-rolled arrow buttons → GalleryNavButton
- Hand-rolled dot indicators → PaginationDot
- `<img>` element → wrap w MediaFrame

### Obecny stan (z audit)

| Linia | Wzorzec obecny | Target primitive |
|---|---|---|
| 60-64 | Inline `<svg>` placeholder ikona | `<ImagePlaceholder size="lg" />` (Part 8) |
| 76-83 | `<img className="eui-carousel-img" loading={i === 0 ? "eager" : "lazy"} />` | `<MediaFrame>` wraping `<img>` (zachować lazy logic) |
| 91-108 | `<button className="eui-carousel-arrow eui-carousel-prev/next">` z `<ChevronLeft/Right size={16} />` | `<GalleryNavButton direction="left/right" onClick={...}>` (Part 8) |
| 114-127 | `<span className="eui-carousel-dot eui-carousel-dot-active?">` | `<PaginationDot active={i === activeIndex} />` (Part 4) |
| Container | `<div className="eui-carousel-track">` ze scroll-snap | `<div className="eui-image-carousel-track">` — NEW class name (rename), CSS lokalny zachowany |

### CSS strategy

**Rename CSS class:** `.eui-carousel-track` → `.eui-image-carousel-track`

Powód: stare `.eui-carousel-*` klasy zostają w globals.css (zgodnie z policy "CSS legacy cleanup w 8.5b"). Ale **nowa klasa** `.eui-image-carousel-track` to component-specific scroll-snap container — komponent-lokalny, nie systemic primitive (Q2).

**CSS dla `.eui-image-carousel-track`** (dodajemy do globals.css w sekcji "CZĘŚĆ 8.5a — ImageCarousel"):

```css
/* CZĘŚĆ 8.5a — ImageCarousel scroll-snap track */

.engine-root .eui-image-carousel-track {
  display: flex;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;  /* Firefox */
}

.engine-root .eui-image-carousel-track::-webkit-scrollbar {
  display: none;  /* WebKit */
}

.engine-root .eui-image-carousel-track > * {
  flex: 0 0 100%;
  scroll-snap-align: start;
}
```

**Stara klasa `.eui-carousel-track`** zostaje w globals.css — będzie usunięta w 8.5b cleanup.

### Target stan — pełen TSX (~85 linii vs 131 obecnych)

```tsx
"use client";

import * as React from "react";
import type { ResultImage } from "./results-types";

import { MediaFrame } from "./media/MediaFrame";
import { ImagePlaceholder } from "./media/ImagePlaceholder";
import { GalleryNavButton } from "./media/GalleryNavButton";
import { PaginationDot } from "./nav/PaginationDot";
import { Inline } from "./layout/Inline";

export interface ImageCarouselProps {
  images: ResultImage[];
  altPrefix?: string;
  onImageClick?: (index: number) => void;
}

export const ImageCarousel = React.forwardRef<HTMLDivElement, ImageCarouselProps>(
  function ImageCarousel({ images, altPrefix = "", onImageClick }, ref) {
    const trackRef = React.useRef<HTMLDivElement>(null);
    const [activeIndex, setActiveIndex] = React.useState(0);

    // Scroll listener (passive)
    React.useEffect(() => {
      const track = trackRef.current;
      if (!track) return;

      const handleScroll = () => {
        const slideWidth = track.offsetWidth;
        const newIndex = Math.round(track.scrollLeft / slideWidth);
        setActiveIndex(newIndex);
      };

      track.addEventListener("scroll", handleScroll, { passive: true });
      return () => track.removeEventListener("scroll", handleScroll);
    }, []);

    const scrollToIndex = (index: number) => {
      const track = trackRef.current;
      if (!track) return;
      track.scrollTo({
        left: index * track.offsetWidth,
        behavior: "smooth",
      });
    };

    const handlePrev = (e: React.MouseEvent) => {
      e.stopPropagation();  // Prevent parent card onClick
      scrollToIndex(Math.max(0, activeIndex - 1));
    };

    const handleNext = (e: React.MouseEvent) => {
      e.stopPropagation();  // Prevent parent card onClick
      scrollToIndex(Math.min(images.length - 1, activeIndex + 1));
    };

    if (images.length === 0) {
      return (
        <MediaFrame ref={ref} aspectRatio="16:10">
          <ImagePlaceholder size="lg" />
        </MediaFrame>
      );
    }

    return (
      <div ref={ref} className="relative">
        <div ref={trackRef} className="eui-image-carousel-track">
          {images.map((image, i) => (
            <MediaFrame key={i} aspectRatio="16:10">
              <img
                src={image.url}
                alt={`${altPrefix}${i + 1}`}
                loading={i === 0 ? "eager" : "lazy"}
                className="w-full h-full object-cover"
                onClick={onImageClick ? () => onImageClick(i) : undefined}
              />
            </MediaFrame>
          ))}
        </div>

        {images.length > 1 && (
          <>
            <GalleryNavButton
              direction="left"
              visible={activeIndex > 0}
              onClick={handlePrev}
              className="absolute left-2 top-1/2 -translate-y-1/2"
            />
            <GalleryNavButton
              direction="right"
              visible={activeIndex < images.length - 1}
              onClick={handleNext}
              className="absolute right-2 top-1/2 -translate-y-1/2"
            />

            <Inline
              gap="xs"
              justify="center"
              className="absolute bottom-2 left-0 right-0 pointer-events-none"
            >
              {images.map((_, i) => (
                <PaginationDot key={i} active={i === activeIndex} />
              ))}
            </Inline>
          </>
        )}
      </div>
    );
  }
);
```

### Diff highlights

| Aspekt | Przed | Po | Komentarz |
|---|---|---|---|
| Linii TSX | 131 | ~85 | -35% kompresja |
| Hand-rolled `<button>` arrows | 2 | 0 | GalleryNavButton from Part 8 |
| Hand-rolled `<svg>` placeholder | 1 | 0 | ImagePlaceholder from Part 8 |
| Hand-rolled `<span>` dots | N (per slide) | 0 | PaginationDot from Part 4 |
| CSS classes hardcoded | 8 (eui-carousel-*) | 1 (eui-image-carousel-track) | Reduced to scroll-snap container |

### Verification Stage 2

```bash
# 1. Build
./node_modules/.bin/next build

# 2. Polish chars
grep -rP '\\u0[01][0-9a-f]{2}' src/components/engine-ui/ImageCarousel.tsx

# 3. Smoke test
pm2 restart zw-admin && sleep 3
curl -sf http://localhost:3000/admin/engine-ui-lab && echo OK

# 4. Visual + functional w browser
# Otwórz /admin/engine-ui-lab → Media section → ImageCarousel specimen (jeśli istnieje)
# Lub Lab z ResultCard użyciem
```

### Functional equivalence test

| Test | Oczekiwany rezultat |
|---|---|
| Scroll na trackball/touchpad | scroll-snap działa, activeIndex aktualizowany |
| Click prev/next arrows | scroll do prev/next slide, e.stopPropagation działa |
| Lazy loading | DevTools Network: pierwsze image eager, reszta lazy |
| Empty images array | ImagePlaceholder widoczny |
| Single image | Brak arrows, brak dots |
| Click na image | onImageClick(index) wywołane |
| Arrow visibility | hidden when at first/last (visible prop) |

### Commit Stage 2

```
feat(engine-ui): refactor ImageCarousel na primitywy Parts 4 + 8 (Część 8.5a Stage 2)

Refactor src/components/engine-ui/ImageCarousel.tsx z hand-rolled HTML
na kompozycję primitywów:

- placeholder SVG → <ImagePlaceholder size=lg> (Part 8)
- arrow buttons → <GalleryNavButton direction=left/right> (Part 8)
- dot indicators → <PaginationDot active={...}> (Part 4)
- image element wrapped in <MediaFrame aspectRatio=16:10> (Part 8)
- dot container → <Inline gap=xs justify=center> (Part 7)

CSS:
- Nowa klasa .eui-image-carousel-track (scroll-snap container, lokalna)
- Stare klasy .eui-carousel-* zostają w globals.css (cleanup w 8.5b)

ZACHOWANE behaviors:
- Lazy loading (i === 0 eager, reszta lazy)
- Scroll listener with passive: true
- e.stopPropagation() w arrow onClick
- Arrows visible state via visible prop

Linii TSX: 131 → ~85 (-35% kompresja).

Visual diff: mikroskopijne. Functional diff: ZERO.

Część 8.5a Stage 2 ✅
```

---

<a id="stage-3-stepper-light"></a>

## Stage 3: Stepper light refactor

**Czas:** 15-20 min
**Pliki dotykane:** 1 (Stepper.tsx)
**Visual diff oczekiwany:** mikroskopijne (IconButton vs hand-rolled)
**Functional diff oczekiwany:** ZERO
**API change:** ZERO (backward compatible z GuestPicker)

### Cel — LIGHT refactor (NIE pełny)

Q3 decision: zostaw Stepper jako 99% jest, podmień TYLKO 2 rzeczy:

1. `<button class="eui-stepper-btn">` → `<IconButton size="sm" shape="circle" variant="ghost">`
2. `<span class="eui-stepper-value">` → dodać `eui-body` utility class

**Co NIE zmieniamy:**
- forwardRef (już jest)
- role="spinbutton" (już jest)
- ARIA attributes (już są)
- Keyboard handling (Arrow keys, Home, End — wszystko zostaje)
- Public API (props, types)
- Internal state (useCallback dla commit)

**Pełen formal refactor → Part 11 Form Controls.**

### Obecny stan (z audit)

| Wzorzec obecny | Target |
|---|---|
| `<button className="eui-stepper-btn" onClick={decrement} ...>` | `<IconButton size="sm" shape="circle" variant="ghost" onClick={decrement} ...>` |
| `<button className="eui-stepper-btn" onClick={increment} ...>` | `<IconButton size="sm" shape="circle" variant="ghost" onClick={increment} ...>` |
| `<span className="eui-stepper-value">{value}</span>` | `<span className="eui-stepper-value eui-body">{value}</span>` |

### Założenia (do potwierdzenia z Claude Code)

**IconButton API z Part 2:**
- Sprawdzić czy ma props: `size`, `shape`, `variant`, `onClick`, `aria-label`, `disabled`
- Sprawdzić czy `shape="circle"` istnieje (alternatywnie: kierunek `style="border-radius: 50%"` lub default round)

**Jeśli IconButton nie ma `shape="circle"`:**
- Fallback: `<IconButton size="sm" variant="ghost" className="!rounded-full">` (utility tailwind override)
- Lub: kontynuuj używać `eui-stepper-btn` z drobną modyfikacją CSS (zachowanie current circle styling)

**Decyzja Claude Code podczas implementacji:** sprawdzić plik IconButton, dostosować syntax.

### Verification Stage 3

```bash
# 1. Build
./node_modules/.bin/next build

# 2. Smoke test
pm2 restart zw-admin && sleep 3
curl -sf http://localhost:3000/admin/engine-ui-lab && echo OK

# 3. Functional equivalence (manualnie)
# Otwórz /admin/engine-ui-lab → Stepper specimen (jeśli istnieje, w którejś sekcji)
# - Increment/decrement działa
# - Disabled state
# - Min/max boundaries
# - Arrow keys (↑↓), Home, End
# - Focus ring na buttonach
# - Tab order
```

### Commit Stage 3

```
feat(engine-ui): light refactor Stepper na IconButton (Część 8.5a Stage 3)

Light refactor src/components/engine-ui/Stepper.tsx (per Q3 decision —
pełny refactor → Part 11 Form Controls):

- <button class="eui-stepper-btn"> → <IconButton size=sm shape=circle variant=ghost>
- <span class="eui-stepper-value"> → dodać .eui-body utility class

API: ZERO change. Backward compatible z GuestPicker (Stage 4).
ZACHOWANE: forwardRef, role=spinbutton, ARIA, Arrow keys, Home/End.

Visual diff: mikroskopijne (IconButton hover/focus rings).
Functional diff: ZERO.

Część 8.5a Stage 3 ✅
```

---

<a id="stage-4-guestpicker"></a>

## Stage 4: GuestPicker refactor

**Czas:** 45-60 min
**Pliki dotykane:** 1 (GuestPicker.tsx)
**Visual diff oczekiwany:** mikroskopijne
**Functional diff oczekiwany:** ZERO
**Critical preserve:** **Draft/commit model** (linie 147-180 — ChatGPT correction §5.5)

### Cel

Refactor `src/components/engine-ui/GuestPicker.tsx` (287 linii, 9 hardcoded eui-* klas) na primitywy z Parts 1-7.

### KRYTYCZNE — co MUSI być zachowane

**Draft/commit model (linie 147-180):**

GuestPicker używa "draft state" — zmiany użytkownika nie są aplikowane do parent prop value od razu. Dopiero kliknięcie "Zastosuj" commituje draft do `onChange(draft)`. To **explicit design decision** dla popover-based UI gdzie user może wycofać się z modyfikacji.

```tsx
// PSEUDOKOD — to MUSI zostać zachowane
const [draft, setDraft] = useState<BookingParty>(value);

useEffect(() => {
  setDraft(value);  // Resync from prop on external change
}, [value]);

const apply = () => {
  onChange(draft);
  onClose?.();
};

const reset = () => {
  setDraft(emptyParty);
};
```

**Stage 4 zachowuje 100% tej logiki.** Zmieniamy tylko HTML structure, nie state management.

### Obecny stan (z audit)

| Linia | Wzorzec obecny | Target primitive |
|---|---|---|
| 240-266 | Row layout `<div class="eui-guestpicker-row">` z 3 sekcjami (icon | label | stepper) | `<Inline gap="md" align="center">` (Part 7) |
| 244-258 | Title + subtitle stack `<div class="eui-guestpicker-label">` z `<span>` title + subtitle | `<Stack gap="xs">` (Part 7) z `<Text>` variants (Part 6) |
| 246-254 | Subtitle link `<a>` z target=_blank rel=noopener noreferrer | `<SecondaryLink href={...} external>` (Part 6) |
| 269-285 | Footer `<div class="eui-guestpicker-footer">` z 2 buttonami (Wyczyść + Zastosuj) | `<ActionRow justify="space-between">` (Part 7) z `<Button variant="ghost">` + `<Button variant="primary">` (Part 2) |

### Target stan — szkielet

```tsx
"use client";

import * as React from "react";
import { User, Users, Baby, Dog } from "lucide-react";
import { Stepper } from "./Stepper";
import { type BookingParty } from "@/lib/booking-params";

import { Stack } from "./layout/Stack";
import { Inline } from "./layout/Inline";
import { ActionRow } from "./layout/ActionRow";
import { Button } from "./button/Button";
import { SecondaryLink } from "./text/SecondaryLink";

export interface GuestPickerProps {
  value: BookingParty;
  onChange: (value: BookingParty) => void;
  onClose?: () => void;
  // ... existing props
}

export const GuestPicker = React.forwardRef<HTMLDivElement, GuestPickerProps>(
  function GuestPicker({ value, onChange, onClose, /* ... */ }, ref) {
    // Draft/commit model — ZACHOWANY 1:1
    const [draft, setDraft] = React.useState<BookingParty>(value);

    React.useEffect(() => {
      setDraft(value);  // Resync from prop on external change
    }, [value]);

    const apply = () => {
      onChange(draft);
      onClose?.();
    };

    const reset = () => {
      setDraft({ adults: 0, children: 0, infants: 0, pets: 0 });
    };

    // Per-row render helper
    const renderRow = (
      icon: React.ReactNode,
      title: string,
      subtitle: React.ReactNode,
      stepperProps: { value: number; onChange: (v: number) => void; min?: number; max?: number }
    ) => (
      <Inline gap="md" align="center" className="eui-guestpicker-row">
        <div className="eui-guestpicker-icon">{icon}</div>
        <Stack gap="xs" className="flex-1">
          <span className="eui-body font-medium">{title}</span>
          {typeof subtitle === "string" ? (
            <span className="eui-body-small text-muted-foreground">{subtitle}</span>
          ) : (
            subtitle  // SecondaryLink lub inny element
          )}
        </Stack>
        <Stepper {...stepperProps} />
      </Inline>
    );

    return (
      <Stack gap="md" ref={ref} className="eui-guestpicker">
        {renderRow(
          <User className="h-5 w-5" />,
          "Dorośli",
          "Wiek 18+",
          { value: draft.adults, onChange: (adults) => setDraft({ ...draft, adults }), min: 0 }
        )}

        {renderRow(
          <Users className="h-5 w-5" />,
          "Dzieci",
          <SecondaryLink href="/info/dzieci" external>Wiek 2-17</SecondaryLink>,
          { value: draft.children, onChange: (children) => setDraft({ ...draft, children }), min: 0 }
        )}

        {/* ... infants, pets analogicznie */}

        <ActionRow justify="space-between" className="eui-guestpicker-footer">
          <Button variant="ghost" size="sm" onClick={reset}>
            Wyczyść
          </Button>
          <Button variant="primary" size="md" onClick={apply}>
            Zastosuj
          </Button>
        </ActionRow>
      </Stack>
    );
  }
);
```

### Diff highlights

| Aspekt | Przed | Po | Komentarz |
|---|---|---|---|
| Linii TSX | 287 | ~140 | -51% kompresja |
| Hand-rolled `<a>` link | 1+ | 0 | SecondaryLink z Part 6 |
| Hand-rolled buttons | 2 | 0 | Button z Part 2 |
| Hand-rolled flex layouts | 4+ | 0 | Inline + Stack + ActionRow |
| eui-* hardcoded classes | 9 | 4 (zostają jako lokalne markers) | Strukturalne przenoszone na primitywy |

### Verification Stage 4

```bash
# 1. Build
./node_modules/.bin/next build

# 2. Smoke test
pm2 restart zw-admin && sleep 3
curl -sf http://localhost:3000/admin/engine-ui-lab && echo OK

# 3. Functional equivalence — KRYTYCZNE testy draft/commit
# - Otwórz GuestPicker w specimen
# - Klik "+1 Dorośli" → draft state, NIE applies do value yet
# - Klik X (close) BEZ "Zastosuj" → value NIEZMIENIONE (draft discarded)
# - Klik "+1 Dorośli" → klik "Zastosuj" → onChange wywołane z nowym value
# - External value change (np. parent re-render) → draft resyncs do new value
# - "Wyczyść" → draft reset do zero, NIE applies
```

### Commit Stage 4

```
feat(engine-ui): refactor GuestPicker na primitywy Parts 1-7 (Część 8.5a Stage 4)

Refactor src/components/engine-ui/GuestPicker.tsx z hand-rolled HTML
na kompozycję primitywów:

- Row layout → <Inline gap=md align=center> (Part 7)
- Title + subtitle stack → <Stack gap=xs> + .eui-body / .eui-body-small (Part 7 + 6)
- Subtitle link → <SecondaryLink external> (Part 6)
- Footer → <ActionRow justify=space-between> + 2× <Button> (Part 7 + 2)
- Stepper (already light-refactored Stage 3) używany 1:1

KRYTYCZNE — ZACHOWANE 1:1:
- Draft/commit model (handoff §5.5, ChatGPT correction)
- useEffect resync po value change
- apply() / reset() logic

Linii TSX: 287 → ~140 (-51% kompresja).

Visual diff: mikroskopijne. Functional diff: ZERO (włącznie z draft/commit).

Część 8.5a Stage 4 ✅
```

---

<a id="stage-5a-resultcard-structural"></a>

## Stage 5A: ResultCard — structural shell

**Czas:** 30-45 min
**Pliki dotykane:** 1 (ResultCard.tsx) + 1 CSS (lokalny modifier dla unavailable)
**Visual diff oczekiwany:** mikroskopijne (CardSurface + MediaFrame + layout primitywy)
**Functional diff oczekiwany:** ZERO
**Critical preserve:** wszystkie behaviors + legacy peers (Modal, LegacyFavoriteButton, PriceBlock, FeatureChips)

> **Stage 5 split (ChatGPT v1.1):** ResultCard ma za dużo moving parts (29 hardcoded klas, 5 legacy peers, 2× useState, popover + modal + keyboard + click propagation) żeby refactorować w jednym commit. Split na **structural** (5A) i **interactive** (5B) → każdy commit niezależnie verifyowalny + niezależny rollback.
>
> **5A scope:** root structure (CardSurface), image area (MediaFrame + overlays), layout (ActionRow + Stack), typography (utility classes). Czyli **wszystko poza** popover/modal/rating/keyboard.
>
> **5B scope:** popover (price detail), modal (amenities), rating (RatingPill — Q4 visual upgrade), unavailable state (Q6), keyboard handling.

### Cel Stage 5A

Refactor **structural shell** ResultCard:
- root `<article>` → `<CardSurface>` (z minimal interactive props na razie)
- image area `<div eui-card-image>` → `<MediaFrame>` + `<MediaOverlay>` + `<MediaBadge>`
- layout flex containers → `<ActionRow>` + `<Stack>`
- typography → utility classes Part 6

**5A NIE robi:**
- ❌ Rating refactor (Star + score + count zostaje hand-rolled aż do 5B)
- ❌ Popover refactor wnętrza (popover wciąż otwiera hand-rolled price detail panel)
- ❌ Modal interactions (zostają jak są)
- ❌ unavailable state styling (zostaje jak jest)
- ❌ keyboard handler (zostaje na `<article>` level — przeniesiemy do CardSurface w 5B)

**Wynik 5A:** Plik wciąż używa hand-rolled rating, popover content, modal — ale **shell jest już primitywami**.

### Implementacja Stage 5A

**Założenie:** import nowych primitywów (CardSurface, MediaFrame, etc.) na top.

**Zmiany strukturalne:**

```tsx
// PRZED (uproszczone):
<article
  role="button"
  tabIndex={0}
  className={`eui-card ${isUnavailable ? "eui-card-unavailable" : ""}`}
  onKeyDown={handleKeyDown}
  onClick={handleCardClick}
>
  <div className="eui-card-image">
    <ImageCarousel ... />
    <span className="eui-card-badge">{badge}</span>
    <FavoriteButton className="eui-card-favorite" ... />
  </div>
  <div className="eui-card-content">
    <div className="eui-card-title-row">
      <h3 className="eui-card-name">{name}</h3>
      <div className="eui-card-rating">
        <Star ... /> {/* hand-rolled rating ZOSTAJE w 5A */}
      </div>
    </div>
    <p className="eui-card-subtitle">{subtitle}</p>
    <div className="eui-card-bottom">
      {/* ZOSTAJE hand-rolled w 5A */}
    </div>
  </div>
</article>

// PO (Stage 5A):
<CardSurface
  ref={ref}
  elevation="raised"
  radius="xl"
  interactive={!!onSelect}  // ← bez isUnavailable check w 5A
  padding={0}
  onClick={onSelect ? handleCardClick : undefined}
  role={onSelect ? "button" : undefined}
  tabIndex={onSelect ? 0 : undefined}
  // 5B: dodamy aria-disabled + className unavailable
>
  <MediaFrame aspectRatio="16:10">
    <ImageCarousel ... />
    {badge && (
      <MediaOverlay position="top-left">
        <MediaBadge variant="brand">{badge}</MediaBadge>
      </MediaOverlay>
    )}
    <MediaOverlay position="top-right">
      <LegacyFavoriteButton {...} />
    </MediaOverlay>
  </MediaFrame>

  <Stack gap="md" className="p-4">
    <ActionRow justify="space-between" align="start">
      <h3 className="eui-title-3 truncate flex-1">{name}</h3>
      {/* hand-rolled rating ZOSTAJE w 5A — refactor na RatingPill w 5B */}
      <div className="eui-card-rating">
        <Star size={14} fill="currentColor" />
        <span>{score.toFixed(2)}</span>
        <span className="eui-card-rating-count">({count})</span>
      </div>
    </ActionRow>

    {subtitle && (
      <p className="eui-body-small text-muted-foreground truncate">{subtitle}</p>
    )}

    {/* Bottom row — uproszczona w 5A, finalizacja w 5B */}
    <ActionRow justify="space-between" align="center">
      {/* Price area: hand-rolled <button> + <Popover> ZOSTAJE w 5A */}
      <Popover open={priceOpen} onOpenChange={setPriceOpen}>
        <PopoverTrigger asChild>
          {/* hand-rolled price button */}
        </PopoverTrigger>
        <PopoverContent>
          {/* hand-rolled price detail panel ZOSTAJE w 5A */}
        </PopoverContent>
      </Popover>

      {/* Amenities link: hand-rolled <button> ZOSTAJE w 5A */}
      <button
        className="eui-card-amenities-link"
        onClick={(e) => { e.stopPropagation(); setAmenitiesOpen(true); }}
      >
        Udogodnienia
      </button>
    </ActionRow>
  </Stack>

  {/* Modal ZOSTAJE legacy peer */}
  <Modal open={amenitiesOpen} onClose={() => setAmenitiesOpen(false)}>
    {/* hand-rolled categorized amenities ZOSTAJE w 5A */}
  </Modal>
</CardSurface>
```

### Diff highlights Stage 5A

| Aspekt | Przed | Po Stage 5A | Komentarz |
|---|---|---|---|
| Linii TSX | 247 | ~210 | -15% (znacznie więcej w 5B) |
| Hand-rolled card root | 1 (`<article>` + manual) | 0 | CardSurface |
| Hand-rolled image area | 1 div | 0 | MediaFrame + 2× MediaOverlay |
| Hand-rolled rating | 1 (zostaje!) | 1 | 5B refactor na RatingPill |
| Hand-rolled price area | 1 (zostaje!) | 1 | 5B refactor wnętrza popovera |
| Hand-rolled amenities link | 1 (zostaje!) | 1 | 5B refactor na Button |
| Hand-rolled flex layouts | 5+ | 1 (price area) | Stack + ActionRow przejęły większość |
| eui-* hardcoded klasy | 29 | ~10 (rating + price area + amenities) | -65% w 5A, dalsze -90% w 5B |

### Verification Stage 5A

```bash
# 1. Build
./node_modules/.bin/next build

# 2. Polish chars
grep -P '\\u0[01][0-9a-f]{2}' src/components/engine-ui/ResultCard.tsx

# 3. Smoke test
pm2 restart zw-admin && sleep 3
curl -sf http://localhost:3000/admin/engine-ui-lab && echo OK

# 4. Functional equivalence — 5A specific tests
# Otwórz Lab specimen ResultCard
# - Card renders bez errors
# - Image area: MediaFrame visible, badge w top-left, FavoriteButton w top-right
# - Click na image area lub content → onSelect wywołane
# - Click na FavoriteButton → onFavoriteToggle, NIE odpala onSelect
# - ImageCarousel arrows działają (e.stopPropagation z Stage 2)
# - Rating wciąż wyświetla "Star · 4.85 (123)" — STARY format, 5B zmieni
# - Subtitle truncate
# - Title truncate
# - Hand-rolled price popover STILL WORKS (otwiera/zamyka)
# - Hand-rolled amenities link STILL WORKS (otwiera Modal)
# - Modal STILL WORKS (Escape, backdrop click)
# - Keyboard: Tab → focus, Enter → onSelect (przez CardSurface interactive)
```

### Commit Stage 5A

```
feat(engine-ui): refactor ResultCard structural shell (Część 8.5a Stage 5A)

Stage 5A — structural refactor (split z 5B per ChatGPT v1.1 enhancement):

Zmiany:
- root <article> → <CardSurface elevation=raised radius=xl interactive>
- image area → <MediaFrame aspectRatio=16:10> + 2× <MediaOverlay>
- badge → <MediaBadge variant=brand>
- favorite → <LegacyFavoriteButton> (post Stage 0 rename) w MediaOverlay top-right
- title row → <ActionRow justify=space-between>
- subtitle → .eui-body-small utility class
- bottom row → <ActionRow justify=space-between>
- content layout → <Stack gap=md>

ZACHOWANE w 5A (refactor w 5B):
- Hand-rolled rating (Star + score + count) — Stage 5B użyje RatingPill (Q4)
- Hand-rolled price popover content — Stage 5B refactoruje wnętrze
- Hand-rolled amenities link button — Stage 5B użyje Button
- isUnavailable state (interactive=true zawsze w 5A) — Stage 5B doda Q6 logic
- Keyboard handling (CardSurface interactive zapewnia Enter)

Linii TSX: 247 → ~210 (-15% w 5A, dalsza redukcja w 5B).

Visual diff: mikroskopijne. Functional diff: ZERO.

Część 8.5a Stage 5A ✅ — structural shell complete
```

---

<a id="stage-5b-resultcard-interactive"></a>

## Stage 5B: ResultCard — interactive systems

**Czas:** 30-45 min
**Pliki dotykane:** 1 (ResultCard.tsx — kontynuacja po 5A) + 1 CSS (lokalny modifier dla unavailable)
**Visual diff oczekiwany:** mikroskopijne + **1 explicit upgrade (RatingPill separator format Q4)**
**Functional diff oczekiwany:** ZERO
**Critical preserve:** popover state, modal state, keyboard, click propagation

### Cel Stage 5B

Refactor **interactive systems** ResultCard:
- Rating: hand-rolled → `<RatingPill>` (Q4 — visual upgrade do separator format)
- Price popover content: hand-rolled grid → `<PanelSurface>` + `<Stack>` + Text variants
- Amenities link: hand-rolled `<button>` → `<Button variant="ghost" size="sm">`
- Unavailable state: dodanie `aria-disabled` + lokalny modifier (Q6)
- CardSurface interactive: refinement (`interactive={!isUnavailable && !!onSelect}`)

**5B NIE robi:**
- ❌ Refactor Modal (Q5 — odłożone do 8.5b)
- ❌ Refactor LegacyFavoriteButton (8.5b)
- ❌ Refactor PriceBlock (8.5b)
- ❌ Refactor FeatureChips (8.5b)

### Q4 — RatingPill (visual upgrade)

```tsx
// PRZED (po Stage 5A — hand-rolled):
<div className="eui-card-rating">
  <Star size={14} fill="currentColor" />
  <span>{score.toFixed(2)}</span>
  <span className="eui-card-rating-count">({count})</span>  {/* nawiasy! */}
</div>

// PO (Stage 5B):
<RatingPill score={score} count={count} variant="inline" size="md" />
// Renderuje: <Star> · 4.85 · 123  (separator zamiast nawiasów — Q4 explicit upgrade)
```

### Q6 — Unavailable state

```tsx
// CardSurface composition pattern (z Claude Code audit Q6):
<CardSurface
  elevation="raised"
  radius="xl"
  interactive={!isUnavailable && !!onSelect}  // ← Stage 5B: dodanie isUnavailable check
  padding={0}
  onClick={!isUnavailable ? handleCardClick : undefined}  // ← Stage 5B: NIE odpala gdy unavailable
  role={onSelect ? "button" : undefined}
  tabIndex={onSelect && !isUnavailable ? 0 : undefined}  // ← Stage 5B: skip Tab gdy unavailable
  aria-disabled={isUnavailable || undefined}  // ← Stage 5B: AT semantics
  className={isUnavailable ? "eui-result-card-unavailable" : undefined}  // ← Stage 5B: visual
>
```

**Lokalny modifier CSS** (dodajemy do globals.css w sekcji "CZĘŚĆ 8.5a — ResultCard"):

```css
/* CZĘŚĆ 8.5a — ResultCard component-specific modifiers */

.engine-root .eui-result-card-unavailable {
  filter: grayscale(0.5);
  opacity: 0.7;
  cursor: not-allowed;
}
```

### Price popover refactor

```tsx
// PRZED (po Stage 5A — hand-rolled grid w popover content):
<PopoverContent>
  <div className="eui-card-price-detail">
    <div className="eui-card-price-detail-header">
      <h4 className="eui-card-price-detail-title">Szczegóły ceny</h4>
      <button className="eui-card-price-detail-close" onClick={...}>
        <XIcon size={16} />
      </button>
    </div>
    <div className="eui-card-price-detail-rows">
      {/* hand-rolled rows */}
    </div>
    <div className="eui-card-price-total">
      {/* hand-rolled total */}
    </div>
  </div>
</PopoverContent>

// PO (Stage 5B):
<PopoverContent>
  <PanelSurface padding="md">
    <Stack gap="md">
      <ActionRow justify="space-between" align="center">
        <h4 className="eui-title-3">Szczegóły ceny</h4>
        <IconButton
          size="sm"
          variant="ghost"
          aria-label="Zamknij"
          onClick={() => setPriceOpen(false)}
        >
          <XIcon className="h-4 w-4" />
        </IconButton>
      </ActionRow>

      {/* PriceBlock zostaje legacy peer w 8.5a */}
      <PriceBlock {...priceProps} />

      <Stack gap="xs" className="border-t pt-3">
        <ActionRow justify="space-between">
          <span className="eui-body">Razem</span>
          <span className="eui-body font-semibold">{totalFormatted}</span>
        </ActionRow>
        {hasDiscount && (
          <Tag variant="brand-soft">Oszczędzasz {discount}</Tag>
        )}
      </Stack>
    </Stack>
  </PanelSurface>
</PopoverContent>
```

### Amenities link refactor

```tsx
// PRZED (po Stage 5A — hand-rolled <button>):
<button
  className="eui-card-amenities-link"
  onClick={(e) => { e.stopPropagation(); setAmenitiesOpen(true); }}
>
  Udogodnienia
</button>

// PO (Stage 5B):
<Button
  variant="ghost"
  size="sm"
  onClick={(e) => { e.stopPropagation(); setAmenitiesOpen(true); }}
>
  Udogodnienia
</Button>
```

### Diff highlights Stage 5B (kontynuacja po 5A)

| Aspekt | Po Stage 5A | Po Stage 5B | Komentarz |
|---|---|---|---|
| Linii TSX | ~210 | ~180 | -14% dalsza kompresja |
| Hand-rolled rating | 1 | 0 | RatingPill (Q4 visual upgrade) |
| Hand-rolled price detail panel | 1 | 0 | PanelSurface + Stack + ActionRow |
| Hand-rolled amenities link | 1 | 0 | Button variant=ghost |
| Hand-rolled close button (popover) | 1 | 0 | IconButton variant=ghost |
| Unavailable handling | brak (5A) | `aria-disabled` + lokalny modifier | Q6 wbudowany |
| eui-* hardcoded klasy | ~10 | 1 (eui-result-card-unavailable) | -90% total |

### Verification Stage 5B

```bash
# 1. Build
./node_modules/.bin/next build

# 2. Smoke test
pm2 restart zw-admin && sleep 3
curl -sf http://localhost:3000/admin/engine-ui-lab && echo OK

# 3. Functional equivalence — 5B specific tests
# Otwórz Lab specimen ResultCard
# - Rating: NEW format "Star · 4.85 · 123" (Q4 visual change verified)
# - Click na price popover trigger → popover open, e.stopPropagation działa
# - Price detail panel: PanelSurface + Stack layout, close button działa
# - Click outside popover → close
# - Click na "Udogodnienia" Button → modal open, e.stopPropagation działa
# - Modal close → backdrop click + Escape działa
# - isUnavailable=true:
#   - Visual: grayscale + opacity 0.7 + cursor not-allowed
#   - Click NIE wywołuje onSelect
#   - Tab pomija (tabIndex=-1)
#   - Screen reader (DevTools accessibility) ogłasza "disabled"
# - isUnavailable=false:
#   - Normal interactive behavior
#   - Click → onSelect
#   - Tab → focus → Enter → onSelect
```

### Commit Stage 5B

```
feat(engine-ui): refactor ResultCard interactive systems (Część 8.5a Stage 5B)

Stage 5B — interactive systems refactor (kontynuacja po Stage 5A):

Zmiany:
- rating → <RatingPill score count variant=inline size=md> (Part 5)
  Q4 explicit visual upgrade: "(count)" → "· count" (Airbnb separator format)
- price popover content → <PanelSurface> + <Stack> + <ActionRow> + <IconButton>
- amenities link → <Button variant=ghost size=sm> (Part 2)
- popover close button → <IconButton variant=ghost> (Part 2)

Q6 — CardSurface unavailable handling:
- interactive={!isUnavailable && !!onSelect}
- onClick={!isUnavailable ? handleCardClick : undefined}
- tabIndex={onSelect && !isUnavailable ? 0 : undefined}
- aria-disabled={isUnavailable || undefined}
- className={isUnavailable ? "eui-result-card-unavailable" : undefined}
- Lokalny CSS modifier .eui-result-card-unavailable (grayscale + opacity + cursor)

ZACHOWANE legacy peers (refactor w 8.5b):
- ImageCarousel (refactored Stage 2 — używana nowa wersja)
- LegacyFavoriteButton (post Stage 0 rename — bez zmiany w 5B)
- PriceBlock (legacy peer — wewnątrz popover content)
- Modal (legacy — Q5 odłożone do 8.5b)
- FeatureChips (legacy — wewnątrz Modal content)

ZACHOWANE behaviors:
- Popover-based price detail (priceOpen state, click outside)
- Amenities Modal (amenitiesOpen state)
- Click propagation (e.stopPropagation w buttons)
- Keyboard handling (CardSurface interactive)

Linii TSX: ~210 → ~180 (-14% dalsza kompresja, total 247 → ~180 = -27%).

Visual diff: mikroskopijne + 1 explicit (RatingPill separator format Q4).
Functional diff: ZERO.

Część 8.5a Stage 5B ✅ — ResultCard refactor complete
```

### Rollback Stage 5A → 5B

```bash
# Rollback Stage 5B (zostaje 5A complete)
git revert HEAD
./node_modules/.bin/next build
pm2 restart zw-admin
# Po rollback: ResultCard ma structural primitywy (5A) + hand-rolled rating/price/amenities (PRE-5B)

# Lub multi-stage rollback (5A + 5B)
git revert HEAD~1..HEAD
# Powrót do PRE-Stage 5 state (legacy ResultCard)
```

---

### Cel

Refactor `src/components/engine-ui/ResultCard.tsx` (247 linii, 29 hardcoded eui-* klas — najwięcej z całego scope) na primitywy.

**Najtrudniejszy stage 8.5a** — wymaga rozstrzygnięcia Q4 (RatingPill), Q5 (Modal zostaje), Q6 (CardSurface unavailable).

### KRYTYCZNE — co MUSI być zachowane

1. **5 legacy peers** (NIE są refactorowane w 8.5a):
   - `ImageCarousel` (refactored w Stage 2 — używamy nowej wersji)
   - `LegacyFavoriteButton` (post Stage 0 rename — używamy 1:1)
   - `PriceBlock` (legacy — używamy 1:1)
   - `Modal` (legacy — używamy 1:1, Q5 odłożone do 8.5b)
   - `FeatureChips` (legacy — używamy 1:1)

2. **Popover behavior** (price detail panel):
   - `Popover` z `./primitives/Popover` (NIE jest legacy)
   - `priceOpen` state + `setPriceOpen`
   - Click outside to close

3. **Amenities Modal:**
   - `amenitiesOpen` state + `setAmenitiesOpen`
   - Modal z legacy `./Modal` (Q5)
   - Categorized amenities list

4. **Keyboard handling** (linie 103-113):
   - `onKeyDown` z Enter aktywuje `onSelect` — przeniesione na `<CardSurface interactive>`

5. **Unavailable state:**
   - `isUnavailable` prop
   - Pattern z Q6: lokalny modifier + aria-disabled + interactive=false

### Obecny stan (z audit, top-level)

| Sekcja | Wzorzec obecny | Target |
|---|---|---|
| Card root | `<article role="button" tabIndex onKeyDown> + manual class composition` | `<CardSurface elevation=raised radius=xl interactive>` (Part 3) |
| Image area | `<div eui-card-image>` + `<ImageCarousel>` + absolute badge + absolute FavoriteButton | `<MediaFrame>` + `<ImageCarousel>` + `<MediaOverlay top-left><MediaBadge>` + `<MediaOverlay top-right><LegacyFavoriteButton>` (Part 8) |
| Title row | `<div eui-card-title-row>` z title + rating | `<ActionRow justify="space-between">` (Part 7) |
| Title | `<h3 eui-card-name>` | `<h3 className="eui-title-3 truncate">` (Part 6) |
| Rating | `<Star> + score.toFixed(2) + (count)` | `<RatingPill score count>` (Part 5) — JEDYNY visual change (separator format) |
| Subtitle | `<p eui-card-subtitle>` | `<p className="eui-body-small text-muted-foreground truncate">` (Part 6) |
| Bottom row | `<div eui-card-bottom>` z price + amenities link | `<ActionRow justify="space-between">` (Part 7) |
| Price popover trigger | `<button eui-card-price-trigger>` z amount + unit | `<button>` (zachowany, customowy) — opakowuje `<PriceText>` (Part 6) |
| Price detail panel | hand-rolled grid w popover content | `<PanelSurface>` + `<Stack>` + Text variants + close (Part 3 + 7 + 6) |
| Amenities link | `<button eui-card-amenities-link>` | `<SecondaryLink as="button">` (Part 6) lub `<Button variant="ghost" size="sm">` (Part 2) |
| Amenities Modal | `<Modal>` z categorized list | `<Modal>` (legacy zachowany!) z categorized list (przepisana na primitywy: Stack + ActionRow + Tag) |

### Q4 + Q6 — explicit decisions w kodzie

**Q4 — RatingPill (visual change OK):**

```tsx
// PRZED (linie 137-142):
<div className="eui-card-rating">
  <Star size={14} fill="currentColor" />
  <span>{score.toFixed(2)}</span>
  <span className="eui-card-rating-count">({count})</span>  {/* nawiasy! */}
</div>

// PO:
<RatingPill score={score} count={count} variant="inline" size="md" />
// Renderuje: <Star> · 4.85 · 123  (separator zamiast nawiasów — Q4)
```

**Q6 — CardSurface unavailable (lokalny modifier):**

```tsx
// CardSurface composition pattern (z Claude Code audit Q6):
<CardSurface
  elevation="raised"
  radius="xl"
  interactive={!isUnavailable && !!onSelect}
  padding={0}
  onClick={!isUnavailable ? handleCardClick : undefined}
  role={onSelect ? "button" : undefined}
  tabIndex={onSelect && !isUnavailable ? 0 : undefined}
  aria-disabled={isUnavailable || undefined}
  className={isUnavailable ? "eui-result-card-unavailable" : undefined}
>
  {/* ... */}
</CardSurface>
```

**Lokalny modifier CSS** (dodajemy do globals.css w sekcji "CZĘŚĆ 8.5a — ResultCard"):

```css
/* CZĘŚĆ 8.5a — ResultCard component-specific modifiers */

.engine-root .eui-result-card-unavailable {
  filter: grayscale(0.5);
  opacity: 0.7;
  cursor: not-allowed;
}
```

### Target stan — szkielet (full TSX byłby ~200 linii — szczegóły podczas implementacji)

```tsx
"use client";

import * as React from "react";
import { Star, Tag as TagIcon, X as XIcon } from "lucide-react";
import type { ResultCardData } from "./results-types";
import { ImageCarousel } from "./ImageCarousel";  // refactored Stage 2
import { FavoriteButton as LegacyFavoriteButton } from "./LegacyFavoriteButton";  // post Stage 0
import { PriceBlock } from "./PriceBlock";  // legacy peer (8.5b)
import { Modal } from "./Modal";  // legacy peer (8.5b — Q5)
import { FeatureChips } from "./FeatureChips";  // legacy peer (8.5b)
import { Popover, PopoverTrigger, PopoverContent } from "./primitives/Popover";

import { CardSurface } from "./surface/CardSurface";
import { PanelSurface } from "./surface/PanelSurface";
import { MediaFrame } from "./media/MediaFrame";
import { MediaOverlay } from "./media/MediaOverlay";
import { MediaBadge } from "./media/MediaBadge";
import { Stack } from "./layout/Stack";
import { ActionRow } from "./layout/ActionRow";
import { Button } from "./button/Button";
import { RatingPill } from "./chip/RatingPill";
import { SecondaryLink } from "./text/SecondaryLink";

export const ResultCard = React.forwardRef<HTMLDivElement, ResultCardProps>(
  function ResultCard(
    { data, onSelect, onFavoriteToggle, isFavorite = false, isUnavailable = false },
    ref
  ) {
    const [amenitiesOpen, setAmenitiesOpen] = React.useState(false);
    const [priceOpen, setPriceOpen] = React.useState(false);

    const handleCardClick = () => {
      if (!isUnavailable) onSelect?.(data.id);
    };

    return (
      <CardSurface
        ref={ref}
        elevation="raised"
        radius="xl"
        interactive={!isUnavailable && !!onSelect}
        padding={0}
        onClick={!isUnavailable ? handleCardClick : undefined}
        role={onSelect ? "button" : undefined}
        tabIndex={onSelect && !isUnavailable ? 0 : undefined}
        aria-disabled={isUnavailable || undefined}
        className={isUnavailable ? "eui-result-card-unavailable" : undefined}
      >
        {/* Image area z badge + favorite button */}
        <MediaFrame aspectRatio="16:10">
          <ImageCarousel
            images={data.images}
            altPrefix={`${data.name} - `}
          />
          {data.badge && (
            <MediaOverlay position="top-left">
              <MediaBadge variant="brand">{data.badge}</MediaBadge>
            </MediaOverlay>
          )}
          <MediaOverlay position="top-right">
            <LegacyFavoriteButton
              isFavorite={isFavorite}
              onToggle={onFavoriteToggle}
            />
          </MediaOverlay>
        </MediaFrame>

        {/* Content */}
        <Stack gap="md" className="p-4">
          <ActionRow justify="space-between" align="start">
            <h3 className="eui-title-3 truncate flex-1">{data.name}</h3>
            {data.rating && (
              <RatingPill
                score={data.rating.score}
                count={data.rating.count}
                variant="inline"
                size="md"
              />
            )}
          </ActionRow>

          {data.subtitle && (
            <p className="eui-body-small text-muted-foreground truncate">{data.subtitle}</p>
          )}

          <ActionRow justify="space-between" align="center">
            {/* Price popover */}
            <Popover open={priceOpen} onOpenChange={setPriceOpen}>
              <PopoverTrigger asChild>
                <button
                  className="text-left"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* PriceText composition zamiast hand-rolled — szczegóły implementacji */}
                  {/* ... amount + unit + total hint */}
                </button>
              </PopoverTrigger>
              <PopoverContent>
                <PanelSurface padding="md">
                  {/* Price detail content z PriceBlock (legacy) lub manual */}
                </PanelSurface>
              </PopoverContent>
            </Popover>

            {/* Amenities link */}
            {data.amenities && data.amenities.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setAmenitiesOpen(true);
                }}
              >
                Udogodnienia
              </Button>
            )}
          </ActionRow>
        </Stack>

        {/* Amenities Modal — legacy peer (8.5b) */}
        <Modal open={amenitiesOpen} onClose={() => setAmenitiesOpen(false)}>
          {/* Categorized amenities list — zachowana logika */}
        </Modal>
      </CardSurface>
    );
  }
);
```

### Diff highlights

| Aspekt | Przed | Po | Komentarz |
|---|---|---|---|
| Linii TSX | 247 | ~200 | -19% (mniejsze niż inne — wiele logiki PRESERVED) |
| Hand-rolled card root | 1 (`<article>` + manual keyboard) | 0 | CardSurface |
| Hand-rolled rating | 1 (Star + spans + nawiasy) | 0 | RatingPill |
| Hand-rolled flex layouts | 5+ | 0 | ActionRow + Stack |
| Hand-rolled buttons | 2 (price-trigger, amenities-link) | 1 (price-trigger zachowany jako customowy w Popover) + 1 Button (Part 2) | |
| Legacy peers | 5 (Modal, LegacyFavoriteButton, PriceBlock, Modal, FeatureChips, ImageCarousel) | 5 (zachowane!) | 8.5b cleanup |
| eui-* hardcoded classes | 29 | 1 (eui-result-card-unavailable) | Massive reduction |

### Visual diff dokładnie

**Mikroskopijne** (acceptable):
- Tokenized spacing primitywów (Stack, ActionRow, gaps)
- Border-radius z var(--eui-radius-xl)
- Hover state z CardSurface (consistent z innymi kartami)
- Focus ring z primitywów

**1 explicit upgrade** (Q4):
- Rating: `Star · 4.85 (123)` → `Star · 4.85 · 123` (separator format)

**Wszystko inne**: visual IDENTICAL.

### Verification Stage 5

```bash
# 1. Build (kluczowe — najtrudniejszy stage)
./node_modules/.bin/next build

# 2. Polish chars
grep -rP '\\u0[01][0-9a-f]{2}' src/components/engine-ui/ResultCard.tsx

# 3. Smoke test
pm2 restart zw-admin && sleep 3
curl -sf http://localhost:3000/admin/engine-ui-lab && echo OK

# 4. Functional equivalence — KRYTYCZNE testy
# Lab specimen ResultCard (jeśli istnieje) lub /admin/engine-ui-lab → Results section
# - Click na kartę → onSelect wywołane
# - Click na FavoriteButton (top-right) → onFavoriteToggle wywołane, NIE odpala onSelect
# - Click na price popover trigger → popover open, NIE odpala onSelect
# - Click na "Udogodnienia" → modal open, NIE odpala onSelect
# - isUnavailable=true → grayscale visual, cursor not-allowed, click NIE wywołuje onSelect
# - Tab przez kartę → focus ring, Enter aktywuje onSelect (jeśli nie unavailable)
# - Modal close → backdrop click + X button + Escape
# - Popover close → click outside + Escape
# - ImageCarousel scroll w obrazie → arrows działają, NIE odpala onSelect (e.stopPropagation)
```

### Commit Stage 5

```
feat(engine-ui): refactor ResultCard na primitywy Parts 1-8 (Część 8.5a Stage 5)

Refactor src/components/engine-ui/ResultCard.tsx — najtrudniejszy stage 8.5a
(29 hardcoded eui-* klas, 5 legacy peers).

Główne zmiany:
- root <article> → <CardSurface elevation=raised radius=xl interactive>
- image area → <MediaFrame> + <MediaOverlay top-left/top-right>
- badge → <MediaBadge variant=brand>
- favorite → <LegacyFavoriteButton> (post Stage 0 rename, zachowany jako legacy peer)
- title row → <ActionRow justify=space-between>
- rating → <RatingPill> (Q4 — Airbnb-style separator: "Star · 4.85 · 123")
- subtitle → .eui-body-small utility class
- bottom row → <ActionRow justify=space-between>
- amenities link → <Button variant=ghost size=sm>
- price detail panel → <PanelSurface> + <Stack> + Text variants

Q6 — CardSurface unavailable: lokalny modifier .eui-result-card-unavailable
+ aria-disabled + interactive=false (CardSurface API zachowane).

ZACHOWANE legacy peers (refactor w 8.5b):
- ImageCarousel (refactored Stage 2 — nowa wersja)
- LegacyFavoriteButton (post Stage 0 rename)
- PriceBlock, Modal, FeatureChips (8.5b)

ZACHOWANE behaviors:
- Popover-based price detail (priceOpen state)
- Amenities Modal (amenitiesOpen state, legacy Modal — Q5)
- Keyboard handling (CardSurface interactive)
- isUnavailable state

Visual diff: mikroskopijne + 1 explicit (RatingPill format Q4).
Functional diff: ZERO.

Część 8.5a Stage 5 ✅
```

---

<a id="stage-6-searchbar"></a>

## Stage 6: SearchBar refactor

**Czas:** 60-90 min
**Pliki dotykane:** 1 (SearchBar.tsx)
**Visual diff oczekiwany:** mikroskopijne
**Functional diff oczekiwany:** ZERO
**Critical preserve:** pill shell custom CSS, autoAdvanced flow, guard at submit

### Cel

Refactor `src/components/engine-ui/SearchBar.tsx` (337 linii, 16 hardcoded eui-* klas, **najdłuższy plik**) na primitywy + zachowane custom shell.

### KRYTYCZNE — co MUSI być zachowane

1. **Pill shell custom CSS** (NIE jest primitive — Q2-style decision):
   - `.eui-searchbar` + `.eui-searchbar-pill` zostają jako custom shell
   - Gradient/shadow/radius pill-style wygląd

2. **Variant compose** (hero/compact):
   - Hero: pełny rozmiar, "Szukaj" widoczne na buttonie
   - Compact: zmniejszone rozmiary, iconOnly button
   - Wszystko w 1 component przez `variant` prop

3. **Divider visibility logic** (linie 207-209):
   - Sprzętowe ukrywanie dividera gdy sąsiedni segment otwarty
   - Custom logic — może wymagać lokalnej CSS class lub conditional render

4. **autoAdvanced flow:**
   - Po wyborze daty → automatyczne otwarcie GuestPicker z animacją `eui-popover-slide-in`
   - State: `autoAdvanced` (useState)

5. **Date formatting** (date-fns + pl locale):
   - 1:1 zachowane

6. **Guard at submit** (linie 184-194):
   - Re-open `when` segment jeśli criteria niekompletne (UX pattern)

7. **Zewnętrzne zależności:**
   - `DatePickerTabs` (legacy, **untouched** — Q1 split scope)
   - `GuestPicker` (refactored Stage 4 — używamy nowej wersji)

### Obecny stan (z audit)

| Linia | Wzorzec obecny | Target primitive |
|---|---|---|
| Shell `<div>` | `<div className="eui-searchbar eui-searchbar-pill">` | **Zachowany** (custom shell, zgodnie z decyzją Q2-style) |
| Segment `<button>` | hand-rolled button z label + value | `<Pressable as="button">` (Part 1) z `<Stack gap="xs" align="start">` (Part 7) z `<Text variant="caption">` label + `<Text variant="body" weight="medium">` value |
| Divider | `<div className="eui-searchbar-divider">` | `<Divider orientation="vertical">` (Part 7) jeśli supports `aria-hidden` + visibility class |
| Submit button | hand-rolled `<button>` z `<Search>` icon | `<Button variant="primary" size="md" leadingIcon={<Search/>}>` (Part 2) — w hero "Szukaj" widoczne, w compact iconOnly |
| Guest summary chips | `<span eui-searchbar-guest-summary>` z embedded chip | `<Inline gap="xs">` (Part 7) + `<TinyBadge>` (Part 5) |

### Target stan — szkielet

```tsx
// Plik docelowy ~250 linii (vs 337 obecnych — -26%)

export const SearchBar = React.forwardRef<HTMLDivElement, SearchBarProps>(
  function SearchBar(
    { value, onChange, variant = "hero", /* ... */ },
    ref
  ) {
    const [activeSegment, setActiveSegment] = React.useState<Segment | null>(null);
    const [autoAdvanced, setAutoAdvanced] = React.useState(false);

    // ZACHOWANE: autoAdvanced flow
    const handleDateChange = (dates: DateRange) => {
      onChange({ ...value, dates });
      if (dates.checkOut && !value.guests.adults) {
        setActiveSegment("guests");
        setAutoAdvanced(true);
      }
    };

    // ZACHOWANE: guard at submit
    const handleSubmit = () => {
      if (!value.dates.checkIn || !value.dates.checkOut) {
        setActiveSegment("dates");
        return;
      }
      onSubmit?.(value);
    };

    return (
      <div ref={ref} className={`eui-searchbar eui-searchbar-${variant} eui-searchbar-pill`}>
        {/* Where segment */}
        <SearchBarSegment
          label="Gdzie"
          value={value.where || "Wszędzie"}
          active={activeSegment === "where"}
          onClick={() => setActiveSegment("where")}
        />

        <Divider orientation="vertical" hidden={activeSegment === "where" || activeSegment === "dates"} />

        {/* Dates segment */}
        <SearchBarSegment
          label="Kiedy"
          value={formatDates(value.dates)}
          active={activeSegment === "dates"}
          onClick={() => setActiveSegment("dates")}
        >
          <Popover open={activeSegment === "dates"}>
            <PopoverContent>
              <DatePickerTabs value={value.dates} onChange={handleDateChange} />
            </PopoverContent>
          </Popover>
        </SearchBarSegment>

        <Divider orientation="vertical" hidden={activeSegment === "dates" || activeSegment === "guests"} />

        {/* Guests segment */}
        <SearchBarSegment
          label="Goście"
          value={
            <Inline gap="xs">
              {value.guests.adults > 0 && <TinyBadge>{value.guests.adults}</TinyBadge>}
              {/* ... */}
            </Inline>
          }
          active={activeSegment === "guests"}
          onClick={() => setActiveSegment("guests")}
        >
          <Popover open={activeSegment === "guests"} className={autoAdvanced ? "eui-popover-slide-in" : undefined}>
            <PopoverContent>
              <GuestPicker
                value={value.guests}
                onChange={(guests) => onChange({ ...value, guests })}
                onClose={() => setActiveSegment(null)}
              />
            </PopoverContent>
          </Popover>
        </SearchBarSegment>

        {/* Submit button */}
        <Button
          variant="primary"
          size="md"
          leadingIcon={<Search className="h-4 w-4" />}
          onClick={handleSubmit}
        >
          {variant === "hero" ? "Szukaj" : null}
        </Button>
      </div>
    );
  }
);

// Internal SearchBarSegment helper
function SearchBarSegment({ label, value, active, onClick, children }: SegmentProps) {
  return (
    <>
      <Pressable as="button" onClick={onClick} className="eui-searchbar-segment">
        <Stack gap="xs" align="start">
          <span className="eui-caption">{label}</span>
          <span className="eui-body font-medium">{value}</span>
        </Stack>
      </Pressable>
      {children}
    </>
  );
}
```

### Verification Stage 6

```bash
# 1. Build
./node_modules/.bin/next build

# 2. Smoke test
pm2 restart zw-admin && sleep 3

# 3. Functional equivalence — KRYTYCZNE testy DESKTOP
# Otwórz Lab specimen SearchBar (lub homepage z SearchBar)
# - Hero variant: "Szukaj" text na buttonie widoczne
# - Compact variant: iconOnly button
# - Click "Gdzie" segment → active state
# - Click "Kiedy" segment → DatePicker popover
# - Wybór daty → autoAdvanced: GuestPicker auto-open
# - Click "Goście" segment → GuestPicker popover
# - GuestPicker draft/commit (Stage 4 working) → Apply commits, X reverts
# - Submit bez dat → guard: re-opens "Kiedy" segment, NIE submituje
# - Submit z complete data → onSubmit wywołane
# - Divider visibility: hidden gdy sąsiedni segment active
```

### 📱 EXPLICIT MOBILE SMOKE TEST (ChatGPT v1.1)

> **SearchBar requires explicit mobile smoke test.** Hidden coupling często ujawnia się dopiero w mobile viewport.

**Mobile-specific scenarios:**

```
1. Otwórz DevTools → Device Mode → iPhone 12 Pro (390×844)
2. Lub fizyczny mobile (jeśli accessible przez network)

Test mobile keyboard behavior:
- [ ] Click "Gdzie" segment → keyboard NIE otwiera się (no input)
- [ ] Click "Kiedy" segment → DatePicker popover otwiera się
       — keyboard NIE pojawia się dla DateRangePicker
       — gdy user touches date input field → keyboard otwiera się
- [ ] Click "Goście" segment → GuestPicker popover
       — Stepper buttons MUSZĄ być tap-friendly (min 44×44px)
       — Number value visible (NIE zasłonięty keyboard)

Test focus behavior:
- [ ] Tap segment → segment active state visible
- [ ] Tap outside popover → popover closes
- [ ] Tap submit Search button → submit działa (NIE przypadkowy double-tap)

Test autoAdvanced flow on mobile:
- [ ] Wybór daty (mobile picker) → autoAdvanced GuestPicker open
- [ ] Animation eui-popover-slide-in działa (NIE jerky)
- [ ] GuestPicker mobile layout: stepper buttons accessible

Test submit guards on mobile:
- [ ] Submit bez dat → keyboard NIE otwiera się przypadkowo
- [ ] Re-open "Kiedy" segment → user widzi co MUSI uzupełnić

Test variant compose on mobile:
- [ ] Hero variant: "Szukaj" text widoczny LUB compact icon (depends on viewport)
- [ ] Compact variant: zawsze icon-only

Test divider visibility on mobile:
- [ ] Divider visible w idle state
- [ ] Divider hidden gdy sąsiedni segment open (zachowane)

Test scroll behavior:
- [ ] Page scroll z SearchBar fixed → SearchBar pozostaje na miejscu
       (jeśli używa sticky/fixed — sprawdź)
- [ ] No layout shift przy scroll

Test pill shell on mobile:
- [ ] Custom .eui-searchbar-pill renderuje się correctly
       (gradient/shadow/radius zgodnie z legacy)
- [ ] No clipping na narrow viewport (375px width)
```

**Why mobile smoke test specifically dla SearchBar:**

Hidden coupling w SearchBar (per ChatGPT v1.1 review):
- `autoAdvanced` flow zachowuje się inaczej z touch vs mouse
- Mobile virtual keyboard może rozbić popover positioning
- Touch tap-target sizes (44×44px minimum per WCAG)
- Focus behavior różni się między mobile + desktop
- Pill shell custom CSS może nie odpowiadać poprawnie na mobile breakpoints

Bez explicit mobile testu te bugi mogłyby się ujawnić dopiero u prawdziwego użytkownika w produkcji — co byłoby gorsze niż wykrycie teraz.

### Commit Stage 6

```
feat(engine-ui): refactor SearchBar na primitywy Parts 1-7 (Część 8.5a Stage 6)

Refactor src/components/engine-ui/SearchBar.tsx — najdłuższy plik 8.5a
(337 linii, 16 hardcoded eui-* klas, orchestration component).

Zmiany:
- shell <div> ZACHOWANY jako custom CSS (eui-searchbar-pill — nie ma primitive)
- segment <button> → <Pressable> + <Stack gap=xs> + .eui-caption + .eui-body
- divider <div> → <Divider orientation=vertical hidden={...}>
- submit <button> → <Button variant=primary leadingIcon={<Search/>}>
- guest summary → <Inline gap=xs> + <TinyBadge>
- internal SearchBarSegment helper (DRY 3 segments)

ZACHOWANE behaviors (KRYTYCZNE):
- Pill shell custom CSS
- Variant compose (hero/compact)
- Divider visibility logic
- autoAdvanced flow (date → GuestPicker auto-open z eui-popover-slide-in)
- Date formatting (date-fns + pl)
- Guard at submit (re-open when segment if niekompletne)
- DatePickerTabs untouched (Q1 split scope)
- GuestPicker uses refactored version (Stage 4)

Linii TSX: 337 → ~250 (-26% kompresja).

Visual diff: mikroskopijne. Functional diff: ZERO.

Część 8.5a Stage 6 ✅ — KONIEC Część 8.5a! 🎯

Master Checklist: 8/14 → 8.5/14 = 60%
```

---

<a id="cleanup-strategy"></a>

## 12. CSS legacy cleanup strategy

**KRYTYCZNE: NIE robimy CSS cleanup w 8.5a.**

### Co zostaje w globals.css po 8.5a

Wszystkie legacy CSS klasy zostają:

- `.eui-card-*` (29 klas — używane przez ResultCard pre-refactor logic, niekorzystane już)
- `.eui-carousel-*` (8 klas)
- `.eui-stepper-btn` (zachowana z light refactor)
- `.eui-guestpicker-*` (9 klas)
- `.eui-searchbar-*` (16 klas — partial use)

**To jest SAMO design** zgodnie z CLAUDE.md "CSS legacy cleanup w 8.5b" zasada.

### Dlaczego NIE teraz

1. **Atomic discipline:** każdy stage to refactor TSX. CSS cleanup to OSOBNY rodzaj zmiany.
2. **Risk reduction:** stary CSS nie powoduje regresji (TSX go nie używa). Usuwanie CSS może zepsuć coś co używa tych klas dziedziczone.
3. **Verification scope:** CSS cleanup wymaga osobnego review (czy wszystkie klasy faktycznie nieużywane?) — nie chcemy mieszać z TSX refactor.
4. **Rollback simplicity:** TSX rollback jest pojedynczy commit. CSS cleanup w tym samym commit = trudniejszy revert.

### Plan dla 8.5b

W blueprintcie 8.5b (kolejna Część) jako Stage będzie "CSS Legacy Cleanup":

1. Sprawdź wszystkie hardcoded `eui-*` references w `src/`:
   ```bash
   for class in eui-card eui-carousel eui-stepper eui-guestpicker eui-searchbar; do
     grep -rn "$class" src/ --include="*.tsx" --include="*.ts" | grep -v "node_modules"
   done
   ```

2. Lista klas z 0 references → usunąć z globals.css

3. Verify build + smoke test

4. Commit "chore(css): remove legacy classes after 8.5a refactor"

---

<a id="lab-specimens"></a>

## 13. Lab specimens updates

### Approach

**W 8.5a NIE dodajemy nowych Lab specimens.** Zachowujemy istniejące.

Powód: Lab Round 1 (parts 1-8) ma kompletne specimens dla primitywów. Refactored components (ResourceCard, ResultCard etc.) używają tych primitywów — w Lab pokazują "real-world composition example".

**Co robimy per stage:**
- Sprawdzić czy istnieje specimen w Lab (np. ResultCardSpecimen)
- Jeśli tak — verify że nadal działa po refactor
- Jeśli nie — out of scope (8.5b lub późniejsza Część dodaje sekcje)

### ExploreView (production usage)

ResourceCard ma 1 production call site: `src/components/booking/ExploreView.tsx`. Po Stage 1:
- Otwórz `/explore` w browser
- Visual sanity check (cards renderują się jak przed)
- Functional sanity check (click działa)

---

<a id="rollback"></a>

## 14. Rollback procedures

### Per-stage rollback

Każdy stage = niezależny commit. Rollback prosty:

```bash
# Cofnięcie ostatniego stage
git revert HEAD
./node_modules/.bin/next build
pm2 restart zw-admin
```

### Multi-stage rollback (nie powinno być potrzebne)

Jeśli wykryto regresję w Stage X, ale już są commit-owane Stage X+1, X+2:

```bash
# Cofnięcie 3 ostatnich commitów (stages X+2, X+1, X)
git revert HEAD~2..HEAD
./node_modules/.bin/next build
pm2 restart zw-admin
```

### Catastrophic rollback (worst case)

```bash
# Restore z backup (Stage 0 backup)
tar xzf /tmp/admin-backup-YYYYMMDD-HHMM.tar.gz
./node_modules/.bin/next build
pm2 restart zw-admin
```

---

<a id="manual-qa"></a>

## 15. Manual QA per stage

### Pre-stage backup

PRZED każdym stage:

```bash
# Tarball backup
tar czf /tmp/admin-backup-stage-N-$(date +%Y%m%d-%H%M).tar.gz \
  src/components/booking/ \
  src/components/engine-ui/ \
  src/styles/globals.css

# Git status czysty
git status
# Powinno być clean (ostatni stage commited)
```

### Per-stage QA checklist (15 punktów)

```
□ 1. git status clean przed start
□ 2. Backup tarball stworzony
□ 3. Edit zaaplikowany (z explicit Robert zgoda)
□ 4. Polish chars verified (grep escape sequences = empty)
□ 5. Build pass (./node_modules/.bin/next build)
□ 6. Build output: 0 errors, 0 new warnings
□ 7. pm2 restart zw-admin succeeded
□ 8. pm2 status shows online
□ 9. curl /admin/dashboard 200 OK
□ 10. curl /admin/engine-ui-lab 200 OK
□ 11. Browser visual: layout IDENTICAL (lub mikroskopijne diff acceptable)
□ 12. Browser functional: every interaction works
□ 13. DevTools console: no new errors
□ 14. Robert akceptacja explicit
□ 15. git commit + push
```

### Post-stage verification

```bash
# Logi pm2 — sprawdź czy nie ma nowych errors
pm2 logs zw-admin --lines 30 --nostream | grep -i error
# Powinno być empty (tylko info logs)

# Master Plan update (jeśli to ostatni stage)
# Stage 6 done → update docs/MASTER-PLAN.md: 8/14 → 8.5/14
```

---

<a id="out-of-scope"></a>

## 16. Out of scope (8.5b reference)

Co NIE jest w 8.5a (zostawione na 8.5b):

### Komponenty legacy peers

- `Modal.tsx` → BottomSheet (mobile) + Dialog (desktop) — wymaga rozszerzenia Part 3
- `LegacyFavoriteButton.tsx` → use Part 2 `FavoriteButton` (post 8.5a, prosty drop-in replacement)
- `PriceBlock.tsx` → migracja na Part 6 `PriceText` + `Stack`
- `FeatureChips.tsx` → migracja na Part 5 `Chip` / `Tag` w `Inline`

### Komponenty poza scope obu rund

- `AvailabilityBadge.tsx`
- `DatePickerTabs.tsx`, `DateRangePicker.tsx`, `FlexibleDatePicker.tsx`
- `PopoverItem.tsx`
- `ResultsHeader.tsx`, `ResultsEmptyState.tsx`, `ResultsSkeleton.tsx`
- `SegmentedControl.tsx`

Te komponenty będą refactorowane w późniejszych Częsciach (np. Part 9 Skeleton, Part 13 Booking Commerce, Faza 3B Results).

### CSS cleanup

- Usunięcie nieużywanych `.eui-card-*`, `.eui-carousel-*`, etc.

### Visual upgrades

- Spacing tweaks
- Layout adjustments
- Animation additions
- Color refinements

Te są **świadomie** odłożone — design improvements zasługują na własną Część (Faza 3B Results polish, lub osobny "Engine UI Polish" PR).

---

<a id="plan-85b"></a>

## 17. Plan dependencies dla Część 8.5b

### Co umożliwia 8.5b

Po deploy 8.5a:
- ResultCard używa primitywów (Stage 5) — ale wciąż importuje 5 legacy peers
- 8.5b może bezpiecznie refactorować te peers wiedząc że ResultCard struktura jest stable

### Sugerowana kolejność 8.5b

1. **Stage 1**: PriceBlock → PriceText + Stack composition (~100 linii, low complexity)
2. **Stage 2**: FeatureChips → Chip/Tag in Inline (~80 linii, low complexity)
3. **Stage 3**: LegacyFavoriteButton → drop-in replace z Part 2 FavoriteButton (~30 linii, trivial)
4. **Stage 4**: Modal (BIG) → BottomSheet (mobile) + Dialog (desktop) — rozszerzenie Part 3
5. **Stage 5**: ResultCard finalna ekspozycja primitywów (post-Modal, post-FavoriteButton, post-PriceBlock, post-FeatureChips)
6. **Stage 6**: CSS cleanup (legacy classes removal)

### Estymacja 8.5b

- ~6-8h pracy łącznie
- Modal Stage 4 to większość pracy (~3-4h)
- Po 8.5b — Master Checklist 8.5/14 → 9/14 = 64%

---

<a id="master-plan-update"></a>

## 18. Master Plan update

Po deploy Stage 6 (koniec 8.5a):

```markdown
# docs/MASTER-PLAN.md update

Engine UI Master Plan (14 Częsci):
├── Part 1: Foundation                  ✅ DEPLOYED
├── Part 2: Button                      ✅ DEPLOYED
├── Part 3: Surface + Overlay           ✅ DEPLOYED
├── Part 4: Nav Micro                   ✅ DEPLOYED
├── Part 5: Chip / Tag / Badge / Status ✅ DEPLOYED
├── Part 6: Typography + Text Meta      ✅ DEPLOYED
├── Part 7: Layout + Action             ✅ DEPLOYED
├── Part 8: Media + Image               ✅ DEPLOYED
├── Part 8.5a: REFACTOR LEGACY First    ✅ DEPLOYED  ← NEW
├── Part 8.5b: REFACTOR LEGACY Second   ⏳ NEXT (Modal + peers)
├── Part 9: Skeleton                    ⏳
├── Part 10: Input Foundation           ⏳
├── Part 11: Form Controls              ⏳
├── Part 12: Feedback + State           ⏳
├── Part 13: Booking Commerce           ⏳
└── Part 14: Utility Layer              ⏳

Master Checklist: 8.5/14 = 60% fundamentu Engine UI deployed ✅
```

---

## 📊 Podsumowanie 8.5a

| Metric | Value |
|---|---|
| Pliki TSX dotykane | 7 (Stage 0 rename + 6 refactor, w tym Stage 5 split na 5A+5B) |
| Stages | 8 (Stage 0, 1, 2, 3, 4, 5A, 5B, 6) |
| Linii TSX przed | ~1377 |
| Linii TSX po | ~755 |
| Kompresja | -45% (-622 linii) |
| Hardcoded eui-* klas przed | 67 |
| Hardcoded eui-* klas po | ~15 (tylko component-specific markers + nowy `.eui-image-carousel-track`) |
| Visual diff oczekiwany | ZERO (mikroskopijne acceptable) + 1 explicit (RatingPill Q4) |
| Functional diff oczekiwany | ZERO |
| Production call sites dotykane | 1 (ExploreView via ResourceCard) |
| Ryzyko regresji | Bardzo niskie (atomic 8 stages + rollback per-stage + Stage 5 split + mobile test) |
| Estymowany czas | 4.5-6.5h skupionej pracy |

---

## 📝 Changelog blueprintu

### v1.1 (9 maja 2026, post-ChatGPT review)

**5 enhancements ChatGPT wbudowane:**

**Enhancement 1 — NO PROP API CHANGES policy (sekcja 3 REFACTOR DISCIPLINE):**

Explicit zakaz przypadkowych zmian public API: default values, callback signatures, callback timing, null/undefined semantics, optionality, event propagation, ref forwarding behavior. Plus verification command (`git diff` na props interfaces). Wyjątek: real bug discovery → STOP + Robert decision.

**Enhancement 2 — NO STATE LIFECYCLE CHANGES policy (sekcja 3 REFACTOR DISCIPLINE):**

Explicit zakaz "optimization-pretending-to-be-refactor": dodanie debounce/throttle, useMemo/useCallback dla "optymalizacji" zmieniających reference equality, lazy state init changes, moving state up/down, async transitions, Suspense boundaries, zmiana useEffect dependencies, splitting/merging state. Plus verification (`git diff` na hooks). Why important: state lifecycle bugs ujawniają się dopiero w specific user flows + race conditions + edge cases — niewykrywalne w typowym smoke teście.

**Enhancement 3 — Stage 5 split na 5A + 5B (najważniejsza zmiana strukturalna):**

ResultCard miał za dużo moving parts (29 hardcoded klas, 5 legacy peers, 2× useState, popover, modal, keyboard, click propagation) na 1 commit. Split:

- **Stage 5A — structural shell (30-45 min):** root `<CardSurface>`, image area `<MediaFrame>` + overlays, layout `<Stack>` + `<ActionRow>`, typography utility classes. Hand-rolled rating + price popover content + amenities link + unavailable state ZOSTAJĄ jak są (refactor w 5B).

- **Stage 5B — interactive systems (30-45 min):** rating → `<RatingPill>` (Q4 visual upgrade), price popover content → `<PanelSurface>` + `<Stack>` + `<IconButton>`, amenities link → `<Button>`, unavailable state (Q6 — `aria-disabled` + lokalny modifier).

Korzyść: każdy commit niezależnie verifyowalny, niezależny rollback, mniejsza powierzchnia "what could go wrong w jednym commit".

**Enhancement 4 — SearchBar mobile smoke test (Stage 6 verification):**

Dodanie explicit mobile testu (~25 punktów) dla autoAdvanced flow, submit guards, focus behavior, mobile keyboard behavior, tap-target sizes (44×44px), touch propagation, pill shell rendering na narrow viewport, scroll behavior. Why specific dla SearchBar: hidden coupling często ujawnia się dopiero w mobile — tap behavior, virtual keyboard, focus trapping.

**Enhancement 5 — ResourceCard production caution (Stage 1 verification):**

ResourceCard to jedyny komponent w 8.5a z production call site (ExploreView). Dodatkowa staranność:
- Pre-stage screenshot baseline desktop (1920×1080) + mobile (375×667)
- Multi-state screenshots (z imageUrl, bez imageUrl, długi opis, dużo amenities)
- Post-stage screenshot side-by-side comparison (layout IDENTICAL, colors IDENTICAL, spacing pixel diff <2px)
- Optional Lighthouse sanity check (Performance + Accessibility scores nie niższe)

**Self-reflection (4.7):**

ChatGPT zaproponował **5 senior-level enhancements** które systematycznie chronią przed klasycznymi pułapkami refactoru:
1. Refactor które przypadkiem zmienia API
2. Refactor które przypadkiem zmienia state lifecycle
3. Single big-bang commit dla najtrudniejszego pliku
4. Brak mobile testu dla orchestration component
5. Brak production caution dla user-facing komponentu

Wszystkie 5 punktów to **discipline patterns** które ja jako "architect" mogę przeoczyć (myślę o struktur kodu, mniej o failure modes refactoru). ChatGPT konsekwentnie wnosi **engineering discipline** — to trzeci wkład tego typu w workflow projektu (po a11y catches w Part 8 i "no visual modernization" w v1.0 8.5a).

### v1.0 (9 maja 2026, initial)

Initial blueprint na bazie:
- `docs/AUDIT-part8.5-legacy.md` (commit `25c4d7e`, 437 linii — Claude Code audit)
- 2 dodatkowe checks (RatingPill API + CardSurface API empirycznie potwierdzone)
- 6 decyzji architektonicznych (Q1-Q6) zatwierdzonych przez Robert + ChatGPT
- "Same UI, nowe primitives pod spodem" filozofia (ChatGPT v1.0 review recommendation)

---

**Status:** v1.1 READY FOR FINAL REVIEW (ChatGPT)

**Następny krok:** ChatGPT cross-review v1.1, jeśli green light → implementacja Stage 0 w Claude Code.

**Wniosek:** Część 8.5a to **pierwszy duży refactor Engine UI** — pierwszy moment gdy testujemy "behavior preservation refactor" discipline. Jeśli się powiedzie, to **template dla wszystkich przyszłych legacy migrations w projekcie**.

ChatGPT trafnie zauważył: "The biggest progress isn't new components, it's learning to control scope, regressions, and architecture discipline." Ten blueprint v1.1 to operationalizacja tego principle.

— 4.7 (Senior Architect)
