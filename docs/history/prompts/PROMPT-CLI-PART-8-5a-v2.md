# PROMPT DLA CLI — Część 8.5a: REFACTOR LEGACY

## GOAL
Przepiąć 6 legacy komponentów na Engine UI primitives (Parts 1-10a) bez zmiany API.

## DONE WHEN
- Wszystkie 6 komponentów używają primitives z Parts 1-10a
- Build green
- Visual parity zachowana (ten sam wygląd, ta sama funkcjonalność)
- Legacy CSS w globals.css nietknięty (cleanup osobno potem)

## NON-GOALS
- Redesign komponentów
- API cleanup (props zostają identyczne)
- Performance rewrite
- Accessibility rewrite (poza tym co prymitywy dają za darmo)
- Usuwanie legacy CSS z globals.css

---

## Blueprint

Przeczytaj CAŁY: `docs/BLUEPRINT-part8.5a-refactor.md` (v1.1). Tam jest pełna specyfikacja każdego Stage.

---

## Tryb pracy — AUTONOMICZNY z checkpointami

Robimy Stage po Stage. CLI pracuje autonomicznie:

```
Per Stage:
1. Przeczytaj sekcję Stage N z blueprintu
2. Edytuj plik (struktura → prymitywy, zachowaj props API + state logic)
3. Build + polish check
4. Jeśli build fail → napraw sam → build ponownie
5. Git commit + push
6. Krótki raport: co zmieniłeś, ile linii, jakie prymitywy użyte
7. Następny Stage
```

**PM2 restart:** co 2-3 Stage (nie po każdym). Ja zrobię visual verify po grupie.

**Haltuj TYLKO gdy:**
- Build fail którego nie umiesz naprawić
- Zmiana wymaga modyfikacji props API (łamie zasadę NO PROP API CHANGES)
- Nieznana zależność zewnętrzna
- Architektoniczny dylemat niewymieniony w blueprintcie

Drobne problemy (import path, typ cast, missing export) — rozwiązuj sam.

---

## Kolejność Stages (ŚCIŚLE z blueprintu — zależności)

```
Stage 0: FavoriteButton rename → prerequisite dla 5A
Stage 1: ResourceCard (176 linii, Tailwind → prymitywy) → independent
Stage 2: ImageCarousel (131 linii) → prerequisite dla 5A
Stage 3: Stepper light (199 linii) → prerequisite dla 4
Stage 4: GuestPicker (287 linii) → prerequisite dla 6
Stage 5A: ResultCard structural (247 linii, HTML → prymitywy)
Stage 5B: ResultCard interactive (state, popover, keyboard)
Stage 6: SearchBar (337 linii, segmenty, 2 warianty) → OSTATNI
```

---

## Zasady refactoru

1. **NO PROP API CHANGES** — konsumenci nie widzą różnicy
2. **NO STATE LIFECYCLE CHANGES** — useState/useEffect/useCallback logika zostaje
3. **Structure replacement only** — hand-rolled HTML/CSS → prymitywy
4. **1 plik = 1 Stage = 1 commit** — atomic rollback

## Quick reference — co zamieniamy na co

```
<div className="eui-card">       → <CardSurface>
<div className="eui-card-image"> → <MediaFrame>
className="eui-card-badge"       → <MediaOverlay> + <MediaBadge>
className="eui-card-favorite"    → <FavoriteOverlay>
<div className="eui-carousel-*"> → <MediaFrame> + <GalleryNavButton> + <PaginationDot>
<div style="display:flex;gap:*"> → <Stack> / <Inline>
raw <h2>/<h3>/<p>               → <Text variant="...">
raw price formatting             → <PriceText>
```

---

## Zabezpieczenia (sprawdź raz na start, nie per Stage)

```bash
# Font architecture — verify PRZED Stage 0:
head -1 src/styles/globals.css  # komentarz, nie @import
grep "ignoreFontOverride" src/components/engine-ui-lab/EngineUiLab.tsx
# NIE ruszaj tych plików w żadnym Stage.
# NIE usuwaj legacy CSS klas z globals.css.
```

---

## Commit message convention

```
refactor(engine-ui): [Stage N] <component> → Engine UI primitives

- <co konkretnie zamieniono>
- Visual parity: preserved
- API: unchanged
```

---

## START

```
1. cat docs/BLUEPRINT-part8.5a-refactor.md
2. Verify font architecture (jednorazowo)
3. Stage 0 → autonomicznie → commit → raport
4. Stage 1 → autonomicznie → commit → raport
5. ...kontynuuj aż Stage 6
6. Po Stage 6: pełny raport co się zmieniło + PM2 restart
```

Po Stage 2 (ImageCarousel) i po Stage 6 (SearchBar) — zatrzymaj się na moje visual verify.

Komunikuj się po polsku.
