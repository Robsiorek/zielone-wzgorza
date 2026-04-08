"use client";

import React, { useState } from "react";
import { User, Mail, Phone, Building2, FileText, MessageSquare, Loader2, ShieldCheck, ChevronDown } from "lucide-react";
import { apiFetch, ApiError } from "@/lib/api-fetch";
import type { BookingDates, SelectedResource, QuoteData, ClientData, BookingResult } from "./BookingWidget";

interface Props {
  quote: QuoteData;
  dates: BookingDates;
  resources: SelectedResource[];
  initial: ClientData;
  onBook: (result: BookingResult, client: ClientData) => void;
  onBack: () => void;
}

function formatMoney(minor: number): string {
  const val = minor / 100;
  return val % 1 === 0 ? `${val} zł` : `${val.toFixed(2).replace(".", ",")} zł`;
}

export function StepClient({ quote, dates, resources, initial, onBook, onBack }: Props) {
  const [form, setForm] = useState<ClientData>({
    firstName: initial.firstName || "",
    lastName: initial.lastName || "",
    email: initial.email || "",
    phone: initial.phone || "",
    companyName: initial.companyName || "",
    nip: initial.nip || "",
    address: initial.address || "",
    city: initial.city || "",
    postalCode: initial.postalCode || "",
    guestNotes: initial.guestNotes || "",
  });
  const [consent, setConsent] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function setField(key: keyof ClientData, value: string) {
    setForm(prev => ({ ...prev, [key]: value }));
    if (fieldErrors[key]) {
      setFieldErrors(prev => { const n = { ...prev }; delete n[key]; return n; });
    }
  }

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!form.firstName.trim()) errs.firstName = "Pole wymagane";
    if (!form.lastName.trim()) errs.lastName = "Pole wymagane";
    if (!form.email.trim()) errs.email = "Pole wymagane";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errs.email = "Nieprawidłowy format";
    if (!form.phone.trim()) errs.phone = "Pole wymagane";
    else {
      const cleaned = form.phone.replace(/[\s\-()]/g, "");
      if (!/^(\+?48)?\d{9}$/.test(cleaned)) errs.phone = "Nieprawidłowy format";
    }
    if (!consent) errs.consent = "Wymagana zgoda";
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setSubmitting(true);
    setError("");
    try {
      const data = await apiFetch("/api/public/book", {
        method: "POST",
        body: {
          quoteId: quote.quoteId,
          quoteSecret: quote.quoteSecret,
          client: {
            firstName: form.firstName.trim(),
            lastName: form.lastName.trim(),
            email: form.email.trim().toLowerCase(),
            phone: form.phone.trim(),
            companyName: form.companyName?.trim() || undefined,
            nip: form.nip?.trim() || undefined,
            address: form.address?.trim() || undefined,
            city: form.city?.trim() || undefined,
            postalCode: form.postalCode?.trim() || undefined,
          },
          guestNotes: form.guestNotes?.trim() || undefined,
          consentAccepted: true,
        },
      });

      onBook({
        reservationNumber: data.reservationNumber,
        token: data.token,
        totalMinor: data.totalMinor,
        depositMinor: data.depositMinor,
        status: data.status,
      }, form);
    } catch (e: any) {
      if (e instanceof ApiError) {
        if (e.code === "CONFLICT") {
          setError("Wybrany termin został właśnie zarezerwowany przez innego klienta. Wróć i wybierz inny termin.");
        } else if (e.code === "QUOTE_EXPIRED") {
          setError("Wycena wygasła. Wróć i wygeneruj nową wycenę.");
        } else {
          setError(e.message);
        }
      } else {
        setError("Wystąpił nieoczekiwany błąd. Spróbuj ponownie.");
      }
    }
    setSubmitting(false);
  }

  const total = quote.result?.totalMinor || 0;
  const deposit = quote.result?.depositMinor || 0;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold tracking-tight">Dane kontaktowe</h2>
        <p className="text-[13px] text-muted-foreground mt-1">
          Podaj dane do rezerwacji. Na podany adres email wyślemy potwierdzenie.
        </p>
      </div>

      {/* Personal data card */}
      <div className="bg-card rounded-2xl border-2 border-border p-5 space-y-4">
        <div className="flex items-center gap-2 text-[14px] font-semibold">
          <User className="h-4 w-4 text-primary" />
          Dane osobowe
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[12px] font-semibold text-muted-foreground block mb-1.5">Imię *</label>
            <input
              type="text"
              value={form.firstName}
              onChange={(e) => setField("firstName", e.target.value)}
              placeholder="Jan"
              className={`input-bubble h-11 w-full text-[14px] ${fieldErrors.firstName ? "border-destructive" : ""}`}
            />
            {fieldErrors.firstName && <p className="text-[11px] text-destructive mt-1">{fieldErrors.firstName}</p>}
          </div>
          <div>
            <label className="text-[12px] font-semibold text-muted-foreground block mb-1.5">Nazwisko *</label>
            <input
              type="text"
              value={form.lastName}
              onChange={(e) => setField("lastName", e.target.value)}
              placeholder="Kowalski"
              className={`input-bubble h-11 w-full text-[14px] ${fieldErrors.lastName ? "border-destructive" : ""}`}
            />
            {fieldErrors.lastName && <p className="text-[11px] text-destructive mt-1">{fieldErrors.lastName}</p>}
          </div>
        </div>

        <div>
          <label className="text-[12px] font-semibold text-muted-foreground block mb-1.5">
            <Mail className="h-3 w-3 inline mr-1" />
            Email *
          </label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setField("email", e.target.value)}
            placeholder="jan@kowalski.pl"
            className={`input-bubble h-11 w-full text-[14px] ${fieldErrors.email ? "border-destructive" : ""}`}
          />
          {fieldErrors.email && <p className="text-[11px] text-destructive mt-1">{fieldErrors.email}</p>}
        </div>

        <div>
          <label className="text-[12px] font-semibold text-muted-foreground block mb-1.5">
            <Phone className="h-3 w-3 inline mr-1" />
            Telefon *
          </label>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => setField("phone", e.target.value)}
            placeholder="+48 123 456 789"
            className={`input-bubble h-11 w-full text-[14px] ${fieldErrors.phone ? "border-destructive" : ""}`}
          />
          {fieldErrors.phone && <p className="text-[11px] text-destructive mt-1">{fieldErrors.phone}</p>}
        </div>
      </div>

      {/* Invoice data (collapsible) */}
      <div className="bg-card rounded-2xl border-2 border-border overflow-hidden">
        <button
          onClick={() => setShowInvoice(!showInvoice)}
          className="w-full flex items-center justify-between p-4 text-left"
        >
          <div className="flex items-center gap-2 text-[14px] font-semibold">
            <Building2 className="h-4 w-4 text-primary" />
            Dane do faktury
            <span className="text-[11px] font-normal text-muted-foreground">(opcjonalne)</span>
          </div>
          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${showInvoice ? "rotate-180" : ""}`} />
        </button>
        {showInvoice && (
          <div className="px-4 pb-4 space-y-3 border-t border-border/50 pt-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[12px] font-semibold text-muted-foreground block mb-1.5">Firma</label>
                <input type="text" value={form.companyName || ""} onChange={(e) => setField("companyName", e.target.value)} placeholder="Nazwa firmy" className="input-bubble h-11 w-full text-[14px]" />
              </div>
              <div>
                <label className="text-[12px] font-semibold text-muted-foreground block mb-1.5">NIP</label>
                <input type="text" value={form.nip || ""} onChange={(e) => setField("nip", e.target.value)} placeholder="123-456-78-90" className="input-bubble h-11 w-full text-[14px]" />
              </div>
            </div>
            <div>
              <label className="text-[12px] font-semibold text-muted-foreground block mb-1.5">Adres</label>
              <input type="text" value={form.address || ""} onChange={(e) => setField("address", e.target.value)} placeholder="ul. Przykładowa 1" className="input-bubble h-11 w-full text-[14px]" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[12px] font-semibold text-muted-foreground block mb-1.5">Kod pocztowy</label>
                <input type="text" value={form.postalCode || ""} onChange={(e) => setField("postalCode", e.target.value)} placeholder="00-000" className="input-bubble h-11 w-full text-[14px]" />
              </div>
              <div>
                <label className="text-[12px] font-semibold text-muted-foreground block mb-1.5">Miasto</label>
                <input type="text" value={form.city || ""} onChange={(e) => setField("city", e.target.value)} placeholder="Warszawa" className="input-bubble h-11 w-full text-[14px]" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Guest notes */}
      <div className="bg-card rounded-2xl border-2 border-border p-4">
        <label className="flex items-center gap-2 text-[13px] font-semibold mb-2">
          <MessageSquare className="h-4 w-4 text-primary" />
          Uwagi do rezerwacji
          <span className="text-[11px] font-normal text-muted-foreground">(opcjonalne)</span>
        </label>
        <textarea
          value={form.guestNotes || ""}
          onChange={(e) => setField("guestNotes", e.target.value)}
          placeholder="Np. godzina przyjazdu, specjalne życzenia..."
          rows={3}
          maxLength={2000}
          className="input-bubble w-full py-3 resize-none text-[13px]"
        />
      </div>

      {/* Consent */}
      <div className="bg-card rounded-2xl border-2 border-border p-4">
        <button
          type="button"
          onClick={() => { setConsent(!consent); if (fieldErrors.consent) setFieldErrors(prev => { const n = {...prev}; delete n.consent; return n; }); }}
          className="flex items-start gap-3 w-full text-left"
        >
          <span className={`
            relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 mt-0.5
            ${consent ? "bg-primary" : fieldErrors.consent ? "bg-destructive/30" : "bg-muted-foreground/20"}
          `}>
            <span className={`
              inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform
              ${consent ? "translate-x-6" : "translate-x-1"}
            `} />
          </span>
          <span className="text-[12px] text-muted-foreground leading-relaxed">
            Akceptuję <a href="#" className="text-primary underline">regulamin</a> i{" "}
            <a href="#" className="text-primary underline">politykę prywatności</a>.
            Wyrażam zgodę na przetwarzanie moich danych osobowych w celu realizacji rezerwacji.
          </span>
        </button>
        {fieldErrors.consent && (
          <p className="text-[11px] text-destructive mt-2 ml-14">{fieldErrors.consent}</p>
        )}
      </div>

      {/* Summary bar */}
      <div className="bg-card rounded-2xl border-2 border-primary/20 p-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <ShieldCheck className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-[13px] font-semibold">Łącznie: {formatMoney(total)}</p>
            <p className="text-[11px] text-muted-foreground">Zaliczka do wpłaty: {formatMoney(deposit)}</p>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-destructive/10 text-destructive text-[13px] px-4 py-3 rounded-xl text-center font-medium">
          {error}
        </div>
      )}

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="w-full bg-primary hover:bg-primary/90 text-white rounded-2xl text-[15px] font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-70"
        style={{ height: 52 }}
      >
        {submitting ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Rezerwuję...
          </>
        ) : (
          "Rezerwuję"
        )}
      </button>
    </div>
  );
}
