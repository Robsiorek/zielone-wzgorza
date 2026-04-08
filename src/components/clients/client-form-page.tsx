"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Check, ChevronDown, ChevronRight, Building2, User as UserIcon, CreditCard, Tag, Mail, FileText } from "lucide-react";
import { BubbleSelect } from "@/components/ui/bubble-select";
import { apiFetch } from "@/lib/api-fetch";
import { useToast } from "@/components/ui/toast";

interface Props { mode: "create" | "edit"; clientId?: string; }

const countryOpts = [{ value: "PL", label: "Polska" },{ value: "DE", label: "Niemcy" },{ value: "CZ", label: "Czechy" },{ value: "SK", label: "Słowacja" },{ value: "UA", label: "Ukraina" },{ value: "GB", label: "Wlk. Brytania" },{ value: "NL", label: "Holandia" },{ value: "FR", label: "Francja" },{ value: "OTHER", label: "Inny" }];
const langOpts = [{ value: "pl", label: "Polski" },{ value: "en", label: "Angielski" },{ value: "de", label: "Niemiecki" }];
const statusOpts = [{ value: "LEAD", label: "Lead" },{ value: "ACTIVE", label: "Aktywny" },{ value: "VIP", label: "VIP" },{ value: "ARCHIVED", label: "Archiwalny" },{ value: "BLOCKED", label: "Zablokowany" }];
const segOpts = [{ value: "STANDARD", label: "Standard" },{ value: "REGULAR", label: "Stały klient" },{ value: "VIP", label: "VIP" },{ value: "CORPORATE", label: "Firma" },{ value: "GROUP", label: "Grupa" }];
const srcOpts = [{ value: "MANUAL", label: "Ręczne" },{ value: "GOOGLE_ADS", label: "Google Ads" },{ value: "SEO", label: "SEO" },{ value: "FACEBOOK", label: "Facebook" },{ value: "REFERRAL", label: "Polecenie" },{ value: "PHONE", label: "Telefon" },{ value: "EMAIL", label: "E-mail" },{ value: "SALES", label: "Handlowiec" }];

const defaultForm = {
  type: "INDIVIDUAL", status: "ACTIVE", firstName: "", lastName: "", email: "", phone: "", phoneSecondary: "", emailSecondary: "",
  address: "", postalCode: "", city: "", country: "PL", language: "pl",
  companyName: "", nip: "", contactFirstName: "", contactLastName: "",
  segment: "STANDARD", source: "MANUAL", discountStandard: "", discountPromo: "", currency: "PLN",
  billingSame: true, billingType: "INDIVIDUAL", billingCompanyName: "", billingNip: "",
  billingFirstName: "", billingLastName: "", billingAddress: "", billingPostalCode: "", billingCity: "", billingCountry: "PL",
  guestSame: true, guestFirstName: "", guestLastName: "", guestEmail: "", guestPhone: "",
  guestAddress: "", guestPostalCode: "", guestCity: "", guestCountry: "PL", guestLanguage: "pl",
  consentNewsletter: false, consentPhone: false, consentMarketing: false,
  noteContent: "",
};

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer group">
      <button type="button" onClick={() => onChange(!checked)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? "bg-primary" : "bg-muted-foreground/20"}`}>
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${checked ? "translate-x-6" : "translate-x-1"}`} />
      </button>
      <span className="text-[13px] text-foreground group-hover:text-primary transition-colors">{label}</span>
    </label>
  );
}

