"use client";

/**
 * PaymentList — grouped payment list with inline Confirm/Reject actions.
 *
 * C2: Supports compact mode (last 3) and full mode (grouped by status).
 * Optimistic disable + spinner on action buttons per ChatGPT korekta #2.
 */

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { formatMoneyMinor } from "@/lib/format";
import {
  ArrowDownCircle, ArrowUpCircle, Settings2,
  Check, X, Loader2,
  CreditCard, Calendar, Hash, User, MessageSquare, AlertTriangle,
} from "lucide-react";
import type { PaymentRow } from "./payment-types";
import {
  KIND_LABELS, KIND_COLORS, METHOD_LABELS, STATUS_CONFIG,
  formatPaymentDate, formatActorName,
} from "./payment-types";

interface Props {
  payments: PaymentRow[];
  /** Compact = show only last N items, no grouping */
  compact?: number;
  /** Currently loading action (paymentId or null) */
  actionLoading?: string | null;
  onConfirm?: (paymentId: string) => Promise<any>;
  onReject?: (paymentId: string, reason?: string) => Promise<any>;
}

const KIND_ICONS: Record<string, React.ElementType> = {
  CHARGE: ArrowDownCircle,
  REFUND: ArrowUpCircle,
  ADJUSTMENT: Settings2,
};

export function PaymentList({ payments, compact, actionLoading, onConfirm, onReject }: Props) {
  const [rejectDialog, setRejectDialog] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  if (payments.length === 0) {
    return (
      <div className="text-center text-[12px] text-muted-foreground py-4">
        Brak płatności
      </div>
    );
  }

  // Compact: show last N
  if (compact) {
    const recent = payments.slice(0, compact);
    return (
      <div className="space-y-1.5">
        {recent.map(p => (
          <PaymentItem key={p.id} payment={p} actionLoading={actionLoading}
            onConfirm={onConfirm} onRejectClick={() => { setRejectDialog(p.id); setRejectReason(""); }} />
        ))}
        {rejectDialog && (
          <RejectDialog
            paymentId={rejectDialog}
            reason={rejectReason}
            onReasonChange={setRejectReason}
            loading={actionLoading === rejectDialog}
            onConfirm={async () => {
              if (onReject) await onReject(rejectDialog, rejectReason);
              setRejectDialog(null);
            }}
            onCancel={() => setRejectDialog(null)}
          />
        )}
      </div>
    );
  }

  // Full: grouped
  const pending = payments.filter(p => p.paymentStatus === "PENDING");
  const confirmed = payments.filter(p => p.paymentStatus === "CONFIRMED");
  const other = payments.filter(p => p.paymentStatus !== "PENDING" && p.paymentStatus !== "CONFIRMED");

  return (
    <div className="space-y-4">
      {pending.length > 0 && (
        <PaymentGroup title="Oczekujące" count={pending.length} payments={pending}
          actionLoading={actionLoading} onConfirm={onConfirm}
          onRejectClick={(id) => { setRejectDialog(id); setRejectReason(""); }} />
      )}
      {confirmed.length > 0 && (
        <PaymentGroup title="Potwierdzone" count={confirmed.length} payments={confirmed}
          actionLoading={actionLoading} />
      )}
      {other.length > 0 && (
        <PaymentGroup title="Odrzucone / Inne" count={other.length} payments={other}
          actionLoading={actionLoading} />
      )}
      {rejectDialog && (
        <RejectDialog
          paymentId={rejectDialog}
          reason={rejectReason}
          onReasonChange={setRejectReason}
          loading={actionLoading === rejectDialog}
          onConfirm={async () => {
            if (onReject) await onReject(rejectDialog, rejectReason);
            setRejectDialog(null);
          }}
          onCancel={() => setRejectDialog(null)}
        />
      )}
    </div>
  );
}

// ── Group ──

function PaymentGroup({ title, count, payments, actionLoading, onConfirm, onRejectClick }: {
  title: string; count: number; payments: PaymentRow[];
  actionLoading?: string | null;
  onConfirm?: (id: string) => Promise<any>;
  onRejectClick?: (id: string) => void;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[12px] font-semibold text-muted-foreground">{title}</span>
        <span className="text-[10px] text-muted-foreground">({count})</span>
      </div>
      <div className="space-y-1.5">
        {payments.map(p => (
          <PaymentItem key={p.id} payment={p} actionLoading={actionLoading}
            onConfirm={onConfirm} onRejectClick={onRejectClick ? () => onRejectClick(p.id) : undefined} />
        ))}
      </div>
    </div>
  );
}

// ── Single payment item — rich layout ──

