"use client";

import React from "react";
import { X, Users, Moon, Hash, DollarSign } from "lucide-react";
import type { SelectedAddon } from "../addon-types";
import { computeAddonTotal, getEditableFields, PRICING_TYPE_LABELS } from "../addon-types";
import { formatMoneyMinor } from "@/lib/format";

interface Props {
  addon: SelectedAddon;
  onUpdate: (field: "unitPriceMinor" | "calcPersons" | "calcNights" | "calcQuantity", value: number) => void;
  onRemove: () => void;
  perItem?: boolean;
}

export function AddonCard({ addon, onUpdate, onRemove, perItem = false }: Props) {
  const total = computeAddonTotal(addon);
  const fields = getEditableFields(addon.pricingType);
  const label = perItem && addon.pricingType === "PER_BOOKING"
    ? "jednorazowo na zasób"
    : PRICING_TYPE_LABELS[addon.pricingType];

  return (
    <div className="rounded-2xl border-2 border-border bg-card px-3 py-2.5 space-y-1.5">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-[13px] font-medium truncate">{addon.name}</span>
          {addon.isRequired && (
            <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 shrink-0">
              obowiązkowy
            </span>
          )}
          <span className="text-[10px] text-muted-foreground shrink-0">{label}</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[13px] font-bold text-primary">{formatMoneyMinor(total)}</span>
          <button onClick={onRemove}
            className="h-5 w-5 rounded-md flex items-center justify-center text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all">
            <X className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Editable fields — compact single row */}
      <div className="flex items-center gap-3 flex-wrap">
        {fields.showPersons && (
          <MiniField icon={Users} label="os." value={addon.calcPersons}
            onChange={(v) => onUpdate("calcPersons", v)} />
        )}
        {fields.showNights && (
          <MiniField icon={Moon} label="nocy" value={addon.calcNights}
            onChange={(v) => onUpdate("calcNights", v)} />
        )}
        {fields.showQuantity && (
          <MiniField icon={Hash} label="szt." value={addon.calcQuantity}
            onChange={(v) => onUpdate("calcQuantity", v)} />
        )}
        <MiniField icon={DollarSign} label="zł" value={addon.unitPriceMinor / 100}
          onChange={(v) => onUpdate("unitPriceMinor", Math.round(v * 100))} />
      </div>
    </div>
  );
}

function MiniField({ icon: Icon, label, value, onChange }: {
  icon: React.ElementType; label: string; value: number; onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      <Icon className="h-3 w-3 text-muted-foreground/60" />
      <input
        type="number"
        min={0}
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        className="input-bubble h-7 w-[48px] text-[12px] text-center px-1"
      />
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </div>
  );
}
