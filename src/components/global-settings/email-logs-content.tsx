"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Mail, Bell, CheckCircle2, XCircle, AlertCircle, Clock,
  ChevronLeft, ChevronRight, Send, Search, X, Loader2, FileCode,
  ExternalLink,
} from "lucide-react";
import { apiFetch } from "@/lib/api-fetch";
import { useToast } from "@/components/ui/toast";
import { BubbleSelect } from "@/components/ui/bubble-select";
import { SlidePanel } from "@/components/ui/slide-panel";
import { cn } from "@/lib/utils";

interface EmailLogEntry {
  id: string;
  type: string;
  status: string;
  recipientEmail: string;
  recipientName: string | null;
  subject: string;
  triggerSource: string;
  attempts: number;
  sentAt: string | null;
  lastAttemptAt: string | null;
  errorMessage: string | null;
  createdAt: string;
  reservationId: string | null;
}

const TYPE_LABELS: Record<string, { label: string; icon: React.ElementType }> = {
  BOOKING_CONFIRMATION: { label: "Potwierdzenie", icon: Mail },
  PAYMENT_REMINDER: { label: "Przypomnienie", icon: Bell },
  STATUS_CONFIRMED: { label: "Potwierdzona", icon: CheckCircle2 },
  STATUS_CANCELLED: { label: "Anulowana", icon: XCircle },
  TEST: { label: "Test", icon: Send },
};

