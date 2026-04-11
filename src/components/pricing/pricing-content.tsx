"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  Plus, Pencil, Trash2, Check, Loader2, Calendar, DollarSign,
  Tag, GitBranch, Save, TicketPercent, ArrowUpDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api-fetch";
import { parseLocalDate } from "@/lib/dates";
import { parseMoneyToMinor, fromMinor } from "@/lib/format";
import { SlidePanel } from "@/components/ui/slide-panel";
import { Tooltip } from "@/components/ui/tooltip";
import { BubbleSelect } from "@/components/ui/bubble-select";
import { UnitBadge } from "@/components/ui/unit-badge";
import { BubbleDatePicker } from "@/components/ui/bubble-date-picker";
import { PricingSkeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";

interface Season {
  id: string; name: string; type: string; startDate: string; endDate: string;
  color: string | null; isActive: boolean; priority: number; _count?: { priceEntries: number };
}
interface RatePlan {
  id: string; name: string; slug: string; description: string | null; isActive: boolean;
  isDefault: boolean; parentId: string | null; modifierType: string | null;
  modifierValue: number | null; cancellationPolicy: string; cancellationDays: number | null;
  parent: { id: string; name: string } | null;
  children: { id: string; name: string; modifierType: string; modifierValue: number }[];
  _count?: { priceEntries: number };
}
interface ResourceVariant {
  id: string; name: string; capacity: number; basePrice: number | null; basePriceMinor?: number | null;
  resource: { id: string; name: string; unitNumber: string | null; category: { name: string; slug: string } };
}
interface PromoCode {
  id: string; code: string; name: string; discountType: string; discountValue: number;
  minBookingValue: number | null; maxUses: number | null; usedCount: number;
  validFrom: string; validUntil: string; isActive: boolean;
}
interface CategoryInfo { name: string; slug: string; }

const cancellationLabels: Record<string, string> = {
  FLEXIBLE: "Elastyczny", MODERATE: "Umiarkowany", STRICT: "Bez zwrotu", SUPER_STRICT: "Bez zwrotu + przedpłata",
};

function formatDate(d: string) {
  return parseLocalDate(d).toLocaleDateString("pl-PL", { day: "numeric", month: "short", year: "numeric" });
}

export function PricingContent() {
  const { error: showError } = useToast();
  const [activeTab, setActiveTab] = useState("seasons");
  const [seasons, setSeasons] = useState<Season[]>([]);

  // Read hash from URL to set active tab
  useEffect(() => {
    const validTabs = ["seasons", "ratePlans", "prices", "promos"];
    const readHash = () => {
      const hash = window.location.hash.replace("#", "");
      if (hash && validTabs.includes(hash)) {
        setActiveTab(hash);
      }
    };
    readHash();
    window.addEventListener("hashchange", readHash);

    // Intercept pushState/replaceState (Next.js client-side navigation)
    const origPush = history.pushState.bind(history);
    const origReplace = history.replaceState.bind(history);
    history.pushState = (...args) => { origPush(...args); readHash(); };
    history.replaceState = (...args) => { origReplace(...args); readHash(); };

    return () => {
      window.removeEventListener("hashchange", readHash);
      history.pushState = origPush;
      history.replaceState = origReplace;
    };
  }, []);
  const [ratePlans, setRatePlans] = useState<RatePlan[]>([]);
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [variants, setVariants] = useState<ResourceVariant[]>([]);
  const [categories, setCategories] = useState<CategoryInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const tabsRef = useRef<HTMLDivElement>(null);

  // Scroll active tab into view when activeTab changes
  useEffect(() => {
    const wrapper = tabsRef.current;
    if (!wrapper) return;
    const active = wrapper.querySelector("[data-active='true']") as HTMLElement;
    if (!active) return;
    const wrapperRect = wrapper.getBoundingClientRect();
    const activeRect = active.getBoundingClientRect();
    const scrollLeft = active.offsetLeft - wrapper.offsetLeft - (wrapperRect.width / 2) + (activeRect.width / 2);
    wrapper.scrollTo({ left: Math.max(0, scrollLeft), behavior: "smooth" });
  }, [activeTab, loading]);

  const [panelOpen, setPanelOpen] = useState(false);
  const [panelType, setPanelType] = useState<"season" | "ratePlan" | "promo">("season");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [seasonForm, setSeasonForm] = useState({ name: "", type: "", startDate: "", endDate: "", color: "", priority: "10" });
  const [ratePlanForm, setRatePlanForm] = useState({ name: "", description: "", parentId: "", modifierType: "PERCENTAGE", modifierValue: "", cancellationPolicy: "FLEXIBLE", cancellationDays: "", isDefault: false });
  const [promoForm, setPromoForm] = useState({ code: "", name: "", discountType: "PERCENTAGE", discountValue: "", minBookingValue: "", maxUses: "", validFrom: "", validUntil: "" });

  const [selectedRatePlan, setSelectedRatePlan] = useState("");
  const [selectedSeason, setSelectedSeason] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [priceMatrix, setPriceMatrix] = useState<Record<string, string>>({});
  const [savingPrices, setSavingPrices] = useState(false);
  const [autoSelected, setAutoSelected] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [s, r, p, v] = await Promise.all([
        apiFetch("/api/seasons"),
        apiFetch("/api/rate-plans"),
        apiFetch("/api/promo-codes"),
        apiFetch("/api/resources"),
      ]);
      setSeasons(s.seasons || []);
      setRatePlans(r.ratePlans || []);
      setPromoCodes(p.codes || []);
      const allVariants: ResourceVariant[] = [];
      const catSet = new Map<string, string>();
      for (const res of (v.resources || [])) {
        if (res.category) catSet.set(res.category.slug, res.category.name);
        for (const variant of (res.variants || [])) {
          allVariants.push({ ...variant, resource: { id: res.id, name: res.name, unitNumber: res.unitNumber, category: res.category } });
        }
      }
      setVariants(allVariants);
      setCategories(Array.from(catSet.entries()).map(([slug, name]) => ({ slug, name })));

      // Auto-select default rate plan
      if (!autoSelected) {
        const defaultPlan = (r.ratePlans || []).find((rp: RatePlan) => rp.isDefault) || (r.ratePlans || [])[0];
        if (defaultPlan) setSelectedRatePlan(defaultPlan.id);
        setAutoSelected(true);
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [autoSelected]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    if (!selectedRatePlan) return;
    const params = new URLSearchParams({ ratePlanId: selectedRatePlan });
    if (selectedSeason) params.set("seasonId", selectedSeason);
    apiFetch("/api/price-entries?" + params.toString())
      .then(d => {
        const matrix: Record<string, string> = {};
        for (const e of (d.entries || [])) { matrix[e.variantId] = (e.priceMinor ? fromMinor(e.priceMinor) : Number(e.price)).toString(); }
        setPriceMatrix(matrix);
      })
      .catch((e: any) => showError(e.message || "Błąd ładowania cen"));
  }, [selectedRatePlan, selectedSeason]);

  // Season handlers
  function openSeasonCreate() {
    setSeasonForm({ name: "", type: "", startDate: "", endDate: "", color: "", priority: "10" });
    setEditingId(null); setPanelType("season"); setPanelOpen(true);
  }
  function openSeasonEdit(s: Season) {
    setSeasonForm({ name: s.name, type: s.type, startDate: s.startDate.split("T")[0], endDate: s.endDate.split("T")[0], color: s.color || "", priority: s.priority?.toString() || "10" });
    setEditingId(s.id); setPanelType("season"); setPanelOpen(true);
  }
  async function saveSeason() {
    setSaving(true);
    try {
      const url = editingId ? "/api/seasons/" + editingId : "/api/seasons";
      await apiFetch(url, { method: editingId ? "PUT" : "POST", body: { ...seasonForm, priority: parseInt(seasonForm.priority) || 10 } });
      await loadData(); setPanelOpen(false);
    } catch (e: any) { showError(e.message || "Błąd zapisu sezonu"); }
    setSaving(false);
  }
  async function deleteSeason(id: string) {
    if (!confirm("Czy na pewno chcesz usunąć ten sezon?")) return;
    try {
      await apiFetch("/api/seasons/" + id, { method: "DELETE" }); await loadData();
    } catch (e: any) { showError(e.message || "Błąd usuwania sezonu"); }
  }

  // Rate plan handlers
  function openRatePlanCreate() {
    setRatePlanForm({ name: "", description: "", parentId: "", modifierType: "PERCENTAGE", modifierValue: "", cancellationPolicy: "FLEXIBLE", cancellationDays: "", isDefault: false });
    setEditingId(null); setPanelType("ratePlan"); setPanelOpen(true);
  }
  function openRatePlanEdit(rp: RatePlan) {
    // For FIXED modifier: show value in zł. For PERCENTAGE: show raw number.
    const mvDisplay = rp.modifierValue != null
      ? (rp.modifierType === "FIXED" && (rp as any).modifierValueMinor
        ? fromMinor((rp as any).modifierValueMinor).toString()
        : rp.modifierValue.toString())
      : "";
    setRatePlanForm({ name: rp.name, description: rp.description || "", parentId: rp.parentId || "", modifierType: rp.modifierType || "PERCENTAGE", modifierValue: mvDisplay, cancellationPolicy: rp.cancellationPolicy, cancellationDays: rp.cancellationDays?.toString() || "", isDefault: rp.isDefault });
    setEditingId(rp.id); setPanelType("ratePlan"); setPanelOpen(true);
  }
  async function saveRatePlan() {
    setSaving(true);
    try {
      const url = editingId ? "/api/rate-plans/" + editingId : "/api/rate-plans";
      // For FIXED modifier: convert to grosze. For PERCENTAGE: send raw.
      const body = {
        ...ratePlanForm,
        modifierValue: ratePlanForm.modifierValue
          ? (ratePlanForm.modifierType === "FIXED"
            ? parseMoneyToMinor(ratePlanForm.modifierValue)
            : Number(ratePlanForm.modifierValue))
          : null,
      };
      await apiFetch(url, { method: editingId ? "PUT" : "POST", body });
      await loadData(); setPanelOpen(false);
    } catch (e: any) { showError(e.message || "Błąd zapisu planu cenowego"); }
    setSaving(false);
  }
  async function deleteRatePlan(id: string) {
    if (!confirm("Czy na pewno chcesz usunąć ten plan cenowy?")) return;
    try {
      await apiFetch("/api/rate-plans/" + id, { method: "DELETE" }); await loadData();
    } catch (e: any) { showError(e.message || "Błąd usuwania planu cenowego"); }
  }

  // Promo handlers
  function openPromoCreate() {
    setPromoForm({ code: "", name: "", discountType: "PERCENTAGE", discountValue: "", minBookingValue: "", maxUses: "", validFrom: "", validUntil: "" });
    setEditingId(null); setPanelType("promo"); setPanelOpen(true);
  }
  function openPromoEdit(pc: PromoCode) {
    // For FIXED: show value in zł (from Minor or legacy). For PERCENTAGE: show raw percentage.
    const dvDisplay = pc.discountType === "FIXED"
      ? ((pc as any).discountValueMinor ? fromMinor((pc as any).discountValueMinor) : Number(pc.discountValue)).toString()
      : Number(pc.discountValue).toString();
    const mbvDisplay = pc.minBookingValue
      ? ((pc as any).minBookingValueMinor ? fromMinor((pc as any).minBookingValueMinor) : Number(pc.minBookingValue)).toString()
      : "";
    setPromoForm({ code: pc.code, name: pc.name, discountType: pc.discountType, discountValue: dvDisplay, minBookingValue: mbvDisplay, maxUses: pc.maxUses?.toString() || "", validFrom: pc.validFrom.split("T")[0], validUntil: pc.validUntil.split("T")[0] });
    setEditingId(pc.id); setPanelType("promo"); setPanelOpen(true);
  }
  async function savePromo() {
    setSaving(true);
    try {
      const url = editingId ? "/api/promo-codes/" + editingId : "/api/promo-codes";
      // Convert discountValue: FIXED → grosze, PERCENTAGE → raw number
      const body = {
        ...promoForm,
        discountValue: promoForm.discountType === "FIXED"
          ? parseMoneyToMinor(promoForm.discountValue)
          : Number(promoForm.discountValue),
        minBookingValue: promoForm.minBookingValue ? parseMoneyToMinor(promoForm.minBookingValue) : null,
      };
      await apiFetch(url, { method: editingId ? "PUT" : "POST", body });
      await loadData(); setPanelOpen(false);
    } catch (e: any) { showError(e.message || "Błąd zapisu kodu rabatowego"); }
    setSaving(false);
  }
  async function deletePromo(id: string) {
    if (!confirm("Czy na pewno chcesz usunąć ten kod rabatowy?")) return;
    try {
      await apiFetch("/api/promo-codes/" + id, { method: "DELETE" }); await loadData();
    } catch (e: any) { showError(e.message || "Błąd usuwania kodu rabatowego"); }
  }

  async function savePriceMatrix() {
    setSavingPrices(true);
    try {
      const prices = Object.entries(priceMatrix).filter(([_, v]) => v && parseFloat(v) > 0).map(([variantId, price]) => ({ variantId, ratePlanId: selectedRatePlan, seasonId: selectedSeason || null, price: parseMoneyToMinor(price) }));
      await apiFetch("/api/price-entries", { method: "POST", body: { prices } });
    } catch (e: any) { showError(e.message || "Błąd zapisu cen"); }
    setSavingPrices(false);
  }

  const uniqueTypes = Array.from(new Set(seasons.map(s => s.type).filter(Boolean)));
  const filteredVariants = selectedCategory === "all" ? variants : variants.filter(v => v.resource.category.slug === selectedCategory);

  // Build select options
  const ratePlanOptions = [{ value: "", label: "Wybierz plan cenowy..." }, ...ratePlans.map(rp => ({ value: rp.id, label: rp.name + (rp.isDefault ? " (domyślny)" : "") }))];
  const seasonOptions = [{ value: "", label: "Cena bazowa (bez sezonu)" }, ...seasons.map(s => ({ value: s.id, label: s.name, sublabel: formatDate(s.startDate) + " - " + formatDate(s.endDate) }))];
  const categoryOptions = [{ value: "all", label: "Wszystkie kategorie" }, ...categories.map(c => ({ value: c.slug, label: c.name }))];

  if (loading) return <PricingSkeleton />;

  const tabs = [
    { id: "seasons", label: "Sezony", icon: <Calendar className="h-4 w-4" />, count: seasons.length },
    { id: "ratePlans", label: "Plany cenowe", icon: <DollarSign className="h-4 w-4" />, count: ratePlans.length },
    { id: "prices", label: "Cennik", icon: <Tag className="h-4 w-4" /> },
    { id: "promos", label: "Kody rabatowe", icon: <TicketPercent className="h-4 w-4" />, count: promoCodes.length },
  ];

  return (
    <div className="space-y-6 fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight">System cenowy</h2>
          <p className="text-[13px] text-muted-foreground mt-1">Sezony, plany cenowe, cennik i promocje</p>
        </div>
      </div>

      <div ref={tabsRef} className="overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0"><div className="tabs-bubble inline-flex min-w-max">
        {tabs.map(t => (
          <button key={t.id} data-active={activeTab === t.id} onClick={() => setActiveTab(t.id)} className={cn("tab-bubble", activeTab === t.id && "tab-bubble-active")}>
            {t.icon} {t.label}
            {t.count !== undefined && <span className={cn("count-bubble", activeTab === t.id && "count-bubble-active")}>{t.count}</span>}
          </button>
        ))}
      </div></div>

      {/* SEASONS */}
      {activeTab === "seasons" && (
        <div className="space-y-4">
          <div className="flex justify-end"><button onClick={openSeasonCreate} className="btn-bubble btn-primary-bubble px-5 py-2.5 text-[13px]"><Plus className="h-4 w-4" /> Dodaj sezon</button></div>
          {seasons.length === 0 ? (
            <div className="bubble text-center py-16"><Calendar className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" /><p className="text-[14px] font-medium text-muted-foreground">Brak sezonów</p><p className="text-[12px] text-muted-foreground/60">Dodaj sezony aby definiować różne ceny w ciągu roku</p></div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 stagger">
              {seasons.map(s => (
                <div key={s.id} className="bubble-interactive p-5 group">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0"><Calendar className="h-[18px] w-[18px]" /></div>
                      <div>
                        <h3 className="text-[14px] font-semibold leading-tight">{s.name}</h3>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{formatDate(s.startDate)} - {formatDate(s.endDate)}</p>
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Tooltip content="Edytuj"><button onClick={() => openSeasonEdit(s)} className="h-8 w-8 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-all"><Pencil className="h-3.5 w-3.5" /></button></Tooltip>
                      <Tooltip content="Usuń"><button onClick={() => deleteSeason(s.id)} className="h-8 w-8 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all"><Trash2 className="h-3.5 w-3.5" /></button></Tooltip>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {s.type && <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold bg-primary/8 text-primary">{s.type}</span>}
                    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold bg-muted text-muted-foreground"><ArrowUpDown className="h-3 w-3" /> Priorytet: {s.priority || 0}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* RATE PLANS */}
      {activeTab === "ratePlans" && (
        <div className="space-y-4">
          <div className="flex justify-end"><button onClick={openRatePlanCreate} className="btn-bubble btn-primary-bubble px-5 py-2.5 text-[13px]"><Plus className="h-4 w-4" /> Dodaj plan cenowy</button></div>
          {ratePlans.length === 0 ? (
            <div className="bubble text-center py-16"><DollarSign className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" /><p className="text-[14px] font-medium text-muted-foreground">Brak planów cenowych</p></div>
          ) : (
            <div className="space-y-3 stagger">
              {ratePlans.map(rp => (
                <div key={rp.id} className="bubble p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-[14px] font-semibold">{rp.name}</h3>
                        {rp.isDefault && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">DOMYŚLNY</span>}
                        {!rp.isActive && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">NIEAKTYWNY</span>}
                      </div>
                      {rp.description && <p className="text-[12px] text-muted-foreground mb-2">{rp.description}</p>}
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold bg-muted text-muted-foreground">{cancellationLabels[rp.cancellationPolicy] || rp.cancellationPolicy}</span>
                        {rp.parent && <span className="inline-flex items-center gap-1 text-[11px] text-primary"><GitBranch className="h-3 w-3" /> Dziedziczy z: {rp.parent.name}{rp.modifierValue && <span>({rp.modifierValue > 0 ? "+" : ""}{rp.modifierType === "FIXED" && (rp as any).modifierValueMinor ? fromMinor((rp as any).modifierValueMinor).toFixed(0) : Number(rp.modifierValue).toFixed(0)}{rp.modifierType === "PERCENTAGE" ? "%" : " PLN"})</span>}</span>}
                        <span className="text-[11px] text-muted-foreground">{rp._count?.priceEntries || 0} cen</span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Tooltip content="Edytuj"><button onClick={() => openRatePlanEdit(rp)} className="h-8 w-8 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-all"><Pencil className="h-3.5 w-3.5" /></button></Tooltip>
                      <Tooltip content="Usuń"><button onClick={() => deleteRatePlan(rp.id)} className="h-8 w-8 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all"><Trash2 className="h-3.5 w-3.5" /></button></Tooltip>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* PRICE MATRIX */}
      {activeTab === "prices" && (
        <div className="space-y-4">
          <div className="flex items-end gap-3 flex-wrap">
            <BubbleSelect options={ratePlanOptions} value={selectedRatePlan} onChange={setSelectedRatePlan} placeholder="Wybierz plan cenowy..." className="w-[220px]" />
            <BubbleSelect options={seasonOptions} value={selectedSeason} onChange={setSelectedSeason} placeholder="Cena bazowa (bez sezonu)" className="w-[260px]" />
            <BubbleSelect options={categoryOptions} value={selectedCategory} onChange={setSelectedCategory} placeholder="Wszystkie kategorie" className="w-[200px]" />
            {selectedRatePlan && (
              <button onClick={savePriceMatrix} disabled={savingPrices} className="btn-bubble btn-primary-bubble px-4 py-2 text-[13px] h-10">
                {savingPrices ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Zapisz ceny
              </button>
            )}
          </div>

          {!selectedRatePlan ? (
            <div className="bubble text-center py-16"><Tag className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" /><p className="text-[14px] font-medium text-muted-foreground">Wybierz plan cenowy</p><p className="text-[12px] text-muted-foreground/60">Aby edytować ceny, wybierz plan cenowy powyżej</p></div>
          ) : filteredVariants.length === 0 ? (
            <div className="bubble text-center py-16"><p className="text-[14px] font-medium text-muted-foreground">Brak wariantów do wyceny</p></div>
          ) : (
            <div className="bubble overflow-x-auto">
              <table className="table-bubble">
                <thead><tr><th>Zasób</th><th>Wariant</th><th>Pojemność</th><th>Cena bazowa</th><th style={{ width: 160 }}>Cena (PLN/noc)</th></tr></thead>
                <tbody>
                  {filteredVariants.map(v => (
                    <tr key={v.id}>
                      <td><div><span className="font-semibold text-[13px] flex items-center gap-1.5">{v.resource.unitNumber && <UnitBadge number={v.resource.unitNumber} size="sm" />}{v.resource.name}</span><p className="text-[11px] text-muted-foreground">{v.resource.category.name}</p></div></td>
                      <td className="text-[13px]">{v.name}</td>
                      <td className="text-[13px]">{v.capacity} os.</td>
                      <td className="text-[13px] text-muted-foreground">{v.basePrice ? (v.basePriceMinor ? fromMinor(v.basePriceMinor) : Number(v.basePrice)).toFixed(0) + " PLN" : "-"}</td>
                      <td><input type="number" placeholder={v.basePrice ? v.basePriceMinor ? fromMinor(v.basePriceMinor).toFixed(0) : Number(v.basePrice).toFixed(0) : "0"} value={priceMatrix[v.id] || ""} onChange={e => setPriceMatrix({ ...priceMatrix, [v.id]: e.target.value })} className="input-bubble h-9 w-full text-[13px] text-center" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* PROMO CODES */}
      {activeTab === "promos" && (
        <div className="space-y-4">
          <div className="flex justify-end"><button onClick={openPromoCreate} className="btn-bubble btn-primary-bubble px-5 py-2.5 text-[13px]"><Plus className="h-4 w-4" /> Nowy kod rabatowy</button></div>
          {promoCodes.length === 0 ? (
            <div className="bubble text-center py-16"><TicketPercent className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" /><p className="text-[14px] font-medium text-muted-foreground">Brak kodów rabatowych</p></div>
          ) : (
            <div className="space-y-3 stagger">
              {promoCodes.map(pc => (
                <div key={pc.id} className="bubble p-5 flex items-center justify-between group">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-[14px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-lg">{pc.code}</span>
                      <span className="text-[13px] font-semibold">{pc.name}</span>
                      {!pc.isActive && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">NIEAKTYWNY</span>}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] text-muted-foreground">{pc.discountType === "PERCENTAGE" ? pc.discountValue + "%" : (pc as any).discountValueMinor ? fromMinor((pc as any).discountValueMinor).toFixed(0) + " PLN" : Number(pc.discountValue).toFixed(0) + " PLN"} zniżki</span>
                      <span className="text-[11px] text-muted-foreground">{formatDate(pc.validFrom)} - {formatDate(pc.validUntil)}</span>
                      <span className="text-[11px] text-muted-foreground">Użyto: {pc.usedCount}{pc.maxUses ? "/" + pc.maxUses : ""}</span>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Tooltip content="Edytuj"><button onClick={() => openPromoEdit(pc)} className="h-8 w-8 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-all"><Pencil className="h-3.5 w-3.5" /></button></Tooltip>
                    <Tooltip content="Usuń"><button onClick={() => deletePromo(pc.id)} className="h-8 w-8 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all"><Trash2 className="h-3.5 w-3.5" /></button></Tooltip>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SLIDE PANEL */}
      <SlidePanel open={panelOpen} onClose={() => setPanelOpen(false)}
        title={panelType === "season" ? (editingId ? "Edytuj sezon" : "Nowy sezon") : panelType === "ratePlan" ? (editingId ? "Edytuj plan cenowy" : "Nowy plan cenowy") : (editingId ? "Edytuj kod rabatowy" : "Nowy kod rabatowy")}>

        {panelType === "season" && (
          <div className="space-y-5">
            <div><label className="text-[12px] font-semibold text-muted-foreground block mb-1.5">Nazwa sezonu *</label><input type="text" placeholder="np. Wysoki sezon (wakacje 2026)" value={seasonForm.name} onChange={e => setSeasonForm({ ...seasonForm, name: e.target.value })} className="input-bubble h-11" autoFocus /></div>
            <div>
              <label className="text-[12px] font-semibold text-muted-foreground block mb-1.5">Typ sezonu *</label>
              <input type="text" placeholder="np. Wysoki sezon, Niski sezon, Specjalny" value={seasonForm.type} onChange={e => setSeasonForm({ ...seasonForm, type: e.target.value })} className="input-bubble h-11" list="season-types" />
              {uniqueTypes.length > 0 && <datalist id="season-types">{uniqueTypes.map(t => <option key={t} value={t} />)}</datalist>}
              <p className="text-[11px] text-muted-foreground mt-1">Wpisz własny typ lub wybierz z podpowiedzi</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label className="text-[12px] font-semibold text-muted-foreground block mb-1.5">Data od *</label><BubbleDatePicker value={seasonForm.startDate} onChange={v => setSeasonForm({ ...seasonForm, startDate: v })} /></div>
              <div><label className="text-[12px] font-semibold text-muted-foreground block mb-1.5">Data do *</label><BubbleDatePicker value={seasonForm.endDate} onChange={v => setSeasonForm({ ...seasonForm, endDate: v })} /></div>
            </div>
            <div><label className="text-[12px] font-semibold text-muted-foreground block mb-1.5">Priorytet</label><input type="number" placeholder="10" value={seasonForm.priority} onChange={e => setSeasonForm({ ...seasonForm, priority: e.target.value })} className="input-bubble h-11" /><p className="text-[11px] text-muted-foreground mt-1">Wyższy = ważniejszy przy nakładających się sezonach (np. event 50 &gt; wakacje 30)</p></div>
            <div className="flex gap-2 pt-2">
              <button onClick={saveSeason} disabled={saving || !seasonForm.name || !seasonForm.type || !seasonForm.startDate || !seasonForm.endDate} className="btn-bubble btn-primary-bubble px-5 py-2.5 text-[13px] flex-1 disabled:opacity-50">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} {editingId ? "Zapisz" : "Dodaj"}</button>
              <button onClick={() => setPanelOpen(false)} className="btn-bubble btn-secondary-bubble px-5 py-2.5 text-[13px]">Anuluj</button>
            </div>
          </div>
        )}

        {panelType === "ratePlan" && (
          <div className="space-y-5">
            <div><label className="text-[12px] font-semibold text-muted-foreground block mb-1.5">Nazwa *</label><input type="text" placeholder="np. Standardowy" value={ratePlanForm.name} onChange={e => setRatePlanForm({ ...ratePlanForm, name: e.target.value })} className="input-bubble h-11" autoFocus /></div>
            <div><label className="text-[12px] font-semibold text-muted-foreground block mb-1.5">Opis</label><textarea rows={2} placeholder="Opis planu cenowego..." value={ratePlanForm.description} onChange={e => setRatePlanForm({ ...ratePlanForm, description: e.target.value })} className="input-bubble py-3 resize-none" /></div>
            <BubbleSelect label="Dziedziczy z planu" options={[{ value: "", label: "Brak (plan bazowy)" }, ...ratePlans.filter(rp => rp.id !== editingId).map(rp => ({ value: rp.id, label: rp.name }))]} value={ratePlanForm.parentId} onChange={v => setRatePlanForm({ ...ratePlanForm, parentId: v })} />
            {ratePlanForm.parentId && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <BubbleSelect label="Typ modyfikatora" options={[{ value: "PERCENTAGE", label: "Procentowy (%)" }, { value: "FIXED", label: "Kwotowy (PLN)" }]} value={ratePlanForm.modifierType} onChange={v => setRatePlanForm({ ...ratePlanForm, modifierType: v })} />
                <div><label className="text-[12px] font-semibold text-muted-foreground block mb-1.5">Wartość (np. -20)</label><input type="number" placeholder="-20" value={ratePlanForm.modifierValue} onChange={e => setRatePlanForm({ ...ratePlanForm, modifierValue: e.target.value })} className="input-bubble h-11" /></div>
              </div>
            )}
            <BubbleSelect label="Polityka anulacji" options={[{ value: "FLEXIBLE", label: "Elastyczny (darmowa anulacja)" }, { value: "MODERATE", label: "Umiarkowany (anulacja do N dni)" }, { value: "STRICT", label: "Bez zwrotu" }, { value: "SUPER_STRICT", label: "Bez zwrotu + przedpłata" }]} value={ratePlanForm.cancellationPolicy} onChange={v => setRatePlanForm({ ...ratePlanForm, cancellationPolicy: v })} />
            {ratePlanForm.cancellationPolicy === "MODERATE" && (
              <div><label className="text-[12px] font-semibold text-muted-foreground block mb-1.5">Darmowa anulacja do (dni przed)</label><input type="number" placeholder="7" value={ratePlanForm.cancellationDays} onChange={e => setRatePlanForm({ ...ratePlanForm, cancellationDays: e.target.value })} className="input-bubble h-11" /></div>
            )}
            <div>
              <button type="button" onClick={() => setRatePlanForm({ ...ratePlanForm, isDefault: !ratePlanForm.isDefault })} className="flex items-center gap-2.5">
                <div className={cn("relative w-10 h-[22px] rounded-full transition-colors duration-200", ratePlanForm.isDefault ? "bg-primary" : "bg-muted-foreground/20")}><div className={cn("absolute top-[2px] left-[2px] w-[18px] h-[18px] rounded-full bg-white shadow-sm transition-transform duration-200", ratePlanForm.isDefault && "translate-x-[18px]")} /></div>
                <span className="text-[12px] font-medium">Plan domyślny</span>
              </button>
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={saveRatePlan} disabled={saving || !ratePlanForm.name} className="btn-bubble btn-primary-bubble px-5 py-2.5 text-[13px] flex-1 disabled:opacity-50">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} {editingId ? "Zapisz" : "Dodaj"}</button>
              <button onClick={() => setPanelOpen(false)} className="btn-bubble btn-secondary-bubble px-5 py-2.5 text-[13px]">Anuluj</button>
            </div>
          </div>
        )}

        {panelType === "promo" && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label className="text-[12px] font-semibold text-muted-foreground block mb-1.5">Kod *</label><input type="text" placeholder="np. LATO2026" value={promoForm.code} onChange={e => setPromoForm({ ...promoForm, code: e.target.value.toUpperCase() })} className="input-bubble h-11 font-mono" autoFocus /></div>
              <div><label className="text-[12px] font-semibold text-muted-foreground block mb-1.5">Nazwa *</label><input type="text" placeholder="Promocja letnia" value={promoForm.name} onChange={e => setPromoForm({ ...promoForm, name: e.target.value })} className="input-bubble h-11" /></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <BubbleSelect label="Typ zniżki" options={[{ value: "PERCENTAGE", label: "Procentowa (%)" }, { value: "FIXED", label: "Kwotowa (PLN)" }]} value={promoForm.discountType} onChange={v => setPromoForm({ ...promoForm, discountType: v })} />
              <div><label className="text-[12px] font-semibold text-muted-foreground block mb-1.5">Wartość *</label><input type="number" placeholder="10" value={promoForm.discountValue} onChange={e => setPromoForm({ ...promoForm, discountValue: e.target.value })} className="input-bubble h-11" /></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label className="text-[12px] font-semibold text-muted-foreground block mb-1.5">Ważny od *</label><BubbleDatePicker value={promoForm.validFrom} onChange={v => setPromoForm({ ...promoForm, validFrom: v })} /></div>
              <div><label className="text-[12px] font-semibold text-muted-foreground block mb-1.5">Ważny do *</label><BubbleDatePicker value={promoForm.validUntil} onChange={v => setPromoForm({ ...promoForm, validUntil: v })} /></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label className="text-[12px] font-semibold text-muted-foreground block mb-1.5">Min. wartość rezerwacji</label><input type="number" placeholder="Brak" value={promoForm.minBookingValue} onChange={e => setPromoForm({ ...promoForm, minBookingValue: e.target.value })} className="input-bubble h-11" /></div>
              <div><label className="text-[12px] font-semibold text-muted-foreground block mb-1.5">Max użyć</label><input type="number" placeholder="Bez limitu" value={promoForm.maxUses} onChange={e => setPromoForm({ ...promoForm, maxUses: e.target.value })} className="input-bubble h-11" /></div>
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={savePromo} disabled={saving || !promoForm.code || !promoForm.name || !promoForm.discountValue || !promoForm.validFrom || !promoForm.validUntil} className="btn-bubble btn-primary-bubble px-5 py-2.5 text-[13px] flex-1 disabled:opacity-50">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} {editingId ? "Zapisz" : "Dodaj kod"}</button>
              <button onClick={() => setPanelOpen(false)} className="btn-bubble btn-secondary-bubble px-5 py-2.5 text-[13px]">Anuluj</button>
            </div>
          </div>
        )}
      </SlidePanel>
    </div>
  );
}
