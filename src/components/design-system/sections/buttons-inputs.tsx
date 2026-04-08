"use client";

import React, { useState } from "react";
import { Save, Trash2, Loader2, Plus, Search, X, ArrowLeft, Eye, Pencil } from "lucide-react";
import { SectionBlock, PreviewRow, PreviewGroup, ReferenceBox, RulesBlock } from "../shared";
import { cn } from "@/lib/utils";

export function ButtonsInputsSection() {
  const [check1, setCheck1] = useState(true);
  const [check2, setCheck2] = useState(false);
  const [radio, setRadio] = useState("a");
  const [toggle1, setToggle1] = useState(true);
  const [toggle2, setToggle2] = useState(false);
  const [searchVal, setSearchVal] = useState("");

  return (
    <div className="space-y-5">
      {/* Buttons */}
      <SectionBlock title="Przyciski" description="Dwa warianty: primary (akcja główna) i secondary (pomocnicza). Zawsze z klasą bazową btn-bubble.">
        <PreviewRow label="Primary button">
          <button className="btn-bubble btn-primary-bubble px-5 py-2.5 text-[13px]"><Save className="h-4 w-4" /> Zapisz</button>
          <button className="btn-bubble btn-primary-bubble px-5 py-2.5 text-[13px]"><Plus className="h-4 w-4" /> Dodaj</button>
          <button className="btn-bubble btn-primary-bubble px-5 py-2.5 text-[13px] opacity-50 cursor-not-allowed"><Loader2 className="h-4 w-4 animate-spin" /> Zapisywanie...</button>
        </PreviewRow>
        <PreviewRow label="Secondary button">
          <button className="btn-bubble btn-secondary-bubble px-4 py-2.5 text-[13px]"><ArrowLeft className="h-4 w-4" /> Wróć</button>
          <button className="btn-bubble btn-secondary-bubble px-4 py-2.5 text-[13px]">Anuluj</button>
          <button className="btn-bubble btn-secondary-bubble px-3 py-1.5 text-[11px]">Mały</button>
        </PreviewRow>
        <PreviewRow label="Destructive button">
          <button className="btn-bubble btn-secondary-bubble px-4 py-2.5 text-[13px] text-destructive hover:border-destructive"><Trash2 className="h-4 w-4" /> Usuń</button>
        </PreviewRow>
        <PreviewRow label="Icon buttons (akcje w belkach)">
          <button className="h-8 w-8 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-all"><Pencil className="h-3.5 w-3.5" /></button>
          <button className="h-8 w-8 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-all"><Eye className="h-3.5 w-3.5" /></button>
          <button className="h-8 w-8 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all"><Trash2 className="h-3.5 w-3.5" /></button>
        </PreviewRow>
        <ReferenceBox items={[
          { label: "Primary", value: "btn-bubble btn-primary-bubble" },
          { label: "Secondary", value: "btn-bubble btn-secondary-bubble" },
          { label: "Destructive", value: "btn-secondary + text-destructive hover:border-destructive" },
          { label: "Icon", value: "h-8 w-8 rounded-xl flex center — Pencil, Eye, Trash2 (h-3.5)" },
          { label: "Plik", value: "src/styles/globals.css" },
        ]} />
      </SectionBlock>

      {/* Inputs */}
      <SectionBlock title="Inputy tekstowe" description="Jeden styl: input-bubble. Wysokość h-11, border-2, focus = border-primary.">
        <PreviewRow label="Text input">
          <div className="w-[250px]">
            <label className="text-[12px] font-semibold text-muted-foreground block mb-1.5">Nazwa</label>
            <input type="text" placeholder="Jan Kowalski" className="input-bubble h-11 w-full text-[14px]" />
          </div>
          <div className="w-[250px]">
            <label className="text-[12px] font-semibold text-muted-foreground block mb-1.5">E-mail</label>
            <input type="email" value="admin@zielonewzgorza.eu" readOnly className="input-bubble h-11 w-full text-[14px]" />
          </div>
        </PreviewRow>
        <PreviewRow label="Number input">
          <div className="w-[120px]">
            <label className="text-[12px] font-semibold text-muted-foreground block mb-1.5">Procent</label>
            <input type="number" value={30} readOnly className="input-bubble h-11 w-full text-[14px] text-right" />
          </div>
          <div className="w-[120px]">
            <label className="text-[12px] font-semibold text-muted-foreground block mb-1.5">Dni</label>
            <input type="number" value={3} readOnly className="input-bubble h-11 w-full text-[14px] text-center" />
          </div>
        </PreviewRow>
        <PreviewRow label="Search input z ikoną i czyszczeniem">
          <div className="relative w-[300px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input type="text" value={searchVal} onChange={e => setSearchVal(e.target.value)} placeholder="Szukaj klienta..." className="input-bubble h-11 w-full text-[13px]" style={{ paddingLeft: 40 }} />
            {searchVal && (
              <button onClick={() => setSearchVal("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </PreviewRow>
        <PreviewRow label="Textarea">
          <textarea placeholder="Notatki wewnętrzne..." className="w-[400px] h-[100px] rounded-2xl border-2 border-border bg-card px-4 py-3 text-[13px] resize-none focus:border-primary focus:outline-none transition-colors" />
        </PreviewRow>
        <PreviewRow label="Monospace input (IBAN, kody)">
          <input type="text" value="89 1090 1102 0000 0001 5948 7356" readOnly className="input-bubble h-11 w-[350px] text-[14px] font-mono" />
        </PreviewRow>
        <ReferenceBox items={[
          { label: "Klasa", value: "input-bubble — h-11, rounded-2xl, border-2, focus:border-primary" },
          { label: "Label", value: "text-[12px] font-semibold text-muted-foreground block mb-1.5" },
          { label: "Search", value: "paddingLeft: 40 (inline style), Search icon absolute left-3" },
          { label: "Hint", value: "text-[10px] text-muted-foreground mt-1 (pod inputem)" },
          { label: "Plik", value: "src/styles/globals.css (.input-bubble)" },
        ]} />
      </SectionBlock>

      {/* Toggle */}
      <SectionBlock title="Toggle switch" description="Włącz/wyłącz. Primary gdy aktywny, muted gdy nieaktywny.">
        <PreviewRow label="Interaktywne toggle">
          <button type="button" onClick={() => setToggle1(!toggle1)} className="flex items-center gap-3">
            <span className={cn("relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0", toggle1 ? "bg-primary" : "bg-muted-foreground/20")}>
              <span className={cn("inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform", toggle1 ? "translate-x-6" : "translate-x-1")} />
            </span>
            <span className="text-[13px]">Wysyłaj przypomnienia</span>
          </button>
          <button type="button" onClick={() => setToggle2(!toggle2)} className="flex items-center gap-3">
            <span className={cn("relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0", toggle2 ? "bg-primary" : "bg-muted-foreground/20")}>
              <span className={cn("inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform", toggle2 ? "translate-x-6" : "translate-x-1")} />
            </span>
            <span className="text-[13px]">Tryb dry-run</span>
          </button>
        </PreviewRow>
        <ReferenceBox items={[
          { label: "Track", value: "h-6 w-11 rounded-full — bg-primary (on) / bg-muted-foreground/20 (off)" },
          { label: "Knob", value: "h-4 w-4 rounded-full bg-white shadow-sm — translate-x-6 (on) / translate-x-1 (off)" },
        ]} />
      </SectionBlock>

      {/* Checkbox */}
      <SectionBlock title="Checkbox" description="Kwadratowy checkbox w stylu systemu. Primary gdy zaznaczony.">
        <PreviewRow label="Interaktywne checkboxy">
          <button type="button" onClick={() => setCheck1(!check1)} className="flex items-center gap-2.5">
            <div className={cn("h-5 w-5 rounded-md border-2 flex items-center justify-center transition-colors shrink-0", check1 ? "bg-primary border-primary" : "border-border hover:border-primary/50")}>
              {check1 && <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
            </div>
            <span className="text-[13px]">Zgoda na newsletter</span>
          </button>
          <button type="button" onClick={() => setCheck2(!check2)} className="flex items-center gap-2.5">
            <div className={cn("h-5 w-5 rounded-md border-2 flex items-center justify-center transition-colors shrink-0", check2 ? "bg-primary border-primary" : "border-border hover:border-primary/50")}>
              {check2 && <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
            </div>
            <span className="text-[13px]">Zgoda na marketing</span>
          </button>
        </PreviewRow>
        <ReferenceBox items={[
          { label: "Box", value: "h-5 w-5 rounded-md border-2 — checked: bg-primary border-primary" },
          { label: "Check", value: "SVG checkmark h-3 w-3 text-white strokeWidth-3" },
          { label: "Label", value: "text-[13px] obok, gap-2.5" },
        ]} />
      </SectionBlock>

      {/* Radio */}
      <SectionBlock title="Radio button" description="Okrągły radio w stylu systemu. Primary dot gdy wybrany.">
        <PreviewRow label="Interaktywne radio">
          {["a", "b", "c"].map(val => (
            <button key={val} type="button" onClick={() => setRadio(val)} className="flex items-center gap-2.5">
              <div className={cn("h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors shrink-0", radio === val ? "border-primary" : "border-border hover:border-primary/50")}>
                {radio === val && <div className="h-2.5 w-2.5 rounded-full bg-primary" />}
              </div>
              <span className="text-[13px]">{val === "a" ? "Przelew bankowy" : val === "b" ? "Gotówka" : "Karta"}</span>
            </button>
          ))}
        </PreviewRow>
        <ReferenceBox items={[
          { label: "Circle", value: "h-5 w-5 rounded-full border-2 — selected: border-primary" },
          { label: "Dot", value: "h-2.5 w-2.5 rounded-full bg-primary (wewnątrz)" },
          { label: "Label", value: "text-[13px] obok, gap-2.5" },
        ]} />
      </SectionBlock>
    </div>
  );
}
