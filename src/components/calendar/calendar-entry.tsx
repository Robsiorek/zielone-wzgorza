"use client";

import React, { useRef } from "react";
import { cn } from "@/lib/utils";
import { Home, Calendar, Clock, Users, Building2, User as UserIcon, Lock } from "lucide-react";
import { parseLocalDate } from "@/lib/dates";
import { Tooltip } from "@/components/ui/tooltip";
import {
  useFloating, offset, flip, shift,
  useHover, useDismiss, useInteractions,
  autoUpdate, FloatingPortal, FloatingArrow, arrow,
} from "@floating-ui/react";
import { Z } from "@/lib/z-layers";
import type { TimelineEntry } from "@/components/calendar/calendar-content";

type ViewMode = "month" | "2weeks" | "week";

interface PositionedEntry {
  entry: TimelineEntry;
  startCol: number;
  endCol: number;
  logicalEndCol: number;
  lane: number;
  totalLanes: number;
  clippedLeft: boolean;
  clippedRight: boolean;
  halfStart: boolean;
  halfEnd: boolean;
}

interface Props {
  positioned: PositionedEntry;
  colWidth: number;
  rowHeight: number;
  viewMode: ViewMode;
  resourceCount?: number;
  highlighted?: boolean;
  onGroupHover?: (hovering: boolean) => void;
  onClick: () => void;
}

// ── Status-based colors for BOOKINGS ──

const BOOKING_STATUS_STYLES: Record<string, {
  bg: string; text: string; border: string;
  bgDark: string; textDark: string; borderDark: string;
  label: string; dashed?: boolean; faded?: boolean;
}> = {
  PENDING: {
    bg: "bg-amber-100", text: "text-amber-800", border: "border-amber-300",
    bgDark: "dark:bg-amber-900/30", textDark: "dark:text-amber-400", borderDark: "dark:border-amber-700",
    label: "Oczekująca",
  },
  CONFIRMED: {
    bg: "bg-emerald-100", text: "text-emerald-800", border: "border-emerald-300",
    bgDark: "dark:bg-emerald-900/30", textDark: "dark:text-emerald-400", borderDark: "dark:border-emerald-700",
    label: "Potwierdzona",
  },
  FINISHED: {
    bg: "bg-gray-200", text: "text-gray-500", border: "border-gray-400",
    bgDark: "dark:bg-gray-800/50", textDark: "dark:text-gray-500", borderDark: "dark:border-gray-600",
    label: "Zrealizowana",
  },
  NO_SHOW: {
    bg: "bg-red-50", text: "text-red-800", border: "border-red-600",
    bgDark: "dark:bg-red-900/40", textDark: "dark:text-red-300", borderDark: "dark:border-red-500",
    label: "Niestawienie", dashed: true,
  },
  CANCELLED: {
    bg: "bg-red-100", text: "text-red-700", border: "border-red-300",
    bgDark: "dark:bg-red-900/30", textDark: "dark:text-red-400", borderDark: "dark:border-red-700",
    label: "Anulowana",
  },
};

// ── Status-based colors for OFFERS ──

const OFFER_STATUS_STYLES: Record<string, { label: string; badgeCls: string }> = {
  PENDING: { label: "Oczekująca", badgeCls: "bg-amber-200 text-amber-800 dark:bg-amber-800 dark:text-amber-200" },
  CONFIRMED: { label: "Potwierdzona", badgeCls: "bg-emerald-200 text-emerald-800 dark:bg-emerald-800 dark:text-emerald-200" },
  EXPIRED: { label: "Wygasła", badgeCls: "bg-orange-200 text-orange-800 dark:bg-orange-800 dark:text-orange-200" },
  CANCELLED: { label: "Anulowana", badgeCls: "bg-red-200 text-red-800 dark:bg-red-800 dark:text-red-200" },
};

const OFFER_STYLE = {
  bg: "bg-blue-50", text: "text-blue-800", border: "border-blue-300",
  bgDark: "dark:bg-blue-900/20", textDark: "dark:text-blue-400", borderDark: "dark:border-blue-700",
};

const BLOCK_STYLE = {
  bg: "bg-slate-200", text: "text-slate-800", border: "border-slate-400",
  bgDark: "dark:bg-slate-800/50", textDark: "dark:text-slate-300", borderDark: "dark:border-slate-600",
};

