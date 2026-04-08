"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

/**
 * Section block within a tab — collapsible DS §25 pattern.
 */
export function SectionBlock({ title, description, children, defaultOpen = true }: {
  title: string;
  description: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bubble">
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-5 py-4 hover:bg-muted/20 transition-colors">
        <div className="flex-1 text-left">
          <h3 className="text-[14px] font-semibold">{title}</h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">{description}</p>
        </div>
        {open ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
      </button>
      <div className={`section-collapse ${open ? "section-open" : ""}`}>
        <div className="section-collapse-inner">
          <div className="px-5 pb-5 border-t border-border/50 pt-4 space-y-4">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Section label — visual divider between preview and usage areas.
 */
export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 pt-1">
      <span className="text-[10px] font-bold text-primary uppercase tracking-wider shrink-0">{children}</span>
      <div className="flex-1 h-px bg-primary/20" />
    </div>
  );
}

/**
 * Preview group — wraps preview rows with "Podgląd" header.
 */
export function PreviewGroup({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <span className="text-[10px] font-bold text-primary uppercase tracking-wider shrink-0">Podgląd komponentu</span>
        <div className="flex-1 h-px bg-primary/20" />
      </div>
      {children}
    </div>
  );
}

/**
 * Preview row — renders components inline with a label.
 */
export function PreviewRow({ label, children }: { label?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-border/70 p-4 bg-background">
      {label && <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3">{label}</p>}
      <div className="flex flex-wrap items-center gap-3">
        {children}
      </div>
    </div>
  );
}

/**
 * Reference box — pro tip style with blue accent.
 */
export function ReferenceBox({ items }: {
  items: { label: string; value: string }[];
}) {
  return (
    <div className="rounded-xl border-2 border-primary/20 bg-primary/[0.03] px-4 py-3.5">
      <div className="flex items-center gap-2 mb-2.5">
        <div className="h-5 w-5 rounded-md bg-primary/15 flex items-center justify-center shrink-0">
          <svg className="h-3 w-3 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </div>
        <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Zastosowanie</span>
      </div>
      <div className="space-y-1.5">
        {items.map((item, i) => (
          <div key={i} className="flex items-start gap-2">
            <span className="text-[10px] font-bold text-primary/60 uppercase tracking-wider shrink-0 w-[90px] pt-0.5">{item.label}</span>
            <span className="text-[11px] font-mono text-foreground break-all">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Rules block: ZAWSZE / NIGDY items.
 */
export function RulesBlock({ always, never }: { always?: string[]; never?: string[] }) {
  return (
    <div className="space-y-2">
      {always && always.length > 0 && (
        <div className="space-y-1">
          {always.map((r, i) => (
            <p key={i} className="text-[11px]"><span className="text-emerald-600 font-bold">ZAWSZE:</span> <span className="text-muted-foreground">{r}</span></p>
          ))}
        </div>
      )}
      {never && never.length > 0 && (
        <div className="space-y-1">
          {never.map((r, i) => (
            <p key={i} className="text-[11px]"><span className="text-destructive font-bold">NIGDY:</span> <span className="text-muted-foreground">{r}</span></p>
          ))}
        </div>
      )}
    </div>
  );
}
