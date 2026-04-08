"use client";

import React, { useState } from "react";
import {
  ChevronDown, ChevronRight, Pencil, Trash2, Eye, Plus, Search,
  Image, Save, Loader2, ExternalLink, Mail, ArrowLeft, Calendar,
  Building2, CreditCard, Settings, Clock, User, Home, Moon,
  CheckCircle2, XCircle,
} from "lucide-react";
import { SectionBlock, PreviewRow, PreviewGroup, ReferenceBox, RulesBlock } from "../shared";
import { BubbleSelect } from "@/components/ui/bubble-select";
import { cn } from "@/lib/utils";

const FILTER_TYPE = [
  { value: "", label: "Wszystkie typy" },
  { value: "BOOKING", label: "Rezerwacja" },
  { value: "OFFER", label: "Oferta" },
];
const FILTER_STATUS = [
  { value: "", label: "Wszystkie statusy" },
  { value: "PENDING", label: "Oczekujące" },
  { value: "CONFIRMED", label: "Potwierdzone" },
];

export function LayoutPatternsSection() {
  const [sectionOpen, setSectionOpen] = useState(true);
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  return (
    <div className="space-y-5">

      {/* ── Bubble cards ── */}
      <SectionBlock title="Karty (Bubble)" description="Bazowy kontener UI. Trzy warianty: statyczna, interaktywna, mała.">
        <PreviewRow label="bubble — statyczna karta">
          <div className="bubble p-5 w-full">
            <h3 className="text-[14px] font-semibold">Tytuł karty</h3>
            <p className="text-[12px] text-muted-foreground mt-1">Opis zawartości karty — statyczna, nie reaguje na hover.</p>
          </div>
        </PreviewRow>
        <PreviewRow label="bubble-interactive — klikalna karta">
          <div className="bubble-interactive p-5 w-full cursor-pointer">
            <h3 className="text-[14px] font-semibold">Klikalna karta</h3>
            <p className="text-[12px] text-muted-foreground mt-1">Hover zmienia border-color (bez translateY). Najedź myszką.</p>
          </div>
        </PreviewRow>
        <ReferenceBox items={[
          { label: "Statyczna", value: ".bubble — bg-card, border, rounded-[var(--radius)]" },
          { label: "Klikalna", value: ".bubble-interactive — hover:border-color, BEZ translateY" },
          { label: "Mała", value: ".bubble-sm — mniejszy radius i padding" },
          { label: "Plik", value: "src/styles/globals.css" },
        ]} />
        <RulesBlock
          never={[
            "NIGDY: box-shadow na kartach w panelu admina",
            "NIGDY: translateY na bubble-interactive hover — tylko border-color",
          ]}
        />
      </SectionBlock>

      {/* ── Static belka (like pricing plans) ── */}
      <SectionBlock title="Belka statyczna (styl planów cenowych)" description="Karta z tytułem, badge, opisem, pill tagami i przyciskami akcji po prawej.">
        <div className="space-y-3">
          {/* Example 1 — like rate plan */}
          <div className="bubble p-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-[14px] font-semibold">Zwrotna</h3>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">DOMYŚLNY</span>
                </div>
                <p className="text-[12px] text-muted-foreground mb-2">Bezpłatne anulowanie rezerwacji do 30 dni przed rozpoczęciem pobytu.</p>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold bg-muted text-muted-foreground">Elastyczny</span>
                  <span className="text-[11px] text-muted-foreground">28 cen</span>
                </div>
              </div>
              <div className="flex gap-1">
                <button className="h-8 w-8 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-all"><Pencil className="h-3.5 w-3.5" /></button>
                <button className="h-8 w-8 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          </div>

          {/* Example 2 — clickable with preview */}
          <div className="bubble p-5 cursor-pointer hover:border-primary transition-colors">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-[14px] font-semibold">Potwierdzenie rezerwacji</h3>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">DOMYŚLNY</span>
                </div>
                <p className="text-[12px] text-muted-foreground mb-2">Wysyłany automatycznie po złożeniu rezerwacji przez klienta.</p>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold bg-muted text-muted-foreground">
                    <Mail className="h-3 w-3" /> Potwierdzenie rezerwacji {"{{reservation_number}}"}
                  </span>
                </div>
              </div>
              <button className="h-8 w-8 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-all shrink-0">
                <Eye className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
        <ReferenceBox items={[
          { label: "Pattern", value: "bubble p-5 → flex items-start justify-between → content + buttons" },
          { label: "Klikalna", value: "Dodaj: cursor-pointer hover:border-primary transition-colors" },
          { label: "Buttons", value: "h-8 w-8 rounded-xl flex center — Pencil, Trash2, Eye" },
          { label: "Przykłady", value: "Plany cenowe, sezony, szablony email" },
        ]} />
      </SectionBlock>

      {/* ── Page header ── */}
      <SectionBlock title="Nagłówek strony" description="Każda strona top-level zaczyna się od nagłówka z tytułem i opisem.">
        <div className="rounded-xl border border-dashed border-border/70 p-5 bg-background">
          <h2 className="text-xl font-bold tracking-tight">System cenowy</h2>
          <p className="text-[13px] text-muted-foreground mt-1">Sezony, plany cenowe, cennik i promocje.</p>
        </div>
        <div className="rounded-xl border border-dashed border-border/70 p-5 bg-background mt-3">
          <div className="flex items-center gap-3">
            <button className="btn-bubble btn-secondary-bubble px-3 py-2 text-[13px]"><ArrowLeft className="h-4 w-4" /> Wróć</button>
            <div>
              <h2 className="text-lg font-bold tracking-tight">Potwierdzenie rezerwacji</h2>
              <p className="text-[12px] text-muted-foreground">Własny szablon · Edytuj HTML i obserwuj podgląd na żywo</p>
            </div>
          </div>
        </div>
        <ReferenceBox items={[
          { label: "Główny", value: "h2 text-xl font-bold tracking-tight + p text-[13px] text-muted-foreground mt-1" },
          { label: "Z powrotem", value: "btn-secondary (← Wróć) + h2 text-lg font-bold + p text-[12px]" },
          { label: "Użycie", value: "KAŻDA strona top-level — bez wyjątków" },
        ]} />
      </SectionBlock>

      {/* ── Tabs ── */}
      <SectionBlock title="Taby nawigacyjne" description="tabs-bubble + tab-bubble. Scroll na mobile. Count bubble opcjonalny.">
        <PreviewRow label="Z count bubble">
          <div className="tabs-bubble inline-flex">
            <button className="tab-bubble tab-bubble-active flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> Sezony <span className="count-bubble count-bubble-active">2</span></button>
            <button className="tab-bubble flex items-center gap-1.5"><CreditCard className="h-3.5 w-3.5" /> Plany cenowe <span className="count-bubble">3</span></button>
            <button className="tab-bubble">Cennik</button>
            <button className="tab-bubble">Kody rabatowe <span className="count-bubble">0</span></button>
          </div>
        </PreviewRow>
        <PreviewRow label="Bez ikon (ustawienia)">
          <div className="tabs-bubble inline-flex">
            <button className="tab-bubble tab-bubble-active">Rezerwacje</button>
            <button className="tab-bubble">Płatności</button>
            <button className="tab-bubble">Obiekt</button>
          </div>
        </PreviewRow>
        <ReferenceBox items={[
          { label: "Container", value: "overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0" },
          { label: "Tabs", value: "tabs-bubble inline-flex min-w-max" },
          { label: "Tab", value: "tab-bubble / tab-bubble-active" },
          { label: "Count", value: "count-bubble / count-bubble-active" },
          { label: "Plik", value: "src/styles/globals.css" },
        ]} />
      </SectionBlock>

      {/* ── Filter bar ── */}
      <SectionBlock title="Pasek filtrów" description="Filtry nad listą/tabelą — BubbleSelect + search + count wyników.">
        <div className="rounded-xl border border-dashed border-border/70 p-5 bg-background" style={{ overflow: "visible" }}>
          <div className="flex flex-wrap gap-2 items-center" style={{ overflow: "visible" }}>
            <div className="w-[180px]" style={{ overflow: "visible" }}>
              <BubbleSelect options={FILTER_TYPE} value={filterType} onChange={setFilterType} />
            </div>
            <div className="w-[170px]" style={{ overflow: "visible" }}>
              <BubbleSelect options={FILTER_STATUS} value={filterStatus} onChange={setFilterStatus} />
            </div>
            <div className="relative w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <input type="text" placeholder="Szukaj..." className="input-bubble h-11 w-full text-[13px]" style={{ paddingLeft: 40 }} />
            </div>
            <div className="flex-1" />
            <span className="text-[12px] text-muted-foreground">47 wpisów</span>
          </div>
        </div>
        <ReferenceBox items={[
          { label: "Pattern", value: "flex flex-wrap gap-2 + overflow:visible (portal BubbleSelect)" },
          { label: "Selekty", value: "BubbleSelect w div z width + overflow:visible" },
          { label: "Search", value: "input-bubble z paddingLeft:40 (inline, nie @apply)" },
          { label: "Spacer", value: "flex-1 między filtrami a countem" },
          { label: "Przykłady", value: "Email logi, klienci, rezerwacje, płatności" },
        ]} />
      </SectionBlock>

      {/* ── Table (standard główny — wzorzec z Klientów/Rezerwacji) ── */}
      <SectionBlock title="Tabela danych (standard główny)" description="table-bubble w bubble wrapper. Avatar, badge statusu, akcje. Wzorzec z zakładek Klienci i Rezerwacje.">
        <div className="bubble overflow-x-auto">
          <table className="table-bubble w-full">
            <thead>
              <tr>
                <th className="text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-3 py-2.5">#</th>
                <th className="text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-3 py-2.5">Klient</th>
                <th className="text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-3 py-2.5">Termin</th>
                <th className="text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-3 py-2.5">Status</th>
                <th className="text-right text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-3 py-2.5">Kwota</th>
                <th className="text-right text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-3 py-2.5">Akcje</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-border/50 hover:bg-muted/30 transition-colors cursor-pointer">
                <td className="px-3 py-3">
                  <div className="text-[12px] text-muted-foreground font-mono">ZW-2026-0008</div>
                  <div className="text-[10px] text-muted-foreground">Strona www</div>
                </td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <User className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[13px] font-medium truncate">Jan Kowalski</div>
                      <div className="text-[11px] text-muted-foreground truncate">jan@example.com</div>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3">
                  <div className="text-[12px]">15 lip → 17 lip 2026</div>
                  <div className="text-[11px] text-muted-foreground">2 noce</div>
                </td>
                <td className="px-3 py-3">
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600">
                    <CheckCircle2 className="h-3 w-3" />Potwierdzona
                  </span>
                </td>
                <td className="px-3 py-3 text-right">
                  <div className="text-[13px] font-bold">1 350 zł</div>
                </td>
                <td className="px-3 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-all"><Eye className="h-3.5 w-3.5" /></button>
                    <button className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-all"><Pencil className="h-3.5 w-3.5" /></button>
                  </div>
                </td>
              </tr>
              <tr className="border-t border-border/50 hover:bg-muted/30 transition-colors cursor-pointer">
                <td className="px-3 py-3">
                  <div className="text-[12px] text-muted-foreground font-mono">ZW-2026-0012</div>
                  <div className="text-[10px] text-muted-foreground">Telefon</div>
                </td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <User className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[13px] font-medium truncate">Anna Nowak</div>
                      <div className="text-[11px] text-muted-foreground truncate">anna@test.pl</div>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3">
                  <div className="text-[12px]">20 lip → 25 lip 2026</div>
                  <div className="text-[11px] text-muted-foreground">5 nocy</div>
                </td>
                <td className="px-3 py-3">
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600">
                    <Clock className="h-3 w-3" />Oczekująca
                  </span>
                </td>
                <td className="px-3 py-3 text-right">
                  <div className="text-[13px] font-bold">3 750 zł</div>
                  <div className="text-[10px] text-amber-600 font-medium">Do zapłaty: 1 125 zł</div>
                </td>
                <td className="px-3 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-all"><Eye className="h-3.5 w-3.5" /></button>
                    <button className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-all"><Pencil className="h-3.5 w-3.5" /></button>
                  </div>
                </td>
              </tr>
              <tr className="border-t border-border/50 hover:bg-muted/30 transition-colors cursor-pointer">
                <td className="px-3 py-3">
                  <div className="text-[12px] text-muted-foreground font-mono">ZW-2026-0005</div>
                  <div className="text-[10px] text-muted-foreground">E-mail</div>
                </td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Building2 className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[13px] font-medium truncate">Firma ABC Sp. z o.o.</div>
                      <div className="text-[11px] text-muted-foreground truncate">biuro@firmaabc.pl</div>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3">
                  <div className="text-[12px]">3 kwi → 3 kwi 2026</div>
                  <div className="text-[11px] text-muted-foreground">1 dzień</div>
                </td>
                <td className="px-3 py-3">
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-destructive/15 text-destructive">
                    <XCircle className="h-3 w-3" />Anulowana
                  </span>
                </td>
                <td className="px-3 py-3 text-right">
                  <div className="text-[13px] font-bold text-muted-foreground line-through">800 zł</div>
                </td>
                <td className="px-3 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-all"><Eye className="h-3.5 w-3.5" /></button>
                    <button className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-all"><Pencil className="h-3.5 w-3.5" /></button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <ReferenceBox items={[
          { label: "Wrapper", value: "bubble overflow-x-auto — karta z zaokrągleniem + scroll na mobile" },
          { label: "Tabela", value: "table-bubble w-full — klasa CSS z globals.css" },
          { label: "Header", value: "text-[11px] font-bold uppercase tracking-wider px-3 py-2.5" },
          { label: "Wiersz", value: "border-t border-border/50 hover:bg-muted/30 transition-colors cursor-pointer" },
          { label: "Komórka", value: "px-3 py-3 — spójny padding" },
          { label: "Avatar", value: "h-8 w-8 rounded-full bg-primary/10 — ikona User/Building2 h-3.5 text-primary" },
          { label: "Badge", value: "text-[11px] font-semibold px-2 py-0.5 rounded-full bg-COLOR/15 text-COLOR" },
          { label: "Akcje", value: "h-7 w-7 rounded-lg — Eye, Pencil, ExternalLink (h-3.5)" },
          { label: "Plik CSS", value: "src/styles/globals.css (.table-bubble)" },
          { label: "Przykłady", value: "Rezerwacje, Klienci — identyczny wzorzec" },
        ]} />
        <RulesBlock
          always={[
            "bubble overflow-x-auto jako wrapper tabeli",
            "Avatar klienta: h-8 w-8 rounded-full bg-primary/10",
            "Badge statusu: bg-COLOR/15 (opacity) — działa w light i dark mode",
            "Akcje po prawej: h-7 w-7 rounded-lg icon buttons",
          ]}
          never={[
            "NIGDY: bg-emerald-50, bg-amber-50 na badge — nie działa w dark mode",
            "NIGDY: shadow na wierszach tabeli",
          ]}
        />
      </SectionBlock>

      {/* ── Collapsible section (live) ── */}
      <SectionBlock title="Sekcja zwijana (DS §25)" description="Animacja CSS Grid 0fr→1fr. Zawartość ZAWSZE w DOM. Kliknij, aby przetestować.">
        <div className="rounded-xl border border-dashed border-border/70 p-4 bg-background">
          <div className="bubble">
            <button onClick={() => setSectionOpen(!sectionOpen)}
              className="w-full flex items-center gap-3 px-5 py-4 hover:bg-muted/20 transition-colors">
              <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Settings className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 text-left">
                <h3 className="text-[14px] font-semibold">Przykładowa sekcja</h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">Opis sekcji — kliknij nagłówek, aby zwinąć/rozwinąć.</p>
              </div>
              {sectionOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
            </button>
            <div className={`section-collapse ${sectionOpen ? "section-open" : ""}`}>
              <div className="section-collapse-inner">
                <div className="px-5 pb-5 border-t border-border/50 pt-4 space-y-3">
                  <div>
                    <label className="text-[12px] font-semibold text-muted-foreground block mb-1.5">Nazwa ustawienia</label>
                    <input type="text" value="Wartość" readOnly className="input-bubble h-11 w-full text-[14px]" />
                  </div>
                  <p className="text-[10px] text-muted-foreground">Podpowiedź pod polem formularza.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <ReferenceBox items={[
          { label: "CSS", value: ".section-collapse + .section-open + .section-collapse-inner" },
          { label: "Animacja", value: "grid-template-rows: 0fr→1fr, 300ms cubic-bezier(0.4,0,0.2,1)" },
          { label: "Ikona", value: "h-8 w-8 rounded-xl bg-primary/10 — ikona h-4 w-4 text-primary" },
          { label: "Stan", value: "useState(true) — domyślnie otwarte" },
          { label: "Plik", value: "src/styles/globals.css (CSS), dowolny komponent (React)" },
        ]} />
        <RulesBlock
          always={[
            "Zawartość ZAWSZE w DOM — section-collapse + klasa, nigdy {open && ...}",
            "Każda sekcja MUSI mieć opis pod tytułem",
            "Ikona w kółku bg-primary/10 — nigdy goła ikona",
          ]}
          never={[
            "NIGDY: {open && <div>...</div>} — łamie animację zamykania",
            "NIGDY: sekcja bez opisu",
          ]}
        />
      </SectionBlock>

      {/* ── Empty state ── */}
      <SectionBlock title="Empty state" description="Gdy lista jest pusta. Ikona + tekst + opcjonalnie CTA.">
        <div className="rounded-xl border border-dashed border-border/70 bg-background p-4">
          <div className="bubble text-center py-12">
            <Mail className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-[14px] font-medium text-muted-foreground">Brak wpisów</p>
            <p className="text-[12px] text-muted-foreground/60 mt-1">Dodaj pierwszy element, aby rozpocząć.</p>
          </div>
        </div>
        <ReferenceBox items={[
          { label: "Pattern", value: "bubble text-center py-12 → ikona h-8 w-8 /30 → tekst 14px → podpis 12px /60" },
          { label: "Użycie", value: "Puste listy, tabele, filtry bez wyników, nowe moduły" },
        ]} />
      </SectionBlock>

      {/* ── List with clickable rows ── */}
      <SectionBlock title="Lista klikalna (logi, historia)" description="Wiersze bubble z kropką statusu, klik → SlidePanel ze szczegółami.">
        <div className="space-y-1">
          <button className="w-full bubble px-4 py-3 flex items-center gap-3 hover:bg-muted/20 transition-colors text-left">
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-400 shrink-0" />
            <span className="text-[11px] font-semibold text-muted-foreground min-w-[100px]">Potwierdzenie</span>
            <span className="text-[12px] font-medium truncate flex-1">jan.kowalski@example.com</span>
            <span className="text-[11px] text-muted-foreground hidden sm:block">System</span>
            <span className="text-[11px] text-muted-foreground shrink-0 w-[120px] text-right">07.04.2026, 12:34</span>
          </button>
          <button className="w-full bubble px-4 py-3 flex items-center gap-3 hover:bg-muted/20 transition-colors text-left">
            <div className="h-2.5 w-2.5 rounded-full bg-destructive shrink-0" />
            <span className="text-[11px] font-semibold text-muted-foreground min-w-[100px]">Przypomnienie</span>
            <span className="text-[12px] font-medium truncate flex-1">anna.nowak@test.pl</span>
            <span className="text-[11px] text-muted-foreground hidden sm:block">Cron</span>
            <span className="text-[11px] text-muted-foreground shrink-0 w-[120px] text-right">06.04.2026, 09:00</span>
          </button>
        </div>
        <ReferenceBox items={[
          { label: "Pattern", value: "button w-full bubble px-4 py-3 flex items-center gap-3" },
          { label: "Status dot", value: "h-2.5 w-2.5 rounded-full bg-emerald/amber/destructive" },
          { label: "Hover", value: "hover:bg-muted/20 transition-colors" },
          { label: "Klik", value: "onClick → setSelected(item) → SlidePanel" },
          { label: "Przykłady", value: "Email logi, historia aktywności" },
        ]} />
      </SectionBlock>

      {/* ── Detail row pattern (SlidePanel content) ── */}
      <SectionBlock title="Detail row (zawartość SlidePanel)" description="Label + value w dwóch kolumnach, separator border-b. Używane w szczegółach.">
        <div className="rounded-xl border border-dashed border-border/70 p-5 bg-background space-y-0">
          <div className="flex items-start justify-between py-2.5 border-b border-border/30">
            <span className="text-[11px] text-muted-foreground">Typ</span>
            <span className="text-[12px] font-medium text-right">Potwierdzenie rezerwacji</span>
          </div>
          <div className="flex items-start justify-between py-2.5 border-b border-border/30">
            <span className="text-[11px] text-muted-foreground">Odbiorca</span>
            <span className="text-[12px] font-medium text-right">Jan Kowalski &lt;jan@example.com&gt;</span>
          </div>
          <div className="flex items-start justify-between py-2.5 border-b border-border/30">
            <span className="text-[11px] text-muted-foreground">Rezerwacja</span>
            <span className="text-[12px] font-medium text-primary flex items-center gap-1">Otwórz <ExternalLink className="h-3 w-3" /></span>
          </div>
          <div className="bg-destructive/5 border border-destructive/20 rounded-xl px-3 py-2 mt-3">
            <p className="text-[10px] font-bold text-destructive uppercase mb-1">Komunikat błędu</p>
            <p className="text-[11px] text-destructive font-mono">Connection timeout after 10000ms</p>
          </div>
        </div>
        <ReferenceBox items={[
          { label: "Row", value: "flex justify-between py-2.5 border-b border-border/30" },
          { label: "Label", value: "text-[11px] text-muted-foreground" },
          { label: "Value", value: "text-[12px] font-medium text-right" },
          { label: "Link", value: "text-primary + ExternalLink icon h-3 w-3" },
          { label: "Error box", value: "bg-destructive/5 border-destructive/20 rounded-xl" },
        ]} />
      </SectionBlock>

      {/* ── Spacing ── */}
      <SectionBlock title="Spacing i animacje" description="Zasady odstępów, animacji wejścia i przejść.">
        <PreviewRow label="Odstępy (space-y)">
          <div className="space-y-5 w-full">
            <div className="bg-primary/10 rounded-xl px-4 py-2 text-[11px] text-primary font-semibold">space-y-5 — między sekcjami/kartami</div>
            <div className="space-y-4">
              <div className="bg-muted rounded-xl px-4 py-2 text-[11px] text-muted-foreground font-semibold">space-y-4 — pola w formularzu</div>
              <div className="bg-muted rounded-xl px-4 py-2 text-[11px] text-muted-foreground font-semibold">space-y-4 — pola w formularzu</div>
            </div>
          </div>
        </PreviewRow>
        <PreviewRow label="Padding sekcji">
          <div className="bubble w-full">
            <div className="px-5 py-4 border-b border-border/50">
              <span className="text-[11px] text-muted-foreground font-mono">px-5 py-4 — nagłówek sekcji</span>
            </div>
            <div className="px-5 pb-5 pt-4">
              <span className="text-[11px] text-muted-foreground font-mono">px-5 pb-5 pt-4 — zawartość sekcji</span>
            </div>
          </div>
        </PreviewRow>
        <ReferenceBox items={[
          { label: "Sekcje", value: "space-y-5 — między kartami/sekcjami na stronie" },
          { label: "Formularz", value: "space-y-4 — między polami w formularzu" },
          { label: "Lista", value: "space-y-3 lub space-y-1 — między belkami" },
          { label: "Flex gap", value: "gap-2 (filtry, buttony), gap-3 (większe elementy)" },
          { label: "Animacja", value: "fade-in-up na stronie (nie skeletonach), transition-colors na hover" },
        ]} />
        <RulesBlock
          always={[
            "fade-in-up na głównym kontenerze strony",
            "transition-colors na wszystkich hover stanach",
          ]}
          never={[
            "NIGDY: fade-in-up na skeletonach",
            "NIGDY: box-shadow na kartach",
          ]}
        />
      </SectionBlock>

      {/* ── Pagination ── */}
      <SectionBlock title="Paginacja" description="Prosta paginacja: prev/next + numer strony.">
        <PreviewRow label="Standardowa">
          <div className="flex items-center gap-3">
            <button className="btn-bubble btn-secondary-bubble px-3 py-1.5 text-[11px]"><ChevronDown className="h-3.5 w-3.5 rotate-90" /></button>
            <span className="text-[12px] text-muted-foreground">1 z 5</span>
            <button className="btn-bubble btn-secondary-bubble px-3 py-1.5 text-[11px]"><ChevronDown className="h-3.5 w-3.5 -rotate-90" /></button>
          </div>
        </PreviewRow>
        <ReferenceBox items={[
          { label: "Pattern", value: "flex items-center justify-center gap-3 pt-2" },
          { label: "Buttons", value: "btn-secondary-bubble px-3 py-1.5 text-[11px] + ChevronLeft/Right" },
          { label: "Disabled", value: "disabled:opacity-30 na pierwszej/ostatniej stronie" },
        ]} />
      </SectionBlock>
    </div>
  );
}
