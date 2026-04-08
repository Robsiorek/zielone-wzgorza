"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar, Clock, Home, FileText,
  ExternalLink, Building2, User as UserIcon,
  Package, AlertTriangle, DollarSign, Loader2,
  CheckCircle2, XCircle, UserCheck, UserX, Pencil,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api-fetch";
import { SlidePanel } from "@/components/ui/slide-panel";
import { UnitBadge } from "@/components/ui/unit-badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { parseLocalDate } from "@/lib/dates";
import { formatMoneyMinor } from "@/lib/format";

interface ReservationData {
  id: string;
  number: string;
  type: string;
  status: string;
  paymentStatus?: string;
  overdue?: boolean;
  requiresAttention?: boolean;
  checkIn: string;
  checkOut: string;
  nights: number;
  total: number | string;
  totalMinor?: number;
  client: { id: string; firstName: string | null; lastName: string | null; companyName: string | null; email?: string | null; type?: string } | null;
  items?: { resource: { id: string; name: string; unitNumber: string | null } }[];
  resources?: { resource: { id: string; name: string; unitNumber: string | null } }[];
  bookingDetails?: { paidAmount?: number | string; balanceDue?: number | string; paidAmountMinor?: number; balanceDueMinor?: number; confirmedAt?: string | null; checkedInAt?: string | null } | null;
  offerDetails?: { expiresAt?: string | null } | null;
}

interface Props {
  reservation: ReservationData | null;
  open: boolean;
  onClose: () => void;
  onRefresh?: () => void;
}

function formatDate(d: string): string {
  return parseLocalDate(d).toLocaleDateString("pl-PL", { weekday: "short", day: "numeric", month: "long", year: "numeric" });
}
function clientName(c: ReservationData["client"]): string {
  if (!c) return "Brak klienta";
  if (c.companyName) return c.companyName;
  return [c.firstName, c.lastName].filter(Boolean).join(" ") || "Brak danych";
}
function fmtMoney(v: number | string): string {
  return formatMoneyMinor(Number(v));
}
function todayMidnight(): Date { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }

const TYPE_CFG: Record<string, { label: string; icon: React.ElementType; cls: string }> = {
  BOOKING: { label: "Rezerwacja", icon: Package, cls: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400" },
  OFFER: { label: "Oferta", icon: FileText, cls: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
  BLOCK: { label: "Blokada", icon: AlertTriangle, cls: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
};
const STATUS_CFG: Record<string, { label: string; cls: string }> = {
  PENDING: { label: "Oczekująca", cls: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" },
  CONFIRMED: { label: "Potwierdzona", cls: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400" },
  CANCELLED: { label: "Anulowana", cls: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
  EXPIRED: { label: "Wygasła", cls: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400" },
  FINISHED: { label: "Zrealizowana", cls: "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300" },
  NO_SHOW: { label: "Niestawienie", cls: "bg-red-50 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
};
const PAY_CFG: Record<string, { label: string; cls: string }> = {
  UNPAID: { label: "Nieopłacona", cls: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400" },
  PARTIAL: { label: "Częściowo", cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  PAID: { label: "Opłacona", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
};

export function ReservationQuickPanel({ reservation, open, onClose, onRefresh }: Props) {
  const router = useRouter();
  const { success, error: showError } = useToast();
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [cancelConfirm, setCancelConfirm] = useState(false);

  if (!reservation) return null;
  const r = reservation;
  const tc = TYPE_CFG[r.type] || TYPE_CFG.BOOKING;
  const TIcon = tc.icon;
  const sc = STATUS_CFG[r.status];
  const pc = r.paymentStatus ? PAY_CFG[r.paymentStatus] : null;
  const itemsList = r.items || r.resources || [];
  const isCheckedIn = r.bookingDetails?.checkedInAt;
  const today = todayMidnight();
  const ciDate = new Date(r.checkIn); ciDate.setHours(0, 0, 0, 0);
  const coDate = new Date(r.checkOut); coDate.setHours(0, 0, 0, 0);
  const canCheckIn = today >= ciDate;
  const canNoShow = today >= ciDate && today < coDate;

  const handleAction = async (endpoint: string, msg: string) => {
    if (actionLoading) return;
    setActionLoading(endpoint);
    try {
      await apiFetch(`/api/reservations/${r.id}/${endpoint}`, { method: "POST" });
      success(msg);
      onClose();
      onRefresh?.();
    } catch (e: any) { showError(e.message || "Błąd"); }
    setActionLoading(null);
  };
  const handleCancel = async () => {
    setActionLoading("cancel");
    try {
      await apiFetch(`/api/reservations/${r.id}/cancel`, { method: "POST", body: JSON.stringify({ cancelReason: "Anulowano z listy" }) });
      success("Anulowano");
      setCancelConfirm(false);
      onClose();
      onRefresh?.();
    } catch (e: any) { showError(e.message || "Błąd"); }
    setActionLoading(null);
  };
  const isLoading = (a: string) => actionLoading === a;
  const go = (path: string) => { router.push(path); onClose(); };

  return (
    <SlidePanel open={open} onClose={onClose} title={
      <div className="flex items-center gap-3">
        <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center shrink-0", tc.cls)}><TIcon className="h-4 w-4" /></div>
        <div>
          <div className="text-[14px] font-bold">{tc.label}</div>
          <div className="text-[12px] text-muted-foreground font-mono">{r.number}</div>
        </div>
      </div>
    }>
      <div className="space-y-5 py-4">
        {/* Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          {sc && <span className={cn("text-[11px] font-semibold px-2.5 py-1 rounded-full", sc.cls)}>{sc.label}</span>}
          {pc && r.type === "BOOKING" && <span className={cn("text-[11px] font-semibold px-2.5 py-1 rounded-full", pc.cls)}>{pc.label}</span>}
          {isCheckedIn && <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-500 text-white">✓ Zameldowany</span>}
          {r.requiresAttention && <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-amber-500 text-white">⚠ Do wyjaśnienia</span>}
          {r.overdue && <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-red-500 text-white">! Po terminie</span>}
        </div>
        {/* Dates */}
        <div className="space-y-3">
          <Row icon={Calendar} label="Przyjazd" value={formatDate(r.checkIn)} />
          <Row icon={Calendar} label="Wyjazd" value={formatDate(r.checkOut)} />
          <Row icon={Clock} label="Pobyt" value={`${r.nights} ${r.nights === 1 ? "noc" : r.nights < 5 ? "noce" : "nocy"}`} />
        </div>
        {/* Items */}
        <div className="pt-3 border-t border-border space-y-2">
          {(itemsList as any[]).map((res: any, i: number) => (
            <Row key={i} icon={Home} label={i === 0 ? "Zasoby" : ""} value={
              <span className="flex items-center gap-2">{res.resource.name}{res.resource.unitNumber && <UnitBadge number={res.resource.unitNumber} size="sm" />}</span>
            } />
          ))}
        </div>
        {/* Client */}
        {r.client && (
          <div className="pt-3 border-t border-border">
            <Row icon={r.client.companyName ? Building2 : UserIcon} label="Klient" value={
              <button onClick={() => go("/admin/clients/" + r.client!.id)} className="text-primary hover:underline text-left">{clientName(r.client)}</button>
            } />
          </div>
        )}
        {/* Financial */}
        {r.type !== "BLOCK" && (
          <div className="pt-3 border-t border-border space-y-2">
            <Row icon={DollarSign} label="Kwota" value={fmtMoney(r.totalMinor ?? Math.round(Number(r.total) * 100))} />
            {r.bookingDetails && (r.bookingDetails.balanceDueMinor ?? Number(r.bookingDetails.balanceDue || 0) * 100) > 0 && (
              <Row icon={DollarSign} label="Do zapłaty" value={<span className="text-amber-600 dark:text-amber-400 font-bold">{fmtMoney(r.bookingDetails.balanceDueMinor ?? Math.round(Number(r.bookingDetails.balanceDue || 0) * 100))}</span>} />
            )}
          </div>
        )}

        {/* ══ BOOKING ACTIONS ══ */}
        {r.type === "BOOKING" && (
          <div className="pt-4 border-t border-border space-y-2">
            {r.status === "CONFIRMED" && !isCheckedIn && (
              <button onClick={() => canCheckIn ? handleAction("check-in", "Zameldowano") : showError("Zameldowanie można oznaczyć w dniu rozpoczęcia rezerwacji")} disabled={isLoading("check-in")}
                className={cn("btn-bubble w-full px-5 py-2.5 text-[13px] flex items-center justify-center gap-2", canCheckIn ? "btn-primary-bubble" : "btn-secondary-bubble opacity-60")}>
                {isLoading("check-in") ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserCheck className="h-4 w-4" />} Zamelduj gościa
              </button>
            )}
            {r.status === "CONFIRMED" && !isCheckedIn && (
              <button onClick={() => canNoShow ? handleAction("no-show", "Oznaczono niestawienie") : showError("Niestawienie od dnia rozpoczęcia rezerwacji")} disabled={isLoading("no-show")}
                className={cn("btn-bubble w-full px-5 py-2.5 text-[13px] flex items-center justify-center gap-2", canNoShow ? "border-red-300 dark:border-red-700 text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20" : "btn-secondary-bubble opacity-60")}>
                {isLoading("no-show") ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserX className="h-4 w-4" />} Klient nie stawił się
              </button>
            )}
            {r.status === "NO_SHOW" && (
              <button onClick={() => handleAction("check-in", "Zameldowano (cofnięto niestawienie)")} disabled={isLoading("check-in")}
                className="btn-bubble btn-primary-bubble w-full px-5 py-2.5 text-[13px] flex items-center justify-center gap-2">
                {isLoading("check-in") ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserCheck className="h-4 w-4" />} Zamelduj (cofnij niestawienie)
              </button>
            )}
            {r.status === "PENDING" && (
              <button onClick={() => handleAction("confirm", "Rezerwacja potwierdzona")} disabled={isLoading("confirm")}
                className="btn-bubble btn-primary-bubble w-full px-5 py-2.5 text-[13px] flex items-center justify-center gap-2">
                {isLoading("confirm") ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} Potwierdź rezerwację
              </button>
            )}
            {r.status === "CANCELLED" && (
              <button onClick={() => handleAction("restore", "Rezerwacja przywrócona")} disabled={isLoading("restore")}
                className="btn-bubble btn-primary-bubble w-full px-5 py-2.5 text-[13px] flex items-center justify-center gap-2">
                {isLoading("restore") ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} Przywróć rezerwację
              </button>
            )}
            {r.status !== "CANCELLED" && r.status !== "FINISHED" && (
              <button onClick={() => setCancelConfirm(true)}
                className="btn-bubble w-full px-5 py-2.5 text-[13px] flex items-center justify-center gap-2 border-red-300 dark:border-red-700 text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20">
                <XCircle className="h-4 w-4" /> Anuluj rezerwację
              </button>
            )}
            <button onClick={() => go("/admin/reservations/" + r.id)}
              className="btn-bubble btn-secondary-bubble w-full px-5 py-2.5 text-[13px] flex items-center justify-center gap-2">
              <ExternalLink className="h-4 w-4" /> Otwórz kartę rezerwacji
            </button>
          </div>
        )}

        {/* ══ OFFER ACTIONS ══ */}
        {r.type === "OFFER" && (
          <div className="pt-4 border-t border-border space-y-2">
            {r.status === "PENDING" && (
              <button onClick={() => handleAction("convert", "Oferta skonwertowana")} disabled={isLoading("convert")}
                className="btn-bubble btn-primary-bubble w-full px-5 py-2.5 text-[13px] flex items-center justify-center gap-2">
                {isLoading("convert") ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} Akceptuj ofertę
              </button>
            )}
            {r.status !== "CANCELLED" && r.status !== "EXPIRED" && (
              <button onClick={() => setCancelConfirm(true)}
                className="btn-bubble w-full px-5 py-2.5 text-[13px] flex items-center justify-center gap-2 border-red-300 dark:border-red-700 text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20">
                <XCircle className="h-4 w-4" /> Anuluj ofertę
              </button>
            )}
            <button onClick={() => go("/admin/reservations/" + r.id)}
              className="btn-bubble btn-secondary-bubble w-full px-5 py-2.5 text-[13px] flex items-center justify-center gap-2">
              <ExternalLink className="h-4 w-4" /> Otwórz kartę rezerwacji
            </button>
          </div>
        )}

        {/* ══ BLOCK ══ */}
        {r.type === "BLOCK" && r.status !== "CANCELLED" && (
          <div className="pt-4 border-t border-border">
            <button onClick={() => setCancelConfirm(true)}
              className="btn-bubble btn-danger-bubble w-full px-5 py-2.5 text-[13px] flex items-center justify-center gap-2">
              <XCircle className="h-4 w-4" /> Usuń blokadę
            </button>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={cancelConfirm}
        onCancel={() => setCancelConfirm(false)}
        onConfirm={handleCancel}
        title={r.type === "BLOCK" ? "Usuń blokadę" : r.type === "OFFER" ? "Anuluj ofertę" : "Anuluj rezerwację"}
        message={r.type === "BLOCK" ? "Czy na pewno chcesz usunąć blokadę? Zasób zostanie zwolniony." : "Czy na pewno chcesz anulować? Zasoby zostaną zwolnione."}
        confirmLabel={r.type === "BLOCK" ? "Usuń" : "Anuluj"}
        variant="danger"
      />
    </SlidePanel>
  );
}

function Row({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
      <div className="min-w-0">
        {label && <div className="text-[11px] font-medium text-muted-foreground">{label}</div>}
        <div className="text-[13px] font-semibold mt-0.5">{value}</div>
      </div>
    </div>
  );
}
