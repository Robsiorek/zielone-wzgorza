"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Search, Loader2, Calendar, ChevronLeft, ChevronRight,
  X, Home, Clock, Users, Package, Plus, Moon,
  CheckCircle2, XCircle, AlertTriangle, User, Eye, ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api-fetch";
import { parseLocalDate } from "@/lib/dates";
import { formatMoneyMinor } from "@/lib/format";
import { BubbleSelect } from "@/components/ui/bubble-select";
import { UnitBadge } from "@/components/ui/unit-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip } from "@/components/ui/tooltip";
import { ReservationQuickPanel } from "@/components/ui/reservation-quick-panel";

interface ReservationRow {
  id: string;
  number: string;
  type: string;
  status: string;
  paymentStatus: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  total: number;
  totalMinor?: number;
  source: string;
  createdAt: string;
  client: {
    id: string; firstName: string | null; lastName: string | null;
    companyName: string | null; email: string | null; type: string; clientNumber: string;
  } | null;
  items?: { resource: { id: string; name: string; unitNumber: string | null; category: { name: string; slug: string } } }[];
  bookingDetails: { paidAmount: number; balanceDue: number; paidAmountMinor?: number; balanceDueMinor?: number; confirmedAt: string | null } | null;
}

const statusCfg: Record<string, { label: string; dot: string; badge: string; icon: React.ElementType }> = {
  PENDING: { label: "Oczekująca", dot: "bg-amber-400", badge: "bg-amber-500/15 text-amber-600 dark:text-amber-400", icon: Clock },
  CONFIRMED: { label: "Potwierdzona", dot: "bg-emerald-400", badge: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400", icon: CheckCircle2 },
  CANCELLED: { label: "Anulowana", dot: "bg-destructive", badge: "bg-destructive/15 text-destructive", icon: XCircle },
  EXPIRED: { label: "Wygasła", dot: "bg-amber-500", badge: "bg-amber-500/15 text-amber-600 dark:text-amber-400", icon: AlertTriangle },
};

const sourceLbl: Record<string, string> = {
  WEBSITE: "Strona www", BOOKING_COM: "Booking.com", AIRBNB: "Airbnb",
  PHONE: "Telefon", EMAIL: "E-mail", WALK_IN: "Na miejscu", SOCIAL: "Social media", OTHER: "Inne",
};

const statusOpts = [
  { value: "", label: "Wszystkie statusy" },
  { value: "PENDING", label: "Oczekująca" },
  { value: "CONFIRMED", label: "Potwierdzona" },
  { value: "CANCELLED", label: "Anulowana" },
];

function fmtDate(d: string): string {
  return parseLocalDate(d).toLocaleDateString("pl-PL", { day: "numeric", month: "short", year: "numeric" });
}
function fmtMoney(v: number): string {
  return formatMoneyMinor(v);
}
function clientName(c: ReservationRow["client"]): string {
  if (!c) return "Brak klienta";
  if (c.type === "COMPANY") return c.companyName || "Bez nazwy";
  return [c.firstName, c.lastName].filter(Boolean).join(" ") || "Bez nazwy";
}

function ReservationsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><Skeleton className="h-7 w-36 rounded-xl" /><Skeleton className="h-4 w-20 mt-2 rounded-lg" /></div>
      </div>
      <div className="flex items-center gap-3">
        <Skeleton className="h-11 flex-1 min-w-[200px] rounded-2xl" />
        <Skeleton className="h-11 w-[180px] rounded-2xl" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bubble p-4">
            <div className="flex items-start gap-3">
              <Skeleton className="h-2.5 w-2.5 rounded-full mt-1.5" />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Skeleton className="h-4 w-28 rounded" />
                  <Skeleton className="h-4 w-20 rounded-full" />
                </div>
                <div className="flex items-center gap-3">
                  <Skeleton className="h-3 w-32 rounded" />
                  <Skeleton className="h-3 w-36 rounded hidden sm:block" />
                  <Skeleton className="h-3 w-16 rounded" />
                </div>
              </div>
              <Skeleton className="h-4 w-20 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ReservationsContent() {
  const router = useRouter();
  const [reservations, setReservations] = useState<ReservationRow[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [filtering, setFiltering] = useState(false);
  const [search, setSearch] = useState("");
  const [fStatus, setFStatus] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const searchRef = useRef<HTMLInputElement>(null);
  const [selectedReservation, setSelectedReservation] = useState<ReservationRow | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);

  const load = useCallback(async () => {
    setFiltering(true);
    const p = new URLSearchParams();
    p.set("type", "BOOKING");
    if (search) p.set("search", search);
    if (fStatus) p.set("status", fStatus);
    p.set("page", String(page));
    p.set("limit", "20");
    try {
      const data = await apiFetch("/api/reservations?" + p.toString());
      setReservations(data.reservations || []);
      setTotal(data.pagination?.total || 0);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (e) { console.error(e); }
    setFiltering(false);
    setInitialLoading(false);
  }, [search, fStatus, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [search, fStatus]);

  if (initialLoading) return <ReservationsSkeleton />;

  return (
    <div className="space-y-4 fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Rezerwacje</h2>
          <p className="text-[13px] text-muted-foreground mt-1">{total} rezerwacji</p>
        </div>
        <button
          onClick={() => router.push("/admin/reservations/new")}
          className="btn-bubble btn-primary-bubble px-5 py-2.5 text-[13px] flex items-center gap-2"
        >
          <Plus className="h-4 w-4" /> Nowa rezerwacja
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input ref={searchRef} type="text" placeholder="Szukaj rezerwacji..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="input-bubble input-bubble-search h-11 w-full"
            style={search ? { paddingRight: 36 } : undefined} />
          {search && (
            <button onClick={() => { setSearch(""); searchRef.current?.focus(); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-muted-foreground/20 hover:text-foreground transition-all">
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
        <BubbleSelect options={statusOpts} value={fStatus} onChange={setFStatus} className="w-[180px]" />
      </div>

      {/* Table — same pattern as Clients */}
      <div className="bubble overflow-x-auto relative">
        {filtering && (
          <div className="absolute inset-0 bg-card/60 z-10 flex items-center justify-center rounded-[20px]">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        )}
        {reservations.length === 0 && !filtering ? (
          <div className="py-16 text-center">
            <Package className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-[14px] font-medium text-muted-foreground">{search ? "Brak wyników" : "Brak rezerwacji"}</p>
          </div>
        ) : (
          <table className="table-bubble w-full">
            <thead>
              <tr>
                <th className="text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-3 py-2.5">#</th>
                <th className="text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-3 py-2.5">Klient</th>
                <th className="text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-3 py-2.5 hidden md:table-cell">Termin</th>
                <th className="text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-3 py-2.5">Status</th>
                <th className="text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-3 py-2.5 hidden lg:table-cell">Zakwaterowanie</th>
                <th className="text-right text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-3 py-2.5">Kwota</th>
                <th className="text-right text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-3 py-2.5">Akcje</th>
              </tr>
            </thead>
            <tbody>
              {reservations.map(r => {
                const st = statusCfg[r.status] || statusCfg.PENDING;
                const StIcon = st.icon;
                const totalMinor = r.totalMinor ?? Math.round(Number(r.total) * 100);
                const balanceDue = r.bookingDetails?.balanceDueMinor ?? Math.round(Number(r.bookingDetails?.balanceDue || 0) * 100);
                const resourceNames = (r.items || []).map(i => i.resource.name);

                return (
                  <tr key={r.id} className="border-t border-border/50 hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => { setSelectedReservation(r); setPanelOpen(true); }}>
                    <td className="px-3 py-3">
                      <div className="text-[12px] text-muted-foreground font-mono">{r.number}</div>
                      <div className="text-[10px] text-muted-foreground">{sourceLbl[r.source] || r.source}</div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <User className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-[13px] font-medium truncate">{clientName(r.client)}</div>
                          {r.client?.email && <div className="text-[11px] text-muted-foreground truncate">{r.client.email}</div>}
                          <div className="text-[11px] text-muted-foreground md:hidden mt-0.5">
                            {fmtDate(r.checkIn)} → {fmtDate(r.checkOut)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 hidden md:table-cell">
                      <div className="text-[12px]">{fmtDate(r.checkIn)} → {fmtDate(r.checkOut)}</div>
                      <div className="text-[11px] text-muted-foreground">{r.nights} {r.nights === 1 ? "noc" : r.nights < 5 ? "noce" : "nocy"}</div>
                    </td>
                    <td className="px-3 py-3">
                      <span className={cn("inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full", st.badge)}>
                        <StIcon className="h-3 w-3" />{st.label}
                      </span>
                    </td>
                    <td className="px-3 py-3 hidden lg:table-cell">
                      <div className="text-[12px]">{resourceNames.length > 0 ? resourceNames[0] : "—"}</div>
                      {resourceNames.length > 1 && <div className="text-[11px] text-muted-foreground">+{resourceNames.length - 1} więcej</div>}
                    </td>
                    <td className="px-3 py-3 text-right">
                      <div className="text-[13px] font-bold">{fmtMoney(totalMinor)}</div>
                      {balanceDue > 0 && <div className="text-[10px] text-amber-600 font-medium">Do zapłaty: {fmtMoney(balanceDue)}</div>}
                    </td>
                    <td className="px-3 py-3 text-right" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <Tooltip content="Podgląd">
                        <button onClick={() => { setSelectedReservation(r); setPanelOpen(true); }}
                          className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-all">
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        </Tooltip>
                        <Tooltip content="Szczegóły">
                        <button onClick={() => router.push(`/admin/reservations/${r.id}`)}
                          className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-all">
                          <ExternalLink className="h-3.5 w-3.5" />
                        </button>
                        </Tooltip>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-[12px] text-muted-foreground">
          <span>Strona {page} z {totalPages}</span>
          <div className="flex gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-bubble btn-secondary-bubble px-3 py-1.5 text-[11px] disabled:opacity-30"><ChevronLeft className="h-3.5 w-3.5" /></button>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn-bubble btn-secondary-bubble px-3 py-1.5 text-[11px] disabled:opacity-30"><ChevronRight className="h-3.5 w-3.5" /></button>
          </div>
        </div>
      )}

      <ReservationQuickPanel
        reservation={selectedReservation}
        open={panelOpen}
        onClose={() => { setPanelOpen(false); setSelectedReservation(null); }}
        onRefresh={load}
      />
    </div>
  );
}
