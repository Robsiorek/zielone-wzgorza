"use client";

import React from "react";
import { Loader2, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatMoneyMinor } from "@/lib/format";
import type { SelectedResource, PanelTab } from "../use-unified-form";

interface Props {
  activeTab: PanelTab;
  selectedResources: SelectedResource[];
  nights: number;
  /** Total price in grosze (minor units) */
  totalPrice: number;
  totalGuests: number;
  /** Addons total in grosze */
  addonsTotal?: number;
  /** Item addons total in grosze */
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

  return (
    <div className="border-t-2 border-border pt-4 mt-4 space-y-4">
      {selectedResources.length > 0 && showPricing && (
        <div className="space-y-2">
          {selectedResources.map(sr => (
            <div key={sr.resourceId} className="flex items-center justify-between text-[12px]">
              <span className="text-muted-foreground">
                {sr.name}{sr.unitNumber ? ` (${sr.unitNumber})` : ""} • {sr.adults + sr.children} os.
              </span>
              {sr.pricePerNight > 0 && (
                <span className="font-medium">
                  {nights} × {sr.pricePerNight} zł = <span className="font-bold">{nights * sr.pricePerNight} zł</span>
                </span>
              )}
            </div>
          ))}
          {addonsTotal > 0 && (
            <div className="flex items-center justify-between text-[12px]">
              <span className="text-muted-foreground">Globalne opłaty i dodatki</span>
              <span className="font-bold">{formatMoneyMinor(addonsTotal)}</span>
            </div>
          )}
          {itemAddonsTotal > 0 && (
            <div className="flex items-center justify-between text-[12px]">
              <span className="text-muted-foreground">Udogodnienia</span>
              <span className="font-bold">{formatMoneyMinor(itemAddonsTotal)}</span>
            </div>
          )}
        </div>
      )}

      {showPricing && totalPrice > 0 && (
        <div className="flex items-center justify-between text-[14px] font-bold pt-2 border-t border-border/50">
          <span>Razem</span>
          <span>
            {formatMoneyMinor(totalPrice)}
            {totalGuests > 0 && (
              <span className="font-normal text-[12px] text-muted-foreground ml-2">
                • {totalGuests} {totalGuests === 1 ? "osoba" : totalGuests < 5 ? "osoby" : "osób"}
              </span>
            )}
          </span>
        </div>
      )}

      {activeTab === "block" && selectedResources.length > 0 && (
        <div className="text-[12px] text-muted-foreground">
          {selectedResources.length} {selectedResources.length === 1 ? "zasób" : selectedResources.length < 5 ? "zasoby" : "zasobów"} • {nights} {nights === 1 ? "noc" : nights < 5 ? "noce" : "nocy"}
        </div>
      )}

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
  );
}
