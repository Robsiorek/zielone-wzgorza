"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Plus, Search, X, Loader2, Package, Pencil, Trash2,
  CheckCircle2, XCircle, ToggleLeft, ToggleRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api-fetch";
import { useToast } from "@/components/ui/toast";
import { SlidePanel } from "@/components/ui/slide-panel";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { BubbleSelect } from "@/components/ui/bubble-select";
import { AddonsSkeleton } from "@/components/addons/addons-skeleton";
import { formatMoneyMinor, parseMoneyToMinor } from "@/lib/format";

interface AddonRow {
  id: string;
  name: string;
  description: string | null;
  pricingType: string;
  price: number | string;
  priceMinor?: number;
  selectType: string;
  isRequired: boolean;
  isActive: boolean;
  scope: string;
  sortOrder: number;
  _count: { reservationAddons: number };
}

const PRICING_LABELS: Record<string, string> = {
  PER_BOOKING: "Jednorazowy",
  PER_NIGHT: "Za noc",
  PER_PERSON: "Za osobę",
  PER_PERSON_NIGHT: "Za osobę/noc",
  PER_UNIT: "Za sztukę",
};

const PRICING_OPTIONS = [
  { value: "PER_BOOKING", label: "Jednorazowy" },
  { value: "PER_NIGHT", label: "Za noc" },
  { value: "PER_PERSON", label: "Za osobę" },
  { value: "PER_PERSON_NIGHT", label: "Za osobę/noc" },
  { value: "PER_UNIT", label: "Za sztukę" },
];

const SCOPE_OPTIONS = [
  { value: "GLOBAL", label: "Globalny (cała rezerwacja)" },
  { value: "PER_ITEM", label: "Per zasób (udogodnienie)" },
];

const FILTER_OPTIONS = [
  { value: "", label: "Wszystkie" },
  { value: "active", label: "Aktywne" },
  { value: "inactive", label: "Nieaktywne" },
  { value: "required", label: "Obowiązkowe" },
];

function fmtMoney(minorValue: number): string {
  return formatMoneyMinor(minorValue);
}

