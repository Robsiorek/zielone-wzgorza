"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  CalendarDays, Home, Users, CreditCard, Copy, CheckCircle2,
  Clock, Loader2, AlertCircle, Trees, Phone, Mail,
} from "lucide-react";
import { apiFetch } from "@/lib/api-fetch";
import { formatMoneyMinor } from "@/lib/format";

interface ReservationData {
  number: string;
  status: string;
  paymentStatus: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  adults: number;
  children: number;
  totalMinor: number;
  requiredDepositMinor: number;
  guestNotes: string | null;
  items: { resource: { name: string }; adults: number; children: number }[];
  addons: { snapshotName: string; quantity: number; totalMinor: number }[];
  bookingDetails: { paidAmountMinor: number; balanceDueMinor: number } | null;
}

const statusLabels: Record<string, { label: string; color: string }> = {
  PENDING: { label: "Oczekuje na wpłatę", color: "bg-amber-100 text-amber-800" },
  CONFIRMED: { label: "Potwierdzona", color: "bg-emerald-100 text-emerald-800" },
  CANCELLED: { label: "Anulowana", color: "bg-red-100 text-red-800" },
  FINISHED: { label: "Zrealizowana", color: "bg-slate-100 text-slate-600" },
};

function formatDatePL(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("pl-PL", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}

function fmtMoney(minor: number): string {
  return formatMoneyMinor(minor);
}

function copyToClipboard(text: string) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text);
  } else {
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
  }
}

