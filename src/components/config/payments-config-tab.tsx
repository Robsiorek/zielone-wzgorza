"use client";

/**
 * PaymentsConfigTab — Payment methods + deposit rule.
 *
 * D0: Visual pattern matches client-details-page SectionCard exactly.
 * SectionCard: .bubble + h-8 w-8 rounded-xl bg-primary/10 icon + text-[14px] font-semibold + chevron
 * InfoRow: h-7 w-7 rounded-lg bg-muted icon + label text-[11px] + value text-[13px]
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  CreditCard, Percent, Loader2, Save, ChevronDown, ChevronRight,
  Banknote, ArrowRightLeft, CreditCard as CardIcon, Globe, Smartphone, Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api-fetch";
import { useToast } from "@/components/ui/toast";

interface MethodConfig {
  method: string;
  isActive: boolean;
  availableForAdmin: boolean;
  availableForWidget: boolean;
  availableForOnline: boolean;
  requiresConfirmation: boolean;
  displayName: string;
  sortOrder: number;
}

const METHOD_ICONS: Record<string, React.ElementType> = {
  CASH: Banknote,
  TRANSFER: ArrowRightLeft,
  TERMINAL: CreditCard,
  CARD: CardIcon,
  ONLINE: Globe,
  BLIK: Smartphone,
  OTHER: Wallet,
};

export function PaymentsConfigTab() {
  const toast = useToast();
  const [methods, setMethods] = useState<MethodConfig[]>([]);
  const [depositPercent, setDepositPercent] = useState(30);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [methodsOpen, setMethodsOpen] = useState(true);
  const [depositOpen, setDepositOpen] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await apiFetch("/api/settings");
      const s = data.settings;
      setMethods((s?.paymentMethodsConfig as MethodConfig[]) || []);
      setDepositPercent(s?.requiredDepositPercent ?? 30);
    } catch { /* */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleMethod = (index: number, field: keyof MethodConfig) => {
    setMethods(prev => prev.map((m, i) => i === index ? { ...m, [field]: !m[field] } : m));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiFetch("/api/settings", {
        method: "PATCH",
        body: JSON.stringify({ paymentMethodsConfig: methods, requiredDepositPercent: depositPercent }),
      });
      toast.success("Ustawienia płatności zapisane");
    } catch (err: any) {
      toast.error(err?.message || "Błąd zapisu");
    } finally { setSaving(false); }
  };

  if (loading) {
    return <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-4">
      {/* Payment methods — SectionCard pattern */}
      <div className="bubble" style={{ overflow: "visible" }}>
        <button onClick={() => setMethodsOpen(!methodsOpen)}
          className="w-full flex items-center gap-3 px-5 py-4 hover:bg-muted/20 transition-colors">
          <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <CreditCard className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 text-left">
            <h3 className="text-[14px] font-semibold">Metody płatności</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Włącz lub wyłącz metody dostępne w panelu. „Wymaga potw." oznacza, że wpłata tworzy się jako oczekująca.
            </p>
          </div>
          {methodsOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
        </button>
        <div className={`section-collapse ${methodsOpen ? "section-open" : ""}`}>
          <div className="section-collapse-inner">
          <div className="px-5 pb-5 border-t border-border/50 pt-4">
            {methods.sort((a, b) => a.sortOrder - b.sortOrder).map((m, i) => {
              const MIcon = METHOD_ICONS[m.method] || Wallet;
              return (
                <div key={m.method} className="flex items-center gap-3 py-3 border-b border-border/30 last:border-b-0">
                  <div className="h-7 w-7 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <MIcon className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium text-foreground">{m.displayName}</div>
                    <div className="text-[10px] text-muted-foreground font-mono">{m.method}</div>
                  </div>
                  <div className="flex items-center gap-5 shrink-0">
                    <ToggleWithLabel label="Aktywna" checked={m.isActive} onChange={() => toggleMethod(i, "isActive")} />
                    <ToggleWithLabel label="Admin" checked={m.availableForAdmin} onChange={() => toggleMethod(i, "availableForAdmin")} />
                    <ToggleWithLabel label="Potw." checked={m.requiresConfirmation} onChange={() => toggleMethod(i, "requiresConfirmation")} />
                  </div>
                </div>
              );
            })}
          </div>
          </div>
        </div>
      </div>

      {/* Deposit rule — SectionCard pattern */}
      <div className="bubble" style={{ overflow: "visible" }}>
        <button onClick={() => setDepositOpen(!depositOpen)}
          className="w-full flex items-center gap-3 px-5 py-4 hover:bg-muted/20 transition-colors">
          <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Percent className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 text-left">
            <h3 className="text-[14px] font-semibold">Reguła depozytu</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Procent wymaganej zaliczki od wartości rezerwacji. 0% wyłącza wymóg zaliczki.
            </p>
          </div>
          {depositOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
        </button>
        <div className={`section-collapse ${depositOpen ? "section-open" : ""}`}>
          <div className="section-collapse-inner">
          <div className="px-5 pb-5 border-t border-border/50 pt-4">
            <div className="max-w-[320px]">
              <label className="text-[12px] font-semibold text-muted-foreground block mb-1.5">Wymagana zaliczka</label>
              <div className="flex items-center gap-2">
                <input type="number" min={0} max={100} value={depositPercent}
                  onChange={e => setDepositPercent(Number(e.target.value))}
                  className="input-bubble h-11 w-[80px] text-[13px] text-right" />
                <span className="text-[13px] text-muted-foreground">% wartości rezerwacji</span>
              </div>
            </div>
          </div>
          </div>
        </div>
      </div>

      {/* Save */}
      <button onClick={handleSave} disabled={saving}
        className="btn-bubble btn-primary-bubble px-6 py-2.5 text-[13px] font-semibold flex items-center gap-1.5 disabled:opacity-50">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        {saving ? "Zapisywanie..." : "Zapisz ustawienia"}
      </button>
    </div>
  );
}

function ToggleWithLabel({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <button type="button" onClick={onChange} className="flex flex-col items-center gap-1 min-w-[48px]">
      <span className={cn(
        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0",
        checked ? "bg-primary" : "bg-muted-foreground/20"
      )}>
        <span className={cn(
          "inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform",
          checked ? "translate-x-6" : "translate-x-1"
        )} />
      </span>
      <span className="text-[9px] text-muted-foreground font-medium">{label}</span>
    </button>
  );
}
