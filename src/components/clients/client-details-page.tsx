"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Loader2, Pencil, Building2, User as UserIcon, Phone, Mail, MapPin,
  Calendar, Clock, FileText, MessageSquare, History, Settings, Plus, Pin, Star,
  CreditCard, Globe, Tag, Percent, Shield, ChevronDown, ChevronRight,
  Home, CheckCircle2, XCircle, AlertTriangle, Send, Package, Receipt,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api-fetch";
import { parseLocalDate } from "@/lib/dates";
import { formatMoneyMinor } from "@/lib/format";
import { UnitBadge } from "@/components/ui/unit-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";

interface Props { clientId: string; }

const stCfg: Record<string, { label: string; cls: string }> = {
  LEAD: { label: "Lead", cls: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" },
  ACTIVE: { label: "Aktywny", cls: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
  VIP: { label: "VIP", cls: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400" },
  ARCHIVED: { label: "Archiwalny", cls: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400" },
  BLOCKED: { label: "Zablokowany", cls: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
};
const segLbl: Record<string, string> = { STANDARD: "Standard", REGULAR: "Stały klient", VIP: "VIP", CORPORATE: "Firma", GROUP: "Grupa" };
const srcLbl: Record<string, string> = { GOOGLE_ADS: "Google Ads", SEO: "SEO", FACEBOOK: "Facebook", REFERRAL: "Polecenie", PHONE: "Telefon", EMAIL: "E-mail", SALES: "Handlowiec", MANUAL: "Ręczne" };
const actLbl: Record<string, string> = { CREATED: "Utworzono klienta", UPDATED: "Zaktualizowano dane", STATUS_CHANGED: "Zmieniono status", NOTE_ADDED: "Dodano notatkę", TAG_ADDED: "Dodano tag", TAG_REMOVED: "Usunięto tag" };
const langLbl: Record<string, string> = { pl: "Polski", en: "Angielski", de: "Niemiecki" };
const countryLbl: Record<string, string> = { PL: "Polska", DE: "Niemcy", CZ: "Czechy", SK: "Słowacja", UA: "Ukraina", GB: "Wlk. Brytania", NL: "Holandia", FR: "Francja" };

const offerStCfg: Record<string, { label: string; cls: string; icon: React.ElementType }> = {
  DRAFT: { label: "Szkic", cls: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300", icon: FileText },
  OPEN: { label: "Wysłana", cls: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400", icon: Send },
  ACCEPTED: { label: "Zaakceptowana", cls: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400", icon: CheckCircle2 },
  EXPIRED: { label: "Wygasła", cls: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400", icon: AlertTriangle },
  CANCELLED: { label: "Anulowana", cls: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", icon: XCircle },
};

const bookingStCfg: Record<string, { label: string; cls: string }> = {
  NEW: { label: "Nowa", cls: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
  CONFIRMED: { label: "Potwierdzona", cls: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
  CHECKED_IN: { label: "Zameldowany", cls: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400" },
  CHECKED_OUT: { label: "Wymeldowany", cls: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" },
  CANCELLED: { label: "Anulowana", cls: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
  NO_SHOW: { label: "Niestawienie", cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
};

const tabs = [
  { id: "summary", label: "Podsumowanie", icon: Star },
  { id: "notes", label: "Notatki", icon: MessageSquare },
  { id: "bookings", label: "Rezerwacje", icon: Calendar },
  { id: "offers", label: "Oferty", icon: FileText },
  { id: "activity", label: "Historia", icon: History },
  { id: "settings", label: "Ustawienia", icon: Settings },
];

function fmtD(d: string | null): string { return d ? parseLocalDate(d).toLocaleDateString("pl-PL", { day: "numeric", month: "long", year: "numeric" }) : "\u2014"; }
function fmtDT(d: string): string { return new Date(d).toLocaleString("pl-PL", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }); }
function cName(c: any): string { return c.type === "COMPANY" ? (c.companyName || "Bez nazwy") : [c.firstName, c.lastName].filter(Boolean).join(" ") || "Bez nazwy"; }
function fmtMoney(v: number): string { return formatMoneyMinor(v); }

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-border/30 last:border-b-0">
      <div className="h-7 w-7 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[11px] font-medium text-muted-foreground">{label}</div>
        <div className="text-[13px] font-medium text-foreground mt-0.5">{value}</div>
      </div>
    </div>
  );
}

function SectionCard({ title, description, icon: Icon, children, defaultOpen = true }: { title: string; description?: string; icon: React.ElementType; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bubble" style={{ overflow: "visible" }}>
      <button onClick={() => setOpen(!open)} className="w-full flex items-center gap-3 px-5 py-4 hover:bg-muted/20 transition-colors">
        <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 text-left">
          <h3 className="text-[14px] font-semibold">{title}</h3>
          {description && <p className="text-[11px] text-muted-foreground mt-0.5">{description}</p>}
        </div>
        {open ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
      </button>
      <div className={`section-collapse ${open ? "section-open" : ""}`}>
        <div className="section-collapse-inner">
          <div className="px-5 pb-5 border-t border-border/50 pt-4">{children}</div>
        </div>
      </div>
    </div>
  );
}

export function ClientDetailsPage({ clientId }: Props) {
  const router = useRouter();
  const { error: showError } = useToast();
  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("summary");
  const [noteText, setNoteText] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  async function loadClient() {
    try {
      const data = await apiFetch("/api/clients/" + clientId);
      if (data.client) setClient(data.client);
    } catch (e: any) {
      showError(e.message || "Błąd ładowania klienta");
    }
    setLoading(false);
  }
  useEffect(() => { loadClient(); }, [clientId]);

  async function addNote() {
    if (!noteText.trim()) return;
    setSavingNote(true);
    try {
      await apiFetch("/api/clients/" + clientId + "/notes", {
        method: "POST",
        body: { content: noteText },
      });
      setNoteText("");
      loadClient();
    } catch (e: any) {
      showError(e.message || "Błąd dodawania notatki");
    }
    setSavingNote(false);
  }

  if (loading) return (
    <div className="space-y-5">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10 rounded-2xl" />
        <Skeleton className="h-14 w-14 rounded-2xl" />
        <div>
          <Skeleton className="h-6 w-48 rounded-lg" />
          <Skeleton className="h-4 w-32 rounded mt-2" />
        </div>
      </div>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-10 w-28 rounded-xl" />)}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-20 rounded-2xl" />)}
      </div>
      <Skeleton className="h-40 rounded-2xl" />
      <Skeleton className="h-32 rounded-2xl" />
    </div>
  );
  if (!client) return <div className="text-center py-20 text-muted-foreground">Klient nie znaleziony</div>;

  const st = stCfg[client.status] || stCfg.ACTIVE;
  const billing = client.billingProfiles?.[0];
  const guest = client.guestProfile;

  return (
    <div className="space-y-5 fade-in-up">
      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push("/admin/clients")} className="btn-icon-bubble h-10 w-10">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
            {client.type === "COMPANY" ? <Building2 className="h-6 w-6 text-primary" /> : <UserIcon className="h-6 w-6 text-primary" />}
          </div>
          <div>
            <h2 className="text-xl font-bold">{cName(client)}</h2>
            <div className="flex items-center gap-2 text-[12px] text-muted-foreground mt-0.5">
              <span className="font-mono">{client.clientNumber}</span>
              <span>{"•"}</span>
              <span>{client.type === "COMPANY" ? "Firma" : client.type === "GROUP" ? "Grupa" : "Osoba"}</span>
              <span>{"•"}</span>
              <span className={cn("font-semibold px-1.5 py-0.5 rounded-full text-[10px]", st.cls)}>{st.label}</span>
            </div>
            {client.tags?.length > 0 && (
              <div className="flex gap-1 mt-1.5">{client.tags.map((t: any) => (
                <span key={t.id} className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: (t.tag.color || "#6B7280") + "20", color: t.tag.color || "#6B7280" }}>{t.tag.name}</span>
              ))}</div>
            )}
          </div>
        </div>
        <button onClick={() => router.push("/admin/clients/" + clientId + "/edit")} className="btn-bubble btn-secondary-bubble px-4 py-2.5 text-[13px]">
          <Pencil className="h-3.5 w-3.5" /> Edytuj
        </button>
      </div>

      {/* ── Tabs ── */}
      <div className="overflow-x-auto scrollbar-hide" style={{ borderBottom: "1px solid hsl(var(--border))" }}>
        <div className="flex gap-1 min-w-max">
          {tabs.map(t => {
            const TIcon = t.icon;
            const active = tab === t.id;
            return (
              <button key={t.id} onClick={() => setTab(t.id)} className={cn(
                "flex items-center gap-2 px-4 py-3 text-[13px] font-semibold transition-all duration-300 border-b-2",
                active ? "text-primary border-primary" : "text-muted-foreground border-transparent hover:text-primary"
              )}>
                <TIcon className="h-4 w-4" />
                {t.label}
                {t.id === "notes" && client._count?.notes > 0 && <span className="count-bubble">{client._count.notes}</span>}
                {t.id === "bookings" && client._count?.reservations > 0 && <span className="count-bubble">{client._count.bookings}</span>}
                {t.id === "offers" && 0 > 0 && <span className="count-bubble">{client._count.offers}</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* ═══ SUMMARY ═══ */}
      {tab === "summary" && (
        <div className="space-y-5">
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bubble px-4 py-3"><div className="text-[10px] text-muted-foreground uppercase font-bold">Rezerwacje</div><div className="text-xl font-bold mt-1">{client._count?.reservations || 0}</div></div>
            <div className="bubble px-4 py-3"><div className="text-[10px] text-muted-foreground uppercase font-bold">Oferty</div><div className="text-xl font-bold mt-1">{0 || 0}</div></div>
            <div className="bubble px-4 py-3"><div className="text-[10px] text-muted-foreground uppercase font-bold">Segment</div><div className="text-xl font-bold mt-1">{segLbl[client.segment] || client.segment}</div></div>
            <div className="bubble px-4 py-3"><div className="text-[10px] text-muted-foreground uppercase font-bold">{"Źródło"}</div><div className="text-xl font-bold mt-1">{srcLbl[client.source] || client.source}</div></div>
          </div>

          {/* Contact */}
          <SectionCard title="Dane kontaktowe" description="Telefon, e-mail i preferowany sposób kontaktu." icon={Mail}>
            <InfoRow icon={Mail} label="E-mail" value={client.email} />
            <InfoRow icon={Mail} label="E-mail dodatkowy" value={client.emailSecondary} />
            <InfoRow icon={Phone} label="Telefon" value={client.phone} />
            <InfoRow icon={Phone} label="Telefon dodatkowy" value={client.phoneSecondary} />
            <InfoRow icon={MapPin} label="Adres" value={[client.address, client.postalCode, client.city].filter(Boolean).join(", ") || null} />
            <InfoRow icon={Globe} label="Kraj" value={countryLbl[client.country] || client.country} />
            <InfoRow icon={Globe} label={"Język"} value={langLbl[client.language] || client.language} />
          </SectionCard>

          {/* Company info (if company) */}
          {client.type === "COMPANY" && (
            <SectionCard title="Dane firmowe" description="Nazwa firmy, NIP i dane rejestrowe klienta." icon={Building2}>
              <InfoRow icon={Building2} label="Nazwa firmy" value={client.companyName} />
              <InfoRow icon={Receipt} label="NIP" value={client.nip} />
              <InfoRow icon={UserIcon} label="Osoba kontaktowa" value={[client.contactFirstName, client.contactLastName].filter(Boolean).join(" ") || null} />
            </SectionCard>
          )}

          {/* Billing */}
          {billing && !billing.sameAsClient && (
            <SectionCard title="Dane do faktury" description="Adres i dane do wystawienia faktury." icon={CreditCard} defaultOpen={false}>
              {billing.type === "COMPANY" ? (
                <>
                  <InfoRow icon={Building2} label="Firma" value={billing.companyName} />
                  <InfoRow icon={Receipt} label="NIP" value={billing.nip} />
                </>
              ) : (
                <InfoRow icon={UserIcon} label={"Imię i nazwisko"} value={[billing.firstName, billing.lastName].filter(Boolean).join(" ") || null} />
              )}
              <InfoRow icon={MapPin} label="Adres" value={[billing.address, billing.postalCode, billing.city].filter(Boolean).join(", ") || null} />
              <InfoRow icon={Globe} label="Kraj" value={countryLbl[billing.country] || billing.country} />
            </SectionCard>
          )}

          {/* Guest profile */}
          {guest && !guest.sameAsClient && (
            <SectionCard title="Dane gościa" description="Informacje o głównym gościu pobytu." icon={UserIcon} defaultOpen={false}>
              <InfoRow icon={UserIcon} label={"Imię i nazwisko"} value={[guest.firstName, guest.lastName].filter(Boolean).join(" ") || null} />
              <InfoRow icon={Mail} label="E-mail" value={guest.email} />
              <InfoRow icon={Phone} label="Telefon" value={guest.phone} />
              <InfoRow icon={MapPin} label="Adres" value={[guest.address, guest.postalCode, guest.city].filter(Boolean).join(", ") || null} />
              <InfoRow icon={Globe} label="Kraj" value={countryLbl[guest.country] || guest.country} />
              <InfoRow icon={Globe} label={"Język"} value={langLbl[guest.language] || guest.language} />
            </SectionCard>
          )}

          {/* Dates */}
          <SectionCard title="Informacje systemowe" description="Daty utworzenia, źródło pozyskania i identyfikatory." icon={Clock} defaultOpen={false}>
            <InfoRow icon={Calendar} label="Utworzono" value={fmtD(client.createdAt)} />
            <InfoRow icon={Clock} label={"Ostatnia aktywność"} value={fmtD(client.lastActivityAt)} />
            {client.assignedUser && <InfoRow icon={UserIcon} label="Opiekun" value={`${client.assignedUser.firstName} ${client.assignedUser.lastName}`} />}
          </SectionCard>
        </div>
      )}

      {/* ═══ NOTES ═══ */}
      {tab === "notes" && (
        <div className="space-y-4">
          <div className="bubble px-5 py-4">
            <textarea value={noteText} onChange={e => setNoteText(e.target.value)} placeholder={"Dodaj notatkę..."} className="input-bubble min-h-[80px] resize-y mb-3" />
            <button onClick={addNote} disabled={savingNote || !noteText.trim()} className="btn-bubble btn-primary-bubble px-4 py-2.5 text-[13px] disabled:opacity-50">
              {savingNote ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} {"Dodaj notatkę"}
            </button>
          </div>
          {(client.notes || []).map((n: any) => (
            <div key={n.id} className={"bubble px-5 py-4 " + (n.isPinned ? "border-l-4 border-l-primary" : "")}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
                  {n.isPinned && <Pin className="h-3 w-3 text-primary" />}
                  <span className="font-medium text-foreground">{n.user?.firstName} {n.user?.lastName}</span>
                  <span>{"•"}</span>
                  <span>{fmtDT(n.createdAt)}</span>
                </div>
              </div>
              <p className="text-[13px] whitespace-pre-wrap">{n.content}</p>
            </div>
          ))}
          {(!client.notes || client.notes.length === 0) && <div className="text-center py-8 text-[13px] text-muted-foreground">Brak notatek</div>}
        </div>
      )}

      {/* ═══ BOOKINGS ═══ */}
      {tab === "bookings" && <ClientBookings clientId={clientId} router={router} />}

      {/* ═══ OFFERS ═══ */}
      {tab === "offers" && <ClientOffers clientId={clientId} router={router} />}

      {/* ═══ ACTIVITY ═══ */}
      {tab === "activity" && (
        <div className="bubble">
          <div className="px-5 py-4">
            <h3 className="text-[14px] font-semibold">Historia zmian</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">Wszystkie logi zmian i akcje na koncie klienta.</p>
          </div>
          <div className="px-5 pb-5 border-t border-border/50 pt-4">
            {(client.activities || []).map((a: any, i: number) => (
              <div key={a.id} className="flex gap-3 pb-4 relative">
                {i < (client.activities?.length || 0) - 1 && (
                  <div className="absolute left-[11px] top-[28px] bottom-0 w-[2px] bg-border/50" />
                )}
                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 z-10">
                  <History className="h-3 w-3 text-primary" />
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                  <div className="text-[12px] font-medium text-foreground">{actLbl[a.action] || a.action}</div>
                  {a.description && <div className="text-[11px] text-muted-foreground mt-0.5">{a.description}</div>}
                  <div className="text-[10px] text-muted-foreground/60 mt-0.5">{fmtDT(a.createdAt)}</div>
                </div>
              </div>
            ))}
            {(!client.activities || client.activities.length === 0) && (
              <div className="text-center py-8 text-[13px] text-muted-foreground">Brak historii zmian</div>
            )}
          </div>
        </div>
      )}

      {/* ═══ SETTINGS ═══ */}
      {tab === "settings" && (
        <div className="space-y-5">
          <SectionCard title="Segmentacja i warunki" description="Typ klienta, tagi i przypisane warunki handlowe." icon={Tag}>
            <InfoRow icon={Tag} label="Segment" value={segLbl[client.segment] || client.segment} />
            <InfoRow icon={Globe} label={"Źródło pozyskania"} value={srcLbl[client.source] || client.source} />
            <InfoRow icon={CreditCard} label="Waluta" value={client.currency} />
            <InfoRow icon={Globe} label={"Język"} value={langLbl[client.language] || client.language} />
          </SectionCard>

          <SectionCard title="Rabaty" description="Indywidualne rabaty i kody promocyjne klienta." icon={Percent}>
            <InfoRow icon={Percent} label="Rabat standardowy" value={client.discountStandard ? `${client.discountStandard}%` : "Brak"} />
            <InfoRow icon={Percent} label="Rabat promocyjny" value={client.discountPromo ? `${client.discountPromo}%` : "Brak"} />
          </SectionCard>

          {client.consent && (
            <SectionCard title="Zgody marketingowe" description="Zgody na komunikację marketingową i przetwarzanie danych." icon={Shield}>
              <div className="space-y-3">
                <ConsentRow label="Newsletter" checked={client.consent.newsletter} />
                <ConsentRow label="Kontakt telefoniczny" checked={client.consent.phoneContact} />
                <ConsentRow label="Marketing" checked={client.consent.marketing} />
              </div>
              {client.consent.consentDate && (
                <div className="text-[11px] text-muted-foreground mt-3 pt-3 border-t border-border/30">
                  Zgoda udzielona: {fmtD(client.consent.consentDate)}
                  {client.consent.consentSource && ` • ${client.consent.consentSource}`}
                </div>
              )}
            </SectionCard>
          )}

          {client.status === "BLOCKED" && (
            <SectionCard title="Blokada" description="Zablokowany klient nie może dokonywać rezerwacji." icon={XCircle}>
              <InfoRow icon={XCircle} label={`Powód blokady`} value={client.blockReason || "Nie podano"} />
              <InfoRow icon={Calendar} label="Data blokady" value={fmtD(client.blockedAt)} />
              <InfoRow icon={UserIcon} label={`Zablokował`} value={client.blockedBy} />
            </SectionCard>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Consent row helper ── */
function ConsentRow({ label, checked }: { label: string; checked: boolean }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-[13px]">{label}</span>
      <span className={cn(
        "text-[11px] font-semibold px-2 py-0.5 rounded-full",
        checked
          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
          : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
      )}>
        {checked ? "Tak" : "Nie"}
      </span>
    </div>
  );
}

/* ── Client Bookings ── */
function ClientBookings({ clientId, router }: { clientId: string; router: any }) {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await apiFetch(`/api/bookings?clientId=${clientId}&limit=50`);
        setBookings(data.bookings || []);
      } catch (e) { console.error(e); }
      setLoading(false);
    })();
  }, [clientId]);

  if (loading) return (
    <div className="space-y-3">
      {[1, 2].map(i => (
        <div key={i} className="bubble px-5 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-2xl" />
              <div>
                <Skeleton className="h-5 w-36 rounded-lg" />
                <Skeleton className="h-3 w-20 rounded mt-1.5" />
              </div>
            </div>
            <Skeleton className="h-5 w-20 rounded-lg" />
          </div>
          <div className="mt-3 ml-[52px] space-y-2">
            <Skeleton className="h-3.5 w-64 rounded" />
            <Skeleton className="h-3.5 w-16 rounded" />
            <Skeleton className="h-3.5 w-80 rounded" />
          </div>
        </div>
      ))}
    </div>
  );

  if (bookings.length === 0) {
    return (
      <div className="bubble px-5 py-8 text-center text-muted-foreground text-[13px]">
        <Calendar className="h-8 w-8 mx-auto mb-3 text-muted-foreground/30" />
        Brak rezerwacji dla tego klienta
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {bookings.map((b: any) => {
        const st = bookingStCfg[b.status] || bookingStCfg.CONFIRMED;
        return (
          <div key={b.id}
            className="bubble px-5 py-4 cursor-pointer hover:bg-muted/20 transition-colors"
            onClick={() => router.push("/admin/reservations/" + b.id)}>

            {/* Header: number + status + price */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-green-100 dark:bg-green-900/20 flex items-center justify-center shrink-0">
                  <Package className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <span className="text-[14px] font-bold">{b.bookingNumber}</span>
                  <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full ml-2", st.cls)}>{st.label}</span>
                </div>
              </div>
              <div className="text-[15px] font-bold text-primary">{fmtMoney(b.totalMinor ?? Math.round(Number(b.total) * 100))}</div>
            </div>

            {/* Info rows */}
            <div className="mt-3 ml-[52px] space-y-2">
              {/* Dates */}
              <div className="flex items-center gap-2 text-[12px]">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="text-foreground/80">{fmtD(b.checkIn)}</span>
                <span className="text-muted-foreground">→</span>
                <span className="text-foreground/80">{fmtD(b.checkOut)}</span>
              </div>

              {/* Nights */}
              <div className="flex items-center gap-2 text-[12px]">
                <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="text-foreground/80">{b.nights} {b.nights === 1 ? "noc" : b.nights < 5 ? "noce" : "nocy"}</span>
              </div>

              {/* Resources */}
              {b.resources?.length > 0 && (
                <div className="flex items-start gap-2">
                  <Home className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                    {(b.items || b.resources || []).map((r: any, i: number) => (
                      <React.Fragment key={i}>
                        {i > 0 && <span className="text-border text-[10px]">•</span>}
                        <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-foreground/80">
                          {r.name}
                          {r.unitNumber && <UnitBadge number={r.unitNumber} size="sm" />}
                        </span>
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              )}

              {/* Source offer */}
              {b.sourceOffer && (
                <div className="text-[11px] text-muted-foreground mt-3 pt-3" style={{ borderTop: "1px solid hsl(var(--border) / 0.3)" }}>
                  Przekonwertowano z oferty <span className="font-semibold text-foreground/60">{b.sourceOffer.offerNumber}</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Client Offers ── */
function ClientOffers({ clientId, router }: { clientId: string; router: any }) {
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await apiFetch(`/api/offers?limit=100`);
        setOffers((data.offers || []).filter((o: any) => o.clientId === clientId));
      } catch (e) { console.error(e); }
      setLoading(false);
    })();
  }, [clientId]);

  if (loading) return (
    <div className="space-y-3">
      {[1, 2].map(i => (
        <div key={i} className="bubble px-5 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-2xl" />
              <div>
                <Skeleton className="h-5 w-32 rounded-lg" />
                <Skeleton className="h-3 w-20 rounded mt-1.5" />
              </div>
            </div>
            <Skeleton className="h-5 w-20 rounded-lg" />
          </div>
          <div className="mt-3 ml-[52px] space-y-2">
            <Skeleton className="h-3.5 w-60 rounded" />
            <Skeleton className="h-3.5 w-14 rounded" />
            <Skeleton className="h-3.5 w-72 rounded" />
          </div>
        </div>
      ))}
    </div>
  );

  if (offers.length === 0) {
    return (
      <div className="bubble px-5 py-8 text-center text-muted-foreground text-[13px]">
        <FileText className="h-8 w-8 mx-auto mb-3 text-muted-foreground/30" />
        Brak ofert dla tego klienta
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {offers.map((o: any) => {
        const st = offerStCfg[o.status] || offerStCfg.DRAFT;
        const StIcon = st.icon;
        return (
          <div key={o.id} onClick={() => router.push("/admin/offers/" + o.id)}
            className="bubble px-5 py-4 cursor-pointer hover:bg-muted/20 transition-colors">

            {/* Header: number + status + price */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                  <FileText className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <span className="text-[14px] font-bold">{o.offerNumber}</span>
                  <span className={cn("inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ml-2", st.cls)}>
                    <StIcon className="h-3 w-3" />{st.label}
                  </span>
                </div>
              </div>
              <div className="text-[15px] font-bold text-primary">{fmtMoney(o.totalMinor ?? Math.round(Number(o.total) * 100))}</div>
            </div>

            {/* Info rows */}
            <div className="mt-3 ml-[52px] space-y-2">
              {/* Dates */}
              <div className="flex items-center gap-2 text-[12px]">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="text-foreground/80">{fmtD(o.checkIn)}</span>
                <span className="text-muted-foreground">→</span>
                <span className="text-foreground/80">{fmtD(o.checkOut)}</span>
              </div>

              {/* Nights */}
              <div className="flex items-center gap-2 text-[12px]">
                <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="text-foreground/80">{o.nights} {o.nights === 1 ? "noc" : o.nights < 5 ? "noce" : "nocy"}</span>
              </div>

              {/* Resources */}
              {o.offerResources?.length > 0 && (
                <div className="flex items-start gap-2">
                  <Home className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                    {o.offerResources.map((r: any, i: number) => (
                      <React.Fragment key={i}>
                        {i > 0 && <span className="text-border text-[10px]">•</span>}
                        <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-foreground/80">
                          {r.resource?.name || "Zasób"}
                          {r.resource?.unitNumber && <UnitBadge number={r.resource.unitNumber} size="sm" />}
                        </span>
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
