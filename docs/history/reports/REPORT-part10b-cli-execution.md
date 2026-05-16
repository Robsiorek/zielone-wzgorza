# Raport wykonania — Part 10a closure + Retrofit + Part 10b Select (CLI execution)

**Status:** ✅ Kompletne — FAZA 1 (Part 10a close) + FAZA 2 (retrofit) + FAZA 3 (pre-check) + Część 10b Select (Stage 0-3)
**Data:** 2026-05-14 → 2026-05-15
**Wykonawca:** Claude Opus 4.7 (1M context), CLI
**Branch:** master (7 commitów wypchniętych na origin)
**Build:** ✅ green na każdym stage | **Polish-check:** ✅ no \uXXXX | **PM2:** ✅ restart po każdym deploy

Dokument do oceny przez Sonnet 4.6 Extended + ChatGPT. Pytania reviewowe w sekcji 7.

> Powiązany dokument: `docs/REPORT-part8.5a-cli-execution.md` (poprzednia faza — refactor legacy).
> Źródłowy prompt: `docs/PROMPT-CLI-10a-close-10b-precheck.md`.

---

## 1. Zakres wykonany

Trzy fazy + 4-stage'owa implementacja Select wg architektury zatwierdzonej przez architekta (Sonnet 4.6) na podstawie 12-punktowego pre-checku.

| Faza/Stage | Commit | Plik(i) | Status |
|---|---|---|---|
| FAZA 1 | `399ddef` | `docs/ENGINE-UI-INVENTORY.md` | ✅ Part 10a closed |
| FAZA 2 #1+#2 | `e81b921` | `InputySection.tsx` | ✅ stale hint + fixed widths |
| FAZA 2 #3 | — | (no-op) | ✅ skipped — brak doc divergence |
| FAZA 2 #4 | `78d52c8` | `TextField.tsx`, `Textarea.tsx` | ✅ span → HelperText |
| FAZA 3 | — | (research only) | ✅ raport 12-pkt → architekt GO |
| 10b Stage 0 | `da85fa8` | `hooks/useIsMobile.ts`, `BottomSheet.tsx` | ✅ extract |
| 10b Stage 1 | `9588224` | `Select.tsx` (new), barrels, `globals.css` | ✅ desktop |
| 10b Stage 2 | `b86628c` | `Select.tsx`, `globals.css` | ✅ mobile |
| 10b Stage 3 | `c894719` | `InputySection.tsx`, `ENGINE-UI-INVENTORY.md` | ✅ Lab + inventory |

**Aggregate diff (399ddef^..HEAD):** 11 plików, +935 / -33. Główny artefakt: `Select.tsx` (473 linie), `useIsMobile.ts` (46 linii).

---

## 2. FAZA 1 — Part 10a closure (dokumentacja)

Czysty inventory update, ZERO zmian w komponentach/CSS:
- `input/` directory dodane do tabeli (6 komponentów po 10a)
- Nowa kategoria "Input" w Components by category
- `useFieldId` dopisany do Hooks (lokalizacja: `input/` nie `hooks/`)
- Lab section #16 "Inputy"
- Roadmap: Part 10a ✅, **Part 8.5a ✅** (dopisane retroaktywnie — poprzednia faza nie zaktualizowała roadmap)

**Decyzja CLI:** przy okazji dopisałem Part 8.5a do roadmap (było pominięte). Inventory header zaktualizowany do "post Part 10a", total ~113 component files.

---

## 3. FAZA 2 — Retrofit 4 fixy

### #1+#2 (commit `e81b921`) — InputySection

- **#1:** `SpecimenInfo` hint dla TextField sizes: `"16px (anti-iOS-zoom)"` → `"14px (post Stage 5.2 downsize)"`. Hint był stale — Stage 5.2 zmienił md font-size na 14px, dokumentacja w Lab nie nadążyła.
- **#2:** `SPECIMEN_WIDTH = 320` + 10× `style={{ width: 320 }}` → `SPECIMEN_STYLE = { flex: "1 1 280px", maxWidth: 320 }`. Per LAB-CONVENTIONS-responsive #3 (intrinsic flex zamiast fixed width). Specimens w `<Inline wrap>` shrinkują na mobile (basis 280px), nie urosną poza 320px desktop.

### #3 — SKIPPED (no-op)

