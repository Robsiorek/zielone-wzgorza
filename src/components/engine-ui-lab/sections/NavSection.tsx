"use client";

import * as React from "react";
import { Compass, Filter } from "lucide-react";
import { LabSection } from "../LabSection";
import { ComponentShowcase } from "../ComponentShowcase";
import { SpecimenInfo } from "../Specimen";
import { DebugPanel } from "../DebugPanel";
import { Chevron } from "@/components/engine-ui/nav/Chevron";
import { NavigationArrow } from "@/components/engine-ui/nav/NavigationArrow";
import { PaginationDot } from "@/components/engine-ui/nav/PaginationDot";
import { TabTrigger } from "@/components/engine-ui/nav/TabTrigger";
import { SortTrigger, type SortDirection } from "@/components/engine-ui/nav/SortTrigger";

export function NavSection() {
  const [activeTab, setActiveTab] = React.useState("domy");
  const [activeFilter, setActiveFilter] = React.useState("wszystkie");
  const [currentView, setCurrentView] = React.useState("lista");
  const [activeDot, setActiveDot] = React.useState(2);
  const [sortDir, setSortDir] = React.useState<SortDirection>(null);
  const [sortDir2, setSortDir2] = React.useState<SortDirection>("asc");

  return (
    <LabSection id="nav" title="Nawigacja" icon={<Compass />}
      description="Mikro-komponenty nawigacyjne: strzałki, kropki paginacji, tabs, sort."
    >
      {/* ── Chevron directions ── */}
      <ComponentShowcase title="Chevron — kierunki" caption="Ikona strzałki z kierunkiem. Nie button — czysta ikona."
        info={
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
            <SpecimenInfo id="direction=left" hint="W tył. Karuzele, miesiące." />
            <SpecimenInfo id="direction=right" hint="W przód. Nawigacja." />
            <SpecimenInfo id="direction=up" hint="Collapse, scroll up." />
            <SpecimenInfo id="direction=down" hint="Expand, dropdown." />
          </div>
        }
      >
        <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
          <Chevron direction="left" size={24} />
          <Chevron direction="right" size={24} />
          <Chevron direction="up" size={24} />
          <Chevron direction="down" size={24} />
        </div>
      </ComponentShowcase>

      {/* ── NavigationArrow — directions ── */}
      <ComponentShowcase title="NavigationArrow — kierunki" caption="IconButton + Chevron. Zero duplikacji logiki."
        info={
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
            <SpecimenInfo id="direction=left" hint="Soft. Kalendarz, listy." />
            <SpecimenInfo id="direction=right" hint="Soft. Nawigacja naprzód." />
            <SpecimenInfo id="direction=up" hint="Scroll up, collapse." />
            <SpecimenInfo id="direction=down" hint="Scroll down, expand." />
          </div>
        }
      >
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <NavigationArrow direction="left" />
          <NavigationArrow direction="right" />
          <NavigationArrow direction="up" />
          <NavigationArrow direction="down" />
        </div>
      </ComponentShowcase>

      {/* ── NavigationArrow — variants ── */}
      <ComponentShowcase title="NavigationArrow — warianty wizualne" caption="3 warianty na różne konteksty."
        info={
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
            <SpecimenInfo id="navVariant=default" hint="Soft na jasnym tle." />
            <SpecimenInfo id="navVariant=ghost" hint="Bez tła. Inline." />
            <SpecimenInfo id="navVariant=inverse" hint="Białe na ciemnym tle." />
          </div>
        }
      >
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <NavigationArrow direction="left" navVariant="default" />
          <NavigationArrow direction="left" navVariant="ghost" />
          <NavigationArrow direction="left" navVariant="inverse" />
        </div>
      </ComponentShowcase>

      {/* ── NavigationArrow — floating ── */}
      <ComponentShowcase title="NavigationArrow — floating" caption="Position absolute wewnątrz kontenera."
        info={<SpecimenInfo id="position=floating" hint="Galerie, karuzele. Absolute." />}
      >
        <div style={{ position: "relative", width: "100%", maxWidth: 400, height: 200, backgroundColor: "var(--eui-grey-100)", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: 14, color: "var(--eui-text-secondary)" }}>Kontener galerii</span>
          <NavigationArrow direction="left" position="floating" navVariant="inverse" size="sm" />
          <NavigationArrow direction="right" position="floating" navVariant="inverse" size="sm" />
        </div>
      </ComponentShowcase>

      {/* ── PaginationDot — states ── */}
      <ComponentShowcase title="PaginationDot — stany" caption="3 stany kropki."
        info={
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
            <SpecimenInfo id="state=active" hint="Aktualny slide. Skala 1.25×." />
            <SpecimenInfo id="state=inactive" hint="Niewybrany. Grey-300." />
            <SpecimenInfo id="state=disabled" hint="Niedostępny. Grey-100." />
          </div>
        }
      >
        <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
          {(["active", "inactive", "disabled"] as const).map((s) => (
            <div key={s} className="eui-pagination-dots">
              {Array.from({ length: 5 }, (_, i) => (
                <PaginationDot key={i} state={i === 2 ? s : "inactive"} />
              ))}
            </div>
          ))}
        </div>
      </ComponentShowcase>

      {/* ── PaginationDot — interactive ── */}
      <ComponentShowcase title="PaginationDot — interactive" caption="Klikalne kropki. Goto-slide."
        info={
          <>
            <SpecimenInfo id="interactive=true" hint="Klikalne. Goto-slide navigation." />
            <DebugPanel fields={[{ label: "activeIndex", value: activeDot }]} />
          </>
        }
      >
        <div className="eui-pagination-dots">
          {Array.from({ length: 5 }, (_, i) => (
            <PaginationDot
              key={i}
              state={i === activeDot ? "active" : "inactive"}
              interactive
              onClick={() => setActiveDot(i)}
              aria-label={`Zdjęcie ${i + 1} z 5`}
            />
          ))}
        </div>
      </ComponentShowcase>

      {/* ── TabTrigger — underline ── */}
      <ComponentShowcase title="TabTrigger — underline" caption="Kategorie sekcji. Underline pod active."
        info={
          <>
            <SpecimenInfo id="variant=underline" hint="Kategorie. Underline active." />
            <DebugPanel fields={[{ label: "activeTab", value: activeTab }]} />
          </>
        }
      >
        <div style={{ display: "flex", borderBottom: "1px solid var(--eui-grey-100)" }}>
          {["Domy", "Atrakcje", "Usługi"].map((t) => (
            <TabTrigger key={t} variant="underline" active={activeTab === t.toLowerCase()} onClick={() => setActiveTab(t.toLowerCase())}>
              {t}
            </TabTrigger>
          ))}
        </div>
      </ComponentShowcase>

      {/* ── TabTrigger — pill ── */}
      <ComponentShowcase title="TabTrigger — pill" caption="Filtry w kontenerze. Pill shape."
        info={
          <>
            <SpecimenInfo id="variant=pill" hint="Kontekst filtra, compact." />
            <DebugPanel fields={[{ label: "activeFilter", value: activeFilter }]} />
          </>
        }
      >
        <div className="eui-tab-group">
          {["Wszystkie", "Domki", "Pokoje"].map((f) => (
            <TabTrigger key={f} variant="pill" active={activeFilter === f.toLowerCase()} onClick={() => setActiveFilter(f.toLowerCase())}>
              {f}
            </TabTrigger>
          ))}
        </div>
      </ComponentShowcase>

      {/* ── TabTrigger — segmented ── */}
      <ComponentShowcase title="TabTrigger — segmented" caption="iOS-style. Przełącznik widoku."
        info={
          <>
            <SpecimenInfo id="variant=segmented" hint="iOS-style switch. View mode." />
            <DebugPanel fields={[{ label: "currentView", value: currentView }]} />
          </>
        }
      >
        <div className="eui-tab-group eui-tab-group-segmented">
          {["Lista", "Mapa", "Kalendarz"].map((v) => (
            <TabTrigger key={v} variant="segmented" active={currentView === v.toLowerCase()} onClick={() => setCurrentView(v.toLowerCase())}>
              {v}
            </TabTrigger>
          ))}
        </div>
      </ComponentShowcase>

      {/* ── TabTrigger — icon + count ── */}
      <ComponentShowcase title="TabTrigger — ikona + count" caption="Label z ikoną i liczbą aktywnych."
        info={<SpecimenInfo id="iconLeft + count" hint="Filtry z licznikiem aktywnych." />}
      >
        <TabTrigger variant="pill" iconLeft={<Filter />} count={3} active>Filtry</TabTrigger>
      </ComponentShowcase>

      {/* ── SortTrigger — 3-stop cycle ── */}
      <ComponentShowcase title="SortTrigger — cykl 3-stop" caption="null → asc → desc → null. Klikaj."
        info={
          <>
            <SpecimenInfo id="cycle=asc-desc-null" hint="Cykl: null → asc → desc → null." />
            <DebugPanel fields={[{ label: "direction", value: String(sortDir) }]} />
          </>
        }
      >
        <SortTrigger direction={sortDir} onDirectionChange={setSortDir}>Cena</SortTrigger>
      </ComponentShowcase>

      {/* ── SortTrigger — 2-stop cycle ── */}
      <ComponentShowcase title="SortTrigger — cykl 2-stop" caption="Tylko asc ↔ desc. Obowiązkowe sortowanie."
        info={
          <>
            <SpecimenInfo id="cycle=asc-desc" hint="Tylko asc ↔ desc. Bez null." />
            <DebugPanel fields={[{ label: "direction", value: String(sortDir2) }]} />
          </>
        }
      >
        <SortTrigger direction={sortDir2} onDirectionChange={setSortDir2} cycle="asc-desc">Ocena</SortTrigger>
      </ComponentShowcase>

      {/* ── SortTrigger — visual states ── */}
      <ComponentShowcase title="SortTrigger — stany wizualne" caption="3 stany statyczne."
        info={
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
            <SpecimenInfo id="direction=null" hint="Neutralny. ArrowUpDown." />
            <SpecimenInfo id="direction=asc" hint="Rosnąco. Aktywny bg." />
            <SpecimenInfo id="direction=desc" hint="Malejąco. Aktywny bg." />
          </div>
        }
      >
        <div style={{ display: "flex", gap: 12 }}>
          <SortTrigger direction={null}>Cena</SortTrigger>
          <SortTrigger direction="asc">Ocena</SortTrigger>
          <SortTrigger direction="desc">Odległość</SortTrigger>
        </div>
      </ComponentShowcase>
    </LabSection>
  );
}
