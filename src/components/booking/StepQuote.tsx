"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Receipt, Tag, Clock, Loader2, AlertCircle, TicketPercent, X } from "lucide-react";
import { apiFetch } from "@/lib/api-fetch";
import { QuoteSkeleton } from "./BookingSkeleton";
import type { BookingDates, SelectedResource, SelectedAddon, QuoteData } from "./BookingWidget";

interface Props {
  dates: BookingDates;
  resources: SelectedResource[];
  addons: SelectedAddon[];
  onQuoteReady: (quote: QuoteData) => void;
  onBack: () => void;
}

function formatMoney(minor: number): string {
  const val = minor / 100;
  return val % 1 === 0 ? `${val} zł` : `${val.toFixed(2).replace(".", ",")} zł`;
}

function formatTimeRemaining(ms: number): string {
  if (ms <= 0) return "0:00";
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function StepQuote({ dates, resources, addons, onQuoteReady, onBack }: Props) {
  const [loading, setLoading] = useState(true);
  const [quote, setQuote] = useState<QuoteData | null>(null);
  const [quoteResult, setQuoteResult] = useState<any>(null);
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoLoading, setPromoLoading] = useState(false);
  const [error, setError] = useState("");
  const [timeRemaining, setTimeRemaining] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  const fetchQuote = useCallback(async (promo?: string) => {
    setLoading(true);
    setError("");
    try {
      const body: any = {
        checkIn: dates.checkIn,
        checkOut: dates.checkOut,
        items: resources.map(r => ({
          variantId: r.variantId,
          adults: dates.adults,
          children: dates.children,
        })),
      };
      if (addons.length > 0) {
        body.addons = addons.map(a => ({ addonId: a.addonId, quantity: a.quantity }));
      }
      if (promo) {
        body.promoCode = promo;
      }

      const data = await apiFetch("/api/public/quote", { method: "POST", body });

      if (!data.quoteId) {
        // Quote had errors
        const errors = data.result?.errors || [];
        setError(errors.join(". ") || "Nie udało się wygenerować wyceny");
        setLoading(false);
        return;
      }

      const qd: QuoteData = {
        quoteId: data.quoteId,
        quoteSecret: data.quoteSecret,
        expiresAt: data.expiresAt,
        result: data.result,
      };
      setQuote(qd);
      setQuoteResult(data.result);

      // Start timer
      const expiresAt = new Date(data.expiresAt).getTime();
      setTimeRemaining(expiresAt - Date.now());

      if (promo && data.result.discount) {
        setPromoApplied(true);
      }
    } catch (e: any) {
      setError(e.message || "Nie udało się wygenerować wyceny");
    }
    setLoading(false);
  }, [dates, resources, addons]);

  useEffect(() => {
    fetchQuote();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [fetchQuote]);

  // Timer countdown
  useEffect(() => {
    if (timeRemaining <= 0) return;
    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        const next = prev - 1000;
        if (next <= 0) {
          clearInterval(timerRef.current);
          return 0;
        }
        return next;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [timeRemaining > 0]);

  async function handlePromoApply() {
    if (!promoCode.trim()) return;
    setPromoLoading(true);
    await fetchQuote(promoCode.trim());
    setPromoLoading(false);
  }

  function handlePromoRemove() {
    setPromoCode("");
    setPromoApplied(false);
    fetchQuote();
  }

  function handleNext() {
    if (!quote) return;
    if (timeRemaining <= 0) {
      setError("Wycena wygasła. Wygeneruj nową.");
      return;
    }
    onQuoteReady(quote);
  }

  const expired = timeRemaining <= 0 && !loading;
  const nightCount = quoteResult?.nights || 0;

  if (loading) {
    return <QuoteSkeleton />;
  }

  if (error && !quoteResult) {
    return (
      <div className="text-center space-y-4 pt-8">
        <div className="h-12 w-12 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto">
          <AlertCircle className="h-6 w-6 text-destructive" />
        </div>
        <h2 className="text-xl font-bold">Nie udało się wycenić</h2>
        <p className="text-[13px] text-muted-foreground max-w-sm mx-auto">{error}</p>
        <div className="flex gap-3 justify-center">
          <button onClick={() => fetchQuote()} className="btn-bubble btn-primary-bubble px-5 py-2.5 text-[13px]">
            Spróbuj ponownie
          </button>
          <button onClick={onBack} className="btn-bubble btn-secondary-bubble px-5 py-2.5 text-[13px]">
            Wróć
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header with timer */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Wycena pobytu</h2>
          <p className="text-[13px] text-muted-foreground">{nightCount} {nightCount === 1 ? "noc" : nightCount < 5 ? "noce" : "nocy"}</p>
        </div>
        {!expired && (
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold ${
            timeRemaining < 300000 ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"
          }`}>
            <Clock className="h-3.5 w-3.5" />
            {formatTimeRemaining(timeRemaining)}
          </div>
        )}
        {expired && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold bg-destructive/10 text-destructive">
            Wygasła
          </div>
        )}
      </div>

      {/* Price breakdown per resource */}
      <div className="bg-card rounded-2xl border-2 border-border overflow-hidden">
        {quoteResult?.items?.map((item: any, idx: number) => (
          <div key={item.variantId} className={idx > 0 ? "border-t border-border/50" : ""}>
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-[13px] font-semibold">{item.resourceName}</h3>
                <span className="text-[14px] font-bold">{formatMoney(item.totalMinor)}</span>
              </div>
              {/* Night breakdown */}
              <div className="space-y-1">
                {item.priceBreakdown?.slice(0, 3).map((night: any) => (
                  <div key={night.date} className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>
                      {new Date(night.date).toLocaleDateString("pl-PL", { weekday: "short", day: "numeric", month: "short" })}
                      {night.seasonName && (
                        <span className="ml-1.5 text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                          {night.seasonName}
                        </span>
                      )}
                    </span>
                    <span>{formatMoney(night.priceMinor)}</span>
                  </div>
                ))}
                {item.priceBreakdown?.length > 3 && (
                  <p className="text-[10px] text-muted-foreground/60">
                    + {item.priceBreakdown.length - 3} {item.priceBreakdown.length - 3 === 1 ? "noc" : "nocy"} więcej
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Addons */}
        {quoteResult?.addons?.length > 0 && (
          <div className="border-t border-border/50 p-4">
            <p className="text-[11px] font-semibold text-muted-foreground mb-2">Dodatki</p>
            {quoteResult.addons.map((addon: any) => (
              <div key={addon.addonId} className="flex items-center justify-between text-[12px]">
                <span>{addon.name} &times; {addon.quantity}</span>
                <span className="font-medium">{formatMoney(addon.totalMinor)}</span>
              </div>
            ))}
          </div>
        )}

        {/* Summary */}
        <div className="border-t-2 border-border bg-muted/30 p-4 space-y-2">
          <div className="flex items-center justify-between text-[13px]">
            <span className="text-muted-foreground">Suma</span>
            <span>{formatMoney(quoteResult?.subtotalMinor || 0)}</span>
          </div>
          {quoteResult?.discount && (
            <div className="flex items-center justify-between text-[13px] text-primary">
              <span className="flex items-center gap-1">
                <Tag className="h-3 w-3" />
                Rabat ({quoteResult.discount.code})
              </span>
              <span>-{formatMoney(quoteResult.discount.amountMinor)}</span>
            </div>
          )}
          <div className="flex items-center justify-between text-[16px] font-bold pt-1">
            <span>Do zapłaty</span>
            <span>{formatMoney(quoteResult?.totalMinor || 0)}</span>
          </div>
          <div className="flex items-center justify-between text-[12px] text-muted-foreground">
            <span>Wymagana zaliczka ({quoteResult?.depositPercent || 30}%)</span>
            <span className="font-semibold text-foreground">{formatMoney(quoteResult?.depositMinor || 0)}</span>
          </div>
        </div>
      </div>

      {/* Promo code */}
      <div className="bg-card rounded-2xl border-2 border-border p-4">
        <div className="flex items-center gap-2 text-[13px] font-semibold mb-3">
          <TicketPercent className="h-4 w-4 text-primary" />
          Kod rabatowy
        </div>
        {promoApplied ? (
          <div className="flex items-center justify-between bg-primary/5 border border-primary/20 rounded-xl px-3 py-2">
            <span className="text-[13px] font-medium text-primary">{promoCode.toUpperCase()}</span>
            <button onClick={handlePromoRemove} className="h-6 w-6 rounded-lg hover:bg-primary/10 flex items-center justify-center">
              <X className="h-3.5 w-3.5 text-primary" />
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              type="text"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
              placeholder="Wpisz kod..."
              className="input-bubble h-10 flex-1 text-[13px] uppercase"
              maxLength={30}
            />
            <button
              onClick={handlePromoApply}
              disabled={!promoCode.trim() || promoLoading}
              className="btn-bubble btn-secondary-bubble px-4 h-10 text-[12px] disabled:opacity-40"
            >
              {promoLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Zastosuj"}
            </button>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-destructive/10 text-destructive text-[13px] px-4 py-3 rounded-xl text-center font-medium">
          {error}
        </div>
      )}

      {/* Actions */}
      {!expired ? (
        <button
          onClick={handleNext}
          disabled={!quote}
          className="w-full bg-primary hover:bg-primary/90 text-white rounded-2xl text-[15px] font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
          style={{ height: 52 }}
        >
          Dalej — dane kontaktowe
        </button>
      ) : (
        <button
          onClick={() => fetchQuote(promoApplied ? promoCode : undefined)}
          className="w-full bg-primary hover:bg-primary/90 text-white rounded-2xl text-[15px] font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          style={{ height: 52 }}
        >
          Wygeneruj nową wycenę
        </button>
      )}
    </div>
  );
}
