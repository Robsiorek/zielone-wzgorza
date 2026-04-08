"use client";

/**
 * PaymentSummary — financial overview tiles + progress bar.
 *
 * C2: Reusable in slide panel Rozliczenia + calendar-detail-panel + reservation-detail.
 */

import React from "react";
import { cn } from "@/lib/utils";
import { formatMoneyMinor } from "@/lib/format";
import { CheckCircle2, AlertTriangle, Clock } from "lucide-react";
import type { PaymentSummaryData } from "./payment-types";
import { RES_PAYMENT_STATUS } from "./payment-types";

interface Props {
  summary: PaymentSummaryData;
  /** Compact mode = single-line items, no kafle */
  compact?: boolean;
}

export function PaymentSummary({ summary, compact = false }: Props) {
  const {
    totalMinor, paidAmountMinor, balanceDueMinor, overpaidAmountMinor,
    paymentStatus, pendingCount, requiredDepositMinor, depositMet,
  } = summary;

  const paidPercent = totalMinor > 0
    ? Math.min(100, Math.round((paidAmountMinor / totalMinor) * 100))
    : 0;

  const statusCfg = RES_PAYMENT_STATUS[paymentStatus] || RES_PAYMENT_STATUS.UNPAID;

  if (compact) {
    return (
      <div className="space-y-3">
        {/* Progress bar */}
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all duration-500",
              paidPercent >= 100 ? "bg-emerald-500" : paidPercent > 0 ? "bg-amber-500" : "bg-gray-300"
            )}
            style={{ width: paidPercent + "%" }}
          />
        </div>

        {/* Summary lines */}
        <div className="space-y-2">
          <SummaryLine label="Koszt całkowity" value={formatMoneyMinor(totalMinor)} bold />
          {requiredDepositMinor > 0 && (
            <SummaryLine
              label="Wymagana przedpłata"
              value={formatMoneyMinor(requiredDepositMinor)}
              suffix={depositMet
                ? <CheckCircle2 className="h-3 w-3 text-emerald-500 ml-1" />
                : <Clock className="h-3 w-3 text-amber-500 ml-1" />
              }
            />
          )}
          <SummaryLine label="Wpłaty przyjęte" value={formatMoneyMinor(paidAmountMinor)} valueClass="text-emerald-600 dark:text-emerald-400 font-semibold" />
          {pendingCount > 0 && (
            <SummaryLine label="Wpłaty oczekujące" value={`${pendingCount} szt.`} valueClass="text-amber-600 dark:text-amber-400" />
          )}
          {overpaidAmountMinor > 0 && (
            <SummaryLine label="Nadpłata" value={formatMoneyMinor(overpaidAmountMinor)} valueClass="text-blue-600 dark:text-blue-400 font-semibold" />
          )}
          <div className="flex justify-between text-[13px] pt-2 border-t border-border/50">
            <span className="font-semibold">Saldo do zapłaty</span>
            <span className={cn("font-bold text-[14px]",
              balanceDueMinor > 0 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"
            )}>
              {formatMoneyMinor(balanceDueMinor)}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Full mode — kafle
  return (
    <div className="space-y-4">
      {/* Status badge */}
      <div className="flex items-center gap-2">
        <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", statusCfg.cls)}>
          {statusCfg.label}
        </span>
        {depositMet && requiredDepositMinor > 0 && (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="h-2.5 w-2.5" /> Zaliczka wpłacona
          </span>
        )}
        {!depositMet && requiredDepositMinor > 0 && (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 flex items-center gap-1">
            <AlertTriangle className="h-2.5 w-2.5" /> Brak zaliczki
          </span>
        )}
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex justify-between text-[11px] text-muted-foreground mb-1">
          <span>{paidPercent}% opłacono</span>
          <span>{formatMoneyMinor(paidAmountMinor)} / {formatMoneyMinor(totalMinor)}</span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all duration-500",
              paidPercent >= 100 ? "bg-emerald-500" : paidPercent > 0 ? "bg-amber-500" : "bg-gray-300"
            )}
            style={{ width: paidPercent + "%" }}
          />
        </div>
      </div>

      {/* Tiles */}
      <div className="grid grid-cols-2 gap-2">
        <Tile label="Koszt całkowity" value={formatMoneyMinor(totalMinor)} />
        <Tile label="Wpłacono" value={formatMoneyMinor(paidAmountMinor)} valueClass="text-emerald-600 dark:text-emerald-400" />
        <Tile label="Do zapłaty" value={formatMoneyMinor(balanceDueMinor)}
          valueClass={balanceDueMinor > 0 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"} />
        {overpaidAmountMinor > 0
          ? <Tile label="Nadpłata" value={formatMoneyMinor(overpaidAmountMinor)} valueClass="text-blue-600 dark:text-blue-400" />
          : requiredDepositMinor > 0
            ? <Tile label="Wymagana zaliczka" value={formatMoneyMinor(requiredDepositMinor)} />
            : <Tile label="Oczekujące" value={pendingCount > 0 ? `${pendingCount} szt.` : "—"} />
        }
      </div>
    </div>
  );
}

// ── Sub-components ──

function SummaryLine({ label, value, bold, valueClass, suffix }: {
  label: string; value: string; bold?: boolean; valueClass?: string;
  suffix?: React.ReactNode;
}) {
  return (
    <div className="flex justify-between text-[13px]">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("inline-flex items-center gap-1", bold ? "font-bold" : "font-medium", valueClass)}>
        {value}{suffix}
      </span>
    </div>
  );
}

function Tile({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="rounded-xl border border-border/50 bg-muted/20 px-3 py-2.5">
      <div className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">{label}</div>
      <div className={cn("text-[15px] font-bold mt-0.5", valueClass)}>{value}</div>
    </div>
  );
}