function Section({ title, description, icon: Icon, open, onToggle, children }: { title: string; description?: string; icon?: React.ElementType; open: boolean; onToggle: () => void; children: React.ReactNode }) {
  return (
    <div className="bubble" style={{ overflow: "visible" }}>
      <button type="button" onClick={onToggle} className="w-full flex items-center gap-3 px-5 py-4 hover:bg-muted/20 transition-colors">
        {Icon && (
          <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Icon className="h-4 w-4 text-primary" />
          </div>
        )}
        <div className="flex-1 text-left">
          <h3 className="text-[14px] font-semibold">{title}</h3>
          {description && <p className="text-[11px] text-muted-foreground mt-0.5">{description}</p>}
        </div>
        {open ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
      </button>
      <div className={`section-collapse ${open ? "section-open" : ""}`}>
        <div className="section-collapse-inner">
          <div className="px-5 pb-5 pt-5 border-t border-border/50" style={{ overflow: "visible" }}>{children}</div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="block text-[12px] font-semibold text-muted-foreground mb-1.5">{label}</label>
      {children}
    </div>
  );
}

export function ClientFormPage({ mode, clientId }: Props) {
  const router = useRouter();
  const { error: showError } = useToast();
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [loadingData, setLoadingData] = useState(mode === "edit");
  const [sections, setSections] = useState({ booker: true, billing: false, guest: false, commercial: false, consent: false, notes: false });

  const isCompany = form.type === "COMPANY";

  useEffect(() => {
    if (mode === "edit" && clientId) {
      (async () => {
        try {
          const data = await apiFetch("/api/clients/" + clientId);
          if (data.client) {
            const c = data.client;
            setForm({
              type: c.type || "INDIVIDUAL", status: c.status || "ACTIVE",
              firstName: c.firstName || "", lastName: c.lastName || "",
              email: c.email || "", phone: c.phone || "",
              phoneSecondary: c.phoneSecondary || "", emailSecondary: c.emailSecondary || "",
              address: c.address || "", postalCode: c.postalCode || "", city: c.city || "",
              country: c.country || "PL", language: c.language || "pl",
              companyName: c.companyName || "", nip: c.nip || "",
              contactFirstName: c.contactFirstName || "", contactLastName: c.contactLastName || "",
              segment: c.segment || "STANDARD", source: c.source || "MANUAL",
              discountStandard: c.discountStandard ? String(c.discountStandard) : "",
              discountPromo: c.discountPromo ? String(c.discountPromo) : "",
              currency: c.currency || "PLN",
              billingSame: !c.billingProfiles?.length || c.billingProfiles[0]?.sameAsClient !== false,
              billingType: c.billingProfiles?.[0]?.type || "INDIVIDUAL",
              billingCompanyName: c.billingProfiles?.[0]?.companyName || "",
              billingNip: c.billingProfiles?.[0]?.nip || "",
              billingFirstName: c.billingProfiles?.[0]?.firstName || "",
              billingLastName: c.billingProfiles?.[0]?.lastName || "",
              billingAddress: c.billingProfiles?.[0]?.address || "",
              billingPostalCode: c.billingProfiles?.[0]?.postalCode || "",
              billingCity: c.billingProfiles?.[0]?.city || "",
              billingCountry: c.billingProfiles?.[0]?.country || "PL",
              guestSame: !c.guestProfile || c.guestProfile.sameAsClient !== false,
              guestFirstName: c.guestProfile?.firstName || "", guestLastName: c.guestProfile?.lastName || "",
              guestEmail: c.guestProfile?.email || "", guestPhone: c.guestProfile?.phone || "",
              guestAddress: c.guestProfile?.address || "", guestPostalCode: c.guestProfile?.postalCode || "",
              guestCity: c.guestProfile?.city || "", guestCountry: c.guestProfile?.country || "PL", guestLanguage: c.guestProfile?.language || "pl",
              consentNewsletter: c.consent?.newsletter || false, consentPhone: c.consent?.phoneContact || false, consentMarketing: c.consent?.marketing || false,
              noteContent: "",
            });
          }
        } catch (e: any) {
          showError(e.message || "Błąd ładowania danych klienta");
        }
        setLoadingData(false);
      })();
    }
  }, [mode, clientId]);

  const set = (f: string, v: any) => setForm(prev => ({ ...prev, [f]: v }));
  const tog = (s: keyof typeof sections) => setSections(prev => ({ ...prev, [s]: !prev[s] }));

  async function handleSubmit() {
    setSaving(true);
    const payload: any = {
      type: form.type, status: form.status,
      firstName: form.firstName || null, lastName: form.lastName || null,
      email: form.email || null, phone: form.phone || null,
      phoneSecondary: form.phoneSecondary || null, emailSecondary: form.emailSecondary || null,
      address: form.address || null, postalCode: form.postalCode || null, city: form.city || null,
      country: form.country, language: form.language,
      companyName: form.companyName || null, nip: form.nip || null,
      contactFirstName: form.contactFirstName || null, contactLastName: form.contactLastName || null,
      segment: form.segment, source: form.source,
      discountStandard: form.discountStandard ? parseFloat(form.discountStandard) : null,
      discountPromo: form.discountPromo ? parseFloat(form.discountPromo) : null, currency: form.currency,
    };
    if (!form.billingSame) {
      payload.billingProfile = {
        sameAsClient: false, type: form.billingType, companyName: form.billingCompanyName || null, nip: form.billingNip || null,
        firstName: form.billingFirstName || null, lastName: form.billingLastName || null,
        address: form.billingAddress || null, postalCode: form.billingPostalCode || null, city: form.billingCity || null, country: form.billingCountry,
      };
    }
    if (!form.guestSame) {
      payload.guestProfile = {
        sameAsClient: false, firstName: form.guestFirstName || null, lastName: form.guestLastName || null,
        email: form.guestEmail || null, phone: form.guestPhone || null,
        address: form.guestAddress || null, postalCode: form.guestPostalCode || null, city: form.guestCity || null, country: form.guestCountry, language: form.guestLanguage,
      };
    }
    payload.consent = { newsletter: form.consentNewsletter, phoneContact: form.consentPhone, marketing: form.consentMarketing };
    const url = mode === "edit" ? "/api/clients/" + clientId : "/api/clients";
    const method = mode === "edit" ? "PUT" : "POST";
    try {
      const data = await apiFetch(url, { method, body: payload });
      setSaving(false);
      router.push("/admin/clients/" + (data.client?.id || clientId));
    } catch (e: any) {
      showError(e.message || "Błąd zapisu klienta");
      setSaving(false);
    }
  }

  if (loadingData) return <div className="flex items-center justify-center min-h-[50vh]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-5 fade-in-up max-w-[800px]">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="h-9 w-9 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-all border border-border"><ArrowLeft className="h-4 w-4" /></button>
        <h2 className="text-xl font-bold tracking-tight">{mode === "edit" ? "Edytuj klienta" : "Nowy klient"}</h2>
      </div>

      <Section title="Dane rezerwującego" description="Imię, nazwisko, e-mail i telefon osoby rezerwującej." icon={UserIcon} open={sections.booker} onToggle={() => tog("booker")}>
        <div className="space-y-5">
          <div className="flex gap-2">
            <button type="button" onClick={() => set("type", "INDIVIDUAL")} className={"flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-medium border transition-all " + (!isCompany ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-muted")}><UserIcon className="h-4 w-4" /> Osoba prywatna</button>
            <button type="button" onClick={() => set("type", "COMPANY")} className={"flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-medium border transition-all " + (isCompany ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-muted")}><Building2 className="h-4 w-4" /> Firma</button>
          </div>
          {isCompany && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Nazwa firmy *"><input value={form.companyName} onChange={e => set("companyName", e.target.value)} className="input-bubble h-11" placeholder="Nazwa firmy" /></Field>
              <Field label="NIP"><input value={form.nip} onChange={e => set("nip", e.target.value)} className="input-bubble h-11" placeholder="1234567890" /></Field>
              <Field label="Imię osoby kontaktowej"><input value={form.contactFirstName} onChange={e => set("contactFirstName", e.target.value)} className="input-bubble h-11" /></Field>
              <Field label="Nazwisko osoby kontaktowej"><input value={form.contactLastName} onChange={e => set("contactLastName", e.target.value)} className="input-bubble h-11" /></Field>
            </div>
          )}
          {!isCompany && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Imię *"><input value={form.firstName} onChange={e => set("firstName", e.target.value)} className="input-bubble h-11" /></Field>
              <Field label="Nazwisko *"><input value={form.lastName} onChange={e => set("lastName", e.target.value)} className="input-bubble h-11" /></Field>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="E-mail"><input type="email" value={form.email} onChange={e => set("email", e.target.value)} className="input-bubble h-11" /></Field>
            <Field label="Telefon"><input value={form.phone} onChange={e => set("phone", e.target.value)} className="input-bubble h-11" placeholder="+48 600 000 000" /></Field>
            <Field label="Dodatkowy e-mail"><input value={form.emailSecondary} onChange={e => set("emailSecondary", e.target.value)} className="input-bubble h-11" /></Field>
            <Field label="Dodatkowy telefon"><input value={form.phoneSecondary} onChange={e => set("phoneSecondary", e.target.value)} className="input-bubble h-11" /></Field>
          </div>
          <Field label="Adres"><input value={form.address} onChange={e => set("address", e.target.value)} className="input-bubble h-11" /></Field>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Kod pocztowy"><input value={form.postalCode} onChange={e => set("postalCode", e.target.value)} className="input-bubble h-11" placeholder="00-000" /></Field>
            <Field label="Miasto"><input value={form.city} onChange={e => set("city", e.target.value)} className="input-bubble h-11" /></Field>
            <Field label="Kraj"><BubbleSelect options={countryOpts} value={form.country} onChange={v => set("country", v)} /></Field>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Język"><BubbleSelect options={langOpts} value={form.language} onChange={v => set("language", v)} /></Field>
          </div>
        </div>
      </Section>

      <Section title="Dane do faktury" description="Adres i dane do wystawienia faktury VAT." icon={CreditCard} open={sections.billing} onToggle={() => tog("billing")}>
        <div className="space-y-5">
          <Toggle checked={form.billingSame} onChange={v => set("billingSame", v)} label="Takie same jak dane rezerwującego" />
          {!form.billingSame && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Nazwa firmy"><input value={form.billingCompanyName} onChange={e => set("billingCompanyName", e.target.value)} className="input-bubble h-11" /></Field>
                <Field label="NIP"><input value={form.billingNip} onChange={e => set("billingNip", e.target.value)} className="input-bubble h-11" /></Field>
                <Field label="Imię"><input value={form.billingFirstName} onChange={e => set("billingFirstName", e.target.value)} className="input-bubble h-11" /></Field>
                <Field label="Nazwisko"><input value={form.billingLastName} onChange={e => set("billingLastName", e.target.value)} className="input-bubble h-11" /></Field>
              </div>
              <Field label="Adres"><input value={form.billingAddress} onChange={e => set("billingAddress", e.target.value)} className="input-bubble h-11" /></Field>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Field label="Kod"><input value={form.billingPostalCode} onChange={e => set("billingPostalCode", e.target.value)} className="input-bubble h-11" /></Field>
                <Field label="Miasto"><input value={form.billingCity} onChange={e => set("billingCity", e.target.value)} className="input-bubble h-11" /></Field>
                <Field label="Kraj"><BubbleSelect options={countryOpts} value={form.billingCountry} onChange={v => set("billingCountry", v)} /></Field>
              </div>
            </>
          )}
        </div>
      </Section>

      <Section title="Dane gościa" description="Informacje o głównym gościu pobytu." icon={UserIcon} open={sections.guest} onToggle={() => tog("guest")}>
        <div className="space-y-5">
          <Toggle checked={form.guestSame} onChange={v => set("guestSame", v)} label="Takie same jak dane rezerwującego" />
          {!form.guestSame && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Imię"><input value={form.guestFirstName} onChange={e => set("guestFirstName", e.target.value)} className="input-bubble h-11" /></Field>
                <Field label="Nazwisko"><input value={form.guestLastName} onChange={e => set("guestLastName", e.target.value)} className="input-bubble h-11" /></Field>
                <Field label="E-mail"><input value={form.guestEmail} onChange={e => set("guestEmail", e.target.value)} className="input-bubble h-11" /></Field>
                <Field label="Telefon"><input value={form.guestPhone} onChange={e => set("guestPhone", e.target.value)} className="input-bubble h-11" /></Field>
              </div>
              <Field label="Adres"><input value={form.guestAddress} onChange={e => set("guestAddress", e.target.value)} className="input-bubble h-11" /></Field>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Field label="Kod"><input value={form.guestPostalCode} onChange={e => set("guestPostalCode", e.target.value)} className="input-bubble h-11" /></Field>
                <Field label="Miasto"><input value={form.guestCity} onChange={e => set("guestCity", e.target.value)} className="input-bubble h-11" /></Field>
                <Field label="Kraj"><BubbleSelect options={countryOpts} value={form.guestCountry} onChange={v => set("guestCountry", v)} /></Field>
              </div>
            </>
          )}
        </div>
      </Section>

      <Section title="Ustawienia handlowe" description="Segment, typ, źródło i indywidualne warunki klienta." icon={Tag} open={sections.commercial} onToggle={() => tog("commercial")}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Status klienta"><BubbleSelect options={statusOpts} value={form.status} onChange={v => set("status", v)} /></Field>
          <Field label="Segment"><BubbleSelect options={segOpts} value={form.segment} onChange={v => set("segment", v)} /></Field>
          <Field label={"Źródło pozyskania"}><BubbleSelect options={srcOpts} value={form.source} onChange={v => set("source", v)} /></Field>
          <Field label="Waluta"><BubbleSelect options={[{ value: "PLN", label: "PLN" },{ value: "EUR", label: "EUR" },{ value: "USD", label: "USD" }]} value={form.currency} onChange={v => set("currency", v)} /></Field>
          <Field label="Rabat standardowy (%)"><input type="number" step="0.1" value={form.discountStandard} onChange={e => set("discountStandard", e.target.value)} className="input-bubble h-11" placeholder="0" /></Field>
          <Field label="Rabat promocyjny (%)"><input type="number" step="0.1" value={form.discountPromo} onChange={e => set("discountPromo", e.target.value)} className="input-bubble h-11" placeholder="0" /></Field>
        </div>
      </Section>

      <Section title="Komunikacja i marketing" description="Zgody na kontakt, język komunikacji i preferencje." icon={Mail} open={sections.consent} onToggle={() => tog("consent")}>
        <div className="space-y-5">
          <Toggle checked={form.consentNewsletter} onChange={v => set("consentNewsletter", v)} label="Zgoda na newsletter e-mail" />
          <Toggle checked={form.consentPhone} onChange={v => set("consentPhone", v)} label="Zgoda na kontakt telefoniczny" />
          <Toggle checked={form.consentMarketing} onChange={v => set("consentMarketing", v)} label="Zgoda na kontakt marketingowy" />
        </div>
      </Section>

      <Section title="Notatki" description="Wewnętrzne notatki widoczne tylko dla personelu." icon={FileText} open={sections.notes} onToggle={() => tog("notes")}>
        <Field label="Notatka o kliencie"><textarea value={form.noteContent} onChange={e => set("noteContent", e.target.value)} className="input-bubble min-h-[80px] resize-y" placeholder="Opcjonalna notatka..." /></Field>
      </Section>

      <div className="flex gap-3 pt-2 pb-8">
        <button onClick={handleSubmit} disabled={saving} className="btn-bubble btn-primary-bubble px-6 py-3 text-[13px] disabled:opacity-50">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          {mode === "edit" ? "Zapisz zmiany" : "Utwórz klienta"}
        </button>
        <button onClick={() => router.back()} className="btn-bubble btn-secondary-bubble px-6 py-3 text-[13px]">Anuluj</button>
      </div>
    </div>
  );
}
