"use client";

import React, { useState } from "react";
import { SectionBlock, PreviewRow, PreviewGroup, ReferenceBox, RulesBlock } from "../shared";
import { BubbleSelect } from "@/components/ui/bubble-select";
import { BubbleDatePicker } from "@/components/ui/bubble-date-picker";
import { BubbleRangePicker } from "@/components/ui/bubble-range-picker";
import { BubbleColorPicker } from "@/components/ui/bubble-color-picker";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Tooltip } from "@/components/ui/tooltip";
import { Info, Mail, Bell, CheckCircle2, XCircle } from "lucide-react";

const SELECT_OPTS = [
  { value: "option1", label: "Opcja pierwsza" },
  { value: "option2", label: "Opcja druga" },
  { value: "option3", label: "Opcja trzecia" },
];

const FILTER_OPTS = [
  { value: "", label: "Wszystkie statusy" },
  { value: "PENDING", label: "Oczekujące" },
  { value: "CONFIRMED", label: "Potwierdzone" },
  { value: "CANCELLED", label: "Anulowane" },
];

const SEARCHABLE_OPTS = [
  { value: "pl", label: "Polska" },
  { value: "de", label: "Niemcy" },
  { value: "cz", label: "Czechy" },
  { value: "sk", label: "Słowacja" },
  { value: "ua", label: "Ukraina" },
  { value: "gb", label: "Wielka Brytania" },
  { value: "nl", label: "Holandia" },
  { value: "fr", label: "Francja" },
];

