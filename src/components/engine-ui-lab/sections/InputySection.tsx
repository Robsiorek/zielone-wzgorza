"use client";

import * as React from "react";
import {
  TextCursorInput,
  Mail,
  Search,
  Home,
  BedDouble,
  Tent,
  MapPin,
} from "lucide-react";

import {
  Field,
  FieldLabel,
  FieldControl,
  FieldMessage,
  TextField,
  Textarea,
  Select,
  type SelectOption,
} from "@/components/engine-ui/input";
import { Stack } from "@/components/engine-ui/layout/Stack";
import { Inline } from "@/components/engine-ui/layout/Inline";
import { Text } from "@/components/engine-ui/text/Text";

import { LabSection } from "../LabSection";
import { ComponentShowcase } from "../ComponentShowcase";
import { SpecimenInfo } from "../Specimen";

// Per LAB-CONVENTIONS #3: intrinsic flex zamiast fixed width.
// Specimens shrink na mobile (basis 280px), nie urosną poza 320px na desktop.
const SPECIMEN_STYLE: React.CSSProperties = { flex: "1 1 280px", maxWidth: 320 };

// Select demo data ─────────────────────────────────────────────────────────

// WARIANT Z IKONAMI — system-menu-row look (PopoverItem: koperta + tytuł + opis)
const CATEGORIES: SelectOption[] = [
  {
    value: "domek",
    label: "Domek",
    icon: <Home size={20} aria-hidden="true" />,
    description: "Wolnostojący, własny ogród",
  },
  {
    value: "apartament",
    label: "Apartament",
    icon: <MapPin size={20} aria-hidden="true" />,
    description: "W budynku wielorodzinnym",
  },
  {
    value: "pokoj",
    label: "Pokój",
    icon: <BedDouble size={20} aria-hidden="true" />,
    description: "Pojedynczy pokój z łazienką",
  },
  {
    value: "miejsce-namiotowe",
    label: "Miejsce namiotowe",
    icon: <Tent size={20} aria-hidden="true" />,
    description: "Pole namiotowe z dostępem do mediów",
  },
];

// WARIANT BEZ IKON — sama etykieta (graceful degradation, brak pustej koperty)
const CATEGORIES_PLAIN: SelectOption[] = [
  { value: "domek", label: "Domek" },
  { value: "apartament", label: "Apartament" },
  { value: "pokoj", label: "Pokój" },
  { value: "miejsce-namiotowe", label: "Miejsce namiotowe" },
];

// Wariant z ikonami + jedna opcja disabled (test keyboard nav skip)
const CATEGORIES_WITH_DISABLED: SelectOption[] = [
  {
    value: "domek",
    label: "Domek",
    icon: <Home size={20} aria-hidden="true" />,
    description: "Wolnostojący, własny ogród",
  },
  {
    value: "apartament",
    label: "Apartament",
    icon: <MapPin size={20} aria-hidden="true" />,
    description: "W budynku wielorodzinnym",
  },
  {
    value: "pokoj",
    label: "Pokój",
    icon: <BedDouble size={20} aria-hidden="true" />,
    description: "Chwilowo niedostępny",
    disabled: true,
  },
  {
    value: "miejsce-namiotowe",
    label: "Miejsce namiotowe",
    icon: <Tent size={20} aria-hidden="true" />,
    description: "Pole namiotowe z dostępem do mediów",
  },
];

const COUNTRIES: SelectOption[] = [
  { value: "pl", label: "Polska" },
  { value: "de", label: "Niemcy" },
  { value: "cz", label: "Czechy" },
  { value: "sk", label: "Słowacja" },
  { value: "lt", label: "Litwa" },
  { value: "lv", label: "Łotwa" },
  { value: "ee", label: "Estonia" },
  { value: "no", label: "Norwegia" },
  { value: "se", label: "Szwecja" },
  { value: "fi", label: "Finlandia" },
  { value: "dk", label: "Dania" },
  { value: "nl", label: "Holandia" },
  { value: "be", label: "Belgia" },
  { value: "fr", label: "Francja" },
  { value: "es", label: "Hiszpania" },
  { value: "it", label: "Włochy" },
];

