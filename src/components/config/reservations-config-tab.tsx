"use client";

/**
 * ReservationsConfigTab — Check-in/out times + per-category overrides + payment deadline.
 *
 * D 159-162: SectionCard pattern. Global times + ACCOMMODATION category overrides.
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  Clock, Calendar, Loader2, Save, ChevronDown, ChevronRight, Home,
} from "lucide-react";
import { apiFetch } from "@/lib/api-fetch";
import { BubbleSelect } from "@/components/ui/bubble-select";
import { useToast } from "@/components/ui/toast";

const HOURS = Array.from({ length: 24 }, (_, i) => {
  const h = String(i).padStart(2, "0");
  return { value: `${h}:00`, label: `${h}:00` };
});

interface CategoryOverride {
  id: string;
  name: string;
  type: string;
  checkInTimeOverride: string | null;
  checkOutTimeOverride: string | null;
}

export function ReservationsConfigTab() {
  const toast = useToast();
  const [checkInTime, setCheckInTime] = useState("15:00");
  const [checkOutTime, setCheckOutTime] = useState("11:00");
  const [paymentDeadlineHours, setPaymentDeadlineHours] = useState(24);
  const [overdueNotificationHours, setOverdueNotificationHours] = useState(12);
  const [categories, setCategories] = useState<CategoryOverride[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingCat, setSavingCat] = useState<string | null>(null);
  const [hoursOpen, setHoursOpen] = useState(true);
  const [categoryOpen, setCategoryOpen] = useState(true);
  const [deadlineOpen, setDeadlineOpen] = useState(true);

  const load = useCallback(async () => {
    try {
      const [settingsRes, catRes] = await Promise.all([
        apiFetch("/api/settings"),
        apiFetch("/api/resource-categories"),
      ]);
      const s = settingsRes.settings;
      if (s?.checkInTime) setCheckInTime(s.checkInTime);
      if (s?.checkOutTime) setCheckOutTime(s.checkOutTime);
      if (s?.paymentDeadlineHours) setPaymentDeadlineHours(s.paymentDeadlineHours);
      if (s?.overdueNotificationHours) setOverdueNotificationHours(s.overdueNotificationHours);

      // Only ACCOMMODATION categories have time overrides
      const accCats = (catRes.categories || [])
        .filter((c: any) => c.type === "ACCOMMODATION")
        .map((c: any) => ({
          id: c.id, name: c.name, type: c.type,
          checkInTimeOverride: c.checkInTimeOverride || null,
          checkOutTimeOverride: c.checkOutTimeOverride || null,
        }));
      setCategories(accCats);
    } catch { /* */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSaveGlobal = async () => {
    setSaving(true);
    try {
      await apiFetch("/api/settings", {
        method: "PATCH",
        body: JSON.stringify({ checkInTime, checkOutTime, paymentDeadlineHours, overdueNotificationHours }),
      });
      toast.success("Ustawienia rezerwacji zapisane");
    } catch (err: any) {
      toast.error(err?.message || "Błąd zapisu");
    } finally { setSaving(false); }
  };

  const handleCategoryOverride = async (catId: string, field: "checkInTimeOverride" | "checkOutTimeOverride", value: string | null) => {
    // Update local state optimistically
    setCategories(prev => prev.map(c =>
      c.id === catId ? { ...c, [field]: value } : c
    ));

    setSavingCat(catId);
    try {
      await apiFetch(`/api/resource-categories/${catId}`, {
        method: "PATCH",
        body: JSON.stringify({ [field]: value }),
      });
      toast.success("Zapisano");
    } catch (err: any) {
      toast.error(err?.message || "Błąd zapisu");
      load(); // revert
    } finally { setSavingCat(null); }
  };

  // BubbleSelect options with "Użyj globalnych" as first option
  const checkInOptions = [
    { value: "", label: `Globalne (${checkInTime})` },
    ...HOURS,
  ];
  const checkOutOptions = [
    { value: "", label: `Globalne (${checkOutTime})` },
    ...HOURS,
  ];

  if (loading) {
    return <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-4">
      {/* Global hours — SectionCard */}
      <div className="bubble" style={{ overflow: "visible" }}>
        <button onClick={() => setHoursOpen(!hoursOpen)}
          className="w-full flex items-center gap-3 px-5 py-4 hover:bg-muted/20 transition-colors">
          <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Clock className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 text-left">
            <h3 className="text-[14px] font-semibold">Godziny operacyjne</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Domyślne godziny zameldowania i wymeldowania dla wszystkich kategorii.
            </p>
          </div>
          {hoursOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
        </button>
        <div className={`section-collapse ${hoursOpen ? "section-open" : ""}`}>
          <div className="section-collapse-inner">
            <div className="px-5 pb-5 border-t border-border/50 pt-4">
              <div className="grid grid-cols-2 gap-4 max-w-[400px]">
                <div>
                  <label className="text-[12px] font-semibold text-muted-foreground block mb-1.5">Zameldowanie od</label>
                  <BubbleSelect options={HOURS} value={checkInTime} onChange={setCheckInTime} />
                </div>
                <div>
                  <label className="text-[12px] font-semibold text-muted-foreground block mb-1.5">Wymeldowanie do</label>
                  <BubbleSelect options={HOURS} value={checkOutTime} onChange={setCheckOutTime} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Per-category overrides — SectionCard */}
      {categories.length > 0 && (
        <div className="bubble" style={{ overflow: "visible" }}>
          <button onClick={() => setCategoryOpen(!categoryOpen)}
            className="w-full flex items-center gap-3 px-5 py-4 hover:bg-muted/20 transition-colors">
            <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Home className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 text-left">
              <h3 className="text-[14px] font-semibold">Godziny per kategoria</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Nadpisz godziny dla wybranych kategorii noclegowych. Puste = globalne ({checkInTime} / {checkOutTime}).
              </p>
            </div>
            {categoryOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
          </button>
          <div className={`section-collapse ${categoryOpen ? "section-open" : ""}`}>
            <div className="section-collapse-inner">
              <div className="px-5 pb-5 border-t border-border/50 pt-4 space-y-4">
                {categories.map(cat => (
                  <div key={cat.id} className="flex items-center gap-4 py-2 border-b border-border/30 last:border-b-0">
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-semibold">{cat.name}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {cat.checkInTimeOverride && cat.checkOutTimeOverride
                          ? `${cat.checkInTimeOverride} / ${cat.checkOutTimeOverride}`
                          : cat.checkInTimeOverride
                            ? `${cat.checkInTimeOverride} / globalne`
                            : cat.checkOutTimeOverride
                              ? `globalne / ${cat.checkOutTimeOverride}`
                              : "Używa globalnych"
                        }
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="w-[130px]">
                        <label className="text-[10px] text-muted-foreground block mb-1">Zameldowanie</label>
                        <BubbleSelect
                          options={checkInOptions}
                          value={cat.checkInTimeOverride || ""}
                          onChange={v => handleCategoryOverride(cat.id, "checkInTimeOverride", v || null)}
                        />
                      </div>
                      <div className="w-[130px]">
                        <label className="text-[10px] text-muted-foreground block mb-1">Wymeldowanie</label>
                        <BubbleSelect
                          options={checkOutOptions}
                          value={cat.checkOutTimeOverride || ""}
                          onChange={v => handleCategoryOverride(cat.id, "checkOutTimeOverride", v || null)}
                        />
                      </div>
                      {savingCat === cat.id && <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment deadline — SectionCard */}
      <div className="bubble" style={{ overflow: "visible" }}>
        <button onClick={() => setDeadlineOpen(!deadlineOpen)}
          className="w-full flex items-center gap-3 px-5 py-4 hover:bg-muted/20 transition-colors">
          <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Calendar className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 text-left">
            <h3 className="text-[14px] font-semibold">Terminy płatności</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Czas na wpłatę od momentu utworzenia rezerwacji oraz wyprzedzenie powiadomienia o zaległości.
            </p>
          </div>
          {deadlineOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
        </button>
        <div className={`section-collapse ${deadlineOpen ? "section-open" : ""}`}>
          <div className="section-collapse-inner">
            <div className="px-5 pb-5 border-t border-border/50 pt-4">
              <div className="grid grid-cols-2 gap-4 max-w-[400px]">
                <div>
                  <label className="text-[12px] font-semibold text-muted-foreground block mb-1.5">Termin na wpłatę</label>
                  <div className="flex items-center gap-2">
                    <input type="number" min={1} max={720} value={paymentDeadlineHours}
                      onChange={e => setPaymentDeadlineHours(Number(e.target.value))}
                      className="input-bubble h-11 w-[80px] text-[13px] text-right" />
                    <span className="text-[13px] text-muted-foreground">godzin</span>
                  </div>
                </div>
                <div>
                  <label className="text-[12px] font-semibold text-muted-foreground block mb-1.5">Powiadomienie</label>
                  <div className="flex items-center gap-2">
                    <input type="number" min={1} max={168} value={overdueNotificationHours}
                      onChange={e => setOverdueNotificationHours(Number(e.target.value))}
                      className="input-bubble h-11 w-[80px] text-[13px] text-right" />
                    <span className="text-[13px] text-muted-foreground">godzin</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Save global */}
      <button onClick={handleSaveGlobal} disabled={saving}
        className="btn-bubble btn-primary-bubble px-6 py-2.5 text-[13px] font-semibold flex items-center gap-1.5 disabled:opacity-50">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        {saving ? "Zapisywanie..." : "Zapisz ustawienia"}
      </button>
    </div>
  );
}
