"use client";

import React, { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Send, CheckCircle2, XCircle, AlertTriangle, Clock,
  Calendar, Users, Home, FileText, Loader2, Copy, ExternalLink,
  Building2, User as UserIcon, Trash2, RotateCcw, Eye,
  MessageSquare, CreditCard, Package,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api-fetch";
import { parseLocalDate } from "@/lib/dates";
import { formatMoneyMinor } from "@/lib/format";
import { useToast } from "@/components/ui/toast";
import { getEngineUrl } from "@/lib/urls";
import { UnitBadge } from "@/components/ui/unit-badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

/* ─── Types ─── */

interface OfferData {
  id: string;
  offerNumber: string;
  status: string;
  paymentStatus: string;
  fulfillmentStatus: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  subtotal: number;
  discount: number;
  taxTotal: number;
  total: number;
  subtotalMinor?: number;
  discountMinor?: number;
  totalMinor?: number;
  currency: string;
  token: string;
  pin: string | null;
  source: string;
  note: string | null;
  expiresAt: string | null;
  expiryAction: string;
  cancelReason: string | null;
  cancelledBy: string | null;
  cancelledAt: string | null;
  sentAt: string | null;
  viewedAt: string | null;
  acceptedAt: string | null;
  expiredAt: string | null;
  convertedBookingId: string | null;
  createdAt: string;
  updatedAt: string;
  client: {
    id: string; clientNumber: string; type: string;
    firstName: string | null; lastName: string | null;
    companyName: string | null; email: string | null; phone: string | null;
  };
  items: {
    id: string; capacity: number; pricePerNight: number; pricePerStay: number | null; pricePerUnitMinor?: number; totalPriceMinor?: number;
    nights: number; subtotal: number;
    resource: { id: string; name: string; unitNumber: string | null; maxCapacity: number | null; category: { name: string; slug: string } };
  }[];
  offerAddons: {
    id: string; quantity: number; unitPrice: number; total: number; unitPriceMinor?: number; totalMinor?: number;
    addon: { id: string; name: string; pricingType: string };
  }[];
  activities: {
    id: string; action: string; description: string | null; changedBy: string | null; createdAt: string;
  }[];
  _count: { versions: number };
}

/* ─── Config ─── */

const statusCfg: Record<string, { label: string; cls: string; icon: React.ElementType; bg: string }> = {
  DRAFT: { label: "Szkic", cls: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300", icon: FileText, bg: "bg-gray-500" },
  OPEN: { label: "Wysłana", cls: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400", icon: Send, bg: "bg-blue-500" },
  ACCEPTED: { label: "Zaakceptowana", cls: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400", icon: CheckCircle2, bg: "bg-green-500" },
  EXPIRED: { label: "Wygasła", cls: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400", icon: AlertTriangle, bg: "bg-amber-500" },
  CANCELLED: { label: "Anulowana", cls: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", icon: XCircle, bg: "bg-red-500" },
};

const paymentCfg: Record<string, { label: string; cls: string }> = {
  UNPAID: { label: "Nieopłacona", cls: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400" },
  PARTIALLY_PAID: { label: "Częściowo opłacona", cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  PAID: { label: "Opłacona", cls: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  OVERPAID: { label: "Nadpłata", cls: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
};

const activityCfg: Record<string, { icon: React.ElementType; color: string }> = {
  CREATED: { icon: FileText, color: "bg-muted text-muted-foreground" },
  UPDATED: { icon: FileText, color: "bg-muted text-muted-foreground" },
  SENT: { icon: Send, color: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" },
  VIEWED: { icon: Eye, color: "bg-muted text-muted-foreground" },
  ACCEPTED: { icon: CheckCircle2, color: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400" },
  CANCELLED: { icon: XCircle, color: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" },
  EXPIRED: { icon: AlertTriangle, color: "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" },
  CONVERTED: { icon: Package, color: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400" },
  PAYMENT_RECEIVED: { icon: CreditCard, color: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400" },
  NOTE_ADDED: { icon: MessageSquare, color: "bg-muted text-muted-foreground" },
};

const sourceLbl: Record<string, string> = {
  EMAIL: "E-mail", PHONE: "Telefon", SOCIAL: "Social media", WEBSITE: "Strona www", OTHER: "Inne",
};

/* ─── Helpers ─── */

function formatDate(d: string): string {
  return parseLocalDate(d).toLocaleDateString("pl-PL", { day: "numeric", month: "long", year: "numeric" });
}

function formatDateTime(d: string): string {
  return new Date(d).toLocaleString("pl-PL", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function formatMoney(v: number): string {
  return formatMoneyMinor(v);
}

function clientName(c: OfferData["client"]): string {
  if (c.type === "COMPANY") return c.companyName || "Bez nazwy";
  return [c.firstName, c.lastName].filter(Boolean).join(" ") || "Bez nazwy";
}

function daysUntil(d: string | null): number | null {
  if (!d) return null;
  return Math.ceil((new Date(d).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

/* ─── Component ─── */

export function OfferDetail({ offerId }: { offerId: string }) {
  const router = useRouter();
  const { success, error: showError } = useToast();
  const [offer, setOffer] = useState<OfferData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [cancelDialog, setCancelDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelReasonType, setCancelReasonType] = useState<string>("");

  const load = useCallback(async () => {
    try {
      const data = await apiFetch(`/api/reservations/${offerId}`);
      setOffer(data.reservation);
    } catch (e: any) {
      showError(e.message || "Nie znaleziono oferty");
      router.push("/admin/offers");
    }
    setLoading(false);
  }, [offerId, router, showError]);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (status: string, extra?: Record<string, string>) => {
    setActionLoading(status);
    try {
      const data = await apiFetch(`/api/reservations/${offerId}`, {
        method: "PATCH",
        body: { status, ...extra },
      });
      if (status === "ACCEPTED") {
        success("Rezerwacja utworzona", "Oferta zaakceptowana i skonwertowana na rezerwację.");
      } else if (status === "OPEN") {
        success("Oferta wysłana", "Status zmieniony na Wysłana. Klient może teraz zobaczyć ofertę.");
      } else if (status === "CANCELLED") {
        success("Oferta anulowana", "Zasoby zostały zwolnione.");
      } else {
        success(`Status zmieniony na ${statusCfg[status]?.label || status}`);
      }
      load();
    } catch (e: any) {
      showError(e.message);
      load(); // Refresh to show current state (may have changed by another user)
    }
    setActionLoading(null);
  };

  const handleCancel = async () => {
    const reason = cancelReasonType === "OTHER" ? cancelReason : (cancelReasonType || cancelReason);
    await updateStatus("CANCELLED", { cancelReason: reason, cancelledBy: "ADMIN" });
    setCancelDialog(false);
    setCancelReason("");
    setCancelReasonType("");
  };

  const handleDelete = async () => {
    try {
      await apiFetch(`/api/reservations/${offerId}`, { method: "POST" });
      success("Oferta usunięta");
      router.push("/admin/offers");
    } catch (e: any) { showError(e.message); }
    setDeleteDialog(false);
  };

  const copyLink = async () => {
    if (!offer) return;
    const url = getEngineUrl(`/offer/${offer.token}`);
    try {
      await navigator.clipboard.writeText(url);
      success("Link został skopiowany.");
    } catch {
      const ta = document.createElement("textarea");
      ta.value = url;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      success("Link został skopiowany.");
    }
  };

  if (loading) {
    return (
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="h-9 w-9 rounded-2xl bg-muted shimmer" />
          <div><div className="h-6 w-40 rounded-lg bg-muted shimmer" /><div className="h-4 w-24 rounded mt-1 bg-muted shimmer" /></div>
        </div>
        <div className="bubble p-6 space-y-4">
          <div className="h-5 w-48 rounded bg-muted shimmer" />
          <div className="h-4 w-64 rounded bg-muted shimmer" />
          <div className="h-4 w-56 rounded bg-muted shimmer" />
        </div>
      </div>
    );
  }

  if (!offer) return null;

  const st = statusCfg[offer.status] || statusCfg.DRAFT;
  const StIcon = st.icon;
  const expiryDays = daysUntil(offer.expiresAt);

  return (
    <div className="fade-in-up">
      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/admin/offers")} className="btn-icon-bubble h-9 w-9">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-bold tracking-tight">{offer.offerNumber}</h2>
              <span className={cn("inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full", st.cls)}>
                <StIcon className="h-3 w-3" />{st.label}
              </span>
            </div>
            <p className="text-[13px] text-muted-foreground mt-0.5">
              Utworzona {formatDateTime(offer.createdAt)} • {sourceLbl[offer.source] || offer.source}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        {/* ── Left column (3/4) ── */}
        <div className="lg:col-span-3 space-y-5">

          {/* Client */}
          <div className="bubble">
            <div className="px-5 py-4 flex items-center gap-3">
              <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="h-4 w-4 text-primary" />
              </div>
              <h3 className="text-[14px] font-semibold">Klient</h3>
            </div>
            <div className="px-5 pb-4 border-t border-border/50 pt-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  {offer.client.type === "COMPANY"
                    ? <Building2 className="h-4 w-4 text-primary" />
                    : <UserIcon className="h-4 w-4 text-primary" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-semibold">{clientName(offer.client)}</div>
                  <div className="text-[12px] text-muted-foreground">
                    {offer.client.clientNumber}
                    {offer.client.email && ` • ${offer.client.email}`}
                    {offer.client.phone && ` • ${offer.client.phone}`}
                  </div>
                </div>
                <button onClick={() => router.push("/admin/clients/" + offer.client.id)}
                  className="text-[11px] font-medium text-primary hover:text-primary/80 transition-colors">
                  Profil
                </button>
              </div>
            </div>
          </div>

          {/* Dates + Resources */}
          <div className="bubble">
            <div className="px-5 py-4 flex items-center gap-3">
              <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center">
                <Calendar className="h-4 w-4 text-primary" />
              </div>
              <h3 className="text-[14px] font-semibold">Pobyt</h3>
              <span className="ml-auto text-[12px] font-semibold text-primary bg-primary/8 px-2.5 py-1 rounded-full">
                {offer.nights} {offer.nights === 1 ? "noc" : offer.nights < 5 ? "noce" : "nocy"}
              </span>
            </div>
            <div className="px-5 pb-5 border-t border-border/50 pt-4 space-y-4">
              {/* Date range */}
              <div className="flex items-center gap-2 text-[13px]">
                <span className="font-medium">{formatDate(offer.checkIn)}</span>
                <span className="text-muted-foreground">→</span>
                <span className="font-medium">{formatDate(offer.checkOut)}</span>
              </div>

              {/* Resources */}
              <div className="space-y-2">
                {(offer.items || []).map(r => (
                  <div key={r.id} className="flex items-center justify-between py-2 border-b border-border/30 last:border-b-0">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-xl bg-muted flex items-center justify-center shrink-0">
                        <Home className="h-3.5 w-3.5 text-foreground/50" />
                      </div>
                      <div>
                        <div className="text-[13px] font-medium">
                          {r.resource.unitNumber && <UnitBadge number={r.resource.unitNumber} size="sm" />} {r.resource.name}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {r.capacity} os. • {formatMoney(r.pricePerUnitMinor ?? Math.round(Number(r.pricePerNight) * 100))}/noc × {r.nights} nocy
                        </div>
                      </div>
                    </div>
                    <span className="text-[13px] font-semibold">{formatMoney(r.totalPriceMinor ?? Math.round(Number(r.subtotal) * 100))}</span>
                  </div>
                ))}
              </div>

              {/* Addons */}
              {offer.offerAddons.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-border/50">
                  <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Dodatki</div>
                  {offer.offerAddons.map(a => (
                    <div key={a.id} className="flex items-center justify-between text-[13px]">
                      <span>{a.addon.name} ×{a.quantity}</span>
                      <span className="font-medium">{formatMoney(a.totalMinor ?? Math.round(Number(a.total) * 100))}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Totals */}
              <div className="pt-3 border-t border-border space-y-1">
                <div className="flex justify-between text-[13px]">
                  <span className="text-muted-foreground">Suma netto</span>
                  <span>{formatMoney(offer.subtotalMinor ?? Math.round(Number(offer.subtotal) * 100))}</span>
                </div>
                {(offer.discountMinor ?? Number(offer.discount) * 100) > 0 && (
                  <div className="flex justify-between text-[13px]">
                    <span className="text-muted-foreground">Rabat</span>
                    <span className="text-destructive">-{formatMoney(offer.discountMinor ?? Math.round(Number(offer.discount) * 100))}</span>
                  </div>
                )}
                <div className="flex justify-between text-[15px] font-bold pt-1">
                  <span>Razem</span>
                  <span className="text-primary">{formatMoney(offer.totalMinor ?? Math.round(Number(offer.total) * 100))}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Note */}
          {offer.note && (
            <div className="bubble px-5 py-4">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-[12px] font-semibold text-muted-foreground">Notatka wewnętrzna</span>
              </div>
              <p className="text-[13px] text-foreground/80">{offer.note}</p>
            </div>
          )}

          {/* Activity log */}
          <div className="bubble">
            <div className="px-5 py-4">
              <h3 className="text-[14px] font-semibold">Historia</h3>
            </div>
            <div className="px-5 pb-5 border-t border-border/50 pt-4">
              <div className="space-y-0">
                {offer.activities.map((a, i) => {
                  const cfg = activityCfg[a.action] || { icon: FileText, color: "bg-muted text-muted-foreground" };
                  const AIcon = cfg.icon;
                  return (
                    <div key={a.id} className="flex gap-3 pb-4 relative">
                      {/* Vertical line */}
                      {i < offer.activities.length - 1 && (
                        <div className="absolute left-[11px] top-[28px] bottom-0 w-[2px] bg-border/50" />
                      )}
                      <div className={cn("h-6 w-6 rounded-full flex items-center justify-center shrink-0 z-10", cfg.color)}>
                        <AIcon className="h-3 w-3" />
                      </div>
                      <div className="flex-1 min-w-0 pt-0.5">
                        <div className="text-[12px] text-foreground/80">{a.description || a.action}</div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">
                          {formatDateTime(a.createdAt)}
                          {a.changedBy && <span> • {a.changedBy}</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ── Right column (1/3) — Actions ── */}
        <div className="space-y-5">

          {/* Status actions */}
          <div className="bubble px-5 py-5 space-y-3">
            <h3 className="text-[14px] font-semibold mb-3">Akcje</h3>

            {/* DRAFT → OPEN (Send) */}
            {offer.status === "DRAFT" && (
              <button onClick={() => updateStatus("OPEN")}
                disabled={!!actionLoading}
                className="btn-bubble btn-primary-bubble w-full px-4 py-3 text-[13px] disabled:opacity-50">
                {actionLoading === "OPEN" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Wyślij ofertę
              </button>
            )}

            {/* OPEN → ACCEPTED (creates Booking!) */}
            {offer.status === "OPEN" && (
              <>
                {expiryDays !== null && expiryDays < 0 && (
                  <div className="rounded-2xl bg-destructive/10 px-4 py-3 text-[12px] text-destructive font-medium flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    Oferta wygasła. Wznów ją przed akceptacją.
                  </div>
                )}
                <button onClick={() => updateStatus("ACCEPTED")}
                  disabled={!!actionLoading || (expiryDays !== null && expiryDays < 0)}
                  className="w-full flex items-center justify-center gap-2 rounded-full px-4 py-3 text-[13px] font-semibold text-white bg-green-600 hover:bg-green-700 transition-all disabled:opacity-50"
                  style={{ border: "2px solid transparent" }}>
                  {actionLoading === "ACCEPTED" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  Akceptuj i utwórz rezerwację
                </button>
                <p className="text-[10px] text-muted-foreground text-center">Zaakceptowanie oferty spowoduje utworzenie rezerwacji i zablokowanie zasobów.</p>
              </>
            )}

            {/* ACCEPTED — show booking link */}
            {offer.status === "ACCEPTED" && offer.convertedBookingId && (
              <button onClick={() => router.push("/admin/reservations/" + offer.convertedBookingId)}
                className="w-full flex items-center justify-center gap-2 rounded-full px-4 py-3 text-[13px] font-semibold text-white bg-green-600 hover:bg-green-700 transition-all"
                style={{ border: "2px solid transparent" }}>
                <Package className="h-4 w-4" />
                Zobacz rezerwację
              </button>
            )}

            {/* EXPIRED → OPEN (Reopen) */}
            {offer.status === "EXPIRED" && (
              <button onClick={() => updateStatus("OPEN")}
                disabled={!!actionLoading}
                className="btn-bubble btn-primary-bubble w-full px-4 py-3 text-[13px] disabled:opacity-50">
                {actionLoading === "OPEN" ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                Wznów ofertę
              </button>
            )}

            {/* Copy public link */}
            <button onClick={copyLink}
              className="btn-bubble btn-secondary-bubble w-full px-4 py-2.5 text-[13px]">
              <Copy className="h-4 w-4" /> Kopiuj link dla klienta
            </button>

            {/* Cancel (DRAFT or OPEN) */}
            {(offer.status === "DRAFT" || offer.status === "OPEN") && (
              <button onClick={() => setCancelDialog(true)}
                className="btn-bubble btn-danger-bubble w-full px-4 py-2.5 text-[13px]">
                <XCircle className="h-4 w-4" /> Anuluj ofertę
              </button>
            )}

            {/* Delete (DRAFT only) */}
            {offer.status === "DRAFT" && (
              <button onClick={() => setDeleteDialog(true)}
                className="w-full flex items-center justify-center gap-2 text-[12px] text-muted-foreground hover:text-destructive transition-colors pt-1">
                <Trash2 className="h-3.5 w-3.5" /> Usuń ofertę
              </button>
            )}
          </div>

          {/* Status info */}
          <div className="bubble px-5 py-5 space-y-3">
            <h3 className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider">Informacje</h3>

            <div className="space-y-2.5 text-[12px]">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <span className={cn("font-semibold px-2 py-0.5 rounded-full text-[11px]", st.cls)}>{st.label}</span>
              </div>

              {offer.status === "ACCEPTED" && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Płatność</span>
                  <span className={cn("font-semibold px-2 py-0.5 rounded-full text-[11px]", paymentCfg[offer.paymentStatus]?.cls)}>
                    {paymentCfg[offer.paymentStatus]?.label}
                  </span>
                </div>
              )}

              <div className="flex justify-between">
                <span className="text-muted-foreground">Źródło</span>
                <span className="text-foreground font-medium">{sourceLbl[offer.source]}</span>
              </div>

              {offer.expiresAt && (
                <div className="flex justify-between items-start">
                  <span className="text-muted-foreground">Wygasa</span>
                  <div className="text-right">
                    <span className="text-foreground font-medium text-[12px]">{formatDate(offer.expiresAt)}</span>
                    {expiryDays !== null && (
                      <div className={cn(
                        "text-[10px] font-bold mt-0.5 px-2 py-0.5 rounded-full inline-block",
                        expiryDays < 0 ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                        expiryDays === 0 ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                        expiryDays <= 2 ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                        "bg-muted text-muted-foreground"
                      )}>
                        {expiryDays < 0 ? "Wygasła" : expiryDays === 0 ? "Wygasa dziś!" : `${expiryDays} dn.`}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {offer.sentAt && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Wysłano</span>
                  <span className="text-foreground">{formatDateTime(offer.sentAt)}</span>
                </div>
              )}

              {offer.acceptedAt && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Zaakceptowano</span>
                  <span className="text-foreground">{formatDateTime(offer.acceptedAt)}</span>
                </div>
              )}

              {offer.cancelReason && (
                <div className="pt-2 border-t border-border/50">
                  <span className="text-muted-foreground">Powód anulacji:</span>
                  <p className="text-foreground mt-0.5">{offer.cancelReason}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Cancel dialog (portal) ── */}
      {cancelDialog && typeof window !== "undefined" && createPortal(
        <div style={{ position: "fixed", inset: 0, zIndex: 500 }}>
          <div className="absolute inset-0 bg-black/25 fade-in" style={{ backdropFilter: "blur(4px)" }}
            onClick={() => { setCancelDialog(false); setCancelReasonType(""); setCancelReason(""); }} />
          <div className="absolute inset-0 flex items-center justify-center p-6">
            <div className="bg-card w-full max-w-[440px] rounded-[20px] fade-in-scale" style={{ border: "none", boxShadow: "0 8px 40px rgba(0,0,0,0.12)" }}>
              {/* Header */}
              <div className="flex items-center gap-3 px-6 pt-6 pb-4">
                <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: "hsl(var(--destructive) / 0.1)" }}>
                  <XCircle style={{ width: 20, height: 20, color: "hsl(var(--destructive))" }} />
                </div>
                <div>
                  <h3 className="text-[15px] font-bold">Anuluj ofertę</h3>
                  <p className="text-[12px] text-muted-foreground mt-0.5">Zasoby zostaną zwolnione.</p>
                </div>
              </div>

              {/* Reasons */}
              <div className="px-6 pb-4 space-y-2">
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">Powód anulacji</label>
                {[
                  { value: "Klient zrezygnował", label: "Klient zrezygnował" },
                  { value: "Zmiana terminu", label: "Zmiana terminu" },
                  { value: "Brak odpowiedzi klienta", label: "Brak odpowiedzi klienta" },
                  { value: "Błąd w ofercie", label: "Błąd w ofercie" },
                  { value: "OTHER", label: "Inny powód..." },
                ].map(opt => (
                  <button key={opt.value} onClick={() => { setCancelReasonType(opt.value); if (opt.value !== "OTHER") setCancelReason(""); }}
                    className={cn(
                      "w-full text-left px-4 py-2.5 rounded-xl text-[13px] transition-all",
                      cancelReasonType === opt.value
                        ? "bg-primary/8 font-semibold"
                        : "hover:bg-muted/50"
                    )}
                    style={{
                      border: cancelReasonType === opt.value
                        ? "2px solid hsl(var(--primary))"
                        : "2px solid hsl(var(--border) / 0.5)",
                    }}>
                    {opt.label}
                  </button>
                ))}
                {cancelReasonType === "OTHER" && (
                  <textarea
                    value={cancelReason}
                    onChange={e => setCancelReason(e.target.value)}
                    placeholder="Opisz powód..."
                    rows={2}
                    className="input-bubble py-3 resize-none mt-1"
                    autoFocus
                  />
                )}
              </div>

              {/* Footer */}
              <div className="flex gap-2 justify-end px-6 pb-6 pt-2" style={{ borderTop: "1px solid hsl(var(--border) / 0.5)" }}>
                <button onClick={() => { setCancelDialog(false); setCancelReasonType(""); setCancelReason(""); }}
                  className="btn-bubble btn-secondary-bubble px-5 py-2.5 text-[13px]">Wróć</button>
                <button onClick={handleCancel}
                  disabled={!!actionLoading || (!cancelReasonType)}
                  className="btn-bubble btn-danger-bubble px-5 py-2.5 text-[13px] disabled:opacity-40">
                  {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                  Anuluj ofertę
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── Delete dialog ── */}
      <ConfirmDialog
        open={deleteDialog}
        onCancel={() => setDeleteDialog(false)}
        onConfirm={handleDelete}
        title="Usuń ofertę"
        message="Czy na pewno chcesz trwale usunąć tę ofertę? Operacja jest nieodwracalna."
        confirmLabel="Usuń"
        variant="danger"
      />
    </div>
  );
}
