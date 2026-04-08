"use client";

import React, { useEffect, useState } from "react";
import {
  Calendar, Users, Home, Check, Loader2, Lock,
  Clock, AlertTriangle, XCircle, CheckCircle2, ChevronRight,
} from "lucide-react";
import { apiFetch } from "@/lib/api-fetch";
import { formatMoneyMinor } from "@/lib/format";

interface OfferResource {
  name: string; unitNumber: string | null; category: string;
  capacity: number; pricePerNight: number; nights: number; subtotal: number;
  pricePerUnitMinor?: number; totalPriceMinor?: number;
}
interface OfferAddon {
  name: string; quantity: number; unitPrice: number; total: number;
  unitPriceMinor?: number; totalMinor?: number;
}
interface OfferData {
  offerNumber: string; status: string;
  checkIn: string; checkOut: string; nights: number;
  subtotal: number; discount: number; total: number; currency: string;
  subtotalMinor?: number; discountMinor?: number; totalMinor?: number;
  expiresAt: string | null; note: string | null;
  client: { firstName: string | null; lastName: string | null; companyName: string | null; type: string };
  resources: OfferResource[]; addons: OfferAddon[];
}

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString("pl-PL", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}
function formatMoney(v: number): string {
  return formatMoneyMinor(v);
}
function clientName(c: OfferData["client"]): string {
  if (c.type === "COMPANY") return c.companyName || "";
  return [c.firstName, c.lastName].filter(Boolean).join(" ");
}
function daysUntil(d: string | null): number | null {
  if (!d) return null;
  return Math.ceil((new Date(d).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

export function OfferPublicView({ token }: { token: string }) {
  const [offer, setOffer] = useState<OfferData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requiresPin, setRequiresPin] = useState(false);
  const [pinVerified, setPinVerified] = useState(false);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [pinLoading, setPinLoading] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [bookingNumber, setBookingNumber] = useState("");
  const [acceptError, setAcceptError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await apiFetch(`/api/public/offers/${token}`);
        setOffer(data.offer);
        setRequiresPin(data.requiresPin);
        setPinVerified(data.pinVerified);
        if (data.offer.status === "ACCEPTED") setAccepted(true);
      } catch (e: any) {
        setError(e.message);
      }
      setLoading(false);
    })();
  }, [token]);

  const handleVerifyPin = async () => {
    if (!pin.trim()) return;
    setPinLoading(true);
    setPinError("");
    try {
      await apiFetch(`/api/public/offers/${token}/verify-pin`, {
        method: "POST",
        body: { pin },
      });
      setPinVerified(true);
    } catch (e: any) {
      setPinError(e.message);
    }
    setPinLoading(false);
  };

  const handleAccept = async () => {
    setAccepting(true);
    setAcceptError(null);
    try {
      const data = await apiFetch(`/api/public/offers/${token}/accept`, {
        method: "POST",
        body: { pinVerified },
      });
      setAccepted(true);
      setBookingNumber(data.bookingNumber);
    } catch (e: any) {
      setAcceptError(e.message);
      try {
        const data = await apiFetch(`/api/public/offers/${token}`);
        if (data.offer) setOffer(data.offer);
      } catch {}
    }
    setAccepting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: "hsl(214, 89%, 52%)" }} />
      </div>
    );
  }

  if (error || !offer) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <div className="h-16 w-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: "hsl(0, 72%, 51%, 0.1)" }}>
            <XCircle className="h-8 w-8" style={{ color: "hsl(0, 72%, 51%)" }} />
          </div>
          <h1 className="text-xl font-bold mb-2">Oferta nie znaleziona</h1>
          <p className="text-muted-foreground text-[14px]">{error || "Link jest nieprawid\u0142owy lub oferta zosta\u0142a usuni\u0119ta."}</p>
        </div>
      </div>
    );
  }

  if (requiresPin && !pinVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="h-16 w-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: "hsl(214, 89%, 52%, 0.1)" }}>
              <Lock className="h-8 w-8" style={{ color: "hsl(214, 89%, 52%)" }} />
            </div>
            <h1 className="text-xl font-bold">Oferta {offer.offerNumber}</h1>
            <p className="text-muted-foreground text-[14px] mt-1">{"Wprowad\u017a PIN, aby zobaczy\u0107 ofert\u0119."}</p>
          </div>
          <div className="space-y-3">
            <input
              type="password" value={pin}
              onChange={e => setPin(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleVerifyPin()}
              placeholder="Wpisz PIN..."
              className="w-full h-12 px-4 text-center text-lg tracking-widest font-mono rounded-2xl bg-card outline-none transition-all"
              style={{ border: "2px solid hsl(var(--border))", fontSize: 20 }}
              autoFocus
            />
            {pinError && <p className="text-[13px] text-center" style={{ color: "hsl(0, 72%, 51%)" }}>{pinError}</p>}
            <button onClick={handleVerifyPin} disabled={pinLoading || !pin.trim()}
              className="w-full h-12 rounded-2xl font-semibold text-white text-[14px] transition-all disabled:opacity-40"
              style={{ background: "hsl(214, 89%, 52%)" }}>
              {pinLoading ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : "Dalej"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (offer.status === "EXPIRED") {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <div className="h-16 w-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: "hsl(38, 90%, 50%, 0.1)" }}>
            <AlertTriangle className="h-8 w-8" style={{ color: "hsl(38, 90%, 50%)" }} />
          </div>
          <h1 className="text-xl font-bold mb-2">{"Oferta wygas\u0142a"}</h1>
          <p className="text-muted-foreground text-[14px]">{"Oferta "}{offer.offerNumber}{" nie jest ju\u017c aktualna. Skontaktuj si\u0119 z nami, aby uzyska\u0107 now\u0105 ofert\u0119."}</p>
        </div>
      </div>
    );
  }

  if (offer.status === "CANCELLED") {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <div className="h-16 w-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: "hsl(0, 72%, 51%, 0.1)" }}>
            <XCircle className="h-8 w-8" style={{ color: "hsl(0, 72%, 51%)" }} />
          </div>
          <h1 className="text-xl font-bold mb-2">Oferta anulowana</h1>
          <p className="text-muted-foreground text-[14px]">{"Oferta "}{offer.offerNumber}{" zosta\u0142a anulowana."}</p>
        </div>
      </div>
    );
  }

  if (accepted || offer.status === "ACCEPTED") {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="w-full max-w-lg">
          <div className="text-center mb-8">
            <div className="h-20 w-20 rounded-full mx-auto mb-5 flex items-center justify-center" style={{ background: "hsl(152, 60%, 50%, 0.12)" }}>
              <CheckCircle2 className="h-10 w-10" style={{ color: "hsl(152, 60%, 50%)" }} />
            </div>
            <h1 className="text-2xl font-bold mb-2">Rezerwacja potwierdzona</h1>
            {bookingNumber && <p className="text-muted-foreground text-[14px]">{"Numer rezerwacji: "}<span className="font-bold text-foreground">{bookingNumber}</span></p>}
          </div>

          <div className="rounded-2xl bg-card p-6 space-y-4" style={{ border: "2px solid hsl(var(--border))" }}>
            <div className="flex items-center gap-3 text-[14px]">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <span>{formatDate(offer.checkIn)}</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
              <span>{formatDate(offer.checkOut)}</span>
            </div>
            <div className="text-[13px] text-muted-foreground pl-8">{offer.nights} {offer.nights === 1 ? "noc" : offer.nights < 5 ? "noce" : "nocy"}</div>

            <div className="border-t pt-4 space-y-2" style={{ borderColor: "hsl(var(--border))" }}>
              {(offer as any).items || offer.resources || [].map((r: any, i: number) => (
                <div key={i} className="flex items-center justify-between text-[14px]">
                  <div className="flex items-center gap-2">
                    <Home className="h-4 w-4 text-muted-foreground" />
                    {r.unitNumber && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md tracking-wide" style={{ background: "hsl(214, 89%, 52%, 0.1)", color: "hsl(214, 89%, 52%)" }}>{"NR.\u00a0"}{r.unitNumber}</span>}
                    <span>{r.name}</span>
                  </div>
                  <span className="font-semibold">{formatMoney(r.totalPriceMinor ?? Math.round(r.subtotal * 100))}</span>
                </div>
              ))}
            </div>

            <div className="border-t pt-4 flex justify-between text-[16px] font-bold" style={{ borderColor: "hsl(var(--border))" }}>
              <span>Razem</span>
              <span style={{ color: "hsl(214, 89%, 52%)" }}>{formatMoney(offer.totalMinor ?? Math.round(offer.total * 100))}</span>
            </div>
          </div>

          <p className="text-center text-muted-foreground text-[13px] mt-6">
            {"Dzi\u0119kujemy! Wkr\u00f3tce otrzymasz potwierdzenie na e-mail."}
          </p>
        </div>
      </div>
    );
  }

  if (offer.status === "DRAFT") {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <div className="h-16 w-16 rounded-2xl mx-auto mb-4 flex items-center justify-center bg-muted">
            <Clock className="h-8 w-8 text-muted-foreground" />
          </div>
          <h1 className="text-xl font-bold mb-2">Oferta w przygotowaniu</h1>
          <p className="text-muted-foreground text-[14px]">{"Ta oferta nie jest jeszcze gotowa. Skontaktuj si\u0119 z nami po wi\u0119cej informacji."}</p>
        </div>
      </div>
    );
  }

  // ── OPEN — main offer view ──
  const expiryDays = daysUntil(offer.expiresAt);

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto">

        <div className="text-center mb-8">
          <p className="text-[12px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Oferta</p>
          <h1 className="text-2xl sm:text-3xl font-bold">{offer.offerNumber}</h1>
          {clientName(offer.client) && (
            <p className="text-muted-foreground text-[15px] mt-2">{"Przygotowana dla: "}<span className="font-semibold text-foreground">{clientName(offer.client)}</span></p>
          )}
        </div>

        {expiryDays !== null && expiryDays <= 3 && expiryDays >= 0 && (
          <div className="rounded-2xl px-5 py-4 mb-6 flex items-center gap-3" style={{ background: "hsl(38, 90%, 50%, 0.08)", border: "1px solid hsl(38, 90%, 50%, 0.2)" }}>
            <AlertTriangle className="h-5 w-5 shrink-0" style={{ color: "hsl(38, 90%, 50%)" }} />
            <span className="text-[13px] font-medium">
              {expiryDays === 0 ? "Oferta wygasa dzisiaj!" : `Oferta wygasa za ${expiryDays} ${expiryDays === 1 ? "dzie\u0144" : "dni"}.`}
            </span>
          </div>
        )}

        <div className="rounded-2xl bg-card overflow-hidden" style={{ border: "2px solid hsl(var(--border))" }}>

          <div className="px-6 py-5" style={{ borderBottom: "1px solid hsl(var(--border))" }}>
            <div className="flex items-center gap-2 text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-3">
              <Calendar className="h-4 w-4" /> Termin pobytu
            </div>
            <div className="flex items-center gap-3 text-[15px] font-medium">
              <span>{formatDate(offer.checkIn)}</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
              <span>{formatDate(offer.checkOut)}</span>
            </div>
            <div className="mt-1 text-[13px] text-muted-foreground">{offer.nights} {offer.nights === 1 ? "noc" : offer.nights < 5 ? "noce" : "nocy"}</div>
          </div>

          <div className="px-6 py-5" style={{ borderBottom: "1px solid hsl(var(--border))" }}>
            <div className="flex items-center gap-2 text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-3">
              <Home className="h-4 w-4" /> Zakwaterowanie
            </div>
            <div className="space-y-3">
              {(offer as any).items || offer.resources || [].map((r: any, i: number) => (
                <div key={i} className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-[14px] font-medium">
                      {r.unitNumber && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md tracking-wide" style={{ background: "hsl(214, 89%, 52%, 0.1)", color: "hsl(214, 89%, 52%)" }}>{"NR.\u00a0"}{r.unitNumber}</span>}
                      {r.name}
                    </div>
                    <div className="text-[12px] text-muted-foreground mt-0.5">
                      {r.capacity} os. • {formatMoney(r.pricePerUnitMinor ?? Math.round(r.pricePerNight * 100))}/noc × {r.nights} nocy
                    </div>
                  </div>
                  <span className="text-[14px] font-bold">{formatMoney(r.totalPriceMinor ?? Math.round(r.subtotal * 100))}</span>
                </div>
              ))}
            </div>
          </div>

          {offer.addons.length > 0 && (
            <div className="px-6 py-5" style={{ borderBottom: "1px solid hsl(var(--border))" }}>
              <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-3">Dodatki</div>
              {offer.addons.map((a, i) => (
                <div key={i} className="flex items-center justify-between text-[14px] py-1">
                  <span>{a.name} ×{a.quantity}</span>
                  <span className="font-medium">{formatMoney(a.totalMinor ?? Math.round(a.total * 100))}</span>
                </div>
              ))}
            </div>
          )}

          <div className="px-6 py-5">
            {(offer.discountMinor ?? offer.discount * 100) > 0 && (
              <div className="flex justify-between text-[13px] text-muted-foreground mb-1">
                <span>Rabat</span>
                <span>-{formatMoney(offer.discountMinor ?? Math.round(offer.discount * 100))}</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-[16px] font-bold">{"Do zap\u0142aty"}</span>
              <span className="text-[24px] font-bold" style={{ color: "hsl(214, 89%, 52%)" }}>{formatMoney(offer.totalMinor ?? Math.round(offer.total * 100))}</span>
            </div>
          </div>
        </div>

        <div className="mt-8">
          {acceptError && (
            <div className="rounded-2xl px-5 py-4 mb-4 text-[13px] font-medium" style={{ background: "hsl(0, 72%, 51%, 0.08)", color: "hsl(0, 72%, 51%)", border: "1px solid hsl(0, 72%, 51%, 0.2)" }}>
              {acceptError}
            </div>
          )}
          <button onClick={handleAccept} disabled={accepting}
            className="w-full h-14 rounded-2xl text-white text-[16px] font-bold transition-all disabled:opacity-60"
            style={{ background: "hsl(152, 60%, 40%)" }}>
            {accepting
              ? <Loader2 className="h-6 w-6 animate-spin mx-auto" />
              : <span className="flex items-center justify-center gap-2"><Check className="h-5 w-5" /> {"Akceptuj\u0119 ofert\u0119"}</span>
            }
          </button>
          <p className="text-center text-muted-foreground text-[12px] mt-3">
            {"Klikaj\u0105c \u201eAkceptuj\u0119 ofert\u0119\u201d potwierdzasz rezerwacj\u0119 na powy\u017cszych warunkach."}
          </p>
        </div>

        <div className="text-center text-muted-foreground/50 text-[11px] mt-12">
          {"Zielone Wzg\u00f3rza \u2022 O\u015brodek wypoczynkowy"}
        </div>
      </div>
    </div>
  );
}
