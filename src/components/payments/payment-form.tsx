"use client";

/**
 * PaymentForm — form to create a payment (CHARGE/REFUND).
 *
 * C2: DS compliant (h-11, BubbleSelect, BubbleDatePicker).
 * ADJUSTMENT hidden in UI (admin-only future), but types support it.
 * Default status = PENDING. CONFIRMED only if policy allows + method doesn't requireConfirmation.
 */

import React, { useState, useMemo } from "react";
import { Loader2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { parseMoneyToMinor } from "@/lib/format";
import { BubbleSelect } from "@/components/ui/bubble-select";
import { BubbleDatePicker } from "@/components/ui/bubble-date-picker";
import { useToast } from "@/components/ui/toast";
import type { PaymentMethodOption } from "./payment-types";

interface Props {
  methodOptions: PaymentMethodOption[];
  onCreate: (body: Record<string, any>) => Promise<string>;
  loading?: boolean;
  /** Called after successful create */
  onSuccess?: () => void;
  /** D0: User role — ADJUSTMENT visible only for MANAGER/OWNER */
  userRole?: string;
}

export function PaymentForm({ methodOptions, onCreate, loading = false, onSuccess, userRole = "RECEPTION" }: Props) {
  const toast = useToast();
  const [kind, setKind] = useState<"CHARGE" | "REFUND" | "ADJUSTMENT">("CHARGE");
  const [direction, setDirection] = useState<"IN" | "OUT">("IN");
  const [method, setMethod] = useState("");
  const [amount, setAmount] = useState("");
  const [occurredAt, setOccurredAt] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [note, setNote] = useState("");
  const [statusOverride, setStatusOverride] = useState(false);

  const canAdjust = userRole === "MANAGER" || userRole === "OWNER";

  // Filter methods: only active + availableForAdmin
  const availableMethods = useMemo(() =>
    methodOptions
      .filter(m => m.isActive && m.availableForAdmin)
      .sort((a, b) => a.sortOrder - b.sortOrder),
  [methodOptions]);

  const methodSelectOptions = availableMethods.map(m => ({
    value: m.method,
    label: m.displayName,
  }));

  const selectedMethodCfg = availableMethods.find(m => m.method === method);
  const requiresConfirmation = selectedMethodCfg?.requiresConfirmation ?? false;
  const canCreateConfirmed = !requiresConfirmation;

  const kindOptions = [
    { value: "CHARGE", label: "Wpłata" },
    { value: "REFUND", label: "Zwrot" },
    ...(canAdjust ? [{ value: "ADJUSTMENT", label: "Korekta" }] : []),
  ];

  const directionOptions = [
    { value: "IN", label: "Na plus (przychód)" },
    { value: "OUT", label: "Na minus (rozchód)" },
  ];

  const todayStr = new Date().toISOString().split("T")[0];

  const handleSubmit = async () => {
    if (!method) { toast.error("Wybierz metodę płatności"); return; }
    if (!amount) { toast.error("Podaj kwotę"); return; }

    const amountMinor = parseMoneyToMinor(amount);
    if (amountMinor <= 0) { toast.error("Kwota musi być większa niż 0"); return; }

    // D0: ADJUSTMENT requires note (frontend enforcement, backend also validates)
    if (kind === "ADJUSTMENT" && !note?.trim()) {
      toast.error("Korekta wymaga podania powodu (notatka)");
      return;
    }

    try {
      await onCreate({
        kind,
        method,
        amountMinor,
        // D0: explicit direction for ADJUSTMENT; CHARGE/REFUND auto-resolved on backend
        ...(kind === "ADJUSTMENT" ? { direction } : {}),
        occurredAt: occurredAt || undefined,
        referenceNumber: referenceNumber || undefined,
        note: note || undefined,
        status: (statusOverride && canCreateConfirmed) ? "CONFIRMED" : "PENDING",
      });

      const labels: Record<string, string> = { CHARGE: "Wpłata zarejestrowana", REFUND: "Zwrot zarejestrowany", ADJUSTMENT: "Korekta zarejestrowana" };
      toast.success(labels[kind] || "Operacja zarejestrowana");

      // Reset
      setKind("CHARGE");
      setDirection("IN");
      setAmount("");
      setReferenceNumber("");
      setNote("");
      setStatusOverride(false);
      setOccurredAt("");
      onSuccess?.();
    } catch (err: any) {
      toast.error(err?.message || "Błąd rejestracji płatności");
    }
  };

  return (
    <div className="space-y-4">
      {/* Row 1: Kind + Method */}
      <div className="grid grid-cols-2 gap-3">
        <BubbleSelect
          label="Rodzaj"
          options={kindOptions}
          value={kind}
          onChange={(v) => setKind(v as "CHARGE" | "REFUND" | "ADJUSTMENT")}
        />
        <BubbleSelect
          label="Metoda"
          options={methodSelectOptions}
          value={method}
          onChange={setMethod}
          placeholder="Wybierz..."
        />
      </div>

      {/* Row 1b: Direction (only for ADJUSTMENT) */}
      {kind === "ADJUSTMENT" && (
        <BubbleSelect
          label="Kierunek"
          options={directionOptions}
          value={direction}
          onChange={(v) => setDirection(v as "IN" | "OUT")}
        />
      )}

      {/* Row 2: Amount + Date */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[12px] font-semibold text-muted-foreground block mb-1.5">Kwota (zł)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="np. 500"
            className="input-bubble h-11 w-full text-[13px]"
          />
        </div>
        <BubbleDatePicker
          label="Data operacji"
          value={occurredAt}
          onChange={setOccurredAt}
          max={todayStr}
          placeholder="Dziś"
        />
      </div>

      {/* Row 3: Reference + Note */}
      <div>
        <label className="text-[12px] font-semibold text-muted-foreground block mb-1.5">Nr referencyjny (opcjonalnie)</label>
        <input
          type="text"
          value={referenceNumber}
          onChange={(e) => setReferenceNumber(e.target.value)}
          placeholder="np. Nr przelewu, ID transakcji..."
          className="input-bubble h-11 w-full text-[13px]"
        />
      </div>
      <div>
        <label className="text-[12px] font-semibold text-muted-foreground block mb-1.5">
          {kind === "ADJUSTMENT" ? "Powód korekty (wymagany)" : "Notatka (opcjonalnie)"}
        </label>
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="np. Zaliczka, dopłata..."
          className="input-bubble h-11 w-full text-[13px]"
        />
      </div>

      {/* Status toggle — DS: toggle switch, not checkbox */}
      {canCreateConfirmed && (
        <button
          type="button"
          onClick={() => setStatusOverride(!statusOverride)}
          className="flex items-center gap-3 w-full text-left"
        >
          <span className={cn(
            "relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0",
            statusOverride ? "bg-primary" : "bg-muted-foreground/20"
          )}>
            <span className={cn(
              "inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform",
              statusOverride ? "translate-x-6" : "translate-x-1"
            )} />
          </span>
          <span className="text-[12px] text-muted-foreground">
            Zatwierdź od razu <span className="text-[11px]">(bez oczekiwania na potwierdzenie)</span>
          </span>
        </button>
      )}
      {requiresConfirmation && method && (
        <p className="text-[11px] text-amber-600 dark:text-amber-400">
          Metoda „{selectedMethodCfg?.displayName}" wymaga potwierdzenia — płatność powstanie jako oczekująca.
        </p>
      )}

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={loading || !method || !amount || (kind === "ADJUSTMENT" && !note?.trim())}
        className={cn(
          "btn-bubble w-full h-11 text-[13px] font-semibold flex items-center justify-center gap-2 rounded-2xl transition-all disabled:opacity-40 disabled:cursor-not-allowed",
          kind === "REFUND" ? "btn-danger-bubble" : "btn-primary-bubble"
        )}
      >
        {loading
          ? <><Loader2 className="h-4 w-4 animate-spin" /> Zapisywanie...</>
          : <><Plus className="h-4 w-4" /> {kind === "CHARGE" ? "Zarejestruj wpłatę" : kind === "REFUND" ? "Zarejestruj zwrot" : "Zarejestruj korektę"}</>
        }
      </button>
    </div>
  );
}
