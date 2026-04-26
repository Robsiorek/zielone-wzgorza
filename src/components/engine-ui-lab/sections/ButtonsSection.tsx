"use client";

import * as React from "react";
import { Search, ArrowRight, Heart, X, MousePointerClick } from "lucide-react";
import { LabSection } from "../LabSection";
import { ComponentShowcase } from "../ComponentShowcase";
import { SpecimenInfo } from "../Specimen";
import { DebugPanel } from "../DebugPanel";
import {
  Button, IconButton, ButtonGroup, ToggleButton,
  CloseButton, BackButton, FavoriteButton, ShareButton,
} from "@/components/engine-ui/button";

export function ButtonsSection() {
  const [view, setView] = React.useState("list");
  const [fav, setFav] = React.useState(false);

  return (
    <LabSection id="buttons" title="Przyciski" icon={<MousePointerClick />}
      description="System przycisków zbudowany na Pressable."
    >
      <ComponentShowcase title="Button — warianty" caption="6 wariantów do różnych kontekstów. Tylko jeden primary na widok."
        info={
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
            <SpecimenInfo id="primary" hint="Główne CTA. Jeden na widok." />
            <SpecimenInfo id="secondary" hint="Drugie akcje: Zapisz, Dalej." />
            <SpecimenInfo id="ghost" hint="Trzecie akcje, toolbary." />
            <SpecimenInfo id="subtle" hint="Ciche CTA, filtry." />
            <SpecimenInfo id="danger" hint="Destrukcyjne akcje." />
            <SpecimenInfo id="link" hint="Wygląda jak link tekst." />
          </div>
        }
      >
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <Button variant="primary">Zarezerwuj</Button>
          <Button variant="secondary">Zapisz</Button>
          <Button variant="ghost">Anuluj</Button>
          <Button variant="subtle">Więcej opcji</Button>
          <Button variant="danger">Usuń</Button>
          <Button variant="link">Szczegóły</Button>
        </div>
      </ComponentShowcase>

      <ComponentShowcase title="Button — rozmiary" caption="4 rozmiary. MD jest domyślny."
        info={
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
            <SpecimenInfo id="xs — 28px" hint="Tabele, inline akcje." />
            <SpecimenInfo id="sm — 36px" hint="Toolbary, karty." />
            <SpecimenInfo id="md — 44px" hint="Domyślny. Formularze." />
            <SpecimenInfo id="lg — 52px" hint="Hero, mobile footer." />
          </div>
        }
      >
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <Button size="xs" variant="secondary">XS</Button>
          <Button size="sm" variant="secondary">Small</Button>
          <Button size="md" variant="secondary">Medium</Button>
          <Button size="lg" variant="secondary">Large</Button>
        </div>
      </ComponentShowcase>

      <ComponentShowcase title="Button — ikony i stany" caption="Leading/trailing icon, loading, disabled, full-width."
        info={
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
            <SpecimenInfo id="iconLeft" hint="Ikona przed tekstem." />
            <SpecimenInfo id="iconRight" hint="Ikona za tekstem." />
            <SpecimenInfo id="loading" hint="Spinner. Blokuje klik." />
            <SpecimenInfo id="disabled" hint="40% opacity, not-allowed." />
            <SpecimenInfo id="fullWidth" hint="100% rodzica. Mobile footer." />
          </div>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
            <Button variant="secondary" iconLeft={<Search />}>Szukaj</Button>
            <Button variant="secondary" iconRight={<ArrowRight />}>Dalej</Button>
            <Button variant="primary" loading>Przetwarzam</Button>
            <Button variant="secondary" disabled>Niedostępne</Button>
          </div>
          <div style={{ maxWidth: 320 }}>
            <Button variant="primary" fullWidth>Pełna szerokość</Button>
          </div>
        </div>
      </ComponentShowcase>

      <ComponentShowcase title="IconButton — warianty" caption="4 warianty. Zawsze wymaga aria-label."
        info={
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
            <SpecimenInfo id="ghost" hint="Domyślny. Toolbary, menu." />
            <SpecimenInfo id="soft" hint="Szare tło. Wyraźne CTA." />
            <SpecimenInfo id="solid" hint="Ciemne tło. Silne CTA." />
            <SpecimenInfo id="inverse" hint="Białe. Na zdjęciach." />
          </div>
        }
      >
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <IconButton variant="ghost" icon={<Heart />} aria-label="Lubię" />
          <IconButton variant="soft" icon={<Heart />} aria-label="Lubię" />
          <IconButton variant="solid" icon={<Heart />} aria-label="Lubię" />
          <IconButton variant="inverse" icon={<Heart />} aria-label="Lubię" />
        </div>
      </ComponentShowcase>

      <ComponentShowcase title="IconButton — rozmiary" caption="4 rozmiary kwadratowe. MD domyślny."
        info={
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
            <SpecimenInfo id="xs — 24px" hint="Dismiss chip, inline." />
            <SpecimenInfo id="sm — 32px" hint="Karuzela, stepper." />
            <SpecimenInfo id="md — 40px" hint="Domyślny. Close, nav." />
            <SpecimenInfo id="lg — 48px" hint="Hero, floating action." />
          </div>
        }
      >
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <IconButton size="xs" variant="soft" icon={<X />} aria-label="Zamknij" />
          <IconButton size="sm" variant="soft" icon={<X />} aria-label="Zamknij" />
          <IconButton size="md" variant="soft" icon={<X />} aria-label="Zamknij" />
          <IconButton size="lg" variant="soft" icon={<X />} aria-label="Zamknij" />
        </div>
      </ComponentShowcase>

      <ComponentShowcase title="ButtonGroup — toggle" caption="Segmented control z jeżdżącym indicatorem."
        info={
          <>
            <SpecimenInfo id="toggle" hint="Przełącznik widoku. Sliding pill." />
            <DebugPanel fields={[{ label: "value", value: view }]} />
          </>
        }
      >
        <ButtonGroup variant="toggle" value={view} onValueChange={setView}>
          <ToggleButton value="list">Lista</ToggleButton>
          <ToggleButton value="map">Mapa</ToggleButton>
          <ToggleButton value="calendar">Kalendarz</ToggleButton>
        </ButtonGroup>
      </ComponentShowcase>

      <ComponentShowcase title="Presety" caption="Gotowe composites. Używaj bezpośrednio."
        info={
          <>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
              <SpecimenInfo id="CloseButton" hint="Zamknij modal/popover." />
              <SpecimenInfo id="BackButton" hint="Wróć. Mobilny header." />
              <SpecimenInfo id="FavoriteButton" hint="Serduszko z pulse." />
              <SpecimenInfo id="ShareButton" hint="Udostępnij zasób." />
            </div>
            <DebugPanel fields={[{ label: "favorited", value: String(fav) }]} />
          </>
        }
      >
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <CloseButton />
          <BackButton />
          <FavoriteButton favorited={fav} onChange={setFav} />
          <ShareButton />
        </div>
      </ComponentShowcase>
    </LabSection>
  );
}