export default function ReservationTokenPage() {
  const params = useParams();
  const token = params.token as string;
  const [data, setData] = useState<ReservationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await apiFetch(`/api/public/reservation/${token}`);
        setData(res.reservation);
      } catch (e: any) {
        setError(e.message || "Nie udało się załadować rezerwacji");
      }
      setLoading(false);
    }
    if (token) load();
  }, [token]);

  function handleCopy(label: string, value: string) {
    copyToClipboard(value);
    setCopied(label);
    setTimeout(() => setCopied(""), 2000);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 text-primary animate-spin mx-auto" />
          <p className="text-[14px] text-muted-foreground">Ładowanie rezerwacji...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 flex items-center justify-center px-4">
        <div className="text-center space-y-4 max-w-sm">
          <div className="h-12 w-12 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto">
            <AlertCircle className="h-6 w-6 text-destructive" />
          </div>
          <h1 className="text-xl font-bold">Rezerwacja nie znaleziona</h1>
          <p className="text-[13px] text-muted-foreground">{error || "Sprawdź, czy link jest poprawny."}</p>
        </div>
      </div>
    );
  }

  const st = statusLabels[data.status] || statusLabels.PENDING;
  const isPending = data.status === "PENDING";
  const paidMinor = data.bookingDetails?.paidAmountMinor || 0;
  const balanceMinor = data.bookingDetails?.balanceDueMinor || data.totalMinor;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-border/50">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center">
            <Trees className="h-4 w-4 text-primary" />
          </div>
          <span className="text-[14px] font-bold tracking-tight">Zielone Wzgórza</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 sm:py-8 space-y-5">
        {/* Title + status */}
        <div className="text-center space-y-2">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Twoja rezerwacja</p>
          <h1 className="text-2xl font-bold tracking-wide text-primary">{data.number}</h1>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-[12px] font-semibold ${st.color}`}>
            {st.label}
          </span>
        </div>

        {/* Stay details */}
        <div className="bg-card rounded-2xl border-2 border-border overflow-hidden">
          <div className="p-4 space-y-3">
            <div className="flex items-center gap-2 text-[14px] font-semibold">
              <CalendarDays className="h-4 w-4 text-primary" />
              Termin pobytu
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[11px] text-muted-foreground">Przyjazd</p>
                <p className="text-[13px] font-medium">{formatDatePL(data.checkIn)}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">Wyjazd</p>
                <p className="text-[13px] font-medium">{formatDatePL(data.checkOut)}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-[12px] text-muted-foreground">
              <span className="inline-flex items-center gap-1 bg-primary/10 text-primary px-2.5 py-0.5 rounded-full font-semibold">
                {data.nights} {data.nights === 1 ? "noc" : data.nights < 5 ? "noce" : "nocy"}
              </span>
              <span className="inline-flex items-center gap-1">
                <Users className="h-3 w-3" />
                {data.adults} dor.{data.children > 0 ? ` + ${data.children} dz.` : ""}
              </span>
            </div>
          </div>

          {/* Resources */}
          <div className="border-t border-border/50 p-4 space-y-2">
            <div className="flex items-center gap-2 text-[14px] font-semibold">
              <Home className="h-4 w-4 text-primary" />
              Zakwaterowanie
            </div>
            {data.items.map((item, idx) => (
              <div key={idx} className="text-[13px] flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                {item.resource.name}
              </div>
            ))}
          </div>

          {/* Addons */}
          {data.addons.length > 0 && (
            <div className="border-t border-border/50 p-4 space-y-2">
              <p className="text-[12px] font-semibold text-muted-foreground">Dodatki</p>
              {data.addons.map((a, i) => (
                <div key={i} className="text-[13px] flex items-center justify-between">
                  <span>{a.snapshotName} &times; {a.quantity}</span>
                  <span className="font-medium">{fmtMoney(a.totalMinor)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Financial summary */}
        <div className="bg-card rounded-2xl border-2 border-border overflow-hidden">
          <div className="p-4">
            <div className="flex items-center gap-2 text-[14px] font-semibold mb-3">
              <CreditCard className="h-4 w-4 text-primary" />
              Rozliczenia
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-[13px]">
                <span className="text-muted-foreground">Kwota rezerwacji</span>
                <span className="font-semibold">{fmtMoney(data.totalMinor)}</span>
              </div>
              <div className="flex justify-between text-[13px]">
                <span className="text-muted-foreground">Wpłacono</span>
                <span className="font-semibold text-emerald-600">{fmtMoney(paidMinor)}</span>
              </div>
              <div className="flex justify-between text-[14px] font-bold pt-1 border-t border-border/50">
                <span>Pozostało do zapłaty</span>
                <span>{fmtMoney(balanceMinor)}</span>
              </div>
            </div>
          </div>

          {/* Bank transfer info — only if pending */}
          {isPending && balanceMinor > 0 && (
            <div className="border-t border-border/50 p-4 space-y-3">
              <p className="text-[12px] font-semibold text-muted-foreground">Dane do przelewu</p>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
                <p className="text-[11px] text-muted-foreground">Wymagana zaliczka</p>
                <p className="text-xl font-bold">{fmtMoney(data.requiredDepositMinor)}</p>
              </div>
              {[
                { label: "Odbiorca", value: "Zielone Wzgórza" },
                { label: "Nr konta", value: "XX XXXX XXXX XXXX XXXX XXXX XXXX" },
                { label: "Tytuł", value: `Rezerwacja ${data.number}` },
              ].map(row => (
                <div key={row.label} className="flex items-center justify-between bg-muted/30 rounded-xl px-3 py-2.5">
                  <div>
                    <p className="text-[10px] text-muted-foreground">{row.label}</p>
                    <p className="text-[13px] font-medium">{row.value}</p>
                  </div>
                  <button
                    onClick={() => handleCopy(row.label, row.value)}
                    className="h-8 w-8 rounded-lg hover:bg-muted flex items-center justify-center transition-colors"
                  >
                    {copied === row.label ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Contact */}
        <div className="bg-card rounded-2xl border-2 border-border p-4 text-center space-y-2">
          <p className="text-[13px] font-semibold">Masz pytania?</p>
          <p className="text-[12px] text-muted-foreground">Skontaktuj się z nami:</p>
          <div className="flex items-center justify-center gap-4">
            <a href="tel:+48000000000" className="inline-flex items-center gap-1.5 text-[13px] text-primary hover:underline">
              <Phone className="h-3.5 w-3.5" />
              Zadzwoń
            </a>
            <a href="mailto:kontakt@zielonewzgorza.eu" className="inline-flex items-center gap-1.5 text-[13px] text-primary hover:underline">
              <Mail className="h-3.5 w-3.5" />
              Napisz
            </a>
          </div>
        </div>
      </main>

      <footer className="border-t border-border/50 py-4">
        <p className="text-center text-[11px] text-muted-foreground">
          Zielone Wzgórza &copy; {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
}
