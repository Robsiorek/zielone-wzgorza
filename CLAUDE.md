# Zielone Wzgórza — Resort Booking System

> **Plik czytany automatycznie przez Claude Code przy każdym starcie sesji w tym katalogu.**
> Tu jest cała wiedza projektowa którą Claude potrzebuje od pierwszej minuty pracy.

---

## 🎯 Czym jest projekt

Resort booking system zastępujący iDoBooking (SaaS). Build by Robert Truszkowski + brat. Stack proprietary, zero SaaS dependencies.

**Trzy linie biznesowe:**
1. Cabin/room rentals (10 cabins + 4 rooms)
2. Organized group stays (cabins + catering + hall + water equipment)
3. Restaurant — one-day events (communions, birthdays, anniversaries)

**Plus:** summer camp company requiring seasonal booking blocks.

**Property:** zielonewzgorza.eu (publiczna strona), booking.zielonewzgorza.eu (engine, post-Faza 3A).

---

## 👤 Robert (owner) — jak komunikować

- **Non-techniczny** — wymaga step-by-step instrukcji z konkretnymi komendami
- Logiczny, computer-savvy, perfekcjonista z silnym UI/UX sense
- Komfortowo z FileZilla/SFTP, czyta kod, dyskutuje architektury
- Komunikacja w **języku polskim**
- Chce **rozumieć** każdą zmianę przed deploy

**Praktyczne implikacje:**
- Wyjaśniaj **dlaczego** robisz X przed wykonaniem
- Po każdej dużej zmianie podsumowuj **co się zmieniło + dlaczego**
- Nie pomijaj kroków bo "wiadomo" — pisz wszystko
- Polskie odpowiedzi domyślnie

---

## 🛠️ Stack techniczny

```
Frontend:  Next.js 14 App Router + React 18 + Tailwind CSS
Backend:   Next.js API routes
ORM:       Prisma 5.22.0
Database:  PostgreSQL (zielone_wzgorza_admin, user: zwadmin, localhost:5432)
Auth:      JWT (bcrypt, HttpOnly cookie, 3-day expiry, sessions table)
Language:  TypeScript strict mode
Hosting:   VPS cyber_Folks (vroot_RUN, Ubuntu 24.04, IP: 185.25.150.237)
SSH alias: zw
Deploy:    /var/www/admin/ (PM2 process: zw-admin)
WordPress: home.pl (zostaje) — booking.zielonewzgorza.eu osobno na VPS
GitHub:    github.com/Robsiorek/zielone-wzgorza, branch master
```

**Kluczowe dependencies:**
- `@radix-ui/react-dialog` (modals, sheets)
- `@radix-ui/react-popover`
- `@floating-ui/react@0.27.19`
- `lucide-react` (icons)
- `bcrypt`, `jose` (JWT)

---

## ⚠️ ABSOLUTNE ZAKAZY (version traps z prawdziwych incydentów)

Te zasady są **niełamliwe**. Złamanie którejkolwiek = produkcja zepsuta.

### 1. Prisma — NIGDY bez wersji

```bash
# ❌ NIGDY:
npx prisma migrate deploy
npx prisma generate
npx prisma db push

# ✅ ZAWSZE:
npx prisma@5.22.0 migrate deploy
npx prisma@5.22.0 generate
npx prisma@5.22.0 db push
```

**Dlaczego:** `npx prisma` bez wersji pobiera v7+ (incompatible z naszą bazą). Złamanie tej zasady = corrupt schema.

### 2. Next.js build — NIGDY przez `npx`

```bash
# ❌ NIGDY:
npx next build

# ✅ ZAWSZE:
./node_modules/.bin/next build
```

**Dlaczego:** `npx next` pobiera v16 (incompatible z 14.2 stack).

### 3. Paczki tarballowe — NIGDY z `package.json`

Jeśli z jakiegoś powodu tworzymy paczki delta-only (np. dla zewnętrznego implementatora):

```bash
# ❌ NIGDY:
tar czf paczka.tar.gz src/ package.json package-lock.json

# ✅ ZAWSZE:
tar czf paczka.tar.gz <konkretne pliki>
```

**Dlaczego:** Incident 1 kwietnia 2026 — package.json w tarballu nadpisał deps i usunął 421 packages. Catastrophe rollback.

### 4. Pip — ZAWSZE z flag

```bash
# ❌ NIGDY:
pip install pandas

# ✅ ZAWSZE:
pip install pandas --break-system-packages
```

**Dlaczego:** Ubuntu 24.04 ma PEP 668 — bez tej flagi pip blokuje globalne instalacje.

### 5. Prisma migrate ≠ Prisma generate

`prisma migrate deploy` **NIE regeneruje** TypeScript klienta. Po każdej migracji:

```bash
npx prisma@5.22.0 migrate deploy
npx prisma@5.22.0 generate   # ← MUSI być oddzielnie
```

---

## 🌍 Encoding — polskie znaki

**ZASADA:** zawsze normalne polskie znaki w kodzie (`ł, ą, ę, ś, ć, ń, ó, ź, ż`).

