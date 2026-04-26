"use client";

import * as React from "react";
import { Tag as TagIcon, Flame, Sparkles, Bell, ParkingCircle } from "lucide-react";
import { LabSection } from "../LabSection";
import { ComponentShowcase } from "../ComponentShowcase";
import { SpecimenInfo } from "../Specimen";
import { DebugPanel } from "../DebugPanel";
import { Chip } from "@/components/engine-ui/chip/Chip";
import { FilterChip } from "@/components/engine-ui/chip/FilterChip";
import { Tag } from "@/components/engine-ui/chip/Tag";
import { Badge } from "@/components/engine-ui/chip/Badge";
import { TinyBadge } from "@/components/engine-ui/chip/TinyBadge";
import { StatusDot } from "@/components/engine-ui/chip/StatusDot";
import { RatingPill } from "@/components/engine-ui/chip/RatingPill";
import { InlineBadge } from "@/components/engine-ui/chip/InlineBadge";
import { IconButton } from "@/components/engine-ui/button/IconButton";

export function ChipSection() {
  const [removableChips, setRemovableChips] = React.useState(["Kraków", "Domki", "WiFi"]);
  const [selectedFilters, setSelectedFilters] = React.useState<Set<string>>(new Set(["WiFi"]));

  const toggleFilter = (name: string) => {
    setSelectedFilters((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name); else next.add(name);
      return next;
    });
  };

  return (
    <LabSection id="chip" title="Tagi i badge'y" icon={<TagIcon />}
      description="Chipy, tagi, badge'e, statusy, rating. Pill-shaped mikro-typografia."
    >
      {/* ── Chip variants ── */}
      <ComponentShowcase title="Chip — warianty" caption="6 wariantów pokrywających typowe scenariusze."
        info={
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
            <SpecimenInfo id="variant=neutral" hint="Domyślny label." />
            <SpecimenInfo id="variant=active" hint="Wybrany filter." />
            <SpecimenInfo id="variant=outline" hint="Przed wyborem." />
            <SpecimenInfo id="variant=brand" hint="Promo, featured." />
            <SpecimenInfo id="variant=success" hint="Dostępne." />
            <SpecimenInfo id="variant=warning" hint="Limitowane." />
          </div>
        }
      >
        <div className="eui-chip-group">
          <Chip variant="neutral">Neutralny</Chip>
          <Chip variant="active">Aktywny</Chip>
          <Chip variant="outline">Outline</Chip>
          <Chip variant="brand">Brand</Chip>
          <Chip variant="success">Dostępne</Chip>
          <Chip variant="warning">Limitowane</Chip>
        </div>
      </ComponentShowcase>

      {/* ── Chip sizes ── */}
      <ComponentShowcase title="Chip — rozmiary" caption="SM kompaktowy, MD domyślny."
        info={
          <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
            <SpecimenInfo id="size=sm · 28h" hint="Kompaktowe listy." />
            <SpecimenInfo id="size=md · 32h" hint="Domyślny." />
          </div>
        }
      >
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <Chip size="sm" variant="neutral">Small</Chip>
          <Chip size="md" variant="neutral">Medium</Chip>
        </div>
      </ComponentShowcase>

      {/* ── Chip with icon + count ── */}
      <ComponentShowcase title="Chip — ikona + count" caption="Leading icon i licznik w nawiasie."
        info={<SpecimenInfo id="iconLeft + count" hint="Ikona + label + liczba." />}
      >
        <Chip variant="active" iconLeft={<Flame size={14} />} count={3}>Popularne</Chip>
      </ComponentShowcase>

      {/* ── Chip removable ── */}
      <ComponentShowcase title="Chip — removable" caption="Kliknij X żeby usunąć."
        info={
          <>
            <SpecimenInfo id="onRemove" hint="X button. stopPropagation." />
            <DebugPanel fields={[{ label: "visible", value: removableChips.join(", ") || "brak" }]} />
          </>
        }
      >
        <div className="eui-chip-group">
          {removableChips.map((c) => (
            <Chip key={c} variant="neutral"
              onRemove={() => setRemovableChips((prev) => prev.filter((x) => x !== c))}>
              {c}
            </Chip>
          ))}
          {removableChips.length === 0 && (
            <span style={{ fontSize: 13, color: "var(--eui-text-secondary)" }}>Wszystkie usunięte</span>
          )}
        </div>
      </ComponentShowcase>

      {/* ── FilterChip interactive ── */}
      <ComponentShowcase title="FilterChip — interactive" caption="Toggle active ↔ outline. Zero duplikacji Chip."
        info={
          <>
            <SpecimenInfo id="FilterChip" hint="Specjalizacja Chip. selected toggle." />
            <DebugPanel fields={[{ label: "selected", value: Array.from(selectedFilters).join(", ") || "brak" }]} />
          </>
        }
      >
        <div className="eui-chip-group">
          {["Kuchnia", "Parking", "WiFi", "Basen", "Sauna"].map((f) => (
            <FilterChip key={f} selected={selectedFilters.has(f)} onSelectedChange={() => toggleFilter(f)}>
              {f}
            </FilterChip>
          ))}
        </div>
      </ComponentShowcase>

      {/* ── Tag variants ── */}
      <ComponentShowcase title="Tag — warianty" caption="Statyczny label. Nie interactive."
        info={
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
            <SpecimenInfo id="variant=neutral" hint="Domyślny." />
            <SpecimenInfo id="variant=brand" hint="Promo, nowe." />
            <SpecimenInfo id="variant=success" hint="Dostępne." />
            <SpecimenInfo id="variant=warning" hint="Ograniczone." />
            <SpecimenInfo id="variant=danger" hint="Uwaga, ważne." />
            <SpecimenInfo id="variant=info" hint="Informacja." />
          </div>
        }
      >
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Tag variant="neutral">Neutralny</Tag>
          <Tag variant="brand">Nowość</Tag>
          <Tag variant="success">Dostępne</Tag>
          <Tag variant="warning">Ostatnie</Tag>
          <Tag variant="danger">Uwaga</Tag>
          <Tag variant="info">Info</Tag>
        </div>
      </ComponentShowcase>

      {/* ── Tag with icon ── */}
      <ComponentShowcase title="Tag — z ikoną" caption="Opcjonalna ikona leading 12px."
        info={<SpecimenInfo id="iconLeft" hint="Ikona wzmacnia kontekst." />}
      >
        <Tag variant="brand" iconLeft={<Sparkles />}>Nowość</Tag>
      </ComponentShowcase>

      {/* ── Badge variants ── */}
      <ComponentShowcase title="Badge — warianty" caption="Corner accent. Uppercase, letter-spacing."
        info={
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
            <SpecimenInfo id="variant=neutral" hint="Ciemny bg, biały tekst." />
            <SpecimenInfo id="variant=brand" hint="Brand color." />
            <SpecimenInfo id="variant=outline" hint="Border, przezroczyste." />
            <SpecimenInfo id="variant=success" hint="Sukces soft." />
            <SpecimenInfo id="variant=warning" hint="Ostrzeżenie soft." />
            <SpecimenInfo id="variant=danger" hint="Niebezpieczeństwo soft." />
          </div>
        }
      >
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <Badge variant="neutral">Nowe</Badge>
          <Badge variant="brand">Promo</Badge>
          <Badge variant="outline">Draft</Badge>
          <Badge variant="success">OK</Badge>
          <Badge variant="warning">Uwaga</Badge>
          <Badge variant="danger">Ważne</Badge>
        </div>
      </ComponentShowcase>

      {/* ── Badge sizes + shape ── */}
      <ComponentShowcase title="Badge — rozmiary i kształt" caption="XS/SM + pill/rounded."
        info={
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
            <SpecimenInfo id="size=xs · 18h" hint="Kompaktowy." />
            <SpecimenInfo id="size=sm · 22h" hint="Standardowy." />
            <SpecimenInfo id="shape=rounded" hint="Dla liczb (99+)." />
          </div>
        }
      >
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <Badge size="xs">XS</Badge>
          <Badge size="sm">SM</Badge>
          <Badge size="xs" shape="rounded">99+</Badge>
        </div>
      </ComponentShowcase>

      {/* ── TinyBadge ── */}
      <ComponentShowcase title="TinyBadge" caption="Minimalny badge. Notification counter."
        info={
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
            <SpecimenInfo id="variant=neutral" hint="Ciemny." />
            <SpecimenInfo id="variant=brand" hint="Brand color." />
            <SpecimenInfo id="variant=danger" hint="Powiadomienia." />
          </div>
        }
      >
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <TinyBadge variant="neutral">3</TinyBadge>
          <TinyBadge variant="brand">NEW</TinyBadge>
          <div style={{ position: "relative", display: "inline-block" }}>
            <IconButton icon={<Bell />} aria-label="Powiadomienia" variant="soft" />
            <TinyBadge variant="danger" style={{ position: "absolute", top: -4, right: -4 }}>3</TinyBadge>
          </div>
        </div>
      </ComponentShowcase>

      {/* ── StatusDot variants ── */}
      <ComponentShowcase title="StatusDot — warianty" caption="Kropka stanu. New pulsuje."
        info={
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
            <SpecimenInfo id="available" hint="Zielony. Dostępne." />
            <SpecimenInfo id="limited" hint="Pomarańczowy. Ograniczone." />
            <SpecimenInfo id="unavailable" hint="Szary. Niedostępne." />
            <SpecimenInfo id="promo" hint="Brand. Promocja." />
            <SpecimenInfo id="new" hint="Brand + pulse. Nowość." />
          </div>
        }
      >
        <div style={{ display: "flex", gap: 24, alignItems: "center", flexWrap: "wrap" }}>
          <StatusDot variant="available" label="Dostępne" />
          <StatusDot variant="limited" label="Ostatnie 2" />
          <StatusDot variant="unavailable" label="Niedostępne" />
          <StatusDot variant="promo" label="Promocja" />
          <StatusDot variant="new" label="Nowość" />
        </div>
      </ComponentShowcase>

      {/* ── RatingPill variants ── */}
      <ComponentShowcase title="RatingPill — warianty" caption="Gwiazdka + score. Airbnb-style."
        info={
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
            <SpecimenInfo id="variant=solid" hint="Karty Results, overlay." />
            <SpecimenInfo id="variant=soft" hint="Detail page, statyczny." />
            <SpecimenInfo id="variant=inline" hint="Inline w tekście." />
          </div>
        }
      >
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <RatingPill variant="solid" score={4.92} />
          <RatingPill variant="soft" score={4.92} count={38} />
          <RatingPill variant="inline" score={4.92} count={38} />
        </div>
      </ComponentShowcase>

      {/* ── RatingPill sizes ── */}
      <ComponentShowcase title="RatingPill — rozmiary" caption="SM kompaktowy, MD domyślny."
        info={
          <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
            <SpecimenInfo id="size=sm · 22h" hint="Kompaktowe karty." />
            <SpecimenInfo id="size=md · 28h" hint="Domyślny." />
          </div>
        }
      >
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <RatingPill variant="solid" score={4.87} size="sm" />
          <RatingPill variant="solid" score={4.87} size="md" />
        </div>
      </ComponentShowcase>

      {/* ── InlineBadge ── */}
      <ComponentShowcase title="InlineBadge" caption="Badge inline w tekście. Baseline-aligned."
        info={
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
            <SpecimenInfo id="variant=neutral" hint="Szary, neutralny." />
            <SpecimenInfo id="variant=brand" hint="Brand color." />
            <SpecimenInfo id="variant=success" hint="Pozytywny." />
            <SpecimenInfo id="variant=warning" hint="Uwaga." />
            <SpecimenInfo id="variant=danger" hint="Krytyczne." />
          </div>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <p style={{ margin: 0, fontSize: 14, color: "var(--eui-text-primary)" }}>
            Domek Hobbit Shire<InlineBadge variant="brand">Polecamy</InlineBadge>
          </p>
          <p style={{ margin: 0, fontSize: 14, color: "var(--eui-text-primary)" }}>
            Pokój Komfort<InlineBadge variant="success">Dostępny</InlineBadge>
          </p>
          <p style={{ margin: 0, fontSize: 14, color: "var(--eui-text-primary)" }}>
            Domek Rivendell<InlineBadge variant="warning">Ostatni</InlineBadge>
          </p>
          <p style={{ margin: 0, fontSize: 14, color: "var(--eui-text-primary)" }}>
            Rezerwacja #1042<InlineBadge variant="danger">Anulowana</InlineBadge>
          </p>
          <p style={{ margin: 0, fontSize: 14, color: "var(--eui-text-primary)" }}>
            Sezon letni 2026<InlineBadge variant="neutral">Draft</InlineBadge>
          </p>
        </div>
      </ComponentShowcase>
    </LabSection>
  );
}
