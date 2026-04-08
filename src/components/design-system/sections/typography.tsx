"use client";

import React from "react";
import { SectionBlock, PreviewRow, PreviewGroup, ReferenceBox, RulesBlock } from "../shared";

export function TypographySection() {
  return (
    <div className="space-y-5">
      {/* Font Family */}
      <SectionBlock title="Czcionka" description="System używa Plus Jakarta Sans z Google Fonts. Ładowana przez next/font z font-swap.">
        <PreviewRow label="Plus Jakarta Sans — wszystkie wagi">
          <span className="text-[16px] font-normal">Regular (400)</span>
          <span className="text-[16px] font-medium">Medium (500)</span>
          <span className="text-[16px] font-semibold">Semibold (600)</span>
          <span className="text-[16px] font-bold">Bold (700)</span>
        </PreviewRow>
        <ReferenceBox items={[
          { label: "Font", value: "Plus Jakarta Sans" },
          { label: "Plik", value: "src/app/layout.tsx — Plus_Jakarta_Sans from next/font/google" },
          { label: "Fallback", value: "system-ui, -apple-system, sans-serif" },
        ]} />
      </SectionBlock>

      {/* Type Scale */}
      <SectionBlock title="Skala rozmiarów" description="Stała skala oparta o klasy Tailwind text-[Xpx]. Nie używamy rem/em — zawsze px.">
        <div className="rounded-xl border border-dashed border-border/70 p-4 bg-background space-y-3">
          <div className="flex items-baseline gap-4">
            <span className="text-[10px] text-muted-foreground w-[80px] shrink-0 font-mono">text-[20px]</span>
            <span className="text-[20px] font-bold">Nagłówek strony</span>
          </div>
          <div className="flex items-baseline gap-4">
            <span className="text-[10px] text-muted-foreground w-[80px] shrink-0 font-mono">text-[16px]</span>
            <span className="text-[16px] font-semibold">Nagłówek sekcji</span>
          </div>
          <div className="flex items-baseline gap-4">
            <span className="text-[10px] text-muted-foreground w-[80px] shrink-0 font-mono">text-[14px]</span>
            <span className="text-[14px] font-semibold">Tytuł karty / belki</span>
          </div>
          <div className="flex items-baseline gap-4">
            <span className="text-[10px] text-muted-foreground w-[80px] shrink-0 font-mono">text-[13px]</span>
            <span className="text-[13px]">Body text — opisy, wartości, przyciski</span>
          </div>
          <div className="flex items-baseline gap-4">
            <span className="text-[10px] text-muted-foreground w-[80px] shrink-0 font-mono">text-[12px]</span>
            <span className="text-[12px] text-muted-foreground">Label, mniejsze opisy, reference</span>
          </div>
          <div className="flex items-baseline gap-4">
            <span className="text-[10px] text-muted-foreground w-[80px] shrink-0 font-mono">text-[11px]</span>
            <span className="text-[11px] text-muted-foreground">Podpisy, opisy sekcji, meta-info</span>
          </div>
          <div className="flex items-baseline gap-4">
            <span className="text-[10px] text-muted-foreground w-[80px] shrink-0 font-mono">text-[10px]</span>
            <span className="text-[10px] text-muted-foreground">Drobne etykiety, hints, uppercase labels</span>
          </div>
          <div className="flex items-baseline gap-4">
            <span className="text-[10px] text-muted-foreground w-[80px] shrink-0 font-mono">text-[9px]</span>
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">BADGE</span>
          </div>
        </div>
        <ReferenceBox items={[
          { label: "Nagłówek", value: "text-xl font-bold tracking-tight (h2, strona)" },
          { label: "Karta", value: "text-[14px] font-semibold (h3, belka/sekcja)" },
          { label: "Body", value: "text-[13px] (domyślny tekst, buttony, inputy)" },
          { label: "Label", value: "text-[12px] font-semibold text-muted-foreground" },
          { label: "Opis", value: "text-[11px] text-muted-foreground mt-0.5" },
          { label: "Hint", value: "text-[10px] text-muted-foreground" },
        ]} />
      </SectionBlock>

      {/* Text Colors */}
      <SectionBlock title="Kolory tekstu" description="Hierarchia kolorów tekstu — od najciemniejszego (foreground) do najjaśniejszego (muted-foreground).">
        <PreviewRow label="Hierarchia">
          <span className="text-[13px] font-semibold text-foreground">text-foreground — główny tekst</span>
          <span className="text-[13px] text-muted-foreground">text-muted-foreground — opisy, labele</span>
          <span className="text-[13px] text-primary">text-primary — akcenty, linki, CTA</span>
          <span className="text-[13px] text-destructive">text-destructive — błędy, usuwanie</span>
          <span className="text-[13px] text-emerald-600">text-emerald-600 — sukces</span>
          <span className="text-[13px] text-amber-600">text-amber-600 — ostrzeżenie</span>
        </PreviewRow>
        <RulesBlock
          always={[
            "text-foreground dla głównego tekstu (nazwy, tytuły, wartości)",
            "text-muted-foreground dla podpisów, opisów, labeli, meta-info",
            "text-primary dla klikalnych elementów i akcentów",
          ]}
          never={[
            "Nie mieszaj text-foreground z opacity — używaj text-muted-foreground",
            "Nie używaj text-gray-XXX — zawsze CSS variables",
          ]}
        />
      </SectionBlock>

      {/* Monospace */}
      <SectionBlock title="Font mono" description="Do kodów, IBAN, identyfikatorów, JSON, referencji technicznych.">
        <PreviewRow label="Przykłady">
          <span className="text-[12px] font-mono">ZW-2026-0008</span>
          <span className="text-[12px] font-mono">89 1090 1102 0000 0001 5948 7356</span>
          <span className="text-[12px] font-mono">btn-bubble btn-primary-bubble</span>
        </PreviewRow>
        <ReferenceBox items={[
          { label: "Klasa", value: "font-mono" },
          { label: "Użycie", value: "IBAN, numery rezerwacji, klasy CSS, kody, identyfikatory" },
        ]} />
      </SectionBlock>
    </div>
  );
}
