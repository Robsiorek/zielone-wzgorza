"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar, Clock, Home, FileText, Phone, Mail,
  ExternalLink, Building2, User as UserIcon,
  Package, AlertTriangle, Trash2, Loader2, Pencil,
  CheckCircle2, XCircle, UserCheck, UserX,
  ArrowRight, BedDouble, DollarSign, ArrowLeftRight,
  ChevronDown, Send, Receipt, MapPin,
  Moon, Hash, Users, Sparkles, Info, LogIn,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api-fetch";
import { SlidePanel } from "@/components/ui/slide-panel";
import { UnitBadge } from "@/components/ui/unit-badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import type { TimelineEntry } from "@/components/calendar/calendar-content";
import { parseLocalDate } from "@/lib/dates";
import { formatMoneyMinor } from "@/lib/format";
import { useReservationPayments } from "@/components/payments/use-reservation-payments";
import { PaymentSummary } from "@/components/payments/payment-summary";
import { PaymentList } from "@/components/payments/payment-list";
import { PaymentPanel } from "@/components/payments/payment-panel";

interface Props {
  entry: TimelineEntry | null;
  open: boolean;
  onClose: () => void;
  onRefresh: () => void;
  onEdit?: (reservationId: string) => void;
  onConvertBlock?: (reservationId: string) => void;
  refreshKey?: number;
}

function fmtDate(d: string): string { return parseLocalDate(d).toLocaleDateString("pl-PL", { weekday: "short", day: "numeric", month: "long" }); }
function fmtDay(d: string): string { return parseLocalDate(d).toLocaleDateString("pl-PL", { day: "numeric" }); }
function fmtMonth(d: string): string { return parseLocalDate(d).toLocaleDateString("pl-PL", { month: "short" }).replace(".", ""); }
function fmtWeekday(d: string): string { return parseLocalDate(d).toLocaleDateString("pl-PL", { weekday: "short" }); }
function fmtMoney(v: number | string): string { return formatMoneyMinor(Number(v)); }
function nightCount(s: string, e: string): number { return Math.round((parseLocalDate(e).getTime() - parseLocalDate(s).getTime()) / (1000 * 60 * 60 * 24)); }
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
const SOURCE_LBL: Record<string, string> = {
  PHONE: "Telefon", EMAIL: "E-mail", WEBSITE: "Strona www", WALK_IN: "Na miejscu",
  BOOKING_COM: "Booking.com", SOCIAL: "Social media", FRONT: "Widget", OTHER: "Inne",
};

