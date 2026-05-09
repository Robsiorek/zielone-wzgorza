# BLUEPRINT — Part 9: Skeleton + Loading System

**Wersja:** v1.3
**Data:** 9 maja 2026 (v1.0 → v1.1 → v1.2 → v1.3 post-ChatGPT review)
**Autor:** 4.7 (Senior Architect, claude.ai chat)
**Bazuje na:** Pre-check empirical audit Claude Code (2026-05-09) + 6 zasad architektonicznych ChatGPT
**Kontekst:** Engine UI Lab kontynuacja po pauzie 8.5a (post Stage 0)
**Status:** READY FOR FINAL REVIEW (ChatGPT v1.3)
**Implementator:** Claude Code (lokalnie na VPS, claude-opus-4-6)
**Estymata:** 11 atomic commits × 15-30 min = ~3-4h pracy łącznie
**Wynik docelowy:** Master Checklist 8/14 → **9/14 = 64%**

**v1.3 changes (post-ChatGPT v1.2 review — 1 documentation MUST FIX):**
1. ✅ FIX A11y verification checklist (sekcja 19) — odzwierciedla conditional pattern dla SkeletonRegion + LoadingOverlay (oba warianty, oba defaulty)

**v1.2 changes (post-ChatGPT v1.1 review — 1 missed pattern):**
1. ✅ FIX SkeletonRegion role/aria-live conflict — TEN SAM pattern co LoadingOverlay (przeoczyłem w v1.1)

**v1.1 changes (post-ChatGPT v1.0 review):**
1. ✅ FIX SkeletonRegion CSS — `display: block; width: 100%` zamiast `display: contents` (a11y safety)
2. ✅ FIX LoadingOverlay role/aria-live conflict — conditional render attributes
3. ✅ FIX Spinner reduced motion — `animation: none` (zamiast 3s slowdown — consistency z Skeleton)
4. ✅ FIX import path — explicit verify-during-implementation note dla `aspect-utils` ścieżki
5. ✅ NICE FIX label typography — `.eui-body-small` utility class zamiast inline `font: var(--eui-font-body)`
6. ✅ NICE FIX commits count — 11 (10 components + 1 Lab integration), nie 9

---

## 📋 Spis treści