// ── Helpers ──

function clientName(entry: TimelineEntry): string {
  const client = entry.reservation?.client;
  if (!client) return "";
  if (client.companyName) return client.companyName;
  return [client.firstName, client.lastName].filter(Boolean).join(" ");
}

function getEntryStyle(entry: TimelineEntry) {
  if (entry.type === "BOOKING" && entry.reservation) {
    return BOOKING_STATUS_STYLES[entry.reservation.status] || BOOKING_STATUS_STYLES.CONFIRMED;
  }
  if (entry.type === "OFFER") return OFFER_STYLE;
  return BLOCK_STYLE;
}

function formatTooltipDate(d: string): string {
  return parseLocalDate(d).toLocaleDateString("pl-PL", { weekday: "short", day: "numeric", month: "short" });
}

function nightCount(startDate: string, endDate: string): number {
  return Math.round((parseLocalDate(endDate).getTime() - parseLocalDate(startDate).getTime()) / (1000 * 60 * 60 * 24));
}

const TYPE_LABELS: Record<string, string> = {
  BOOKING: "Rezerwacja",
  OFFER: "Oferta",
  BLOCK: "Blokada",
};

// ── Unified status config ──

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Oczekująca",
  CONFIRMED: "Potwierdzona",
  CANCELLED: "Anulowana",
  EXPIRED: "Wygasła",
  FINISHED: "Zrealizowana",
  NO_SHOW: "Niestawienie",
};

const TOOLTIP_W = 260;
const TOOLTIP_BG = "hsl(var(--foreground))";

// ── Component ──

