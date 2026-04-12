"use client";

import React, { useState, useEffect } from "react";
import { Loader2, Check, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatMoneyMinor } from "@/lib/format";
import type { SelectedResource, PanelTab } from "../use-unified-form";

interface Props {
  activeTab: PanelTab;
  selectedResources: SelectedResource[];
  nights: number;
  totalPrice: number;
  totalGuests: number;
  addonsTotal?: number;
  itemAddonsTotal?: number;
  canSubmit: boolean;
  saving: boolean;
  onSubmit: () => void;
  submitLabel?: string;
}

const TAB_SUBMIT: Record<PanelTab, { label: string; cls: string }> = {
  booking: { label: "Zapisz rezerwację", cls: "btn-bubble btn-primary-bubble" },
  offer: { label: "Zapisz ofertę", cls: "btn-bubble bg-blue-600 text-white hover:bg-blue-700 border-2 border-blue-600" },
  block: { label: "Zapisz blokadę", cls: "btn-bubble bg-slate-600 text-white hover:bg-slate-700 border-2 border-slate-600" },
};

export function SummarySection({ activeTab, selectedResources, nights, totalPrice, totalGuests, addonsTotal = 0, itemAddonsTotal = 0, canSubmit, saving, onSubmit, submitLabel }: Props) {
  const config = TAB_SUBMIT[activeTab];
  const showPricing = activeTab !== "block";
  const label = submitLabel || config.label;

  const [detailsOpen, setDetailsOpen] = useState(selectedResources.length < 3);

  useEffect(() => {
    setDetailsOpen(selectedResources.length < 3);
  }, [selectedResources.length]);

  const hasDetails = selectedResources.length > 0 && showPricing;

  return (
    <div className="relative -mx-6 -mb-6 bg-card" style={{ borderTop: "2px solid hsl(var(--border))" }}>

      {/* ── Floating pill toggle — centered on top border ── */}
      {hasDetails && (
        <div className="absolute left-1/2 -translate-x-1/2 -top-[14px] z-[2]">
          <button
            type="button"
            onClick={() => setDetailsOpen(!detailsOpen)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1 rounded-full",
              "text-[11px] font-semibold",
              "bg-card border-2 border-border",
              "text-muted-foreground hover:text-foreground hover:border-primary/30",
              "transition-all duration-200",
              "shadow-sm hover:shadow-md",
            )}
          >
            {detailsOpen ? (
              <>
                <ChevronDown className="h-3 w-3" />
                <span>zwiń</span>
              </>
            ) : (
              <>
                <ChevronUp className="h-3 w-3" />
                <span>rozwiń</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* ── Collapsible details ── */}
      <div
        className="overflow-hidden transition-all duration-250 ease-out"
        style={{
          maxHeight: detailsOpen && hasDetails ? 220 : 0,
          opacity: detailsOpen && hasDetails ? 1 : 0,
        }}
      >
        <div
          className="px-5 pt-4 pb-2 space-y-1.5"
          style={{
            maxHeight: 200,
            overflowY: "auto",
          }}
        >
          {selectedResources.map(sr => (
            <div key={sr.resourceId} className="flex items-center justify-between text-[12px]">
              <span className="text-muted-foreground truncate mr-3">
                {sr.name}{sr.unitNumber ? ` (${sr.unitNumber})` : ""} • {sr.adults + sr.children} os.
              </span>
              {sr.pricePerNight > 0 && (
                <span className="font-medium text-foreground/80 shrink-0">
                  {nights} × {sr.pricePerNight} zł = <span className="font-bold text-foreground">{nights * sr.pricePerNight} zł</span>
                </span>
              )}
            </div>
          ))}
          {addonsTotal > 0 && (
            <div className="flex items-center justify-between text-[12px]">
              <span className="text-muted-foreground">Globalne opłaty i dodatki</span>
              <span className="font-bold text-foreground">{formatMoneyMinor(addonsTotal)}</span>
            </div>
          )}
          {itemAddonsTotal > 0 && (
            <div className="flex items-center justify-between text-[12px]">
              <span className="text-muted-foreground">Udogodnienia</span>
              <span className="font-bold text-foreground">{formatMoneyMinor(itemAddonsTotal)}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Total row ── */}
      {showPricing && totalPrice > 0 && (
        <div
          className="px-5 py-3 flex items-center justify-between"
          style={{ borderTop: hasDetails && detailsOpen ? "1px solid hsl(var(--border) / 0.4)" : "none" }}
        >
          <span className="text-[14px] font-bold">Razem</span>
          <span className="flex items-center gap-2">
            <span className="text-[16px] font-bold">{formatMoneyMinor(totalPrice)}</span>
            {totalGuests > 0 && (
              <span className="text-[11px] text-muted-foreground font-medium">
                • {totalGuests} {totalGuests === 1 ? "osoba" : totalGuests < 5 ? "osoby" : "osób"}
              </span>
            )}
          </span>
        </div>
      )}

      {activeTab === "block" && selectedResources.length > 0 && (
        <div className="px-5 py-3 text-[12px] text-muted-foreground">
          {selectedResources.length} {selectedResources.length === 1 ? "zasób" : selectedResources.length < 5 ? "zasoby" : "zasobów"} • {nights} {nights === 1 ? "noc" : nights < 5 ? "noce" : "nocy"}
        </div>
      )}

      {/* ── Submit button — always visible ── */}
      <div className="px-5 pb-5 pt-1">
        <button
          onClick={onSubmit}
          disabled={!canSubmit || saving}
          className={cn(
            config.cls,
            "w-full py-3 text-[13px] font-semibold flex items-center justify-center gap-2 rounded-2xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          )}
        >
          {saving
            ? <><Loader2 className="h-4 w-4 animate-spin" /> Zapisywanie...</>
            : <><Check className="h-4 w-4" /> {label}</>
          }
        </button>
      </div>
    </div>
  );
}
