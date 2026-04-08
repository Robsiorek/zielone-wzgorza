"use client";

import React, { useEffect, useCallback, useState } from "react";
import { Calendar, FileText, Lock, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiFetch, ApiError } from "@/lib/api-fetch";
import { useToast } from "@/components/ui/toast";
import { SlidePanel } from "@/components/ui/slide-panel";
import { useUnifiedForm, type UnifiedPrefill, type PanelTab, type ClientOption, type SelectedResource, type SelectedAddon } from "./use-unified-form";
import { DatesSection } from "./sections/dates-section";
import { ClientSection } from "./sections/client-section";
import { ResourcesSection } from "./sections/resources-section";
import { BookingDetailsSection, OfferDetailsSection, BlockDetailsSection } from "./sections/details-sections";
import { AddonsSection } from "./sections/addons-section";
import { AddonPickerPanel } from "./sections/addon-picker-panel";
import { SummarySection } from "./sections/summary-section";
import { computeAddonTotal } from "./addon-types";
import { toMinor } from "@/lib/format";

// ── Props ──

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: (type: PanelTab, startDate: string) => void;
  initialTab?: PanelTab;
  prefill?: UnifiedPrefill | null;
  // Edit mode
  mode?: "create" | "edit";
  /** Reservation ID to edit (prop name kept as editBookingId for backward compat with calendar-content) */
  editBookingId?: string | null;
  /** Called after successful edit — receives oldRange + newRange for cache invalidation */
  onEdited?: (timelineChanged: boolean, oldRange: { checkIn: string; checkOut: string } | null, newRange: { checkIn: string; checkOut: string } | null) => void;
  /** Block ID to convert (BLOCK -> BOOKING/OFFER in single transaction) */
  convertBlockId?: string | null;
}

// ── Tab config ──

const TABS: { value: PanelTab; label: string; icon: React.ElementType; iconColor: string }[] = [
  { value: "booking", label: "Rezerwacja", icon: Calendar, iconColor: "text-emerald-500" },
  { value: "offer", label: "Oferta", icon: FileText, iconColor: "text-blue-500" },
  { value: "block", label: "Blokada", icon: Lock, iconColor: "text-slate-500" },
];

// ── Component ──

