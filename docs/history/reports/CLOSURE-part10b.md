# Część 10b — Select: Closure Report

**Status:** ✅ CLOSED — visual ACCEPTED by Product Owner (2026-05-16)
**Branch:** master @ `71c51c6` (wszystko wypchnięte na origin, working tree clean)
**Zakres:** Select primitive (Stage 0-3) + B/A visual rework + 6 rund PO visual feedback
**Aggregate:** 11 commitów, 10 plików, +1087 / -36

Powiązane: `docs/REPORT-part10b-cli-execution.md` (szczegółowy raport wykonania Stage 0-3 + pre-check). Ten dokument = closure (akceptacja + follow-upy).

---

## 1. Commity (chronologicznie)

| # | Commit | Opis | Typ |
|---|---|---|---|
| 1 | `da85fa8` | Stage 0 — `useIsMobile` extract do `hooks/` | refactor (prep) |
| 2 | `9588224` | Stage 1 — Select desktop + Field integration + keyboard + a11y | feat |
| 3 | `b86628c` | Stage 2 — Select mobile via BottomSheet (+ double-toggle fix) | feat |
| 4 | `c894719` | Stage 3 — Lab specimens + Part 10b inventory close | feat |
| 5 | `ff16058` | Sidebar sticky regresja fix (overflow-x clip ≠ hidden) | fix |
| 6 | `2a3d6fc` | Select options → PopoverItem visual pattern (ikona+title+opis) | feat |
| 7 | `753b489` | PO visual feedback batch — 4 fixy (dropdown clip, ikony/bez, Lab spójność, input bg Airbnb) | fix |
| 8 | `f6e95ae` | SPECIMEN_STYLE: width nie flex (flex-column parent gotcha) | fix |
| 9 | `5cc08f6` | "z ikonami vs bez ikon" single-column (spójność) | fix |
| 10 | `a5123fe` | Input focus B-neutral premium (grey-500 + miękki ring, NIE grey-900) | fix |
| 11 | `71c51c6` | Hover border TextField/Textarea grey-500 (B-neutral parity) | fix |

---

## 2. Co zostało zaakceptowane

**Funkcjonalność (Stage 0-3):**
- ✅ Select single-select; tri-mode API (compound/standalone/bare) — mirror TextField
- ✅ Desktop: Popover dropdown; Mobile: BottomSheet (≤767px via `useIsMobile`)
- ✅ Keyboard: ArrowUp/Down/Home/End/Enter/Space/Escape/Tab; aria-activedescendant (focus na listbox, opcje nie focusable) — per architekt D2
- ✅ A11y greenfield: `<button aria-haspopup=listbox>` + `<ul role=listbox>` + `<li role=option aria-selected>`
- ✅ Field integration: FieldControl cloneElement (id/aria/disabled/required); error via `[aria-invalid]`
- ✅ Controlled/uncontrolled (value > defaultValue)
- ✅ Architekt decyzje D1-D6 zaimplementowane

**Visual (po 6 rundach PO feedback):**
- ✅ Mobile Select — "wyjeżdża ładnie karta, animacyjnie OK"
- ✅ Dropdown clipping naprawiony (radius lg 16px + listbox padding 8px)
- ✅ Opcje w stylu PopoverItem (ikona w kopercie + title + opis); wariant z ikonami i bez (graceful degradation)
- ✅ Input background białe (Airbnb pattern; szary = tylko disabled)
- ✅ Focus B-neutral: border grey-500 `#717171` + miękki ring `color-mix(grey-900 8%)`; error ring `color-mix(danger 12%)` — "miękki, OK" (PO accept 2026-05-16)
- ✅ Hover border grey-500 (TextField/Textarea/Select spójnie)
- ✅ Lab spójność: SPECIMEN_STYLE `width:100%; maxWidth:320`; single-column showcases; sidebar sticky przywrócony

**Bug fixes ubocznie (poza scope, naprawione przy okazji):**
- Sidebar Lab regresja (overflow-x:hidden → clip — sticky gotcha; `c388cb2` źródło)
- SPECIMEN_STYLE flex-column gotcha (`flex:1 1 Xpx` zakłada parent flex-row)

---

## 3. Known follow-ups (NIE blokujące — backlog)

