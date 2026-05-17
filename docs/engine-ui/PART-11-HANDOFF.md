# CANONICAL HANDOFF — PART 11 READINESS

> **Status:**
> - Aktualne na dzień commitowania (stan wejścia do Part 11).
> - Czytać **po** `docs/README.md`, `docs/engine-ui/VISUAL-DNA.md`, `docs/engine-ui/INVENTORY.md`.
> - **NIE zastępuje** VISUAL-DNA — tylko streszcza stan wejścia do Part 11.
>   W sporach stylu źródłem prawdy pozostaje `VISUAL-DNA.md` + kod.

Visual DNA / governance consolidation **CLOSED** (Stage 1 → 3.6). Engine UI ready for Part 11.

## Canonical docs (kolejność czytania przed pracą Part 11)

1. `docs/README.md` — mapa; który system jest canonical
2. **`docs/engine-ui/VISUAL-DNA.md`** — konstytucja stylu; **bije historyczne blueprinty** w sprawach wizualnych
3. `docs/engine-ui/INVENTORY.md` — mapa komponentów (file-count, CI-checkable)
4. `docs/engine-ui/LAB-CONVENTIONS.md` — reguły Lab responsive
5. Ten dokument — streszczenie stanu wejścia

- Legacy (NIE dla Engine UI): `docs/legacy/DESIGN_SYSTEM.md` (admin `.bubble`)
- History (NIE źródło prawdy, immutable): `docs/history/{blueprints,reports,prompts,audits}/`

## Final Visual DNA decisions (frozen)

| Oś | Decyzja canonical |
|---|---|
| **Focus** | B-neutral grey halo `--eui-focus-ring` = `0 0 0 3px color-mix(in srgb, var(--eui-grey-900) 8%, transparent)`. Zero brand-blue (100% skonwergowane, Stage 2 + 3.5). Inverse tylko ciemne/brand (a11y wyjątek). Error = danger 12% halo. |
| **Border** | Aktywne controls: białe tło. Disabled: `grey-100` (jedyny szary bg). Default border: `grey-300` (border-strong). Hover/focus: `grey-500/600`. **Zakaz `grey-900` razor.** |
| **Radius** | controls `sm` 8px · row/menu items `md` 12px · **floating panels (Popover/Select/DatePicker/GuestPicker/ErrorPopover) `lg` 16px** (Stage 3.6 ujednolicone) · cards per-wariant · pill tylko świadomie |
| **Elevation** | `elev-1..5` jedna rodzina. Cards 1-3 / Popover 4 / Sheet 5. Spójne — bez zmian. |
| **CardSurface** | warianty `surface`/`bordered`/`bare`; zero `!important` bypass (consumer potrzebuje wariantu → dodaj wariant, nie override) |
| **Form controls** | TextField/Textarea/Select = reference; md=44px/14px; dual API (compound `Field` + standalone label/helper/error); Select = Popover desktop / BottomSheet mobile |

## Known cleanup-later (udokumentowane, NIE blokują Part 11)

1. `LegacyFavoriteButton` → modern `button/FavoriteButton` w ResultCard (8.5b)
2. `globals.css` code-comment refs do starych ścieżek docs (Stage 1 follow-up; wtedy scope = no-CSS-changes)
3. Specimen-width inline harmonizacja Layout/Surface/Media → wzorzec `SPECIMEN_STYLE` (kosmetyka Lab)
4. Root-level domain composites (GuestPicker/SearchBar/Stepper/DatePickerTabs) → podkatalogi po pełnym 8.5b
5. Untracked `HANDOFF-new-chat.md` (root) + `docs/BOOKING_EDIT_DESIGN.md` routing — decyzja PO

## Rules for Part 11 (z VISUAL-DNA §11/§12)

- **Halt + raport** (nie cichy commit) gdy: nowy komponent wymaga override primitive · blueprint kłóci się z kodem · pattern nie pasuje do DNA · istnieje podobny primitive · zmiana dotyka globalnych `--eui-*` / generic primitive (multi-consumer impact).
- **Forbidden:** `.bubble` w Engine UI · raw Tailwind override w primitywach · `!important` jako obejście kontraktu primitive · `grey-900` razor hover/focus · brand-blue focus jako default · lokalne `mergeClass` (użyj `tokens/cx.ts`) · nowy doc bez statusu nagłówka (CANONICAL/LEGACY/HISTORY/OPS).
- Nowy primitive → `engine-ui/<rodzina>/` + eksport z `<rodzina>/index.ts` ORAZ root `index.ts` (barrel parity). Po merge → update `INVENTORY.md` (file-count).
- Nowa sekcja Lab tylko dla nowej **rodziny**; wariant → nowy ComponentShowcase w istniejącej. Specimen = bezpośrednie dziecko flex-column preview, `width:100% maxWidth:320` (NIE multi-column `<Inline wrap>`).
- Visual DNA > blueprint w sporach stylu.

## Pre-Part-11 gate (otwarte VISUAL VERIFY — Robert)

Nieblokujące kodu, ale powinno być sprawdzone przed startem Part 11:

1. ResultCard keyboard-focus = B-neutral szary halo (było niebieskie)
2. Dropdowny/popovery = 16px rogi (Select/DatePicker/GuestPicker/error popover)
3. `/explore` ResourceCard `variant=bordered` — transparent bg + border-strong hover, premium booking feel
4. SecondaryLink/ThumbnailStrip focus = szary halo; inverse focus na solid buttonach widoczny

Po potwierdzeniu #1–4 → Part 11 otwarty z czystym, zamrożonym DNA.

---
*Utworzony: 2026-05-16, zamknięcie governance consolidation (Stage 1→3.6).*
