"use client";

import React, { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Calendar, Clock, Home, Users, Package, Loader2,
  CheckCircle2, XCircle, LogIn, LogOut, HelpCircle, CreditCard, DollarSign, Info,
  MessageSquare, FileText, Copy, Building2, User as UserIcon,
  AlertTriangle, Phone, Mail, ExternalLink, Pencil,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api-fetch";
import { useToast } from "@/components/ui/toast";
import { UnitBadge } from "@/components/ui/unit-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { parseLocalDate } from "@/lib/dates";
import { formatMoneyMinor } from "@/lib/format";
import { UnifiedPanel } from "@/components/unified-panel";
import { useReservationPayments } from "@/components/payments/use-reservation-payments";
import { PaymentSummary } from "@/components/payments/payment-summary";
import { PaymentList } from "@/components/payments/payment-list";
import { PaymentPanel } from "@/components/payments/payment-panel";

const statusCfg: Record<string, { label: string; cls: string; icon: React.ElementType }> = {
  NEW: { label: "Nowa", cls: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400", icon: Package },
  PENDING: { label: "Oczekująca", cls: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400", icon: Clock },
  CONFIRMED: { label: "Potwierdzona", cls: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400", icon: CheckCircle2 },
  CHECKED_IN: { label: "Zameldowany", cls: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400", icon: LogIn },
  CHECKED_OUT: { label: "Wymeldowany", cls: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300", icon: LogOut },
  CANCELLED: { label: "Anulowana", cls: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", icon: XCircle },
  NO_SHOW: { label: "Niestawienie", cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400", icon: HelpCircle },
};

const sourceLbl: Record<string, string> = {
  WEBSITE: "Strona www", BOOKING_COM: "Booking.com", AIRBNB: "Airbnb",
  PHONE: "Telefon", EMAIL: "E-mail", OFFER_BUILDER: "Z oferty", WALK_IN: "Na miejscu", OTHER: "Inne",
};

function fmtDate(d: string): string { return parseLocalDate(d).toLocaleDateString("pl-PL", { day: "numeric", month: "long", year: "numeric" }); }
function fmtDateTime(d: string): string { return new Date(d).toLocaleString("pl-PL", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }); }
function fmtMoney(v: number): string { return formatMoneyMinor(v); }
function clientName(c: any): string { return c.type === "COMPANY" ? (c.companyName || "Bez nazwy") : [c.firstName, c.lastName].filter(Boolean).join(" ") || "Bez nazwy"; }

function DetailSkeleton() {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-9 rounded-2xl" />
        <div><Skeleton className="h-7 w-48 rounded-lg" /><Skeleton className="h-4 w-32 mt-2 rounded" /></div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        <div className="lg:col-span-3 space-y-5">
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-48 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
        </div>
        <div className="space-y-5">
          <Skeleton className="h-48 rounded-2xl" />
          <Skeleton className="h-40 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

export function ReservationDetail({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const { success, error: showError } = useToast();
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [cancelDialog, setCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelReasonType, setCancelReasonType] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [paymentPanelOpen, setPaymentPanelOpen] = useState(false);

  // C2: Payment data
  const payHook = useReservationPayments(booking?.type === "BOOKING" ? bookingId : null);

  const load = useCallback(async () => {
    try {
      const data = await apiFetch(`/api/reservations/${bookingId}`);
      setBooking(data.reservation);
    } catch (e: any) {
      showError(e.message || "Nie znaleziono rezerwacji");
      router.push("/admin/reservations");
    }
    setLoading(false);
  }, [bookingId, router, showError]);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (status: string, extra?: Record<string, string>) => {
    setActionLoading(status);
    try {
      const data = await apiFetch(`/api/reservations/${bookingId}`, {
        method: "PATCH",
        body: { status, ...extra },
      });
      if (status === "CHECKED_IN") success("Zameldowanie", "Status zmieniony na Zameldowany.");
      else if (status === "CHECKED_OUT") success("Wymeldowanie", "Status zmieniony na Wymeldowany.");
      else if (status === "CANCELLED") success("Rezerwacja anulowana", "Zasoby zostały zwolnione.");
      else if (status === "NO_SHOW") success("Niestawienie", "Oznaczono jako niestawienie.");
      else success(`Status zmieniony na ${statusCfg[status]?.label || status}.`);
      load();
    } catch (e: any) {
      showError(e.message);
      load();
    }
    setActionLoading(null);
  };

  const handleCancel = async () => {
    const reason = cancelReasonType === "OTHER" ? cancelReason : (cancelReasonType || cancelReason);
    await updateStatus("CANCELLED", { cancelReason: reason });
    setCancelDialog(false);
    setCancelReason("");
    setCancelReasonType("");
  };

  if (loading) return <DetailSkeleton />;
  if (!booking) return null;

  const st = statusCfg[booking.status] || statusCfg.NEW;
  const StIcon = st.icon;

  return (
    <div className="fade-in-up">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/admin/reservations")} className="btn-icon-bubble h-9 w-9">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-bold tracking-tight">{booking.bookingNumber}</h2>
              <span className={cn("inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full", st.cls)}>
                <StIcon className="h-3 w-3" />{st.label}
              </span>
            </div>
            <p className="text-[13px] text-muted-foreground mt-0.5">
              Utworzona {fmtDateTime(booking.createdAt)} • {sourceLbl[booking.source] || booking.source}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        {/* Left column (3/4) */}
        <div className="lg:col-span-3 space-y-5">

          {/* Client */}
          <div className="bubble">
            <div className="px-5 py-4 flex items-center gap-3">
              <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="h-4 w-4 text-primary" />
              </div>
              <h3 className="text-[14px] font-semibold">Klient</h3>
              <button onClick={() => router.push("/admin/clients/" + booking.client.id)} className="ml-auto btn-bubble btn-secondary-bubble px-3 py-1.5 text-[11px] flex items-center gap-1.5">
                <ExternalLink className="h-3 w-3" /> Profil
              </button>
            </div>
            <div className="px-5 pb-5 border-t border-border/50 pt-4">
              {/* Client name - prominent */}
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                  {booking.client.type === "COMPANY"
                    ? <Building2 className="h-5 w-5 text-primary" />
                    : <UserIcon className="h-5 w-5 text-primary" />
                  }
                </div>
                <div className="min-w-0">
                  <div className="text-[16px] font-bold tracking-tight">{clientName(booking.client)}</div>
                  <div className="text-[12px] text-muted-foreground mt-0.5">
                    {booking.client.clientNumber}
                    {booking.client.type === "COMPANY" && " • Firma"}
                    {booking.client.type === "INDIVIDUAL" && " • Osoba prywatna"}
                  </div>
                </div>
              </div>

              {/* Contact details - clickable */}
              <div className="space-y-2">
                {booking.client.email && (
                  <a
                    href={`mailto:${booking.client.email}`}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted/50 transition-colors group"
                  >
                    <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
                      <Mail className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[11px] text-muted-foreground">E-mail</div>
                      <div className="text-[13px] font-medium text-primary truncate">{booking.client.email}</div>
                    </div>
                  </a>
                )}
                {booking.client.phone && (
                  <a
                    href={`tel:${booking.client.phone}`}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted/50 transition-colors group"
                  >
                    <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
                      <Phone className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[11px] text-muted-foreground">Telefon</div>
                      <div className="text-[13px] font-medium text-primary">{booking.client.phone}</div>
                    </div>
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Stay details */}
          <div className="bubble">
            <div className="px-5 py-4 flex items-center gap-3">
              <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center">
                <Calendar className="h-4 w-4 text-primary" />
              </div>
              <h3 className="text-[14px] font-semibold">Pobyt</h3>
              <span className="ml-auto text-[12px] font-semibold text-primary bg-primary/8 px-2.5 py-1 rounded-full">
                {booking.nights} {booking.nights === 1 ? "noc" : booking.nights < 5 ? "noce" : "nocy"}
              </span>
            </div>
            <div className="px-5 pb-5 border-t border-border/50 pt-4 space-y-4">
              <div className="flex items-center gap-2 text-[13px]">
                <span className="font-medium">{fmtDate(booking.checkIn)}</span>
                <span className="text-muted-foreground">→</span>
                <span className="font-medium">{fmtDate(booking.checkOut)}</span>
              </div>

              <div className="flex items-center gap-3 text-[13px] text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>{booking.adults} {booking.adults === 1 ? "dorosły" : "dorosłych"}</span>
                {booking.children > 0 && <span>• {booking.children} {booking.children === 1 ? "dziecko" : "dzieci"}</span>}
                {booking.infants > 0 && <span>• {booking.infants} {booking.infants === 1 ? "niemowlę" : "niemowląt"}</span>}
              </div>

              {/* Resources */}
              <div className="space-y-2 pt-2 border-t border-border/30">
                {(booking.items || []).map((r: any) => (
                  <div key={r.id} className="flex items-center justify-between py-2 border-b border-border/30 last:border-b-0">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-xl bg-muted flex items-center justify-center shrink-0">
                        <Home className="h-3.5 w-3.5 text-foreground/50" />
                      </div>
                      <div>
                        <div className="text-[13px] font-medium flex items-center gap-1.5">
                          {r.resource.name}
                          {r.resource.unitNumber && <UnitBadge number={r.resource.unitNumber} size="sm" />}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {fmtMoney(r.pricePerUnitMinor ?? Math.round(Number(r.pricePerNight ?? r.pricePerUnit) * 100))}/noc × {booking.nights} nocy
                        </div>
                      </div>
                    </div>
                    <span className="text-[13px] font-semibold">{fmtMoney(r.totalPriceMinor ?? Math.round(Number(r.totalPrice) * 100))}</span>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="pt-3 border-t border-border space-y-1">
                <div className="flex justify-between text-[13px]"><span className="text-muted-foreground">Suma netto</span><span>{fmtMoney(booking.subtotalMinor ?? Math.round(Number(booking.subtotal) * 100))}</span></div>
                {(booking.discountMinor ?? Number(booking.discount) * 100) > 0 && <div className="flex justify-between text-[13px]"><span className="text-muted-foreground">Rabat</span><span className="text-destructive">-{fmtMoney(booking.discountMinor ?? Math.round(Number(booking.discount) * 100))}</span></div>}
                <div className="flex justify-between text-[15px] font-bold pt-1"><span>Razem</span><span className="text-primary">{fmtMoney(booking.totalMinor ?? Math.round(Number(booking.total) * 100))}</span></div>
                {(booking.paidAmountMinor ?? Number(booking.paidAmount) * 100) > 0 && <div className="flex justify-between text-[12px] text-muted-foreground pt-1"><span>Zapłacono</span><span>{fmtMoney(booking.paidAmountMinor ?? Math.round(Number(booking.paidAmount) * 100))}</span></div>}
                {(booking.balanceDueMinor ?? Number(booking.balanceDue) * 100) > 0 && <div className="flex justify-between text-[12px] font-semibold text-amber-600 dark:text-amber-400"><span>Do zapłaty</span><span>{fmtMoney(booking.balanceDueMinor ?? Math.round(Number(booking.balanceDue) * 100))}</span></div>}
              </div>
            </div>
          </div>

          {/* Notes */}
          {(booking.internalNotes || booking.guestNotes || booking.specialRequests) && (
            <div className="bubble px-5 py-4 space-y-3">
              {booking.internalNotes && (
                <div><div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Notatka wewnętrzna</div><p className="text-[13px]">{booking.internalNotes}</p></div>
              )}
              {booking.guestNotes && (
                <div><div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Notatka od gościa</div><p className="text-[13px]">{booking.guestNotes}</p></div>
              )}
              {booking.specialRequests && (
                <div><div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Specjalne życzenia</div><p className="text-[13px]">{booking.specialRequests}</p></div>
              )}
            </div>
          )}

          {/* Status log */}
          <div className="bubble">
            <div className="px-5 py-4"><h3 className="text-[14px] font-semibold">Historia statusów</h3></div>
            <div className="px-5 pb-5 border-t border-border/50 pt-4">
              {(booking.statusLogs || []).map((log: any, i: number) => {
                const toSt = statusCfg[log.toStatus] || statusCfg.NEW;
                const ToIcon = toSt.icon;
                return (
                  <div key={log.id} className="flex gap-3 pb-4 relative">
                    {i < booking.statusLogs.length - 1 && <div className="absolute left-[11px] top-[28px] bottom-0 w-[2px] bg-border/50" />}
                    <div className={cn("h-6 w-6 rounded-full flex items-center justify-center shrink-0 z-10", toSt.cls)}>
                      <ToIcon className="h-3 w-3" />
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5">
                      <div className="text-[12px] font-medium">
                        {log.fromStatus && <><span className="text-muted-foreground">{statusCfg[log.fromStatus]?.label}</span> → </>}
                        <span className="text-foreground">{toSt.label}</span>
                      </div>
                      {log.note && <div className="text-[11px] text-muted-foreground mt-0.5">{log.note}</div>}
                      <div className="text-[10px] text-muted-foreground/60 mt-0.5">{fmtDateTime(log.createdAt)} • {log.changedBy || "System"}</div>
                    </div>
                  </div>
                );
              })}
              {(!booking.statusLogs || booking.statusLogs.length === 0) && <div className="text-center py-4 text-[13px] text-muted-foreground">Brak historii</div>}
            </div>
          </div>
        </div>

        {/* Right column (1/4) */}
        <div className="space-y-5">

          {/* Actions */}
          <div className="bubble px-5 py-5 space-y-3">
            <h3 className="text-[14px] font-semibold mb-3">Akcje</h3>

            {booking.status !== "CANCELLED" && booking.status !== "CHECKED_OUT" && (
              <button onClick={() => setEditOpen(true)}
                className="btn-bubble btn-secondary-bubble w-full px-4 py-2.5 text-[13px] flex items-center justify-center gap-2">
                <Pencil className="h-4 w-4" /> Edytuj rezerwację
              </button>
            )}

            {booking.status === "NEW" && (
              <button onClick={() => updateStatus("CONFIRMED")} disabled={!!actionLoading}
                className="w-full flex items-center justify-center gap-2 rounded-full px-4 py-3 text-[13px] font-semibold text-white bg-green-600 hover:bg-green-700 transition-all disabled:opacity-50"
                style={{ border: "2px solid transparent" }}>
                {actionLoading === "CONFIRMED" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Potwierdź rezerwację
              </button>
            )}

            {booking.status === "CONFIRMED" && (
              <>
                <button onClick={() => updateStatus("CHECKED_IN")} disabled={!!actionLoading}
                  className="w-full flex items-center justify-center gap-2 rounded-full px-4 py-3 text-[13px] font-semibold text-white bg-purple-600 hover:bg-purple-700 transition-all disabled:opacity-50"
                  style={{ border: "2px solid transparent" }}>
                  {actionLoading === "CHECKED_IN" ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
                  Zamelduj
                </button>
                <button onClick={() => updateStatus("NO_SHOW")} disabled={!!actionLoading}
                  className="btn-bubble btn-secondary-bubble w-full px-4 py-2.5 text-[13px]">
                  <HelpCircle className="h-4 w-4" /> Niestawienie
                </button>
              </>
            )}

            {booking.status === "CHECKED_IN" && (
              <button onClick={() => updateStatus("CHECKED_OUT")} disabled={!!actionLoading}
                className="btn-bubble btn-primary-bubble w-full px-4 py-3 text-[13px] disabled:opacity-50">
                {actionLoading === "CHECKED_OUT" ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
                Wymelduj
              </button>
            )}

            {(booking.status === "NEW" || booking.status === "CONFIRMED") && (
              <button onClick={() => setCancelDialog(true)} className="btn-bubble btn-danger-bubble w-full px-4 py-2.5 text-[13px]">
                <XCircle className="h-4 w-4" /> Anuluj rezerwację
              </button>
            )}

            {/* Source offer link */}
            {booking.sourceOffer && (
              <button onClick={() => router.push("/admin/offers/" + booking.sourceOffer.id)}
                className="btn-bubble btn-secondary-bubble w-full px-4 py-2.5 text-[13px]">
                <FileText className="h-4 w-4" /> Oferta {booking.sourceOffer.offerNumber}
              </button>
            )}
          </div>

          {/* Info panel */}
          <div className="bubble px-5 py-5 space-y-3">
            <h3 className="flex items-center gap-2 text-[14px] font-semibold"><Info className="h-4 w-4 text-primary" />Informacje</h3>
            <div className="space-y-2.5 text-[12px]">
              <div className="flex justify-between"><span className="text-muted-foreground">Status</span><span className={cn("font-semibold px-2 py-0.5 rounded-full text-[11px]", st.cls)}>{st.label}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Źródło</span><span className="font-medium">{sourceLbl[booking.source]}</span></div>
              {booking.confirmedAt && <div className="flex justify-between"><span className="text-muted-foreground">Potwierdzono</span><span>{fmtDateTime(booking.confirmedAt)}</span></div>}
              {booking.checkedInAt && <div className="flex justify-between"><span className="text-muted-foreground">Zameldowano</span><span>{fmtDateTime(booking.checkedInAt)}</span></div>}
              {booking.checkedOutAt && <div className="flex justify-between"><span className="text-muted-foreground">Wymeldowano</span><span>{fmtDateTime(booking.checkedOutAt)}</span></div>}
              {booking.cancelReason && <div className="pt-2 border-t border-border/50"><span className="text-muted-foreground">Powód anulacji:</span><p className="text-foreground mt-0.5">{booking.cancelReason}</p></div>}
            </div>
          </div>

          {/* Payment summary — C2: shared components */}
          <div className="bubble px-5 py-5 space-y-3">
            <h3 className="flex items-center gap-2 text-[14px] font-semibold"><DollarSign className="h-4 w-4 text-primary" />Rozliczenia</h3>
            {payHook.summary ? (
              <>
                <PaymentSummary summary={payHook.summary} compact />
                {payHook.payments.length > 0 && (
                  <div className="pt-3 border-t border-border/50">
                    <div className="text-[12px] font-semibold text-muted-foreground mb-2">Ostatnie operacje</div>
                    <PaymentList
                      payments={payHook.payments}
                      compact={3}
                      actionLoading={payHook.actionLoading}
                      onConfirm={async (id) => { await payHook.confirm(id); load(); }}
                      onReject={async (id, reason) => { await payHook.reject(id, reason); load(); }}
                    />
                  </div>
                )}
              </>
            ) : (
              <div className="space-y-2 text-[12px]">
                <div className="flex justify-between"><span className="text-muted-foreground">Kwota</span><span className="font-bold text-[14px]">{fmtMoney(booking.totalMinor ?? Math.round(Number(booking.total) * 100))}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Zapłacono</span><span className="font-medium text-green-600 dark:text-green-400">{fmtMoney(booking.paidAmountMinor ?? Math.round(Number(booking.paidAmount) * 100))}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Do zapłaty</span><span className={cn("font-bold", (booking.balanceDueMinor ?? Number(booking.balanceDue) * 100) > 0 ? "text-amber-600 dark:text-amber-400" : "text-green-600 dark:text-green-400")}>{fmtMoney(booking.balanceDueMinor ?? Math.round(Number(booking.balanceDue) * 100))}</span></div>
              </div>
            )}
            <button
              onClick={() => setPaymentPanelOpen(true)}
              className="btn-bubble btn-primary-bubble w-full h-9 text-[12px] font-semibold flex items-center justify-center gap-2"
            >
              <CreditCard className="h-3.5 w-3.5" />
              {payHook.payments.length > 0 ? "Pokaż wszystkie rozliczenia" : "Dodaj wpłatę"}
            </button>
          </div>
        </div>
      </div>

      {/* Cancel dialog */}
      {cancelDialog && typeof window !== "undefined" && createPortal(
        <div style={{ position: "fixed", inset: 0, zIndex: 99999 }}>
          <div className="absolute inset-0 bg-black/25 fade-in" style={{ backdropFilter: "blur(4px)" }}
            onClick={() => { setCancelDialog(false); setCancelReasonType(""); setCancelReason(""); }} />
          <div className="absolute inset-0 flex items-center justify-center p-6">
            <div className="bg-card w-full max-w-[440px] rounded-[20px] fade-in-scale" style={{ border: "none", boxShadow: "0 8px 40px rgba(0,0,0,0.12)" }}>
              <div className="flex items-center gap-3 px-6 pt-6 pb-4">
                <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "hsl(var(--destructive) / 0.1)" }}>
                  <XCircle style={{ width: 20, height: 20, color: "hsl(var(--destructive))" }} />
                </div>
                <div>
                  <h3 className="text-[15px] font-bold">Anuluj rezerwację</h3>
                  <p className="text-[12px] text-muted-foreground mt-0.5">Zasoby zostaną zwolnione.</p>
                </div>
              </div>
              <div className="px-6 pb-4 space-y-2">
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">Powód anulacji</label>
                {[
                  { value: "Klient zrezygnował", label: "Klient zrezygnował" },
                  { value: "Zmiana terminu", label: "Zmiana terminu" },
                  { value: "Brak płatności", label: "Brak płatności" },
                  { value: "OTHER", label: "Inny powód..." },
                ].map(opt => (
                  <button key={opt.value} onClick={() => { setCancelReasonType(opt.value); if (opt.value !== "OTHER") setCancelReason(""); }}
                    className={cn("w-full text-left px-4 py-2.5 rounded-xl text-[13px] transition-all",
                      cancelReasonType === opt.value ? "bg-primary/8 font-semibold" : "hover:bg-muted/50"
                    )}
                    style={{ border: cancelReasonType === opt.value ? "2px solid hsl(var(--primary))" : "2px solid hsl(var(--border) / 0.5)" }}>
                    {opt.label}
                  </button>
                ))}
                {cancelReasonType === "OTHER" && (
                  <textarea value={cancelReason} onChange={e => setCancelReason(e.target.value)}
                    placeholder="Opisz powód..." rows={2} className="input-bubble py-3 resize-none mt-1" autoFocus />
                )}
              </div>
              <div className="flex gap-2 justify-end px-6 pb-6 pt-2" style={{ borderTop: "1px solid hsl(var(--border) / 0.5)" }}>
                <button onClick={() => { setCancelDialog(false); setCancelReasonType(""); setCancelReason(""); }}
                  className="btn-bubble btn-secondary-bubble px-5 py-2.5 text-[13px]">Wróć</button>
                <button onClick={handleCancel} disabled={!!actionLoading || !cancelReasonType}
                  className="btn-bubble btn-danger-bubble px-5 py-2.5 text-[13px] disabled:opacity-40">
                  {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                  Anuluj rezerwację
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Edit panel */}
      <UnifiedPanel
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onCreated={() => {}}
        mode="edit"
        editBookingId={bookingId}
        onEdited={() => { setEditOpen(false); load(); payHook.refresh(); }}
      />
      <PaymentPanel
        reservationId={bookingId}
        open={paymentPanelOpen}
        onClose={() => setPaymentPanelOpen(false)}
        onMutate={() => { payHook.refresh(); load(); }}
      />
    </div>
  );
}