export function SelectsPickersSection() {
  const [selectVal, setSelectVal] = useState("option1");
  const [filterVal, setFilterVal] = useState("");
  const [dateVal, setDateVal] = useState("2026-07-15");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [color, setColor] = useState("#2563EB");
  const [country, setCountry] = useState("pl");

  return (
    <div className="space-y-5">
      {/* BubbleSelect */}
      <SectionBlock title="BubbleSelect" description="Główny select w systemie. Portal dropdown z wyszukiwaniem.">
        <PreviewRow label="Standard">
          <div className="w-[220px]" style={{ overflow: "visible" }}>
            <label className="text-[12px] font-semibold text-muted-foreground block mb-1.5">Typ pokoju</label>
            <BubbleSelect options={SELECT_OPTS} value={selectVal} onChange={setSelectVal} />
          </div>
        </PreviewRow>
        <PreviewRow label="Jako filtr (z opcją 'Wszystkie')">
          <div className="w-[200px]" style={{ overflow: "visible" }}>
            <BubbleSelect options={FILTER_OPTS} value={filterVal} onChange={setFilterVal} />
          </div>
        </PreviewRow>
        <ReferenceBox items={[
          { label: "Komponent", value: "BubbleSelect" },
          { label: "Plik", value: "src/components/ui/bubble-select.tsx" },
          { label: "Props", value: "options: {value, label}[], value, onChange, placeholder?" },
          { label: "Użycie", value: "Filtry, formularze, konfiguracja — wszędzie zamiast <select>" },
        ]} />
      </SectionBlock>

      {/* SearchableSelect */}
      <SectionBlock title="SearchableSelect" description="Select z wyszukiwaniem tekstowym. Dla długich list (kraje, klienci).">
        <PreviewRow label="Wybór kraju">
          <div className="w-[250px]" style={{ overflow: "visible" }}>
            <SearchableSelect options={SEARCHABLE_OPTS} value={country} onChange={setCountry} label="Kraj" placeholder="Wybierz kraj..." />
          </div>
        </PreviewRow>
        <ReferenceBox items={[
          { label: "Komponent", value: "SearchableSelect" },
          { label: "Plik", value: "src/components/ui/searchable-select.tsx" },
          { label: "Props", value: "options, value, onChange, placeholder?, label?, searchable?" },
          { label: "Użycie", value: "Długie listy: kraje, języki, klienci, zasoby" },
        ]} />
      </SectionBlock>

      {/* BubbleDatePicker */}
      <SectionBlock title="BubbleDatePicker" description="Kalendarz z wyborem pojedynczej daty. Portal, PL locale (date-fns).">
        <PreviewRow label="Wybierz datę (kliknij)">
          <div className="w-[220px]" style={{ overflow: "visible" }}>
            <label className="text-[12px] font-semibold text-muted-foreground block mb-1.5">Data przyjazdu</label>
            <BubbleDatePicker value={dateVal} onChange={setDateVal} />
          </div>
        </PreviewRow>
        <ReferenceBox items={[
          { label: "Komponent", value: "BubbleDatePicker" },
          { label: "Plik", value: "src/components/ui/bubble-date-picker.tsx" },
          { label: "Props", value: "value: Date|null, onChange: (d: Date|null) => void, min?, max?" },
          { label: "Locale", value: "PL (date-fns/locale/pl), portal (appendTo body)" },
        ]} />
      </SectionBlock>

      {/* BubbleRangePicker */}
      <SectionBlock title="BubbleRangePicker" description="Kalendarz z wyborem zakresu dat (check-in → check-out). Zakres podświetlony.">
        <PreviewRow label="Wybierz zakres (kliknij check-in, potem check-out)">
          <div style={{ overflow: "visible" }}>
            <BubbleRangePicker checkIn={checkIn} checkOut={checkOut} onChange={(ci, co) => { setCheckIn(ci); setCheckOut(co); }} />
          </div>
        </PreviewRow>
        <ReferenceBox items={[
          { label: "Komponent", value: "BubbleRangePicker" },
          { label: "Plik", value: "src/components/ui/bubble-range-picker.tsx" },
          { label: "Props", value: "checkIn, checkOut, onChange: (ci, co) => void, min?" },
          { label: "Użycie", value: "Widget rezerwacyjny (StepDates), formularze z zakresem dat" },
        ]} />
      </SectionBlock>

      {/* BubbleColorPicker */}
      <SectionBlock title="BubbleColorPicker" description="Wybór koloru z presetami + custom hex input. Kwadrat 56×56 + bubble dropdown.">
        <PreviewRow label="Wybierz kolor (kliknij kwadrat)">
          <div style={{ overflow: "visible" }}>
            <BubbleColorPicker value={color} onChange={setColor} label="Kolor główny" />
          </div>
        </PreviewRow>
        <ReferenceBox items={[
          { label: "Komponent", value: "BubbleColorPicker" },
          { label: "Plik", value: "src/components/ui/bubble-color-picker.tsx" },
          { label: "Props", value: "value: string (hex), onChange, label" },
          { label: "Użycie", value: "Konfiguracja wyglądu widżetu (primaryColor, navBg, itd.)" },
        ]} />
      </SectionBlock>

      {/* Tooltip */}
      <SectionBlock title="Tooltip" description="Dymek z informacją po najechaniu. Portal-based.">
        <PreviewRow label="Najedź na ikony">
          <Tooltip content="To jest tooltip z dodatkową informacją">
            <button className="h-8 w-8 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-all">
              <Info className="h-4 w-4" />
            </button>
          </Tooltip>
          <Tooltip content="Wyślij wiadomość e-mail">
            <button className="btn-bubble btn-secondary-bubble px-4 py-2 text-[12px]">
              <Mail className="h-3.5 w-3.5" /> Hover me
            </button>
          </Tooltip>
        </PreviewRow>
        <ReferenceBox items={[
          { label: "Komponent", value: "Tooltip" },
          { label: "Plik", value: "src/components/ui/tooltip.tsx" },
          { label: "Props", value: "content: string, children: ReactNode" },
          { label: "Użycie", value: "Ikony bez tekstu, skrócone informacje, pomocnicze podpowiedzi" },
        ]} />
      </SectionBlock>

      {/* Badges */}
      <SectionBlock title="Badge i etykiety" description="Pill-shaped badge do statusów, typów, etykiet. Dwa rozmiary.">
        <PreviewRow label="Badge małe (9px) — statusy w tabelach">
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">WŁASNY</span>
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">DOMYŚLNY</span>
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500">AKTYWNY</span>
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-destructive/10 text-destructive">ANULOWANY</span>
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-500">OCZEKUJE</span>
        </PreviewRow>
        <PreviewRow label="Pill tagi (11px) — belki, filtry">
          <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold bg-muted text-muted-foreground">Elastyczny</span>
          <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold bg-primary/10 text-primary">28 cen</span>
          <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold bg-muted text-muted-foreground">
            <Mail className="h-3 w-3" /> Potwierdzenie
          </span>
        </PreviewRow>
        <PreviewRow label="Count bubble (w tabach)">
          <span className="count-bubble">5</span>
          <span className="count-bubble count-bubble-active">12</span>
          <span className="count-bubble">0</span>
        </PreviewRow>
        <PreviewRow label="Kropki statusu (w listach/logach)">
          <div className="flex items-center gap-2"><div className="h-2.5 w-2.5 rounded-full bg-emerald-400" /><span className="text-[12px]">Wysłany</span></div>
          <div className="flex items-center gap-2"><div className="h-2.5 w-2.5 rounded-full bg-amber-400" /><span className="text-[12px]">Oczekuje</span></div>
          <div className="flex items-center gap-2"><div className="h-2.5 w-2.5 rounded-full bg-destructive" /><span className="text-[12px]">Błąd</span></div>
          <div className="flex items-center gap-2"><div className="h-3 w-3 rounded-full bg-emerald-400" /><span className="text-[12px]">Duża (h-3)</span></div>
          <div className="flex items-center gap-2"><div className="h-3 w-3 rounded-full bg-destructive" /><span className="text-[12px]">Duża (h-3)</span></div>
        </PreviewRow>
        <ReferenceBox items={[
          { label: "Badge mały", value: "text-[9px] font-bold px-1.5 py-0.5 rounded-full" },
          { label: "Pill tag", value: "text-[11px] font-semibold px-2.5 py-1 rounded-full" },
          { label: "Count", value: "count-bubble / count-bubble-active" },
          { label: "Status dot", value: "h-2.5 w-2.5 (mała) / h-3 w-3 (duża) rounded-full bg-emerald/amber/destructive" },
        ]} />
      </SectionBlock>
    </div>
  );
}
