# Blueprint Part 10 — Inputs Foundation (v1.2 FINAL)

> Status: **FINAL** — ready for Stage 1 implementation.
> v1.2 incorporates 3 must-fix corrections z ChatGPT review of v1.1.
> Workflow #29: inventory ✅, pre-check ✅.

---

## 1. Approval chain

- Pre-blueprint sync ChatGPT (v1.0): ✅ 6 questions answered + 6 blind spots
- Robert product decisions: ✅ 6 main + visual styling + search clear constraint
- v1.0 → v1.1: 7 must-fix corrections (Robert review)
- v1.1 → v1.2: 3 must-fix corrections + 1 doprecyzowanie (ChatGPT review)
- Workflow #29 compliance: ✅

**Locked architectural decisions (12):**

1. Field architecture: HYBRID (compound + self-contained wrapper)
2. Error UX: Baseline HelperText + enhancement Popover (NIE "tooltip")
3. Custom Select: Part 10b only — 10a standalone bez Select
4. TextField: thin HTML wrapper, 6 types
5. Stages: 6 stages w Part 10a (split z 5)
6. ChatGPT 6 blind spots: explicit handling each
7. Search clear: `onClear` callback (NIE synthetic ChangeEvent)
8. Error replaces helper (NIE renderuj oba) — Robert v1.0 review
9. **NEW v1.2:** Token CSS format: empirically verified before write (NIE hardcoded "must wrap")
10. **NEW v1.2:** FieldControl is **transparent** — NO `className` prop (consistency with cloneElement)
11. **NEW v1.2:** aria-describedby points ONLY to IDs that render in DOM
12. **NEW v1.2:** disabled/required merge rule: **true wins** (NOT "user props always win")

---

## 2. Scope Part 10a

**Built (greenfield):**
- `Field` + `FieldLabel` + `FieldControl` + `FieldMessage` (compound)
- `TextField` (self-contained, 6 HTML types, 3 sizes, full states)
- `Textarea` (self-contained, fixed height)
- Error popover enhancement (Stage 4)
- `useFieldId` hook (stable ID generation)
- `useFieldContext` hook (compound communication, internal)

**Lab integration:** new section `InputsSection`.

**Reused:**
- `Text` (Part 6) → labels via variant="label"
- `HelperText` (Part 6) → error/helper messages
- `Popover` (primitives/) → error popover enhancement
- `IconButton` (Part 2) → password show/hide, search clear
- `Pressable` (interaction/) → focus base
- Color tokens (TBD format — empirical verify per token Stage 2)
- Spacing/radius/typography tokens

---

## 3. Out of scope

- **Custom Select** → Part 10b
- **Multi-select, combobox, async loading, grouped options** → future Part 11+
- **Auto-resize textarea** → osobna iteracja
- **Form validation library integration** → Part 11 (Forms)
- **Hero Search Bar** → Faza 3A

---

## 4. API contracts

### 4.1 Field (compound)

```tsx
type FieldProps = {
  id?: string;
  required?: boolean;
  disabled?: boolean;
  invalid?: boolean;
  children: React.ReactNode;
  className?: string;
};
```

Usage:

```tsx
<Field id="email" required>
  <FieldLabel>Email</FieldLabel>
  <FieldControl>
    <TextField type="email" />
  </FieldControl>
  <FieldMessage>Wpisz służbowy adres</FieldMessage>
</Field>
```

FieldContext (internal, NOT publicly exported):

```ts
type FieldContextValue = {
  fieldId: string;
  descriptionId: string;
  errorId: string;
  required: boolean;
  disabled: boolean;
  invalid: boolean;
  hasDescription: boolean;  // v1.2: track if FieldMessage default rendered
  hasError: boolean;        // v1.2: track if FieldMessage error rendered
};
```

**v1.2 fix #3:** `hasDescription` and `hasError` flags allow FieldControl to wire `aria-describedby` ONLY when message exists in DOM.

### 4.2 FieldLabel

```tsx
type FieldLabelProps = {
  children: React.ReactNode;
  required?: boolean;        // override Field.required
  visuallyHidden?: boolean;
  className?: string;
};
```

