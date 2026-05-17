# Engine UI Visual DNA

> Canonical design rulebook. NIE raport historyczny, NIE blueprint.
> To jest konstytucja stylu Engine UI — w sprawach wizualnych ma
> **pierwszeństwo przed historycznymi blueprintami** (`docs/history/blueprints/`).
> Konflikt blueprint ↔ ten dokument → wygrywa ten dokument.

## 1. Status

- **CANONICAL** — jedyne źródło prawdy dla stylu Engine UI.
- Dotyczy: `.eui-*`, `--eui-*`, Engine UI Lab, przyszły booking frontend.
- Admin `.bubble` / Plus Jakarta / `<BubbleSelect>` = **LEGACY**, nie stosować.
  (legacy doc: `docs/legacy/DESIGN_SYSTEM.md`).
- Powiązane canonical: `docs/engine-ui/INVENTORY.md`, `docs/engine-ui/LAB-CONVENTIONS.md`.

## 2. Design personality

- Soft premium — miękki, nie agresywny.
- Consumer-grade booking UI — produkt dla gościa, nie panel techniczny.
- Tactile but clean — wyczuwalny, ale uporządkowany.
- No black razor — żadnych ostrych czarnych krawędzi (grey-900) jako hover/focus.
- No legacy bubble — zero `.bubble` w Engine UI.
- No random Tailwind overrides — primitywy nie są obchodzone `!important`.
- Professional, calm, precise — spokój i precyzja ponad efekciarstwo.

## 3. Focus philosophy

- **B-neutral grey halo = canonical.** Token: `--eui-focus-ring` =
  `0 0 0 3px color-mix(in srgb, var(--eui-grey-900) 8%, transparent)`.
- Brand-blue focus ring **NIE jest domyślny** i nie wraca. (Stage 2 + 3.5
  domknęły 100% konwergencji — zero `var(--eui-brand)` w `:focus-visible`.)
- Inverse focus (`.eui-focus-ring-inverse`, grey-900 + grey-0) **tylko** dla
  ciemnych/brand powierzchni gdzie szary halo byłby niewidoczny (a11y wyjątek).
- Error focus = danger-tinted halo:
  `0 0 0 3px color-mix(in srgb, var(--eui-danger) 12%, transparent)`.
- Focus ma być widoczny, miękki, nie agresywny. Mechanizm: `outline:none` +
  `box-shadow: var(--eui-focus-ring)` (nie `outline: solid brand`).

## 4. Border philosophy

- Aktywne controls: **białe tło** (`--eui-grey-0`).
- Disabled: szare tło (`--eui-grey-100`) — jedyny szary bg = sygnał disabled.
- Readonly: `--eui-grey-50` (świadomy stan pośredni "not editable").
- Border default: widoczny ale spokojny — `--eui-border-strong` (grey-300).
- Hover/focus border: mocniejszy, **ale nie czarny** — grey-500/600.
- **Zakaz** `grey-900` jako zwykły hover/focus border (black razor).

## 5. Radius system

| Warstwa | Token | px | Status |
|---|---|---|---|
| controls (input/select/button/textfield) | `sm` | 8 | ✅ canonical |
| row items / menu options (PopoverItem, Select option) | `md` | 12 | ✅ canonical |
| dropdown / popover content | — | — | ⚠️ patrz NEEDS DECISION |
| cards / surfaces (CardSurface) | `lg`/`xl`/`2xl` | 16/20/24 | per-wariant, świadome |
| pill | `pill` | 9999 | tylko świadomy pill pattern (chip, niektóre badge) |

