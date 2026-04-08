"use client";

import React, { useState } from "react";
import { Mail, Loader2, ChevronDown, ChevronRight, Settings, ExternalLink, AlertCircle } from "lucide-react";
import { SectionBlock, PreviewRow, PreviewGroup, ReferenceBox, RulesBlock } from "../shared";
import { SlidePanel } from "@/components/ui/slide-panel";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

export function PanelsFeedbackSection() {
  const { success: showSuccess, error: showError } = useToast();
  const [sectionOpen, setSectionOpen] = useState(true);
  const [slideOpen, setSlideOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <div className="space-y-5">
      {/* SlidePanel — live demo */}
      <SectionBlock title="SlidePanel" description="Panel boczny z prawej. ZAWSZE w DOM (nigdy {open && ...}). Kliknij przycisk, aby otworzyć.">
        <PreviewRow label="Otwórz SlidePanel">
          <button onClick={() => setSlideOpen(true)} className="btn-bubble btn-primary-bubble px-4 py-2 text-[12px]">
            Otwórz SlidePanel
          </button>
        </PreviewRow>
        <ReferenceBox items={[
          { label: "Komponent", value: "SlidePanel" },
          { label: "Plik", value: "src/components/ui/slide-panel.tsx" },
          { label: "Props", value: "open, onClose, title, children, width?" },
          { label: "Zamykanie", value: "Overlay click, X button, Escape" },
          { label: "Nesting", value: "Obsługuje 3 poziomy (payment → form → addon picker)" },
        ]} />
        <RulesBlock
          always={[
            "SlidePanel ZAWSZE renderowany w DOM: <SlidePanel open={x}> — nigdy conditional",
            "Animacja translateX 250ms — mount/unmount nie istnieje",
          ]}
          never={[
            "NIGDY: {isOpen && <SlidePanel>} — łamie animację zamykania",
          ]}
        />
        {/* Live SlidePanel */}
        <SlidePanel open={slideOpen} onClose={() => setSlideOpen(false)} title="Demo SlidePanel">
          <div className="px-5 py-4 space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-emerald-400" />
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500">WYSŁANY</span>
            </div>
            <div className="space-y-0">
              <div className="flex items-start justify-between py-2.5 border-b border-border/30">
                <span className="text-[11px] text-muted-foreground">Typ</span>
                <span className="text-[12px] font-medium">Potwierdzenie rezerwacji</span>
              </div>
              <div className="flex items-start justify-between py-2.5 border-b border-border/30">
                <span className="text-[11px] text-muted-foreground">Odbiorca</span>
                <span className="text-[12px] font-medium">Jan Kowalski &lt;jan@example.com&gt;</span>
              </div>
              <div className="flex items-start justify-between py-2.5 border-b border-border/30">
                <span className="text-[11px] text-muted-foreground">Data wysyłki</span>
                <span className="text-[12px] font-medium">07.04.2026, 12:34</span>
              </div>
              <div className="flex items-start justify-between py-2.5 border-b border-border/30">
                <span className="text-[11px] text-muted-foreground">Rezerwacja</span>
                <span className="text-[12px] font-medium text-primary flex items-center gap-1">ZW-2026-0008 <ExternalLink className="h-3 w-3" /></span>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground">To jest demo SlidePanel z Design System.</p>
          </div>
        </SlidePanel>
      </SectionBlock>

      {/* ConfirmDialog — live demo */}
      <SectionBlock title="ConfirmDialog" description="Modal potwierdzenia destrukcyjnych akcji. Overlay + centered card. Kliknij przycisk.">
        <PreviewRow label="Otwórz ConfirmDialog">
          <button onClick={() => setConfirmOpen(true)} className="btn-bubble btn-secondary-bubble px-4 py-2 text-[12px] text-destructive hover:border-destructive">
            Otwórz ConfirmDialog
          </button>
        </PreviewRow>
        <ReferenceBox items={[
          { label: "Komponent", value: "ConfirmDialog" },
          { label: "Plik", value: "src/components/ui/confirm-dialog.tsx" },
          { label: "Props", value: "open, onConfirm, onCancel, title?, message, confirmLabel?, variant?" },
          { label: "Variant", value: "danger (red button) | default (blue button)" },
          { label: "Użycie", value: "Usuwanie, resetowanie, anulowanie — nieodwracalne akcje" },
        ]} />
        <ConfirmDialog
          open={confirmOpen}
          onCancel={() => setConfirmOpen(false)}
          onConfirm={() => { setConfirmOpen(false); showSuccess("Akcja potwierdzona (demo)"); }}
          title="Potwierdzenie akcji"
          message="Czy na pewno chcesz wykonać tę akcję? To jest demonstracja ConfirmDialog z Design System."
          confirmLabel="Potwierdź"
          variant="danger"
        />
      </SectionBlock>

      {/* Toast — live demo */}
      <SectionBlock title="Toast" description="Powiadomienia popup w prawym górnym rogu. Zielone (sukces) i czerwone (błąd).">
        <PreviewRow label="Wyzwól toast (kliknij)">
          <button onClick={() => showSuccess("Operacja zakończona pomyślnie!")} className="btn-bubble btn-primary-bubble px-4 py-2 text-[12px]">Toast sukces</button>
          <button onClick={() => showError("Coś poszło nie tak. Spróbuj ponownie.")} className="btn-bubble btn-secondary-bubble px-4 py-2 text-[12px] text-destructive hover:border-destructive">Toast błąd</button>
        </PreviewRow>
        <ReferenceBox items={[
          { label: "Hook", value: "useToast() → { success, error }" },
          { label: "Plik", value: "src/components/ui/toast.tsx" },
          { label: "Provider", value: "ToastProvider w layout.tsx" },
          { label: "Użycie", value: "Po każdym zapisie, błędzie, wysyłce — zamiast inline alertów" },
        ]} />
      </SectionBlock>

      {/* Collapsible SectionCard — live demo */}
      <SectionBlock title="Sekcja zwijana (DS §25)" description="Animacja CSS Grid 0fr→1fr. Kliknij nagłówek, aby przetestować zwijanie.">
        <div className="rounded-xl border border-dashed border-border/70 p-4 bg-background">
          <div className="bubble">
            <button onClick={() => setSectionOpen(!sectionOpen)}
              className="w-full flex items-center gap-3 px-5 py-4 hover:bg-muted/20 transition-colors">
              <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Settings className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 text-left">
                <h3 className="text-[14px] font-semibold">Przykładowa sekcja</h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">Kliknij nagłówek — sekcja zwija się i rozwija z animacją 300ms.</p>
              </div>
              {sectionOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
            </button>
            <div className={`section-collapse ${sectionOpen ? "section-open" : ""}`}>
              <div className="section-collapse-inner">
                <div className="px-5 pb-5 border-t border-border/50 pt-4 space-y-3">
                  <div>
                    <label className="text-[12px] font-semibold text-muted-foreground block mb-1.5">Przykładowe pole</label>
                    <input type="text" value="Wartość pola" readOnly className="input-bubble h-11 w-full text-[14px]" />
                  </div>
                  <p className="text-[10px] text-muted-foreground">Podpowiedź pod polem — text-[10px] text-muted-foreground.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <ReferenceBox items={[
          { label: "CSS", value: ".section-collapse + .section-open + .section-collapse-inner" },
          { label: "Animacja", value: "grid-template-rows: 0fr→1fr, 300ms cubic-bezier(0.4,0,0.2,1)" },
          { label: "Ikona", value: "h-8 w-8 rounded-xl bg-primary/10 — ikona h-4 w-4 text-primary" },
          { label: "Plik", value: "src/styles/globals.css" },
        ]} />
        <RulesBlock
          always={["Zawartość w DOM — section-collapse + klasa, nigdy {open && ...}", "Każda sekcja: ikona + tytuł + opis"]}
          never={["NIGDY: {open && <div>} — łamie animację", "NIGDY: sekcja bez opisu"]}
        />
      </SectionBlock>

      {/* Skeleton */}
      <SectionBlock title="Skeleton i loading" description="Shimmer loading. Natychmiastowy, stabilny. Zero fade-in-up.">
        <PreviewRow label="Shimmer (różne kształty)">
          <div className="h-5 w-32 bg-muted shimmer rounded" />
          <div className="h-11 w-48 bg-muted shimmer rounded-2xl" />
          <div className="h-8 w-8 bg-muted shimmer rounded-xl" />
          <div className="h-3 w-64 bg-muted shimmer rounded" />
        </PreviewRow>
        <PreviewRow label="Skeleton karty">
          <div className="bubble p-5 w-full">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-muted shimmer rounded-xl" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-40 bg-muted shimmer rounded" />
                <div className="h-3 w-64 bg-muted shimmer rounded" />
              </div>
            </div>
          </div>
        </PreviewRow>
        <PreviewRow label="Spinner">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <div className="flex items-center gap-2 text-[12px] text-muted-foreground"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Zapisuję...</div>
        </PreviewRow>
        <ReferenceBox items={[
          { label: "Shimmer", value: "bg-muted shimmer rounded — klasa shimmer w globals.css" },
          { label: "Spinner", value: "Loader2 (lucide-react) + animate-spin" },
        ]} />
        <RulesBlock
          always={["Skeleton natychmiastowy, tylko shimmer", "fade-in-up dopiero na prawdziwym contencie"]}
          never={["NIGDY: fade-in-up / stagger na skeletonach"]}
        />
      </SectionBlock>

      {/* Empty state */}
      <SectionBlock title="Empty state" description="Gdy lista/tabela jest pusta. Ikona + tekst + podpis.">
        <div className="rounded-xl border border-dashed border-border/70 bg-background p-4">
          <div className="bubble text-center py-12">
            <Mail className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-[14px] font-medium text-muted-foreground">Brak wpisów</p>
            <p className="text-[12px] text-muted-foreground/60 mt-1">Dodaj pierwszy element, aby rozpocząć.</p>
          </div>
        </div>
        <ReferenceBox items={[
          { label: "Pattern", value: "bubble text-center py-12 → ikona h-8 w-8 /30 → tekst 14px → podpis 12px /60" },
        ]} />
      </SectionBlock>

      {/* Alert / info box */}
      <SectionBlock title="Alert / info box" description="Kolorowe boxy informacyjne — ostrzeżenie, błąd, sukces.">
        <PreviewRow label="Ostrzeżenie (amber)">
          <div className="w-full flex items-start gap-2 bg-amber-500/15 border border-amber-500/30 rounded-xl px-3 py-2.5">
            <AlertCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-[12px] font-semibold text-amber-500">Tryb dry-run aktywny</p>
              <p className="text-[11px] text-amber-400">Emaile są logowane, ale nie wysyłane.</p>
            </div>
          </div>
        </PreviewRow>
        <PreviewRow label="Błąd (destructive)">
          <div className="w-full bg-destructive/5 border border-destructive/20 rounded-xl px-3 py-2">
            <p className="text-[10px] font-bold text-destructive uppercase mb-1">Komunikat błędu</p>
            <p className="text-[11px] text-destructive font-mono">Connection timeout after 10000ms</p>
          </div>
        </PreviewRow>
        <PreviewRow label="Sukces (emerald)">
          <div className="w-full flex items-center gap-2 bg-emerald-500/15 border border-emerald-500/30 rounded-xl px-3 py-2.5">
            <div className="h-4 w-4 rounded-full bg-emerald-400 shrink-0" />
            <p className="text-[12px] text-emerald-500 font-semibold">Połączenie SMTP nawiązane pomyślnie.</p>
          </div>
        </PreviewRow>
        <ReferenceBox items={[
          { label: "Amber", value: "bg-amber-500/15 border-amber-500/30 text-amber-500 — ostrzeżenia" },
          { label: "Red", value: "bg-destructive/5 border-destructive/20 text-destructive — błędy" },
          { label: "Green", value: "bg-emerald-500/15 border-emerald-500/30 text-emerald-500 — sukces" },
        ]} />
      </SectionBlock>
    </div>
  );
}
