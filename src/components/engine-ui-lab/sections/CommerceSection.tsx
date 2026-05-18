"use client";

import * as React from "react";
import { Receipt, Moon, BadgePercent, Sparkles } from "lucide-react";

import {
  NightsMeta,
  PriceBadge,
  PriceText,
} from "@/components/engine-ui/text";
import { Stack } from "@/components/engine-ui/layout/Stack";
import { Inline } from "@/components/engine-ui/layout/Inline";

import { LabSection } from "../LabSection";
import { ComponentShowcase } from "../ComponentShowcase";
import { SpecimenInfo } from "../Specimen";

// Single-column, fill cross-axis + cap (ten sam wzorzec co Inputy/Feedback —
// parent .eui-lab-showcase-preview to flex-COLUMN; width 100% + maxWidth).
const SPECIMEN_STYLE: React.CSSProperties = { width: "100%", maxWidth: 420 };

export function CommerceSection() {
  return (
    <LabSection
      id="commerce"
      title="Commerce / Utility"
      icon={<Receipt />}
      description="Mały finalny Part 13 (zakres przycięty w pre-checku). NightsMeta + kanoniczny formatter nocy, PriceBadge promo-flag. DROP: ReviewSummary→RatingPill, PolicyLink→SecondaryLink external, AmenityChip→FeatureChips (zero duplikatów dla odkrywalności). DEFER: SortMenu/Pagination/Breadcrumb (brak popytu engine-ui)."
    >
      {/* 1. NightsMeta — kanoniczna pluralizacja nocy */}
      <ComponentShowcase
        title="NightsMeta — liczba nocy"
        caption="Cienki preset na MetaText. Kanoniczny util formatNights/nightsLabel = jedno źródło PL pluralizacji (1 → noc, 2-4 → noce, 5+ → nocy). Reguła uproszczona = parytet z istniejącym kodem; dedup ~40 call-sites = osobny cleanup-later (PO D3)."
        info={
          <SpecimenInfo
            id="NightsMeta"
            hint="nights · variant (default/primary) · iconLeft · as — forward do MetaText"
          />
        }
      >
        <Stack gap="sm" style={SPECIMEN_STYLE}>
          <NightsMeta nights={1} />
          <NightsMeta nights={3} />
          <NightsMeta nights={7} />
          <NightsMeta nights={14} />
          <NightsMeta nights={5} variant="primary" />
          <NightsMeta nights={2} iconLeft={<Moon size={12} aria-hidden="true" />} />
        </Stack>
      </ComponentShowcase>

      {/* 2. PriceBadge — promo-flag przy cenie */}
      <ComponentShowcase
        title="PriceBadge — promo-flag"
        caption="Canonical następca legacy .eui-price-badge / .eui-card-price-badge. Token-kolor var(--eui-success) (spłaca dług hardcoded #16a34a), ZERO external margin — odstęp własi rodzic (tu: Stack/Inline gap). Własna klasa .eui-price-flag; PriceBlock/ResultCard nietknięte (PO D7=C, migracja = cleanup-later)."
        info={
          <SpecimenInfo
            id="PriceBadge"
            hint="size (sm 11px / md 13px) · icon · as · children"
          />
        }
      >
        <Stack gap="md" style={SPECIMEN_STYLE}>
          <Inline gap="md" wrap>
            <PriceBadge size="sm">Najlepsza cena</PriceBadge>
            <PriceBadge size="md">Najlepsza cena</PriceBadge>
          </Inline>
          <Inline gap="md" wrap>
            <PriceBadge icon={<BadgePercent aria-hidden="true" />}>
              Promocja −15%
            </PriceBadge>
            <PriceBadge icon={<Sparkles aria-hidden="true" />}>
              Wyróżnione
            </PriceBadge>
          </Inline>
          {/* W kontekście ceny — odstęp daje Stack gap, NIE komponent */}
          <Stack gap="xs">
            <PriceBadge size="sm">Najlepsza cena</PriceBadge>
            <PriceText amount={189} per="night" variant="primary" />
          </Stack>
        </Stack>
      </ComponentShowcase>
    </LabSection>
  );
}