export function AddonsContent() {
  const toast = useToast();
  const [addons, setAddons] = useState<AddonRow[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [filtering, setFiltering] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");
  const [panelOpen, setPanelOpen] = useState(false);
  const [editAddon, setEditAddon] = useState<AddonRow | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  // Form state
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formPricing, setFormPricing] = useState("PER_BOOKING");
  const [formPrice, setFormPrice] = useState("");
  const [formRequired, setFormRequired] = useState(false);
  const [formScope, setFormScope] = useState("GLOBAL");

  const load = useCallback(async () => {
    setFiltering(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (filter === "active") params.set("active", "true");
      if (filter === "inactive") params.set("active", "false");
      if (filter === "required") params.set("required", "true");
      const data = await apiFetch("/api/addons?" + params.toString());
      setAddons(data.addons || []);
    } catch (e) { console.error(e); }
    setFiltering(false);
    setInitialLoading(false);
  }, [search, filter]);

  useEffect(() => { load(); }, [load]);

  const resetForm = () => {
    setFormName("");
    setFormDesc("");
    setFormPricing("PER_BOOKING");
    setFormPrice("");
    setFormRequired(false);
    setFormScope("GLOBAL");
  };

  const openCreate = () => {
    setEditAddon(null);
    resetForm();
    setPanelOpen(true);
  };

  const openEdit = (addon: AddonRow) => {
    setEditAddon(addon);
    setFormName(addon.name);
    setFormDesc(addon.description || "");
    setFormPricing(addon.pricingType);
    setFormPrice(String((addon.priceMinor || Math.round(Number(addon.price) * 100)) / 100));
    setFormRequired(addon.isRequired);
    setFormScope(addon.scope || "GLOBAL");
    setPanelOpen(true);
  };

  const handleSave = async () => {
    if (!formName.trim()) { toast.error("Nazwa jest wymagana"); return; }
    if (!formPrice || Number(formPrice) < 0) { toast.error("Podaj prawidłową cenę"); return; }

    setSaving(true);
    try {
      const body = {
        name: formName.trim(),
        description: formDesc.trim() || null,
        pricingType: formPricing,
        price: parseMoneyToMinor(formPrice),
        isRequired: formRequired,
        scope: formScope,
      };

      if (editAddon) {
        await apiFetch("/api/addons/" + editAddon.id, { method: "PATCH", body: JSON.stringify(body) });
        toast.success("Dodatek zaktualizowany");
      } else {
        await apiFetch("/api/addons", { method: "POST", body: JSON.stringify(body) });
        toast.success("Dodatek utworzony");
      }
      setPanelOpen(false);
      load();
    } catch (e: any) { toast.error(e.message || "Błąd zapisu"); }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const data = await apiFetch("/api/addons/" + deleteId, { method: "DELETE" });
      if (data.softDeleted) {
        toast.success("Dodatek dezaktywowany (jest używany w rezerwacjach)");
      } else {
        toast.success("Dodatek usunięty");
      }
      load();
    } catch (e: any) { toast.error(e.message || "Błąd usuwania"); }
    setDeleteId(null);
  };

  const toggleActive = async (addon: AddonRow) => {
    try {
      await apiFetch("/api/addons/" + addon.id, {
        method: "PATCH",
        body: JSON.stringify({ isActive: !addon.isActive }),
      });
      toast.success(addon.isActive ? "Dezaktywowano" : "Aktywowano");
      load();
    } catch (e: any) { toast.error(e.message || "Błąd"); }
  };

  if (initialLoading) return <AddonsSkeleton />;

  const panelTitle = (
    <div className="flex items-center gap-3">
      <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
        <Package className="h-4 w-4 text-primary" />
      </div>
      <div className="text-[14px] font-bold">{editAddon ? "Edytuj dodatek" : "Nowy dodatek"}</div>
    </div>
  );

  return (
    <div className="space-y-4 fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Dodatki</h2>
          <p className="text-[13px] text-muted-foreground mt-1">{addons.length} dodatków</p>
        </div>
        <button onClick={openCreate} className="btn-bubble btn-primary-bubble px-5 py-2.5 text-[13px] flex items-center gap-2">
          <Plus className="h-4 w-4" /> Nowy dodatek
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input ref={searchRef} value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Szukaj dodatku..." className="input-bubble h-11 w-full text-[13px]"
            style={{ paddingLeft: 40 }} />
          {search && (
            <button onClick={() => { setSearch(""); searchRef.current?.focus(); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-muted-foreground/20 hover:text-foreground transition-all">
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
        <BubbleSelect options={FILTER_OPTIONS} value={filter} onChange={setFilter} className="w-[160px]" />
      </div>

      {/* Table */}
      <div className="bubble overflow-x-auto relative">
        {filtering && (
          <div className="absolute inset-0 bg-card/60 z-10 flex items-center justify-center rounded-[20px]">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        )}
        {addons.length === 0 && !filtering ? (
          <div className="py-16 text-center">
            <Package className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-[14px] font-medium text-muted-foreground">{search ? "Brak wyników" : "Brak dodatków"}</p>
            <p className="text-[12px] text-muted-foreground/60 mt-1">Utwórz pierwszy dodatek klikając przycisk powyżej</p>
          </div>
        ) : (
          <table className="table-bubble w-full">
            <thead>
              <tr>
                <th className="text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-4 py-2.5">Nazwa</th>
                <th className="text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-4 py-2.5 hidden md:table-cell">Typ</th>
                <th className="text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-4 py-2.5 hidden md:table-cell">Zakres</th>
                <th className="text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-4 py-2.5">Cena</th>
                <th className="text-right text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-4 py-2.5">Akcje</th>
              </tr>
            </thead>
            <tbody>
              {addons.map((a) => (
                <tr key={a.id} className={cn("border-t border-border/50 hover:bg-muted/30 transition-colors cursor-pointer", !a.isActive && "opacity-50")}
                  onClick={() => openEdit(a)}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-medium">{a.name}</span>
                      {a.isRequired && <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">obowiązkowy</span>}
                      <span className={cn("text-[9px] font-semibold px-1.5 py-0.5 rounded-full", a.isActive ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500")}>{a.isActive ? "Aktywny" : "Nieaktywny"}</span>
                    </div>
                    {a.description && <div className="text-[11px] text-muted-foreground mt-0.5 truncate max-w-[250px]">{a.description}</div>}
                    {a._count.reservationAddons > 0 && (
                      <div className="text-[10px] text-muted-foreground/60 mt-0.5">{a._count.reservationAddons} rezerwacji</div>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-[12px] text-muted-foreground">
                      {a.pricingType === "PER_BOOKING" && a.scope === "PER_ITEM" ? "Jednorazowo na zasób" : PRICING_LABELS[a.pricingType] || a.pricingType}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", a.scope === "PER_ITEM" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400")}>{a.scope === "PER_ITEM" ? "Per zasób" : "Globalny"}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[13px] font-semibold">{fmtMoney(a.priceMinor || Math.round(Number(a.price) * 100))}</span>
                  </td>
                  <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => toggleActive(a)}
                        className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
                        title={a.isActive ? "Dezaktywuj" : "Aktywuj"}>
                        {a.isActive ? <ToggleRight className="h-3.5 w-3.5 text-emerald-500" /> : <ToggleLeft className="h-3.5 w-3.5" />}
                      </button>
                      <button onClick={() => openEdit(a)}
                        className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-all" title="Edytuj">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => setDeleteId(a.id)}
                        className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all" title="Usuń">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Form Panel */}
      <SlidePanel open={panelOpen} onClose={() => setPanelOpen(false)} title={panelTitle}>
        <div className="space-y-5">
          {/* Name */}
          <div>
            <label className="text-[12px] font-semibold text-muted-foreground block mb-1.5">Nazwa *</label>
            <input value={formName} onChange={(e) => setFormName(e.target.value)}
              placeholder="np. Śniadanie, Parking, Sprzątanie końcowe"
              className="input-bubble h-11 w-full text-[13px]" />
          </div>

          {/* Description */}
          <div>
            <label className="text-[12px] font-semibold text-muted-foreground block mb-1.5">Opis</label>
            <textarea value={formDesc} onChange={(e) => setFormDesc(e.target.value)}
              placeholder="Opcjonalny opis dodatku..."
              className="input-bubble w-full text-[13px] min-h-[80px] py-3 resize-none" />
          </div>

          {/* Pricing type */}
          <div>
            <label className="text-[12px] font-semibold text-muted-foreground block mb-1.5">Typ rozliczenia *</label>
            <BubbleSelect options={PRICING_OPTIONS} value={formPricing} onChange={setFormPricing} className="w-full" />
            <p className="text-[11px] text-muted-foreground/60 mt-1">
              {formPricing === "PER_BOOKING" && "Naliczany raz na całą rezerwację"}
              {formPricing === "PER_NIGHT" && "Naliczany za każdą noc pobytu"}
              {formPricing === "PER_PERSON" && "Naliczany za każdą osobę"}
              {formPricing === "PER_PERSON_NIGHT" && "Naliczany za osobę za każdą noc"}
              {formPricing === "PER_UNIT" && "Naliczany za sztukę (ilość podaje gość)"}
            </p>
          </div>

          {/* Price */}
          <div>
            <label className="text-[12px] font-semibold text-muted-foreground block mb-1.5">Cena (PLN) *</label>
            <input type="number" min="0" step="1" value={formPrice} onChange={(e) => setFormPrice(e.target.value)}
              placeholder="0"
              className="input-bubble h-11 w-full text-[13px]" />
          </div>



          {/* Scope */}
          <div>
            <label className="text-[12px] font-semibold text-muted-foreground block mb-1.5">Zakres *</label>
            <BubbleSelect options={SCOPE_OPTIONS} value={formScope} onChange={setFormScope} className="w-full" />
            <p className="text-[11px] text-muted-foreground/60 mt-1">
              {formScope === "GLOBAL" && "Dotyczy całej rezerwacji (np. parking, podatek turystyczny)"}
              {formScope === "PER_ITEM" && "Dotyczy każdego zasobu osobno (np. śniadanie, dostawka, łóżeczko)"}
            </p>
          </div>

          {/* Required toggle */}
          <div className="flex items-center justify-between py-2">
            <div>
              <div className="text-[13px] font-medium">Obowiązkowy</div>
              <div className="text-[11px] text-muted-foreground">Domyślnie zaznaczony przy tworzeniu rezerwacji</div>
            </div>
            <button onClick={() => setFormRequired(!formRequired)}
              className={cn("h-7 w-12 rounded-full transition-colors relative",
                formRequired ? "bg-primary" : "bg-muted"
              )}>
              <div className={cn("absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform",
                formRequired ? "translate-x-5" : "translate-x-0.5"
              )} />
            </button>
          </div>

          {/* Usage count (edit only) */}
          {editAddon && editAddon._count.reservationAddons > 0 && (
            <div className="text-[12px] text-muted-foreground bg-muted/30 rounded-xl px-3 py-2">
              Ten dodatek jest używany w {editAddon._count.reservationAddons} rezerwacjach. Zmiany nie wpłyną na istniejące rezerwacje (snapshot).
            </div>
          )}

          {/* Save */}
          <div className="pt-3 space-y-2">
            <button onClick={handleSave} disabled={saving}
              className="btn-bubble btn-primary-bubble w-full px-5 py-2.5 text-[13px] flex items-center justify-center gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              {editAddon ? "Zapisz zmiany" : "Utwórz dodatek"}
            </button>
            <button onClick={() => setPanelOpen(false)}
              className="btn-bubble btn-secondary-bubble w-full px-5 py-2.5 text-[13px] flex items-center justify-center gap-2">
              <XCircle className="h-4 w-4" /> Anuluj
            </button>
          </div>
        </div>
      </SlidePanel>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!deleteId}
        onCancel={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Usuń dodatek"
        message="Czy na pewno chcesz usunąć ten dodatek? Jeśli jest używany w rezerwacjach, zostanie dezaktywowany zamiast usunięty."
        confirmLabel="Usuń"
        variant="danger"
      />
    </div>
  );
}
