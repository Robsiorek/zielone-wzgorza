"use client";

import * as React from "react";
import { MapPin, Search, Calendar, Clock, History, LayoutGrid } from "lucide-react";
import { LabSection } from "../LabSection";
import { ComponentShowcase } from "../ComponentShowcase";
import { SpecimenInfo } from "../Specimen";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/engine-ui/primitives/Popover";
import { PopoverItem } from "@/components/engine-ui/PopoverItem";

const TriggerButton = React.forwardRef<
  HTMLButtonElement,
  { label: string } & React.ButtonHTMLAttributes<HTMLButtonElement>
>(function TriggerButton({ label, style, ...rest }, ref) {
  return (
    <button ref={ref} type="button" style={{
      background: "var(--eui-grey-0)", border: "1px solid var(--eui-border-strong)",
      padding: "10px 20px", borderRadius: 9999, fontFamily: "inherit",
      fontSize: 14, fontWeight: 500, color: "var(--eui-text-primary)", cursor: "pointer", ...style,
    }} {...rest}>{label}</button>
  );
});

export function PopoverSection() {
  return (
    <LabSection id="popovers" title="Popovery" icon={<LayoutGrid />}
      description="Radix Popover z powłoką engine-ui. Animacja wejścia i wyjścia."
    >
      <ComponentShowcase title="Warianty rozmiaru" caption="4 predefiniowane szerokości."
        info={
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
            <SpecimenInfo id="small — 280px" hint="Krótkie menu, akcje." />
            <SpecimenInfo id="medium — 360px" hint="Domyślny. Picker gości." />
            <SpecimenInfo id="large — 640px" hint="Picker dat, gęsta zawartość." />
            <SpecimenInfo id="contextual — auto" hint="Inline podpowiedzi, max 320." />
          </div>
        }
      >
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <Popover>
            <PopoverTrigger asChild><TriggerButton label="Small" /></PopoverTrigger>
            <PopoverContent size="small" align="start" side="bottom">
              <p className="eui-body-small" style={{ margin: 0 }}>280 px. Krótkie menu.</p>
            </PopoverContent>
          </Popover>
          <Popover>
            <PopoverTrigger asChild><TriggerButton label="Medium" /></PopoverTrigger>
            <PopoverContent size="medium" align="start" side="bottom">
              <p className="eui-body-small" style={{ margin: 0 }}>360 px. Picker gości, formularze.</p>
            </PopoverContent>
          </Popover>
          <Popover>
            <PopoverTrigger asChild><TriggerButton label="Large" /></PopoverTrigger>
            <PopoverContent size="large" align="start" side="bottom">
              <p className="eui-body-small" style={{ margin: 0 }}>640 px. Dwa miesiące obok siebie.</p>
            </PopoverContent>
          </Popover>
          <Popover>
            <PopoverTrigger asChild><TriggerButton label="Contextual" /></PopoverTrigger>
            <PopoverContent size="contextual" align="start" side="bottom">
              <p className="eui-body-small" style={{ margin: 0 }}>Auto-size. Max 320.</p>
            </PopoverContent>
          </Popover>
        </div>
      </ComponentShowcase>

      <ComponentShowcase title="PopoverItem" caption="Systemowy wiersz menu z ikoną."
        info={<SpecimenInfo id="PopoverItem" hint="Ikona + tytuł + opis. Menu, sugestie." />}
      >
        <Popover>
          <PopoverTrigger asChild><TriggerButton label="Otwórz menu" /></PopoverTrigger>
          <PopoverContent size="medium" align="start" side="bottom">
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <PopoverItem icon={<Search size={20} />} title="Popularne zapytanie" subtitle="Domki nad jeziorem" />
              <PopoverItem icon={<History size={20} />} title="Ostatnio szukane" subtitle="15-17 maja, 2 osoby" />
              <PopoverItem icon={<MapPin size={20} />} title="Zielone Wzgórza" subtitle="Jedyna lokalizacja" selected />
              <PopoverItem icon={<Calendar size={20} />} title="Następny weekend" subtitle="22-24 maja" />
              <PopoverItem icon={<Clock size={20} />} title="Niedostępne" subtitle="Demonstracja" disabled />
            </div>
          </PopoverContent>
        </Popover>
      </ComponentShowcase>
    </LabSection>
  );
}
