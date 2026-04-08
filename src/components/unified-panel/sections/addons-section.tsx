"use client";

import React, { useState } from "react";
import { Package, Plus } from "lucide-react";
import type { SelectedAddon } from "../addon-types";
import { computeAddonTotal } from "../addon-types";
import { formatMoneyMinor } from "@/lib/format";
import { AddonCard } from "./addon-card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface Props {
  selectedAddons: SelectedAddon[];
  addonsTotal: number;
  onRemove: (addonId: string) => void;
  onUpdate: (addonId: string, field: "unitPriceMinor" | "calcPersons" | "calcNights" | "calcQuantity", value: number) => void;
  onOpenPicker: () => void;
}

export function AddonsSection({ selectedAddons, addonsTotal, onRemove, onUpdate, onOpenPicker }: Props) {
  const [removeConfirm, setRemoveConfirm] = useState<string | null>(null);
  const confirmAddon = selectedAddons.find(sa => sa.addonId === removeConfirm);

  const handleRemove = (addonId: string) => {
    const addon = selectedAddons.find(sa => sa.addonId === addonId);
    if (addon?.isRequired) {
      setRemoveConfirm(addonId);
    } else {
      onRemove(addonId);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="flex items-center gap-2 text-[14px] font-semibold">
            <Package className="h-4 w-4 text-primary" />
            Globalne opłaty i dodatki
          </h3>
          <p className="text-[11px] text-muted-foreground mt-0.5 ml-6">Liczone dla całej rezerwacji, niezależnie od liczby zasobów</p>
        </div>
        <button onClick={onOpenPicker}
          className="btn-bubble btn-secondary-bubble px-3 py-1.5 text-[11px] flex items-center gap-1.5">
          <Plus className="h-3.5 w-3.5" /> Dodaj
        </button>
      </div>

      {selectedAddons.length > 0 ? (
        <div className="space-y-2">
          {selectedAddons.map(sa => (
            <AddonCard key={sa.addonId} addon={sa}
              onUpdate={(field, value) => onUpdate(sa.addonId, field, value)}
              onRemove={() => handleRemove(sa.addonId)} />
          ))}
          {addonsTotal > 0 && (
            <div className="flex items-center justify-between pt-2 border-t border-border/50">
              <span className="text-[13px] font-semibold text-muted-foreground">Łączny koszt dodatków</span>
              <span className="text-[14px] font-bold text-primary">{formatMoneyMinor(addonsTotal)}</span>
            </div>
          )}
        </div>
      ) : (
        <div className="text-[12px] text-muted-foreground/60 py-3 text-center border-2 border-dashed border-border rounded-2xl">
          Brak dodanych dodatków
        </div>
      )}

      <ConfirmDialog
        open={!!removeConfirm}
        onCancel={() => setRemoveConfirm(null)}
        onConfirm={() => { if (removeConfirm) onRemove(removeConfirm); setRemoveConfirm(null); }}
        title="Usuń obowiązkowy dodatek"
        message={"Ten dodatek (" + (confirmAddon?.name || "") + ") jest ustawiony jako obowiązkowy. Czy na pewno chcesz go usunąć?"}
        confirmLabel="Usuń"
        variant="danger"
      />
    </div>
  );
}