function PaymentItem({ payment, actionLoading, onConfirm, onRejectClick }: {
  payment: PaymentRow;
  actionLoading?: string | null;
  onConfirm?: (id: string) => Promise<any>;
  onRejectClick?: () => void;
}) {
  const p = payment;
  const kindLabel = KIND_LABELS[p.kind || ""] || "Operacja";
  const kindColor = KIND_COLORS[p.kind || ""] || "";
  const kindBg = p.kind === "REFUND"
    ? "bg-red-50 dark:bg-red-900/20"
    : p.kind === "ADJUSTMENT"
      ? "bg-blue-50 dark:bg-blue-900/20"
      : "bg-emerald-50 dark:bg-emerald-900/20";
  const Icon = KIND_ICONS[p.kind || ""] || ArrowDownCircle;
  const methodLabel = METHOD_LABELS[p.method] || p.method;
  const statusCfg = STATUS_CONFIG[p.paymentStatus || ""] || STATUS_CONFIG.PENDING;
  const isThisLoading = actionLoading === p.id;
  const isPending = p.paymentStatus === "PENDING";

  return (
    <div className={cn(
      "rounded-2xl border-2 border-border/50 px-4 py-3.5 transition-colors",
      "hover:bg-muted/20"
    )}>
      {/* Row 1: Icon + Amount + Status */}
      <div className="flex items-center gap-3">
        {/* Icon in colored circle */}
        <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center shrink-0", kindBg)}>
          <Icon className={cn("h-4 w-4", kindColor)} />
        </div>

        {/* Amount + kind label */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={cn("text-[15px] font-bold", kindColor)}>
              {p.direction === "OUT" ? "−" : "+"}{formatMoneyMinor(p.amountMinor)}
            </span>
            <span className={cn("text-[9px] font-semibold px-1.5 py-0.5 rounded-full", statusCfg.cls)}>
              {statusCfg.label}
            </span>
          </div>
          <span className="text-[11px] text-muted-foreground">{kindLabel}</span>
        </div>
      </div>

      {/* Row 2: Details with icons */}
      <div className="mt-2 pl-12 flex flex-wrap items-center gap-x-4 gap-y-1">
        <DetailChip icon={CreditCard} text={methodLabel} />
        <DetailChip icon={Calendar} text={formatPaymentDate(p.occurredAt || p.createdAt)} />
        {p.referenceNumber && <DetailChip icon={Hash} text={p.referenceNumber} />}
        {p.createdByUser && <DetailChip icon={User} text={formatActorName(p.createdByUser)} />}
      </div>

      {/* Row 3: Note / Rejection reason */}
      {(p.note || p.rejectionReason) && (
        <div className="mt-1.5 pl-12">
          {p.note && (
            <div className="text-[11px] text-muted-foreground flex items-start gap-1.5">
              <MessageSquare className="h-3 w-3 mt-0.5 shrink-0 text-muted-foreground/60" />
              <span>{p.note}</span>
            </div>
          )}
          {p.rejectionReason && (
            <div className="text-[11px] text-red-600 dark:text-red-400 flex items-start gap-1.5 mt-0.5">
              <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
              <span>Powód: {p.rejectionReason}</span>
            </div>
          )}
        </div>
      )}

      {/* Row 4: Actions for PENDING — own row, never overlaps */}
      {isPending && (onConfirm || onRejectClick) && (
        <div className="mt-2.5 pl-12 flex items-center gap-1.5">
          {onConfirm && (
            <button
              disabled={isThisLoading}
              onClick={() => onConfirm(p.id)}
              className="btn-bubble btn-primary-bubble h-7 px-2.5 text-[10px] font-semibold flex items-center gap-1 disabled:opacity-50"
            >
              {isThisLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
              Zatwierdź
            </button>
          )}
          {onRejectClick && (
            <button
              disabled={isThisLoading}
              onClick={onRejectClick}
              className="btn-bubble btn-danger-bubble h-7 px-2.5 text-[10px] font-semibold flex items-center gap-1 disabled:opacity-50"
            >
              <X className="h-3 w-3" /> Odrzuć
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/** Small chip with icon + text — used in payment detail row */
function DetailChip({ icon: ChipIcon, text }: { icon: React.ElementType; text: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
      <ChipIcon className="h-3 w-3 text-muted-foreground/50" />
      {text}
    </span>
  );
}

// ── Reject dialog (self-contained, matching ConfirmDialog style) ──

function RejectDialog({ paymentId, reason, onReasonChange, loading, onConfirm, onCancel }: {
  paymentId: string; reason: string; onReasonChange: (v: string) => void;
  loading: boolean; onConfirm: () => void; onCancel: () => void;
}) {
  if (!paymentId) return null;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500 }}>
      <div className="absolute inset-0 bg-black/25 fade-in" style={{ backdropFilter: "blur(4px)" }}
        onClick={onCancel} />
      <div className="absolute inset-0 flex items-center justify-center p-6">
        <div className="bg-card w-full max-w-[400px] rounded-[20px] fade-in-scale"
          style={{ border: "none", boxShadow: "0 8px 40px rgba(0,0,0,0.12)" }}>
          <div className="flex items-center gap-3 px-6 pt-6 pb-3">
            <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "hsl(var(--destructive) / 0.1)" }}>
              <X style={{ width: 20, height: 20, color: "hsl(var(--destructive))" }} />
            </div>
            <div>
              <h3 className="text-[15px] font-bold">Odrzuć płatność</h3>
              <p className="text-[12px] text-muted-foreground mt-0.5">Operacja jest nieodwracalna.</p>
            </div>
          </div>
          <div className="px-6 pb-4">
            <label className="text-[12px] font-semibold text-muted-foreground block mb-1.5">
              Powód odrzucenia (opcjonalnie)
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => onReasonChange(e.target.value)}
              placeholder="np. Błędna kwota, duplikat..."
              className="input-bubble h-11 w-full text-[13px]"
            />
          </div>
          <div className="flex gap-3 px-6 pb-6">
            <button onClick={onCancel}
              className="btn-bubble btn-secondary-bubble flex-1 h-11 text-[13px] font-semibold">
              Anuluj
            </button>
            <button onClick={onConfirm} disabled={loading}
              className="btn-bubble btn-danger-bubble flex-1 h-11 text-[13px] font-semibold flex items-center justify-center gap-2 disabled:opacity-50">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {loading ? "Odrzucanie..." : "Odrzuć płatność"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
