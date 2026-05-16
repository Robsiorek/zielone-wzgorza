# TASK: Domknięcie Part 10a + Select pre-check

STANDING CONTRACT:
1. STOP jeśli coś nie pasuje
2. Mirror existing pattern
3. Empirical pre-check > blueprint
4. pm2 restart zw-admin po deploy

Wykonuj FAZY sekwencyjnie. Nie przeskakuj.

---

## FAZA 1 — Close Part 10a (dokumentacja only)

- Update docs/ENGINE-UI-INVENTORY.md: dodać Part 10a components (Field/FieldLabel/FieldControl/FieldMessage, TextField, Textarea, useFieldId, InputySection), status Part 10a → ✅, data aktualizacji
- ZERO zmian w komponentach (.tsx), ZERO zmian w CSS
- Commit: "chore(engine-ui): close Part 10a — inventory update"
- Push

---

## FAZA 2 — Retrofit InputySection + Part 10 polish

4 konkretne fixy, nic więcej:

**#1** InputySection.tsx — SpecimenInfo hint stale:
znajdź hint zawierający "16px" przy md size → zmień na "14px" (Stage 5.2 zmienił md font)

**#2** InputySection.tsx — fixed widths naruszają LAB-CONVENTIONS #3:
SPECIMEN_WIDTH = 320 + style={{ width: 320 }} na specimenach → zmień na `flex: 1 1 280px; maxWidth: 320` (intrinsic flex)

**#3** PopoverContent size rozjazd kod↔doc:
TextField.tsx + Textarea.tsx mają PopoverContent size="small", dokumentacja mówi "contextual" → zostaw "small" w kodzie, popraw dokumentację na "small" (kod = source of truth)

**#4** Error popover content — raw span zamiast HelperText:
TextField.tsx + Textarea.tsx: `<span className="eui-body-small">{_errorPopoverMessage}</span>` → zamień na `<HelperText variant="error" showIcon={false}>{_errorPopoverMessage}</HelperText>`. UWAGA: zmienna to `{_errorPopoverMessage}` (internal threaded prop), nie `{error}`. showIcon={false} bo trigger popovera to już AlertCircle — bez tego podwójna ikona. VERIFY API HelperText przed zmianą (variant="error" + showIcon prop).

PRE-CHECK przed każdym fixem: otwórz plik, potwierdź stan. Jeśli rozbieżność → STOP, raportuj.

Atomic: #1+#2 = jeden commit, #3+#4 = drugi commit. Build → polish → pm2 restart → push.

---

## FAZA 3 — Part 10b Select: architecture pre-check (BEZ kodu)

**Nie pisz kodu. Zbadaj empirycznie i zaraportuj.**

```bash
# 1. Popover — czy wspiera trigger-width?
head -80 src/components/engine-ui/primitives/Popover.tsx
grep "trigger-width\|triggerWidth\|--radix" src/components/engine-ui/primitives/Popover.tsx

# 2. BottomSheet API
grep "export\|interface\|useIsMobile" src/components/engine-ui/overlay/BottomSheet.tsx | head -15

# 3. useIsMobile — private czy exportowana?
grep -rn "useIsMobile\|export.*useIsMobile" src/components/engine-ui/ | head -10

# 4. FieldControl — jak injektuje propsy?
cat src/components/engine-ui/input/Field.tsx | grep -A20 "FieldControl"

# 5. Istniejące listbox/role patterns
grep -rn "role=\"listbox\"\|role=\"option\"\|aria-haspopup" src/components/engine-ui/ | head -10

# 6. Chevron API
grep "interface\|direction" src/components/engine-ui/nav/Chevron.tsx | head -10
```

**RAPORT — wypełnij wszystkie 12 punktów:**

1. **Popover trigger-width:** działa czy trzeba ref measurement?
2. **useIsMobile:** private (breakpoint 767px, nie eksportowana). Rekomendacja: (a) extract do hooks/ (DRY) czy (b) local duplicate?
3. **FieldControl:** cloneElement injektuje id, aria-describedby, aria-required, aria-invalid, required, disabled. Czy root element Select (button trigger) przyjmuje te propsy? Konkretny mechanizm, nie "zadziała".
4. **Mobile strategy:** BottomSheet reuse feasible? Jeśli nie pasuje cleanly → alternatywa.
5. **Keyboard:** ArrowUp/Down + Enter + Escape + Home/End. Kto trzyma highlighted index, jak keydown.
6. **A11y contract:** trigger: `<button>` + aria-haspopup="listbox" + aria-expanded + aria-controls. List: role="listbox". Option: role="option" + aria-selected. UWAGA: listbox/option to greenfield — nie ma czego mirror'ować w engine-ui.
7. **Hidden input:** `<input type="hidden" name={name} value={selected} />` potrzebny? Sprawdź czy booking forms używają native submission czy JS-only.
8. **Controlled/uncontrolled:** value+onChange = controlled, defaultValue = uncontrolled, value wygrywa.
9. **Chevron rotation:** direction prop = static SVG. Rotacja animowana = CSS transform na wrapperze + transition. Potwierdź plan.
10. **Risks / halt conditions.**
11. **Stage split (max 3 + opcjonalny Stage 0):**
    Stage 0 (jeśli potrzebny): useIsMobile extract
    Stage 1: Select desktop + Field integration + keyboard + hidden input + a11y
    Stage 2: Select mobile (BottomSheet) — HALT jeśli nie pasuje cleanly
    Stage 3: Lab specimens + inventory update
12. **Exact file list** — nowe + modyfikowane.

**FORCED HALT po raporcie. Nie implementuj. Czekaj na akceptację.**

Komunikuj się po polsku.
