"use client";

import React from "react";
import { SectionBlock, PreviewRow, PreviewGroup, ReferenceBox, RulesBlock } from "../shared";

const CORE_TOKENS = [
  { name: "--background", desc: "Tło strony", light: "210 20% 98%", dark: "220 20% 7%" },
  { name: "--foreground", desc: "Główny tekst", light: "220 15% 12%", dark: "210 20% 93%" },
  { name: "--card", desc: "Tło karty/bubble", light: "0 0% 100%", dark: "220 18% 10%" },
  { name: "--primary", desc: "Akcent główny (niebieski)", light: "214 89% 52%", dark: "214 89% 58%" },
  { name: "--primary-foreground", desc: "Tekst na primary", light: "0 0% 100%", dark: "0 0% 100%" },
  { name: "--secondary", desc: "Tło secondary button", light: "220 14% 96%", dark: "220 16% 14%" },
  { name: "--muted", desc: "Tło muted (skeletony, tagi)", light: "220 14% 95%", dark: "220 16% 12%" },
  { name: "--muted-foreground", desc: "Tekst muted (opisy)", light: "220 8% 52%", dark: "220 10% 52%" },
  { name: "--destructive", desc: "Błędy, usuwanie", light: "0 72% 51%", dark: "0 62% 50%" },
  { name: "--border", desc: "Bordery kart, inputów", light: "220 13% 91%", dark: "220 16% 18%" },
  { name: "--ring", desc: "Focus ring", light: "214 89% 52%", dark: "214 89% 58%" },
  { name: "--accent", desc: "Tło akcentowe", light: "214 80% 96%", dark: "214 40% 16%" },
];

const LAYOUT_TOKENS = [
  { name: "--radius", value: "16px", desc: "Border radius domyślny (bubble)" },
  { name: "--sidebar-width", value: "264px", desc: "Szerokość sidebara (rozwinięty)" },
  { name: "--sidebar-collapsed", value: "72px", desc: "Szerokość sidebara (zwinięty)" },
  { name: "--topbar-height", value: "64px", desc: "Wysokość topbara" },
];

export function ColorsSection() {
  return (
    <div className="space-y-5">
      {/* Core tokens */}
      <SectionBlock title="Tokeny kolorów" description="Wszystkie kolory w systemie są zdefiniowane jako CSS variables w formacie HSL (bez hsl()). Używane przez Tailwind: bg-primary = hsl(var(--primary)).">
        <div className="rounded-xl border border-dashed border-border/70 p-4 bg-background">
          <div className="grid gap-2">
            {CORE_TOKENS.map(t => (
              <div key={t.name} className="flex items-center gap-3 py-1">
                <div className="h-8 w-8 rounded-lg border border-border shrink-0" style={{ backgroundColor: `hsl(${t.light})` }} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono font-semibold">{t.name}</span>
                    <span className="text-[10px] text-muted-foreground">— {t.desc}</span>
                  </div>
                  <div className="flex gap-4 mt-0.5">
                    <span className="text-[10px] text-muted-foreground font-mono">Light: {t.light}</span>
                    <span className="text-[10px] text-muted-foreground font-mono">Dark: {t.dark}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <ReferenceBox items={[
          { label: "Plik", value: "src/styles/globals.css — :root { } i .dark { }" },
          { label: "Format", value: "HSL bez funkcji: --primary: 214 89% 52% (Tailwind składa hsl())" },
          { label: "Użycie", value: "bg-primary, text-primary, border-primary, hsl(var(--primary))" },
        ]} />
        <RulesBlock
          always={[
            "Używaj tokenów CSS (bg-primary, text-foreground) — nigdy hardcoded hex/rgb",
            "Primary border: pełna intensywność hsl(var(--primary)), NIGDY z opacity",
            "Status colors: emerald (sukces), amber (ostrzeżenie), destructive (błąd)",
          ]}
          never={[
            "NIGDY: border-primary/30, border-primary/40 — zawsze border-primary (pełna)",
            "NIGDY: bg-gray-100, text-gray-500 — zawsze bg-muted, text-muted-foreground",
            "NIGDY: hardcoded #hex w komponentach — zawsze CSS variables",
          ]}
        />
      </SectionBlock>

      {/* Semantic colors */}
      <SectionBlock title="Kolory semantyczne" description="Kolory statusów i stanów — spójne w całym panelu.">
        <PreviewRow label="Statusy">
          <div className="flex items-center gap-2"><div className="h-3 w-3 rounded-full bg-emerald-400" /> <span className="text-[12px]">Sukces / Aktywny / Wysłany</span></div>
          <div className="flex items-center gap-2"><div className="h-3 w-3 rounded-full bg-amber-400" /> <span className="text-[12px]">Ostrzeżenie / Dry-run / Oczekuje</span></div>
          <div className="flex items-center gap-2"><div className="h-3 w-3 rounded-full bg-destructive" /> <span className="text-[12px]">Błąd / Niekompletne / Anulowane</span></div>
          <div className="flex items-center gap-2"><div className="h-3 w-3 rounded-full bg-primary" /> <span className="text-[12px]">Primary / Akcja / Zaznaczenie</span></div>
          <div className="flex items-center gap-2"><div className="h-3 w-3 rounded-full bg-muted-foreground/40" /> <span className="text-[12px]">Neutral / Nieaktywny</span></div>
        </PreviewRow>
        <PreviewRow label="Tła statusów (lekkie, na badge/alert)">
          <span className="text-[11px] px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-500">bg-emerald-500/15</span>
          <span className="text-[11px] px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-500">bg-amber-500/15</span>
          <span className="text-[11px] px-2.5 py-1 rounded-lg bg-destructive/10 text-destructive">bg-destructive/10</span>
          <span className="text-[11px] px-2.5 py-1 rounded-lg bg-primary/10 text-primary">bg-primary/10</span>
          <span className="text-[11px] px-2.5 py-1 rounded-lg bg-muted text-muted-foreground">bg-muted</span>
        </PreviewRow>
      </SectionBlock>

      {/* Layout tokens */}
      <SectionBlock title="Tokeny layoutu" description="Stałe wymiarowe — radius, sidebar, topbar.">
        <div className="rounded-xl border border-dashed border-border/70 p-4 bg-background space-y-2">
          {LAYOUT_TOKENS.map(t => (
            <div key={t.name} className="flex items-center gap-3 py-1">
              <span className="text-[11px] font-mono font-semibold w-[180px] shrink-0">{t.name}</span>
              <span className="text-[12px] font-mono text-primary">{t.value}</span>
              <span className="text-[10px] text-muted-foreground">— {t.desc}</span>
            </div>
          ))}
        </div>
        <ReferenceBox items={[
          { label: "Radius", value: "16px domyślny (bubble). Mniejsze: rounded-xl (12px), rounded-lg (8px)" },
          { label: "Plik", value: "src/styles/globals.css — :root { --radius: 16px }" },
        ]} />
      </SectionBlock>
    </div>
  );
}
