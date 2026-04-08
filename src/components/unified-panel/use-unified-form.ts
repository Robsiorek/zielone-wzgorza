"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { apiFetch } from "@/lib/api-fetch";
import { nightsBetween } from "@/lib/dates";
import { toMinor } from "@/lib/format";

// ── Types ──

export type PanelTab = "booking" | "offer" | "block";

export interface ClientOption {
  id: string;
  firstName: string | null;
  lastName: string | null;
  companyName: string | null;
  email: string | null;
  phone: string | null;
  type: "INDIVIDUAL" | "COMPANY";
}

export interface ResourceOption {
  id: string;
  name: string;
  unitNumber: string | null;
  maxCapacity: number | null;
  category: { name: string; slug: string };
}

export interface SelectedResource {
  resourceId: string;
  name: string;
  unitNumber: string | null;
  maxCapacity: number | null;
  pricePerNight: number;
  adults: number;
  children: number;
  capacityOverride: boolean;
  blocked: boolean;
  blockLabel: string | null;
  softBlocked: boolean;
  softBlockLabel: string | null;
}

export interface UnifiedPrefill {
  resourceId?: string;
  resourceName?: string;
  resourceUnitNumber?: string | null;
  startDate?: string;
  endDate?: string;
  clientId?: string;
  tab?: PanelTab;
  /** Multiple resources for block conversion */
  resources?: { resourceId: string; resourceName: string; resourceUnitNumber: string | null }[];
}

// Re-export types from addon-types for backward compat
export type { AddonOption, SelectedAddon, AddonPricingType, AddonScope } from "./addon-types";
import type { AddonOption, SelectedAddon } from "./addon-types";
import { createSelectedAddon, computeAddonTotal } from "./addon-types";

// ── Hook ──

