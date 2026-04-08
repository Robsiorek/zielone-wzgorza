"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Search, Plus, Loader2, FileText, ChevronLeft, ChevronRight,
  Eye, Trash2, X, Calendar, Clock, Send,
  CheckCircle2, XCircle, AlertTriangle, Building2, User as UserIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api-fetch";
import { parseLocalDate } from "@/lib/dates";
import { formatMoneyMinor } from "@/lib/format";
import { BubbleSelect } from "@/components/ui/bubble-select";
import { OffersSkeleton } from "@/components/offers/offers-skeleton";
import { useToast } from "@/components/ui/toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Tooltip } from "@/components/ui/tooltip";
import { ReservationQuickPanel } from "@/components/ui/reservation-quick-panel";

interface OfferRow {
  id: string;
  number: string;
  type: string;
  status: string;
  paymentStatus: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  subtotal: number;
  total: number;
  source: string;
  createdAt: string;
  client: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    companyName: string | null;
    email: string | null;
    phone: string | null;
    type: string;
    clientNumber: string;
  } | null;
  items?: { resource: { id: string; name: string; unitNumber: string | null; category: { name: string; slug: string } } }[];
  offerDetails: {
    expiresAt: string | null;
    sentAt: string | null;
    viewedAt: string | null;
    acceptedAt: string | null;
  } | null;
}