Renders: `<Text variant="label" as="label" htmlFor={fieldId}>` (reuse Part 6 Text component).

Required asterisk: appended after children w span z `aria-hidden="true"` + `color: var(--eui-danger)` (CSS format empirically verified Stage 1).

### 4.3 FieldControl

```tsx
type FieldControlProps = {
  children: React.ReactElement;  // single child
  // v1.2 fix #2: NO className prop — FieldControl is transparent
};
```

**v1.2 fix #2: FieldControl is transparent — NO wrapper div, NO className.**

Implementation: pure `React.cloneElement` injection. Not a rendered DOM element.

If consumer needs wrapper styling → wraps `<Field>` itself (which can have className), or wraps the input directly.

### 4.4 FieldControl props injection rules (v1.2 — refined)

FieldControl injects via `React.cloneElement` according to these rules:

**Rule for `id`:** user wins.
- If child has own `id` → keep it
- Else → use `fieldId` from context

**Rule for `aria-describedby`:** merge.
- Compute final value:
  ```
  finalAriaDescribedBy = [
    childAriaDescribedBy (if any),
    contextDescriptionId (only if context.hasDescription === true),  // v1.2 fix #3
    contextErrorId (only if context.hasError === true)               // v1.2 fix #3
  ].filter(Boolean).join(" ") || undefined
  ```

**Rule for `aria-required`:** user wins.
- If child has explicit `aria-required` → keep it
- Else, if child has `required` prop → React handles automatically
- Else, if context.required === true → inject `aria-required={true}` on child

**Rule for `aria-invalid`:** user wins.
- Same pattern: explicit child wins; else use context.invalid