export function CalendarEntry({ positioned, colWidth, rowHeight, viewMode, resourceCount = 1, highlighted = false, onGroupHover, onClick }: Props) {
  const { entry, startCol, endCol, logicalEndCol, lane, totalLanes, clippedLeft, clippedRight, halfStart, halfEnd } = positioned;
  const arrowRef = useRef<SVGSVGElement>(null);

  // ── Floating UI tooltip (ADR-20) ──
  const [showTooltip, setShowTooltip] = React.useState(false);

  const { refs, floatingStyles, context } = useFloating({
    open: showTooltip,
    onOpenChange: (v) => {
      setShowTooltip(v);
      onGroupHover?.(v);
    },
    placement: "top",
    strategy: "fixed",
    middleware: [
      offset(8),
      flip({ padding: 8 }),
      shift({ padding: 8 }),
      arrow({ element: arrowRef }),
    ],
    whileElementsMounted: autoUpdate,
  });

  const { getReferenceProps, getFloatingProps } = useInteractions([
    useHover(context, { delay: { open: 200, close: 75 } }),
    useDismiss(context),
  ]);

  const bookingStyle = entry.type === "BOOKING" && entry.reservation
    ? BOOKING_STATUS_STYLES[entry.reservation.status] || BOOKING_STATUS_STYLES.CONFIRMED
    : null;

  const style = getEntryStyle(entry);
  const isOffer = entry.type === "OFFER";
  const isDashed = isOffer || (entry.type === "BOOKING" && bookingStyle?.dashed);

  // Badge data
  const paymentStatus = entry.reservation?.paymentStatus;
  const isOverdue = entry.reservation?.overdue;
  const isCheckedIn = entry.reservation?.bookingDetails?.checkedInAt;
  const needsAttention = entry.reservation?.requiresAttention;

  // Layout
  const ENTRY_PADDING = 4;
  const maxLanes = Math.min(totalLanes, 2);
  const entryHeight = maxLanes > 1
    ? (rowHeight - ENTRY_PADDING * 2 - 2) / maxLanes
    : rowHeight - ENTRY_PADDING * 2;
  const visibleLane = Math.min(lane, 1);
  const top = ENTRY_PADDING + visibleLane * (entryHeight + 2);

  // Half-day offsets for checkout/checkin handoff
  const halfCol = colWidth / 2;
  const leftOffset = halfStart ? halfCol : 0;
  const rightOffset = halfEnd ? halfCol : 0;
  const left = startCol * colWidth + 2 + leftOffset;
  const width = (endCol - startCol) * colWidth - 4 - leftOffset - rightOffset;

  const name = clientName(entry);
  const number = entry.reservation?.number || "";
  const nights = nightCount(entry.startAt, entry.endAt);
  const client = entry.reservation?.client;

  // Status info (unified — from reservation)
  const resStatus = entry.reservation?.status;
  const bookingStatusInfo = entry.type === "BOOKING" && resStatus
    ? BOOKING_STATUS_STYLES[resStatus] || BOOKING_STATUS_STYLES.CONFIRMED
    : null;
  const offerStatusInfo = entry.type === "OFFER" && resStatus
    ? OFFER_STATUS_STYLES[resStatus] || OFFER_STATUS_STYLES.PENDING
    : null;

  if (lane >= 2) return null;

  // Block label
  const blockLabel = entry.type === "BLOCK" ? (entry.label || "Blokada") : name || number;

  return (
    <>
      <div
        ref={refs.setReference}
        onClick={onClick}
        {...getReferenceProps()}
        className={cn(
          "absolute z-[6] cursor-pointer transition-all duration-150",
          "hover:brightness-95 hover:z-[7] active:scale-[0.98]",
          style.bg, style.text, style.border,
          style.bgDark, style.textDark, style.borderDark,
          isDashed ? "border border-dashed" : "border",
          clippedLeft ? "rounded-l-none" : "rounded-l-lg",
          clippedRight ? "rounded-r-none" : "rounded-r-lg",
          highlighted && "ring-2 ring-foreground/30 brightness-95 z-[7]",
        )}
        style={{
          left,
          top,
          width: Math.max(width, 8),
          height: entryHeight,
        }}
      >
        {clippedLeft && (
          <div className="absolute left-0 top-0 bottom-0 w-3 bg-gradient-to-r from-black/5 to-transparent pointer-events-none" />
        )}
        {clippedRight && (
          <div className="absolute right-0 top-0 bottom-0 w-3 bg-gradient-to-l from-black/5 to-transparent pointer-events-none" />
        )}

        <div className="h-full flex items-center px-2 overflow-hidden gap-1.5">
          {/* Multi-resource badge */}
          {resourceCount > 1 && (
            <span className="shrink-0 text-[10px] font-bold opacity-70 flex items-center gap-0.5">
              <Home className="h-3 w-3" />{resourceCount}x
            </span>
          )}
          {/* Block lock icon */}
          {entry.type === "BLOCK" && (
            <Lock className="h-3 w-3 shrink-0 opacity-60" />
          )}
          {/* Client name / block label */}
          <span className="text-[11px] font-semibold truncate whitespace-nowrap leading-none">
            {blockLabel}
          </span>
          {/* Reservation number as subtle badge */}
          {number && name && entry.type !== "BLOCK" && (
            <span className="shrink-0 text-[9px] font-medium opacity-50 bg-black/5 dark:bg-white/10 px-1.5 py-0.5 rounded">
              {number}
            </span>
          )}
          {/* ── Badges (max 2, priority: overdue > attention > payment > checkIn) ── */}
          {(() => {
            if (entry.type !== "BOOKING") return null;
            const badges: React.ReactNode[] = [];
            // Priority 1: overdue
            if (isOverdue) badges.push(
              <Tooltip key="t-overdue" content="Po terminie"><span key="overdue" className="shrink-0 text-[8px] font-bold px-1 py-0.5 rounded leading-none bg-red-500 text-white">!</span></Tooltip>
            );
            // Priority 2: requiresAttention
            if (needsAttention && badges.length < 2) badges.push(
              <Tooltip key="t-attn" content="Do wyjaśnienia"><span key="attn" className="shrink-0 text-[9px] font-bold text-amber-600 dark:text-amber-400" style={{ animation: "pulse 2s ease-in-out infinite" }}>⚠</span></Tooltip>
            );
            // Priority 3: payment (only PAID or PARTIAL)
            if (badges.length < 2 && paymentStatus === "PAID") badges.push(
              <Tooltip key="t-paid" content="Opłacona"><span key="pay" className="shrink-0 text-[8px] font-bold px-1 py-0.5 rounded leading-none bg-emerald-500 text-white">$</span></Tooltip>
            );
            if (badges.length < 2 && paymentStatus === "PARTIAL") badges.push(
              <Tooltip key="t-partial" content="Częściowo opłacona"><span key="pay" className="shrink-0 text-[8px] font-bold px-1 py-0.5 rounded leading-none bg-amber-500 text-white">$</span></Tooltip>
            );
            // Priority 4: checkedIn
            if (badges.length < 2 && isCheckedIn) badges.push(
              <Tooltip key="t-ci" content="Zameldowany"><span key="ci" className="shrink-0 text-[9px] font-bold text-emerald-600 dark:text-emerald-400">✓</span></Tooltip>
            );
            return badges;
          })()}
        </div>
      </div>

      {/* ── Rich Tooltip — Floating UI (ADR-20) ── */}
      {showTooltip && (
        <FloatingPortal>
          <div
            ref={refs.setFloating}
            style={{ ...floatingStyles, zIndex: Z.TOOLTIP, pointerEvents: "none" }}
            {...getFloatingProps()}
          >
            <div
              className="text-background rounded-xl px-4 py-3 text-[11px] leading-relaxed shadow-lg relative"
              style={{ width: TOOLTIP_W, background: TOOLTIP_BG }}
            >
              {/* Header: type + number + status */}
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">
                  {TYPE_LABELS[entry.type]}
                </span>
                {number && (
                  <span className="text-[10px] font-mono opacity-50">{number}</span>
                )}
                {bookingStatusInfo && (
                  <span className={cn("ml-auto text-[9px] font-bold px-2 py-0.5 rounded-full", bookingStatusInfo.bg, bookingStatusInfo.text)}>
                    {bookingStatusInfo.label}
                  </span>
                )}
                {offerStatusInfo && (
                  <span className={cn("ml-auto text-[9px] font-bold px-2 py-0.5 rounded-full", offerStatusInfo.badgeCls)}>
                    {offerStatusInfo.label}
                  </span>
                )}
                {entry.type === "BLOCK" && resStatus && (
                  <span className="ml-auto text-[9px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                    {STATUS_LABELS[resStatus] || resStatus}
                  </span>
                )}
              </div>

              {/* Client */}
              {client && (
                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-background/10">
                  <div className="h-6 w-6 rounded-lg bg-background/15 flex items-center justify-center shrink-0">
                    {client.companyName
                      ? <Building2 className="h-3 w-3 opacity-70" />
                      : <UserIcon className="h-3 w-3 opacity-70" />
                    }
                  </div>
                  <span className="font-bold text-[12px]">{name}</span>
                </div>
              )}

              {/* Dates */}
              <div className="flex items-center gap-2 text-background/70">
                <Calendar className="h-3 w-3 shrink-0" />
                <span>{formatTooltipDate(entry.startAt)} → {formatTooltipDate(entry.endAt)}</span>
              </div>

              {/* Nights */}
              <div className="flex items-center gap-2 text-background/70 mt-1">
                <Clock className="h-3 w-3 shrink-0" />
                <span>{nights} {nights === 1 ? "noc" : nights < 5 ? "noce" : "nocy"}</span>
              </div>

              {/* Multi-resource */}
              {resourceCount > 1 && (
                <div className="flex items-center gap-2 text-background/70 mt-1">
                  <Home className="h-3 w-3 shrink-0" />
                  <span>{resourceCount} zasobów w rezerwacji</span>
                </div>
              )}

              {/* Block note */}
              {entry.type === "BLOCK" && entry.note && (
                <div className="text-background/50 mt-2 pt-2 border-t border-background/10 italic">
                  {entry.note}
                </div>
              )}

              {/* Badges row */}
              {entry.type === "BOOKING" && (
                <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-background/10 flex-wrap">
                  {isCheckedIn && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500 text-white">✓ Zameldowany</span>
                  )}
                  {needsAttention && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500 text-white">⚠ Problem</span>
                  )}
                  {isOverdue && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-500 text-white">! Po terminie</span>
                  )}
                  {paymentStatus === "PAID" && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500 text-white">Opłacona</span>
                  )}
                  {paymentStatus === "PARTIAL" && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500 text-white">Częściowo</span>
                  )}
                  {paymentStatus === "UNPAID" && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-gray-500 text-white">Nieopłacona</span>
                  )}
                </div>
              )}

              {/* Arrow — Floating UI managed */}
              <FloatingArrow
                ref={arrowRef}
                context={context}
                fill="hsl(var(--foreground))"
                width={12}
                height={6}
              />
            </div>
          </div>
        </FloatingPortal>
      )}
    </>
  );
}