const statusCfg: Record<string, { label: string; cls: string; icon: React.ElementType }> = {
  PENDING: { label: "Oczekująca", cls: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400", icon: Clock },
  CONFIRMED: { label: "Potwierdzona", cls: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400", icon: CheckCircle2 },
  EXPIRED: { label: "Wygasła", cls: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400", icon: AlertTriangle },
  CANCELLED: { label: "Anulowana", cls: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", icon: XCircle },
};

const sourceLbl: Record<string, string> = {
  EMAIL: "Email", PHONE: "Telefon", SOCIAL: "Social media", WEBSITE: "Strona www", OTHER: "Inne",
};

const statusOpts = [
  { value: "", label: "Wszystkie statusy" },
  { value: "PENDING", label: "Oczekująca" },
  { value: "CONFIRMED", label: "Potwierdzona" },
  { value: "EXPIRED", label: "Wygasła" },
  { value: "CANCELLED", label: "Anulowana" },
];

function formatDate(d: string): string {
  return parseLocalDate(d).toLocaleDateString("pl-PL", { day: "numeric", month: "short", year: "numeric" });
}

function formatMoney(v: number): string {
  return formatMoneyMinor(v);
}

function clientName(c: OfferRow["client"]): string {
  if (!c) return "Brak klienta";
  if (c.type === "COMPANY") return c.companyName || "Bez nazwy";
  return [c.firstName, c.lastName].filter(Boolean).join(" ") || "Bez nazwy";
}

function daysUntilExpiry(expiresAt: string | null): string | null {
  if (!expiresAt) return null;
  const diff = Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return "wygasła";
  if (diff === 0) return "wygasa dziś";
  return `${diff} dn.`;
}

export function OffersContent() {
  const router = useRouter();
  const { success, error: showError } = useToast();
  const [offers, setOffers] = useState<OfferRow[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [filtering, setFiltering] = useState(false);
  const [search, setSearch] = useState("");
  const [fStatus, setFStatus] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [selectedOffer, setSelectedOffer] = useState<OfferRow | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);

  const load = useCallback(async () => {
    setFiltering(true);
    const p = new URLSearchParams();
    p.set("type", "OFFER");
    if (search) p.set("search", search);
    if (fStatus) p.set("status", fStatus);
    p.set("page", String(page));
    p.set("limit", "20");
    try {
      const data = await apiFetch("/api/reservations?" + p.toString());
      setOffers(data.reservations || []);
      setTotal(data.pagination?.total || 0);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (e) { console.error(e); }
    setFiltering(false);
    setInitialLoading(false);
  }, [search, fStatus, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [search, fStatus]);

  const handleCancel = async () => {
    if (!cancelId) return;
    try {
      await apiFetch(`/api/reservations/${cancelId}/cancel`, {
        method: "POST",
        body: JSON.stringify({ cancelReason: "Anulowana z listy ofert" }),
      });
      success("Oferta anulowana");
      load();
    } catch (e: any) {
      showError(e.message);
    }
    setCancelId(null);
  };

  if (initialLoading) return <OffersSkeleton />;

  return (
    <div className="space-y-4 fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Oferty</h2>
          <p className="text-[13px] text-muted-foreground mt-1">{total} ofert</p>
        </div>
        <button onClick={() => router.push("/admin/offers/new")} className="btn-bubble btn-primary-bubble px-5 py-2.5 text-[13px] flex items-center gap-2">
          <Plus className="h-4 w-4" /> Nowa oferta
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input ref={searchRef} type="text" placeholder="Szukaj oferty..."
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

      {/* Table */}
      <div className="bubble overflow-x-auto relative">
        {filtering && (
          <div className="absolute inset-0 bg-card/60 z-10 flex items-center justify-center rounded-[20px]">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        )}
        {offers.length === 0 && !filtering ? (
          <div className="py-16 text-center">
            <FileText className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-[14px] font-medium text-muted-foreground">{search ? "Brak wyników" : "Brak ofert"}</p>
            <p className="text-[12px] text-muted-foreground/60 mt-1">Utwórz pierwszą ofertę klikając przycisk powyżej</p>
          </div>
        ) : (
          <table className="table-bubble w-full">
            <thead>
              <tr>
                <th className="text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-3 py-2.5">Nr</th>
                <th className="text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-3 py-2.5">Klient</th>
                <th className="text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-3 py-2.5 hidden md:table-cell">Termin</th>
                <th className="text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-3 py-2.5">Status</th>
                <th className="text-right text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-3 py-2.5 hidden lg:table-cell">Kwota</th>
                <th className="text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-3 py-2.5 hidden lg:table-cell">Zasoby</th>
                <th className="text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-3 py-2.5 hidden xl:table-cell">Wygasa</th>
                <th className="text-right text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-3 py-2.5">Akcje</th>
              </tr>
            </thead>
            <tbody>
              {offers.map(o => {
                const st = statusCfg[o.status] || statusCfg.PENDING;
                const StIcon = st.icon;
                const expiry = daysUntilExpiry(o.offerDetails?.expiresAt || null);

                return (
                  <tr key={o.id} className="border-t border-border/50 hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => { setSelectedOffer(o); setPanelOpen(true); }}>
                    <td className="px-3 py-3 text-[12px] text-muted-foreground font-mono">{o.number}</td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          {o.client?.type === "COMPANY"
                            ? <Building2 className="h-3.5 w-3.5 text-primary" />
                            : <UserIcon className="h-3.5 w-3.5 text-primary" />
                          }
                        </div>
                        <div className="min-w-0">
                          <div className="text-[13px] font-medium truncate">{clientName(o.client)}</div>
                          <div className="text-[11px] text-muted-foreground truncate">{o.client?.email || o.client?.phone || o.client?.clientNumber}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 hidden md:table-cell">
                      <div className="text-[12px]">{formatDate(o.checkIn)} → {formatDate(o.checkOut)}</div>
                      <div className="text-[11px] text-muted-foreground">{o.nights} {o.nights === 1 ? "noc" : o.nights < 5 ? "noce" : "nocy"}</div>
                    </td>
                    <td className="px-3 py-3">
                      <span className={cn("inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full", st.cls)}>
                        <StIcon className="h-3 w-3" />
                        {st.label}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right hidden lg:table-cell">
                      <div className="text-[13px] font-semibold">{formatMoney((o as any).totalMinor ?? Math.round(Number(o.total) * 100))}</div>
                      <div className="text-[11px] text-muted-foreground">{sourceLbl[o.source] || o.source}</div>
                    </td>
                    <td className="px-3 py-3 hidden lg:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {(o.items || []).slice(0, 2).map((r, i) => (
                          <span key={i} className="text-[9px] px-1.5 py-0.5 rounded-md bg-primary/10 text-primary font-bold tracking-wide">
                            {r.resource.unitNumber ? <>NR.&nbsp;{r.resource.unitNumber}</> : r.resource.name}
                          </span>
                        ))}
                        {(o.items || []).length > 2 && (
                          <Tooltip content={
                            (o.items || []).slice(2).map((r, i) => (
                              <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, padding: "3px 0" }}>
                                <span style={{ fontSize: 10, color: "hsl(220, 10%, 75%)" }}>{r.resource.name}</span>
                                {r.resource.unitNumber && <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 6, background: "hsl(214, 89%, 52%, 0.2)", color: "hsl(214, 89%, 75%)", letterSpacing: "0.04em" }}>NR. {r.resource.unitNumber}</span>}
                              </div>
                            ))
                          }>
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-semibold hover:bg-primary/10 hover:text-primary transition-colors">
                              +{(o.items || []).length - 2}
                            </span>
                          </Tooltip>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3 hidden xl:table-cell">
                      {expiry ? (
                        <span className={cn("text-[11px] font-medium", expiry === "wygasła" || expiry === "wygasa dziś" ? "text-destructive" : "text-muted-foreground")}>
                          <Clock className="h-3 w-3 inline mr-1" />{expiry}
                        </span>
                      ) : (
                        <span className="text-[11px] text-muted-foreground/50">—</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-right" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => { setSelectedOffer(o); setPanelOpen(true); }} className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-all" title="Podgląd">
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        {o.status === "PENDING" && (
                          <button onClick={() => setCancelId(o.id)} className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all" title="Anuluj">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
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

      {/* Cancel confirmation */}
      <ConfirmDialog
        open={!!cancelId}
        onCancel={() => setCancelId(null)}
        onConfirm={handleCancel}
        title="Anuluj ofertę"
        message="Czy na pewno chcesz anulować tę ofertę? Zasoby zostaną zwolnione."
        confirmLabel="Anuluj ofertę"
        variant="danger"
      />

      <ReservationQuickPanel
        reservation={selectedOffer}
        open={panelOpen}
        onClose={() => { setPanelOpen(false); setSelectedOffer(null); }}
        onRefresh={load}
      />
    </div>
  );
}