**Rule for `disabled` (v1.2 fix #4 — true wins):**
- `finalDisabled = childDisabled || context.disabled` (OR logic, true wins)
- Rationale: parent Field disabling all controls is explicit safety guard
- User CANNOT override Field.disabled by setting child.disabled=false (intentional)

**Rule for `required` (v1.2 fix #4 — true wins):**
- `finalRequired = childRequired || context.required`
- Same rationale as disabled

### 4.5 FieldMessage

```tsx
type FieldMessageProps = {
  children?: React.ReactNode;
  variant?: "default" | "error" | "success" | "warning";
  className?: string;
};
```

Renders: `<HelperText variant={...} id={appropriateId}>` (reuse Part 6 HelperText).

Auto-detect: if Field.invalid → variant="error" (default).

ID assignment:
- variant="error" → `id={errorId}`, sets context.hasError = true
- variant="default" or other → `id={descriptionId}`, sets context.hasDescription = true

**v1.2 fix #3 implementation:** FieldMessage updates context flags on render. FieldControl reads flags during cloneElement to wire aria-describedby correctly.

### 4.6 TextField (self-contained)

```tsx
type TextFieldType = "text" | "email" | "tel" | "number" | "password" | "search";
type TextFieldSize = "sm" | "md" | "lg";  // 36/44/56px

type TextFieldProps = {
  // HTML pass-through (controlled OR uncontrolled)
  type?: TextFieldType;
  value?: string;
  defaultValue?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClear?: () => void;          // v1.1 fix #6: search clear callback
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  readOnly?: boolean;
  autoComplete?: string;
  autoFocus?: boolean;
  name?: string;
  id?: string;

  // Self-contained convenience
  label?: string;
  helperText?: string;
  error?: string;

  // Visual
  size?: TextFieldSize;          // default "md"
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;

  // Premium UX
  showErrorPopover?: boolean;    // v1.1 fix #4: rename z showErrorTooltip

  className?: string;
  inputClassName?: string;
};
```

forwardRef<HTMLInputElement, TextFieldProps>.

**Behaviour rules:**

- **Mode auto-detection:**
  - Inside `<Field>` compound: useFieldContext() returns context → compound mode (no internal label/message render)
  - With `label` prop set: standalone mode → renders own internal Field structure
  - Neither: bare input mode (no label, no message)

- **Helper/error logic (v1.1 fix #5):** error REPLACES helper.
  - If `error` set: render error message only
  - If `helperText` set + no error: render helper message
  - Never both rendered

- **Disabled (v1.1 fix #2):** native `disabled` attribute. NO `aria-disabled` (redundant for `<input>`).

- **ReadOnly (v1.1 fix #3):** native `readOnly` attribute. NO `aria-readonly` (redundant).

- **Icon slot priority:**
  - `type="password"` → built-in show/hide button takes iconRight slot (override consumer iconRight)
  - `type="search"` + controlled (`value` set) + `onClear` provided + `value` not empty → built-in clear button takes iconRight slot
  - Otherwise: consumer's iconRight renders

- **Search clear button (v1.1 fix #6):**
  - Active when: `type="search"` AND `value !== undefined` AND `onClear` provided AND `value.length > 0`
  - Click handler: calls `onClear()` only — consumer manages state reset
  - Uncontrolled mode (defaultValue): NO clear button — native browser behavior

- **showErrorPopover requires `error`:** no error = no popover (silent ignore prop).

### 4.7 Textarea (self-contained)

```tsx
type TextareaProps = {
  // HTML pass-through
  value?: string;
  defaultValue?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  readOnly?: boolean;
  rows?: number;                 // default 4
  maxLength?: number;
  name?: string;
  id?: string;

  // Self-contained
  label?: string;
  helperText?: string;
  error?: string;

  // Visual
  size?: TextFieldSize;          // shares size tokens

  className?: string;
  textareaClassName?: string;
};
```

Same rules as TextField (compound/standalone, error replaces helper, native disabled/readOnly). NO password/search-specific behaviors.

### 4.8 useFieldId (utility)

```ts
function useFieldId(idProp?: string): {
  fieldId: string;
  descriptionId: string;
  errorId: string;
};
```

Internal hook. `idProp` provided → uses it as base. Otherwise `React.useId()` (React 18 SSR-safe).

Suffix derivation:
- `fieldId` = idProp ?? generated
- `descriptionId` = `${fieldId}-description`
- `errorId` = `${fieldId}-error`

### 4.9 useFieldContext (internal)

```ts
function useFieldContext(): FieldContextValue | null;
```

Returns null if not inside Field compound. NIE eksportowany publicznie.

---

## 5. ChatGPT 6 blind spots — explicit handling

### 5.1 Controlled vs uncontrolled API

Both supported.
- Controlled: `value` + `onChange`
- Uncontrolled: `defaultValue` + ref
- Cannot mix (React handles warning)

Search clear ONLY w controlled mode (value + onClear both required).

### 5.2 aria-describedby coordination (v1.2 refined)

**v1.1 fix #5:** error replaces helper, NIE renderuj oba.
**v1.2 fix #3:** aria-describedby points ONLY to IDs that render in DOM.

If error set:
- HelperText error rendered z `id={errorId}`
- context.hasError = true → FieldControl injects aria-describedby={errorId}

If only helper set:
- HelperText default rendered z `id={descriptionId}`
- context.hasDescription = true → FieldControl injects aria-describedby={descriptionId}

If neither set (no FieldMessage):
- context.hasError = false, context.hasDescription = false
- FieldControl does NOT inject aria-describedby (correct: no description exists)

Standalone mode (TextField with label prop): TextField manages its own internal state for hasDescription/hasError.

### 5.3 ID generation stable

`useFieldId` z React.useId() — SSR-safe, unique per instance.

### 5.4 Error popover enhancement (v1.1 fix #4)

**Renamed:** "tooltip" → "popover enhancement".

Implementation:
- Visual: red border ZAWSZE gdy error (CSS format empirical verify Stage 2)
- HelperText error ZAWSZE rendered (a11y baseline, aria-describedby)
- Popover OPTIONAL on iconRight error icon (showErrorPopover prop)
- Popover content = SAME message as HelperText (zero divergence)
- Popover role: NONE explicit (decorative duplication)
- aria-describedby points to HelperText, NOT popover

Mobile: Popover dismissible by closeOnScroll (existing Popover behavior).

### 5.5 Select MVP scope

Out of scope w 10a. 10a kompletne bez Select.

Pre-locked dla 10b:
- Single-select only
- Static options array
- Desktop: Popover dropdown
- Mobile: BottomSheet (height="auto")
- No combobox/search/multi-select/async/grouped

### 5.6 Hero Search composition

Part 10 NIE projektuje SearchBar primitive.

Composition readiness:
- TextField z `iconLeft={<Search />}` + `size="lg"` + `className` → 80% premium feel
- Faza 3A composes SearchBar z TextField + Button + custom layout

Validate: TextField API confirms iconLeft, size="lg", forwardRef — Faza 3A unblocked.

---

## 6. Visual design

### 6.1 Sizes

| Size | Height | Padding | Font token | Use case |
|---|---|---|---|---|
| `sm` | 36px | 0 12px | `--eui-font-size-sm` | Admin dense forms |
| `md` | 44px | 0 14px | `--eui-font-size-base` | Default user-facing |
| `lg` | 56px | 0 18px | `--eui-font-size-lg` | Hero Search Faza 3A |

### 6.2 Frame styles (Airbnb-like)

**Default:**
- `background: var(--eui-grey-50)`
- `border: 1px solid var(--eui-border)`
- `border-radius: var(--eui-radius-md)` (8px)
- Transition: `border-color 0.15s, background 0.15s`

**Focus:**
- `background: var(--eui-grey-0)` (white)
- `border-color: var(--eui-border-strong)`
- NO blue focus ring
- `outline: 0` (managed by border-color)

**Disabled:**
- `background: var(--eui-grey-100)`
- `color: var(--eui-text-muted)`
- `cursor: not-allowed`

**Error:**
- `border-color: var(--eui-danger)` — full intensity (Robert design rule #13)
- CSS format: **empirical verify Stage 2** (hex token → raw `var()`, HSL triplet → `hsl(var())`)
- `background: var(--eui-grey-50)`
- On focus: still error border-color

**ReadOnly:**
- `background: var(--eui-grey-50)`
- `cursor: text` (selectable)

### 6.3 Spacing

- Label → input gap: `var(--eui-space-1)` (4px)
- Input → message gap: `var(--eui-space-1)` (4px)
- Icon slot: `padding-left: 40px` (iconLeft) or `padding-right: 40px` (iconRight)
- Icon size: 16px (lucide default)
- Both slots: both paddings adjusted

### 6.4 Required asterisk

```tsx
<Text variant="label">
  {children}
  {required && <span aria-hidden="true" style={{ color: "TBD-empirical" }}> *</span>}
</Text>
```

CSS format dla `--eui-danger`: empirical verify Stage 2.

---

## 7. CSS architecture

### 7.1 Namespace

All Part 10 classes scoped: `.engine-root .eui-field-*` + `.eui-textfield-*` + `.eui-textarea-*`.

### 7.2 globals.css section

Append after Part 9 section (linia ~5587): `/* ── Part 10 Inputs Foundation ── */`.

### 7.3 Token format — v1.2 fix #1: empirical verify per token

**v1.2 change:** NIE hardcoded "must wrap" rules. Per Part 9 lesson — token type empirically verified before write.

**Pre-Stage 2 empirical check:**
```bash
grep -nE "^\s+--eui-danger:" src/styles/globals.css
grep -nE "^\s+--eui-grey-50:" src/styles/globals.css
# ... etc dla każdego use'd tokena
```

**Decision rule per token:**
- If token value is hex (e.g. `#fafafa`) → use raw `var(--token-name)` w CSS
- If token value is HSL triplet (e.g. `0 0% 100%`) → use `hsl(var(--token-name))` w CSS
- If unsure → check globals.css empirically

**NO opacity on borders rule (Robert design rule #13):** NEVER `hsl(var(--eui-danger) / 0.5)` — always full intensity.

---

## 8. File structure

```
src/components/engine-ui/
└── input/                              ← NEW
    ├── Field.tsx                       ← Field + FieldLabel + FieldControl + FieldMessage
    ├── TextField.tsx
    ├── Textarea.tsx
    ├── useFieldId.ts
    ├── useFieldContext.ts
    └── index.ts                        ← barrel exports (NO useFieldContext export)
```

---

## 9. Stages plan — Part 10a (6 stages)

### Stage 1: Field architecture + IDs + context

**Files:**
- NEW `engine-ui/input/Field.tsx` (Field + FieldLabel + FieldControl + FieldMessage)
- NEW `engine-ui/input/useFieldId.ts`
- NEW `engine-ui/input/useFieldContext.ts`
- NEW `engine-ui/input/index.ts` (barrel)
- MOD `globals.css` (minimal section opener + base classes only, empirical token verify before each use)

**Lines estimate:** ~200 TSX + ~40 CSS

**Risk:** LOW-MEDIUM — FieldControl props merge logic + hasDescription/hasError flag tracking biggest risk.

**Pre-checks:**
- input/ directory does NOT exist
- React 18+ confirmed (useId)
- Text component variant="label" exists
- HelperText API matches assumptions

### Stage 2: TextField

**Files:**
- NEW `engine-ui/input/TextField.tsx`
- MOD `engine-ui/input/index.ts`
- MOD `globals.css` (TextField full styles, sizes, states — **empirical token format verify**)

**Lines estimate:** ~250 TSX + ~140 CSS

**Risk:** MEDIUM — most complex primitive (6 types, controlled/uncontrolled, password toggle, search onClear, icon slots).

**Pre-checks:**
- IconButton API for password show/hide
- lucide-react icons: Eye, EyeOff, X, Search availability
- **Token format verify** for `--eui-danger`, `--eui-border`, `--eui-border-strong`, `--eui-grey-*`

Out of scope tutaj: error popover (Stage 4).

### Stage 3: Textarea

**Files:**
- NEW `engine-ui/input/Textarea.tsx`
- MOD `engine-ui/input/index.ts`
- MOD `globals.css` (Textarea styles, leverage TextField CSS)

**Lines estimate:** ~160 TSX + ~30 CSS

**Risk:** LOW — simpler than TextField.

### Stage 4: Error popover enhancement

**Files:**
- MOD `engine-ui/input/TextField.tsx` (add showErrorPopover logic)
- MOD `engine-ui/input/Textarea.tsx` (add showErrorPopover logic)
- MOD `globals.css` (popover trigger icon styles)

**Lines estimate:** ~50 TSX + ~20 CSS (delta)

**Risk:** MEDIUM — Popover integration, mobile dismissibility, a11y discipline (popover NOT in aria-describedby).

**Pre-checks:**
- Popover API: closeOnScroll behavior
- AlertCircle icon (lucide)

### Stage 5: Lab section "Inputy"

**Files:**
- NEW `engine-ui-lab/sections/InputsSection.tsx`
- MOD `engine-ui-lab/EngineUiLab.tsx` (4 changes)

**Lines estimate:** ~220 TSX

**Risk:** MEDIUM — pierwszy widoczny moment Part 10. Robert visual verify required.

Specimens (~9 ComponentShowcase blocks, lean):
1. Field compound — full example
2. TextField self-contained (label prop)
3. TextField sizes — sm/md/lg row
4. TextField states — default/disabled/error/readOnly
5. TextField types — text/email/password/search row
6. TextField with icons — iconLeft + iconRight
7. Textarea — basic + with label
8. Error UX baseline — TextField z error string
9. Error UX premium — TextField z showErrorPopover

**Lab specimens fixed-width pattern (Part 9 Stage 11 lesson):** wrap each w `<div style={{ width: 320 }}>`.

### Stage 6: Inventory document update

**Files:**
- MOD `docs/ENGINE-UI-INVENTORY.md`

**Lines estimate:** ~50 lines added

**Update content:**
- "### Inputs (Part 10)" section under Components
- Lab Sections table: add row #16 "Inputy"
- Roadmap: Part 10a ✅, Part 10b ⬜
- Refresh "Last updated" header

---

## 10. Empirical pre-checks per stage

### Pre-Stage 1

```bash
ls -la src/components/engine-ui/input/ 2>/dev/null || echo "GOOD"
grep -E "\"react\":" package.json | head -2  # React 18+ for useId
head -40 src/components/engine-ui/text/Text.tsx  # variant="label" exists?
head -40 src/components/engine-ui/text/HelperText.tsx
```

### Pre-Stage 2 — token format verify (v1.2 critical)

```bash
# Verify token TYPE before CSS write (hex vs HSL triplet)
grep -nE "^\s+--eui-danger:" src/styles/globals.css
grep -nE "^\s+--eui-grey-(0|50|100|200):" src/styles/globals.css
grep -nE "^\s+--eui-border(:|-strong:)" src/styles/globals.css
grep -nE "^\s+--eui-text-(primary|secondary|muted):" src/styles/globals.css

# Determine per token: if hex → raw var(), if HSL → hsl(var())

# Verify primitives
[ -f src/components/engine-ui/button/IconButton.tsx ] && head -30 src/components/engine-ui/button/IconButton.tsx
grep -E "Eye|EyeOff|X[ ,]|Search" src/components/engine-ui-lab/sections/*.tsx | head -5
```

### Pre-Stage 4

```bash
head -50 src/components/engine-ui/primitives/Popover.tsx
grep -E "closeOnScroll|onOpenChange" src/components/engine-ui/primitives/Popover.tsx
```

### Pre-Stage 5

```bash
head -50 src/components/engine-ui-lab/sections/SkeletonSection.tsx  # newest section pattern
head -30 src/components/engine-ui-lab/CodeSnippet.tsx  # API confirm (Part 9 Stage 11 lesson)
```

### Pre-Stage 6

```bash
head -10 docs/ENGINE-UI-INVENTORY.md  # date format
grep -c "## Inputs" docs/ENGINE-UI-INVENTORY.md  # should be 0
```

---

## 11. Risks & mitigations

### Risk 1: Compound + self-contained dual API confusion

Mitigation: Lab examples explicit "Field compound" vs "TextField standalone" labels. Inventory documents both modes.

### Risk 2: FieldControl props merge breaks consumer overrides (v1.2 — refined)

Mitigation:
- Explicit merge rule (sekcja 4.4) — distinct rules per prop
- `id`, `aria-required`, `aria-invalid`: user wins
- `disabled`, `required`: **true wins** (parent safety guard)
- `aria-describedby`: merge (concat all)

### Risk 3: aria-describedby points to non-existent IDs (v1.2 fix #3)

Mitigation: Context tracks `hasDescription` and `hasError` flags. FieldControl injects aria-describedby only for flags === true.

### Risk 4: ID collision in nested forms

Mitigation: React.useId() SSR-safe per-instance.

### Risk 5: Error popover blocks input on mobile

Mitigation: trigger is iconRight error icon (small target), NOT input itself. closeOnScroll dismissible. Visual verify Stage 5.

### Risk 6: Password show/hide breaks autofill

Mitigation: single input element, only `type` attr toggles. No conditional render.

### Risk 7: Textarea height inconsistency vs TextField

Mitigation: size prop affects font/padding only. rows controls height. Document explicit.

### Risk 8: Lab specimens collapse w preview zone (Part 9 Stage 11 lesson)

Mitigation: wrap each Lab specimen w `<div style={{ width: 320 }}>` (fixed width).

### Risk 9: Search clear onClear callback not called → stuck button

Mitigation: render condition checks `value.length > 0` — if consumer doesn't reset state, button visible but click is no-op (consumer bug). Document expected behavior.

### Risk 10: CSS token format mismatch (v1.2 fix #1 — Part 9 lesson)

Mitigation: empirical verify EACH token before CSS write. Document found type in commit message.

---

## 12. A11y checklist per stage

**Stage 1 (Field):**
- [ ] FieldLabel `<label htmlFor={fieldId}>`
- [ ] FieldControl injects aria-describedby ONLY when hasDescription/hasError === true (v1.2 fix #3)
- [ ] FieldMessage id matches descriptionId or errorId
- [ ] FieldMessage updates context flags on render
- [ ] Required: aria-required injected (only if child doesn't have it)
- [ ] Invalid: aria-invalid injected (only if child doesn't have it)
- [ ] disabled: true wins (Field.disabled forces child)
- [ ] required: true wins

**Stage 2 (TextField):**
- [ ] Standalone mode generates valid IDs
- [ ] Standalone mode tracks hasDescription/hasError internally
- [ ] Password toggle button: aria-label="Pokaż hasło" / "Ukryj hasło"
- [ ] Search clear button: aria-label="Wyczyść"
- [ ] Disabled: native `disabled` attribute (NO redundant aria-disabled)
- [ ] ReadOnly: native `readOnly` attribute (NO redundant aria-readonly)

**Stage 3 (Textarea):**
- [ ] Same patterns as TextField
- [ ] rows attribute renders correctly

**Stage 4 (Error popover):**
- [ ] HelperText error ZAWSZE rendered (visible + aria-describedby)
- [ ] Popover content = exact same message
- [ ] Popover NOT in aria-describedby
- [ ] Popover trigger has aria-label="Pokaż szczegóły błędu"

**Stage 5 (Lab):**
- [ ] Specimens demonstrate both compound + standalone
- [ ] Error popover specimen renders both HelperText AND popover

---

## 13. Definition of Done — Part 10a

**Code:**
- [ ] 6 commits pushed master (1 per stage)
- [ ] All builds compile clean
- [ ] Polish chars verified
- [ ] Zero booking flow regression

**Visual:**
- [ ] Robert manual visual approval Lab section
- [ ] Compound + standalone render side-by-side
- [ ] All 6 TextField types tested

**A11y:**
- [ ] Section 12 checklist green
- [ ] aria-describedby points only to existing IDs (v1.2 fix #3)
- [ ] Screen reader test (manual)

**Docs:**
- [ ] ENGINE-UI-INVENTORY.md updated
- [ ] Master Checklist 9/14 → 10/14 = 71%

**Workflow #29:**
- [ ] Inventory referenced ✅ (this blueprint references it)
- [ ] Pre-checks documented ✅ (sekcja 10)
- [ ] Implementation follows stages plan
- [ ] Inventory updated post-deploy (Stage 6)

---

## 14. v1.2 changelog (vs v1.1)

3 must-fix corrections + 1 doprecyzowanie z ChatGPT review v1.1:

1. **Token CSS format empirical verify** (v1.2 fix #1) — sekcja 7.3, 6.4, Pre-Stage 2 checks. Removed hardcoded "must wrap" rule, added per-token empirical verification (Part 9 lesson applied).
2. **FieldControl transparent — NO className** (v1.2 fix #2) — sekcja 4.3. FieldControl uses pure cloneElement, no DOM render, no className prop.
3. **aria-describedby existence guard** (v1.2 fix #3) — sekcja 4.1, 4.4, 4.5, 5.2. Context tracks hasDescription/hasError flags. FieldControl injects aria-describedby only when flag === true.
4. **disabled/required: true wins** (v1.2 fix #4 doprecyzowanie) — sekcja 4.4, 11 Risk 2. Field.disabled=true forces child disabled (safety guard). Same for required.

---

## 15. v1.1 changelog (vs v1.0)

7 must-fix corrections z Robert review v1.0:

1. FieldControl: merge props (NIE overwrite) — sekcja 4.4 explicit rules per prop
2. Native disabled (NO aria-disabled) — sekcja 4.6, 4.7, 12
3. Native readOnly (NO aria-readonly) — sekcja 4.6, 4.7, 12
4. Rename: error tooltip → error popover enhancement
5. Error replaces helper (NIE renderuj oba) — sekcja 4.6, 5.2
6. Search clear: onClear callback (NIE synthetic ChangeEvent) — sekcja 4.6
7. Stage split: 5 → 6 stages (Stage 4 = error popover osobno) — sekcja 9

---

**End blueprint v1.2 FINAL.**

Total length: ~600 lines markdown.
Estimated implementation Part 10a: 4-5h, 6 stages.
Ready for Stage 1 implementation.