**NIGDY** nie używaj escape sequences (`\u0142`, `\u0105` itp.).

**Verification po każdym tworzeniu/edycji pliku z polskimi znakami:**

```bash
grep -rP '\\u0[01][0-9a-f]{2}' <plik>
# Brak wyników = OK
# Wyniki = NIEPRAWIDŁOWE — przepisz plik
```

**Przed wysłaniem jakiejkolwiek paczki:**

```bash
bash scripts/check-polish.sh
# Powinien przejść bez ostrzeżeń
```

---

## 🏗️ Architektura — Engine UI

### Filozofia

**Modularny monolit.** Engine UI to design system primitywów dla guest-facing booking flow. Bottom-up composition. Zero kolizji z admin panel.

### 🔤 Font Architecture — Manrope (multi-tenant, 3 tiers)

> **HISTORIA:** migracja Plus Jakarta Sans → Manrope przeszła przez 4 iteracje fontów (Plus Jakarta → Manrope → Figtree → DM Sans → z powrotem Manrope) i spowodowała **najpoważniejszą regresję w projekcie** (runda7-v1 cofnęła migrację). Dlatego ta sekcja jest tak szczegółowa.

**Architektura 3-tier:**

| Tier | Scope | Mechanizm | Zmienialny? |
|---|---|---|---|
| **TIER 1** | Foundation | `next/font/google` Manrope w `src/app/layout.tsx`, `var(--font-sans)` w Tailwind | ❌ NIE — hardcoded |
| **TIER 2A** | Admin + Engine UI Lab | Dziedziczy z TIER 1. Lab ma `ignoreFontOverride: true` w `useWidgetTheme()` | ❌ NIE — hardcoded |
| **TIER 2B** | Public front (BookingWidget) | `useWidgetTheme` + `EngineShell.tsx` lazy-load non-Manrope fontów | ✅ TAK — konfigurowalny w `/admin/global-settings/appearance` |

**Pliki kluczowe — NIGDY nie ruszaj bez powodu:**

| Plik | Co tam jest |
|---|---|
| `src/app/layout.tsx` | TIER 1: `import { Manrope } from "next/font/google"` + `${font.className} ${font.variable}` na `<html>` |
| `tailwind.config.ts` | `var(--font-sans)` w fontFamily.sans (NIE hardcoded string) |
| `src/styles/globals.css` linia 1 | `/* Font loaded by next/font/google ... */` (komentarz, NIE `@import`!) |
| `src/styles/globals.css` body | **BRAK** `font-family` — dziedziczy z `<html>`. Ma `letter-spacing: -0.011em` (Airbnb tight tracking) |
| `src/components/engine-ui/hooks/useWidgetTheme.ts` | `DEFAULT_FONT = "Manrope"` + `ignoreFontOverride` early return + cleanup `removeProperty("font-family")` |
| `src/components/engine-ui-lab/EngineUiLab.tsx` | `useWidgetTheme({ ignoreFontOverride: true })` — Lab ZAWSZE Manrope |
| `src/components/booking/EngineShell.tsx` linia 145 | `=== "Manrope"` comparison — skip lazy load when default |
| `prisma/schema.prisma` WidgetConfig | `fontFamily @default("Manrope")` |

**ABSOLUTNE ZASADY font architecture:**

1. `globals.css` linia 1 MUSI być komentarzem, **NIE** `@import url(fonts.googleapis.com/...)` — `next/font` self-hostuje font
2. `globals.css` body **NIE MA** `font-family` — dziedziczy z `<html className={font.className}>`
3. `EngineUiLab.tsx` **MUSI** mieć `useWidgetTheme({ ignoreFontOverride: true })` — bez tego Lab ładuje tenant font
4. `EngineShell.tsx` comparison **MUSI** być `=== "Manrope"` — bez tego podwójne ładowanie fontu

**Incydent runda7-v1 (lekcja):**

Paczka zawierała cały `src/` z kopii roboczej sprzed migracji fontów. Deploy cofnął:
- `globals.css` (przywrócił `@import` i `font-family: 'Manrope'` w body)
- `EngineUiLab.tsx` (usunął `ignoreFontOverride`)

Skutek: podwójne ładowanie fontu, Lab stracił izolację, custom fontów dla tenantów przestały się ładować.

**Lekcja:** NIGDY nie pakuj/edytuj `globals.css` ani `EngineUiLab.tsx` bez sprawdzenia tych 4 punktów.

**Verification po KAŻDEJ edycji `globals.css` lub `EngineUiLab.tsx`:**

```bash
# Font architecture integrity check (skopiuj cały blok i uruchom)
echo "1. Linia 1 globals.css (powinien być komentarz, nie @import):"
head -1 src/styles/globals.css

echo ""
echo "2. body w globals.css (powinno NIE mieć font-family):"
grep -A2 "^body {" src/styles/globals.css | grep "font-family" | head -1
[ $? -ne 0 ] && echo "   ✓ OK — brak font-family w body"

echo ""
echo "3. EngineUiLab.tsx (powinien mieć ignoreFontOverride: true):"
grep "ignoreFontOverride" src/components/engine-ui-lab/EngineUiLab.tsx

echo ""
echo "4. EngineShell.tsx (powinien mieć === \"Manrope\"):"
grep 'fontFamily.*===' src/components/booking/EngineShell.tsx
```