| # | Follow-up | Skąd | Priorytet |
|---|---|---|---|
| F1 | **Screen reader test (NVDA/VoiceOver)** — a11y greenfield, nie testowane z prawdziwym AT | REPORT-part10b §8 P2 | Średni — przed użyciem Select w produkcyjnym booking flow |
| F2 | Mobile BottomSheet focus-trap: Tab inside = no-op (Radix Dialog + listbox tabindex=-1). Udokumentowane halt-safety. Defer 10c jeśli zgłoszone | architekt D6 | Niski — touch UX nie używa Tab |
| F3 | RAF-based listbox focus timing — niezweryfikowane pod race conditions | REPORT-part10b §7 P3 | Niski |
| F4 | Select generics (`<V extends string>`) — MVP użył `string` (forwardRef gubi generic) | REPORT-part10b §7 P1 | Niski — enhancement |
| F5 | Long-list virtualizacja (>50 opcji) — MVP static, bez wirtualizacji | REPORT-part10b §7 P7 | Niski — poza blueprint pre-lock |
| F6 | Stale CSS comment "contextual" w globals.css STAGE 4 (kod = "small") | FAZA 2 #3 znalezisko | Trywialny — osobny tiny-fix |
| F7 | readonly bg pozostaje grey-50 (subtelny "not editable", NIE flagowane przez PO) | Fix 5 decyzja | Niski — świadoma decyzja, do potwierdzenia |
| F8 | Multi-variant Lab showcases (`<Inline wrap>`): szerokość kolumn content-driven. Single-column przebudowane (5cc08f6); pozostałe multi-variant (architektura 3 trybów, error spotlight) działają ale nie idealnie deterministyczne | f6e95ae caveat | Niski — kosmetyka Lab |
| F9 | Variant C ("fuller/HD" — 2px focus border #222 + 14% ring) odrzucony na rzecz B-neutral. Gdyby PO chciał mocniejszy charakter w przyszłości — gotowa specyfikacja w historii | Visual direction proposal | Backlog — tylko jeśli PO zmieni zdanie |

---

## 4. Co NIE jest blokujące dla zamknięcia 10b

- **F1 (AT test):** Select renderuje poprawny semantyczny markup (zweryfikowany strukturalnie + build). Brak testu z czytnikiem ekranu nie blokuje akceptacji visual/funkcjonalnej; jest warunkiem przed pierwszym produkcyjnym użyciem (nie Lab).
- **F2 (mobile Tab):** świadoma, udokumentowana decyzja architekta (D6). Mobile UX = tap/swipe/Escape, nie Tab.
- **F6 (stale CSS comment):** komentarz, nie kod; zero wpływu na działanie/wygląd.
- **F7 (readonly grey-50):** semantycznie poprawne rozróżnienie; PO nie zgłosił.
- **F8/F9:** kosmetyka Lab / odrzucony wariant — poza zakresem 10b.

Żaden follow-up nie dotyczy poprawności funkcjonalnej, a11y markup, ani zaakceptowanego visualu.

---

## 5. Rekomendowany następny krok

**Opcja rekomendowana — F1 przed produkcyjnym użyciem:**
Zanim Select trafi do realnego booking flow (nie Lab), wykonać **manualny test z czytnikiem ekranu** (NVDA/Windows + VoiceOver/iOS): announce roli combobox/listbox, aria-activedescendant nawigacja, selected/disabled state, mobile BottomSheet. To jedyny follow-up z realnym ryzykiem produkcyjnym (greenfield a11y — brak wzorca do mirror w engine-ui). ~30-45 min.

**Następna część systemu:** Część 10b zamknięta → Engine UI roadmap: Parts 11-14 TBD (per ENGINE-UI-INVENTORY.md). Sugerowane wejście w kolejny Part dopiero po F1, żeby Select miał potwierdzoną a11y zanim stanie się zależnością.

**Higiena repo (opcjonalnie, trywialne):** F6 (stale CSS comment) + przegląd untracked dokumentów roboczych (`docs/PROMPT-CLI-*.md`, `HANDOFF-new-chat.md`, raporty) — zdecydować czy commitować do `docs/` czy `.gitignore`.

---

## 6. Podsumowanie

Część 10b dostarczona w pełnym zakresie blueprintu + zaakceptowana wizualnie przez PO po iteracyjnym dopracowaniu (6 rund feedbacku). Architektura zgodna z pre-checkiem i decyzjami architekta. Atomic commits, build/polish/pm2 zielone na każdym kroku, wszystko na origin/master. Jedyny follow-up z priorytetem (F1 — AT test) jest warunkiem produkcyjnym, nie blokerem zamknięcia. **Część 10b: CLOSED.**