**Obecny drift dropdown/popover:** PopoverContent `2xl` 24px, Select content
`lg` 16px (fix #2 clipping), PopoverItem `md` 12px.

> **NEEDS DECISION:** Czy PopoverContent globalnie zmieniamy z **24px → 16px**,
> żeby zrównać wszystkie floating panels (Popover/Select/DatePicker/GuestPicker/
> ErrorPopover) do jednego radiusa? Impact: każdy popover/dropdown w systemie.
> Rekomendacja CLI w raporcie Stage 3.5 (FAZA E). Do czasu decyzji: drift
> udokumentowany, nie "ukryty".

## 6. Surface / elevation philosophy

- Elevation tokeny: `--eui-elev-1..5` (każdy = hairline `0 0 0 1px rgba(0,0,0,.02)`
  + progresywny soft drop). To **jedna rodzina**, hierarchia głębi:
  CardSurface flat=none / raised=1 / elevated=2 / floating=3 →
  PopoverContent=4 → BottomSheet=5.
- CardSurface variants:
  - `surface` (default) — bg grey-0 + 1px border (wsteczna kompatybilność).
  - `bordered` — transparent + 2px `--eui-border` + shadow none + hover border-strong.
  - `bare` — transparent + bez border/shadow (legacy `.eui-card` look).
  - `elevation` prop (flat/raised/elevated/floating) — niezależny od variant.
- **Nie obchodzić CardSurface `!important`.** Jeśli consumer musi nadpisać
  primitive → primitive potrzebuje wariantu (patrz §12 When to stop).

## 7. Form controls language

- **TextField / Textarea / Select = canonical reference** dla wszystkich kontrolek.
- `md` = **44px height / 14px font** (desktop). sm=36 / lg=52.
- Białe tło, B-neutral focus, **zero niebieskiego focusa**.
- **Zero szarego "disabled-look"** na aktywnych kontrolkach.
- Mobile anti-iOS-zoom wyjątki tylko świadomie (udokumentowane w CSS).
- Controlled i uncontrolled — oba wspierane (`value` > `defaultValue`).
- Dual API: compound `<Field>` (consumer chrome) + standalone
  (`label`/`helperText`/`error` props). Detekcja przez `useFieldContext`.
- Select: Popover (desktop) / BottomSheet (mobile ≤767px via `useIsMobile`).

## 8. Popover / dropdown language

- **`Popover` primitive (Radix wrapper) = source of truth.**
- Konsumenci: Select, ErrorPopover (TextField/Textarea), DatePicker, GuestPicker.
- Row style reuse `.eui-popover-item*` (ikona-koperta + title + subtitle).
  **Nie tworzyć nowych lokalnych row patternów.**
- Radius family: obecny vs target — patrz §5 + NEEDS DECISION.
- A11y: listbox/option + `aria-activedescendant` (Select wzorzec greenfield).

## 9. Button / chip / nav language

- Konwergują do **B-neutral focus** (token `--eui-focus-ring`).
- Chip razor `grey-900` hover **zabroniony** — używać grey-500/600.
- Hover nie może wyglądać jak czarna żyletka.
- Icon sizing świadome per kontekst (14 stepper / 16 input / 18 chevron /
  20 select-option / 40 popover-item koperta) — nie losowe.

## 10. Lab presentation rules

- Lab pokazuje **canonical** system. Legacy oznaczać jako legacy lub nie
  pokazywać jako canonical.
- Specimen widths: compact **320**, wide **480/600**, full-width tylko dla
  layout/composition. Wzorzec: `SPECIMEN_STYLE = { width:"100%", maxWidth:320 }`.
- Specimen jako bezpośrednie dziecko flex-COLUMN preview (nie multi-column
  `<Inline wrap>` z nested width — daje content-driven cramp na mobile;
  patrz LAB-CONVENTIONS #3).
- Nazwy sekcji nie dublują pojęć: **Foundations = tokens**,
  **Typography = components** (showcase "Skala typograficzna (tokeny)" ≠
  sekcja "Typografia").

## 11. Forbidden patterns

- `.bubble` w Engine UI.
- Raw Tailwind override w primitywach (bg-/text-/border- zamiast `.eui-*`).
- `!important` jako obejście kontraktu primitive.
- `grey-900` razor hover/focus border.
- Brand-blue focus jako default.
- Lokalne `mergeClass` zamiast wspólnego `cx()` (`tokens/cx.ts`).
- Nowe docs bez statusu w nagłówku: `CANONICAL` / `LEGACY` / `HISTORY` / `OPS`.
- Multi-column `<Inline wrap>` z pełnoszerokościowymi specimenami w Lab.

## 12. When to stop (halt rules)

Zatrzymaj się i raportuj (nie cichy commit), jeśli:
- nowy komponent wymaga override primitive → primitive potrzebuje wariantu.
- blueprint kłóci się z kodem → kod + ten dokument wygrywają.
- visual pattern nie pasuje do DNA (§2) → przedyskutuj zanim wprowadzisz.
- istnieje już podobny primitive → reuse, nie duplikuj.
- zmiana dotyka globalnych tokenów (`--eui-*`) lub generycznego primitive
  używanego przez wielu konsumentów → najpierw raport impact + NEEDS DECISION.

---
*Utworzony: Stage 3.5 (2026-05-16). Visual DNA freeze przed Part 11.*