const STATUS_STYLES: Record<string, { label: string; color: string; dot: string }> = {
  SENT: { label: "Wysłany", color: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-400" },
  FAILED: { label: "Błąd", color: "bg-destructive/10 text-destructive", dot: "bg-destructive" },
  PENDING: { label: "Oczekuje", color: "bg-amber-50 text-amber-700", dot: "bg-amber-400" },
};

const SOURCE_LABELS: Record<string, string> = {
  SYSTEM: "System",
  ADMIN_TEST: "Test admina",
  CRON: "Cron",
};

const TYPE_OPTIONS = [
  { value: "", label: "Wszystkie typy" },
  { value: "BOOKING_CONFIRMATION", label: "Potwierdzenie" },
  { value: "PAYMENT_REMINDER", label: "Przypomnienie" },
  { value: "STATUS_CONFIRMED", label: "Potwierdzona" },
  { value: "STATUS_CANCELLED", label: "Anulowana" },
  { value: "TEST", label: "Test" },
];

const STATUS_OPTIONS = [
  { value: "", label: "Wszystkie statusy" },
  { value: "SENT", label: "Wysłane" },
  { value: "FAILED", label: "Błędy" },
  { value: "PENDING", label: "Oczekujące" },
];

const SOURCE_OPTIONS = [
  { value: "", label: "Wszystkie źródła" },
  { value: "SYSTEM", label: "System" },
  { value: "ADMIN_TEST", label: "Test admina" },
  { value: "CRON", label: "Cron" },
];

function fmtDate(d: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleString("pl-PL", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function EmailLogsContent() {
  const { error: showError } = useToast();
  const [logs, setLogs] = useState<EmailLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterSource, setFilterSource] = useState("");
  const [selected, setSelected] = useState<EmailLogEntry | null>(null);
  const limit = 30;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (filterType) params.set("type", filterType);
      if (filterStatus) params.set("status", filterStatus);
      if (filterSource) params.set("triggerSource", filterSource);
      const data = await apiFetch(`/api/settings/email/logs?${params}`);
      setLogs(data.logs);
      setTotal(data.pagination.total);
      setTotalPages(data.pagination.totalPages);
    } catch {
      showError("Nie udało się załadować logów");
    }
    setLoading(false);
  }, [page, filterType, filterStatus, filterSource]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [filterType, filterStatus, filterSource]);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-2" style={{ overflow: "visible" }}>
        <div className="w-[180px]">
          <BubbleSelect options={TYPE_OPTIONS} value={filterType} onChange={setFilterType} />
        </div>
        <div className="w-[160px]">
          <BubbleSelect options={STATUS_OPTIONS} value={filterStatus} onChange={setFilterStatus} />
        </div>
        <div className="w-[160px]">
          <BubbleSelect options={SOURCE_OPTIONS} value={filterSource} onChange={setFilterSource} />
        </div>
        <div className="flex-1" />
        <span className="text-[12px] text-muted-foreground self-center">
          {total} {total === 1 ? "wpis" : total < 5 ? "wpisy" : "wpisów"}
        </span>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="bubble px-4 py-3 flex gap-3">
              <div className="h-4 w-20 bg-muted shimmer rounded" />
              <div className="h-4 w-32 bg-muted shimmer rounded" />
              <div className="flex-1" />
              <div className="h-4 w-16 bg-muted shimmer rounded" />
            </div>
          ))}
        </div>
      ) : logs.length === 0 ? (
        <div className="bubble px-5 py-12 text-center">
          <Mail className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-[14px] font-semibold text-muted-foreground">Brak wpisów</p>
          <p className="text-[12px] text-muted-foreground mt-1">Logi pojawią się po wysłaniu pierwszego e-maila.</p>
        </div>
      ) : (
        <div className="space-y-1">
          {logs.map(log => {
            const typeInfo = TYPE_LABELS[log.type] || { label: log.type, icon: FileCode };
            const statusInfo = STATUS_STYLES[log.status] || STATUS_STYLES.PENDING;
            const TypeIcon = typeInfo.icon;

            return (
              <button
                key={log.id}
                onClick={() => setSelected(log)}
                className="w-full bubble px-4 py-3 flex items-center gap-3 hover:bg-muted/20 transition-colors text-left"
              >
                {/* Status dot */}
                <div className={cn("h-2.5 w-2.5 rounded-full shrink-0", statusInfo.dot)} />

                {/* Type badge */}
                <div className="flex items-center gap-1.5 shrink-0 min-w-[110px]">
                  <TypeIcon className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-[11px] font-semibold text-muted-foreground">{typeInfo.label}</span>
                </div>

                {/* Recipient */}
                <span className="text-[12px] font-medium truncate min-w-0 flex-1">{log.recipientEmail}</span>

                {/* Subject (hidden on mobile) */}
                <span className="text-[11px] text-muted-foreground truncate hidden sm:block max-w-[200px]">{log.subject}</span>

                {/* Source */}
                <span className="text-[10px] text-muted-foreground shrink-0 hidden md:block w-[70px]">
                  {SOURCE_LABELS[log.triggerSource] || log.triggerSource}
                </span>

                {/* Date */}
                <span className="text-[11px] text-muted-foreground shrink-0 w-[120px] text-right">
                  {fmtDate(log.createdAt)}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="btn-bubble btn-secondary-bubble px-3 py-1.5 text-[11px] disabled:opacity-30">
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <span className="text-[12px] text-muted-foreground">
            {page} z {totalPages}
          </span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            className="btn-bubble btn-secondary-bubble px-3 py-1.5 text-[11px] disabled:opacity-30">
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Detail SlidePanel */}
      <SlidePanel open={!!selected} onClose={() => setSelected(null)} title="Szczegóły e-maila">
        {selected && (
          <div className="space-y-4 px-5 py-4">
            {/* Status */}
            <div className="flex items-center gap-2">
              <div className={cn("h-3 w-3 rounded-full", STATUS_STYLES[selected.status]?.dot || "bg-muted")} />
              <span className={cn(
                "inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold",
                STATUS_STYLES[selected.status]?.color || "bg-muted text-muted-foreground"
              )}>
                {STATUS_STYLES[selected.status]?.label || selected.status}
              </span>
              <span className="text-[11px] text-muted-foreground ml-auto">
                {SOURCE_LABELS[selected.triggerSource] || selected.triggerSource}
              </span>
            </div>

            {/* Details grid */}
            <div className="space-y-3">
              <DetailRow label="Typ" value={TYPE_LABELS[selected.type]?.label || selected.type} />
              <DetailRow label="Odbiorca" value={`${selected.recipientName || ""} <${selected.recipientEmail}>`} />
              <DetailRow label="Temat" value={selected.subject} />
              <DetailRow label="Utworzono" value={fmtDate(selected.createdAt)} />
              <DetailRow label="Wysłano" value={fmtDate(selected.sentAt)} />
              <DetailRow label="Ostatnia próba" value={fmtDate(selected.lastAttemptAt)} />
              <DetailRow label="Próby" value={String(selected.attempts)} />
              {selected.reservationId && (
                <div className="flex items-center justify-between py-2 border-b border-border/30">
                  <span className="text-[11px] text-muted-foreground">Rezerwacja</span>
                  <a href={`/admin/reservations/${selected.reservationId}`}
                    className="text-[12px] font-medium text-primary hover:underline flex items-center gap-1">
                    Otwórz <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
              {selected.errorMessage && (
                <div className="bg-destructive/5 border border-destructive/20 rounded-xl px-3 py-2">
                  <p className="text-[10px] font-bold text-destructive uppercase mb-1">Komunikat błędu</p>
                  <p className="text-[11px] text-destructive font-mono break-all">{selected.errorMessage}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </SlidePanel>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between py-2 border-b border-border/30">
      <span className="text-[11px] text-muted-foreground shrink-0">{label}</span>
      <span className="text-[12px] font-medium text-right ml-4 break-all">{value}</span>
    </div>
  );
}
