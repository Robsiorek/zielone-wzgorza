"use client";

import React, { useState, useCallback, useEffect, useRef, useMemo } from "react";
import {
  ChevronLeft, ChevronRight, Plus, MoreVertical,
  ShieldBan, FileText, CalendarDays, Search, X,
  Loader2, Home, Lock, Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api-fetch";
import { useToast } from "@/components/ui/toast";
import { CalendarSkeleton } from "@/components/calendar/calendar-skeleton";
import { CalendarGrid, getColWidth } from "@/components/calendar/calendar-grid";
import { CalendarDetailPanel } from "@/components/calendar/calendar-detail-panel";
import { UnifiedPanel, type UnifiedPrefill, type PanelTab } from "@/components/unified-panel";
import { BubbleSelect } from "@/components/ui/bubble-select";
import { parseLocalDate } from "@/lib/dates";

// ── Types (v5.0 — Multi-Type Resources) ──

export interface TimelineResource {
  id: string; name: string; unitNumber: string | null; maxCapacity: number | null; totalUnits: number;
  category: { name: string; slug: string; type: string };
}
export interface TimelineClient {
  id: string; firstName: string | null; lastName: string | null; companyName: string | null;
}
export interface TimelineReservation {
  id: string;
  number: string;
  type: "BOOKING" | "OFFER" | "BLOCK";
  status: string;
  adults: number | null;
  children: number | null;
  total: any;
  paymentStatus: string | null;
  requiresAttention: boolean;
  overdue: boolean;
  client: TimelineClient | null;
  offerDetails: { expiresAt: string | null; sentAt: string | null; viewedAt: string | null } | null;
  bookingDetails: { confirmedAt: string | null; checkedInAt: string | null; checkedOutAt: string | null; paidAmount: any; balanceDue: any } | null;
}
export interface TimelineReservationItem {
  id: string; categoryType: string; quantity: number;
  pricePerUnit: any; totalPrice: any; adults: number; children: number;
}
export interface TimelineEntry {
  id: string; type: "BOOKING" | "OFFER" | "BLOCK"; status: string;
  resourceId: string; startAt: string; endAt: string;
  quantityReserved: number;
  label: string | null; note: string | null;
  reservationId: string | null;
  reservationItemId: string | null;
  resource: TimelineResource;
  reservation: TimelineReservation | null;
  reservationItem: TimelineReservationItem | null;
}
export type ViewMode = "month" | "2weeks" | "week";

// ── Helpers ──

function addDays(d: Date, n: number): Date { const r = new Date(d); r.setDate(r.getDate() + n); return r; }
function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function monthKey(y: number, m: number): string {
  return `${y}-${String(m + 1).padStart(2, "0")}`;
}
function monthStartDate(y: number, m: number): Date { return new Date(y, m, 1); }
function monthEndDate(y: number, m: number): Date { return addDays(new Date(y, m + 1, 0), 1); }
function getDays(start: Date, end: Date): Date[] {
  const days: Date[] = []; let cur = new Date(start);
  while (cur < end) { days.push(new Date(cur)); cur = addDays(cur, 1); }
  return days;
}
function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

const MONTHS_PL = ["Styczeń","Luty","Marzec","Kwiecień","Maj","Czerwiec","Lipiec","Sierpień","Wrzesień","Październik","Listopad","Grudzień"];
const DAYS_PL = ["Pn","Wt","Śr","Cz","Pt","So","Nd"];

interface SearchResult {
  id: string; number: string; type: string; status: string;
  checkIn: string; checkOut: string;
  client: { firstName: string | null; lastName: string | null; companyName: string | null } | null;
}

// ── Month cache type ──
interface MonthData {
  entries: TimelineEntry[];
  loaded: boolean;
  loading: boolean;
  error: boolean;
}

// ── Component ──

export function CalendarContent() {
  const { error: showError } = useToast();
  const today = useMemo(() => new Date(), []);
  const colWidth = getColWidth("month");

  // ── Month-based cache: key = "YYYY-MM" ──
  const [monthCache, setMonthCache] = useState<Record<string, MonthData>>({});
  const [resources, setResources] = useState<TimelineResource[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);

  // Loaded months range (handles year rollover)
  const [loadedRange, setLoadedRange] = useState(() => {
    const sNum = today.getFullYear() * 12 + today.getMonth() - 1;
    const eNum = today.getFullYear() * 12 + today.getMonth() + 4;
    return {
      startY: Math.floor(sNum / 12), startM: ((sNum % 12) + 12) % 12,
      endY: Math.floor(eNum / 12), endM: eNum % 12,
    };
  });

  // Max: 24 months from today — SINGLE SOURCE OF TRUTH
  const maxMonthNum = today.getFullYear() * 12 + today.getMonth() + 24;
  const maxYear = Math.floor(maxMonthNum / 12);
  const maxMonth = maxMonthNum % 12;

  // Panels
  const [hiddenTypes, setHiddenTypes] = useState<Set<string>>(new Set());
  const [selectedEntry, setSelectedEntry] = useState<TimelineEntry | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [dataVersion, setDataVersion] = useState(0);
  const [unifiedOpen, setUnifiedOpen] = useState(false);
  const [unifiedTab, setUnifiedTab] = useState<PanelTab>("booking");
  const [unifiedPrefill, setUnifiedPrefill] = useState<UnifiedPrefill | null>(null);
  const [unifiedMode, setUnifiedMode] = useState<"create" | "edit">("create");
  const [editReservationId, setEditReservationId] = useState<string | null>(null);
  const [convertBlockId, setConvertBlockId] = useState<string | null>(null);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  // Picker
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const [pickerYear, setPickerYear] = useState(today.getFullYear());
  const [pickerMonth, setPickerMonth] = useState(today.getMonth());

  // Search
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const pendingReservationId = useRef<string | null>(null);

  // Scroll
  const [visibleMonthLabel, setVisibleMonthLabel] = useState(() => `${MONTHS_PL[today.getMonth()]} ${today.getFullYear()}`);
  const expanding = useRef(false);
  const pendingScrollTarget = useRef<Date | null>(null);

  // ── Close menus ──
  useEffect(() => {
    if (!moreMenuOpen && !pickerOpen && !searchOpen) return;
    const handler = (e: MouseEvent) => {
      if (moreMenuOpen && moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) setMoreMenuOpen(false);
      if (pickerOpen && pickerRef.current && !pickerRef.current.contains(e.target as Node)) setPickerOpen(false);
      if (searchOpen && searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [moreMenuOpen, pickerOpen, searchOpen]);

  // ── Load single month (ref-based guard to avoid circular deps) ──
  const loadingMonths = useRef<Set<string>>(new Set());
  const loadedMonthsRef = useRef<Set<string>>(new Set());

  const loadMonth = useCallback(async (y: number, m: number) => {
    const key = monthKey(y, m);
    if (loadedMonthsRef.current.has(key) || loadingMonths.current.has(key)) return;

    loadingMonths.current.add(key);
    setMonthCache(prev => ({ ...prev, [key]: { entries: [], loaded: false, loading: true, error: false } }));

    try {
      const s = monthStartDate(y, m);
      const e = monthEndDate(y, m);
      const data = await apiFetch(`/api/timeline?startDate=${toDateStr(s)}&endDate=${toDateStr(e)}`);
      loadedMonthsRef.current.add(key);
      loadingMonths.current.delete(key);
      setMonthCache(prev => ({
        ...prev,
        [key]: { entries: data.entries || [], loaded: true, loading: false, error: false },
      }));
      if (data.resources?.length) setResources(data.resources);
    } catch (err: any) {
      loadingMonths.current.delete(key);
      setMonthCache(prev => ({ ...prev, [key]: { entries: [], loaded: false, loading: false, error: true } }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Stable ref so effects don't depend on loadMonth identity
  const loadMonthRef = useRef(loadMonth);
  loadMonthRef.current = loadMonth;

  // ── Load months when range changes ──
  useEffect(() => {
    const { startY, startM, endY, endM } = loadedRange;
    let y = startY, m = startM;
    const promises: Promise<void>[] = [];
    while (y * 12 + m <= endY * 12 + endM) {
      promises.push(loadMonthRef.current(y, m));
      m++;
      if (m > 11) { m = 0; y++; }
    }
    if (promises.length > 0) {
      Promise.all(promises).then(() => setInitialLoading(false));
    } else {
      setInitialLoading(false);
    }
  }, [loadedRange]);

  // ── Computed days + merged entries from cache ──
  const rangeStart = useMemo(() => monthStartDate(loadedRange.startY, loadedRange.startM), [loadedRange]);
  const rangeEnd = useMemo(() => monthEndDate(loadedRange.endY, loadedRange.endM), [loadedRange]);
  const days = useMemo(() => getDays(rangeStart, rangeEnd), [rangeStart, rangeEnd]);

  const allEntries = useMemo(() => {
    const all: TimelineEntry[] = [];
    const seen = new Set<string>();
    for (const [, data] of Object.entries(monthCache)) {
      if (!data.loaded) continue;
      for (const e of data.entries) {
        if (!seen.has(e.id)) { seen.add(e.id); all.push(e); }
      }
    }
    return all;
  }, [monthCache]);

  const anyLoading = useMemo(() => Object.values(monthCache).some(d => d.loading), [monthCache]);
  const errorCount = useMemo(() => Object.values(monthCache).filter(d => d.error).length, [monthCache]);

  const retryFailedMonths = () => {
    for (const [key, data] of Object.entries(monthCache)) {
      if (data.error) {
        const [yStr, mStr] = key.split("-");
        loadMonthRef.current(parseInt(yStr), parseInt(mStr) - 1);
      }
    }
  };

  // ── Initial scroll: fires when grid scroll container mounts ──
  const hasScrolledInitial = useRef(false);
  const gridScrollRef = useRef<HTMLDivElement | null>(null);

  const handleScrollMount = useCallback((el: HTMLDivElement) => {
    gridScrollRef.current = el;
    if (hasScrolledInitial.current || days.length === 0) return;
    const idx = days.findIndex(d => isSameDay(d, today));
    if (idx >= 0) {
      el.scrollLeft = Math.max(0, idx * colWidth - 100);
      hasScrolledInitial.current = true;
      const centerCol = Math.floor((el.scrollLeft + el.clientWidth / 3) / colWidth);
      if (centerCol >= 0 && centerCol < days.length) {
        const d = days[centerCol];
        setVisibleMonthLabel(`${MONTHS_PL[d.getMonth()]} ${d.getFullYear()}`);
      }
    }
  }, [days, today, colWidth]);

  // Backup: scroll to today when days populate
  useEffect(() => {
    const el = gridScrollRef.current;
    if (!el || hasScrolledInitial.current || days.length === 0) return;
    const idx = days.findIndex(d => isSameDay(d, today));
    if (idx >= 0) {
      el.scrollLeft = Math.max(0, idx * colWidth - 100);
      hasScrolledInitial.current = true;
    }
  }, [days, today, colWidth]);

  // ── Scroll helpers ──

  const scrollToDate = useCallback((target: Date) => {
    const el = gridScrollRef.current;
    if (!el || days.length === 0) return;
    const idx = days.findIndex(d => isSameDay(d, target));
    if (idx >= 0) {
      el.scrollTo({ left: Math.max(0, idx * colWidth - 100), behavior: "smooth" });
    }
  }, [days, colWidth]);

  const scrollToToday = useCallback(() => scrollToDate(today), [scrollToDate, today]);

  const scrollByDays = useCallback((delta: number) => {
    const el = gridScrollRef.current;
    if (!el) return;
    el.scrollBy({ left: delta * colWidth, behavior: "smooth" });
  }, [colWidth]);

  // ── Expand range ──

  const expandRange = useCallback((direction: "past" | "future", count: number = 2) => {
    if (expanding.current) return;
    expanding.current = true;

    setLoadedRange(prev => {
      if (direction === "past") {
        let newStartNum = prev.startY * 12 + prev.startM - count;
        const minNum = today.getFullYear() * 12 + today.getMonth() - 12;
        newStartNum = Math.max(newStartNum, minNum);
        return {
          ...prev,
          startY: Math.floor(newStartNum / 12),
          startM: ((newStartNum % 12) + 12) % 12,
        };
      } else {
        let newEndNum = prev.endY * 12 + prev.endM + count;
        newEndNum = Math.min(newEndNum, maxMonthNum);
        return {
          ...prev,
          endY: Math.floor(newEndNum / 12),
          endM: newEndNum % 12,
        };
      }
    });

    setTimeout(() => { expanding.current = false; }, 500);
  }, [today, maxMonthNum]);

  // ── Infinite scroll ──

  const handleScroll = useCallback(() => {
    const el = gridScrollRef.current;
    if (!el || days.length === 0) return;

    // Update month label
    const centerCol = Math.floor((el.scrollLeft + el.clientWidth / 3) / colWidth);
    if (centerCol >= 0 && centerCol < days.length) {
      const d = days[centerCol];
      setVisibleMonthLabel(`${MONTHS_PL[d.getMonth()]} ${d.getFullYear()}`);
    }

    // Expand past
    if (el.scrollLeft < colWidth * 15) expandRange("past");
    // Expand future
    if (el.scrollWidth - (el.scrollLeft + el.clientWidth) < colWidth * 15) expandRange("future");
  }, [days, colWidth, expandRange]);

  // ── Jump to month (from picker) ──

  const jumpToDate = useCallback((year: number, month: number, day?: number) => {
    setPickerOpen(false);
    const target = new Date(year, month, day || 1);
    const targetNum = year * 12 + month;
    const startNum = loadedRange.startY * 12 + loadedRange.startM;
    const endNum = loadedRange.endY * 12 + loadedRange.endM;

    if (targetNum >= startNum && targetNum <= endNum) {
      scrollToDate(target);
    } else {
      pendingScrollTarget.current = target;
      const newStart = Math.max(today.getFullYear() * 12 + today.getMonth() - 12, targetNum - 2);
      const newEnd = Math.min(maxMonthNum, targetNum + 4);
      setLoadedRange({
        startY: Math.floor(newStart / 12), startM: ((newStart % 12) + 12) % 12,
        endY: Math.floor(newEnd / 12), endM: newEnd % 12,
      });
    }
  }, [loadedRange, scrollToDate, today, maxMonthNum]);

  // Scroll after range expansion
  useEffect(() => {
    if (!pendingScrollTarget.current) return;
    const target = pendingScrollTarget.current;
    const idx = days.findIndex(d => isSameDay(d, target));
    if (idx >= 0) {
      pendingScrollTarget.current = null;
      setTimeout(() => scrollToDate(target), 100);
    }
  }, [days, scrollToDate]);

  // ── Toggle visibility ──

  const toggleType = (type: string) => {
    setHiddenTypes(prev => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type); else next.add(type);
      return next;
    });
  };

  // ── Entry click ──

  const handleEntryClick = useCallback((entry: TimelineEntry) => {
    setSelectedEntry(entry);
    setPanelOpen(true);
  }, []);

  const handlePanelClose = () => { setPanelOpen(false); setSelectedEntry(null); };

  // ── Invalidate months ──

  const invalidateMonths = useCallback((startDate: string, endDate: string) => {
    const start = parseLocalDate(startDate);
    const end = parseLocalDate(endDate);
    const keysToInvalidate: string[] = [];
    let y = start.getFullYear(), m = start.getMonth();
    const endNum = end.getFullYear() * 12 + end.getMonth();
    while (y * 12 + m <= endNum) {
      const key = monthKey(y, m);
      loadedMonthsRef.current.delete(key);
      loadingMonths.current.delete(key);
      keysToInvalidate.push(key);
      m++;
      if (m > 11) { m = 0; y++; }
    }
    // Clear stale entries from cache immediately (prevents showing old+new)
    setMonthCache(prev => {
      const next = { ...prev };
      for (const key of keysToInvalidate) delete next[key];
      return next;
    });
    // Re-trigger loading
    setLoadedRange(prev => ({ ...prev }));
  }, []);

  const handleDataRefresh = useCallback(() => {
    const el = gridScrollRef.current;
    if (!el || days.length === 0) return;
    const leftCol = Math.floor(el.scrollLeft / colWidth);
    const rightCol = Math.min(days.length - 1, Math.ceil((el.scrollLeft + el.clientWidth) / colWidth));
    const leftDate = days[Math.max(0, leftCol)];
    const rightDate = days[Math.min(days.length - 1, rightCol)];
    invalidateMonths(toDateStr(leftDate), toDateStr(rightDate));
  }, [days, colWidth, invalidateMonths]);

  const handleBlockCreated = useCallback((startDate: string) => {
    const sd = parseLocalDate(startDate);
    const nextM = new Date(sd.getFullYear(), sd.getMonth() + 1, 1);
    invalidateMonths(startDate, toDateStr(nextM));
    setTimeout(() => scrollToDate(sd), 300);
  }, [invalidateMonths]);

  // ── Edit reservation ──
  const handleEditReservation = useCallback((reservationId: string) => {
    setEditReservationId(reservationId);
    setUnifiedMode("edit");
    setUnifiedPrefill(null);
    setUnifiedOpen(true);
  }, []);

  // ── Convert block to reservation/offer ──
  const handleConvertBlock = useCallback(async (reservationId: string) => {
    // Fetch full block data from API (source of truth, not timeline)
    try {
      const data = await apiFetch(`/api/reservations/${reservationId}`);
      const block = data.reservation;
      if (!block) return;

      const resources = (block.items || []).map((item: any) => ({
        resourceId: item.resource?.id || item.resourceId,
        resourceName: item.resource?.name || "",
        resourceUnitNumber: item.resource?.unitNumber || null,
      })).filter((r: any) => r.resourceId);

      const startDate = block.checkIn?.split("T")[0] || "";
      const endDate = block.checkOut?.split("T")[0] || "";

      setConvertBlockId(reservationId);
      setEditReservationId(null);
      setUnifiedMode("create");
      setUnifiedTab("booking");
      setUnifiedPrefill({ startDate, endDate, resources });
      setUnifiedOpen(true);
    } catch (e) {
      console.error("Failed to load block data:", e);
    }
  }, []);

  const handleEdited = useCallback((timelineChanged: boolean, oldRange: { checkIn: string; checkOut: string } | null, newRange: { checkIn: string; checkOut: string } | null) => {
    setDataVersion(v => v + 1);
    // Always clear month cache for affected months + refetch
    // (PATCH always rebuilds timeline when items are in payload)
    if (oldRange) invalidateMonths(oldRange.checkIn, oldRange.checkOut);
    if (newRange && newRange.checkIn !== oldRange?.checkIn) invalidateMonths(newRange.checkIn, newRange.checkOut);
    // Also refresh visible area to catch any edge cases
    handleDataRefresh();
  }, [invalidateMonths, handleDataRefresh]);

  const handleCellAction = (action: "booking" | "block" | "offer", resourceId: string, startDate: string, endDate: string) => {
    const res = resources.find(r => r.id === resourceId);
    setUnifiedMode("create");
    setEditReservationId(null);
    setUnifiedPrefill({
      resourceId,
      resourceName: res?.name || "",
      resourceUnitNumber: res?.unitNumber || null,
      startDate,
      endDate,
      tab: action,
    });
    setUnifiedTab(action);
    setUnifiedOpen(true);
  };

  // ── Search (unified — searches reservations) ──
  useEffect(() => {
    if (!searchQuery || searchQuery.length < 2) { setSearchResults([]); return; }
    const t = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const data = await apiFetch(`/api/reservations?search=${encodeURIComponent(searchQuery)}&limit=8`);
        setSearchResults(data.reservations || []); setSearchOpen(true);
      } catch (e) { console.error(e); }
      setSearchLoading(false);
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const handleSearchSelect = (r: SearchResult) => {
    setSearchQuery(""); setSearchResults([]); setSearchOpen(false);
    pendingReservationId.current = r.id;
    jumpToDate(parseLocalDate(r.checkIn).getFullYear(), parseLocalDate(r.checkIn).getMonth());
  };

  useEffect(() => {
    if (!pendingReservationId.current) return;
    const entry = allEntries.find(e => e.reservationId === pendingReservationId.current);
    if (entry) { setSelectedEntry(entry); setPanelOpen(true); pendingReservationId.current = null; }
  }, [allEntries]);

  const filteredEntries = useMemo(() => hiddenTypes.size === 0 ? allEntries : allEntries.filter(e => !hiddenTypes.has(e.type)), [allEntries, hiddenTypes]);
  const stats = useMemo(() => ({
    bookings: allEntries.filter(e => e.type === "BOOKING").length,
    offers: allEntries.filter(e => e.type === "OFFER").length,
    blocks: allEntries.filter(e => e.type === "BLOCK").length,
    resources: resources.length,
  }), [allEntries, resources]);

  if (initialLoading) return <CalendarSkeleton />;

  function clientNameSearch(c: SearchResult["client"]): string {
    if (!c) return "Brak klienta";
    return c.companyName || [c.firstName, c.lastName].filter(Boolean).join(" ") || "Bez nazwy";
  }
  const statusLabelPL: Record<string, string> = {
    PENDING: "Oczekująca", CONFIRMED: "Potwierdzona",
    CANCELLED: "Anulowana", EXPIRED: "Wygasła",
  };

  const pickerDaysInMonth = new Date(pickerYear, pickerMonth + 1, 0).getDate();
  const pickerFirstDay = (new Date(pickerYear, pickerMonth, 1).getDay() + 6) % 7;
  const pickerPrev = () => { if (pickerMonth === 0) { setPickerMonth(11); setPickerYear(y => y - 1); } else setPickerMonth(m => m - 1); };
  const pickerNext = () => {
    const nextNum = pickerYear * 12 + pickerMonth + 1;
    if (nextNum > maxMonthNum) return;
    if (pickerMonth === 11) { setPickerMonth(0); setPickerYear(y => y + 1); } else setPickerMonth(m => m + 1);
  };
  const pickerCanGoNext = pickerYear * 12 + pickerMonth < maxMonthNum;

  const setPickerYearClipped = (y: number) => {
    setPickerYear(y);
    if (y === maxYear && pickerMonth > maxMonth) setPickerMonth(maxMonth);
  };

  return (
    <div className="space-y-4 fade-in-up">
      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div>
            <h2 className="text-xl font-bold tracking-tight">Kalendarz</h2>
            <p className="text-[13px] text-muted-foreground mt-1">Dostępność zasobów i rezerwacje</p>
          </div>
          <div className="flex items-center gap-1.5 ml-2">
            <button onClick={() => { setUnifiedMode("create"); setEditReservationId(null); setUnifiedTab("booking"); setUnifiedPrefill(null); setUnifiedOpen(true); }}
              className="btn-bubble btn-primary-bubble px-4 py-2 text-[12px] flex items-center gap-1.5">
              <Plus className="h-3.5 w-3.5" /> Dodaj rezerwację
            </button>
            <div className="relative" ref={moreMenuRef}>
              <button onClick={() => setMoreMenuOpen(!moreMenuOpen)} className="btn-icon-bubble h-9 w-9">
                <MoreVertical className="h-4 w-4" />
              </button>
              {moreMenuOpen && (
                <div className="absolute right-0 top-full mt-2 bg-card border-2 border-border rounded-2xl z-30 min-w-[200px] py-2 px-2 fade-in-scale" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
                  <button onClick={() => { setUnifiedMode("create"); setEditReservationId(null); setUnifiedTab("block"); setUnifiedPrefill(null); setUnifiedOpen(true); setMoreMenuOpen(false); }}
                    className="w-full text-left px-3 py-2.5 hover:bg-muted/50 transition-colors flex items-center gap-3 text-[13px] rounded-xl">
                    <ShieldBan className="h-4 w-4 text-slate-500" /> Dodaj blokadę
                  </button>
                  <button onClick={() => { setUnifiedMode("create"); setEditReservationId(null); setUnifiedTab("offer"); setUnifiedPrefill(null); setUnifiedOpen(true); setMoreMenuOpen(false); }}
                    className="w-full text-left px-3 py-2.5 hover:bg-muted/50 transition-colors flex items-center gap-3 text-[13px] rounded-xl">
                    <FileText className="h-4 w-4 text-blue-500" /> Dodaj ofertę
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: nav tools */}
        <div className="flex items-center gap-2">
          <div className="relative" ref={searchRef}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              onFocus={() => { if (searchResults.length > 0) setSearchOpen(true); }}
              placeholder="Szukaj rezerwacji..." className="input-bubble h-9 w-[200px] text-[12px]" style={{ paddingLeft: 34 }} />
            {searchQuery && (
              <button onClick={() => { setSearchQuery(""); setSearchResults([]); setSearchOpen(false); }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
            {searchLoading && <div className="absolute right-8 top-1/2 -translate-y-1/2"><Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" /></div>}
            {searchOpen && searchResults.length > 0 && (
              <div className="absolute z-30 top-full mt-1 w-[320px] right-0 bg-card border-2 border-border rounded-2xl py-2 px-2 max-h-[300px] overflow-y-auto fade-in-scale" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
                {searchResults.map(r => (
                  <button key={r.id} onClick={() => handleSearchSelect(r)}
                    className="w-full text-left px-3 py-2.5 hover:bg-muted/50 transition-colors rounded-xl flex items-center justify-between">
                    <div className="min-w-0">
                      <div className="text-[12px] font-semibold truncate">{clientNameSearch(r.client)}</div>
                      <div className="text-[10px] text-muted-foreground">{r.number} • {parseLocalDate(r.checkIn).toLocaleDateString("pl-PL", { day: "numeric", month: "short" })} → {parseLocalDate(r.checkOut).toLocaleDateString("pl-PL", { day: "numeric", month: "short" })}</div>
                    </div>
                    <span className={cn("text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 ml-2",
                      r.status === "CONFIRMED" ? "bg-emerald-100 text-emerald-700" :
                      r.status === "PENDING" ? "bg-amber-100 text-amber-700" :
                      r.status === "CANCELLED" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
                    )}>{statusLabelPL[r.status] || r.status}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button onClick={() => scrollByDays(-30)} className="btn-icon-bubble h-9 w-9" title="Przewiń wstecz"><ChevronLeft className="h-4 w-4" /></button>
          <button onClick={scrollToToday} className="btn-bubble btn-secondary-bubble px-3 py-2 text-[12px]">Dziś</button>
          <button onClick={() => scrollByDays(30)} className="btn-icon-bubble h-9 w-9" title="Przewiń dalej"><ChevronRight className="h-4 w-4" /></button>

          <span className="text-[13px] font-semibold min-w-[130px] text-right hidden sm:block">{visibleMonthLabel}</span>

          <div className="relative" ref={pickerRef}>
            <button onClick={() => { setPickerOpen(!pickerOpen); setPickerYear(today.getFullYear()); setPickerMonth(today.getMonth()); }}
              className="btn-icon-bubble h-9 w-9" title="Przejdź do daty">
              <CalendarDays className="h-4 w-4" />
            </button>
            {pickerOpen && (
              <div className="absolute z-30 top-full mt-2 right-0 bg-card border-2 border-border rounded-2xl p-5 fade-in-scale" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.08)", width: 320 }}>
                <div className="flex items-center gap-2.5 mb-4">
                  <CalendarDays className="h-5 w-5 text-primary" />
                  <span className="text-[16px] font-bold">{MONTHS_PL[pickerMonth]} {pickerYear}</span>
                </div>
                <div className="flex items-center gap-2 mb-4">
                  <button onClick={pickerPrev} className="btn-icon-bubble h-9 w-9 shrink-0"><ChevronLeft className="h-4 w-4" /></button>
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    <BubbleSelect
                      value={String(pickerMonth)}
                      onChange={v => setPickerMonth(Number(v))}
                      options={MONTHS_PL.map((m, i) => ({ value: String(i), label: m }))
                        .filter(o => pickerYear < maxYear || Number(o.value) <= maxMonth)}
                    />
                    <BubbleSelect
                      value={String(pickerYear)}
                      onChange={v => setPickerYearClipped(Number(v))}
                      options={Array.from({ length: maxYear - today.getFullYear() + 2 }, (_, i) => today.getFullYear() - 1 + i)
                        .filter(y => y <= maxYear)
                        .map(y => ({ value: String(y), label: String(y) }))}
                    />
                  </div>
                  <button onClick={pickerNext} disabled={!pickerCanGoNext}
                    className={cn("btn-icon-bubble h-9 w-9 shrink-0", !pickerCanGoNext && "opacity-30 cursor-not-allowed")}>
                    <ChevronRight className="h-4 w-4" /></button>
                </div>
                <div className="grid grid-cols-7 mb-2">
                  {DAYS_PL.map(d => (
                    <div key={d} className="text-center text-[11px] font-semibold text-muted-foreground py-1">{d}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-y-1">
                  {Array.from({ length: pickerFirstDay }).map((_, i) => <div key={`e-${i}`} />)}
                  {Array.from({ length: pickerDaysInMonth }, (_, i) => i + 1).map(day => {
                    const isToday = day === today.getDate() && pickerMonth === today.getMonth() && pickerYear === today.getFullYear();
                    const dayMonthNum = pickerYear * 12 + pickerMonth;
                    const isDisabled = dayMonthNum > maxMonthNum;
                    return (
                      <button key={day} onClick={() => !isDisabled && jumpToDate(pickerYear, pickerMonth, day)}
                        disabled={isDisabled}
                        className={cn("h-9 w-9 mx-auto rounded-full text-[13px] font-medium transition-colors flex items-center justify-center",
                          isDisabled ? "text-muted-foreground/30 cursor-not-allowed" :
                          isToday ? "bg-primary text-white font-bold" : "hover:bg-muted/50"
                        )}>{day}</button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Legend ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-4">
          {([
            { type: "BOOKING", label: "Rezerwacja", color: "bg-emerald-500" },
            { type: "OFFER", label: "Oferta", color: "bg-blue-500" },
            { type: "BLOCK", label: "Blokada", color: "bg-slate-500" },
          ] as const).map(item => (
            <button key={item.type} onClick={() => toggleType(item.type)}
              className={cn("flex items-center gap-2 text-[12px] font-medium transition-opacity", hiddenTypes.has(item.type) ? "opacity-30" : "opacity-100")}>
              <span className={cn("h-2.5 w-2.5 rounded-full", item.color)} /> {item.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-4 text-[12px] text-muted-foreground">
          {anyLoading && <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />}
          {errorCount > 0 && (
            <button onClick={retryFailedMonths} className="flex items-center gap-1 text-red-500 hover:text-red-600 transition-colors" title="Kliknij aby ponowić">
              <span className="text-[11px] font-semibold">Błąd ({errorCount})</span>
              <span className="text-[10px] underline">Ponów</span>
            </button>
          )}
          <span className="flex items-center gap-1.5"><Home className="h-3.5 w-3.5" /> {stats.resources} zasobów</span>
          <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-emerald-500" /> {stats.bookings} rezerwacji</span>
          <span className="flex items-center gap-1.5"><FileText className="h-3.5 w-3.5 text-blue-500" /> {stats.offers} ofert</span>
          <span className="flex items-center gap-1.5"><Lock className="h-3.5 w-3.5 text-slate-400" /> {stats.blocks} blokad</span>
        </div>
      </div>

      {/* ── Grid ── */}
      <div className="relative">
        <CalendarGrid resources={resources} entries={filteredEntries} days={days} today={today}
          viewMode="month" onEntryClick={handleEntryClick} onCellAction={handleCellAction}
          scrollContainerRef={gridScrollRef} onScrollMount={handleScrollMount} />
      </div>

      <CalendarDetailPanel entry={selectedEntry} open={panelOpen} onClose={handlePanelClose} onRefresh={handleDataRefresh} onEdit={handleEditReservation} onConvertBlock={handleConvertBlock} refreshKey={dataVersion} />
      <UnifiedPanel
        open={unifiedOpen}
        onClose={() => { setUnifiedOpen(false); setUnifiedPrefill(null); setEditReservationId(null); setConvertBlockId(null); setUnifiedMode("create"); }}
        onCreated={(_type, startDate) => { if (convertBlockId) { setPanelOpen(false); setSelectedEntry(null); handleDataRefresh(); } else { handleBlockCreated(startDate); } }}
        initialTab={unifiedTab}
        prefill={unifiedPrefill}
        mode={unifiedMode}
        editBookingId={editReservationId}
        onEdited={handleEdited}
        convertBlockId={convertBlockId}
      />
    </div>
  );
}
