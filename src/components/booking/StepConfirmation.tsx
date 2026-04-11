"use client";

import React from "react";
import { CheckCircle2, Copy, CalendarDays, Home, CreditCard, ExternalLink } from "lucide-react";
import type { BookingDates, SelectedResource, ClientData, BookingResult } from "./BookingWidget";
import { Tooltip } from "@/components/ui/tooltip";

interface Props {
  result: BookingResult;
  dates: BookingDates;
  resources: SelectedResource[];
  clientData: ClientData;
}

function formatMoney(minor: number): string {
  const val = minor / 100;
  return val % 1 === 0 ? `${val} zł` : `${val.toFixed(2).replace(".", ",")} zł`;
}

function formatDatePL(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("pl-PL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
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

export function StepConfirmation({ result, dates, resources, clientData }: Props) {
  const [copied, setCopied] = React.useState("");

  function handleCopy(label: string, value: string) {
    copyToClipboard(value);
    setCopied(label);
    setTimeout(() => setCopied(""), 2000);
  }

  return (
    <div className="space-y-6">
      {/* Success hero */}
      <div className="text-center space-y-3 pt-4">
        <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
          <CheckCircle2 className="h-8 w-8 text-emerald-600" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Rezerwacja złożona!</h1>
        <p className="text-[14px] text-muted-foreground max-w-sm mx-auto">
          Twoja rezerwacja została przyjęta. Na adres <strong className="text-foreground">{clientData.email}</strong> wyślemy potwierdzenie.
        </p>
      </div>

      {/* Reservation number */}
      <div className="bg-card rounded-2xl border-2 border-primary/20 p-5 text-center">
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Numer rezerwacji</p>
        <p className="text-2xl font-bold tracking-wide text-primary">{result.reservationNumber}</p>
        <p className="text-[12px] text-muted-foreground mt-2">
          Status: <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-semibold">Oczekuje na wpłatę</span>
        </p>
      </div>

      {/* Reservation summary */}
      <div className="bg-card rounded-2xl border-2 border-border overflow-hidden">
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-2 text-[14px] font-semibold">
            <CalendarDays className="h-4 w-4 text-primary" />
            Szczegóły pobytu
          </div>
          <div className="grid grid-cols-2 gap-2 text-[13px]">
            <div>
              <p className="text-[11px] text-muted-foreground">Przyjazd</p>
              <p className="font-medium">{formatDatePL(dates.checkIn)}</p>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">Wyjazd</p>
              <p className="font-medium">{formatDatePL(dates.checkOut)}</p>
            </div>
          </div>
        </div>
        <div className="border-t border-border/50 p-4 space-y-2">
          <div className="flex items-center gap-2 text-[14px] font-semibold">
            <Home className="h-4 w-4 text-primary" />
            Zakwaterowanie
          </div>
          {resources.map(r => (
            <div key={r.variantId} className="text-[13px] flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              {r.resourceName}
            </div>
          ))}
        </div>
      </div>

      {/* Payment info */}
      <div className="bg-card rounded-2xl border-2 border-border overflow-hidden">
        <div className="p-4">
          <div className="flex items-center gap-2 text-[14px] font-semibold mb-3">
            <CreditCard className="h-4 w-4 text-primary" />
            Wpłata zaliczki
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
            <p className="text-[13px]">
              Aby potwierdzić rezerwację, wpłać zaliczkę w wysokości:
            </p>
            <p className="text-2xl font-bold text-center">{formatMoney(result.depositMinor)}</p>
            <p className="text-[11px] text-muted-foreground text-center">
              z łącznej kwoty {formatMoney(result.totalMinor)}
            </p>
          </div>
        </div>

        {/* Bank transfer details */}
        <div className="border-t border-border/50 p-4 space-y-3">
          <p className="text-[12px] font-semibold text-muted-foreground">Dane do przelewu</p>

          <div className="space-y-2">
            {[
              { label: "Odbiorca", value: "Zielone Wzgórza" },
              { label: "Nr konta", value: "XX XXXX XXXX XXXX XXXX XXXX XXXX" },
              { label: "Tytuł przelewu", value: `Rezerwacja ${result.reservationNumber}` },
              { label: "Kwota", value: formatMoney(result.depositMinor) },
            ].map(row => (
              <div key={row.label} className="flex items-center justify-between bg-muted/30 rounded-xl px-3 py-2.5">
                <div>
                  <p className="text-[10px] text-muted-foreground">{row.label}</p>
                  <p className="text-[13px] font-medium">{row.value}</p>
                </div>
                <Tooltip content="Kopiuj">
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
                </Tooltip>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Link to reservation page */}
      {result.token && (
        <a
          href={`/reservation/${result.token}`}
          className="w-full bg-card border-2 border-border hover:border-primary/40 rounded-2xl text-[14px] font-semibold flex items-center justify-center gap-2 transition-all"
          style={{ height: 52 }}
        >
          <ExternalLink className="h-4 w-4" />
          Strona Twojej rezerwacji
        </a>
      )}

      {/* New booking */}
      <div className="text-center">
        <a
          href="/booking"
          className="text-[13px] text-primary hover:underline"
        >
          Złóż kolejną rezerwację
        </a>
      </div>
    </div>
  );
}