export function useUnifiedForm(prefill?: UnifiedPrefill | null, excludeReservationId?: string | null) {
  // ── Tab ──
  const [activeTab, setActiveTab] = useState<PanelTab>(prefill?.tab || "booking");

  // ── Dates ──
  const [startDate, setStartDate] = useState(prefill?.startDate || "");
  const [endDate, setEndDate] = useState(prefill?.endDate || "");
  const nights = useMemo(() => {
    if (!startDate || !endDate) return 0;
    return nightsBetween(startDate, endDate);
  }, [startDate, endDate]);

  // ── Client ──
  const [selectedClient, setSelectedClient] = useState<ClientOption | null>(null);
  const [clientSearch, setClientSearch] = useState("");
  const [clientResults, setClientResults] = useState<ClientOption[]>([]);
  const [clientsLoading, setClientsLoading] = useState(false);

  // ── Resources ──
  const [allResources, setAllResources] = useState<ResourceOption[]>([]);
  const [selectedResources, setSelectedResources] = useState<SelectedResource[]>([]);
  const [resourcesLoading, setResourcesLoading] = useState(false);
  const [resourcesLoaded, setResourcesLoaded] = useState(false);
  const [blockedResourceIds, setBlockedResourceIds] = useState<Set<string>>(new Set());
  const [softBlockedResourceIds, setSoftBlockedResourceIds] = useState<Set<string>>(new Set());
  const [blockedLabels, setBlockedLabels] = useState<Map<string, string>>(new Map());
  const [softBlockedLabels, setSoftBlockedLabels] = useState<Map<string, string>>(new Map());

  // ── Guests (computed from per-resource) ──
  const totalGuests = useMemo(() => {
    return selectedResources.reduce((sum, sr) => sum + sr.adults + sr.children, 0);
  }, [selectedResources]);

  // ── Details: Booking ──
  const [bookingSource, setBookingSource] = useState("PHONE");
  const [bookingStatus, setBookingStatus] = useState("CONFIRMED");
  const [guestNotes, setGuestNotes] = useState("");
  const [internalNotes, setInternalNotes] = useState("");

  // ── Details: Offer ──
  const [offerSource, setOfferSource] = useState("EMAIL");
  const [offerNote, setOfferNote] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [expiryAction, setExpiryAction] = useState("CANCEL");

  // ── Details: Block ──
  const [blockLabel, setBlockLabel] = useState("");
  const [blockNote, setBlockNote] = useState("");

  // ── Submit ──
  const [saving, setSaving] = useState(false);

  // ── Addons ──
  const [allAddons, setAllAddons] = useState<AddonOption[]>([]);
  const [selectedAddons, setSelectedAddons] = useState<SelectedAddon[]>([]);
  const [itemAddons, setItemAddons] = useState<Record<string, SelectedAddon[]>>({});
  const [addonsLoaded, setAddonsLoaded] = useState(false);
  const [addonPickerOpen, setAddonPickerOpen] = useState(false);
  const [addonPickerResourceId, setAddonPickerResourceId] = useState<string | null>(null);

  // ── Date change → reload availability (preserve selected resources) ──
  const prevDatesRef = useRef({ startDate, endDate });
  useEffect(() => {
    if (prevDatesRef.current.startDate !== startDate || prevDatesRef.current.endDate !== endDate) {
      setResourcesLoaded(false);
      setBlockedResourceIds(new Set());
      setSoftBlockedResourceIds(new Set());
      setBlockedLabels(new Map());
      setSoftBlockedLabels(new Map());
      prevDatesRef.current = { startDate, endDate };
    }
  }, [startDate, endDate]);

  // ── Tab switch: reset details only ──
  const switchTab = useCallback((tab: PanelTab) => {
    setActiveTab(tab);
  }, []);

  // ── Client search ──
  useEffect(() => {
    if (!clientSearch || clientSearch.length < 2) { setClientResults([]); return; }
    const t = setTimeout(async () => {
      setClientsLoading(true);
      try {
        const data = await apiFetch(`/api/clients?search=${encodeURIComponent(clientSearch)}&limit=6`);
        setClientResults(data.clients || []);
      } catch { /* ignore */ }
      setClientsLoading(false);
    }, 300);
    return () => clearTimeout(t);
  }, [clientSearch]);

  // ── Load resources + availability (from backend) ──
  const loadResources = useCallback(async () => {
    if (!startDate || !endDate || nights <= 0) return;
    setResourcesLoading(true);
    try {
      // Get all active resources
      const resData = await apiFetch("/api/resources?status=ACTIVE");
      const allRes: ResourceOption[] = (resData.resources || []).filter((r: any) =>
        r.category?.type === "ACCOMMODATION"
      );
      setAllResources(allRes);

      // Get timeline for availability check
      const tlData = await apiFetch(`/api/timeline?startDate=${startDate}&endDate=${endDate}`);
      const entries = (tlData.entries || []).filter((e: any) =>
        !excludeReservationId || e.reservationId !== excludeReservationId
      );

      const blocked = new Set<string>();
      const softBlocked = new Set<string>();
      const bLabels = new Map<string, string>();
      const sbLabels = new Map<string, string>();

      for (const entry of entries) {
        if (entry.status !== "ACTIVE") continue;
        if (entry.type === "BOOKING" || entry.type === "BLOCK") {
          blocked.add(entry.resourceId);
          let label = "";
          if (entry.type === "BOOKING" && entry.reservation) {
            const c = entry.reservation.client;
            const clientName = c?.companyName || [c?.firstName, c?.lastName].filter(Boolean).join(" ") || "";
            label = clientName ? `${clientName} - ${entry.reservation.number}` : entry.reservation.number;
          } else {
            label = entry.label || "Blokada";
          }
          bLabels.set(entry.resourceId, label);
        } else if (entry.type === "OFFER") {
          softBlocked.add(entry.resourceId);
          const c = entry.reservation?.client;
          const clientName = c?.companyName || [c?.firstName, c?.lastName].filter(Boolean).join(" ") || "";
          const offerLabel = clientName ? `${clientName} - ${entry.reservation?.number}` : (entry.reservation?.number || "Oferta");
          sbLabels.set(entry.resourceId, offerLabel);
        }
      }

      setBlockedResourceIds(blocked);
      setSoftBlockedResourceIds(softBlocked);
      setBlockedLabels(bLabels);
      setSoftBlockedLabels(sbLabels);
      setResourcesLoaded(true);

      // Update blocked/softBlocked status on already-selected resources
      setSelectedResources(prev => prev.map(sr => ({
        ...sr,
        blocked: blocked.has(sr.resourceId),
        blockLabel: bLabels.get(sr.resourceId) || null,
        softBlocked: softBlocked.has(sr.resourceId),
        softBlockLabel: sbLabels.get(sr.resourceId) || null,
      })));

      // Auto-select prefilled resources
      const resourcesToSelect: string[] = [];
      if (prefill?.resources && prefill.resources.length > 0) {
        for (const pr of prefill.resources) {
          if (!blocked.has(pr.resourceId)) resourcesToSelect.push(pr.resourceId);
        }
      } else if (prefill?.resourceId && !blocked.has(prefill.resourceId)) {
        resourcesToSelect.push(prefill.resourceId);
      }

      if (resourcesToSelect.length > 0) {
        setSelectedResources(prev => {
          const existing = new Set(prev.map(sr => sr.resourceId));
          const newOnes = resourcesToSelect
            .filter(rid => !existing.has(rid))
            .map(rid => {
              const res = allRes.find(r => r.id === rid);
              if (!res) return null;
              return {
                resourceId: res.id,
                name: res.name,
                unitNumber: res.unitNumber,
                maxCapacity: res.maxCapacity,
                pricePerNight: 0,
                adults: 1,
                children: 0,
                capacityOverride: false,
                blocked: false,
                blockLabel: null,
                softBlocked: softBlocked.has(res.id),
                softBlockLabel: sbLabels.get(res.id) || null,
              };
            })
            .filter(Boolean) as any[];
          return [...prev, ...newOnes];
        });
      }
    } catch { /* ignore */ }
    setResourcesLoading(false);
  }, [startDate, endDate, nights, prefill?.resourceId, excludeReservationId]);

  // ── Toggle resource selection ──
  const toggleResource = useCallback((resource: ResourceOption) => {
    setSelectedResources(prev => {
      const existing = prev.find(sr => sr.resourceId === resource.id);
      if (existing) return prev.filter(sr => sr.resourceId !== resource.id);
      return [...prev, {
        resourceId: resource.id,
        name: resource.name,
        unitNumber: resource.unitNumber,
        maxCapacity: resource.maxCapacity,
        pricePerNight: 0,
        adults: 1,
        children: 0,
        capacityOverride: false,
        blocked: blockedResourceIds.has(resource.id),
        blockLabel: blockedLabels.get(resource.id) || null,
        softBlocked: softBlockedResourceIds.has(resource.id),
        softBlockLabel: softBlockedLabels.get(resource.id) || null,
      }];
    });
  }, [blockedResourceIds, softBlockedResourceIds, blockedLabels, softBlockedLabels]);

  // ── Update price per resource ──
  const updateResourcePrice = useCallback((resourceId: string, price: number) => {
    setSelectedResources(prev => prev.map(sr =>
      sr.resourceId === resourceId ? { ...sr, pricePerNight: price } : sr
    ));
  }, []);

  // ── Update guests per resource ──
  const updateResourceGuests = useCallback((resourceId: string, adults: number, children: number) => {
    setSelectedResources(prev => prev.map(sr =>
      sr.resourceId === resourceId ? { ...sr, adults, children, capacityOverride: false } : sr
    ));
  }, []);

  // ── Toggle capacity override ──
  const toggleCapacityOverride = useCallback((resourceId: string) => {
    setSelectedResources(prev => prev.map(sr =>
      sr.resourceId === resourceId ? { ...sr, capacityOverride: !sr.capacityOverride } : sr
    ));
  }, []);

  // ── Computed ──

  // -- Load addons (one fetch, split by scope) --
  const loadAddons = useCallback(async () => {
    try {
      const data = await apiFetch("/api/addons?active=true");
      const addons: AddonOption[] = (data.addons || []).map((a: any) => ({
        id: a.id, name: a.name, description: a.description,
        scope: a.scope || "GLOBAL",
        pricingType: a.pricingType, priceMinor: a.priceMinor || Math.round(Number(a.price) * 100),
        selectType: a.selectType, isRequired: a.isRequired,
      }));
      setAllAddons(addons);
      setAddonsLoaded(true);

      // Auto-add required GLOBAL addons
      const requiredGlobal = addons.filter(a => a.scope === "GLOBAL" && a.isRequired);
      if (requiredGlobal.length > 0) {
        setSelectedAddons(prev => {
          const existing = new Set(prev.map(sa => sa.addonId));
          const toAdd = requiredGlobal
            .filter(a => !existing.has(a.id))
            .map(a => createSelectedAddon(a,
              selectedResources.reduce((s, r) => s + r.adults + r.children, 0) || 1,
              nights
            ));
          return toAdd.length > 0 ? [...prev, ...toAdd] : prev;
        });
      }
    } catch { /* ignore */ }
  }, []);

  // Load addons on panel open (not on tab change)
  useEffect(() => {
    if (activeTab !== "block" && !addonsLoaded) loadAddons();
  }, [activeTab, addonsLoaded, loadAddons]);

  // Derived: split by scope
  const availableAddons = useMemo(() => allAddons.filter(a => a.scope === "GLOBAL"), [allAddons]);
  const availableItemAddons = useMemo(() => allAddons.filter(a => a.scope === "PER_ITEM"), [allAddons]);

  // -- Add addon (one-time prefill) --
  const addAddon = useCallback((addon: AddonOption, resourceId?: string) => {
    const totalPersons = resourceId
      ? ((sr) => (sr?.adults || 1) + (sr?.children || 0))(selectedResources.find(r => r.resourceId === resourceId))
      : selectedResources.reduce((s, r) => s + r.adults + r.children, 0) || 1;
    const sa = createSelectedAddon(addon, totalPersons, nights);

    if (resourceId) {
      setItemAddons(prev => {
        const current = prev[resourceId] || [];
        if (current.some(a => a.addonId === addon.id)) return prev;
        return { ...prev, [resourceId]: [...current, sa] };
      });
    } else {
      setSelectedAddons(prev => {
        if (prev.some(a => a.addonId === addon.id)) return prev;
        return [...prev, sa];
      });
    }
  }, [selectedResources, nights]);

  // -- Remove addon --
  const removeAddon = useCallback((addonId: string, resourceId?: string) => {
    if (resourceId) {
      setItemAddons(prev => ({
        ...prev,
        [resourceId]: (prev[resourceId] || []).filter(sa => sa.addonId !== addonId),
      }));
    } else {
      setSelectedAddons(prev => prev.filter(sa => sa.addonId !== addonId));
    }
  }, []);

  // -- Update addon field (manual override) --
  const updateAddonField = useCallback((addonId: string, field: "unitPriceMinor" | "calcPersons" | "calcNights" | "calcQuantity", value: number, resourceId?: string) => {
    const updater = (addons: SelectedAddon[]) =>
      addons.map(sa => sa.addonId === addonId ? { ...sa, [field]: Math.max(0, value) } : sa);
    if (resourceId) {
      setItemAddons(prev => ({
        ...prev,
        [resourceId]: updater(prev[resourceId] || []),
      }));
    } else {
      setSelectedAddons(prev => updater(prev));
    }
  }, []);

  // -- Addon picker --
  const openAddonPicker = useCallback((resourceId?: string) => {
    setAddonPickerResourceId(resourceId || null);
    setAddonPickerOpen(true);
  }, []);

  const closeAddonPicker = useCallback(() => {
    setAddonPickerOpen(false);
    setAddonPickerResourceId(null);
  }, []);

  // -- Sync item addons with resources: auto-add required + cleanup --
  useEffect(() => {
    if (!addonsLoaded) return;
    const resourceIds = new Set(selectedResources.map(sr => sr.resourceId));
    const requiredPerItem = allAddons.filter(a => a.scope === "PER_ITEM" && a.isRequired);

    setItemAddons(prev => {
      const updated: Record<string, SelectedAddon[]> = {};
      let changed = false;

      // Keep addons for existing resources, remove orphans
      for (const [rid, addons] of Object.entries(prev)) {
        if (resourceIds.has(rid)) {
          updated[rid] = addons;
        } else {
          changed = true;
        }
      }

      // Auto-add required PER_ITEM addons for new resources
      for (const sr of selectedResources) {
        if (!updated[sr.resourceId]) {
          updated[sr.resourceId] = [];
          changed = true;
        }
        const existing = new Set(updated[sr.resourceId].map(sa => sa.addonId));
        const persons = sr.adults + sr.children;
        for (const addon of requiredPerItem) {
          if (!existing.has(addon.id)) {
            updated[sr.resourceId] = [...updated[sr.resourceId], createSelectedAddon(addon, persons, nights)];
            changed = true;
          }
        }
      }

      return changed ? updated : prev;
    });
  }, [selectedResources, addonsLoaded, allAddons, nights]);

  // -- Computed totals (derived, not stored) --
  const addonsTotal = useMemo(() =>
    selectedAddons.reduce((sum, sa) => sum + computeAddonTotal(sa), 0),
  [selectedAddons]);

  const itemAddonsTotal = useMemo(() => {
    let total = 0;
    for (const addons of Object.values(itemAddons)) {
      for (const sa of addons) total += computeAddonTotal(sa);
    }
    return total;
  }, [itemAddons]);

  const totalPrice = useMemo(() => {
    // pricePerNight is in zł (user-facing), convert to grosze for totals
    const resourcesTotalMinor = selectedResources.reduce((sum, sr) => sum + toMinor(sr.pricePerNight) * nights, 0);
    // addonsTotal and itemAddonsTotal are already in grosze (computeAddonTotal returns grosze)
    return resourcesTotalMinor + addonsTotal + itemAddonsTotal;
  }, [selectedResources, nights, addonsTotal, itemAddonsTotal]);

  const hasUnresolvedCapacity = useMemo(() => {
    return selectedResources.some(sr =>
      sr.maxCapacity && (sr.adults + sr.children) > sr.maxCapacity && !sr.capacityOverride
    );
  }, [selectedResources]);

  const canSubmit = useMemo(() => {
    if (!startDate || !endDate || nights <= 0) return false;
    if (selectedResources.length === 0) return false;
    if (activeTab !== "block" && !selectedClient) return false;
    if (hasUnresolvedCapacity) return false;
    if (saving) return false;
    return true;
  }, [startDate, endDate, nights, selectedResources, selectedClient, activeTab, hasUnresolvedCapacity, saving]);

  // ── Reset all ──
  const resetAll = useCallback((newPrefill?: UnifiedPrefill | null) => {
    setStartDate(newPrefill?.startDate || "");
    setEndDate(newPrefill?.endDate || "");
    setSelectedClient(null);
    setClientSearch("");
    setClientResults([]);
    setAllResources([]);
    setSelectedResources([]);
    setResourcesLoaded(false);
    setBlockedResourceIds(new Set());
    setSoftBlockedResourceIds(new Set());
    setBookingSource("PHONE");
    setBookingStatus("CONFIRMED");
    setGuestNotes("");
    setInternalNotes("");
    setOfferSource("EMAIL");
    setOfferNote("");
    setExpiresAt("");
    setExpiryAction("CANCEL");
    setBlockLabel("");
    setBlockNote("");
    setSelectedAddons([]);
    setItemAddons({});
    setAllAddons([]);
    setAddonsLoaded(false);
    setAddonPickerOpen(false);
    setAddonPickerResourceId(null);
    setSaving(false);
    setActiveTab(newPrefill?.tab || "booking");
  }, []);

  return {
    // Tab
    activeTab, switchTab,
    // Dates
    startDate, setStartDate, endDate, setEndDate, nights,
    // Client
    selectedClient, setSelectedClient, clientSearch, setClientSearch,
    clientResults, clientsLoading,
    // Resources
    allResources, selectedResources, setSelectedResources, resourcesLoading, resourcesLoaded,
    blockedResourceIds, softBlockedResourceIds, blockedLabels, softBlockedLabels,
    loadResources, toggleResource, updateResourcePrice, updateResourceGuests, toggleCapacityOverride,
    // Guests (computed)
    totalGuests,
    // Details: Booking
    bookingSource, setBookingSource, bookingStatus, setBookingStatus,
    guestNotes, setGuestNotes, internalNotes, setInternalNotes,
    // Details: Offer
    offerSource, setOfferSource, offerNote, setOfferNote,
    expiresAt, setExpiresAt, expiryAction, setExpiryAction,
    // Details: Block
    blockLabel, setBlockLabel, blockNote, setBlockNote,
    // Global Addons
    availableAddons, selectedAddons, addonsLoaded, addonsTotal,
    // Per-item Addons
    availableItemAddons, itemAddons, itemAddonsTotal,
    // Addon actions
    addAddon, removeAddon, updateAddonField,
    setSelectedAddons, setItemAddons,
    openAddonPicker, closeAddonPicker, addonPickerOpen, addonPickerResourceId,
    // Submit
    saving, setSaving, canSubmit, totalPrice,
    // Reset
    resetAll,
  };
}
