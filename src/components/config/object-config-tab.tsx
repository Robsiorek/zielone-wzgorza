"use client";

/**
 * ObjectConfigTab — Company info display + slide panel edit.
 *
 * D0: SectionCard pattern from client-details-page.
 * Read-only display in SectionCards, "Edytuj" opens SlidePanel.
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  Building2, Pencil, Phone, Mail, Globe, MapPin, FileText,
  Loader2, Check, ChevronDown, ChevronRight, ArrowLeft,
} from "lucide-react";
import { apiFetch } from "@/lib/api-fetch";
import { SlidePanel } from "@/components/ui/slide-panel";
import { useToast } from "@/components/ui/toast";

interface CompanyData {
  companyName: string; legalName: string | null; nip: string | null; regon: string | null;
  address: string | null; city: string | null; postalCode: string | null;
  phone: string | null; email: string | null; website: string | null;
}

const EMPTY: CompanyData = {
  companyName: "", legalName: null, nip: null, regon: null,
  address: null, city: null, postalCode: null, phone: null, email: null, website: null,
};

export function ObjectConfigTab() {
  const toast = useToast();
  const [data, setData] = useState<CompanyData>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState<CompanyData>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [companyOpen, setCompanyOpen] = useState(true);
  const [contactOpen, setContactOpen] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await apiFetch("/api/settings");
      const s = res.settings;
      if (s) {
        const d: CompanyData = {
          companyName: s.companyName || "", legalName: s.legalName, nip: s.nip, regon: s.regon,
          address: s.address, city: s.city, postalCode: s.postalCode,
          phone: s.phone, email: s.email, website: s.website,
        };
        setData(d);
        setForm(d);
      }
    } catch { /* */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openEdit = () => { setForm({ ...data }); setEditOpen(true); };

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiFetch("/api/settings", { method: "PATCH", body: JSON.stringify(form) });
      toast.success("Dane obiektu zapisane");
      setData({ ...form });
      setEditOpen(false);
    } catch (err: any) { toast.error(err?.message || "Błąd zapisu"); }
    finally { setSaving(false); }
  };

  const set = (k: keyof CompanyData, v: string) => setForm(prev => ({ ...prev, [k]: v || null }));

  if (loading) {
    return <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  }

  const fullAddress = [data.address, [data.postalCode, data.city].filter(Boolean).join(" ")].filter(Boolean).join(", ");

  return (
    <div className="space-y-4">
      {/* Edit button */}
      <div className="flex justify-end">
        <button onClick={openEdit}
          className="btn-bubble btn-secondary-bubble px-4 py-2 text-[13px] font-semibold flex items-center gap-1.5">
          <Pencil className="h-3.5 w-3.5" /> Edytuj dane
        </button>
      </div>

      {/* Company info — SectionCard */}
      <div className="bubble" style={{ overflow: "visible" }}>
        <button onClick={() => setCompanyOpen(!companyOpen)}
          className="w-full flex items-center gap-3 px-5 py-4 hover:bg-muted/20 transition-colors">
          <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Building2 className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 text-left">
            <h3 className="text-[14px] font-semibold">Dane firmy</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">Nazwa obiektu, dane rejestrowe i adres siedziby.</p>
          </div>
          {companyOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
        </button>
        <div className={`section-collapse ${companyOpen ? "section-open" : ""}`}>
          <div className="section-collapse-inner">
            <div className="px-5 pb-5 border-t border-border/50 pt-4">
              <InfoRow icon={Building2} label="Nazwa obiektu" value={data.companyName} />
              <InfoRow icon={Building2} label="Nazwa prawna" value={data.legalName} />
              <InfoRow icon={FileText} label="NIP" value={data.nip} />
              <InfoRow icon={FileText} label="REGON" value={data.regon} />
              <InfoRow icon={MapPin} label="Adres" value={fullAddress || null} />
            </div>
          </div>
        </div>
      </div>

      {/* Contact — SectionCard */}
      <div className="bubble" style={{ overflow: "visible" }}>
        <button onClick={() => setContactOpen(!contactOpen)}
          className="w-full flex items-center gap-3 px-5 py-4 hover:bg-muted/20 transition-colors">
          <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Phone className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 text-left">
            <h3 className="text-[14px] font-semibold">Dane kontaktowe</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">Telefon, e-mail i strona www wyświetlane klientom w stopce e-maili.</p>
          </div>
          {contactOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
        </button>
        <div className={`section-collapse ${contactOpen ? "section-open" : ""}`}>
          <div className="section-collapse-inner">
            <div className="px-5 pb-5 border-t border-border/50 pt-4">
              <InfoRow icon={Phone} label="Telefon" value={data.phone} />
              <InfoRow icon={Mail} label="Email" value={data.email} />
              <InfoRow icon={Globe} label="Strona www" value={data.website} />
            </div>
          </div>
        </div>
      </div>

      {/* Edit slide panel */}
      <SlidePanel open={editOpen} onClose={() => setEditOpen(false)} title="Edytuj dane obiektu" width={480}>
        <div className="mb-5">
          <button onClick={() => setEditOpen(false)} className="btn-icon-bubble h-10 w-10">
            <ArrowLeft className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Nazwa obiektu" value={form.companyName || ""} onChange={v => set("companyName", v)} />
            <Field label="Nazwa prawna" value={form.legalName || ""} onChange={v => set("legalName", v)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="NIP" value={form.nip || ""} onChange={v => set("nip", v)} />
            <Field label="REGON" value={form.regon || ""} onChange={v => set("regon", v)} />
          </div>
          <Field label="Adres" value={form.address || ""} onChange={v => set("address", v)} />
          <div className="grid grid-cols-3 gap-4">
            <Field label="Kod pocztowy" value={form.postalCode || ""} onChange={v => set("postalCode", v)} />
            <div className="col-span-2">
              <Field label="Miasto" value={form.city || ""} onChange={v => set("city", v)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Telefon" value={form.phone || ""} onChange={v => set("phone", v)} />
            <Field label="Email" value={form.email || ""} onChange={v => set("email", v)} type="email" />
          </div>
          <Field label="Strona www" value={form.website || ""} onChange={v => set("website", v)} />

          <div className="flex gap-3 pt-2">
            <button onClick={handleSave} disabled={saving}
              className="btn-bubble btn-primary-bubble px-5 py-2.5 text-[13px] font-semibold flex items-center gap-1.5 disabled:opacity-50">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              {saving ? "Zapisywanie..." : "Zapisz"}
            </button>
            <button onClick={() => setEditOpen(false)}
              className="btn-bubble btn-secondary-bubble px-5 py-2.5 text-[13px] font-semibold">
              Anuluj
            </button>
          </div>
        </div>
      </SlidePanel>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-border/30 last:border-b-0">
      <div className="h-7 w-7 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[11px] font-medium text-muted-foreground">{label}</div>
        <div className="text-[13px] font-medium text-foreground mt-0.5">{value}</div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text" }: {
  label: string; value: string; onChange: (v: string) => void; type?: string;
}) {
  return (
    <div>
      <label className="text-[12px] font-semibold text-muted-foreground block mb-1.5">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        className="input-bubble h-11 w-full text-[13px]" />
    </div>
  );
}