Prompt zakładał rozjazd: kod `PopoverContent size="small"` vs dokumentacja `"contextual"`. **Pre-check (per STANDING CONTRACT #1) wykazał brak rozbieżności:**
- Przeszukane: `docs/`, JSDoc/komentarze w `src/components/engine-ui/input/`
- Jedyne wystąpienia `"contextual"`: `Popover.tsx` (jako valid `PopoverSize` variant) + sam prompt
- **Żaden dokument nie mówił "contextual"** w kontekście error popover → nic do skorygowania

STOP + raport do usera → decyzja: opcja (a) skip #3, zrób tylko #4. Commit message #4 zawiera notatkę "#3 skipped — no doc divergence found".

> **⚠️ Znalezisko poboczne (NIE naprawione, do decyzji):** komentarz CSS w `globals.css` sekcja "PART 10 STAGE 4" zawiera `(size="contextual")` — to jest stale (kod używa `size="small"` po Stage 5.x retrofit). To CSS comment, nie JSDoc/doc. Świadomie NIE tknięte (poza scope FAZA 2 #3 który był o docs; commitowanie zmiany "przy okazji" byłoby sneaky). **Rekomendacja:** osobny tiny-fix w przyszłej sesji LUB świadoma akceptacja.

### #4 (commit `78d52c8`) — error popover content

`TextField.tsx` + `Textarea.tsx`:
```diff
- <span className="eui-body-small">{_errorPopoverMessage}</span>
+ <HelperText variant="error" showIcon={false}>{_errorPopoverMessage}</HelperText>
```

**Pre-check przed zmianą (per STANDING CONTRACT):**
- Potwierdzono zmienną `_errorPopoverMessage` (internal threaded prop, NIE `error`)
- Zweryfikowano HelperText API: `variant: "error"`, `showIcon?: boolean`, default `as="p"` → renderuje `<p class="eui-helper-text eui-helper-text-error eui-body-small">`

**Uzasadnienie `showIcon={false}`:** trigger popovera to już `<AlertCircle>` — bez tego byłaby podwójna ikona. **Efekt uboczny (intended):** `variant="error"` dodaje semantyczny `.eui-helper-text-error` (danger color) — poprzedni `.eui-body-small` był neutralny. To upgrade spójności (error message reuses Part 6 primitive zamiast raw span).

---

## 4. FAZA 3 — Pre-check (12-punktowy raport)

Empiryczne badanie BEZ kodu. Pełny 12-punktowy raport dostarczony architektowi (jest w historii konwersacji; nie zapisany jako osobny plik). Kluczowe ustalenia:

| # | Ustalenie | Wpływ na implementację |
|---|---|---|
| 1 | Popover trigger-width: `--radix-popover-trigger-width` działa out-of-box (Radix CSS var, NIE ref measurement) | CSS-only width matching |
| 2 | `useIsMobile` private w BottomSheet, breakpoint 767px | Stage 0 extract |
| 3 | FieldControl cloneElement injektuje 6 propsów (id/aria-describedby/aria-required/aria-invalid/disabled/required) | `required` na buttonie no-op → destructure jako `_required` |
| 4 | BottomSheet reuse feasible (Radix Dialog, height="auto") | Stage 2 conditional render |
| 5 | aria-activedescendant vs roving tabindex | architekt D2 → aria-activedescendant |
| 6 | listbox/option = greenfield (0 matches w engine-ui) | brak wzorca do mirror |
| 7 | Booking forms JS-only (brak native FormData) | architekt D3 → skip hidden input |
| 9 | Chevron static SVG (brak rotacji) | CSS transform na wrapperze |
| 10 | Risk: Radix Dialog focus-trap vs listbox keyboard | architekt D6 → halt-safety + defer 10c |

Architekt zatwierdził: D1=YES (Stage 0), D2=aria-activedescendant, D3=skip hidden input, D4=mobile w Stage 2, D5=NO typeahead, D6=defer 10c jeśli kolizja.

---

## 5. Część 10b Select — implementacja

### Stage 0 (`da85fa8`) — useIsMobile extract

- NEW `hooks/useIsMobile.ts` (46 linii) — identyczna logika jak inline w BottomSheet (`matchMedia("(max-width: 767px)")` + state + change listener + Safari <14 fallback `addListener`)
- `hooks/index.ts` — re-export
- `BottomSheet.tsx` — usunięta lokalna duplikacja, import z `../hooks/useIsMobile`
- Build verified — BottomSheet zachowanie niezmienione (API identyczne)

### Stage 1 (`9588224`) — Select desktop

**Architektura — tri-mode (mirror TextField):**
- **compound:** wewnątrz `<Field>` → `FieldControl` cloneElement injektuje aria/id/disabled na inner button
- **standalone:** `label/helperText/error` props → wrap w internal `Field+FieldLabel+FieldControl+FieldMessage`
- **bare:** brak chrome → sam `SelectInner`

**A11y (greenfield — pierwszy listbox/option w engine-ui):**
- Trigger: `<button aria-haspopup="listbox" aria-expanded aria-controls>`
- Listbox: `<ul role="listbox" tabindex=-1 aria-activedescendant>`
- Option: `<li role="option" aria-selected>` — **NIE focusable** (per architekt D2)
- Focus na listbox jako całość; wirtualny kursor przez `aria-activedescendant`

**Keyboard:**
- Trigger: ArrowDown/Up/Enter/Space/Home/End → open + initial highlight (selectedIdx lub pierwszy enabled)
- Listbox: Arrow/Home/End → move highlight (pomija `disabled` opcje); Enter/Space → commit + close; Escape → close bez commit; Tab → close (natural focus move)
- Helpery `findNextEnabled` (wrap) + `findFirstEnabled` (no-wrap) — disabled options pomijane

**Controlled/uncontrolled:** mirror TextField (`isControlled = valueProp !== undefined`; value > defaultValue; nie mieszać)

**FieldControl integration:** `required` injektowany ale no-op na `<button>` → destructured jako `_required` + dropped; `aria-required` carries semantic. `aria-describedby` auto-wired do FieldMessage przez `ctx.hasError/hasDescription`.

**Visual:** trigger frame mirrors `.eui-textfield-input` (sizes sm/md/lg, states, error via `[aria-invalid]`). Listbox width = `var(--radix-popover-trigger-width)` (Radix CSS var). Chevron rotation: CSS transform na `.eui-select-chevron[data-open]` — Chevron primitive niezmieniony (direction static).

**Skip per architekt:** D3 brak hidden input, D5 brak typeahead.

### Stage 2 (`b86628c`) — Select mobile + bug fix

**Mobile branching:** `useIsMobile()` → BottomSheet (mobile ≤767px) / Popover (desktop). BottomSheet props: `height="auto"`, `showDragHandle`, `swipeToDismiss`, `closeOnEscape`, `closeOnOutsideClick`, `labelledBy={triggerId}`.

**🐛 Bug znaleziony i naprawiony w trakcie Stage 2:** initial mobile draft dodał `onClick={() => setOpen(prev => !prev)}` na trigger button uniwersalnie. To kolidowało z Radix `PopoverTrigger asChild` na desktop — oba handlery odpalały przez Slot `composeEventHandlers`, dwa functional updates `prev => !prev` **wzajemnie się znosiły** (toggle-toggle = no-op, popover się nie otwierał).

**Fix:** wyekstrahowane `commonTriggerProps` + `triggerInner`. `onClick` dodany TYLKO na mobile button (brak Radix wrappera). Desktop button bez `onClick` — Radix toggle przez kontekst.

**Halt-safety (per architekt D6) — UDOKUMENTOWANE w kodzie (nie naprawione, świadoma akceptacja):**
> Radix Dialog (BottomSheet) instaluje focus-trap. Listbox `tabindex=-1` + non-focusable `<li>` → **0 tabbable elements w dialogu** → Tab wewnątrz otwartego sheeta = no-op (focus zostaje na dialog body). Touch users dismissują przez tap-outside / Escape / swipe — adekwatne mobile UX. **Jeśli problematyczne w produkcji → defer mobile do 10c.**

**Mobile CSS:** `.eui-select-bottomsheet .eui-select-option` min-height=44px (WCAG 2.5.5 Target Size) + 16px font (iOS-friendly tap).

### Stage 3 (`c894719`) — Lab + inventory

4 nowe showcase'y w `InputySection` (po 6 istniejących TextField/Textarea):
7. Architektura 3 trybów (compound/standalone/bare)
8. Rozmiary (sm/md/lg)
9. Stany (default/value/disabled/error/disabled-option)
10. Długa lista 16 krajów (keyboard + scroll + aria-activedescendant test)

Demo data: `CATEGORIES` (4), `CATEGORIES_WITH_DISABLED` (test nav skip), `COUNTRIES` (16, scroll test). Controlled state przez `useState`.

Inventory: header → "post Part 10b", input/ count 6→7, Select wpis, useIsMobile w hooks, Lab #16 desc, Roadmap Part 10b ✅.

---

## 6. Trade-offy i świadome decyzje (do akceptacji)

| # | Decyzja | Uzasadnienie | Ryzyko |
|---|---|---|---|
| T1 | Generics pominięte — `value?: string` zamiast `<V extends string>` | forwardRef gubi generic; MVP single-select string wystarcza | Mniej type-safe przy literal union options; future enhancement |
| T2 | `_required` destructured + dropped na buttonie | `required` attr no-op semantic na `<button>`; aria-required carries semantic (sekcja 3 pre-check) | ESLint `_` prefix exempt; intended |
| T3 | Tab wewnątrz mobile BottomSheet = no-op | Radix focus-trap + brak tabbable; touch UX nie używa Tab | Halt-safety udokumentowane; defer 10c jeśli zgłoszone |
| T4 | `onClick` tylko mobile button | Desktop double-toggle bug fix | Rozwiązane; desktop polega na Radix toggle |
| T5 | CSS comment "contextual" w STAGE 4 NIE naprawiony | Poza scope FAZA 2 #3 (docs, nie CSS comment); unikam sneaky commit | Stale comment zostaje — rekomendacja osobny fix |
| T6 | Stage 8.5a dopisane do Roadmap w FAZA 1 | Poprzednia faza pominęła; inventory ma być source of truth | Brak — czysta korekta |

---

## 7. Otwarte pytania do reviewerów

**P1 (Select generics):** Czy `Select` powinien być generyczny (`<V extends string>` z narrow literal union dla `value`/`onChange`/`options`)? forwardRef gubi generic — wymaga cast pattern (`forwardRef as <V>(...) => ...`). Wartość type-safety vs złożoność. MVP użył `string`.

**P2 (Tab w mobile BottomSheet):** Halt-safety: Tab wewnątrz otwartego sheeta = no-op (focus-trap + brak tabbable). Czy to akceptowalne long-term, czy 10c powinien dodać explicit focusable listbox (roving tabindex na mobile only)? Architekt D6 powiedział "defer jeśli problematyczne" — czy testować z prawdziwym screen readerem na mobile przed zamknięciem?

**P3 (aria-activedescendant + Radix focus):** Na desktop Popover, `useEffect` focusuje listbox via `requestAnimationFrame` po open. Radix PopoverContent NIE auto-focusuje (brak tabbable child). Czy RAF timing jest niezawodny, czy potrzeba `onOpenAutoFocus` Radix handler dla deterministycznego focus? Obecnie działa empirycznie ale nie testowane pod race conditions.

**P4 (CSS comment stale "contextual"):** `globals.css` STAGE 4 sekcja ma komentarz `(size="contextual")` — kod używa `size="small"`. Naprawić osobnym fixem, czy zaakceptować jako nieistotny CSS comment?

**P5 (option click + focus):** Klik `<li role="option">` (nie focusable) commituje value. Po commit Radix zamyka popover i przywraca focus na trigger (desktop) — sprawdzone empirycznie. Na mobile BottomSheet: po commit `setOpen(false)` → Radix Dialog zamyka, focus restoration? NIE zweryfikowane explicite — czy 10c potrzebuje focus return test?

**P6 (Select w Field standalone — invalid wiring):** standalone mode: `<Select error="...">` → wrap w `<Field invalid={error !== undefined}>`. FieldControl injektuje `aria-invalid=true`. CSS `.eui-select-trigger[aria-invalid="true"]` daje danger border. Zweryfikowane przez build, NIE przez wizualny test — wymaga visual verify.

**P7 (long list performance):** 16 opcji renderuje się bez wirtualizacji. Dla MVP OK. Czy zdefiniować limit (np. >50 opcji → ostrzeżenie/wirtualizacja) jako 10c scope, czy poza zakresem (Select MVP = static small lists per blueprint pre-lock)?

**P8 (mobile breakpoint coupling):** `useIsMobile` hardcoded 767px. Select i BottomSheet dzielą ten breakpoint. Jeśli design system zmieni breakpoint — single source `useIsMobile` to dobre. Ale czy 767px powinien być tokenem CSS (`--eui-breakpoint-mobile`) zamiast magic number w JS hooku?

---

## 8. Verification status

| Aspekt | Status |
|---|---|
| `npm run build` (każdy stage) | ✅ green |
| `check-polish.sh` (każdy stage) | ✅ no \uXXXX |
| `pm2 restart zw-admin` | ✅ po każdym deploy |
| `git push origin master` | ✅ wszystkie 7 commitów |
| TypeScript types | ✅ (build = tsc gate) |
| **Visual verify desktop** | ⏳ pending |
| **Visual verify mobile (DevTools ≤767px)** | ⏳ pending |
| **Screen reader test (NVDA/VoiceOver)** | ⏳ pending — greenfield a11y, NIE testowane z AT |
| **Keyboard nav manual** | ⏳ pending |

**⚠️ Krytyczne dla reviewu:** a11y pattern (aria-activedescendant, role=listbox/option) jest **greenfield** — pierwszy w engine-ui, brak wzorca do porównania. Zweryfikowany strukturalnie (build + kod review) ale **NIE testowany z prawdziwym screen readerem**. Rekomendacja: NVDA (Windows) + VoiceOver (iOS) test przed produkcyjnym użyciem Select.

---

## 9. Pliki — pełna lista

**Nowe:**
- `src/components/engine-ui/hooks/useIsMobile.ts` (46 linii)
- `src/components/engine-ui/input/Select.tsx` (473 linie)

**Modyfikowane:**
- `src/components/engine-ui/hooks/index.ts` (+2 — re-export)
- `src/components/engine-ui/overlay/BottomSheet.tsx` (−14/+1 — dedup useIsMobile)
- `src/components/engine-ui/input/index.ts` (+3 — Select barrel)
- `src/components/engine-ui/index.ts` (+4 — top-level barrel)
- `src/components/engine-ui/input/TextField.tsx` (+1/−1 — #4 HelperText)
- `src/components/engine-ui/input/Textarea.tsx` (+1/−1 — #4 HelperText)
- `src/components/engine-ui-lab/sections/InputySection.tsx` (+211 — #1+#2 retrofit + Stage 3 Select specimens)
- `src/styles/globals.css` (+181 — Select desktop + mobile CSS)
- `docs/ENGINE-UI-INVENTORY.md` (+27/−~10 — FAZA 1 + Stage 3 updates)

---

## 10. Konkluzja

**Co działa (zweryfikowane build + kod):**
- ✅ FAZA 1-2-3 + Część 10b Stage 0-3 kompletne, atomic commits, wszystko na origin
- ✅ STANDING CONTRACT respektowany: STOP przy #3 rozbieżności (raport zamiast ślepego wykonania), empirical pre-check > blueprint, pm2 restart po deploy, mirror existing pattern (Select API = TextField tri-mode)
- ✅ Architekt decisions D1-D6 zaimplementowane zgodnie
- ✅ Bug (double-toggle) złapany i naprawiony w trakcie z wyjaśnieniem w commit message

**Co wymaga uwagi reviewerów:**
- ⚠️ Greenfield a11y NIE testowane z AT (P2, sekcja 8)
- ⚠️ RAF-based focus timing niezweryfikowany pod race (P3)
- ⚠️ Halt-safety mobile Tab no-op — decyzja czy akceptowalne (P2)
- ⚠️ Generics pominięte — type-safety trade-off (P1)
- ⚠️ Stale CSS comment "contextual" (P4)

**Co odłożone do 10c (jeśli potrzebne):**
- Mobile focus-trap rozwiązanie (jeśli P2 problematyczne)
- Wirtualizacja długich list (P7)
- Breakpoint jako CSS token (P8)
- Select generics (P1)

---

## Załączniki

- Commity: `git log 399ddef^..HEAD --oneline` (7 commitów)
- Diff aggregate: `git diff --stat 399ddef^..HEAD`
- Pre-check 12-pkt: w historii konwersacji (FAZA 3 raport)
- Decyzje architekta: D1-D6 (sekcja 4)
- Źródłowy prompt: `docs/PROMPT-CLI-10a-close-10b-precheck.md`
- Poprzednia faza: `docs/REPORT-part8.5a-cli-execution.md`
