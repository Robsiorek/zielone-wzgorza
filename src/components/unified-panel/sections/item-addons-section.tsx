"use client";

import React, { useState } from "react";
import { Plus } from "lucide-react";
import type { SelectedAddon } from "../addon-types";
import { computeAddonTotal } from "../addon-types";
import { formatMoneyMinor } from "@/lib/format";
import { AddonCard } from "./addon-card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface Props {
  resourceId: string;
  selectedAddons: SelectedAddon[];
  onRemove: (addonId: string, resourceId: string) => void;
  onUpdate: (addonId: string, field: "unitPriceMinor" | "calcPersons" | "calcNights" | "calcQuantity", value: number, resourceId: string) => void;
  onOpenPicker: (resourceId: string) => void;
}

export function ItemAddonsSection({ resourceId, selectedAddons, onRemove, onUpdate, onOpenPicker }: Props) {
  const [removeConfirm, setRemoveConfirm] = useState<string | null>(null);
  const total = selectedAddons.reduce((sum, sa) => sum + computeAddonTotal(sa), 0);
  const confirmAddon = selectedAddons.find(sa => sa.addonId === removeConfirm);

  const handleRemove = (addonId: string) => {
    const addon = selectedAddons.find(sa => sa.addonId === addonId);
    if (addon?.isRequired) {
      setRemoveConfirm(addonId);
    } else {
      onRemove(addonId, resourceId);
    }
  };

  return (
    <div className="space-y-2 pt-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Udogodnienia</span>
        <button onClick={() => onOpenPicker(resourceId)}
          className="btn-bubble btn-secondary-bubble px-2.5 py-1 text-[10px] flex items-center gap-1">
          <Plus className="h-3 w-3" /> Dodaj
        </button>
      </div>

      {selectedAddons.length > 0 && (
        <div className="space-y-1.5">
          {selectedAddons.map(sa => (
            <AddonCard key={sa.addonId} addon={sa} perItem
              onUpdate={(field, value) => onUpdate(sa.addonId, field, value, resourceId)}
              onRemove={() => handleRemove(sa.addonId)} />
          ))}
          {total > 0 && (
            <div className="flex items-center justify-between pt-1 text-[11px]">
              <span className="text-muted-foreground">Udogodnienia razem</span>
              <span className="font-bold text-primary">{formatMoneyMinor(total)}</span>
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        open={!!removeConfirm}
        onCancel={() => setRemoveConfirm(null)}
        onConfirm={() => { if (removeConfirm) onRemove(removeConfirm, resourceId); setRemoveConfirm(null); }}
        title="Usuń obowiązkowe udogodnienie"
        message={"To udogodnienie (" + (confirmAddon?.name || "") + ") jest ustawione jako obowiązkowe. Czy na pewno chcesz je usunąć?"}
        confirmLabel="Usuń"
        variant="danger"
      />
    </div>
  );
}
