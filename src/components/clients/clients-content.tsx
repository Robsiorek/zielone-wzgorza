"use client";
import React, { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, Loader2, Users, ChevronLeft, ChevronRight, Building2, User as UserIcon, Eye, Pencil, X } from "lucide-react";
import { BubbleSelect } from "@/components/ui/bubble-select";
import { apiFetch } from "@/lib/api-fetch";
import { ClientsSkeleton } from "@/components/ui/skeleton";
import { Tooltip } from "@/components/ui/tooltip";

interface ClientRow {
  id: string; clientNumber: string; type: string; status: string; segment: string;
  firstName: string | null; lastName: string | null; companyName: string | null;
  contactFirstName: string | null; contactLastName: string | null;
  email: string | null; phone: string | null; city: string | null; country: string;
  source: string; lastActivityAt: string | null; createdAt: string;
  tags: { tag: { id: string; name: string; color: string | null } }[];
  assignedUser: { firstName: string; lastName: string } | null;
  _count: { bookings: number; offers: number };
}

const statusCfg: Record<string, { label: string; cls: string }> = {
  LEAD: { label: "Lead", cls: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" },
  ACTIVE: { label: "Aktywny", cls: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
  VIP: { label: "VIP", cls: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400" },
  ARCHIVED: { label: "Archiwalny", cls: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400" },
  BLOCKED: { label: "Zablokowany", cls: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
};
const segLbl: Record<string, string> = { STANDARD: "Standard", REGULAR: "Stały", VIP: "VIP", CORPORATE: "Firma", GROUP: "Grupa" };
const typeOpts = [{ value: "", label: "Wszystkie typy" },{ value: "INDIVIDUAL", label: "Osoba prywatna" },{ value: "COMPANY", label: "Firma" },{ value: "GROUP", label: "Grupa" }];
const statusOpts = [{ value: "", label: "Wszystkie statusy" },{ value: "LEAD", label: "Lead" },{ value: "ACTIVE", label: "Aktywny" },{ value: "VIP", label: "VIP" },{ value: "ARCHIVED", label: "Archiwalny" },{ value: "BLOCKED", label: "Zablokowany" }];
const segOpts = [{ value: "", label: "Wszystkie segmenty" },{ value: "STANDARD", label: "Standard" },{ value: "REGULAR", label: "Stały klient" },{ value: "VIP", label: "VIP" },{ value: "CORPORATE", label: "Firma" },{ value: "GROUP", label: "Grupa" }];

function timeAgo(d: string | null): string {
  if (!d) return "\u2014";
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return m + " min temu";
  const h = Math.floor(m / 60);
  if (h < 24) return h + " godz. temu";
  const dd = Math.floor(h / 24);
  if (dd < 30) return dd + " dn. temu";
  return new Date(d).toLocaleDateString("pl-PL", { day: "numeric", month: "short" });
}
function cName(c: ClientRow): string {
  if (c.type === "COMPANY") return c.companyName || "Bez nazwy";
  return [c.firstName, c.lastName].filter(Boolean).join(" ") || "Bez nazwy";
}
function cContact(c: ClientRow): string | null {
  if (c.type !== "COMPANY") return null;
  return [c.contactFirstName, c.contactLastName].filter(Boolean).join(" ") || null;
}

export function ClientsContent() {
  const router = useRouter();
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [filtering, setFiltering] = useState(false);
  const [search, setSearch] = useState("");
  const [fType, setFType] = useState("");
  const [fStatus, setFStatus] = useState("");
  const [fSeg, setFSeg] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const searchRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setFiltering(true);
    const p = new URLSearchParams();
    if (search) p.set("search", search);
    if (fType) p.set("type", fType);
    if (fStatus) p.set("status", fStatus);
    if (fSeg) p.set("segment", fSeg);
    p.set("page", String(page));
    p.set("limit", "20");
    try {
      const data = await apiFetch("/api/clients?" + p.toString());
      setClients(data.clients || []);
      setTotal(data.pagination?.total || 0);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (e) { console.error(e); }
    setFiltering(false);
    setInitialLoading(false);
  }, [search, fType, fStatus, fSeg, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [search, fType, fStatus, fSeg]);

  if (initialLoading) return <ClientsSkeleton />;

  return (
    <div className="space-y-4 fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Klienci</h2>
          <p className="text-[13px] text-muted-foreground mt-1">{total}{" klient" + (total === 1 ? "" : "ów")}</p>
        </div>
        <button onClick={() => router.push("/admin/clients/new")} className="btn-bubble btn-primary-bubble px-5 py-2.5 text-[13px]">
          <Plus className="h-4 w-4" /> Nowy klient
        </button>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            ref={searchRef}
            type="text"
            placeholder="Szukaj klientów..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-bubble input-bubble-search h-11 w-full"
            style={search ? { paddingRight: 36 } : undefined}
          />
          {search && (
            <button
              onClick={() => { setSearch(""); searchRef.current?.focus(); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-muted-foreground/20 hover:text-foreground transition-all"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
        <BubbleSelect options={typeOpts} value={fType} onChange={setFType} className="w-[160px]" />
        <BubbleSelect options={statusOpts} value={fStatus} onChange={setFStatus} className="w-[160px]" />
        <BubbleSelect options={segOpts} value={fSeg} onChange={setFSeg} className="w-[160px]" />
      </div>

      <div className="bubble overflow-x-auto relative">
        {filtering && (
          <div className="absolute inset-0 bg-card/60 z-10 flex items-center justify-center rounded-[20px]">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        )}
        {clients.length === 0 && !filtering ? (
          <div className="py-16 text-center">
            <Users className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-[14px] font-medium text-muted-foreground">{search ? "Brak wyników" : "Brak klientów"}</p>
          </div>
        ) : (
          <table className="table-bubble w-full">
            <thead>
              <tr>
                <th className="text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-3 py-2.5">#</th>
                <th className="text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-3 py-2.5">Klient</th>
                <th className="text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-3 py-2.5 hidden md:table-cell">Kontakt</th>
                <th className="text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-3 py-2.5">Status</th>
                <th className="text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-3 py-2.5 hidden lg:table-cell">Segment</th>
                <th className="text-center text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-3 py-2.5 hidden lg:table-cell">Rez.</th>
                <th className="text-center text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-3 py-2.5 hidden lg:table-cell">Oferty</th>
                <th className="text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-3 py-2.5 hidden xl:table-cell">Aktywność</th>
                <th className="text-right text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-3 py-2.5">Akcje</th>
              </tr>
            </thead>
            <tbody>
              {clients.map(c => (
                <tr key={c.id} className="border-t border-border/50 hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => router.push("/admin/clients/" + c.id)}>
                  <td className="px-3 py-3 text-[12px] text-muted-foreground font-mono">{c.clientNumber}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        {c.type === "COMPANY" ? <Building2 className="h-3.5 w-3.5 text-primary" /> : <UserIcon className="h-3.5 w-3.5 text-primary" />}
                      </div>
                      <div className="min-w-0">
                        <div className="text-[13px] font-medium truncate">{cName(c)}</div>
                        {cContact(c) && <div className="text-[11px] text-muted-foreground truncate">{cContact(c)}</div>}
                        {c.tags.length > 0 && (
                          <div className="flex gap-1 mt-0.5 flex-wrap">
                            {c.tags.slice(0, 3).map(ct => (
                              <span key={ct.tag.id} className="text-[9px] px-1.5 py-0.5 rounded-full font-medium" style={{ backgroundColor: (ct.tag.color || "#6B7280") + "20", color: ct.tag.color || "#6B7280" }}>{ct.tag.name}</span>
                            ))}
                          </div>
                        )}
                        <div className="text-[11px] text-muted-foreground md:hidden mt-0.5">{c.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 hidden md:table-cell">
                    <div className="text-[12px]">{c.email || "\u2014"}</div>
                    <div className="text-[11px] text-muted-foreground">{c.phone || ""}{c.city ? " \u2022 " + c.city : ""}</div>
                  </td>
                  <td className="px-3 py-3"><span className={"text-[11px] font-semibold px-2 py-0.5 rounded-full " + (statusCfg[c.status]?.cls || "")}>{statusCfg[c.status]?.label || c.status}</span></td>
                  <td className="px-3 py-3 text-[12px] hidden lg:table-cell">{segLbl[c.segment] || c.segment}</td>
                  <td className="px-3 py-3 text-center text-[12px] font-medium hidden lg:table-cell">{c._count.bookings}</td>
                  <td className="px-3 py-3 text-center text-[12px] font-medium hidden lg:table-cell">{c._count.offers}</td>
                  <td className="px-3 py-3 text-[11px] text-muted-foreground hidden xl:table-cell">{timeAgo(c.lastActivityAt || c.createdAt)}</td>
                  <td className="px-3 py-3 text-right" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
<Tooltip content="Podgląd"><button onClick={() => router.push("/admin/clients/" + c.id)} className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-all"><Eye className="h-3.5 w-3.5" /></button></Tooltip>
<Tooltip content="Edytuj"><button onClick={() => router.push("/admin/clients/" + c.id + "/edit")} className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-all"><Pencil className="h-3.5 w-3.5" /></button></Tooltip>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-[12px] text-muted-foreground">
          <span>Strona {page} z {totalPages}</span>
          <div className="flex gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-bubble btn-secondary-bubble px-3 py-1.5 text-[11px] disabled:opacity-30"><ChevronLeft className="h-3.5 w-3.5" /></button>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn-bubble btn-secondary-bubble px-3 py-1.5 text-[11px] disabled:opacity-30"><ChevronRight className="h-3.5 w-3.5" /></button>
          </div>
        </div>
      )}
    </div>
  );
}
