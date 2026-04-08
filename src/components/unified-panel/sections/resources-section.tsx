"use client";

import React, { useEffect } from "react";
import { Home, Lock, AlertTriangle, Check, Loader2, Minus, Plus, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { UnitBadge } from "@/components/ui/unit-badge";
import type { ResourceOption, SelectedResource, PanelTab, AddonOption, SelectedAddon } from "../use-unified-form";
import { ItemAddonsSection } from "./item-addons-section";

interface Props {
  activeTab: PanelTab;
  startDate: string;
  endDate: string;
  nights: number;
  allResources: ResourceOption[];
  selectedResources: SelectedResource[];
  resourcesLoading: boolean;
  resourcesLoaded: boolean;
  blockedResourceIds: Set<string>;
  softBlockedResourceIds: Set<string>;
  blockedLabels: Map<string, string>;
  softBlockedLabels: Map<string, string>;
  onLoadResources: () => void;
  onToggleResource: (r: ResourceOption) => void;
  onUpdatePrice: (resourceId: string, price: number) => void;
  onUpdateGuests: (resourceId: string, adults: number, children: number) => void;
  onToggleCapacityOverride: (resourceId: string) => void;
  // Per-item addons
  availableItemAddons?: AddonOption[];
  itemAddons?: Record<string, SelectedAddon[]>;
  onRemoveItemAddon?: (addonId: string, resourceId: string) => void;
  onUpdateItemAddonField?: (addonId: string, field: "unitPriceMinor" | "calcPersons" | "calcNights" | "calcQuantity", value: number, resourceId: string) => void;
  onOpenItemAddonPicker?: (resourceId: string) => void;
}

export function ResourcesSection({
  activeTab, startDate, endDate, nights, allResources, selectedResources,
  resourcesLoading, resourcesLoaded, blockedResourceIds, softBlockedResourceIds,
  blockedLabels, softBlockedLabels, onLoadResources, onToggleResource, onUpdatePrice,
  onUpdateGuests, onToggleCapacityOverride,
  availableItemAddons, itemAddons, onRemoveItemAddon, onUpdateItemAddonField, onOpenItemAddonPicker,
}: Props) {
  // Auto-load when dates are valid
  useEffect(() => {
    if (startDate && endDate && nights > 0 && !resourcesLoaded && !resourcesLoading) {
      onLoadResources();
    }
  }, [startDate, endDate, nights, resourcesLoaded, resourcesLoading, onLoadResources]);

  if (!startDate || !endDate || nights <= 0) {
    return (
      <div className="space-y-5">
        <h3 className="flex items-center gap-2 text-[14px] font-semibold text-muted-foreground">
          <Home className="h-4 w-4" />
          Zasoby
        </h3>
        <div className="text-[12px] text-muted-foreground/60 py-6 text-center border-2 border-dashed border-border rounded-2xl">
          Wybierz daty aby zobaczyć dostępność
        </div>
      </div>
    );
  }

  if (resourcesLoading) {
    return (
      <div className="space-y-5">
        <h3 className="flex items-center gap-2 text-[14px] font-semibold">
          <Home className="h-4 w-4 text-primary" />
          Zasoby
        </h3>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="ml-2 text-[13px] text-muted-foreground">Sprawdzanie dostępności...</span>
        </div>
      </div>
    );
  }

  const isSelected = (id: string) => selectedResources.some(sr => sr.resourceId === id);
  const showPricing = activeTab !== "block";

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-[14px] font-semibold">
          <Home className="h-4 w-4 text-primary" />
          Zasoby
          {selectedResources.length > 0 && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
              {selectedResources.length}
            </span>
          )}
        </h3>
      </div>

      <div className="space-y-2">
        {allResources.map(r => {
          const blocked = blockedResourceIds.has(r.id);
          const softBlocked = softBlockedResourceIds.has(r.id);
          const selected = isSelected(r.id);
          const disabled = blocked && activeTab !== "block" && !selected;
          const sr = selectedResources.find(s => s.resourceId === r.id);
          const overCapacity = sr && r.maxCapacity && (sr.adults + sr.children) > r.maxCapacity;

          return (
            <div key={r.id} className={cn(
              "rounded-2xl border-2 transition-all",
              selected ? "border-primary" :
              disabled ? "border-border bg-muted/30 opacity-50" :
              "border-border hover:border-muted-foreground/25"
            )}>
              {/* Resource row */}
              <button
                onClick={() => !disabled && onToggleResource(r)}
                disabled={disabled}
                className={cn(
                  "w-full text-left p-4 flex items-center gap-3",
                  disabled ? "cursor-not-allowed" : "cursor-pointer"
                )}
              >
                <div className={cn(
                  "h-5 w-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors",
                  selected ? "bg-primary border-primary" : "border-muted-foreground/30"
                )}>
                  {selected && <Check className="h-3 w-3 text-white" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-semibold truncate">{r.name}</span>
                    {r.unitNumber && <UnitBadge number={r.unitNumber} size="sm" />}
                    {r.maxCapacity && (
                      <span className="text-[10px] text-muted-foreground font-medium">max {r.maxCapacity} os.</span>
                    )}
                  </div>
                  {blocked && (
                    <div className="flex items-center gap-1 mt-0.5 text-[11px] text-red-500 font-medium">
                      <Lock className="h-3 w-3" />
                      {blockedLabels.get(r.id) || "Zajęty"}
                    </div>
                  )}
                  {softBlocked && !blocked && (
                    <div className="flex items-center gap-1 mt-0.5 text-[11px] text-amber-500 font-medium">
                      <AlertTriangle className="h-3 w-3" />
                      {softBlockedLabels.get(r.id) || "Oferta"}
                    </div>
                  )}
                </div>

                {selected && showPricing && (
                  <div className="shrink-0 flex items-center gap-1" onClick={e => e.stopPropagation()}>
                    <input
                      type="number"
                      min={0}
                      value={sr?.pricePerNight || ""}
                      onChange={e => onUpdatePrice(r.id, Number(e.target.value) || 0)}
                      placeholder="0"
                      className="input-bubble h-11 w-[100px] text-[13px] text-right"
                    />
                    <span className="text-[11px] text-muted-foreground">zł/noc</span>
                  </div>
                )}
              </button>

              {/* Per-resource guests — white bubble card */}
              {selected && showPricing && sr && (
                <div className="px-4 pb-4 pt-0">
                  <div className="bg-card border border-border rounded-xl px-4 py-3">
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2">
                        <Users className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-[12px] font-semibold text-muted-foreground">Dorośli</span>
                        <div className="flex items-center gap-1">
                          <button onClick={() => onUpdateGuests(sr.resourceId, Math.max(1, sr.adults - 1), sr.children)}
                            className="btn-icon-bubble h-7 w-7"><Minus className="h-3 w-3" /></button>
                          <span className="text-[13px] font-bold w-6 text-center">{sr.adults}</span>
                          <button onClick={() => onUpdateGuests(sr.resourceId, sr.adults + 1, sr.children)}
                            className="btn-icon-bubble h-7 w-7"><Plus className="h-3 w-3" /></button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] font-semibold text-muted-foreground">Dzieci</span>
                        <div className="flex items-center gap-1">
                          <button onClick={() => onUpdateGuests(sr.resourceId, sr.adults, Math.max(0, sr.children - 1))}
                            className="btn-icon-bubble h-7 w-7"><Minus className="h-3 w-3" /></button>
                          <span className="text-[13px] font-bold w-6 text-center">{sr.children}</span>
                          <button onClick={() => onUpdateGuests(sr.resourceId, sr.adults, sr.children + 1)}
                            className="btn-icon-bubble h-7 w-7"><Plus className="h-3 w-3" /></button>
                        </div>
                      </div>
                    </div>

                    {/* Capacity warning + override checkbox */}
                    {overCapacity && (
                      <div className="mt-3 flex items-start gap-2">
                        <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 rounded-xl flex-1">
                          <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                          <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                            Przekroczono pojemność ({sr.adults + sr.children}/{r.maxCapacity} os.)
                          </span>
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer shrink-0 px-3 py-2 rounded-xl hover:bg-muted/30 transition-colors">
                          <div className={cn(
                            "h-4 w-4 rounded border-2 flex items-center justify-center transition-colors",
                            sr.capacityOverride ? "bg-amber-500 border-amber-500" : "border-muted-foreground/30"
                          )}>
                            {sr.capacityOverride && <Check className="h-2.5 w-2.5 text-white" />}
                          </div>
                          <input type="checkbox" className="sr-only" checked={sr.capacityOverride}
                            onChange={() => onToggleCapacityOverride(sr.resourceId)} />
                          <span className="text-[11px] font-medium text-muted-foreground">Kontynuuj</span>
                        </label>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Per-item addons (udogodnienia) */}
              {selected && showPricing && sr && onOpenItemAddonPicker && (
                <div className="px-4 pb-4 pt-0">
                  <ItemAddonsSection
                    resourceId={r.id}
                    selectedAddons={itemAddons?.[r.id] || []}
                    onRemove={(addonId, rid) => onRemoveItemAddon?.(addonId, rid)}
                    onUpdate={(addonId, field, value, rid) => onUpdateItemAddonField?.(addonId, field, value, rid)}
                    onOpenPicker={onOpenItemAddonPicker}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
