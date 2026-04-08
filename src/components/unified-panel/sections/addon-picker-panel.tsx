"use client";

import React, { useState, useMemo } from "react";
import { Search, Package, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { SlidePanel } from "@/components/ui/slide-panel";
import type { AddonOption, SelectedAddon, AddonScope } from "../addon-types";
import { PRICING_TYPE_LABELS, PRICING_TYPE_LABELS_PER_ITEM } from "../addon-types";
import { formatMoneyMinor } from "@/lib/format";

interface Props {
  open: boolean;
  onClose: () => void;
  scope: AddonScope;
  availableAddons: AddonOption[];
  alreadySelected: SelectedAddon[];
  onAdd: (addon: AddonOption) => void;
}

export function AddonPickerPanel({ open, onClose, scope, availableAddons, alreadySelected, onAdd }: Props) {
  const [search, setSearch] = useState("");
  const selectedIds = useMemo(() => new Set(alreadySelected.map(sa => sa.addonId)), [alreadySelected]);
  const labels = scope === "PER_ITEM" ? PRICING_TYPE_LABELS_PER_ITEM : PRICING_TYPE_LABELS;

  const filtered = useMemo(() => {
    let list = availableAddons.filter(a => a.scope === scope);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(a => a.name.toLowerCase().includes(q) || (a.description || "").toLowerCase().includes(q));
    }
    return list;
  }, [availableAddons, scope, search]);

  const handleAdd = (addon: AddonOption) => {
    onAdd(addon);
    // Don't close — user might want to add multiple
  };

  const panelTitle = (
    <div className="flex items-center gap-3">
      <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
        <Package className="h-4 w-4 text-primary" />
      </div>
      <div className="text-[14px] font-bold">{scope === "PER_ITEM" ? "Dodaj udogodnienie" : "Dodaj dodatek"}</div>
    </div>
  );

  return (
    <SlidePanel open={open} onClose={onClose} title={panelTitle} width={400}>
      <div className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Szukaj..."
            className="input-bubble h-10 w-full text-[13px]"
            style={{ paddingLeft: 40 }} />
          {search && (
            <button onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-all">
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <div className="text-center py-8 text-[13px] text-muted-foreground">
            {search ? "Brak wyników" : "Brak dostępnych dodatków"}
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(addon => {
              const isAdded = selectedIds.has(addon.id);
              return (
                <div key={addon.id}
                  className={cn(
                    "rounded-2xl border-2 p-3 transition-colors",
                    isAdded
                      ? "border-primary/30 bg-primary/5 opacity-60"
                      : "border-border hover:border-primary/30 cursor-pointer"
                  )}
                  onClick={() => !isAdded && handleAdd(addon)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-medium">{addon.name}</span>
                        {addon.isRequired && (
                          <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                            obowiązkowy
                          </span>
                        )}
                      </div>
                      {addon.description && (
                        <div className="text-[11px] text-muted-foreground mt-0.5">{addon.description}</div>
                      )}
                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        {formatMoneyMinor(addon.priceMinor)} {labels[addon.pricingType]}
                      </div>
                    </div>
                    {isAdded ? (
                      <span className="text-[11px] font-semibold text-primary px-3 py-1.5">Dodano</span>
                    ) : (
                      <button className="btn-icon-bubble h-8 w-8 bg-card shrink-0">
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </SlidePanel>
  );
}