export function CalendarDetailPanel({ entry, open, onClose, onRefresh, onEdit, onConvertBlock, refreshKey }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [cancelConfirm, setCancelConfirm] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [fullData, setFullData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [expandedItem, setExpandedItem] = useState<number | null>(null);
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [paymentPanelOpen, setPaymentPanelOpen] = useState(false);

  // C2: Payment data for Rozliczenia section
  const payHook = useReservationPayments(
    open && entry?.reservationId && entry?.type === "BOOKING" ? entry.reservationId : null
  );

  useEffect(() => {
    if (!open || !entry?.reservationId) { setFullData(null); setExpandedItem(null); return; }
    setLoading(true);
    apiFetch(`/api/reservations/${entry.reservationId}`)
      .then((data: any) => setFullData(data.reservation))
      .catch(() => {})
      .finally(() => setLoading(false));
    // C2 fix: refresh payment data too (payHook has fetchedRef guard, so force it)
    payHook.refresh();
  }, [open, entry?.reservationId, refreshKey]);

  useEffect(() => {
    if (!notifyOpen) return;
    const close = () => setNotifyOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [notifyOpen]);

  if (!entry) return null;

  const tc = TYPE_CFG[entry.type] || TYPE_CFG.BOOKING;
  const TypeIcon = tc.icon;
  const r = fullData;
  const number = r?.number || entry.reservation?.number || "";
  const status = r?.status || entry.reservation?.status || "";
  const sc = STATUS_CFG[status];
  const payStatus = r?.paymentStatus || entry.reservation?.paymentStatus;
  const pc = payStatus ? PAY_CFG[payStatus] : null;
  const isCheckedIn = r?.bookingDetails?.checkedInAt;
  const isOverdue = r?.overdue || entry.reservation?.overdue;
  const needsAttn = r?.requiresAttention || entry.reservation?.requiresAttention;
  const client = r?.client || entry.reservation?.client;
  const items: any[] = r?.items || [];
  const allAddons: any[] = r?.addons || [];
  const globalAddons = allAddons.filter((a: any) => !a.reservationItemId);
  const itemAddonsMap = new Map<string, any[]>();
  for (const a of allAddons) {
    if (a.reservationItemId) {
      const list = itemAddonsMap.get(a.reservationItemId) || [];
      list.push(a);
      itemAddonsMap.set(a.reservationItemId, list);
    }
  }
  const nights = nightCount(entry.startAt, entry.endAt);
  const today = todayMidnight();
  const ciDate = new Date(entry.startAt); ciDate.setHours(0, 0, 0, 0);
  const coDate = new Date(entry.endAt); coDate.setHours(0, 0, 0, 0);
  const canCheckIn = today >= ciDate;
  const canNoShow = today >= ciDate && today < coDate;
  const totalAmount = r?.totalMinor || Number(r?.total || entry.reservation?.total || 0) * 100;
  const paidAmount = r?.bookingDetails?.paidAmountMinor || Number(r?.bookingDetails?.paidAmount || 0) * 100;
  const balanceDue = r?.bookingDetails?.balanceDueMinor || Number(r?.bookingDetails?.balanceDue || 0) * 100;
  const depositRequired = r?.requiredDepositMinor || Math.round(totalAmount * 0.3);
  const paidPercent = totalAmount > 0 ? Math.min(100, Math.round((paidAmount / totalAmount) * 100)) : 0;

  const act = async (endpoint: string, msg: string) => {
    if (!entry.reservationId || actionLoading) return;
    setActionLoading(endpoint);
    try {
      await apiFetch(`/api/reservations/${entry.reservationId}/${endpoint}`, { method: "POST" });
      toast.success(msg);
      onClose(); onRefresh();
    } catch (e: any) { toast.error(e.message || "Wystąpił błąd"); }
    setActionLoading(null);
  };

  const handleCancel = async () => {
    if (!entry.reservationId) return;
    setActionLoading("cancel");
    try {
      await apiFetch(`/api/reservations/${entry.reservationId}/cancel`, {
        method: "POST", body: JSON.stringify({ cancelReason: entry.type === "BLOCK" ? "Blokada usunięta" : "Anulowano" }),
      });
      toast.success(entry.type === "BLOCK" ? "Blokada usunięta" : "Anulowano");
      setCancelConfirm(false); onClose(); onRefresh();
    } catch (e: any) { toast.error(e.message || "Błąd"); }
    setActionLoading(null);
  };

  const isL = (a: string) => actionLoading === a;
  const go = (path: string) => { router.push(path); onClose(); };

  const panelTitle = (
    <div className="flex items-center gap-3">
      <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center shrink-0", tc.cls)}>
        <TypeIcon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[14px] font-bold">{tc.label}</div>
        {number && <div className="text-[12px] text-muted-foreground font-mono">{number}</div>}
      </div>
    </div>
  );

  return (
    <SlidePanel open={open} onClose={onClose} title={panelTitle}>
      <div className="pb-2">

        {/* 1. KLIENT */}
        {client && entry.type !== "BLOCK" && (
          <div className="pt-1 pb-5 border-b border-border">
            <div className="flex items-center justify-between mb-3">
              <SH icon={UserIcon}>Klient</SH>
              <div className="relative" onMouseDown={(e) => e.stopPropagation()}>
                <button onClick={() => setNotifyOpen(!notifyOpen)}
                  className="text-[11px] font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-muted/50">
                  <Send className="h-3 w-3" /> Powiadom klienta <ChevronDown className={cn("h-3 w-3 transition-transform", notifyOpen && "rotate-180")} />
                </button>
                {notifyOpen && (
                  <div className="absolute right-0 top-full mt-1 bg-card border-2 border-border rounded-2xl z-30 min-w-[220px] py-2 px-2"
                    style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
                    {[
                      { icon: Receipt, label: "Prośba o wpłatę" },
                      { icon: DollarSign, label: "Prośba o dopłatę" },
                      { icon: FileText, label: "Stan rezerwacji" },
                      { icon: MapPin, label: "Instrukcja dojazdu" },
                    ].map(({ icon: I, label }) => (
                      <button key={label} onClick={() => { toast.error("Moduł komunikacji — wkrótce"); setNotifyOpen(false); }}
                        className="w-full text-left px-3 py-2.5 hover:bg-muted/50 transition-colors flex items-center gap-3 text-[13px] rounded-xl">
                        <I className="h-4 w-4 text-muted-foreground" />{label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                {client.companyName ? <Building2 className="h-4 w-4 text-primary" /> : <UserIcon className="h-4 w-4 text-primary" />}
              </div>
              <div className="min-w-0 flex-1">
                <button onClick={() => go("/admin/clients/" + client.id)}
                  className="text-[14px] font-bold hover:text-primary transition-colors text-left block truncate">
                  {client.companyName || [client.firstName, client.lastName].filter(Boolean).join(" ") || "Brak danych"}
                </button>
                {client.companyName && (client.contactFirstName || client.contactLastName) && (
                  <div className="text-[12px] text-muted-foreground">{[client.contactFirstName, client.contactLastName].filter(Boolean).join(" ")}</div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4 mt-2.5 ml-[52px]">
              {client.phone && (
                <a href={"tel:" + client.phone} className="text-[12px] text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5">
                  <Phone className="h-3 w-3" />{client.phone}
                </a>
              )}
              {client.email && (
                <a href={"mailto:" + client.email} className="text-[12px] text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5 truncate">
                  <Mail className="h-3 w-3 shrink-0" /><span className="truncate">{client.email}</span>
                </a>
              )}
            </div>
          </div>
        )}

        {/* STATUS + PAYMENT BOXES */}
        {entry.type !== "BLOCK" && <Section>
          <div className="flex items-center gap-3">
            <div className="flex-1 rounded-2xl border-2 border-border p-3 text-center">
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Status rezerwacji</div>
              {sc && <span className={cn("text-[11px] font-semibold px-3 py-1 rounded-full inline-block", sc.cls)}>{sc.label}</span>}
            </div>
            {entry.type === "BOOKING" && (
              <div className="flex-1 rounded-2xl border-2 border-border p-3 text-center">
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Płatność</div>
                {pc && <span className={cn("text-[11px] font-semibold px-3 py-1 rounded-full inline-block", pc.cls)}>{pc.label}</span>}
              </div>
            )}
          </div>
          {(isCheckedIn || isOverdue || needsAttn) && (
            <div className="flex items-center gap-2 flex-wrap mt-3">
              {isCheckedIn && <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-500 text-white">✓ Zameldowany</span>}
              {isOverdue && <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-red-500 text-white">! Po terminie</span>}
              {needsAttn && <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-amber-500 text-white">⚠ Wymaga uwagi</span>}
            </div>
          )}
        </Section>}

        {/* 2. ZAMELDOWANIE */}
        {entry.type === "BOOKING" && (status === "CONFIRMED" || status === "NO_SHOW") && (
          <Section>
            <SH icon={LogIn}>Zameldowanie</SH>
            <div className="flex items-center gap-3">
              <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
                isCheckedIn ? "bg-emerald-500" : status === "NO_SHOW" ? "bg-red-500" : "bg-muted"
              )}>
                {isCheckedIn ? <UserCheck className="h-4 w-4 text-white" />
                  : status === "NO_SHOW" ? <UserX className="h-4 w-4 text-white" />
                  : <BedDouble className="h-4 w-4 text-muted-foreground" />}
              </div>
              <div>
                <div className={cn("text-[13px] font-semibold",
                  isCheckedIn ? "text-emerald-700 dark:text-emerald-400"
                    : status === "NO_SHOW" ? "text-red-700 dark:text-red-400" : ""
                )}>
                  {isCheckedIn ? "Zameldowany" : status === "NO_SHOW" ? "Gość się nie stawił" : "Niezameldowany"}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {isCheckedIn
                    ? new Date(isCheckedIn).toLocaleDateString("pl-PL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
                    : !canCheckIn ? "Możliwe od: " + fmtDate(entry.startAt) : "Oczekuje na zameldowanie"}
                </div>
              </div>
            </div>
          </Section>
        )}

        {/* 3. TERMIN */}
        <Section>
          <SH icon={Calendar}>Termin</SH>
          <div className="flex items-center">
            <div className="flex-1 text-center">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Przyjazd</div>
              <div className="text-[26px] font-bold leading-none mt-1">{fmtDay(entry.startAt)}</div>
              <div className="text-[12px] text-muted-foreground">{fmtMonth(entry.startAt)}, {fmtWeekday(entry.startAt)}</div>
              <div className="text-[11px] font-medium text-primary mt-0.5">od 15:00</div>
            </div>
            <div className="flex flex-col items-center px-3">
              <div className="text-[20px] font-bold text-primary">{nights}</div>
              <div className="text-[9px] text-muted-foreground uppercase">{nights === 1 ? "noc" : nights < 5 ? "noce" : "nocy"}</div>
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/30 mt-0.5" />
            </div>
            <div className="flex-1 text-center">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Wyjazd</div>
              <div className="text-[26px] font-bold leading-none mt-1">{fmtDay(entry.endAt)}</div>
              <div className="text-[12px] text-muted-foreground">{fmtMonth(entry.endAt)}, {fmtWeekday(entry.endAt)}</div>
              <div className="text-[11px] font-medium text-destructive mt-0.5">do 11:00</div>
            </div>
          </div>
        </Section>

        {/* 4. ZASOBY */}
        <Section>
          <SH icon={Home}>Zasoby</SH>
          {loading ? (
            <div className="flex items-center gap-2 text-[12px] text-muted-foreground"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Ładowanie...</div>
          ) : items.length > 0 ? (
            <div className="space-y-2">
              {items.map((item: any, i: number) => {
                const expanded = expandedItem === i;
                const itemNights = nightCount(item.startAt, item.endAt);
                return (
                  <div key={i} className="rounded-2xl border-2 border-border overflow-hidden transition-colors hover:border-primary/20">
                    <button onClick={() => setExpandedItem(expanded ? null : i)}
                      className="w-full text-left p-3 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <Home className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div>
                          <div className="text-[13px] font-semibold">{item.resource?.name || "Zasób"}</div>
                          <div className="flex items-center gap-2 mt-0.5">
                            {item.resource?.unitNumber && <UnitBadge number={item.resource.unitNumber} size="sm" />}
                            {item.quantity > 1 && <span className="text-[10px] text-muted-foreground">x{item.quantity}</span>}
                            {item.adults > 0 && <span className="text-[10px] text-muted-foreground">{item.adults} os.</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {((item.totalPriceMinor ?? Number(item.totalPrice) * 100) > 0) && <span className="text-[13px] font-bold">{fmtMoney(item.totalPriceMinor ?? Math.round(Number(item.totalPrice) * 100))}</span>}
                        <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform duration-200", expanded && "rotate-180")} />
                      </div>
                    </button>
                    <div className={cn("grid transition-all duration-200 ease-in-out", expanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0")}>
                      <div className="overflow-hidden">
                        <div className="px-3 pb-3 pt-1 border-t border-border/50 space-y-2">
                          <DetailLine icon={DollarSign} label="Cena za jednostkę" value={fmtMoney(item.pricePerUnitMinor ?? Math.round(Number(item.pricePerUnit) * 100))} />
                          {item.categoryType === "ACCOMMODATION" && itemNights > 0 && (
                            <DetailLine icon={Moon} label="Liczba nocy" value={String(itemNights)} />
                          )}
                          {item.quantity > 1 && (
                            <DetailLine icon={Hash} label="Ilość" value={item.quantity + " szt."} />
                          )}
                          {item.adults > 0 && (
                            <DetailLine icon={Users} label="Osoby" value={item.adults + " dorosłych" + (item.children > 0 ? ", " + item.children + " dzieci" : "")} />
                          )}
                          <div className="flex justify-between text-[12px] pt-1.5 border-t border-border/30">
                            <span className="font-semibold text-muted-foreground">Suma pozycji</span>
                            <span className="font-bold">{fmtMoney(item.totalPriceMinor ?? Math.round(Number(item.totalPrice) * 100))}</span>
                          </div>
                          {/* Per-item addons (udogodnienia) */}
                          {(() => {
                            const itemAddons = itemAddonsMap.get(item.id) || [];
                            if (itemAddons.length === 0) return null;
                            return (
                              <div className="pt-1.5 space-y-1">
                                <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Udogodnienia</div>
                                {itemAddons.map((addon: any, ai: number) => (
                                  <div key={ai} className="flex items-center justify-between text-[12px]">
                                    <span className="text-muted-foreground flex items-center gap-1.5">
                                      <Package className="h-3 w-3" />
                                      {addon.snapshotName}
                                      {addon.quantity > 1 && <span className="text-[10px]">×{addon.quantity}</span>}
                                    </span>
                                    <span className="font-medium">{fmtMoney(addon.totalMinor ?? Math.round(Number(addon.total) * 100))}</span>
                                  </div>
                                ))}
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              {entry.type !== "BLOCK" && r && ((r.totalMinor ?? Number(r.total) * 100) > 0) && (
                <div className="pt-2 space-y-1">
                  {/* Global addons */}
                  {globalAddons.length > 0 && (
                    <React.Fragment>
                      <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider pt-1">Globalne opłaty i dodatki</div>
                      {globalAddons.map((addon: any, i: number) => (
                        <div key={i} className="flex items-center justify-between text-[12px]">
                          <span className="text-muted-foreground flex items-center gap-1.5">
                            <Package className="h-3 w-3" />
                            {addon.snapshotName}
                            {addon.quantity > 1 && <span className="text-[10px]">×{addon.quantity}</span>}
                          </span>
                          <span className="font-medium">{fmtMoney(addon.totalMinor ?? Math.round(Number(addon.total) * 100))}</span>
                        </div>
                      ))}
                    </React.Fragment>
                  )}
                  {/* Per-item addons total */}
                  {allAddons.filter((a: any) => a.reservationItemId).length > 0 && (
                    <div className="flex items-center justify-between text-[12px]">
                      <span className="text-muted-foreground">Udogodnienia (łącznie)</span>
                      <span className="font-medium">{fmtMoney(allAddons.filter((a: any) => a.reservationItemId).reduce((s: number, a: any) => s + (a.totalMinor ?? Math.round(Number(a.total) * 100)), 0))}</span>
                    </div>
                  )}
                  {((r.discountMinor ?? Number(r.discount) * 100) > 0) && (
                    <React.Fragment>
                      <div className="flex justify-between text-[12px] text-muted-foreground"><span>Suma noclegów</span><span>{fmtMoney(r.subtotalMinor ?? Math.round(Number(r.subtotal) * 100))}</span></div>
                      <div className="flex justify-between text-[12px] text-primary"><span>Rabat</span><span>-{fmtMoney(r.discountMinor ?? Math.round(Number(r.discount) * 100))}</span></div>
                    </React.Fragment>
                  )}
                  <div className="flex justify-between text-[14px] font-bold"><span>Razem</span><span>{fmtMoney(r.totalMinor ?? Math.round(Number(r.total) * 100))}</span></div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <Home className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-[13px] font-medium">{entry.resource.name}</span>
              {entry.resource.unitNumber && <UnitBadge number={entry.resource.unitNumber} size="sm" />}
            </div>
          )}
        </Section>

        {/* 5. SPRZĄTANIE */}
        {entry.type === "BOOKING" && (
          <Section>
            <div className="flex items-center justify-between">
              <SH icon={Sparkles} noPad>Sprzątanie</SH>
              <span className="text-[10px] text-muted-foreground/40">wkrótce</span>
            </div>
          </Section>
        )}

        {/* 6. ROZLICZENIA — C2: shared components */}
        {entry.type === "BOOKING" && r && totalAmount > 0 && (
          <Section>
            <div className="flex items-center justify-between mb-3">
              <SH icon={DollarSign} noPad>Rozliczenia</SH>
              {pc && <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", pc.cls)}>{pc.label}</span>}
            </div>

            {/* Summary (compact mode) */}
            {payHook.summary ? (
              <PaymentSummary summary={payHook.summary} compact />
            ) : (
              <div className="space-y-2">
                <div className="flex justify-between text-[13px]"><span className="text-muted-foreground">Koszt całkowity</span><span className="font-bold">{fmtMoney(totalAmount)}</span></div>
                <div className="flex justify-between text-[13px]"><span className="text-muted-foreground">Wpłaty przyjęte</span><span className="font-semibold text-emerald-600 dark:text-emerald-400">{fmtMoney(paidAmount)}</span></div>
              </div>
            )}

            {isOverdue && (
              <div className="flex items-center gap-1.5 text-[11px] text-red-600 dark:text-red-400 font-medium mt-2">
                <AlertTriangle className="h-3 w-3" /> Termin płatności minął
              </div>
            )}

            {/* Last 3 payments */}
            {payHook.payments.length > 0 && (
              <div className="mt-3 pt-3 border-t border-border/50">
                <div className="text-[12px] font-semibold text-muted-foreground mb-2">Ostatnie operacje</div>
                <PaymentList
                  payments={payHook.payments}
                  compact={3}
                  actionLoading={payHook.actionLoading}
                  onConfirm={async (id) => { await payHook.confirm(id); onRefresh?.(); }}
                  onReject={async (id, reason) => { await payHook.reject(id, reason); onRefresh?.(); }}
                />
              </div>
            )}

            {/* CTA: Otwórz pełne rozliczenia */}
            <button
              onClick={() => setPaymentPanelOpen(true)}
              className="btn-bubble btn-primary-bubble w-full mt-3 h-9 text-[12px] font-semibold flex items-center justify-center gap-2"
            >
              <DollarSign className="h-3.5 w-3.5" />
              {payHook.payments.length > 0 ? "Pokaż wszystkie rozliczenia" : "Dodaj wpłatę"}
            </button>
          </Section>
        )}

        {/* PaymentPanel (always rendered for closing animation) */}
        <PaymentPanel
          reservationId={entry.reservationId}
          open={paymentPanelOpen}
          onClose={() => setPaymentPanelOpen(false)}
          onMutate={() => { payHook.refresh(); onRefresh?.(); }}
        />

        {/* 7. POZOSTAŁE */}
        {entry.type !== "BLOCK" && r && (r.source || r.guestNotes || r.internalNotes) && (
          <Section>
            <SH icon={FileText}>Pozostałe</SH>
            <div className="space-y-3">
              {r.source && (
                <div className="flex justify-between text-[13px]"><span className="text-muted-foreground">Źródło</span><span className="font-medium">{SOURCE_LBL[r.source] || r.source}</span></div>
              )}
              {r.guestNotes && (
                <div>
                  <div className="text-[11px] text-muted-foreground mb-1">Uwagi gościa</div>
                  <div className="text-[13px]">{r.guestNotes}</div>
                </div>
              )}
              {r.internalNotes && (
                <div>
                  <div className="text-[11px] text-muted-foreground mb-1">Notatka wewnętrzna</div>
                  <div className="text-[13px]">{r.internalNotes}</div>
                </div>
              )}
            </div>
          </Section>
        )}

        {entry.type === "BLOCK" && (entry.label || entry.note) && (
          <Section>
            <SH icon={Info}>Informacje</SH>
            {entry.label && <div className="text-[13px] font-semibold">{entry.label}</div>}
            {entry.note && <div className="text-[13px] mt-1">{entry.note}</div>}
          </Section>
        )}

        {/* AKCJE */}
        <div className="pt-5 space-y-2">
          {entry.type === "BOOKING" && entry.reservationId && (
            <React.Fragment>
              {status === "CONFIRMED" && !isCheckedIn && (
                <button onClick={() => { if (!canCheckIn) { toast.error("Zameldowanie możliwe od dnia rozpoczęcia rezerwacji"); return; } act("check-in", "Zameldowano gościa"); }}
                  disabled={!!actionLoading}
                  className={cn("w-full flex items-center justify-center gap-2 rounded-full px-5 py-3 text-[13px] font-semibold text-white bg-purple-600 hover:bg-purple-700 transition-all disabled:opacity-50", !canCheckIn && "opacity-40")}
                  style={{ border: "2px solid transparent" }}>
                  {isL("check-in") ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserCheck className="h-4 w-4" />} Zamelduj gościa
                </button>
              )}
              {status === "CONFIRMED" && !isCheckedIn && (
                <button onClick={() => { if (!canNoShow) { toast.error("Niestawienie możliwe od dnia rozpoczęcia rezerwacji"); return; } act("no-show", "Oznaczono niestawienie"); }}
                  disabled={!!actionLoading}
                  className={cn("btn-bubble btn-secondary-bubble w-full px-5 py-2.5 text-[13px] flex items-center justify-center gap-2", !canNoShow && "opacity-40")}>
                  {isL("no-show") ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserX className="h-4 w-4" />} Klient nie stawił się
                </button>
              )}
              {status === "NO_SHOW" && (
                <button onClick={() => act("check-in", "Zameldowano (cofnięto niestawienie)")} disabled={!!actionLoading}
                  className="w-full flex items-center justify-center gap-2 rounded-full px-5 py-3 text-[13px] font-semibold text-white bg-purple-600 hover:bg-purple-700 transition-all disabled:opacity-50"
                  style={{ border: "2px solid transparent" }}>
                  {isL("check-in") ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserCheck className="h-4 w-4" />} Zamelduj (cofnij niestawienie)
                </button>
              )}
              {status === "PENDING" && (
                <button onClick={() => act("confirm", "Rezerwacja potwierdzona")} disabled={!!actionLoading}
                  className="btn-bubble btn-primary-bubble w-full px-5 py-2.5 text-[13px] flex items-center justify-center gap-2">
                  {isL("confirm") ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} Potwierdź rezerwację
                </button>
              )}
              {status === "CANCELLED" && (
                <button onClick={() => act("restore", "Rezerwacja przywrócona")} disabled={!!actionLoading}
                  className="btn-bubble btn-primary-bubble w-full px-5 py-2.5 text-[13px] flex items-center justify-center gap-2">
                  {isL("restore") ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} Przywróć rezerwację
                </button>
              )}
              {onEdit && !["CANCELLED", "FINISHED"].includes(status) && (
                <button onClick={() => onEdit(entry.reservationId!)}
                  className="btn-bubble btn-secondary-bubble w-full px-5 py-2.5 text-[13px] flex items-center justify-center gap-2">
                  <Pencil className="h-4 w-4" /> Edytuj rezerwację
                </button>
              )}
              {!["CANCELLED", "FINISHED"].includes(status) && (
                <button onClick={() => setCancelConfirm(true)}
                  className="btn-bubble btn-danger-bubble w-full px-5 py-2.5 text-[13px] flex items-center justify-center gap-2">
                  <XCircle className="h-4 w-4" /> Anuluj rezerwację
                </button>
              )}
            </React.Fragment>
          )}
          {entry.type === "OFFER" && entry.reservationId && (
            <React.Fragment>
              {status === "PENDING" && (
                <button onClick={() => act("convert", "Oferta skonwertowana")} disabled={!!actionLoading}
                  className="btn-bubble btn-primary-bubble w-full px-5 py-2.5 text-[13px] flex items-center justify-center gap-2">
                  {isL("convert") ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} Akceptuj ofertę
                </button>
              )}
              {!["CANCELLED", "EXPIRED"].includes(status) && (
                <button onClick={() => setCancelConfirm(true)}
                  className="btn-bubble btn-danger-bubble w-full px-5 py-2.5 text-[13px] flex items-center justify-center gap-2">
                  <XCircle className="h-4 w-4" /> Anuluj ofertę
                </button>
              )}
            </React.Fragment>
          )}
          {entry.type === "BLOCK" && status !== "CANCELLED" && onConvertBlock && (
            <button onClick={() => onConvertBlock(entry.reservationId!)}
              className="btn-bubble btn-primary-bubble w-full px-5 py-2.5 text-[13px] flex items-center justify-center gap-2">
              <ArrowLeftRight className="h-4 w-4" /> Zamień na rezerwację lub ofertę
            </button>
          )}
          {entry.type === "BLOCK" && status !== "CANCELLED" && (
            <button onClick={() => setCancelConfirm(true)}
              className="btn-bubble btn-danger-bubble w-full px-5 py-2.5 text-[13px] flex items-center justify-center gap-2">
              <Trash2 className="h-4 w-4" /> Usuń blokadę
            </button>
          )}
          {entry.reservationId && entry.type !== "BLOCK" && (
            <button onClick={() => go("/admin/reservations/" + entry.reservationId)}
              className="btn-bubble btn-secondary-bubble w-full px-5 py-2.5 text-[13px] flex items-center justify-center gap-2">
              <ExternalLink className="h-4 w-4" /> Otwórz kartę rezerwacji
            </button>
          )}
        </div>
      </div>

      <ConfirmDialog open={cancelConfirm} onCancel={() => setCancelConfirm(false)} onConfirm={handleCancel}
        title={entry.type === "BLOCK" ? "Usuń blokadę" : entry.type === "OFFER" ? "Anuluj ofertę" : "Anuluj rezerwację"}
        message={entry.type === "BLOCK" ? "Usunąć blokadę \"" + (entry.label || "Blokada") + "\"?" : "Anulować? Zasoby zostaną zwolnione."}
        confirmLabel={entry.type === "BLOCK" ? "Usuń" : "Anuluj"} variant="danger" />
    </SlidePanel>
  );
}

function Section({ children }: { children: React.ReactNode }) {
  return <div className="py-6 border-b border-border last:border-0 first:pt-2">{children}</div>;
}

function SH({ children, icon: Icon, noPad }: { children: React.ReactNode; icon?: React.ElementType; noPad?: boolean }) {
  return (
    <h3 className={cn("flex items-center gap-2 text-[14px] font-semibold", !noPad && "mb-3")}>
      {Icon && <Icon className="h-4 w-4 text-primary" />}
      {children}
    </h3>
  );
}

function DetailLine({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-[12px]">
      <span className="flex items-center gap-2 text-muted-foreground"><Icon className="h-3 w-3" />{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}
