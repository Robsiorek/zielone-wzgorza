# Zielone Wzgórza — Panel Administracyjny

System rezerwacyjny dla ośrodka wypoczynkowego **Zielone Wzgórza** (zielonewzgorza.eu).
Pełnoekranowy panel administracyjny klasy enterprise — własny, bez zależności od SaaS.

## Stack

- **Next.js 14** + TypeScript (strict) + Tailwind CSS
- **Prisma 5.22** + PostgreSQL 16
- **JWT auth** (bcrypt, HttpOnly Secure cookie, tabela sessions)
- **PM2** (process manager)
- **Ubuntu 24.04** (VPS cyber_Folks)

## Struktura

```
src/
  app/
    admin/          — strony panelu admin (Next.js App Router)
    api/            — API routes (REST, JSON)
    api/public/     — publiczne endpointy (bez auth, z rate limiterem)
  components/       — komponenty React per moduł
  lib/              — serwisy, helpery, konfiguracja
    storage/        — MediaStorageProvider (local / R2)
  middleware.ts     — routing guard (auth, basePath)

prisma/
  schema.prisma     — jedyne źródło prawdy DB
  migrations/       — Prisma migrate (nigdy db push)

docs/
  master-plan-v2_3.md   — Master Plan (pełna specyfikacja systemu)
  DESIGN_SYSTEM.md      — Design System (jedyne źródło prawdy UI)
  TIMELINE_SPEC.md      — specyfikacja kalendarza/timeline
  TIMELINE_TODO.md      — status TODO timeline
  UNIFIED_PANEL_SPEC.md — specyfikacja UnifiedPanel
  BOOKING_EDIT_DESIGN.md — projekt edycji rezerwacji

scripts/
  test-critical.sh      — 18 testów regresyjnych (core booking)
  test-b1-media.sh      — 6 testów media storage
  test-b2-content.sh    — 7 testów resource content
  check-polish.sh       — weryfikacja polskich znaków (vs unicode escapes)
  rebuild-timeline.ts   — CLI rebuild timeline entries
  add-overlap-constraint.sql — exclusion constraint (standalone)
  e1-cleanup-quotes.sql — czyszczenie expired quotes (maintenance)
  archive/              — wykonane jednorazowe migracje SQL
```

## Uruchomienie (dev)

```bash
cp .env.example .env
# Uzupełnij DATABASE_URL, JWT_SECRET, SMTP_*

npm install
npx prisma@5.22.0 migrate deploy
npx prisma@5.22.0 generate
npm run dev
```

## Deploy (produkcja)

```bash
# Na serwerze (VPS):
cd /var/www/admin
tar xzf paczka.tar.gz
npx prisma@5.22.0 migrate deploy    # jeśli migracja
npx prisma@5.22.0 generate          # jeśli schema zmieniony
./node_modules/.bin/next build
pm2 restart zw-admin
rm paczka.tar.gz
```

**Krytyczne zasady deploy:**
- NIGDY bare `npx prisma` (ściągnie v7, niekompatybilne) → ZAWSZE `npx prisma@5.22.0`
- NIGDY bare `npx next build` → ZAWSZE `./node_modules/.bin/next build`
- NIGDY `package.json` w tar.gz (usuwa zależności produkcyjne)

## Testy

```bash
bash scripts/test-critical.sh       # 18/18 — core booking, lifecycle, payments, integrity
bash scripts/test-b1-media.sh       # 6/6  — media upload, MIME, cover, reorder
bash scripts/test-b2-content.sh     # 7/7  — resource content, beds, catalog
```

## Dokumentacja

Pełna specyfikacja systemu: `docs/master-plan-v2_3.md` (6300+ linii).
Design System UI: `docs/DESIGN_SYSTEM.md` (780 linii).

## Licencja

Projekt prywatny. Kod źródłowy jest publiczny na GitHub wyłącznie
jako backup — nie jest przeznaczony do użycia przez osoby trzecie.
