"use client";

import * as React from "react";
import { Layout as LayoutIcon, Edit3, Share2, Trash2 } from "lucide-react";
import {
  Stack,
  Inline,
  Spacer,
  Divider,
  ActionRow,
  Toolbar,
  InlineActions,
  SectionBlock,
  StickyBar,
} from "@/components/engine-ui/layout";
import { Button } from "@/components/engine-ui/button/Button";
import { IconButton } from "@/components/engine-ui/button/IconButton";
import { Tag } from "@/components/engine-ui/chip/Tag";
import { FilterChip } from "@/components/engine-ui/chip/FilterChip";
import { Text } from "@/components/engine-ui/text/Text";
import { PriceText } from "@/components/engine-ui/text/PriceText";
import { SortTrigger } from "@/components/engine-ui/nav/SortTrigger";
import { LabSection } from "../LabSection";
import { ComponentShowcase } from "../ComponentShowcase";
import { SpecimenInfo } from "../Specimen";

export function LayoutSection() {
  const [filters, setFilters] = React.useState<Set<string>>(new Set(["Domek"]));
  const toggleFilter = (name: string) => {
    setFilters((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name); else next.add(name);
      return next;
    });
  };

  return (
    <LabSection
      id="layout"
      title="Layout + Action"
      icon={<LayoutIcon />}
      description="Generyczne kontenery flex + action wrappers. Compose, don't extend — sticky przez StickyBar, nie przez prop."
    >
      {/* 1. Divider — horizontal */}
      <ComponentShowcase title="Divider — horizontal" caption="Semantyczny <hr>. Structuralny separator."
        info={<SpecimenInfo id="orientation=horizontal" hint="<hr>. Screen reader widzi separator." />}
      >
        <div style={{ width: "100%", maxWidth: 360 }}>
          <Text>Sekcja A</Text>
          <Divider spacing="md" />
          <Text>Sekcja B</Text>
        </div>
      </ComponentShowcase>

      {/* 2. Divider — vertical decorative */}
      <ComponentShowcase title="Divider — vertical (decorative)" caption="Dekoracyjna kreska w meta info. aria-hidden."
        info={<SpecimenInfo id="decorative=true" hint="<div aria-hidden>. AT pomija." />}
      >
        <Inline gap="sm" align="center">
          <Text>4.92 ★</Text>
          <Divider orientation="vertical" decorative />
          <Text>Kraków</Text>
          <Divider orientation="vertical" decorative />
          <Text>2 gości</Text>
        </Inline>
      </ComponentShowcase>

      {/* 3. Stack — gap warianty */}
      <ComponentShowcase title="Stack — gap warianty" caption="Flex column. xs(4px) do xl(24px)."
        info={<SpecimenInfo id="gap" hint='"xs"|"sm"|"md"|"lg"|"xl" lub 1-11.' />}
      >
        <Inline gap="xl" align="start" style={{ flexWrap: "wrap" }}>
          {(["xs", "sm", "md", "lg", "xl"] as const).map((g) => (
            <Stack key={g} gap={g} style={{ minWidth: 80 }}>
              <Text variant="caption">gap="{g}"</Text>
              <div style={{ width: 60, height: 24, background: "var(--eui-grey-200)", borderRadius: 4 }} />
              <div style={{ width: 60, height: 24, background: "var(--eui-grey-200)", borderRadius: 4 }} />
              <div style={{ width: 60, height: 24, background: "var(--eui-grey-200)", borderRadius: 4 }} />
            </Stack>
          ))}
        </Inline>
      </ComponentShowcase>

      {/* 4. Stack — align */}
      <ComponentShowcase title="Stack — align" caption="Cross-axis alignment."
        info={<SpecimenInfo id="align" hint='"start"|"center"|"end"|"stretch".' />}
      >
        <Inline gap="lg" style={{ flexWrap: "wrap" }}>
          {(["start", "center", "end", "stretch"] as const).map((a) => (
            <Stack key={a} gap="sm" align={a} style={{ minWidth: 100, height: 80, background: "var(--eui-grey-100)", padding: 8, borderRadius: 8 }}>
              <Text variant="caption">{a}</Text>
              <div style={{ width: 40, height: 20, background: "var(--eui-brand)", borderRadius: 4 }} />
            </Stack>
          ))}
        </Inline>
      </ComponentShowcase>

      {/* 5. Inline — basic z wrap */}
      <ComponentShowcase title="Inline — basic z wrap" caption="Flex row. Wrap domyślnie true."
        info={<SpecimenInfo id="Inline" hint="Row z wrap. Tagi, chipy, buttony." />}
      >
        <div style={{ maxWidth: 320 }}>
          <Inline gap="sm">
            <Tag>Wakacje</Tag>
            <Tag>Hobbitowa wioska</Tag>
            <Tag>Bieszczady</Tag>
            <Tag>Domek</Tag>
            <Tag>Restauracja</Tag>
            <Tag>Kajaki</Tag>
          </Inline>
        </div>
      </ComponentShowcase>

      {/* 6. Inline — justify between */}
      <ComponentShowcase title="Inline — justify between" caption="Rozparte elementy. Cena po prawej."
        info={<SpecimenInfo id="justify=between" hint="space-between." />}
      >
        <div style={{ width: "100%", maxWidth: 360 }}>
          <Inline gap="md" justify="between">
            <Text variant="title-3">Cena za noc</Text>
            <PriceText amount={250} per="night" />
          </Inline>
        </div>
      </ComponentShowcase>

      {/* 7. Spacer — sizes */}
      <ComponentShowcase title="Spacer — sizes" caption="Pusta przestrzeń. Escape hatch (preferuj Stack gap)."
        info={<SpecimenInfo id="Spacer" hint="xs→2xl. aria-hidden." />}
      >
        <Stack gap="none" style={{ width: 120 }}>
          {(["xs", "sm", "md", "lg", "xl", "2xl"] as const).map((s, i) => (
            <React.Fragment key={s}>
              {i > 0 && <Spacer size={s} />}
              <div style={{ height: 16, background: "var(--eui-brand)", display: "flex", alignItems: "center", paddingLeft: 8, borderRadius: 4 }}>
                <Text variant="caption" style={{ color: "white" }}>{s}</Text>
              </div>
            </React.Fragment>
          ))}
        </Stack>
      </ComponentShowcase>

      {/* 8. ActionRow — between (Material) */}
      <ComponentShowcase title="ActionRow — between (Material)" caption="Anuluj lewo, Zapisz prawo."
        info={<SpecimenInfo id="align=between" hint="Material Design pattern." />}
      >
        <div style={{ width: "100%", maxWidth: 360 }}>
          <ActionRow align="between">
            <Button variant="ghost">Anuluj</Button>
            <Button variant="primary">Zapisz</Button>
          </ActionRow>
        </div>
      </ComponentShowcase>

      {/* 9. ActionRow — between-reverse (iOS) */}
      <ComponentShowcase title="ActionRow — between-reverse (iOS)" caption="Visual: primary lewo. flex-direction: row-reverse."
        info={<SpecimenInfo id="align=between-reverse" hint="Visual-only. DOM/tab order niezmieniony. Użyj 'between' chyba że masz powód." />}
      >
        <div style={{ width: "100%", maxWidth: 360 }}>
          <ActionRow align="between-reverse">
            <Button variant="ghost">Anuluj</Button>
            <Button variant="primary">Zapisz</Button>
          </ActionRow>
        </div>
      </ComponentShowcase>

      {/* 10. ActionRow — center */}
      <ComponentShowcase title="ActionRow — center" caption="Single centered CTA."
        info={<SpecimenInfo id="align=center" hint="Jeden przycisk na środku." />}
      >
        <div style={{ width: "100%", maxWidth: 360 }}>
          <ActionRow align="center">
            <Button variant="primary">Sprawdź dostępność</Button>
          </ActionRow>
        </div>
      </ComponentShowcase>

      {/* 11. Toolbar — left + right */}
      <ComponentShowcase title="Toolbar — left + right" caption="Filter chips lewo, sort prawo. 3-slot layout."
        info={<SpecimenInfo id="Toolbar" hint="left, center (optional), right slots." />}
      >
        <div style={{ width: "100%", maxWidth: 600 }}>
          <Toolbar
            left={
              <Inline gap="xs">
                <FilterChip selected={filters.has("Domek")} onSelectedChange={() => toggleFilter("Domek")}>Domek</FilterChip>
                <FilterChip selected={filters.has("Pokój")} onSelectedChange={() => toggleFilter("Pokój")}>Pokój</FilterChip>
                <FilterChip selected={filters.has("Hala")} onSelectedChange={() => toggleFilter("Hala")}>Hala</FilterChip>
              </Inline>
            }
            right={<SortTrigger direction={null}>Cena</SortTrigger>}
          />
        </div>
      </ComponentShowcase>

      {/* 12. InlineActions — compact */}
      <ComponentShowcase title="InlineActions — compact (gap=xs)" caption="Cluster ikon akcji. Tight spacing."
        info={<SpecimenInfo id="InlineActions" hint="Default gap xs (4px). Icon buttons." />}
      >
        <InlineActions>
          <IconButton size="sm" icon={<Edit3 size={16} />} aria-label="Edytuj" />
          <IconButton size="sm" icon={<Share2 size={16} />} aria-label="Udostępnij" />
          <IconButton size="sm" icon={<Trash2 size={16} />} variant="ghost" aria-label="Usuń" />
        </InlineActions>
      </ComponentShowcase>

      {/* 13. SectionBlock — z heading */}
      <ComponentShowcase title="SectionBlock — heading + content" caption="Semantyczny <section> z SectionHeading."
        info={<SpecimenInfo id="SectionBlock" hint="heading: SectionHeadingProps. Compose." />}
      >
        <SectionBlock
          heading={{
            title: "Polecane domki",
            description: "Najczęściej wybierane przez gości",
            size: "md",
          }}
        >
          <Stack gap="sm">
            <div style={{ height: 60, background: "var(--eui-grey-100)", borderRadius: 8 }} />
            <div style={{ height: 60, background: "var(--eui-grey-100)", borderRadius: 8 }} />
          </Stack>
        </SectionBlock>
      </ComponentShowcase>

      {/* 14. StickyBar — bottom mock */}
      <ComponentShowcase title="StickyBar — bottom (mobile CTA)" caption="Sticky na dole. Solid bg domyślnie. Blur opt-in."
        info={<SpecimenInfo id="StickyBar" hint="position=bottom. border=true. safeArea=true." />}
      >
        <div
          style={{
            position: "relative",
            height: 200,
            border: "1px solid var(--eui-grey-200)",
            borderRadius: 12,
            overflow: "hidden",
            background: "var(--eui-grey-50)",
          }}
        >
          <Stack gap="md" style={{ padding: 16, paddingBottom: 80 }}>
            <Text variant="title-3">Domek hobbita #1</Text>
            <Text variant="body">Cozy retreat w Bieszczadach z widokiem na góry.</Text>
            <Text variant="caption" color="muted">Mock content — sticky bar na dole kontenera</Text>
          </Stack>
          <StickyBar position="bottom" border>
            <Inline gap="md" justify="between" align="center">
              <PriceText amount={250} per="night" />
              <Button variant="primary">Zarezerwuj</Button>
            </Inline>
          </StickyBar>
        </div>
      </ComponentShowcase>
    </LabSection>
  );
}