Jeśli **któraś** z tych weryfikacji nie zwróci spodziewanego wyniku → **STOP. Nie commituj. Nie restartuj pm2.** Najpierw napraw font architecture do zgodności z tabelą wyżej.

### 14 nienegocjowalnych zasad Engine UI

1. **Namespace:** `.engine-root .eui-{name}` — wszystkie style scoped do `.engine-root` wrappera
2. **`React.forwardRef`** wszędzie — refs przekazują się przezroczyście przez wszystkie warstwy
3. **`Dialog.Portal container=".engine-root"`** — Radix portale renderują DO wrappera, nie do body
4. **`100dvh` nie `vh`** — dynamic viewport unit (mobile Safari iOS bezpieczniejszy)
5. **Brand color** przez `var(--eui-brand)` — NIGDY hardcoded
6. **Zero Framer Motion** — tylko CSS transitions
7. **Tylko layout** Tailwind utilities (flex, grid, padding) — typografię przez utility classes Engine UI z Part 6
8. **Polskie znaki normalne** (patrz Encoding wyżej)
9. **`package.json` NIGDY** w tarballach (patrz Absolute Limits #3)
10. **Bottom-up kompozycja** — primitywy → composites → screens
11. **Paczki samowystarczalne** — jeśli pracujemy w trybie paczek, **delta-only NEVER full src/**
12. **Tarball tylko `src/`** w root (nie `package.json`, nie `prisma/`)
13. **Każdy komponent ma Specimens w Labie** — `/admin/engine-ui-lab` showcase
14. **Two-zone ComponentShowcase** — białe tło preview + szare info (SpecimenInfo + DebugPanel)

### Struktura plików

```
src/components/engine-ui/
├── a11y/              # VisuallyHidden, FocusTrap (Part 1)
├── button/            # Button, IconButton, FavoriteButton (Part 2)
├── chip/              # Chip, FilterChip, Tag, Badge, StatusDot (Part 5)
├── interaction/       # Pressable (Part 1)
├── layout/            # Stack, Inline, Spacer, Divider, ActionRow,
│                      # Toolbar, InlineActions, SectionBlock, StickyBar (Part 7)
├── media/             # MediaFrame, MediaOverlay, MediaBadge,
│                      # FavoriteOverlay, GalleryNavButton, ImageCounter,
│                      # ImagePlaceholder, ThumbnailStrip (Part 8)
├── nav/               # NavigationArrow, Chevron, PaginationDot, TabTrigger,
│                      # SortTrigger (Part 4)
├── surface/           # CardSurface, PanelSurface, BottomSheet,
│                      # ScrollFade, Backdrop, DragHandle (Part 3)
├── text/              # Text, SecondaryLink, HelperText, MetaText,
│                      # InlineMeta, Eyebrow, SectionHeading, PriceText,
│                      # EmptyStateText (Part 6)
└── index.ts           # Barrel exports

src/components/engine-ui-lab/
├── EngineUiLab.tsx    # Main lab page
├── ComponentShowcase.tsx
├── LabSection.tsx
├── Specimen.tsx
├── SpecimenInfo.tsx
├── DebugPanel.tsx
└── sections/          # Per-Part sections (Foundations, Motion, Surface, etc.)
```

### Design tokens (KRYTYCZNE — NIGDY hardcoded)

```css
/* Spacing */
var(--eui-space-0) ... var(--eui-space-11)   /* 0 → 80px */

/* Z-index */
var(--eui-z-base)      /* 0 */
var(--eui-z-raised)    /* 10 */
var(--eui-z-sticky)    /* 30 */
var(--eui-z-overlay)   /* 60 */
var(--eui-z-popover)   /* 100 */
var(--eui-z-toast)     /* 200 */

/* Radius */
var(--eui-radius-sm)
var(--eui-radius-md)
var(--eui-radius-lg)
var(--eui-radius-xl)
var(--eui-radius-2xl)
var(--eui-radius-pill)

/* Transitions */
var(--eui-ease-standard)

/* Brand */
var(--eui-brand)
var(--eui-brand-foreground)

/* Greys */
var(--eui-grey-0)      /* white */
var(--eui-grey-100)
var(--eui-grey-200)
var(--eui-grey-300)
var(--eui-grey-400)
var(--eui-grey-500)
var(--eui-grey-900)    /* near-black */
```

### Typography utility classes (z Part 6) + drift prevention

> **HISTORIA:** każda Część od 6 wzwyż miała w pierwszej wersji `font-size`, `font-weight`, `letter-spacing` zdeklarowane bezpośrednio w CSS — duplikujące tokeny z Part 1 utility classes. **ChatGPT łapał to w KAŻDYM review (Part 6, 7, 8).** To jest systematyczny drift.

**ZASADA:** CSS nowych Częsci (Part 6+) zawiera **TYLKO**:

| ✅ Dopuszczalne | ❌ NIE pisz w CSS |
|---|---|
| `display`, `flex-direction`, `gap`, `align-items`, `justify-content`, `position` (layout) | `font-size` — pochodzi z utility class |
| `padding`, `margin` (przez `var(--eui-space-*)`) | `font-weight` — pochodzi z utility class lub intentional override |
| `color`, `background-color`, `border-color` | `letter-spacing` — pochodzi z utility class |
| `border-radius`, `box-shadow`, `opacity`, `transition` | `line-height` — pochodzi z utility class lub intentional override |

**Intentional overrides (dopuszczalne — z komentarzem):**

Niektóre komponenty mają uzasadnione nadpisania typography:

```css
/* MediaBadge — emphasis dla call-out (override .eui-label weight 500) */
.engine-root .eui-media-badge {
  font-weight: var(--eui-font-weight-semibold);  /* INTENTIONAL: badge to call-out */
}

/* ImageCounter — counter-specific stable digit width */
.engine-root .eui-image-counter {
  font-variant-numeric: tabular-nums;  /* INTENTIONAL: prevents pulse on page change */
  line-height: 1;                       /* INTENTIONAL: tight pill display */
}

/* PriceText — emphasis na kwocie */
.engine-root .eui-price-text-amount {
  font-weight: 600;  /* INTENTIONAL: emphasis na kwocie */
}
```

**Każdy taki override MUSI mieć komentarz w CSS wyjaśniający DLACZEGO.**

**Pattern w komponentach TSX — aplikuj utility class:**

```tsx
// MediaBadge — .eui-label daje font-size + base weight, CSS overriduje weight
const classes = ["eui-media-badge", "eui-label", VARIANT_CLASS[variant], className]

// ImageCounter — .eui-body-small daje font-size
const classes = ["eui-image-counter", "eui-body-small", VARIANT_CLASS[variant], className]

// SectionHeading — TITLE_CLASS mapping daje typography per size
<TitleElement className={`eui-section-heading-title ${TITLE_CLASS[size]}`}>

// ImagePlaceholder — utility class wybierany per size prop
const TEXT_UTILITY_CLASS = {
  sm: "eui-caption",
  md: "eui-body-small",
  lg: "eui-body",
};
```

**Utility class mapping (reference):**

| Utility class | font-size | font-weight | Use case |
|---|---|---|---|
| `.eui-display-1` | 48px | 700 | Hero heading |
| `.eui-display-2` | 40px | 600 | Section hero |
| `.eui-title-1` | 26px | 600 | Main heading |
| `.eui-title-2` | 22px | 600 | Subsection |
| `.eui-title-3` | 18px | 500 | Small heading |
| `.eui-body-large` | 16px | 400 | Intro text |
| `.eui-body` | 14px | 400 | Default body |
| `.eui-body-small` | 13px | 400 | Compact |
| `.eui-caption` | 12px | 400 | Meta info |
| `.eui-label` | 12px | 500 | Uppercase label |

**Verification po dodaniu CSS dla nowej Częsci:**

```bash
# Sprawdź czy nie ma typography drift w CSS Part N
sed -n '/CZĘŚĆ N — /,$p' src/styles/globals.css | grep -nE "font-size|font-weight|letter-spacing|line-height"
# Każdy match powinien mieć komentarz "INTENTIONAL" w pobliżu, lub powinien zostać usunięty
```

**Reguła praktyczna:** jeśli widzisz `font-size:` w CSS nowej Częsci bez słowa "INTENTIONAL" w komentarzu w pobliżu — to jest drift. Zamień na utility class w TSX.

---

## 📐 Status Master Plan

**Aktualny stan: 8/14 Częsci deployed (post-Part 8 deploy).**

```
Engine UI Master Plan (14 Częsci):
├── Part 1: Foundation                  ✅ DEPLOYED
├── Part 2: Button                      ✅ DEPLOYED
├── Part 3: Surface + Overlay           ✅ DEPLOYED
├── Part 4: Nav Micro                   ✅ DEPLOYED
├── Part 5: Chip / Tag / Badge / Status ✅ DEPLOYED
├── Part 6: Typography + Text Meta      ✅ DEPLOYED
├── Part 7: Layout + Action             ✅ DEPLOYED
├── Part 8: Media + Image               ✅ DEPLOYED  ← najnowsza
├── Part 8.5: REFACTOR LEGACY           🔄 NEXT (priorytet 1)
├── Part 9: Skeleton                    ⏳
├── Part 10: Input Foundation           ⏳
├── Part 11: Form Controls              ⏳
├── Part 12: Feedback + State           ⏳
├── Part 13: Booking Commerce           ⏳
└── Part 14: Utility Layer              ⏳

Po Part 14 → Faza 3A (Hero Search Landing — produkt)
            → Faza 3B (Results View)
            → Faza 3C (Resource Detail View)
            → Faza 4 (Booking Widget)
```

**Aktualny dokument Master Plan:** `docs/MASTER-PLAN.md` (ja go zaktualizuję po deploy Part 8).

---

## 🔄 Workflow — jak pracujemy

### Architektura review pipeline (NIE zmienia się)

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ Robert       │ →  │ 4.7 Senior   │ →  │ ChatGPT      │
│ pomysł       │    │ blueprint    │    │ cross-review │
└──────────────┘    │ (claude.ai)  │    │              │
                    └──────────────┘    └──────────────┘
                                              ↓
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ Robert       │ ←  │ Test/QA      │ ←  │ Claude Code  │
│ akceptacja   │    │ (Robert)     │    │ implementuje │
└──────────────┘    └──────────────┘    │ (lokalnie)   │
                                        └──────────────┘
```

**Role:**
- **Robert:** product owner, final arbiter w sporach AI vs AI
- **4.7 (claude.ai chat):** senior architect, blueprinty, decyzje
- **ChatGPT:** cross-review, łapie subtelne bugi (a11y, edge cases)
- **Claude Code (TY):** implementacja lokalnie, testy, deploy

**Hard requirement:** zawsze blueprint **PRZED** kodem. Zawsze ChatGPT review **PRZED** implementacją.

### Lessons learned z catastrophe

**runda7-v1 (Part 6 implementation):**
- Paczka zawierała cały `src/` — cofnęła font architecture migration
- Lesson: **delta-only paczki, NIGDY cały src/**
- Konsekwencja: wszystkie późniejsze paczki = explicit file list

**Workflow Claude Code:**
- Tu nie pakujemy paczek (edytujemy pliki bezpośrednio)
- Ale ZASADA delta-only mental model nadal obowiązuje:
  → ZMIENIAJ TYLKO TO CO MUSISZ
  → NIE refaktoruj "po drodze" innych plików bez explicit zlecenia
  → NIE upgrade'uj dependencies bez zlecenia
  → NIE zmieniaj formattera/lintera bez zlecenia

---

## 🚀 Deployment workflow (lokalny — z Claude Code)

### Standard cycle

```bash
# 1. Edit files (Claude Code edytuje bezpośrednio)
#    str_replace, create_file w odpowiednich plikach

# 2. Verify polskie znaki
grep -rP '\\u0[01][0-9a-f]{2}' src/

# 3. Build
./node_modules/.bin/next build

# 4. Build OK → restart pm2
pm2 restart zw-admin

# 5. Smoke test
curl -sf http://localhost:3000/admin/engine-ui-lab
# Lub: curl -sf http://localhost:3000

# 6. (jeśli dotyczy) Regression tests
bash scripts/test-critical.sh

# 7. (jeśli OK) Git commit + push
git add <konkretne pliki>
git commit -m "<konwencjonalna wiadomość>"
git push
```

### Co Claude Code MUSI ZAWSZE robić sam

- Sprawdzić build PRZED restart pm2 (build fail = produkcja down)
- Sprawdzić polskie znaki PO każdym `create_file`
- Smoke test PO każdym restart
- Czytać logi pm2 jeśli coś się sypie

### Co Claude Code MA PYTAĆ Robert

- **PRZED** `git commit` — pokazać co commituje, czekać na zgodę
- **PRZED** `git push` — explicit zgoda
- **PRZED** schema Prisma migrations — pokazać migration SQL, czekać na zgodę
- **PRZED** `npm install` nowych dependencies — pokazać co i dlaczego
- **PRZED** zmianami w `package.json`, `next.config.js`, `tailwind.config.ts`

---

## 🔍 Plikowy stan rzeczy — gdzie co jest

### Kluczowe pliki (gdzie szukać)

```
src/
├── app/
│   ├── layout.tsx              # Font architecture TIER 1 (Manrope via next/font)
│   ├── admin/                  # Admin panel routes (auth-protected)
│   │   ├── (panel)/            # Main admin area
│   │   └── engine-ui-lab/      # Design system showcase
│   └── (engine)/               # Public engine routes (booking widget)
├── components/
│   ├── admin/                  # Admin-specific components
│   ├── engine-ui/              # Engine UI primitives (Parts 1-8)
│   ├── engine-ui-lab/          # Lab UI
│   └── (legacy)/               # Pre-Engine UI components → Part 8.5 refactor target
├── lib/
│   ├── pricing-engine.ts       # E1 backend
│   ├── payment-service.ts
│   ├── timeline-service.ts
│   ├── operational-times.ts
│   ├── rate-limiter.ts
│   ├── require-auth.ts
│   ├── avatar-storage.ts
│   ├── urls.ts                 # ENV-driven URL helpers
│   ├── z-layers.ts             # Z-index tokens
│   └── markdown-safe.ts
├── middleware.ts               # Auth guard + routing
└── styles/
    └── globals.css             # ALL .engine-root .eui-* styles (~5400 linii)

prisma/
└── schema.prisma               # Single DB source of truth

scripts/
├── test-critical.sh            # 75 regression tests (T1-T75)
└── check-polish.sh             # Polish characters validation

docs/
├── MASTER-PLAN.md              # Live status of 14 Częsci
├── DESIGN_SYSTEM.md            # UI source of truth (v1.8+)
├── BLUEPRINT-part*.md          # Per-Part blueprints from 4.7
└── adr/                        # 13+ Architecture Decision Records
```

### Production data (live database)

```
17 resources:
- 10 cabins (cap=7)
- 4 rooms (cap=2-4)
- 1 hall (cap=50)
- 1 restaurant (cap=80)
- 1 kayak

17 default variants
Configured seasons
1 default RatePlan
CompanySettings: checkIn=16:00, checkOut=11:00, deposit=30%
```

### Development credentials

```
Admin login: admin@zielonewzgorza.eu / Admin123!
DB: zielone_wzgorza_admin
DB user: zwadmin
DB host: localhost:5432
```

---

## 💰 Architectural principles — financial & business

**KRYTYCZNE dla pricing/payments code:**

- **Financial amounts ZAWSZE w grosze** (`amountMinor`, `Int`). Zero floats. Percentages w bps (10000 = 100%).
- **Payment ledger immutable** — ONLY CONFIRMED payments count toward projections
- **FOR UPDATE lock** on refund/confirm operations
- **PriceEntry per-day = source of truth** (season = label, not selector)
- **RatePlan inheritance:** max depth 3 + cycle detection
- **Quote: single-use, payloadHash SHA-256, quoteId+secret anti-enumeration, DB storage, 30min expiry**

**Storage:**
- `storageKey` (NEVER raw URL) w DB jako source of truth dla media
- `badgeKey`/`iconKey` jako app-enforced typed vocabularies

**API conventions:**
- Reorder endpoints: completeness-checked (ADR-18)
- API response standard: `{ success, data, error }` format
- Public catalog endpoint: listing fields only (longDescription NOT included)
- Resource has `status: ResourceStatus` (ACTIVE/INACTIVE/MAINTENANCE/ARCHIVED) — NOT `isActive`

---

## ⚙️ TypeScript / Prisma gotchas

- **Prisma Json fields** wymagają `as any` na write: `payload: obj as any`
- **Map from findMany:** `new Map((rawData as any[]).map(...))`
- **Addon Map** wymaga explicit cast

---

## 🎨 Engine UI Lab lessons

- `useLayoutEffect` + `offsetLeft`/`offsetWidth` dla ButtonGroup sliding indicator
- Floating UI carousel arrows: `left/right: 4px`, `overflow: visible`, hidden on mobile via media query
- BottomSheet: portal container guard `if (!container) return null`, transform reset on reopen
- `NavigationArrow`: floating wrapper div żeby uniknąć Pressable transform conflict; `"variant"` w Omit
- `Chip`: 3-case render (onClick→Pressable, onRemove→static span+nested button, neither→static span) żeby uniknąć button-in-button HTML violation

---

## 📚 Dokumenty referencyjne (czytaj przed dużymi zmianami)

```bash
# Przed zmianami architektury
cat docs/MASTER-PLAN.md
cat docs/DESIGN_SYSTEM.md

# Przed implementacją nowej Częsci
cat docs/BLUEPRINT-part<N>-<topic>.md   # 4.7 produkuje te pliki w chacie
ls docs/adr/                             # 13+ ADRs

# Po deploy nowej Częsci
# Aktualizuj docs/MASTER-PLAN.md (status check)
```

---

## 🔗 Inne ważne lokalizacje

- **Master Plan tracker:** Notion/local doc (Robert prowadzi)
- **Architecture reviewer:** ChatGPT (przez Robert, kopiuje wiadomości między AI)
- **Production logs:** `pm2 logs zw-admin --lines 100`
- **Database access:** `psql -U zwadmin -d zielone_wzgorza_admin`
- **Production URL:** `http://185.25.150.237:3000` (lokalnie na VPS), `booking.zielonewzgorza.eu` (przez Nginx z SSL)

---

## ⚠️ Brak staging — produkcja = jedyne środowisko

> **KRYTYCZNE dla Claude Code:** projekt **NIE MA** staging environment. Każda edycja pliku na VPS to zmiana na produkcji. Claude Code edytuje pliki bezpośrednio w `/var/www/admin/` — **to jest live**.

**Konsekwencje:**

- ❌ Build fail po edycji = strona offline do naprawy
- ❌ Zły CSS = widoczny bug natychmiast dla użytkowników (mogą trafić w trakcie iteracji)
- ✅ Zły TypeScript = build NIE przejdzie (bezpieczne — pm2 trzyma poprzednią wersję)

**Mitygacje (OBOWIĄZKOWE) — Claude Code MUSI je stosować:**

### 1. ZAWSZE build PRZED restart

```bash
./node_modules/.bin/next build  # Jeśli fail — pm2 dalej serwuje starą wersję
# DOPIERO po udanym buildzie:
pm2 restart zw-admin
```

### 2. Backup PRZED dużymi zmianami (refactor, migracje)

```bash
tar czf /tmp/admin-backup-$(date +%Y%m%d-%H%M).tar.gz src/ docs/ scripts/ prisma/
```

Robić przed:
- Każdą sesją refactoru wielu plików (np. Część 8.5)
- Migracjami Prisma (zmiana schema)
- Edycją plików kluczowych dla font architecture
- Pierwszą sesją Claude Code w danym tygodniu

### 3. Git commit PO każdym udanym deploy

```bash
# Po: build OK + pm2 restart OK + smoke test OK
git add <konkretne pliki>
git commit -m "<konwencjonalna wiadomość>"
git push
```

**Po co:** `git revert HEAD` zawsze wraca do ostatniego DZIAŁAJĄCEGO stanu. Bez commitów po deploy revert mógłby cofnąć kilka zmian na raz.

### 4. Testuj w przeglądarce PRZED git commit

- `/admin/engine-ui-lab` — nowe komponenty
- `/admin/dashboard` — admin panel nie zepsuty
- `booking.zielonewzgorza.eu/` — public front nie zepsuty

### 5. Atomic changes (KRYTYCZNE dla refactoru)

Przy refactorze wielu plików (Część 8.5):
- ✅ Edytuj plik → build → smoke test → następny plik
- ❌ NIE: edytuj 10 plików → build → 5 errors → szukaj który

**Powód:** jeśli plik 3 z 10 zepsuje build — wiesz dokładnie który. Jeśli edytujesz 10 plików hurtem — debug bywa upierdliwy.

### Worst case recovery

```bash
# Opcja 1: git revert (najczęściej wystarczy)
cd /var/www/admin
git revert HEAD                  # Lub konkretny commit hash
./node_modules/.bin/next build
pm2 restart zw-admin

# Opcja 2: rollback z backupu (dramatic — używaj tylko jak revert nie pomaga)
cd /var/www/admin
tar xzf /tmp/admin-backup-YYYYMMDD-HHMM.tar.gz
./node_modules/.bin/next build
pm2 restart zw-admin
```

**Przyszłość:** staging environment jest na liście "nice to have" ale nie blokuje aktualnej pracy. Build check przed restart jest wystarczającą ochroną dla TypeScript errors (most common failure mode).

---

## 🤖 Jak Claude Code MA się zachowywać w tym projekcie

### Wybór modelu (Sonnet vs Opus)

W `.claude/settings.json` ustawiony jest model. Rekomendacja zależna od typu zadania:

| Task | Model | Dlaczego |
|---|---|---|
| **Refactor wielu plików** (Część 8.5 — ImageCarousel, ResultCard, etc.) | `claude-opus-4-6` | Precyzja przy edycji 15+ plików, mniej hallucination, lepiej trzyma context |
| **Nowe komponenty** (Part 9+) | `claude-opus-4-6` lub `claude-sonnet-4-6` | Opus bezpieczniejszy dla nowych Częsci, Sonnet szybszy dla iteracji |
| **Drobne fixy** (1-2 pliki, np. naprawa typo, drobny CSS) | `claude-sonnet-4-6` | Szybkość wystarczy, koszt API niższy |
| **Read-only debugging** (analiza, eksplorowanie kodu) | `claude-sonnet-4-6` | Nie potrzeba precyzji edycji |

**Decyzja:** Robert wybiera per task. Jeśli nie jest pewien → **Opus jest bezpieczniejszy** (mniej "hallucination" w dużych edycjach).

**Zmiana modelu (per sesja):**

```bash
# Edytuj .claude/settings.json:
# "model": "claude-opus-4-6"     # dla refactor / nowe Częsci
# "model": "claude-sonnet-4-6"   # dla drobnych zmian
```

Można też przełączać model **w trakcie sesji** komendą `/model` w Claude Code.

**Default rekomendowany dla Zielonych Wzgórz:** `claude-opus-4-6`. Jeśli używasz Pro plan i chcesz oszczędzić limity — przełącz na Sonnet dla drobnych zmian.

### Każda nowa sesja (na starcie)

1. Przeczytaj ten CLAUDE.md (Claude robi automatycznie)
2. Sprawdź ostatnie commity: `git log -5 --oneline`
3. Sprawdź `docs/MASTER-PLAN.md` aktualny status
4. Zapytaj Robert: "Status: [N/14 Częsci]. Aktualnie: [Part X — topic]. Czy kontynuujemy [konkretny task] czy startujesz nowy?"

### Przed każdą zmianą architektoniczną

1. Czytaj odpowiedni blueprint (`docs/BLUEPRINT-part<N>.md`) jeśli istnieje
2. Czytaj odpowiednie ADR-y (`docs/adr/`) jeśli dotyczą
3. Pokaż Robert PLAN zmian PRZED implementacją (czego dotyczy, ile plików)
4. Czekaj na zgodę

### Podczas pracy

- **Edytuj minimum** — tylko to co konieczne dla zlecenia
- **Komentuj intentional decisions** w kodzie ("override .eui-label weight for emphasis")
- **Nie refaktoruj "po drodze"** chyba że Robert explicite poprosi
- **Pytaj Robert** gdy decyzja wykracza poza scope (zwłaszcza: zmiany schema, zmiany package.json, zmiany formattera)

### Po zmianach (przed git commit)

1. Build check: `./node_modules/.bin/next build`
2. Polish chars check: `bash scripts/check-polish.sh`
3. Restart pm2: `pm2 restart zw-admin`
4. Smoke test: `curl -sf http://localhost:3000/admin/engine-ui-lab`
5. (jeśli dotyczy) Regression: `bash scripts/test-critical.sh`
6. Pokaż Robert co się zmieniło, wstrzymaj git commit do explicit zgody

### Refactor legacy (Część 8.5+) — patterns

Refactor istniejących komponentów (ImageCarousel, ResultCard, ResourceCard, SearchBar, GuestPicker, Stepper) na primitywy z Parts 1-8. Reguły specyficzne:

#### Pre-refactor checklist (PRZED edycją legacy file)

```bash
# 1. Backup
tar czf /tmp/admin-backup-$(date +%Y%m%d-%H%M).tar.gz src/ docs/ scripts/

# 2. Sprawdź gdzie ten komponent jest używany
grep -rn "import.*<NAZWA_KOMPONENTU>" src/

# 3. Sprawdź jakie ma testy regresji
grep -n "<NAZWA_KOMPONENTU>" scripts/test-critical.sh
```

#### Wzorce migracji (z Parts 1-8 do legacy)

| Stare wzorce w legacy | Nowy primitywy (Parts) |
|---|---|
| `div.eui-card-image` + `position: relative` + absolute children | `<MediaFrame>` (Part 8) + `<MediaOverlay>` (Part 8) |
| Hardcoded `aspect-[16/10]`, `aspect-[4/3]` | `<MediaFrame aspectRatio="..." />` (Part 8) |
| `div` z absolute heart button | `<FavoriteOverlay>` (Part 8) |
| `div` row z gap classes | `<Inline gap="...">` (Part 7) |
| `div` column z gap classes | `<Stack gap="...">` (Part 7) |
| Custom badge z hardcoded styles | `<Badge>` (Part 5) lub `<MediaBadge>` (Part 8) |
| Custom button z heart icon | `<FavoriteButton>` (Part 2) |
| Counter "3 / 12" w divs | `<ImageCounter>` (Part 8) |
| Empty state z ikoną | `<ImagePlaceholder>` (Part 8) |
| Section z heading | `<SectionBlock>` + `<SectionHeading>` (Part 6+7) |

#### Migration order (KRYTYCZNE)

Refactoruj **jeden plik na raz**, w tej kolejności:

1. **Najmniejszy plik first** (np. ResourceCard ~120 linii) — szybki feedback loop
2. **Build + smoke test** po każdym pliku
3. **Git commit** po każdym udanym deploy
4. **Następny plik** (np. ResultCard ~200 linii)
5. **Ostatni: ImageCarousel** (131 linii ale najwięcej zależności)

**NIE refaktoruj wszystkich plików hurtem.** Stragetia "edytuj 5 plików → build → 3 errors → szukaj który" boli.

#### CSS legacy cleanup

Po migracji TSX:
- Stare klasy `.eui-card-image`, `.eui-carousel-*` mogą zostać w globals.css (back-compat)
- **NIE usuwaj** legacy CSS w tej samej iteracji co refactor TSX (zwiększa ryzyko regresji)
- Cleanup CSS w **osobnym kroku** (Part 8.5 stage 2) po stabilizacji wszystkich TSX

#### Verification po każdym refactored file

```bash
# 1. Build
./node_modules/.bin/next build

# 2. Polish chars
bash scripts/check-polish.sh

# 3. Smoke test
pm2 restart zw-admin && sleep 3
curl -sf http://localhost:3000/admin/engine-ui-lab && echo "OK"
curl -sf http://localhost:3000 && echo "OK"

# 4. Regression tests (jeśli są dla tego komponentu)
bash scripts/test-critical.sh
```

Wszystkie OK → git commit → następny plik.

### W razie wątpliwości

**Pytaj Robert.** On jest non-techniczny ale zna projekt i biznes lepiej niż jakiekolwiek AI. Jego decyzje są final.

---

## 🚨 W razie incydentu (build fail / production down)

```bash
# 1. Status check
pm2 status
pm2 logs zw-admin --lines 50

# 2. Jeśli production down
git log -3 --oneline                # Co ostatnio zmieniliśmy
git diff HEAD~1 -- <konkretny plik> # Co konkretnie zmieniono

# 3. Jeśli build fail
# Przeczytaj output build-a — błędy TypeScript zwykle wskazują dokładny plik:linia
# Napraw, build ponownie
# Tylko jeśli build OK → pm2 restart

# 4. Worst case rollback
git revert HEAD                      # Lub konkretny commit
./node_modules/.bin/next build
pm2 restart zw-admin
```

**NIGDY** nie rób `pm2 restart` przed potwierdzeniem `next build` succeeded.

---

## 📝 Notes for future updates

Ten plik (CLAUDE.md) jest **żywym dokumentem**. Aktualizuj gdy:
- Nowy stack/library entry
- Nowy lesson learned z incident
- Nowa Część Engine UI deployed → status update w sekcji Master Plan
- Nowy ADR → wzmianka tutaj
- Nowa zasada workflow

**Last updated:** 7 maja 2026 — v1.1 (post-Part 8 + Font Architecture + Typography drift prevention + No staging warning + Model selection)

---

**End of CLAUDE.md**