export function UnifiedPanel({ open, onClose, onCreated, initialTab, prefill, mode = "create", editBookingId: editReservationId, onEdited, convertBlockId }: Props) {
  const { success: showSuccess, error: showError } = useToast();
  const [editLoading, setEditLoading] = useState(false);
  const [editNumber, setEditNumber] = useState("");

  const form = useUnifiedForm(open ? { ...prefill, tab: initialTab || prefill?.tab } : undefined, convertBlockId);

  const isEdit = mode === "edit" && !!editReservationId;

  // ── Reset on open (create mode) ──
  useEffect(() => {
    if (!open) return;
    if (isEdit) {
      loadReservationForEdit(editReservationId!);
    } else {
      form.resetAll({ ...prefill, tab: initialTab || prefill?.tab });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editReservationId, mode]);

  // ── Fetch reservation for edit ──
  const loadReservationForEdit = async (reservationId: string) => {
    setEditLoading(true);
    form.resetAll({ tab: "booking" });
    try {
      const data = await apiFetch(`/api/reservations/${reservationId}`);
      const r = data.reservation;
      if (!r) return;

      setEditNumber(r.number || "");

      // Determine tab from type
      const tabMap: Record<string, PanelTab> = { BOOKING: "booking", OFFER: "offer", BLOCK: "block" };
      form.resetAll({ tab: tabMap[r.type] || "booking" });

      // Prefill dates — parse local from ISO
      const ciDate = new Date(r.checkIn);
      const coDate = new Date(r.checkOut);
      const ciStr = `${ciDate.getFullYear()}-${String(ciDate.getMonth() + 1).padStart(2, "0")}-${String(ciDate.getDate()).padStart(2, "0")}`;
      const coStr = `${coDate.getFullYear()}-${String(coDate.getMonth() + 1).padStart(2, "0")}-${String(coDate.getDate()).padStart(2, "0")}`;

      form.setStartDate(ciStr);
      form.setEndDate(coStr);

      // Prefill client
      if (r.client) {
        form.setSelectedClient({
          id: r.client.id,
          firstName: r.client.firstName,
          lastName: r.client.lastName,
          companyName: r.client.companyName,
          email: r.client.email,
          phone: r.client.phone,
          type: r.client.type || "INDIVIDUAL",
        } as ClientOption);
      }

      // Prefill details per type
      if (r.type === "BOOKING") {
        form.setBookingSource(r.source || "PHONE");
        form.setBookingStatus(r.status || "CONFIRMED");
      } else if (r.type === "OFFER") {
        form.setOfferSource(r.source || "EMAIL");
      }
      form.setGuestNotes(r.guestNotes || "");
      form.setInternalNotes(r.internalNotes || "");

      // Load resources then prefill selected + addons
      setTimeout(async () => {
        await form.loadResources();

        // Build itemId → resourceId map
        const itemToResourceMap = new Map<string, string>();
        if (r.items) {
          for (const item of r.items) {
            itemToResourceMap.set(item.id, item.resourceId || item.resource?.id);
          }

          const selected: SelectedResource[] = (r.items || []).map((rr: any) => ({
            resourceId: rr.resourceId || rr.resource?.id,
            name: rr.resource?.name || "",
            unitNumber: rr.resource?.unitNumber || null,
            maxCapacity: rr.resource?.maxCapacity || null,
            pricePerNight: rr.pricePerUnitMinor ? rr.pricePerUnitMinor / 100 : Number(rr.pricePerUnit || rr.pricePerNight || 0),
            adults: Number(rr.adults || r.adults || 1),
            children: Number(rr.children || r.children || 0),
            capacityOverride: false,
            blocked: false,
            blockLabel: null,
            softBlocked: false,
            softBlockLabel: null,
          }));
          form.setSelectedResources(selected);
        }

        // Prefill addons from reservation snapshots
        if (r.addons && r.addons.length > 0) {
          const globalAddons: SelectedAddon[] = [];
          const perItemAddons: Record<string, SelectedAddon[]> = {};

          for (const a of r.addons) {
            const sa: SelectedAddon = {
              addonId: a.addonId,
              name: a.snapshotName,
              pricingType: a.snapshotPricingType,
              selectType: "CHECKBOX",
              isRequired: false,
              unitPriceMinor: a.unitPriceMinor || Math.round(Number(a.unitPrice) * 100),
              calcPersons: Number(a.calcPersons || 1),
              calcNights: Number(a.calcNights || 1),
              calcQuantity: Number(a.calcQuantity || a.quantity || 1),
            };

            if (a.reservationItemId) {
              const resourceId = itemToResourceMap.get(a.reservationItemId);
              if (resourceId) {
                if (!perItemAddons[resourceId]) perItemAddons[resourceId] = [];
                perItemAddons[resourceId].push(sa);
              }
            } else {
              globalAddons.push(sa);
            }
          }

          if (globalAddons.length > 0) form.setSelectedAddons(globalAddons);
          if (Object.keys(perItemAddons).length > 0) form.setItemAddons(perItemAddons);
        }

        setEditLoading(false);
      }, 100);
    } catch (err: any) {
      showError(err?.message || "Nie udało się załadować rezerwacji");
      setEditLoading(false);
    }
  };

  // ── Submit ──
  const handleSubmit = useCallback(async () => {
    if (!form.canSubmit) return;
    form.setSaving(true);

    try {
      // Common resource data — pricePerNight in form is zł, API expects grosze
      const resourcesPayload = form.selectedResources.map(sr => ({
        resourceId: sr.resourceId,
        pricePerNight: toMinor(sr.pricePerNight),
        adults: sr.adults,
        children: sr.children,
        capacityOverride: sr.capacityOverride,
      }));
      const totalAdults = form.selectedResources.reduce((s, r) => s + r.adults, 0);
      const totalChildren = form.selectedResources.reduce((s, r) => s + r.children, 0);

      // Addons payload (snapshots)
      // Global addons payload (no resourceId) — all values in grosze
      const globalAddonsPayload = form.selectedAddons.map(sa => ({
        addonId: sa.addonId,
        quantity: sa.calcQuantity,
        snapshotName: sa.name,
        snapshotPrice: sa.unitPriceMinor,
        snapshotPricingType: sa.pricingType,
        unitPrice: sa.unitPriceMinor,
        calcPersons: sa.calcPersons,
        calcNights: sa.calcNights,
        calcQuantity: sa.calcQuantity,
        total: computeAddonTotal(sa),
      }));

      // Per-item addons payload (with resourceId)
      const itemAddonsPayload: any[] = [];
      for (const [resourceId, addons] of Object.entries(form.itemAddons)) {
        const resourceIdx = form.selectedResources.findIndex(sr => sr.resourceId === resourceId);
        for (const sa of addons) {
          itemAddonsPayload.push({
            addonId: sa.addonId,
            resourceId,
            sortOrder: resourceIdx >= 0 ? resourceIdx : undefined,
            quantity: sa.calcQuantity,
            snapshotName: sa.name,
            snapshotPrice: sa.unitPriceMinor,
            snapshotPricingType: sa.pricingType,
            unitPrice: sa.unitPriceMinor,
            calcPersons: sa.calcPersons,
            calcNights: sa.calcNights,
            calcQuantity: sa.calcQuantity,
            total: computeAddonTotal(sa),
          });
        }
      }

      const addonsPayload = [...globalAddonsPayload, ...itemAddonsPayload];

      if (isEdit) {
        // ── EDIT MODE: PATCH /api/reservations/[id] ──
        const result = await apiFetch(`/api/reservations/${editReservationId}`, {
          method: "PATCH",
          body: JSON.stringify({
            clientId: form.selectedClient?.id,
            checkIn: form.startDate,
            checkOut: form.endDate,
            resources: resourcesPayload,
            adults: totalAdults,
            children: totalChildren,
            source: form.activeTab === "booking" ? form.bookingSource : form.offerSource,
            guestNotes: form.guestNotes || undefined,
            internalNotes: form.internalNotes || undefined,
            addons: addonsPayload.length > 0 ? addonsPayload : undefined,
            force: true, // soft lock bypass — admin edits via panel are always intentional
          }),
        });
        showSuccess("Rezerwacja zaktualizowana");
        if (onEdited) {
          onEdited(result.timelineChanged, result.oldRange, result.newRange);
        }
        onClose();
      } else if (form.activeTab === "booking") {
        if (convertBlockId) {
          // ── CONVERT BLOCK -> BOOKING (single transaction) ──
          await apiFetch("/api/reservations/" + convertBlockId + "/convert", {
            method: "POST",
            body: JSON.stringify({
              targetType: "BOOKING",
              clientId: form.selectedClient!.id,
              adults: totalAdults,
              children: totalChildren,
              source: form.bookingSource,
              status: form.bookingStatus === "PENDING" ? "PENDING" : undefined,
              guestNotes: form.guestNotes || undefined,
              internalNotes: form.internalNotes || undefined,
            addons: addonsPayload.length > 0 ? addonsPayload : undefined,
              subtotal: 0, discount: 0, total: 0,
              items: form.selectedResources.map(sr => ({
                resourceId: sr.resourceId,
                categoryType: "ACCOMMODATION",
                startAt: form.startDate + "T00:00:00",
                endAt: form.endDate + "T00:00:00",
                quantity: 1,
                adults: sr.adults,
                children: sr.children,
                pricePerUnit: toMinor(sr.pricePerNight),
                totalPrice: 0,
              })),
            }),
          });
          showSuccess("Blokada zamieniona na rezerwację");
        } else {
          // ── CREATE BOOKING ──
          await apiFetch("/api/reservations", {
            method: "POST",
            body: JSON.stringify({
              type: "BOOKING",
              clientId: form.selectedClient!.id,
              checkIn: form.startDate,
              checkOut: form.endDate,
              resources: resourcesPayload,
              adults: totalAdults,
              children: totalChildren,
              source: form.bookingSource,
              status: form.bookingStatus === "PENDING" ? "PENDING" : undefined,
              guestNotes: form.guestNotes || undefined,
              internalNotes: form.internalNotes || undefined,
            addons: addonsPayload.length > 0 ? addonsPayload : undefined,
            }),
          });
          showSuccess("Rezerwacja utworzona");
        }
        onCreated(form.activeTab, form.startDate);
        onClose();
      } else if (form.activeTab === "offer") {
        if (convertBlockId) {
          // ── CONVERT BLOCK -> OFFER (single transaction) ──
          await apiFetch("/api/reservations/" + convertBlockId + "/convert", {
            method: "POST",
            body: JSON.stringify({
              targetType: "OFFER",
              clientId: form.selectedClient!.id,
              adults: totalAdults,
              children: totalChildren,
              source: form.offerSource,
              expiresAt: form.expiresAt || undefined,
              internalNotes: form.offerNote || undefined,
            addons: addonsPayload.length > 0 ? addonsPayload : undefined,
              subtotal: 0, discount: 0, total: 0,
              items: form.selectedResources.map(sr => ({
                resourceId: sr.resourceId,
                categoryType: "ACCOMMODATION",
                startAt: form.startDate + "T00:00:00",
                endAt: form.endDate + "T00:00:00",
                quantity: 1,
                adults: sr.adults,
                children: sr.children,
                pricePerUnit: toMinor(sr.pricePerNight),
                totalPrice: 0,
              })),
            }),
          });
          showSuccess("Blokada zamieniona na ofertę");
        } else {
          // ── CREATE OFFER ──
          await apiFetch("/api/reservations", {
            method: "POST",
            body: JSON.stringify({
              type: "OFFER",
              clientId: form.selectedClient!.id,
              checkIn: form.startDate,
              checkOut: form.endDate,
              resources: resourcesPayload,
              adults: totalAdults,
              children: totalChildren,
              source: form.offerSource,
              expiresAt: form.expiresAt || undefined,
              expiryAction: form.expiryAction,
              internalNotes: form.offerNote || undefined,
            addons: addonsPayload.length > 0 ? addonsPayload : undefined,
            }),
          });
          showSuccess("Oferta utworzona");
        }
        onCreated(form.activeTab, form.startDate);
        onClose();
      } else if (form.activeTab === "block") {
        // ── CREATE BLOCK ──
        await apiFetch("/api/reservations", {
          method: "POST",
          body: JSON.stringify({
            type: "BLOCK",
            checkIn: form.startDate,
            checkOut: form.endDate,
            resources: form.selectedResources.map(sr => ({ resourceId: sr.resourceId })),
            internalNotes: form.blockNote || undefined,
          }),
        });
        showSuccess("Blokada utworzona");
        onCreated(form.activeTab, form.startDate);
        onClose();
      }
    } catch (err: any) {
      form.setSaving(false);
      if (err instanceof ApiError && err.code === "CONFLICT") {
        showError("Ten termin jest już zajęty dla wybranego zasobu");
      } else if (err instanceof ApiError && err.code === "VALIDATION") {
        showError(err.message);
      } else {
        showError(err?.message || "Wystąpił nieoczekiwany błąd");
      }
    }
  }, [form, isEdit, editReservationId, onCreated, onEdited, onClose, showSuccess, showError]);

  const panelTitle = isEdit
    ? `Edycja rezerwacji ${editNumber}`
    : form.activeTab === "booking" ? "Nowa rezerwacja"
    : form.activeTab === "offer" ? "Nowa oferta"
    : "Nowa blokada";

  const submitLabel = isEdit ? "Zapisz zmiany" : undefined;

  return (
    <>
    <SlidePanel open={open} onClose={onClose} title={panelTitle} width={800}>
      <div className="flex flex-col h-full">
        {/* ── Loading overlay for edit mode ── */}
        {editLoading && (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="text-[13px] text-muted-foreground">Ładowanie rezerwacji...</span>
            </div>
          </div>
        )}

        {!editLoading && (
          <>
            {/* ── Tabs (only in create mode) ── */}
            {!isEdit && (
              <div className="flex gap-2 mb-6">
                {TABS.map(tab => {
                  const Icon = tab.icon;
                  const active = form.activeTab === tab.value;
                  return (
                    <button
                      key={tab.value}
                      onClick={() => form.switchTab(tab.value)}
                      className={cn(
                        "btn-bubble flex-1 flex items-center justify-center gap-2 py-2.5 text-[13px] font-semibold rounded-2xl transition-all",
                        active ? "btn-primary-bubble" : "btn-secondary-bubble"
                      )}
                    >
                      <Icon className={cn("h-3.5 w-3.5", !active && tab.iconColor)} />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            )}

            {/* ── Scrollable form ── */}
            <div className="flex-1 overflow-y-auto space-y-6 pb-4">
              <DatesSection
                startDate={form.startDate} endDate={form.endDate} nights={form.nights}
                onStartDateChange={form.setStartDate} onEndDateChange={form.setEndDate}
              />

              {form.activeTab !== "block" && (
                <ClientSection
                  selectedClient={form.selectedClient} onSelectClient={form.setSelectedClient}
                  search={form.clientSearch} onSearchChange={form.setClientSearch}
                  results={form.clientResults} loading={form.clientsLoading}
                />
              )}

              <ResourcesSection
                activeTab={form.activeTab} startDate={form.startDate} endDate={form.endDate} nights={form.nights}
                allResources={form.allResources} selectedResources={form.selectedResources}
                resourcesLoading={form.resourcesLoading} resourcesLoaded={form.resourcesLoaded}
                blockedResourceIds={form.blockedResourceIds} softBlockedResourceIds={form.softBlockedResourceIds}
                blockedLabels={form.blockedLabels} softBlockedLabels={form.softBlockedLabels}
                onLoadResources={form.loadResources} onToggleResource={form.toggleResource}
                onUpdatePrice={form.updateResourcePrice} onUpdateGuests={form.updateResourceGuests}
                onToggleCapacityOverride={form.toggleCapacityOverride}
                availableItemAddons={form.availableItemAddons}
                itemAddons={form.itemAddons}
                onRemoveItemAddon={form.removeAddon}
                onUpdateItemAddonField={form.updateAddonField}
                onOpenItemAddonPicker={form.openAddonPicker}
              />

              {form.selectedResources.length > 0 && (
                <>
                  {form.activeTab !== "block" && (
                    <AddonsSection
                      selectedAddons={form.selectedAddons}
                      addonsTotal={form.addonsTotal}
                      onRemove={(addonId) => form.removeAddon(addonId)}
                      onUpdate={(addonId, field, value) => form.updateAddonField(addonId, field, value)}
                      onOpenPicker={() => form.openAddonPicker()}
                    />
                  )}
                  {form.activeTab === "booking" && (
                    <BookingDetailsSection
                      source={form.bookingSource} onSourceChange={form.setBookingSource}
                      status={form.bookingStatus} onStatusChange={form.setBookingStatus}
                      guestNotes={form.guestNotes} onGuestNotesChange={form.setGuestNotes}
                      internalNotes={form.internalNotes} onInternalNotesChange={form.setInternalNotes}
                    />
                  )}
                  {form.activeTab === "offer" && (
                    <OfferDetailsSection
                      source={form.offerSource} onSourceChange={form.setOfferSource}
                      note={form.offerNote} onNoteChange={form.setOfferNote}
                      expiresAt={form.expiresAt} onExpiresAtChange={form.setExpiresAt}
                      expiryAction={form.expiryAction} onExpiryActionChange={form.setExpiryAction}
                    />
                  )}
                  {form.activeTab === "block" && (
                    <BlockDetailsSection
                      label={form.blockLabel} onLabelChange={form.setBlockLabel}
                      note={form.blockNote} onNoteChange={form.setBlockNote}
                    />
                  )}
                </>
              )}
            </div>

            <SummarySection
              activeTab={form.activeTab} selectedResources={form.selectedResources}
              nights={form.nights} totalPrice={form.totalPrice} totalGuests={form.totalGuests}
              addonsTotal={form.addonsTotal} itemAddonsTotal={form.itemAddonsTotal}
              canSubmit={form.canSubmit} saving={form.saving} onSubmit={handleSubmit}
              submitLabel={submitLabel}
            />
          </>
        )}
      </div>
    </SlidePanel>

    {/* Addon Picker (opens on top of main panel) */}
    <AddonPickerPanel
      open={form.addonPickerOpen}
      onClose={form.closeAddonPicker}
      scope={form.addonPickerResourceId ? "PER_ITEM" : "GLOBAL"}
      availableAddons={form.addonPickerResourceId ? form.availableItemAddons : form.availableAddons}
      alreadySelected={form.addonPickerResourceId ? (form.itemAddons[form.addonPickerResourceId] || []) : form.selectedAddons}
      onAdd={(addon) => form.addAddon(addon, form.addonPickerResourceId || undefined)}
    />
    </>
  );
}