export function InputySection() {
  // Search clear demo state
  const [searchValue, setSearchValue] = React.useState("kajaki");

  // Long error message used in popover spotlight
  const longErrorMessage =
    "Hasło musi zawierać co najmniej 12 znaków, jedną wielką literę, jedną cyfrę i jeden znak specjalny. Aktualnie brakuje znaku specjalnego.";

  // Controlled Select state (for "Architecture" demo + many-options demo)
  const [category, setCategory] = React.useState<string>("apartament");
  const [country, setCountry] = React.useState<string>("pl");

  return (
    <LabSection
      id="inputy"
      title="Inputy"
      icon={<TextCursorInput />}
      description="Foundation inputów: Field compound architecture + TextField/Textarea primitives. 3 tryby: compound (Field-wrapped), standalone (label/error props), bare (sam input)."
    >
      {/* 1. Architecture demo — 3 modes side-by-side */}
      <ComponentShowcase
        title="Architektura — 3 tryby"
        caption="Field compound (consumer wires chrome), standalone (TextField z label/error props), bare (sam input bez chrome). Identyczny visual, różny entrypoint."
        info={
          <SpecimenInfo
            id="Field+TextField"
            hint="useFieldContext detects compound; standalone wraps internal Field"
          />
        }
      >
        <Inline gap="md" align="start" wrap>
          <Stack gap="xs">
            <Text variant="caption" color="muted">
              Compound (Field-wrapped)
            </Text>
            <div style={SPECIMEN_STYLE}>
              <Field id="email-compound" required>
                <FieldLabel>Email</FieldLabel>
                <FieldControl>
                  <TextField type="email" placeholder="adres@example.pl" />
                </FieldControl>
                <FieldMessage>Wpisz służbowy adres</FieldMessage>
              </Field>
            </div>
          </Stack>

          <Stack gap="xs">
            <Text variant="caption" color="muted">
              Standalone (TextField props)
            </Text>
            <div style={SPECIMEN_STYLE}>
              <TextField
                type="email"
                label="Email"
                helperText="Wpisz służbowy adres"
                placeholder="adres@example.pl"
                required
              />
            </div>
          </Stack>

          <Stack gap="xs">
            <Text variant="caption" color="muted">
              Bare (input only)
            </Text>
            <div style={SPECIMEN_STYLE}>
              <TextField type="email" placeholder="adres@example.pl" />
            </div>
          </Stack>
        </Inline>
      </ComponentShowcase>

      {/* 2. TextField — Sizes */}
      <ComponentShowcase
        title="TextField — rozmiary"
        caption="3 rozmiary: sm (36px, formularze gęste), md (44px, default user-facing), lg (56px, hero search). Padding + font-size scaluje się proporcjonalnie."
        info={
          <SpecimenInfo
            id="TextField"
            hint="md font-size 14px (post Stage 5.2 downsize)"
          />
        }
      >
        <div style={SPECIMEN_STYLE}>
          <Stack gap="md">
            <TextField size="sm" placeholder="Small (36px)" />
            <TextField size="md" placeholder="Medium (44px)" />
            <TextField size="lg" placeholder="Large (52px)" />
          </Stack>
        </div>
      </ComponentShowcase>

      {/* 3. TextField — Types */}
      <ComponentShowcase
        title="TextField — typy"
        caption="6 HTML types: text, email, tel, number, password (z toggle show/hide), search (z onClear callback). Password i search mają wbudowane IconButton w slocie iconRight."
        info={
          <SpecimenInfo
            id="TextField"
            hint="password: type-attr toggle preserves autofill"
          />
        }
      >
        <div style={SPECIMEN_STYLE}>
          <Stack gap="md">
            <TextField type="text" placeholder="text — generic" />
            <TextField
              type="email"
              placeholder="email"
              iconLeft={<Mail size={16} aria-hidden="true" />}
            />
            <TextField type="tel" placeholder="tel — +48 600 000 000" />
            <TextField type="number" placeholder="number — 42" />
            <TextField type="password" placeholder="password — toggle z prawej" />
            <TextField
              type="search"
              placeholder="search — wyczyść z prawej"
              iconLeft={<Search size={16} aria-hidden="true" />}
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onClear={() => setSearchValue("")}
            />
          </Stack>
        </div>
      </ComponentShowcase>

      {/* 4. TextField — States */}
      <ComponentShowcase
        title="TextField — stany"
        caption="Wszystkie stany inputu: default, filled, disabled (native attr), readOnly (native attr), error (border-color danger via [aria-invalid]), error + popover (Stage 4 enhancement)."
        info={
          <SpecimenInfo
            id="TextField"
            hint='error styling via CSS [aria-invalid="true"]'
          />
        }
      >
        <div style={SPECIMEN_STYLE}>
          <Stack gap="md">
            <TextField placeholder="Default" />
            <TextField defaultValue="Filled value" />
            <TextField defaultValue="Disabled" disabled />
            <TextField defaultValue="ReadOnly" readOnly />
            <TextField
              label="Email"
              defaultValue="bad@"
              error="Niepoprawny adres email"
            />
            <TextField
              label="Email"
              defaultValue="bad@"
              error="Niepoprawny adres email"
              showErrorPopover
            />
          </Stack>
        </div>
      </ComponentShowcase>

      {/* 5. Textarea — Variants + States */}
      <ComponentShowcase
        title="Textarea — warianty i stany"
        caption="Textarea współdzieli architekturę z TextField (compound/standalone/bare, sm/md/lg, error states). Brak icon slots. rows kontroluje wysokość; resize: vertical."
        info={
          <SpecimenInfo
            id="Textarea"
            hint="rows=4 default; resize: vertical (handle bottom-right)"
          />
        }
      >
        <div style={SPECIMEN_STYLE}>
          <Stack gap="md">
            <Textarea
              label="Notatka"
              placeholder="Wpisz krótki opis..."
              helperText="Maks 500 znaków"
              maxLength={500}
            />
            <Textarea
              label="Komentarz"
              defaultValue="Disabled — nieedytowalny"
              disabled
            />
            <Textarea
              label="Uwagi"
              defaultValue="Zbyt krótkie"
              error="Wpisz co najmniej 20 znaków"
            />
          </Stack>
        </div>
      </ComponentShowcase>

      {/* 6. Error popover spotlight — short vs long messages */}
      <ComponentShowcase
        title="Error popover — spotlight"
        caption="showErrorPopover (Stage 4, opt-in). FieldMessage zawsze widoczny pod inputem (a11y baseline). AlertCircle w iconRight slot otwiera popover z pełną wiadomością — przydatne dla długich błędów które byłyby niezgrabne inline."
        info={
          <SpecimenInfo
            id="showErrorPopover"
            hint="standalone mode only; uncontrolled (Popover internal state)"
          />
        }
      >
        <Inline gap="md" align="start" wrap>
          <Stack gap="xs">
            <Text variant="caption" color="muted">
              Krótki error (popover redundant)
            </Text>
            <div style={SPECIMEN_STYLE}>
              <TextField
                label="PIN"
                defaultValue="12"
                error="PIN za krótki"
                showErrorPopover
              />
            </div>
          </Stack>

          <Stack gap="xs">
            <Text variant="caption" color="muted">
              Długi error (popover odciąża inline)
            </Text>
            <div style={SPECIMEN_STYLE}>
              <TextField
                type="password"
                label="Hasło"
                defaultValue="weak123"
                error={longErrorMessage}
                showErrorPopover
              />
            </div>
          </Stack>

          <Stack gap="xs">
            <Text variant="caption" color="muted">
              Textarea z popoverem
            </Text>
            <div style={SPECIMEN_STYLE}>
              <Textarea
                label="Opis"
                defaultValue="Brak"
                error={longErrorMessage}
                showErrorPopover
              />
            </div>
          </Stack>
        </Inline>
      </ComponentShowcase>

      {/* 7. Select — Architecture: 3 modes side-by-side */}
      <ComponentShowcase
        title="Select — architektura 3 trybów"
        caption="Mirror TextField API: compound (Field-wrapped, consumer chrome), standalone (label/helperText/error props), bare (sam trigger). Opcje w stylu systemowego wiersza menu (PopoverItem): ikona w kopercie + tytuł + opis. Greenfield a11y: listbox/option + aria-activedescendant."
        info={
          <SpecimenInfo
            id="Select"
            hint="opcje reuse .eui-popover-item* (icon envelope + title + subtitle); li role=option zachowane"
          />
        }
      >
        <Inline gap="md" align="start" wrap>
          <Stack gap="xs">
            <Text variant="caption" color="muted">
              Compound (Field-wrapped)
            </Text>
            <div style={SPECIMEN_STYLE}>
              <Field id="category-compound" required>
                <FieldLabel>Kategoria</FieldLabel>
                <FieldControl>
                  <Select
                    options={CATEGORIES}
                    value={category}
                    onChange={setCategory}
                    placeholder="Wybierz kategorię"
                  />
                </FieldControl>
                <FieldMessage>Wymagana do utworzenia oferty</FieldMessage>
              </Field>
            </div>
          </Stack>

          <Stack gap="xs">
            <Text variant="caption" color="muted">
              Standalone (props)
            </Text>
            <div style={SPECIMEN_STYLE}>
              <Select
                options={CATEGORIES}
                label="Kategoria"
                helperText="Wymagana do utworzenia oferty"
                placeholder="Wybierz kategorię"
                required
              />
            </div>
          </Stack>

          <Stack gap="xs">
            <Text variant="caption" color="muted">
              Bare (trigger only)
            </Text>
            <div style={SPECIMEN_STYLE}>
              <Select
                options={CATEGORIES}
                placeholder="Wybierz kategorię"
              />
            </div>
          </Stack>
        </Inline>
      </ComponentShowcase>

      {/* 8. Select — Sizes */}
      <ComponentShowcase
        title="Select — rozmiary"
        caption="3 rozmiary mirror TextField: sm (36px, gęste tabele), md (44px, default), lg (52px, hero forms). Padding + font-size + chevron skala proporcjonalnie."
        info={
          <SpecimenInfo
            id="Select"
            hint="trigger frame matches eui-textfield-input sizes (sm/md/lg)"
          />
        }
      >
        <div style={SPECIMEN_STYLE}>
          <Stack gap="md">
            <Select size="sm" options={CATEGORIES} placeholder="Small (36px)" />
            <Select size="md" options={CATEGORIES} placeholder="Medium (44px)" />
            <Select size="lg" options={CATEGORIES} placeholder="Large (52px)" />
          </Stack>
        </div>
      </ComponentShowcase>

      {/* 9. Select — States */}
      <ComponentShowcase
        title="Select — stany"
        caption="Default (placeholder), wybrana wartość, disabled (native attr), error (border-color danger via [aria-invalid]), opcje z disabled flag (pomijane przez keyboard nav)."
        info={
          <SpecimenInfo
            id="Select"
            hint='error via CSS [aria-invalid="true"]; disabled options skip keyboard nav'
          />
        }
      >
        <div style={SPECIMEN_STYLE}>
          <Stack gap="md">
            <Select
              options={CATEGORIES}
              placeholder="Default — bez wartości"
            />
            <Select
              options={CATEGORIES}
              defaultValue="apartament"
            />
            <Select
              options={CATEGORIES}
              defaultValue="domek"
              disabled
            />
            <Select
              options={CATEGORIES}
              label="Kategoria"
              error="Wybierz kategorię przed zapisem"
            />
            <Select
              options={CATEGORIES_WITH_DISABLED}
              label="Z disabled opcją"
              helperText="Opcja 'Pokój' jest wyłączona — keyboard ją pomija"
              placeholder="Wybierz..."
            />
          </Stack>
        </div>
      </ComponentShowcase>

      {/* 10. Select — z ikonami vs bez ikon (explicit comparison) */}
      <ComponentShowcase
        title="Select — z ikonami vs bez ikon"
        caption="Ten sam komponent, dwa warianty SelectOption. Z ikonami: koperta + tytuł + opis (systemowy wiersz menu). Bez ikon: sama etykieta, brak pustej koperty, tytuł flush-left. icon? i description? są opcjonalne — graceful degradation."
        info={
          <SpecimenInfo
            id="Select"
            hint="SelectOption.icon?/description? opcjonalne; brak → degradacja do czystego title"
          />
        }
      >
        <Inline gap="md" align="start" wrap>
          <Stack gap="xs">
            <Text variant="caption" color="muted">
              Z ikonami (icon + description)
            </Text>
            <div style={SPECIMEN_STYLE}>
              <Select
                options={CATEGORIES}
                defaultValue="domek"
                label="Kategoria"
              />
            </div>
          </Stack>

          <Stack gap="xs">
            <Text variant="caption" color="muted">
              Bez ikon (sama etykieta)
            </Text>
            <div style={SPECIMEN_STYLE}>
              <Select
                options={CATEGORIES_PLAIN}
                defaultValue="domek"
                label="Kategoria"
              />
            </div>
          </Stack>
        </Inline>
      </ComponentShowcase>

      {/* 11. Select — many options + keyboard nav */}
      <ComponentShowcase
        title="Select — długa lista bez ikon (keyboard test)"
        caption="16 krajów BEZ icon/description — pokazuje graceful degradation: brak ikony → brak pustej koperty, tytuł flush-left (kompatybilność wsteczna). Test scroll listboxa (max-height 60vh), keyboard nav (ArrowUp/Down/Home/End), aria-activedescendant."
        info={
          <SpecimenInfo
            id="Select"
            hint="opcje text-only: .eui-popover-item bez .eui-popover-item-icon → title flush-left"
          />
        }
      >
        <div style={SPECIMEN_STYLE}>
          <Select
            options={COUNTRIES}
            value={country}
            onChange={setCountry}
            label="Kraj"
            helperText="Tab → trigger; Enter/Space/ArrowDown → otwórz; Arrow/Home/End → highlight; Enter → wybierz; Esc → zamknij"
          />
        </div>
      </ComponentShowcase>
    </LabSection>
  );
}
