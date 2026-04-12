"use client";

import React, { useMemo, useRef, useState, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { UnitBadge } from "@/components/ui/unit-badge";
import { CalendarEntry } from "@/components/calendar/calendar-entry";
import { Plus, ShieldBan, FileText, Calendar, Clock, Home, ArrowLeftRight } from "lucide-react";
import type { TimelineResource, TimelineEntry, ViewMode } from "@/components/calendar/calendar-content";
import { dateForDB } from "@/lib/dates";

interface Props {
  resources: TimelineResource[];
  entries: TimelineEntry[];
  days: Date[];
  today: Date;
  viewMode: ViewMode;
  onEntryClick: (entry: TimelineEntry) => void;
  onCellAction?: (action: "booking" | "block" | "offer", resourceId: string, startDate: string, endDate: string) => void;
  scrollContainerRef?: React.RefObject<HTMLDivElement>;
  onScrollMount?: (el: HTMLDivElement) => void;
}

// ── Helpers ──

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function isWeekend(d: Date): boolean {
  const day = d.getDay();
  return day === 0 || day === 6;
}

function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function formatShortDate(d: Date): string {
  return d.toLocaleDateString("pl-PL", { day: "numeric", month: "short" });
}

const DAY_ABBR = ["Nd", "Pn", "Wt", "Śr", "Cz", "Pt", "So"];
const MONTH_SHORT = ["Sty", "Lut", "Mar", "Kwi", "Maj", "Cze", "Lip", "Sie", "Wrz", "Paź", "Lis", "Gru"];

export function getColWidth(mode: ViewMode): number {
  if (mode === "month") return 42;
  if (mode === "2weeks") return 80;
  return 120;
}

const ROW_HEIGHT = 48;
const RESOURCE_COL_WIDTH = 200;

// ── Group resources by category ──

interface ResourceGroup { category: string; resources: TimelineResource[]; }

function groupResources(resources: TimelineResource[]): ResourceGroup[] {
  const map = new Map<string, TimelineResource[]>();
  for (const r of resources) {
    const cat = r.category.name;
    if (!map.has(cat)) map.set(cat, []);
    map.get(cat)!.push(r);
  }
  return Array.from(map.entries()).map(([category, resources]) => ({ category, resources }));
}

// ── Compute entry positions ──

interface PositionedEntry {
  entry: TimelineEntry;
  startCol: number; endCol: number;
  logicalEndCol: number;
  lane: number; totalLanes: number;
  clippedLeft: boolean; clippedRight: boolean;
  halfStart: boolean; halfEnd: boolean;
}

function computePositions(entries: TimelineEntry[], resourceId: string, days: Date[]): PositionedEntry[] {
  if (days.length === 0) return [];
  // Use UTC dates for all calculations to avoid DST issues
  const rangeStartUTC = dateForDB(toDateStr(days[0]));
  const rangeEndUTC = new Date(rangeStartUTC.getTime() + days.length * 86400000);
  const DAY_MS = 86400000;

  const resourceEntries = entries.filter(e => e.resourceId === resourceId);
  const positioned: PositionedEntry[] = [];

  for (const entry of resourceEntries) {
    const eStart = dateForDB(entry.startAt);
    const eEnd = dateForDB(entry.endAt);
    if (eEnd <= rangeStartUTC || eStart >= rangeEndUTC) continue;
    const clippedLeft = eStart < rangeStartUTC;
    const clippedRight = eEnd > rangeEndUTC;
    const visibleStart = clippedLeft ? rangeStartUTC : eStart;
    const visibleEnd = clippedRight ? rangeEndUTC : eEnd;
    const startCol = Math.max(0, Math.round((visibleStart.getTime() - rangeStartUTC.getTime()) / DAY_MS));
    // logicalEndCol = exclusive (for availability/lane overlap)
    const logicalEndCol = Math.min(days.length, Math.round((visibleEnd.getTime() - rangeStartUTC.getTime()) / DAY_MS));
    // endCol = inclusive of checkout day (for visual rendering)
    const endCol = Math.min(days.length, clippedRight ? logicalEndCol : logicalEndCol + 1);
    if (logicalEndCol <= startCol) continue;
    const halfEnd = !clippedRight && endCol > logicalEndCol;
    positioned.push({ entry, startCol, endCol, logicalEndCol, lane: 0, totalLanes: 1, clippedLeft, clippedRight, halfStart: false, halfEnd });
  }

  // Compute halfStart: does another entry's logicalEndCol match this startCol?
  for (const p of positioned) {
    if (p.clippedLeft) continue;
    p.halfStart = positioned.some(other => other !== p && other.logicalEndCol === p.startCol);
  }

  positioned.sort((a, b) => a.startCol - b.startCol || a.logicalEndCol - b.logicalEndCol);
  for (let i = 0; i < positioned.length; i++) {
    const a = positioned[i];
    // Use logicalEndCol for overlap detection — checkout day doesn't block next checkin
    const overlapping = positioned.filter((b, j) => j < i && b.startCol < a.logicalEndCol && b.logicalEndCol > a.startCol);
    if (overlapping.length > 0) {
      const usedLanes = new Set(overlapping.map(o => o.lane));
      let lane = 0;
      while (usedLanes.has(lane)) lane++;
      a.lane = lane;
      const allOverlapping = [a, ...overlapping];
      const maxLane = Math.max(...allOverlapping.map(o => o.lane)) + 1;
      for (const o of allOverlapping) o.totalLanes = Math.max(o.totalLanes, maxLane);
    }
  }
  return positioned;
}

// ── Month headers ──

interface MonthSpan { label: string; colStart: number; colSpan: number; }

function getMonthSpans(days: Date[]): MonthSpan[] {
  const spans: MonthSpan[] = [];
  let currentLabel = "";
  let currentStart = 0;
  for (let i = 0; i < days.length; i++) {
    const label = `${MONTH_SHORT[days[i].getMonth()]} ${days[i].getFullYear()}`;
    if (label !== currentLabel) {
      if (currentLabel) spans.push({ label: currentLabel, colStart: currentStart, colSpan: i - currentStart });
      currentLabel = label;
      currentStart = i;
    }
  }
  if (currentLabel) spans.push({ label: currentLabel, colStart: currentStart, colSpan: days.length - currentStart });
  return spans;
}

// ── Selection state ──

interface SelectionState { resourceId: string; startCol: number; endCol: number; }
type SelectionPhase = "idle" | "selecting" | "confirmed";

// ── Component ──

export function CalendarGrid({ resources, entries, days, today, viewMode, onEntryClick, onCellAction, scrollContainerRef, onScrollMount }: Props) {
  const localScrollRef = useRef<HTMLDivElement>(null);
  const mergedScrollRef = useCallback((el: HTMLDivElement | null) => {
    (localScrollRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
    if (scrollContainerRef) (scrollContainerRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
    if (el && onScrollMount) onScrollMount(el);
  }, [scrollContainerRef, onScrollMount]);
  const scrollRef = localScrollRef;
  const colWidth = getColWidth(viewMode);
  const gridWidth = days.length * colWidth;
  const groups = useMemo(() => groupResources(resources), [resources]);
  const monthSpans = useMemo(() => getMonthSpans(days), [days]);
  const [highlightedGroupId, setHighlightedGroupId] = useState<string | null>(null);

  // Click-click selection
  const [phase, setPhase] = useState<SelectionPhase>("idle");
  const [selection, setSelection] = useState<SelectionState | null>(null);
  const [hoveredCell, setHoveredCell] = useState<{ resourceId: string; col: number } | null>(null);
  const [showBubble, setShowBubble] = useState(false);
  const [bubblePos, setBubblePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const startRef = useRef<{ resourceId: string; col: number } | null>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);

  const resourceCountMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of entries) {
      const groupId = e.reservationId;
      if (groupId) map.set(groupId, (map.get(groupId) || 0) + 1);
    }
    return map;
  }, [entries]);

  // Get resource name by id
  const resourceNameMap = useMemo(() => {
    const map = new Map<string, { name: string; unitNumber: string | null }>();
    for (const r of resources) map.set(r.id, { name: r.name, unitNumber: r.unitNumber });
    return map;
  }, [resources]);

  // ── Cell click handler (click-click mode) ──
  const handleCellClick = (resourceId: string, colIdx: number, e: React.MouseEvent) => {
    if (phase === "idle") {
      // First click — start selection
      startRef.current = { resourceId, col: colIdx };
      setSelection({ resourceId, startCol: colIdx, endCol: colIdx });
      setPhase("selecting");
      setShowBubble(false);
    } else if (phase === "selecting") {
      // Second click — confirm selection
      if (!startRef.current) return;
      if (resourceId !== startRef.current.resourceId) {
        // Clicked different resource — restart
        startRef.current = { resourceId, col: colIdx };
        setSelection({ resourceId, startCol: colIdx, endCol: colIdx });
        return;
      }
      // Same day = cancel (0 nights)
      if (colIdx === startRef.current.col) {
        resetSelection();
        return;
      }
      const start = Math.min(startRef.current.col, colIdx);
      const end = Math.max(startRef.current.col, colIdx);
      // startCol = check-in day, endCol = check-out day (exclusive)
      setSelection({ resourceId, startCol: start, endCol: end });
      setPhase("confirmed");

      // Show action bubble
      if (scrollRef.current) {
        const scrollRect = scrollRef.current.getBoundingClientRect();
        const scrollLeft = scrollRef.current.scrollLeft;
        const bx = Math.min(
          scrollRect.left + (end + 1) * colWidth - scrollLeft + 8,
          window.innerWidth - 220
        );
        const fr = buildFlatRows();
        const rowIdx = fr.findIndex(r => r.type === "resource" && r.resource?.id === resourceId);
        const headerH = 68;
        const catCount = fr.slice(0, rowIdx).filter(r => r.type === "category").length;
        const resCount = fr.slice(0, rowIdx).filter(r => r.type === "resource").length;
        const by = Math.min(
          scrollRect.top + headerH + catCount * 32 + resCount * ROW_HEIGHT + ROW_HEIGHT / 2,
          window.innerHeight - 140
        );
        setBubblePos({ x: bx, y: by });
        setShowBubble(true);
      }
    } else if (phase === "confirmed") {
      // Third click — reset
      resetSelection();
    }
  };

  // ── Mouse move during selection ──
  const handleCellHover = (resourceId: string, colIdx: number, e: React.MouseEvent) => {
    setHoveredCell({ resourceId, col: colIdx });
    setMousePos({ x: e.clientX, y: e.clientY });

    if (phase === "selecting" && startRef.current && resourceId === startRef.current.resourceId) {
      const start = Math.min(startRef.current.col, colIdx);
      const end = Math.max(startRef.current.col, colIdx);
      setSelection(prev => prev ? { ...prev, startCol: start, endCol: end } : null);
    }
  };

  const handleCellLeave = () => {
    setHoveredCell(null);
  };

  const resetSelection = () => {
    setPhase("idle");
    setSelection(null);
    setShowBubble(false);
    startRef.current = null;
  };

  // ESC to cancel
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") resetSelection();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  // Close bubble on outside click
  useEffect(() => {
    if (!showBubble) return;
    const handleClick = (e: MouseEvent) => {
      if (bubbleRef.current && !bubbleRef.current.contains(e.target as Node)) {
        resetSelection();
      }
    };
    setTimeout(() => document.addEventListener("mousedown", handleClick), 10);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showBubble]);

  const handleAction = (action: "booking" | "block" | "offer") => {
    if (!selection || !onCellAction) return;
    const startDate = toDateStr(days[selection.startCol]);
    // endDate = checkout day = the last column clicked (not +1)
    const endDate = toDateStr(days[selection.endCol]);
    onCellAction(action, selection.resourceId, startDate, endDate);
    resetSelection();
  };

  // Build flat rows
  const buildFlatRows = useCallback(() => {
    const rows: { type: "category" | "resource"; label: string; resource?: TimelineResource }[] = [];
    for (const group of groups) {
      if (groups.length > 1) rows.push({ type: "category", label: group.category });
      for (const r of group.resources) rows.push({ type: "resource", label: r.name, resource: r });
    }
    return rows;
  }, [groups]);

  const flatRows = useMemo(() => buildFlatRows(), [buildFlatRows]);

  // Selection info — selected columns are nights, count is inclusive
  const selectionNights = selection ? (selection.endCol - selection.startCol) : 0;
  const selectionResource = selection ? resourceNameMap.get(selection.resourceId) : null;

  return (
    <div className="bubble overflow-hidden p-0">
      <div className="flex">
        {/* ── Frozen left column ── */}
        <div className="shrink-0 border-r border-border bg-card z-10" style={{ width: RESOURCE_COL_WIDTH }}>
          <div className="h-[68px] border-b border-border flex items-end px-4 pb-2">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Zasoby</span>
          </div>
          {flatRows.map((row, i) => (
            <div
              key={i}
              className={cn(
                "border-b border-border last:border-b-0 flex items-center px-4",
                row.type === "category" ? "h-[32px] bg-muted/30" : ""
              )}
              style={row.type === "resource" ? { height: ROW_HEIGHT } : undefined}
            >
              {row.type === "category" ? (
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{row.label}</span>
              ) : (
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[13px] font-semibold truncate">{row.label}</span>
                  {row.resource?.unitNumber && <UnitBadge number={row.resource.unitNumber} size="sm" />}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* ── Scrollable date area ── */}
        <div className="flex-1 overflow-x-auto overscroll-x-contain" ref={mergedScrollRef} style={{ WebkitOverflowScrolling: "touch", contain: "layout paint style" }}>
          <div style={{ minWidth: gridWidth }}>
            {/* Date headers */}
            <div className="h-[68px] border-b border-border sticky top-0 bg-card z-10 overflow-hidden">
              <div className="flex h-[31px]">
                {monthSpans.map((span, i) => (
                  <div key={i}
                    className="flex items-center justify-center text-[11px] font-bold text-muted-foreground uppercase tracking-wider border-r border-border/50 last:border-r-0"
                    style={{ width: span.colSpan * colWidth }}>
                    {span.label}
                  </div>
                ))}
              </div>
              <div className="flex h-[36px] border-t border-border/50">
                {days.map((d, i) => {
                  const isToday = isSameDay(d, today);
                  const weekend = isWeekend(d);
                  return (
                    <div key={i}
                      className={cn(
                        "flex flex-col items-center justify-center border-r border-border/30 last:border-r-0",
                        isToday && "bg-primary/10",
                        weekend && !isToday && "bg-muted/20"
                      )}
                      style={{ width: colWidth }}>
                      <span className={cn("text-[10px] font-medium",
                        isToday ? "text-primary font-bold" : weekend ? "text-muted-foreground/60" : "text-muted-foreground")}>
                        {DAY_ABBR[d.getDay()]}
                      </span>
                      <span className={cn("text-[12px] font-semibold leading-none",
                        isToday ? "text-primary" : "text-foreground")}>
                        {d.getDate()}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Resource rows */}
            {flatRows.map((row, rowIdx) => {
              if (row.type === "category") {
                return (
                  <div key={rowIdx} className="h-[32px] border-b border-border bg-muted/30 flex">
                    {days.map((_, di) => (
                      <div key={di} className="border-r border-border/15 last:border-r-0" style={{ width: colWidth }} />
                    ))}
                  </div>
                );
              }

              const resId = row.resource!.id;
              const positioned = computePositions(entries, resId, days);
              const visible = positioned.filter(p => p.lane < 2);
              const overflow = positioned.filter(p => p.lane >= 2);
              const isSelectedRow = selection?.resourceId === resId;

              return (
                <div key={rowIdx}
                  className="border-b border-border last:border-b-0 relative select-none"
                  style={{ height: ROW_HEIGHT }}>

                  {/* Background cells — interactive */}
                  <div className="absolute inset-0 flex">
                    {days.map((d, di) => {
                      const isToday = isSameDay(d, today);
                      const weekend = isWeekend(d);
                      const isInSelection = isSelectedRow && selection && di >= selection.startCol && di <= selection.endCol;
                      const isHovered = hoveredCell?.resourceId === resId && hoveredCell?.col === di && phase === "idle";
                      return (
                        <div
                          key={di}
                          onClick={(e) => { e.preventDefault(); handleCellClick(resId, di, e); }}
                          onMouseEnter={(e) => handleCellHover(resId, di, e)}
                          onMouseMove={(e) => { if (phase === "selecting") setMousePos({ x: e.clientX, y: e.clientY }); }}
                          onMouseLeave={handleCellLeave}
                          className={cn(
                            "border-r border-border/15 last:border-r-0 h-full cursor-pointer transition-colors duration-75",
                            isToday && !isInSelection && !isHovered && "bg-primary/5",
                            weekend && !isToday && !isInSelection && !isHovered && "bg-muted/10",
                            isInSelection && "bg-primary/15",
                            isHovered && "bg-primary/25",
                          )}
                          style={{ width: colWidth }}
                        />
                      );
                    })}
                  </div>

                  {/* Selection overlay */}
                  {isSelectedRow && selection && (
                    <div
                      className="absolute z-[4] pointer-events-none"
                      style={{
                        left: selection.startCol * colWidth,
                        width: (selection.endCol - selection.startCol + 1) * colWidth,
                        top: 0,
                        height: ROW_HEIGHT,
                      }}
                    >
                      <div className="border-2 border-primary/40 border-dashed rounded-lg absolute inset-1" />
                    </div>
                  )}

                  {/* Today line */}
                  {days.some(d => isSameDay(d, today)) && (
                    <div className="absolute top-0 bottom-0 w-px bg-primary/30 z-[5]"
                      style={{ left: days.findIndex(d => isSameDay(d, today)) * colWidth + colWidth / 2 }} />
                  )}

                  {/* Entry blocks */}
                  {visible.map((pos) => {
                    const groupId = pos.entry.reservationId || null;
                    const resourceCount = groupId ? (resourceCountMap.get(groupId) || 1) : 1;
                    return (
                      <CalendarEntry
                        key={pos.entry.id}
                        positioned={pos}
                        colWidth={colWidth}
                        rowHeight={ROW_HEIGHT}
                        viewMode={viewMode}
                        resourceCount={resourceCount}
                        highlighted={groupId !== null && highlightedGroupId === groupId}
                        onGroupHover={(hovering) => {
                          if (resourceCount > 1 && groupId) setHighlightedGroupId(hovering ? groupId : null);
                        }}
                        onClick={() => onEntryClick(pos.entry)}
                      />
                    );
                  })}

                  {/* Handoff markers (checkout A = checkin B) */}
                  {(() => {
                    const handoffs: number[] = [];
                    for (const a of positioned) {
                      for (const b of positioned) {
                        if (a === b) continue;
                        if (a.logicalEndCol === b.startCol && a.lane === b.lane) {
                          handoffs.push(a.logicalEndCol);
                        }
                      }
                    }
                    return [...new Set(handoffs)].map(col => (
                      <div
                        key={`handoff-${col}`}
                        className="absolute z-[9] flex items-center justify-center pointer-events-none"
                        style={{
                          left: col * colWidth + colWidth / 2 - 9,
                          top: 0,
                          width: 18,
                          height: ROW_HEIGHT,
                        }}
                      >
                        <div className="h-5 w-5 rounded-full bg-background border-2 border-border flex items-center justify-center animate-handoff">
                          <ArrowLeftRight className="h-2.5 w-2.5 text-muted-foreground" />
                        </div>
                      </div>
                    ));
                  })()}

                  {/* Overflow badge */}
                  {overflow.length > 0 && (() => {
                    const first = overflow[0];
                    return (
                      <div className="absolute z-[8] flex items-center justify-center"
                        style={{ left: first.startCol * colWidth + 2, top: ROW_HEIGHT - 14, height: 12 }}>
                        <span className="text-[9px] font-bold text-muted-foreground bg-muted px-1.5 rounded-full border border-border">
                          +{overflow.length}
                        </span>
                      </div>
                    );
                  })()}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Floating info during selection (portal) ── */}
      {phase === "selecting" && selection && selectionNights > 0 && selectionResource && typeof document !== "undefined" && createPortal(
        <div
          className="fixed z-[80] pointer-events-none"
          style={{ left: mousePos.x + 16, top: mousePos.y - 40 }}
        >
          <div className="bg-foreground text-background rounded-xl px-3 py-2 text-[11px] shadow-lg whitespace-nowrap">
            <div className="font-bold flex items-center gap-1.5 mb-0.5">
              <Home className="h-3 w-3 opacity-60" />
              {selectionResource.name}
              {selectionResource.unitNumber && <span className="opacity-50 text-[9px]">NR. {selectionResource.unitNumber}</span>}
            </div>
            <div className="flex items-center gap-3 text-background/70">
              <span className="flex items-center gap-1">
                <Calendar className="h-2.5 w-2.5" />
                {formatShortDate(days[selection.startCol])} — {formatShortDate(days[selection.endCol])}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-2.5 w-2.5" />
                {selectionNights} {selectionNights === 1 ? "noc" : selectionNights < 5 ? "noce" : "nocy"}
              </span>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── Action Bubble (portal) ── */}
      {showBubble && selection && typeof document !== "undefined" && createPortal(
        <div
          ref={bubbleRef}
          className="fixed z-[90] fade-in-scale"
          style={{ left: bubblePos.x, top: bubblePos.y, transform: "translate(-50%, -50%)" }}
        >
          <div className="bg-card border-2 border-border rounded-2xl py-2 px-2" style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.12)" }}>
            {/* Selection summary */}
            <div className="px-3 py-2 border-b border-border/50 mb-1">
              <div className="text-[11px] font-bold">{selectionResource?.name}</div>
              <div className="text-[10px] text-muted-foreground">
                {formatShortDate(days[selection.startCol])} — {formatShortDate(days[selection.endCol])}
                <span className="ml-2">{selectionNights} {selectionNights === 1 ? "noc" : selectionNights < 5 ? "noce" : "nocy"}</span>
              </div>
            </div>
            <button
              onClick={() => handleAction("booking")}
              className="w-full text-left px-3 py-2.5 hover:bg-muted/50 transition-colors flex items-center gap-3 text-[13px] rounded-xl"
            >
              <Plus className="h-4 w-4 text-emerald-500" /> Dodaj rezerwację
            </button>
            <button
              onClick={() => handleAction("offer")}
              className="w-full text-left px-3 py-2.5 hover:bg-muted/50 transition-colors flex items-center gap-3 text-[13px] rounded-xl"
            >
              <FileText className="h-4 w-4 text-blue-500" /> Dodaj ofertę
            </button>
            <button
              onClick={() => handleAction("block")}
              className="w-full text-left px-3 py-2.5 hover:bg-muted/50 transition-colors flex items-center gap-3 text-[13px] rounded-xl"
            >
              <ShieldBan className="h-4 w-4 text-slate-500" /> Dodaj blokadę
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