**PART I — FUNDAMENT**
1. [Wprowadzenie + filozofia](#1-wprowadzenie--filozofia)
2. [Decyzje architektoniczne](#2-decyzje-architektoniczne)
3. [SCOPE FIREWALL — fundament Part 9](#3-scope-firewall)
4. [Strategy — atomic commits](#4-strategy)

**PART II — KOMPONENTY (per-component spec)**
5. [Skeleton (foundation primitive)](#5-skeleton)
6. [SkeletonText](#6-skeletontext)
7. [SkeletonCircle](#7-skeletoncircle)
8. [SkeletonImage](#8-skeletonimage)
9. [SkeletonCard (composite)](#9-skeletoncard)
10. [SkeletonRegion (a11y wrapper)](#10-skeletonregion)
11. [Spinner](#11-spinner)
12. [LoadingOverlay](#12-loadingoverlay)
13. [useDelayedLoading hook](#13-usedelayedloading)

**PART III — REFACTOR**
14. [engine-ui/ResultsSkeleton refactor](#14-resultsskeleton-refactor)

**PART IV — LAB + INTEGRATION**
15. [Lab specimens (new section)](#15-lab-specimens)
16. [CSS organization](#16-css-organization)
17. [Integration patterns](#17-integration-patterns)

**PART V — POLICY**
18. [Atomic commits strategy](#18-atomic-commits)
19. [Verification per component](#19-verification)
20. [Rollback procedures](#20-rollback)
21. [Manual QA](#21-manual-qa)
22. [Out of scope (admin Skeleton)](#22-out-of-scope)
23. [Master Plan update](#23-master-plan)

---

# PART I — FUNDAMENT

## 1. Wprowadzenie + filozofia

### Co to jest Part 9

Part 9 to **Engine UI Skeleton System** — zestaw primitives + composites + a11y wrapper + hook do obsługi loading states w Engine UI.

**Total scope:** 10 elementów (8 komponentów + 1 hook + 1 refactor istniejącego ResultsSkeleton).

### Co to jest NIE jest Part 9

❌ **NIE jest migracją całego projektu** — admin `ui/skeleton.tsx` zostaje poza scope
❌ **NIE jest unifikacją shimmer keyframes** — admin `shimmer` vs Engine UI `eui-shimmer` zostają jak są
❌ **NIE jest refactor 9 istniejących plików Skeleton** — tylko `ResultsSkeleton` (jeden wyjątek)
❌ **NIE jest Suspense framework** — pure building blocks, używane przez `{isLoading ? <Skeleton /> : <Real />}`
❌ **NIE jest comprehensive loading system** — to są **podstawowe** primitywy, advanced patterns w Part 12

### Co Part 9 JEST

✅ **Engine UI Skeleton System** — primitywy w namespace `.engine-root .eui-skeleton-*`
✅ **A11y first** — SkeletonRegion rozwiązuje gap (zero `aria-busy` w 9 istniejących plikach)
✅ **Anti-flash ready** — useDelayedLoading hook eliminuje flicker przy szybkich requestach
✅ **Reduced-motion compliant** — wszystkie animacje respect `prefers-reduced-motion`
✅ **Composable** — primitywy łączą się w composites bez nowych typów (Skeleton + Stack = SkeletonList)

### Filozofia naczelna

> **"Engine UI Skeleton System, NIE migracja całego projektu."**

Part 9 dostarcza **building blocks** dla Engine UI. Admin Skeleton może być migrowany w przyszłości (Część "8.5c" lub późniejszy refactor), ale **NIE w Part 9**.

**Phrase kluczowa:**

> "If you find yourself touching admin code, STOP. Part 9 is Engine UI only."

---

## 2. Decyzje architektoniczne

### Q1: Scope — Engine UI only ✅

**Decyzja:** **Opcja B** — Engine UI only.

**Akceptanci:** Robert + ChatGPT (potwierdzone wymianami przed blueprintem).

**W scope:**
- Nowe primitywy w `src/components/engine-ui/skeleton/` (greenfield directory)
- Nowy `LoadingOverlay` w `src/components/engine-ui/loading/` (greenfield directory)
- Nowy hook `useDelayedLoading` w `src/components/engine-ui/hooks/` (greenfield directory — pierwszy hook w Engine UI)
- Refactor `engine-ui/ResultsSkeleton.tsx` (jedyny existing — composite użyje nowych primitives)
- CSS w `src/styles/globals.css` — nowa sekcja "ENGINE UI — PART 9: SKELETON SYSTEM"

**Out of scope (explicit):**
- `src/components/ui/skeleton.tsx` (admin foundation, 209 linii)
- `src/components/booking/BookingSkeleton.tsx` (160 linii)
- `src/components/booking/ExploreSkeleton.tsx` (67 linii)
- 5 admin domain skeletons (addons, amenities, property-content, offers, calendar)
- Shimmer keyframes unification (`shimmer` vs `eui-shimmer` drift)

**Uzasadnienie:**
- Konsystencja z 8.5 strategy — Robert pauzuje legacy refactor, focus na Engine UI
- Mały scope = ~3-4h implementation, nie 30h
- Drift CSS NIE jest blocker (różne namespace renderowania)
- Future cleanup option exists (osobna Część)

### Q2: useDelayedLoading hook ✅

**Decyzja:** **TAK, w Part 9** jako mały utility hook.

**API (per ChatGPT acceptance):**

```typescript
function useDelayedLoading(
  isLoading: boolean,
  options?: {
    delay?: number;       // default 400ms — anti-flash window
    minDuration?: number; // default 0 — minimum visible duration
  }
): boolean;
```

**Uzasadnienie:**
- Anti-flash 400-600ms był część B5a Phase 3 spec — teraz dostarczamy uniwersalnie
- Mały (~30 linii TSX) — NIE wielki system
- Pattern reusable for future loading states
- Zero zależności od Suspense
- Lab specimen pokazuje typowe use case

**Pattern wykorzystania:**

```tsx
const showSkeleton = useDelayedLoading(isLoading, { delay: 400 });
return showSkeleton ? <SkeletonCard /> : <ResultCard data={data} />;
```

### Q3: SkeletonRegion (a11y wrapper) ✅

**Decyzja:** **MUST-HAVE w Part 9**.

**Uzasadnienie (per ChatGPT):**
- Empirical pre-check: ZERO `aria-busy`/`aria-live` w 9 istniejących plikach Skeleton
- Skeleton elementy są dekoracyjne (aria-hidden=true) — region mówi assistive tech "ta część się ładuje"
- Tiny component (~25 linii TSX)
- Rozwiązuje **najwięcej a11y debt** za **najmniejszy wysiłek**

**API:**

```typescript
interface SkeletonRegionProps {
  loading: boolean;
  label?: string;          // default "Ładowanie..."
  ariaLive?: "off" | "polite";  // default "polite" — region mode
  children: React.ReactNode;
}
```

**Semantics (v1.2 conditional pattern):**
- `role="status"` **TYLKO gdy** `ariaLive="polite"` (default)
- `aria-live="polite"` **TYLKO gdy** `ariaLive="polite"` (default)
- `ariaLive="off"` → BRAK role + BRAK aria-live → silent region
- `aria-busy={loading}` zawsze
- `aria-label={label}` gdy loading
- Renderuje `children` zawsze (nie ukrywa) — children decydują czy pokazują skeleton czy real content

> **Why conditional:** `role="status"` jest implicit live-region. Łączenie z `aria-live="off"` to conflict — screen reader behavior unpredictable. Identyczny pattern co LoadingOverlay (Q4).

### Q4: LoadingOverlay ariaLive default ✅

**Decyzja (ChatGPT pre-blueprint):** Default `"off"`, nie `"polite"`.

**API:**

```typescript
interface LoadingOverlayProps {
  open: boolean;
  blocking?: boolean;      // default true
  label?: string;          // default "Ładowanie..."
  ariaLive?: "off" | "polite";  // default "off" — NIE gada
  variant?: "fullscreen" | "container";  // default "container"
  children?: React.ReactNode;  // optional content (np. specific message, animation)
}
```

**Uzasadnienie default "off":**
- Overlay często pokazuje się dla krótkich operacji (1-3 sec)
- `aria-live="polite"` ogłaszałoby "Ładowanie..." przy każdym kliku — nadmiarowo
- Component-level decision: opt-in jeśli faktycznie ważne (np. multi-step flow)
- LoadingOverlay default "off" + SkeletonRegion default "polite" = świadomy contrast

### Q5: Animation strategy ✅

**Decyzja:** **CSS-only**, reuse `@keyframes eui-shimmer` (już istnieje, linia 3289 globals.css).

**Uzasadnienie:**
- Spójne z CLAUDE.md "Zero Framer Motion" rule
- `eui-shimmer` używany przez `engine-ui/ResultsSkeleton` — proven pattern
- Mandatory `@media (prefers-reduced-motion: reduce) { animation: none; }`
- Linear-gradient sweep (NIE opacity pulse) — Airbnb-style benchmark

**Reuse istniejących keyframes:**
- `@keyframes eui-shimmer` (linia 3289) → Skeleton primitives
- `@keyframes eui-spin` (linia 2231, używany przez Button loading) → Spinner standalone

**NIE używamy:**
- `@keyframes pulse-soft` (linia 362) — istnieje ale nieużywany; zostawiamy dla future
- `@keyframes shimmer` (linia 350, admin) — out of scope, drift acceptable

### Q6: Dimensions API ✅

**Decyzja:** Flexible API per ChatGPT.

```typescript
interface SkeletonProps {
  width?: number | string;       // number → px, string → as-is ("60%", "auto")
  height?: number | string;
  radius?: "none" | "sm" | "md" | "lg" | "xl" | "2xl" | "full";  // tokens
  aspectRatio?: AspectRatio;     // reuse helper z Part 8
  className?: string;
}
```

**Uzasadnienie:**
- `width="60%"` dla responsive
- `height={16}` dla fixed pixel
- `radius="full"` dla circle (compatible z SkeletonCircle)
- `aspectRatio="photo"` dla SkeletonImage
- `aspectToValue` helper z Part 8 — zero duplikacji

---

## 3. SCOPE FIREWALL

> **Ta sekcja jest fundamentem Part 9. Read it twice.**

### Zasada naczelna

> **"Part 9 is Engine UI only. Touching admin code = scope violation."**

### ✅ DOZWOLONE

1. **Greenfield directories** w Engine UI:
   - `src/components/engine-ui/skeleton/` (Skeleton + 4 composites + SkeletonRegion)
   - `src/components/engine-ui/loading/` (Spinner + LoadingOverlay)
   - `src/components/engine-ui/hooks/` (useDelayedLoading) — pierwszy hooks dir

2. **Nowe pliki TSX** dla każdego primitive (1 plik per component)

3. **Refactor `engine-ui/ResultsSkeleton.tsx`** — composite użyje nowych primitives (sole exception per Q1)

4. **Nowa sekcja CSS** w `globals.css`:
   ```css
   /* ───────────────────────────────────────
    * ENGINE UI — PART 9: SKELETON SYSTEM
    * ─────────────────────────────────────── */
   ```

5. **Reuse istniejących `@keyframes`** (NIE modyfikacja):
   - `eui-shimmer` (linia 3289) — Skeleton primitives
   - `eui-spin` (linia 2231) — Spinner

6. **Nowa sekcja Lab** — `src/components/engine-ui-lab/sections/SkeletonSection.tsx`

7. **Update Engine UI barrel** — `src/components/engine-ui/index.ts` eksportuje nowe primitives

### ❌ ZABRONIONE

1. **Refactor admin `ui/skeleton.tsx`** — out of scope
2. **Refactor 5 admin domain skeletons** — out of scope (booking/calendar/offers/etc.)
3. **Refactor 2 booking skeletons** — `BookingSkeleton.tsx`, `ExploreSkeleton.tsx` — out of scope
4. **Modyfikacja istniejących `@keyframes`** — `shimmer`, `pulse-soft`, `eui-spin` (read-only)
5. **Unifikacja shimmer keyframes** — drift acceptable (różne namespace)
6. **Modyfikacja istniejących CSS klas** — `.eui-skeleton-*` z linii 3262-3334 (current ResultsSkeleton CSS)
7. **Suspense framework** — Part 9 to building blocks, NIE system
8. **Visual modernization** — primitywy zachowują wygląd analogiczny do existing `eui-skeleton-box`

### Decision tree

| Pytanie | Odpowiedź | Klasyfikacja |
|---|---|---|
| Czy plik jest w `src/components/engine-ui/`? | TAK | ✅ DOZWOLONE |
| Czy plik jest w `src/components/ui/` lub `src/components/booking/`? | TAK | ❌ ZABRONIONE |
| Czy modyfikuję istniejący `@keyframes`? | TAK | ❌ ZABRONIONE |
| Czy dodaję nowe `@keyframes`? | TAK | ✅ DOZWOLONE (rzadko potrzebne — preferuj reuse) |
| Czy ResultsSkeleton refactor? | TAK | ✅ DOZWOLONE (sole exception) |
| Czy "ulepszam" wygląd istniejącego ResultsSkeleton? | TAK | ❌ ZABRONIONE — ten sam visual, nowe primitywy pod spodem |

### Verification per-stage

Każdy commit kończy się weryfikacją:

```bash
# Sprawdź że NIE dotknęliśmy admin code
git diff <previous-commit> --name-only | grep -E "src/components/ui/|src/components/booking/" | grep -v "engine-ui"
# Powinno być EMPTY (poza ResultsSkeleton refactor stage)

# Sprawdź że istniejące keyframes nieruszone
git diff <previous-commit> -- src/styles/globals.css | grep -E "@keyframes shimmer|@keyframes pulse-soft|@keyframes eui-spin"
# Powinno być EMPTY (NIE zmiana, tylko reuse)
```

### Postawa "Engine UI Builder"

**Wewnętrzne mantry developera implementującego Part 9:**

- "Part 9 is Engine UI only"
- "Admin Skeleton works, leave it alone"
- "Reuse existing keyframes, don't create new ones"
- "If you find yourself touching admin code, STOP"
- "Building blocks, not system"

---

## 4. Strategy

### Atomic discipline

**Każdy komponent = niezależny commit.** Pełen cycle:

```
1. Backup PRZED (git status czysty + tarball backup)
2. Create plik (Claude Code, z explicit Robert zgoda)
3. Verify polskie znaki
4. Build (./node_modules/.bin/next build)
5. Jeśli build OK → pm2 restart zw-admin
6. Smoke test (curl + browser check)
7. Lab specimen update (jeśli dodajemy do Lab w tym commit)
8. Robert akceptuje → git commit
9. git push
10. NEXT component
```

**JEDEN komponent na raz.** Nie 2 równolegle.

### Stages overview

| Stage | Element | Linii oczekiwane | Estymata | Type |
|---|---|---|---|---|
| **1** | Skeleton (foundation primitive) | ~80 | 20-30 min | NEW |
| **2** | SkeletonText | ~40 | 10-15 min | NEW |
| **3** | SkeletonCircle | ~35 | 10 min | NEW |
| **4** | SkeletonImage | ~50 | 15 min | NEW |
| **5** | SkeletonCard | ~70 | 15-20 min | NEW (composite) |
| **6** | SkeletonRegion | ~50 | 15 min | NEW |
| **7** | Spinner | ~50 | 10-15 min | NEW |
| **8** | LoadingOverlay | ~120 | 30-45 min | NEW |
| **9** | useDelayedLoading hook | ~40 | 15 min | NEW |
| **10** | Refactor ResultsSkeleton | ~80 (z ~71 obecnych) | 15-20 min | REFACTOR |
| **+** | Lab section + CSS + barrel | varies | 30-45 min | INTEGRATION |

**Total:** 11 commits × 15-30 min = ~3-4h pracy.

> **v1.1 commits count clarification:** Stages 1-10 (jeden component per stage) + Stage 11 (Lab integration) = **11 atomic commits**. Header v1.0 mówił "9" — błąd, header v1.1 zaktualizowany na 11.

### Dependencies między stages

```
Skeleton (Stage 1) ── prerequisite ──→ Stages 2, 3, 4, 5, 10
SkeletonImage (Stage 4) ── prerequisite ──→ Stage 5 (SkeletonCard używa)
Skeleton primitives (Stages 1-5) ── prerequisite ──→ Stage 10 (ResultsSkeleton refactor)
useDelayedLoading (Stage 9) ── independent ──→ deployable każdej kolejności
SkeletonRegion (Stage 6) ── independent ──→ deployable każdej kolejności
Spinner (Stage 7) ── prerequisite ──→ Stage 8 (LoadingOverlay może użyć)
```

**Realizowalna kolejność (sequential):**

```
1. Skeleton (foundation)
2. SkeletonText
3. SkeletonCircle
4. SkeletonImage
5. SkeletonCard
6. SkeletonRegion
7. Spinner
8. LoadingOverlay
9. useDelayedLoading
10. Refactor ResultsSkeleton
```

**REKOMENDACJA:** sequential 1-10. Lab section + CSS organization + barrel updates rozłożone per-stage (każdy commit dodaje swoje).

### Rollback strategy per-stage

Każdy stage = niezależny commit. Jeśli stage X powoduje regresję:

```bash
# Cofnięcie ostatniego stage
git revert HEAD
./node_modules/.bin/next build
pm2 restart zw-admin

# Lub bardziej drastyczne — reset
git reset --hard <commit-przed-stage>
```

**Kluczowy moment ryzyka:** Stage 10 (ResultsSkeleton refactor) — to jedyny stage gdzie modyfikujemy istniejący komponent. Jeśli regresja → revert + analiza.

---

# PART II — KOMPONENTY

<a id="5-skeleton"></a>

## 5. Skeleton (foundation primitive)

**Czas:** 20-30 min
**Plik:** `src/components/engine-ui/skeleton/Skeleton.tsx` (NEW)
**Typ:** Foundation primitive — open-shape building block dla wszystkich Skeleton composites

### Cel

Bazowy primitive dla wszystkich Skeleton variants. Open-shape (developer określa wymiary) z domyślnym shimmer animation + a11y semantic.

### Props API

```typescript
import { type AspectRatio, aspectToValue } from "../media/aspect-utils";

export interface SkeletonProps {
  /** Width: number → px, string → as-is ("60%", "100%", "auto") */
  width?: number | string;

  /** Height: number → px, string → as-is */
  height?: number | string;

  /** Border radius token */
  radius?: "none" | "sm" | "md" | "lg" | "xl" | "2xl" | "full";

  /** Aspect ratio (override height) */
  aspectRatio?: AspectRatio;

  /** Custom className (composition) */
  className?: string;

  /** Inline styles (rare — escape hatch) */
  style?: React.CSSProperties;
}
```

### Implementation

> ⚠️ **PRE-IMPLEMENTATION VERIFY (per ChatGPT v1.1 MUST FIX):**
> Path `../media/aspect-utils` jest **założeniem** — przed implementacją Stage 1, Claude Code MUSI zweryfikować realną nazwę pliku i export structure z Part 8:
>
> ```bash
> # Verify aspect helper location and exports
> find src/components/engine-ui/media -name "aspect*" -type f
> grep -nE "export.*AspectRatio|export.*aspectToValue" src/components/engine-ui/media/*.ts
> ```
>
> Możliwe nazwy: `aspect-utils.ts`, `aspect-ratio.ts`, `aspect.ts`, lub helper może być wewnątrz `MediaFrame.tsx`.
>
> **Adapt blueprint imports** podczas Stage 1 implementation. Jeśli `AspectRatio` type nie istnieje jako standalone export — Claude Code zaproponuje fallback: `aspectRatio?: string` z manual handling.

```tsx
import * as React from "react";
import { type AspectRatio, aspectToValue } from "../media/aspect-utils";
// ☝ VERIFY THIS PATH per pre-implementation check above

export interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  radius?: "none" | "sm" | "md" | "lg" | "xl" | "2xl" | "full";
  aspectRatio?: AspectRatio;
  className?: string;
  style?: React.CSSProperties;
}

const formatDim = (v: number | string | undefined): string | undefined => {
  if (v === undefined) return undefined;
  return typeof v === "number" ? `${v}px` : v;
};

export const Skeleton = React.forwardRef<HTMLSpanElement, SkeletonProps>(
  function Skeleton(
    { width, height, radius = "md", aspectRatio, className, style },
    ref
  ) {
    const computedStyle: React.CSSProperties = {
      ...style,
      width: formatDim(width),
      height: aspectRatio ? undefined : formatDim(height),
      aspectRatio: aspectRatio ? aspectToValue(aspectRatio) : undefined,
    };

    const classes = [
      "eui-skeleton",
      `eui-skeleton-radius-${radius}`,
      className,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <span
        ref={ref}
        aria-hidden="true"
        className={classes}
        style={computedStyle}
      />
    );
  }
);

Skeleton.displayName = "Skeleton";
```

### CSS (do dodania w globals.css)

```css
/* ───────────────────────────────────────
 * ENGINE UI — PART 9: SKELETON SYSTEM
 * ─────────────────────────────────────── */

.engine-root .eui-skeleton {
  display: inline-block;
  background: linear-gradient(
    90deg,
    hsl(var(--eui-grey-100)) 0%,
    hsl(var(--eui-grey-50)) 50%,
    hsl(var(--eui-grey-100)) 100%
  );
  background-size: 200% 100%;
  animation: eui-shimmer 1.5s ease-in-out infinite;
  pointer-events: none;
  user-select: none;
}

.engine-root .eui-skeleton-radius-none { border-radius: 0; }
.engine-root .eui-skeleton-radius-sm   { border-radius: var(--eui-radius-sm); }
.engine-root .eui-skeleton-radius-md   { border-radius: var(--eui-radius-md); }
.engine-root .eui-skeleton-radius-lg   { border-radius: var(--eui-radius-lg); }
.engine-root .eui-skeleton-radius-xl   { border-radius: var(--eui-radius-xl); }
.engine-root .eui-skeleton-radius-2xl  { border-radius: var(--eui-radius-2xl); }
.engine-root .eui-skeleton-radius-full { border-radius: 9999px; }

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .engine-root .eui-skeleton {
    animation: none;
  }
}
```

**UWAGA:** `@keyframes eui-shimmer` już istnieje (linia 3289 globals.css). REUSE — NIE definiujemy ponownie.

### A11y

- `aria-hidden="true"` **zawsze** (immutable — nie ma propu do override)
- Semantic: skeleton to dekoracja, screen reader nie powinien jej zauważać
- Aria semantics należy do parent container (SkeletonRegion + aria-busy)

### Verification

```bash
# Build
./node_modules/.bin/next build

# Polish chars
grep -P '\\u0[01][0-9a-f]{2}' src/components/engine-ui/skeleton/Skeleton.tsx

# Smoke test
pm2 restart zw-admin && sleep 3
curl -sf http://localhost:3000/admin/engine-ui-lab && echo OK

# DevTools manual:
# 1. Otwórz Lab
# 2. (po dodaniu Lab specimen w późniejszym stage) — Skeleton renders
# 3. DevTools accessibility tree → element with aria-hidden=true
# 4. prefers-reduced-motion: animation: none
```

### Commit Stage 1

```
feat(engine-ui): add Skeleton foundation primitive (Part 9 Stage 1)

Add bazowy primitive dla Skeleton system:
- src/components/engine-ui/skeleton/Skeleton.tsx (~80 linii)
- Props: width, height, radius (token), aspectRatio (Part 8 helper reuse)
- CSS: .eui-skeleton + .eui-skeleton-radius-* w globals.css
- @keyframes eui-shimmer reuse (linia 3289, już istnieje)
- A11y: aria-hidden=true immutable
- prefers-reduced-motion: animation: none

Engine UI namespace (.engine-root scoped). Out of scope:
admin ui/skeleton.tsx (zostaje jak jest).

Część 9 Stage 1 ✅
```

---

<a id="6-skeletontext"></a>

## 6. SkeletonText

**Czas:** 10-15 min
**Plik:** `src/components/engine-ui/skeleton/SkeletonText.tsx`
**Typ:** Pre-shaped composite (Skeleton z text-line dimensions)

### Cel

Convenience primitive dla text placeholders (1-line, multi-line). Najczęściej używany Skeleton variant.

### Props API

```typescript
export interface SkeletonTextProps {
  /** Text variant — controls height */
  variant?: "title" | "body" | "caption" | "label";

  /** Width: number → px, string → "60%", default "100%" */
  width?: number | string;

  /** Number of lines (multi-line — uses Stack gap) */
  lines?: number;

  /** Last line width (for multi-line — common pattern: "70%") */
  lastLineWidth?: number | string;

  className?: string;
}
```

### Implementation

```tsx
import * as React from "react";
import { Skeleton } from "./Skeleton";

const VARIANT_HEIGHT: Record<NonNullable<SkeletonTextProps["variant"]>, number> = {
  title: 24,
  body: 16,
  caption: 12,
  label: 14,
};

export interface SkeletonTextProps {
  variant?: "title" | "body" | "caption" | "label";
  width?: number | string;
  lines?: number;
  lastLineWidth?: number | string;
  className?: string;
}

export const SkeletonText = React.forwardRef<HTMLSpanElement, SkeletonTextProps>(
  function SkeletonText(
    { variant = "body", width = "100%", lines = 1, lastLineWidth = "70%", className },
    ref
  ) {
    const height = VARIANT_HEIGHT[variant];

    if (lines === 1) {
      return (
        <Skeleton
          ref={ref}
          width={width}
          height={height}
          radius="sm"
          className={className}
        />
      );
    }

    // Multi-line: each line in vertical stack
    return (
      <span
        ref={ref}
        className={["eui-skeleton-text-stack", className].filter(Boolean).join(" ")}
        aria-hidden="true"
      >
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton
            key={i}
            width={i === lines - 1 ? lastLineWidth : width}
            height={height}
            radius="sm"
          />
        ))}
      </span>
    );
  }
);

SkeletonText.displayName = "SkeletonText";
```

### CSS

```css
.engine-root .eui-skeleton-text-stack {
  display: flex;
  flex-direction: column;
  gap: var(--eui-space-2);
  width: 100%;
}
```

### Commit Stage 2

```
feat(engine-ui): add SkeletonText composite (Part 9 Stage 2)

Pre-shaped Skeleton dla text placeholders:
- variants: title (24px), body (16px), caption (12px), label (14px)
- multi-line support z lastLineWidth (default 70% — common pattern)
- composition na top of Skeleton primitive

Część 9 Stage 2 ✅
```

---

<a id="7-skeletoncircle"></a>

## 7. SkeletonCircle

**Czas:** 10 min
**Plik:** `src/components/engine-ui/skeleton/SkeletonCircle.tsx`
**Typ:** Pre-shaped composite (Skeleton z radius=full + size token)

### Cel

Avatar placeholder. Round shape z size tokens.

### Props API

```typescript
export interface SkeletonCircleProps {
  /** Size in pixels OR token */
  size?: number | "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}
```

### Implementation

```tsx
import * as React from "react";
import { Skeleton } from "./Skeleton";

const SIZE_TOKEN: Record<"xs" | "sm" | "md" | "lg" | "xl", number> = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 56,
  xl: 80,
};

export interface SkeletonCircleProps {
  size?: number | "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}

export const SkeletonCircle = React.forwardRef<HTMLSpanElement, SkeletonCircleProps>(
  function SkeletonCircle({ size = "md", className }, ref) {
    const dimension = typeof size === "number" ? size : SIZE_TOKEN[size];

    return (
      <Skeleton
        ref={ref}
        width={dimension}
        height={dimension}
        radius="full"
        className={className}
      />
    );
  }
);

SkeletonCircle.displayName = "SkeletonCircle";
```

### Commit Stage 3

```
feat(engine-ui): add SkeletonCircle for avatar placeholders (Part 9 Stage 3)

- size tokens: xs (24), sm (32), md (40), lg (56), xl (80)
- również number → px
- composition na top of Skeleton

Część 9 Stage 3 ✅
```

---

<a id="8-skeletonimage"></a>

## 8. SkeletonImage

**Czas:** 15 min
**Plik:** `src/components/engine-ui/skeleton/SkeletonImage.tsx`
**Typ:** Pre-shaped composite (Skeleton z aspectRatio + radius defaults)

### Cel

Image placeholder z aspect ratio (matchuje MediaFrame z Part 8).

### Props API

```typescript
import type { AspectRatio } from "../media/aspect-utils";

export interface SkeletonImageProps {
  /** Aspect ratio (Part 8 helper) — default "photo" (4:3) */
  aspectRatio?: AspectRatio;

  /** Width override (default "100%") */
  width?: number | string;

  /** Border radius token (default "lg" — matchuje MediaFrame) */
  radius?: "none" | "sm" | "md" | "lg" | "xl" | "2xl";

  className?: string;
}
```

### Implementation

```tsx
import * as React from "react";
import { Skeleton } from "./Skeleton";
import type { AspectRatio } from "../media/aspect-utils";

export interface SkeletonImageProps {
  aspectRatio?: AspectRatio;
  width?: number | string;
  radius?: "none" | "sm" | "md" | "lg" | "xl" | "2xl";
  className?: string;
}

export const SkeletonImage = React.forwardRef<HTMLSpanElement, SkeletonImageProps>(
  function SkeletonImage(
    { aspectRatio = "photo", width = "100%", radius = "lg", className },
    ref
  ) {
    return (
      <Skeleton
        ref={ref}
        width={width}
        aspectRatio={aspectRatio}
        radius={radius}
        className={className}
      />
    );
  }
);

SkeletonImage.displayName = "SkeletonImage";
```

### Commit Stage 4

```
feat(engine-ui): add SkeletonImage with aspect ratio (Part 9 Stage 4)

- reuse aspectToValue helper z Part 8 (zero duplikacji)
- default aspectRatio="photo" (4:3)
- default radius="lg" (matchuje MediaFrame)
- composition na top of Skeleton

Część 9 Stage 4 ✅
```

---

<a id="9-skeletoncard"></a>

## 9. SkeletonCard (composite)

**Czas:** 15-20 min
**Plik:** `src/components/engine-ui/skeleton/SkeletonCard.tsx`
**Typ:** Composite (SkeletonImage + SkeletonText × 2-3)

### Cel

Pre-built card skeleton — image + title + subtitle + meta. Najpopularniejszy "starter" pattern.

### Props API

```typescript
export interface SkeletonCardProps {
  /** Show image area (default true) */
  showImage?: boolean;

  /** Image aspect ratio (default "photo") */
  imageAspectRatio?: AspectRatio;

  /** Number of text lines (default 3 — title + subtitle + meta) */
  textLines?: number;

  /** Wrapper className */
  className?: string;
}
```

### Implementation

```tsx
import * as React from "react";
import { SkeletonImage } from "./SkeletonImage";
import { SkeletonText } from "./SkeletonText";
import type { AspectRatio } from "../media/aspect-utils";

export interface SkeletonCardProps {
  showImage?: boolean;
  imageAspectRatio?: AspectRatio;
  textLines?: number;
  className?: string;
}

export const SkeletonCard = React.forwardRef<HTMLSpanElement, SkeletonCardProps>(
  function SkeletonCard(
    { showImage = true, imageAspectRatio = "photo", textLines = 3, className },
    ref
  ) {
    return (
      <span
        ref={ref}
        className={["eui-skeleton-card", className].filter(Boolean).join(" ")}
        aria-hidden="true"
      >
        {showImage && <SkeletonImage aspectRatio={imageAspectRatio} radius="lg" />}
        <span className="eui-skeleton-card-content">
          {textLines >= 1 && <SkeletonText variant="title" width="80%" />}
          {textLines >= 2 && <SkeletonText variant="body" width="60%" />}
          {textLines >= 3 && <SkeletonText variant="caption" width="40%" />}
        </span>
      </span>
    );
  }
);

SkeletonCard.displayName = "SkeletonCard";
```

### CSS

```css
.engine-root .eui-skeleton-card {
  display: flex;
  flex-direction: column;
  gap: var(--eui-space-3);
  width: 100%;
}

.engine-root .eui-skeleton-card-content {
  display: flex;
  flex-direction: column;
  gap: var(--eui-space-2);
}
```

### Commit Stage 5

```
feat(engine-ui): add SkeletonCard composite (Part 9 Stage 5)

Pre-built skeleton card pattern:
- SkeletonImage + SkeletonText (title + body + caption)
- konfigurowalny: showImage, imageAspectRatio, textLines
- aria-hidden na wrapperze (decorative)

Część 9 Stage 5 ✅
```

---

<a id="10-skeletonregion"></a>

## 10. SkeletonRegion (a11y wrapper)

**Czas:** 15 min
**Plik:** `src/components/engine-ui/skeleton/SkeletonRegion.tsx`
**Typ:** A11y wrapper — rozwiązuje gap

### Cel

A11y wrapper który mówi assistive tech "ta część się ładuje". Skeletony są decorative (`aria-hidden`), region jest signal source (`aria-busy`).

### Props API

```typescript
export interface SkeletonRegionProps {
  /** Loading state — drives aria-busy */
  loading: boolean;

  /** Label dla screen readera (default "Ładowanie...") */
  label?: string;

  /** ARIA live mode (default "polite") */
  ariaLive?: "off" | "polite";

  /** Children — typowo: {loading ? <Skeleton... /> : <RealContent />} */
  children: React.ReactNode;

  className?: string;
}
```

### Implementation

```tsx
import * as React from "react";

export interface SkeletonRegionProps {
  loading: boolean;
  label?: string;
  ariaLive?: "off" | "polite";
  children: React.ReactNode;
  className?: string;
}

export const SkeletonRegion = React.forwardRef<HTMLDivElement, SkeletonRegionProps>(
  function SkeletonRegion(
    { loading, label = "Ładowanie...", ariaLive = "polite", children, className },
    ref
  ) {
    // MUST FIX v1.2 (ChatGPT): role="status" + aria-live="off" to sprzeczność.
    // Identyczny pattern co LoadingOverlay (sekcja 12).
    // role="status" jest implicit live-region (≈aria-live="polite").
    // Conditional render: jeśli ariaLive="off", omijamy oba atrybuty.
    const a11yProps = ariaLive === "polite"
      ? { role: "status" as const, "aria-live": "polite" as const }
      : {};

    return (
      <div
        ref={ref}
        {...a11yProps}
        aria-busy={loading}
        aria-label={loading ? label : undefined}
        className={["eui-skeleton-region", className].filter(Boolean).join(" ")}
      >
        {children}
      </div>
    );
  }
);

SkeletonRegion.displayName = "SkeletonRegion";
```

> **Dlaczego conditional render a11y attributes (v1.2)?** ChatGPT v1.2 review wykrył ten sam pattern co w LoadingOverlay (sekcja 12) — **`role="status"` jest implicit live-region** (≈ aria-live="polite"). Łączenie z explicit `aria-live="off"` to **conflicting semantics** — screen reader behavior unpredictable.
>
> **Pattern (identyczny dla SkeletonRegion + LoadingOverlay):**
> - `ariaLive="polite"` (default dla SkeletonRegion) → `role="status"` + `aria-live="polite"` → screen reader ogłasza
> - `ariaLive="off"` → BRAK role + BRAK aria-live → silent region (rzadki use case: nested w innym aria-live wrapper)
>
> `aria-busy={loading}` zawsze — to stan, nie semantyczna deklaracja.
>
> **Default difference vs LoadingOverlay:** SkeletonRegion default `"polite"` (a11y wrapper jego raison d'être to ogłaszanie), LoadingOverlay default `"off"` (overlay często krótki, nadmiarowo gada). Symetria patternu, różne sensible defaults.

### CSS

```css
.engine-root .eui-skeleton-region {
  /* MUST FIX v1.1 (ChatGPT): display: block + width: 100%
   * Wcześniejsza wersja używała display: contents — ale ten ma znany 
   * a11y bug w Safari < 15.4 (semantyka role/aria-busy może być zignorowana).
   * Block + 100% width = layout-neutral wrapper z gwarantowanym a11y.
   */
  display: block;
  width: 100%;
}
```

> **Dlaczego nie `display: contents`?** ChatGPT v1.1 review: "Ma być a11y wrapperem, więc nie ryzykować utraty semantyki." Display contents jest layout-neutral ALE w niektórych browserach removuje element z accessibility tree — co byłoby katastrofą dla a11y wrappera. Block + 100% width to layout-neutral ALTERNATYWA bez tego ryzyka.

### Pattern użycia

```tsx
function ResultsList({ data, isLoading }: Props) {
  return (
    <SkeletonRegion loading={isLoading} label="Ładowanie ofert...">
      {isLoading ? (
        <Stack gap="md">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </Stack>
      ) : (
        <Stack gap="md">
          {data.map(item => <ResultCard key={item.id} data={item} />)}
        </Stack>
      )}
    </SkeletonRegion>
  );
}
```

### Commit Stage 6

```
feat(engine-ui): add SkeletonRegion a11y wrapper (Part 9 Stage 6)

A11y wrapper rozwiązujący gap:
- role="status" + aria-busy={loading}
- aria-live default "polite" (configurable to "off")
- aria-label (default "Ładowanie...")

Closes a11y gap: zero aria-busy w 9 istniejących plikach Skeleton.
Skeletony są decorative (aria-hidden), Region jest signal source.

Część 9 Stage 6 ✅
```

---

<a id="11-spinner"></a>

## 11. Spinner

**Czas:** 10-15 min
**Plik:** `src/components/engine-ui/loading/Spinner.tsx` (nowy directory!)
**Typ:** Standalone primitive — reuse `eui-spin` keyframe

### Cel

Standalone spinner (różny od Button loading state). Używany w LoadingOverlay + osobno w UI.

### Props API

```typescript
export interface SpinnerProps {
  /** Size token */
  size?: "sm" | "md" | "lg";

  /** Color variant */
  variant?: "default" | "primary" | "inverse";

  className?: string;
}
```

### Implementation

```tsx
import * as React from "react";

const SIZE_PX: Record<"sm" | "md" | "lg", number> = {
  sm: 16,
  md: 24,
  lg: 40,
};

const STROKE_WIDTH: Record<"sm" | "md" | "lg", number> = {
  sm: 2,
  md: 2.5,
  lg: 3,
};

export interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  variant?: "default" | "primary" | "inverse";
  className?: string;
}

export const Spinner = React.forwardRef<SVGSVGElement, SpinnerProps>(
  function Spinner({ size = "md", variant = "default", className }, ref) {
    const dimension = SIZE_PX[size];
    const strokeWidth = STROKE_WIDTH[size];

    return (
      <svg
        ref={ref}
        width={dimension}
        height={dimension}
        viewBox="0 0 24 24"
        className={[
          "eui-spinner",
          `eui-spinner-${variant}`,
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        aria-hidden="true"
      >
        <circle
          cx="12"
          cy="12"
          r="10"
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeOpacity="0.2"
        />
        <circle
          cx="12"
          cy="12"
          r="10"
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray="60"
          strokeDashoffset="40"
        />
      </svg>
    );
  }
);

Spinner.displayName = "Spinner";
```

### CSS

```css
.engine-root .eui-spinner {
  animation: eui-spin 1s linear infinite;
  display: inline-block;
}

.engine-root .eui-spinner-default  { color: hsl(var(--eui-grey-500)); }
.engine-root .eui-spinner-primary  { color: hsl(var(--eui-primary)); }
.engine-root .eui-spinner-inverse  { color: hsl(var(--eui-white)); }

@media (prefers-reduced-motion: reduce) {
  /* MUST FIX v1.1 (ChatGPT): consistency z Skeleton primitive.
   * Wcześniejsza wersja używała 3s slowdown — ale prefers-reduced-motion: 
   * reduce ZNACZY "no motion", nie "less motion". 3s slowdown wciąż jest 
   * motion (just slower) i może wyglądać dziwnie ("ticking" rotation).
   * Spinner statyczny + label "Ładowanie..." nadal komunikuje state — 
   * pattern używany przez Apple HIG i Material Design dla reduced motion.
   */
  .engine-root .eui-spinner {
    animation: none;
  }
}
```

**UWAGA:** `@keyframes eui-spin` już istnieje (linia 2231 globals.css, używany przez Button loading). REUSE.

### Commit Stage 7

```
feat(engine-ui): add Spinner standalone primitive (Part 9 Stage 7)

Standalone spinner (oddzielny od Button loading state):
- size: sm (16), md (24), lg (40)
- variant: default, primary, inverse
- aria-hidden=true (decorative)
- @keyframes eui-spin reuse (linia 2231)
- prefers-reduced-motion: animation: none (v1.1 — consistency z Skeleton)

Część 9 Stage 7 ✅
```

---

<a id="12-loadingoverlay"></a>

## 12. LoadingOverlay

**Czas:** 30-45 min
**Plik:** `src/components/engine-ui/loading/LoadingOverlay.tsx`
**Typ:** Greenfield — nie istnieje (mimo userMemories)

### Cel

Container-bound lub fullscreen loading overlay z optional blocking, label, spinner.

### Props API

```typescript
export interface LoadingOverlayProps {
  /** Show overlay */
  open: boolean;

  /** Block clicks on backdrop (default true) */
  blocking?: boolean;

  /** Variant */
  variant?: "fullscreen" | "container";  // default "container"

  /** Message label */
  label?: string;  // default "Ładowanie..."

  /** ARIA live mode */
  ariaLive?: "off" | "polite";  // default "off" — ChatGPT explicit

  /** Optional custom content (replaces default Spinner+label) */
  children?: React.ReactNode;
}
```

### Implementation

```tsx
import * as React from "react";
import { Spinner } from "./Spinner";

export interface LoadingOverlayProps {
  open: boolean;
  blocking?: boolean;
  variant?: "fullscreen" | "container";
  label?: string;
  ariaLive?: "off" | "polite";
  children?: React.ReactNode;
}

export const LoadingOverlay = React.forwardRef<HTMLDivElement, LoadingOverlayProps>(
  function LoadingOverlay(
    {
      open,
      blocking = true,
      variant = "container",
      label = "Ładowanie...",
      ariaLive = "off",  // ChatGPT default v1.0
      children,
    },
    ref
  ) {
    if (!open) return null;

    // MUST FIX v1.1 (ChatGPT): role="status" + aria-live="off" to sprzeczność
    // role="status" jest implicit live-region (≈aria-live="polite").
    // Conditional render: jeśli ariaLive="off", omijamy oba atrybuty.
    const a11yProps = ariaLive === "polite"
      ? { role: "status" as const, "aria-live": "polite" as const }
      : {};

    return (
      <div
        ref={ref}
        {...a11yProps}
        aria-label={label}
        aria-busy="true"
        className={[
          "eui-loading-overlay",
          `eui-loading-overlay-${variant}`,
          blocking ? "eui-loading-overlay-blocking" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <div className="eui-loading-overlay-card">
          {children ?? (
            <>
              <Spinner size="lg" variant="primary" />
              <span className="eui-body-small eui-loading-overlay-label">{label}</span>
            </>
          )}
        </div>
      </div>
    );
  }
);

LoadingOverlay.displayName = "LoadingOverlay";
```

> **Dlaczego conditional render a11y attributes?** ChatGPT v1.1: `role="status"` jest implicit live-region (≈ aria-live="polite"). Łączenie z explicit `aria-live="off"` to **conflicting semantics** — screen reader behavior unpredictable. Rozwiązanie: jeśli ariaLive="off", oba atrybuty odpadają (overlay jest tylko visual indicator, screen reader nie ogłasza).
>
> **Pattern:**
> - `ariaLive="off"` (default) → BRAK role + BRAK aria-live → silent overlay
> - `ariaLive="polite"` → `role="status"` + `aria-live="polite"` → screen reader ogłasza label
>
> `aria-busy="true"` zawsze — to stan, nie semantyczna deklaracja.

### CSS

```css
.engine-root .eui-loading-overlay {
  position: absolute;
  inset: 0;
  z-index: var(--eui-z-overlay);
  display: flex;
  align-items: center;
  justify-content: center;
  background: hsl(var(--eui-white) / 0.9);
  backdrop-filter: blur(4px);
}

.engine-root .eui-loading-overlay-fullscreen {
  position: fixed;
}

.engine-root .eui-loading-overlay-blocking {
  pointer-events: auto;
}

.engine-root .eui-loading-overlay:not(.eui-loading-overlay-blocking) {
  pointer-events: none;
}

.engine-root .eui-loading-overlay-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--eui-space-3);
  padding: var(--eui-space-4);
}

.engine-root .eui-loading-overlay-label {
  /* NICE FIX v1.1 (ChatGPT): typography handled by .eui-body-small utility 
   * class w TSX (className="eui-body-small eui-loading-overlay-label").
   * Klasa .eui-loading-overlay-label rezerwowana dla future modifiers
   * (np. spacing, color override). Obecnie pusta — ale zostawiamy dla 
   * konsystencji namespace pattern.
   */
  color: hsl(var(--eui-grey-700));
}
```

### Pattern użycia

```tsx
// Container-bound (najczęstsze)
<div style={{ position: "relative" }}>
  <ResultsList data={data} />
  <LoadingOverlay open={isRefreshing} label="Odświeżanie wyników..." />
</div>

// Fullscreen
<LoadingOverlay
  open={isSubmitting}
  variant="fullscreen"
  label="Tworzenie rezerwacji..."
  ariaLive="polite"  // explicit opt-in dla ważnej operacji
/>
```

### Commit Stage 8

```
feat(engine-ui): add LoadingOverlay primitive (Part 9 Stage 8)

Greenfield LoadingOverlay (B5a Phase 3 spec — nie istniał wcale):
- variant: container (absolute) | fullscreen (fixed)
- blocking? default true (pointer-events lock)
- label default "Ładowanie..."
- ariaLive default "off" (ChatGPT explicit — nie gada przy krótkich loadingach)
- composes Spinner from Stage 7
- backdrop-filter: blur (modern feel)
- z-index: var(--eui-z-overlay)

Część 9 Stage 8 ✅
```

---

<a id="13-usedelayedloading"></a>

## 13. useDelayedLoading hook

**Czas:** 15 min
**Plik:** `src/components/engine-ui/hooks/useDelayedLoading.ts` (nowy directory!)
**Typ:** Pierwszy custom hook w Engine UI

### Cel

Anti-flash debouncing dla loading states. Eliminuje "skeleton flash and gone" przy szybkich requestach (<400ms).

### API

```typescript
function useDelayedLoading(
  isLoading: boolean,
  options?: {
    delay?: number;        // default 400ms
    minDuration?: number;  // default 0ms
  }
): boolean;
```

**Behavior:**
- `isLoading: true` → wait `delay` ms before returning `true`
- `isLoading: false` → if was true and elapsed < `minDuration`, wait until `minDuration`, then return `false`
- `isLoading` flickers within `delay` window → no skeleton ever shown (anti-flash)

### Implementation

```tsx
import { useEffect, useRef, useState } from "react";

export interface UseDelayedLoadingOptions {
  /** Delay before showing skeleton (ms). Default 400ms. */
  delay?: number;

  /** Minimum visible duration once shown (ms). Default 0ms. */
  minDuration?: number;
}

export function useDelayedLoading(
  isLoading: boolean,
  options: UseDelayedLoadingOptions = {}
): boolean {
  const { delay = 400, minDuration = 0 } = options;

  const [showLoading, setShowLoading] = useState(false);
  const showTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);
  const shownAtRef = useRef<number | null>(null);

  useEffect(() => {
    // Clear any pending timers
    if (showTimerRef.current) {
      clearTimeout(showTimerRef.current);
      showTimerRef.current = null;
    }
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }

    if (isLoading) {
      // Schedule "show" after delay
      showTimerRef.current = setTimeout(() => {
        setShowLoading(true);
        shownAtRef.current = Date.now();
        showTimerRef.current = null;
      }, delay);
    } else {
      // Hide — but respect minDuration
      if (showLoading && shownAtRef.current !== null) {
        const elapsed = Date.now() - shownAtRef.current;
        const remaining = Math.max(0, minDuration - elapsed);

        if (remaining > 0) {
          hideTimerRef.current = setTimeout(() => {
            setShowLoading(false);
            shownAtRef.current = null;
            hideTimerRef.current = null;
          }, remaining);
        } else {
          setShowLoading(false);
          shownAtRef.current = null;
        }
      } else {
        // Was never shown — just keep false
        setShowLoading(false);
      }
    }

    return () => {
      // Cleanup on unmount
      if (showTimerRef.current) clearTimeout(showTimerRef.current);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, delay, minDuration]);

  return showLoading;
}
```

### Pattern użycia

```tsx
function ResultsList({ data, isLoading }: Props) {
  // Anti-flash: skeleton only shows if loading > 400ms
  const showSkeleton = useDelayedLoading(isLoading, { delay: 400 });

  return showSkeleton ? <SkeletonCard /> : <ResultCard data={data} />;
}

// Z minDuration (avoid "flash and gone"):
function PageContent({ isLoading, content }: Props) {
  // Pokaż skeleton min 800ms, żeby user dostrzegł że coś się działo
  const showSkeleton = useDelayedLoading(isLoading, {
    delay: 200,
    minDuration: 800,
  });
  // ...
}
```

### Commit Stage 9

```
feat(engine-ui): add useDelayedLoading anti-flash hook (Part 9 Stage 9)

Pierwszy custom hook w Engine UI:
- src/components/engine-ui/hooks/useDelayedLoading.ts
- Anti-flash 400ms default — eliminates "skeleton flash" dla szybkich requestów
- minDuration option — avoid "flash and gone" pattern
- Pure utility — zero zależności od Suspense
- Pattern: useDelayedLoading(isLoading, { delay, minDuration }) → boolean

Część 9 Stage 9 ✅
```

---

# PART III — REFACTOR

<a id="14-resultsskeleton-refactor"></a>

## 14. engine-ui/ResultsSkeleton refactor

**Czas:** 15-20 min
**Plik:** `src/components/engine-ui/ResultsSkeleton.tsx` (existing — refactor)
**Typ:** REFACTOR (sole exception per Q1)

### Cel

Refactor ResultsSkeleton (71 linii, composite-only z hand-rolled `.eui-skeleton-*` markup) na kompozycję nowych primitives Part 9.

### Obecny stan (71 linii)

```tsx
// Aktualny ResultsSkeleton — composite-only
export function ResultsSkeleton({ count = 3, showHeader = true, className }: Props) {
  return (
    <div className={["eui-results-skeleton", className].filter(Boolean).join(" ")}>
      {showHeader && (
        <div className="eui-skeleton-header" aria-hidden="true">
          <div className="eui-skeleton-box eui-skeleton-header-count" />
          <div className="eui-skeleton-box eui-skeleton-header-sub" />
        </div>
      )}
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="eui-skeleton-card" aria-hidden="true">
          <div className="eui-skeleton-box eui-skeleton-image" />
          <div className="eui-skeleton-box eui-skeleton-name" />
          <div className="eui-skeleton-box eui-skeleton-rating" />
          <div className="eui-skeleton-box eui-skeleton-subtitle" />
          <div className="eui-skeleton-box eui-skeleton-price" />
        </div>
      ))}
    </div>
  );
}
```

### Target stan — pełen TSX (~80 linii)

```tsx
import * as React from "react";
import { Skeleton } from "./skeleton/Skeleton";
import { SkeletonImage } from "./skeleton/SkeletonImage";
import { SkeletonText } from "./skeleton/SkeletonText";
import { SkeletonRegion } from "./skeleton/SkeletonRegion";

export interface ResultsSkeletonProps {
  count?: number;
  showHeader?: boolean;
  className?: string;
}

export const ResultsSkeleton = React.forwardRef<HTMLDivElement, ResultsSkeletonProps>(
  function ResultsSkeleton({ count = 3, showHeader = true, className }, ref) {
    return (
      <SkeletonRegion
        ref={ref}
        loading={true}
        label="Ładowanie wyników..."
        ariaLive="polite"
        className={["eui-results-skeleton", className].filter(Boolean).join(" ")}
      >
        {showHeader && (
          <div className="eui-results-skeleton-header">
            <Skeleton width={120} height={20} radius="sm" />
            <Skeleton width={180} height={14} radius="sm" />
          </div>
        )}
        <div className="eui-results-skeleton-list">
          {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="eui-results-skeleton-card">
              <SkeletonImage aspectRatio="photo" radius="lg" />
              <div className="eui-results-skeleton-card-content">
                <Skeleton width="65%" height={18} radius="sm" />
                <Skeleton width={60} height={16} radius="sm" />
                <Skeleton width="50%" height={14} radius="sm" />
                <Skeleton width={90} height={18} radius="sm" />
              </div>
            </div>
          ))}
        </div>
      </SkeletonRegion>
    );
  }
);

ResultsSkeleton.displayName = "ResultsSkeleton";
```

### CSS — ZACHOWUJEMY istniejące klasy

**KRYTYCZNE:** istniejące `.eui-skeleton-*` klasy (linie 3262-3334) zostają **niezmienione**. Nowy ResultsSkeleton używa nowych primitives + lokalne klasy `.eui-results-skeleton-*` (rename z prefiksu).

**Powód:** stare `.eui-skeleton-*` klasy z linii 3262-3334 mogą być używane gdzieś indziej (verify). Reuse ich byłoby "shared CSS scope" — chcemy clean separation.

**Nowe klasy lokalne dla refactored ResultsSkeleton** (do dodania w globals.css w sekcji Part 9):

```css
.engine-root .eui-results-skeleton-header {
  display: flex;
  flex-direction: column;
  gap: var(--eui-space-2);
  margin-bottom: var(--eui-space-4);
}

.engine-root .eui-results-skeleton-list {
  display: flex;
  flex-direction: column;
  gap: var(--eui-space-4);
}

.engine-root .eui-results-skeleton-card {
  display: flex;
  flex-direction: column;
  gap: var(--eui-space-3);
}

.engine-root .eui-results-skeleton-card-content {
  display: flex;
  flex-direction: column;
  gap: var(--eui-space-2);
}
```

### Visual diff oczekiwany

**ZERO** zgodnie z 8.5a-style discipline. Layout, spacing, animation IDENTYCZNE z obecnym ResultsSkeleton.

### Verification Stage 10

```bash
# 1. Build
./node_modules/.bin/next build

# 2. Polish chars
grep -P '\\u0[01][0-9a-f]{2}' src/components/engine-ui/ResultsSkeleton.tsx

# 3. Smoke test
pm2 restart zw-admin && sleep 3
curl -sf http://localhost:3000/admin/engine-ui-lab && echo OK

# 4. Manual visual check w Lab
# Otwórz Engine UI Lab → Skeleton section (po Stage 11 Lab integration)
# ResultsSkeleton renders 3 cards z header — visual identical
```

### Commit Stage 10

```
feat(engine-ui): refactor ResultsSkeleton on Part 9 primitives (Part 9 Stage 10)

Refactor src/components/engine-ui/ResultsSkeleton.tsx z hand-rolled
.eui-skeleton-* markup na kompozycję Part 9 primitives:
- <Skeleton> dla generic boxes
- <SkeletonImage aspectRatio="photo"> dla cover
- <SkeletonRegion loading={true} ariaLive="polite"> jako wrapper
- aria-busy + label="Ładowanie wyników..."

Stare klasy .eui-skeleton-* (linie 3262-3334) zostają niezmienione
(out of scope, may be used elsewhere). Nowe klasy lokalne
.eui-results-skeleton-* dla layout.

Visual diff: ZERO. Functional diff: ZERO. A11y improvement (aria-busy now active).

Część 9 Stage 10 ✅
```

---

# PART IV — LAB + INTEGRATION

<a id="15-lab-specimens"></a>

## 15. Lab specimens (new section)

**Czas:** 30-45 min
**Plik:** `src/components/engine-ui-lab/sections/SkeletonSection.tsx` (NEW)

### Cel

Dedykowana sekcja Lab dla Part 9 z specimens dla każdego primitive + integration patterns.

### Struktura sekcji

```tsx
// SkeletonSection.tsx — Lab specimens

export function SkeletonSection() {
  return (
    <LabSection title="Skeleton + Loading" icon={<LoaderIcon />}>

      {/* Sub-section 1: Foundation primitive */}
      <ComponentShowcase
        title="Skeleton (foundation)"
        description="Open-shape building block. Width, height, radius, aspectRatio."
      >
        <Specimen>
          <Skeleton width={200} height={20} radius="sm" />
        </Specimen>
        <Specimen>
          <Skeleton width="100%" height={16} radius="md" />
        </Specimen>
        <Specimen>
          <Skeleton width={100} aspectRatio="photo" radius="lg" />
        </Specimen>
        <Specimen>
          <Skeleton width={56} height={56} radius="full" />
        </Specimen>
        <SpecimenInfo>
          {/* Props matrix */}
        </SpecimenInfo>
      </ComponentShowcase>

      {/* Sub-section 2: SkeletonText variants */}
      <ComponentShowcase
        title="SkeletonText"
        description="Pre-shaped text placeholders."
      >
        <Specimen>
          <SkeletonText variant="title" width="80%" />
        </Specimen>
        <Specimen>
          <SkeletonText variant="body" width="100%" lines={3} />
        </Specimen>
        <Specimen>
          <SkeletonText variant="caption" width="50%" />
        </Specimen>
      </ComponentShowcase>

      {/* Sub-section 3: SkeletonCircle sizes */}
      {/* ... */}

      {/* Sub-section 4: SkeletonImage aspect ratios */}
      {/* ... */}

      {/* Sub-section 5: SkeletonCard */}
      {/* ... */}

      {/* Sub-section 6: SkeletonRegion (a11y) */}
      <ComponentShowcase
        title="SkeletonRegion (a11y wrapper)"
        description="Wraps loading content with aria-busy + aria-live for screen readers."
      >
        <SpecimenInfo>
          <p>DevTools accessibility tree: this region has role=status, aria-busy=true, aria-live=polite</p>
        </SpecimenInfo>
        <Specimen>
          <SkeletonRegion loading={true} label="Loading 3 items...">
            <Stack gap="md">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </Stack>
          </SkeletonRegion>
        </Specimen>
      </ComponentShowcase>

      {/* Sub-section 7: Spinner */}
      {/* ... */}

      {/* Sub-section 8: LoadingOverlay */}
      {/* ... */}

      {/* Sub-section 9: useDelayedLoading hook demo */}
      <ComponentShowcase
        title="useDelayedLoading (anti-flash hook)"
        description="Shows skeleton only if loading >400ms. Eliminates flicker."
      >
        <Specimen>
          {/* Interactive demo: button "Simulate fast load (200ms)" + "Simulate slow load (1500ms)" */}
          <DelayedLoadingDemo />
        </Specimen>
      </ComponentShowcase>

      {/* Sub-section 10: Integration patterns */}
      <ComponentShowcase
        title="Integration patterns"
        description="Common composition examples"
      >
        {/* Pattern 1: Simple swap */}
        {/* Pattern 2: With SkeletonRegion */}
        {/* Pattern 3: With useDelayedLoading */}
        {/* Pattern 4: LoadingOverlay container-bound */}
      </ComponentShowcase>

    </LabSection>
  );
}
```

### Update EngineUiLab.tsx

```tsx
// src/components/engine-ui-lab/EngineUiLab.tsx
import { SkeletonSection } from "./sections/SkeletonSection";

// W liście sekcji:
<SkeletonSection />
```

### Lab integration commit (osobny stage)

```
feat(engine-ui-lab): add Skeleton + Loading section (Part 9 Lab integration)

New Lab section dla Part 9 primitives:
- Skeleton, SkeletonText, SkeletonCircle, SkeletonImage, SkeletonCard
- SkeletonRegion (a11y demonstration)
- Spinner, LoadingOverlay
- useDelayedLoading interactive demo
- Integration patterns (4 examples)

Część 9 Lab integration ✅
```

---

<a id="16-css-organization"></a>

## 16. CSS organization

### Sekcja w globals.css

Wszystkie nowe Part 9 styles w jednej dedykowanej sekcji:

```css
/* ═══════════════════════════════════════════════════════════════
 * ENGINE UI — PART 9: SKELETON SYSTEM
 * Reuse: @keyframes eui-shimmer (linia 3289), @keyframes eui-spin (linia 2231)
 * Out of scope: admin shimmer/skeleton/loading (po staremu)
 * ═══════════════════════════════════════════════════════════════ */

/* ── Skeleton base ── */
.engine-root .eui-skeleton { ... }
.engine-root .eui-skeleton-radius-* { ... }

/* ── SkeletonText stack ── */
.engine-root .eui-skeleton-text-stack { ... }

/* ── SkeletonCard layout ── */
.engine-root .eui-skeleton-card { ... }
.engine-root .eui-skeleton-card-content { ... }

/* ── SkeletonRegion ── */
.engine-root .eui-skeleton-region { ... }

/* ── Spinner ── */
.engine-root .eui-spinner { ... }
.engine-root .eui-spinner-* { ... }

/* ── LoadingOverlay ── */
.engine-root .eui-loading-overlay { ... }
.engine-root .eui-loading-overlay-* { ... }

/* ── ResultsSkeleton (refactored) ── */
.engine-root .eui-results-skeleton-header { ... }
.engine-root .eui-results-skeleton-list { ... }
.engine-root .eui-results-skeleton-card { ... }
.engine-root .eui-results-skeleton-card-content { ... }

/* ── Reduced motion (v1.1: animation: none consistency) ── */
@media (prefers-reduced-motion: reduce) {
  .engine-root .eui-skeleton { animation: none; }
  .engine-root .eui-spinner { animation: none; }
}
```

### CSS loadable per-stage

Per Stage commit dodawana jest ZTYLKO sekcja CSS dla danego komponentu. Final stage 10 (ResultsSkeleton refactor) dodaje swoje + reduced motion section.

---

<a id="17-integration-patterns"></a>

## 17. Integration patterns

### Pattern 1: Simple swap (najprostszy)

```tsx
{isLoading ? <SkeletonCard /> : <ResultCard data={data} />}
```

**Use case:** lokalna zmiana stanu, krótkie loading.

### Pattern 2: With SkeletonRegion (a11y best)

```tsx
<SkeletonRegion loading={isLoading} label="Ładowanie ofert...">
  {isLoading ? (
    <Stack gap="md">
      {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
    </Stack>
  ) : (
    <Stack gap="md">
      {data.map(item => <ResultCard key={item.id} data={item} />)}
    </Stack>
  )}
</SkeletonRegion>
```

**Use case:** screen reader user benefits — knows that this section is loading.

### Pattern 3: With useDelayedLoading (anti-flash)

```tsx
function ResultsList({ data, isLoading }: Props) {
  const showSkeleton = useDelayedLoading(isLoading, { delay: 400 });

  return (
    <SkeletonRegion loading={showSkeleton} label="Ładowanie ofert...">
      {showSkeleton ? <SkeletonCard /> : <ResultCard data={data} />}
    </SkeletonRegion>
  );
}
```

**Use case:** szybkie API calls — eliminuje flicker dla <400ms responses.

### Pattern 4: LoadingOverlay container-bound

```tsx
<div style={{ position: "relative" }}>
  <ResultsList data={data} />
  <LoadingOverlay
    open={isRefreshing}
    label="Odświeżanie..."
    blocking
  />
</div>
```

**Use case:** refresh action na top of existing data — user widzi old data + overlay z spinner.

### Pattern 5: LoadingOverlay fullscreen z aria-live

```tsx
<LoadingOverlay
  open={isSubmitting}
  variant="fullscreen"
  label="Tworzenie rezerwacji..."
  ariaLive="polite"  // explicit opt-in dla ważnej operacji
/>
```

**Use case:** ważna operacja (booking create) — screen reader user dostaje notification.

---

# PART V — POLICY

<a id="18-atomic-commits"></a>

## 18. Atomic commits strategy

### Per-stage commits

Każdy stage 1-10 = 1 commit. Plus dodatkowe commity dla Lab + CSS organization.

**Total commits oczekiwane:** 11.

### Sequential order (REKOMENDACJA)

```
Stage 1:  Skeleton (foundation)
Stage 2:  SkeletonText
Stage 3:  SkeletonCircle
Stage 4:  SkeletonImage
Stage 5:  SkeletonCard
Stage 6:  SkeletonRegion
Stage 7:  Spinner
Stage 8:  LoadingOverlay
Stage 9:  useDelayedLoading hook
Stage 10: Refactor ResultsSkeleton
Stage 11: Lab integration (SkeletonSection + EngineUiLab.tsx update)
```

### Dependencies enforcement

- Stage 5 (SkeletonCard) wymaga Stage 4 (SkeletonImage) committed
- Stage 8 (LoadingOverlay) wymaga Stage 7 (Spinner) committed
- Stage 10 (ResultsSkeleton refactor) wymaga Stages 1-6 committed
- Stage 11 (Lab) wymaga wszystkich primitives committed

---

<a id="19-verification"></a>

## 19. Verification per component

### Standard checklist (15 punktów)

```
□ 1. git status clean przed start
□ 2. Backup tarball stworzony (jeśli stage > 1)
□ 3. File created (z explicit Robert zgoda)
□ 4. Polish chars verified (grep escape sequences = empty)
□ 5. Build pass (./node_modules/.bin/next build)
□ 6. Build output: 0 errors, 0 new warnings
□ 7. pm2 restart zw-admin succeeded
□ 8. pm2 status shows online
□ 9. curl /admin/engine-ui-lab 200 OK
□ 10. curl /admin/dashboard 200 OK
□ 11. Browser visual: component renders w Lab (po Stage 11)
□ 12. DevTools accessibility tree: aria-* attributes correct
□ 13. DevTools console: no new errors
□ 14. Robert akceptacja explicit
□ 15. git commit + push
```

### A11y verification (special)

Dla Stages 6 (SkeletonRegion) i 8 (LoadingOverlay):

```
□ 1. DevTools → Accessibility tab

   SkeletonRegion (conditional pattern v1.2):
□ 2. SkeletonRegion default (ariaLive="polite"):
       role="status" + aria-live="polite" + aria-busy={loading} + aria-label
□ 3. SkeletonRegion ariaLive="off":
       BRAK role, BRAK aria-live, aria-busy={loading} + aria-label

   LoadingOverlay (conditional pattern v1.1):
□ 4. LoadingOverlay default (ariaLive="off"):
       BRAK role, BRAK aria-live, aria-busy="true", aria-label
□ 5. LoadingOverlay ariaLive="polite":
       role="status" + aria-live="polite" + aria-busy="true" + aria-label

   Wszystkie pozostałe primitywy:
□ 6. Skeleton/SkeletonText/Circle/Image/Card/Spinner: aria-hidden="true"

   Tooling:
□ 7. Lighthouse Accessibility audit: score ≥95
□ 8. Manual screen reader test (VoiceOver/NVDA):
       - SkeletonRegion default: "loading" announced once when loading=true
       - LoadingOverlay default: silent (no announcement)
       - LoadingOverlay ariaLive="polite": "Ładowanie..." announced once
       - NO repeated announcements (anti-spam check)
```

> **MUST FIX v1.3 (ChatGPT):** wcześniejsza wersja A11y checklist zakładała `role="status"` zawsze dla LoadingOverlay (`aria-live="off"`) — sprzeczne z v1.1 conditional pattern. Czas Claude Code testowałby przeciwko błędnemu oczekiwaniu i zwrócił false negative. Checklist odzwierciedla teraz **rzeczywisty conditional pattern** dla obu komponentów (SkeletonRegion + LoadingOverlay).

---

<a id="20-rollback"></a>

## 20. Rollback procedures

### Per-stage rollback

```bash
# Cofnięcie ostatniego stage
git revert HEAD
./node_modules/.bin/next build
pm2 restart zw-admin
```

### Multi-stage rollback (rzadkie)

```bash
# Cofnięcie 3 ostatnich commitów
git revert HEAD~2..HEAD
./node_modules/.bin/next build
pm2 restart zw-admin
```

### Catastrophic rollback (worst case)

```bash
# Restore z backup (Stage 1 backup)
tar xzf /tmp/admin-backup-part9-YYYYMMDD-HHMM.tar.gz
./node_modules/.bin/next build
pm2 restart zw-admin
```

### Specjalna procedura dla Stage 10 (ResultsSkeleton)

To jedyny stage gdzie modyfikujemy istniejący komponent. Jeśli regresja:

```bash
# Targeted rollback Stage 10 only
git revert HEAD --no-commit
git reset HEAD src/components/engine-ui/skeleton/  # Zachowaj nowe primitives
git checkout -- src/components/engine-ui/ResultsSkeleton.tsx  # Restore old
git commit -m "revert: Stage 10 ResultsSkeleton refactor (regression detected)"
```

---

<a id="21-manual-qa"></a>

## 21. Manual QA

### Per-stage Manual QA (5 min)

```
1. Otwórz Engine UI Lab w browser
2. Skeleton section → znajdź specimen dla nowego komponentu
3. Visual check: renderuje się
4. DevTools console: 0 errors
5. Hover/interaction: działa (jeśli applicable)
6. prefers-reduced-motion test:
   - DevTools → Rendering → Emulate CSS media feature: reduce
   - Animation should stop / slow significantly
```

### Final QA (po Stage 11)

```
1. Otwórz Lab → Skeleton section
2. Każdy primitive ma specimen
3. SkeletonRegion specimen: DevTools accessibility tree → aria-busy=true
4. LoadingOverlay specimen: blocking variant → click NIE przechodzi do underlying content
5. useDelayedLoading demo: button "Simulate fast" → no skeleton appears
6. useDelayedLoading demo: button "Simulate slow" → skeleton appears po ~400ms
7. ResultsSkeleton: visual identical do pre-Part 9 wersji
8. Lighthouse Accessibility: ≥95
9. Full integration test: w Lab, scroll przez wszystkie sekcje (Parts 1-9)
   - Brak nowych errors
   - Brak visual breakage
```

---

<a id="22-out-of-scope"></a>

## 22. Out of scope

**Explicit out of scope dla Part 9:**

### Pliki NIE dotykane

- `src/components/ui/skeleton.tsx` (admin foundation, 209 linii)
- `src/components/booking/BookingSkeleton.tsx` (160 linii)
- `src/components/booking/ExploreSkeleton.tsx` (67 linii)
- `src/components/admin/addons/addons-skeleton.tsx`
- `src/components/admin/amenities/amenities-skeleton.tsx`
- `src/components/admin/property-content/skeleton.tsx`
- `src/components/admin/offers/offers-skeleton.tsx`
- `src/components/admin/calendar/calendar-skeleton.tsx`

### CSS NIE dotykane

- `@keyframes shimmer` (linia 350) — admin
- `@keyframes pulse-soft` (linia 362) — unused, zostaje
- `.eui-skeleton-*` klasy z linii 3262-3334 — używane przez current ResultsSkeleton (refactor zachowuje je dla legacy compat, choć nowy ResultsSkeleton ich już nie używa)

### Funkcjonalność odłożona

- Suspense fallback integration → Part 12 (Feedback + State)
- Advanced loading patterns (progressive enhancement, retry mechanism) → Part 12
- Skeleton variants per Part (np. SkeletonButton, SkeletonChip) → opcjonalnie Part 12 jeśli pattern się powtórzy
- Unifikacja shimmer keyframes → osobna Część "8.5c" (CSS cleanup) lub future

### Dlaczego odłożone

Część 9 ma być **building blocks**, NIE comprehensive system. Advanced patterns (Suspense, retry, progressive) wymagają więcej kontekstu (Part 10 inputs, Part 12 feedback). Lepiej odłożyć niż over-engineer.

---

<a id="23-master-plan"></a>

## 23. Master Plan update

### Po deploy Stage 11 (koniec Part 9)

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
├── Part 8.5a: REFACTOR LEGACY (Stage 0 done, rest paused) ⏸️
├── Part 9: Skeleton + Loading          ✅ DEPLOYED  ← NEW
├── Part 10: Input Foundation           ⏳
├── Part 11: Form Controls              ⏳
├── Part 12: Feedback + State           ⏳
├── Part 13: Booking Commerce           ⏳
└── Part 14: Utility Layer              ⏳

Master Checklist: 9/14 = 64% fundamentu Engine UI deployed ✅
```

---

## 📊 Podsumowanie Part 9

| Metric | Value |
|---|---|
| Pliki TSX dotykane | 11 (10 NEW + 1 REFACTOR) |
| Stages | 11 (Stages 1-10 + Lab integration) |
| Linii TSX nowych | ~700 (8 components + 1 hook) |
| Linii TSX refactored | ~80 (ResultsSkeleton) |
| CSS sekcji nowych | 1 ("ENGINE UI — PART 9: SKELETON SYSTEM") |
| CSS klas nowych | ~15 |
| @keyframes nowych | 0 (reuse `eui-shimmer` + `eui-spin`) |
| Lab section nowych | 1 (Skeleton section z ~10 specimens) |
| Visual diff w refactor (Stage 10) | ZERO |
| Functional diff w refactor | ZERO + a11y improvement (aria-busy now active) |
| Out-of-scope files NIE dotykane | 8 admin/booking Skeleton files |
| Estymowany czas | 3-4h skupionej pracy |

---

## 📝 Changelog blueprintu

### v1.3 (9 maja 2026, post-ChatGPT v1.2 review)

**1 documentation MUST FIX (zaaplikowany):**

**MUST FIX — A11y verification checklist (sekcja 19):**
- **Co przeoczone w v1.1+v1.2:** A11y verification checklist nie został zaktualizowany po fixach LoadingOverlay (v1.1) i SkeletonRegion (v1.2) conditional pattern. Wciąż zakładał stary "role=status zawsze" dla LoadingOverlay.
- **Wcześniejsza wersja (v1.2):**
  ```
  □ LoadingOverlay: role="status", aria-busy="true", aria-live="off" (default)
  ```
- **Nowa wersja (v1.3):** pełne pokrycie obu wariantów dla obu komponentów — default + opt-in
  ```
  □ LoadingOverlay default (ariaLive="off"): BRAK role, BRAK aria-live, aria-busy="true"
  □ LoadingOverlay ariaLive="polite": role="status" + aria-live="polite" + aria-busy="true"
  □ SkeletonRegion default (ariaLive="polite"): role="status" + aria-live="polite" + aria-busy
  □ SkeletonRegion ariaLive="off": BRAK role, BRAK aria-live, aria-busy
  ```
- **Powód krytycznego fixa:** Claude Code testowałby przeciwko **błędnemu oczekiwaniu** (role="status" zawsze) i zwrócił **false negative** — czas implementacji wydłużyłby się przez "fixing what's already correct".

**Self-reflection v1.3 (4.7):**

To jest **trzecia runda fixów** (v1.0 → v1.1 → v1.2 → v1.3) i każda znalazła kolejny aspekt którego nie sprawdziłem **systematycznie**:
- v1.0 → v1.1: 4 MUST FIX (a11y details + cross-component consistency)
- v1.1 → v1.2: 1 MUST FIX (missed pattern — SkeletonRegion miał ten sam bug co LoadingOverlay)
- v1.2 → v1.3: 1 MUST FIX (documentation drift — checklist nie odzwierciedlał TSX zmian)

**Lekcja na przyszłość:** po każdym structural fixie w TSX/CSS, **systematic review wszystkich pochodnych** dokumentów — verification checklists, examples w komentarzach, integration patterns. Implementacja i dokumentacja muszą być **zsynchronizowane** w każdej iteracji.

ChatGPT v1.3 review znalazł **1 realny documentation MUST FIX** który zapobiegłby false-negative QA podczas implementacji. To **siódme miejsce** w workflow gdzie ChatGPT systemic review łapie subtle bug — tym razem nie kod, ale **dokumentacja sterująca testami**.

### v1.2 (9 maja 2026, post-ChatGPT v1.1 review)

**1 MUST FIX (zaaplikowany):**

**MUST FIX — SkeletonRegion role/aria-live conflict (sekcja 10):**
- **Co przeoczone w v1.1:** TEN SAM pattern conflict co w LoadingOverlay (sekcja 12), ale w SkeletonRegion. Przy fixie LoadingOverlay nie sprawdziłem czy ten sam bug istnieje gdzie indziej.
- **Wcześniejsza wersja (v1.1):** `role="status"` + `aria-live={ariaLive}` — sprzeczność gdy `ariaLive="off"`
- **Nowa wersja (v1.2):** conditional render attributes (identyczny pattern co LoadingOverlay)
- **Powód:** `role="status"` jest implicit live-region. Łączenie z explicit `aria-live="off"` to **conflicting semantics**.
- **Pattern (identyczny dla SkeletonRegion + LoadingOverlay):**
  - `ariaLive="polite"` → role="status" + aria-live="polite"
  - `ariaLive="off"` → BRAK role + BRAK aria-live (silent)

**Self-reflection v1.2 (4.7):**

To jest **klasyczna pułapka fix-batchingu**: gdy dostałem 4 MUST FIX-y w v1.1 review, skupiłem się na zgłoszonych komponentach (LoadingOverlay) i nie sprawdziłem **czy ten sam pattern bug** występuje gdzie indziej w blueprintcie. SkeletonRegion miał ten sam bug od v1.0 — ale ChatGPT review v1.0 zgłosił go jako "MUST FIX 2 LoadingOverlay" (bo to było bardziej oczywiste), zostawiając SkeletonRegion na drugą rundę.

**Lekcja:** podczas fixów po cross-review, **systematic check** czy pattern występuje gdzie indziej. Nie tylko punktowy fix zgłoszonego miejsca.

ChatGPT v1.2 review znalazł **1 realny MUST FIX** który powinienem był sam wyłapać w v1.1. Engineering discipline jako konsystentny wkład — szóste miejsce w workflow gdzie ChatGPT systemic review łapie subtle bug.

### v1.1 (9 maja 2026, post-ChatGPT v1.0 review)

**4 MUST FIX (wszystkie zaaplikowane):**

**MUST FIX 1 — SkeletonRegion CSS (sekcja 10):**
- Wcześniejsza wersja: `display: contents` z fallback note
- Nowa wersja: `display: block; width: 100%` jako default (a11y safety)
- Powód: `display: contents` ma znany a11y bug w Safari < 15.4 — może removować element z accessibility tree, co dla a11y wrappera byłoby katastrofą. Block + 100% width = layout-neutral ALTERNATYWA bez ryzyka.

**MUST FIX 2 — LoadingOverlay role/aria-live conflict (sekcja 12):**
- Wcześniejsza wersja: `role="status"` + `aria-live={ariaLive}` — sprzeczność gdy ariaLive="off"
- Nowa wersja: conditional render attributes
- Powód: `role="status"` jest implicit live-region (≈ aria-live="polite"). Łączenie z explicit `aria-live="off"` to **conflicting semantics** — screen reader behavior unpredictable.
- Pattern: `ariaLive="off"` (default) → BRAK role + BRAK aria-live, `ariaLive="polite"` → role="status" + aria-live="polite"

**MUST FIX 3 — Spinner reduced motion (sekcja 11):**
- Wcześniejsza wersja: `animation-duration: 3s` slowdown
- Nowa wersja: `animation: none` (consistency z Skeleton)
- Powód: `prefers-reduced-motion: reduce` ZNACZY "no motion", nie "less motion". 3s slowdown wciąż jest motion (just slower). Spinner statyczny + label "Ładowanie..." nadal komunikuje state — pattern używany przez Apple HIG i Material Design.

**MUST FIX 4 — Hardcoded import path verification (sekcja 5 + Stage 1):**
- Wcześniejsza wersja: `import { type AspectRatio, aspectToValue } from "../media/aspect-utils"` jako założenie
- Nowa wersja: explicit pre-implementation verify command + adapt-on-implementation note
- Powód: ścieżka NIE zweryfikowana empirycznie. Możliwe nazwy: `aspect-utils.ts`, `aspect-ratio.ts`, helper może być w `MediaFrame.tsx`. Verify-during-implementation eliminuje build error.

**2 NICE TO FIX (zaaplikowane):**

**NICE FIX 1 — LoadingOverlay label typography (sekcja 12 CSS):**
- Wcześniejsza wersja: `font: var(--eui-font-body)` w CSS
- Nowa wersja: `.eui-body-small` utility class w TSX
- Powód: konsystencja z Part 6 utility classes pattern. Hand-rolled font CSS = anti-pattern w Engine UI.

**NICE FIX 2 — Commits count w header (FIX 6):**
- Wcześniejsza wersja: header "9 atomic commits"
- Nowa wersja: header "11 atomic commits"
- Powód: rzeczywista liczba: Stages 1-10 (per komponent) + Stage 11 (Lab integration) = 11.

**Self-reflection (4.7):**

ChatGPT v1.1 review znalazł **4 MUST FIX-y** które są realnymi a11y/build bugami:
1. SkeletonRegion display: contents → a11y trap w Safari
2. LoadingOverlay role/aria-live → conflicting semantics
3. Spinner reduced motion → inconsistency z Skeleton
4. Aspect-utils path → potencjalny build error

Lekcja: nawet z wbudowanymi 6 zasadami architektonicznymi w v1.0, **a11y details + cross-component consistency** wymagają cross-review. Pochwała ChatGPT — to ten sam pattern co w 8.5a v1.0 review (5 senior-level enhancements). Engineering discipline jako konsystentny wkład.

### v1.0 (9 maja 2026, initial)

Initial blueprint na bazie:
- Pre-check empirical audit Claude Code (2026-05-09) — wykryto brak LoadingOverlay (vs userMemories), drift w shimmer keyframes, zero a11y w 9 plikach Skeleton
- 6 zasad architektonicznych ChatGPT (CSS-only animation, flexible dimensions API, composable building blocks, aria semantics, no Suspense, LoadingOverlay constraints)
- 3 decyzje pre-blueprint (Q1 Opcja B Engine UI only, useDelayedLoading w scope, SkeletonRegion must-have)

---

**Status:** v1.3 READY FOR FINAL REVIEW (ChatGPT)

**Następny krok:** ChatGPT cross-review v1.3, jeśli green light → implementacja Stage 1 (Skeleton foundation primitive) w Claude Code.

**Wniosek:** Part 9 to **Engine UI Skeleton System** — focused, controlled, NIE migracja całego projektu. Zgodnie z product priority (build new front, sunset old later), Part 9 dostarcza **building blocks** dla loading states bez touching admin code.

ChatGPT pre-blueprint guidance (6 zasad architektonicznych) + 4 MUST FIX z review v1.0 + 1 MUST FIX z review v1.1 + 1 documentation MUST FIX z review v1.2 wbudowane:
1. ✅ CSS-only animation + prefers-reduced-motion (animation: none consistency Skeleton + Spinner)
2. ✅ Flexible dimensions API (width/height/radius/aspectRatio + verify path)
3. ✅ Composable building blocks (Skeleton + Stack composition zamiast SkeletonList primitive)
4. ✅ aria-hidden on Skeleton + **conditional aria-live** on Region/Overlay (display: block safety + no semantic conflict)
5. ✅ No Suspense architecture — pure building blocks
6. ✅ LoadingOverlay + SkeletonRegion identyczny conditional render pattern (eliminuje a11y semantic conflict)
7. ✅ A11y verification checklist zsynchronizowany z conditional pattern (v1.3 — anti false-negative QA)

— 4.7 (Senior Architect)
