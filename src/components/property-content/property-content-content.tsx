"use client";

/**
 * PropertyContentContent — B4 Property Content admin page.
 *
 * 6 SectionCards: Hero, Zasady pobytu, Lokalizacja, Kontakt, Trust Badges, FAQ.
 * Sections 1-4: singleton form with per-section save (PATCH partial).
 * Sections 5-6: CRUD lists with SlidePanel + DnD reorder.
 *
 * Architecture: one source-of-truth state (propertyContent) + section dirty forms.
 * After save, response merges back into source-of-truth.
 *
 * DS: SectionCard §26, inputs §5, toggle §20, DnD §16.1, SlidePanel §19,
 * ConfirmDialog §23, toast §5, skeleton §5, fade-in-up §9.
 */

import React, { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api-fetch";
import { useToast } from "@/components/ui/toast";
import { SectionCard } from "@/components/ui/section-card";
import { SlidePanel } from "@/components/ui/slide-panel";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DynamicIcon } from "@/components/ui/dynamic-icon";
import { Tooltip } from "@/components/ui/tooltip";
import { PropertyContentSkeleton } from "./skeleton";
import {
  AMENITY_ICONS, AMENITY_ICON_KEYS, AMENITY_ICON_GROUPS,
  type AmenityIconDef,
} from "@/lib/amenity-icons";
import {
  Landmark, ScrollText, MapPin, Phone, Award, HelpCircle,
  Plus, Check, Loader2, GripVertical, Pencil, Trash2, Search, X, Info,
} from "lucide-react";

// ═══════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════

interface PropertyContent {
  heroTitle: string | null;
  heroSubtitle: string | null;
  shortDescription: string | null;
  fullDescription: string | null;
  locationDescription: string | null;
  checkInDescription: string | null;
  checkOutDescription: string | null;
  parkingDescription: string | null;
  petsDescription: string | null;
  childrenDescription: string | null;
  quietHoursDescription: string | null;
  houseRules: string | null;
  cancellationPolicy: string | null;
  paymentPolicy: string | null;
  guestContactPhone: string | null;
  guestContactEmail: string | null;
  guestContactWhatsapp: string | null;
  guestAddressLine: string | null;
  guestPostalCode: string | null;
  guestCity: string | null;
  guestCountry: string | null;
  googleMapsUrl: string | null;
  directionsDescription: string | null;
}

interface TrustBadge {
  id: string;
  label: string;
  iconKey: string;
  description: string | null;
  position: number;
  isActive: boolean;
}

interface FaqItem {
  id: string;
  question: string;
  answer: string;
  position: number;
  isActive: boolean;
}

const EMPTY_CONTENT: PropertyContent = {
  heroTitle: null, heroSubtitle: null, shortDescription: null,
  fullDescription: null, locationDescription: null,
  checkInDescription: null, checkOutDescription: null,
  parkingDescription: null, petsDescription: null,
  childrenDescription: null, quietHoursDescription: null,
  houseRules: null, cancellationPolicy: null, paymentPolicy: null,
  guestContactPhone: null, guestContactEmail: null,
  guestContactWhatsapp: null, guestAddressLine: null,
  guestPostalCode: null, guestCity: null, guestCountry: "PL",
  googleMapsUrl: null, directionsDescription: null,
};

// ═══════════════════════════════════════════════════
// Helper: text field with label + char counter
// ═══════════════════════════════════════════════════

function TextField({
  label, value, onChange, maxLength, placeholder, multiline, rows, hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  maxLength: number;
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
  hint?: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-[12px] font-semibold text-muted-foreground">{label}</label>
        <span className="text-[11px] text-muted-foreground/60 tabular-nums">{value.length}/{maxLength}</span>
      </div>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => { if (e.target.value.length <= maxLength) onChange(e.target.value); }}
          placeholder={placeholder}
          rows={rows || 3}
          className="input-bubble min-h-[80px] resize-y w-full"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => { if (e.target.value.length <= maxLength) onChange(e.target.value); }}
          placeholder={placeholder}
          className="input-bubble h-11 w-full"
        />
      )}
      {hint && <p className="text-[11px] text-muted-foreground/60 mt-1">{hint}</p>}
    </div>
  );
}

// ═══════════════════════════════════════════════════
// Helper: Save button
// ═══════════════════════════════════════════════════

function SaveButton({ saving, label, onClick, disabled }: {
  saving: boolean; label: string; onClick: () => void; disabled?: boolean;
}) {
  return (
    <div className="flex gap-3 pt-2">
      <button
        onClick={onClick}
        disabled={saving || disabled}
        className="btn-bubble btn-primary-bubble px-5 py-2.5 text-[13px] disabled:opacity-50"
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
        {saving ? "Zapisywanie..." : label}
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// Helper: Toggle switch (DS §20)
// ═══════════════════════════════════════════════════

function ToggleSwitch({ checked, onChange, label }: {
  checked: boolean; onChange: (v: boolean) => void; label?: string;
}) {
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onChange(!checked); }}
      className="flex items-center gap-3"
    >
      <span className={cn(
        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0",
        checked ? "bg-primary" : "bg-muted-foreground/20"
      )}>
        <span className={cn(
          "inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform",
          checked ? "translate-x-6" : "translate-x-1"
        )} />
      </span>
      {label && <span className="text-[12px] text-muted-foreground">{label}</span>}
    </button>
  );
}

// ═══════════════════════════════════════════════════
// Main component
// ═══════════════════════════════════════════════════

export function PropertyContentContent() {
  const { success, error: toastError } = useToast();

  // ── Source of truth ──
  const [content, setContent] = useState<PropertyContent>(EMPTY_CONTENT);
  const [badges, setBadges] = useState<TrustBadge[]>([]);
  const [faqItems, setFaqItems] = useState<FaqItem[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Section form states (derived from content, track dirty) ──
  const [heroForm, setHeroForm] = useState({ heroTitle: "", heroSubtitle: "", shortDescription: "", fullDescription: "", locationDescription: "" });
  const [rulesForm, setRulesForm] = useState({ checkInDescription: "", checkOutDescription: "", parkingDescription: "", petsDescription: "", childrenDescription: "", quietHoursDescription: "", houseRules: "", cancellationPolicy: "", paymentPolicy: "" });
  const [locationForm, setLocationForm] = useState({ guestAddressLine: "", guestPostalCode: "", guestCity: "", guestCountry: "PL", googleMapsUrl: "", directionsDescription: "" });
  const [contactForm, setContactForm] = useState({ guestContactPhone: "", guestContactEmail: "", guestContactWhatsapp: "" });

  // ── Saving states per section ──
  const [savingHero, setSavingHero] = useState(false);
  const [savingRules, setSavingRules] = useState(false);
  const [savingLocation, setSavingLocation] = useState(false);
  const [savingContact, setSavingContact] = useState(false);

  // ── Badge panel state ──
  const [badgePanelOpen, setBadgePanelOpen] = useState(false);
  const [editingBadge, setEditingBadge] = useState<TrustBadge | null>(null);
  const [badgeForm, setBadgeForm] = useState({ label: "", iconKey: "", description: "", isActive: true });
  const [savingBadge, setSavingBadge] = useState(false);
  const [iconSearch, setIconSearch] = useState("");

  // ── FAQ panel state ──
  const [faqPanelOpen, setFaqPanelOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FaqItem | null>(null);
  const [faqForm, setFaqForm] = useState({ question: "", answer: "", isActive: true });
  const [savingFaq, setSavingFaq] = useState(false);

  // ── Delete dialog ──
  const [deleteTarget, setDeleteTarget] = useState<{ type: "badge" | "faq"; id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ── DnD state ──
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  // ═══ Populate section forms from content ═══
  const populateForms = useCallback((c: PropertyContent) => {
    setHeroForm({
      heroTitle: c.heroTitle || "",
      heroSubtitle: c.heroSubtitle || "",
      shortDescription: c.shortDescription || "",
      fullDescription: c.fullDescription || "",
      locationDescription: c.locationDescription || "",
    });
    setRulesForm({
      checkInDescription: c.checkInDescription || "",
      checkOutDescription: c.checkOutDescription || "",
      parkingDescription: c.parkingDescription || "",
      petsDescription: c.petsDescription || "",
      childrenDescription: c.childrenDescription || "",
      quietHoursDescription: c.quietHoursDescription || "",
      houseRules: c.houseRules || "",
      cancellationPolicy: c.cancellationPolicy || "",
      paymentPolicy: c.paymentPolicy || "",
    });
    setLocationForm({
      guestAddressLine: c.guestAddressLine || "",
      guestPostalCode: c.guestPostalCode || "",
      guestCity: c.guestCity || "",
      guestCountry: c.guestCountry || "PL",
      googleMapsUrl: c.googleMapsUrl || "",
      directionsDescription: c.directionsDescription || "",
    });
    setContactForm({
      guestContactPhone: c.guestContactPhone || "",
      guestContactEmail: c.guestContactEmail || "",
      guestContactWhatsapp: c.guestContactWhatsapp || "",
    });
  }, []);

  // ═══ Load data ═══
  const loadData = useCallback(async () => {
    try {
      const [contentData, badgesData, faqData] = await Promise.all([
        apiFetch<{ propertyContent: PropertyContent }>("/api/property-content"),
        apiFetch<{ trustBadges: TrustBadge[] }>("/api/property-content/trust-badges"),
        apiFetch<{ faqItems: FaqItem[] }>("/api/property-content/faq"),
      ]);
      const c = contentData.propertyContent;
      setContent(c);
      populateForms(c);
      setBadges(badgesData.trustBadges);
      setFaqItems(faqData.faqItems);
    } catch (e: any) {
      toastError("Błąd ładowania", e.message);
    } finally {
      setLoading(false);
    }
  }, [populateForms, toastError]);

  useEffect(() => { loadData(); }, [loadData]);

  // ═══ Section saves — PATCH partial + merge back ═══
  // CRITICAL: after save, only repopulate the SAVED section's form.
  // Other sections keep their local dirty state untouched.

  type SectionKey = "hero" | "rules" | "location" | "contact";

  const repopulateSection = useCallback((c: PropertyContent, section: SectionKey) => {
    switch (section) {
      case "hero":
        setHeroForm({
          heroTitle: c.heroTitle || "", heroSubtitle: c.heroSubtitle || "",
          shortDescription: c.shortDescription || "", fullDescription: c.fullDescription || "",
          locationDescription: c.locationDescription || "",
        });
        break;
      case "rules":
        setRulesForm({
          checkInDescription: c.checkInDescription || "", checkOutDescription: c.checkOutDescription || "",
          parkingDescription: c.parkingDescription || "", petsDescription: c.petsDescription || "",
          childrenDescription: c.childrenDescription || "", quietHoursDescription: c.quietHoursDescription || "",
          houseRules: c.houseRules || "", cancellationPolicy: c.cancellationPolicy || "",
          paymentPolicy: c.paymentPolicy || "",
        });
        break;
      case "location":
        setLocationForm({
          guestAddressLine: c.guestAddressLine || "", guestPostalCode: c.guestPostalCode || "",
          guestCity: c.guestCity || "", guestCountry: c.guestCountry || "PL",
          googleMapsUrl: c.googleMapsUrl || "", directionsDescription: c.directionsDescription || "",
        });
        break;
      case "contact":
        setContactForm({
          guestContactPhone: c.guestContactPhone || "", guestContactEmail: c.guestContactEmail || "",
          guestContactWhatsapp: c.guestContactWhatsapp || "",
        });
        break;
    }
  }, []);

  const saveSection = async (
    data: Record<string, string | null>,
    setSaving: (v: boolean) => void,
    section: SectionKey,
    label: string,
  ) => {
    setSaving(true);
    try {
      // Convert empty strings to null for API
      const payload: Record<string, string | null> = {};
      for (const [k, v] of Object.entries(data)) {
        payload[k] = v === "" ? null : v;
      }
      const res = await apiFetch<{ propertyContent: PropertyContent }>("/api/property-content", {
        method: "PATCH",
        body: payload,
      });
      // Update source of truth
      setContent(res.propertyContent);
      // Repopulate ONLY the saved section (other dirty forms stay untouched)
      repopulateSection(res.propertyContent, section);
      success(label);
    } catch (e: any) {
      toastError("Błąd", e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveHero = () => saveSection(heroForm, setSavingHero, "hero", "Zapisano sekcję Hero");
  const handleSaveRules = () => saveSection(rulesForm, setSavingRules, "rules", "Zapisano zasady pobytu");
  const handleSaveLocation = () => saveSection(locationForm, setSavingLocation, "location", "Zapisano lokalizację");
  const handleSaveContact = () => saveSection(contactForm, setSavingContact, "contact", "Zapisano dane kontaktowe");

  // ═══ Badge CRUD ═══

  const openBadgeCreate = () => {
    setEditingBadge(null);
    setBadgeForm({ label: "", iconKey: "", description: "", isActive: true });
    setIconSearch("");
    setBadgePanelOpen(true);
  };

  const openBadgeEdit = (b: TrustBadge) => {
    setEditingBadge(b);
    setBadgeForm({ label: b.label, iconKey: b.iconKey, description: b.description || "", isActive: b.isActive });
    setIconSearch("");
    setBadgePanelOpen(true);
  };

  const handleSaveBadge = async () => {
    if (!badgeForm.label.trim() || !badgeForm.iconKey) return;
    setSavingBadge(true);
    try {
      if (editingBadge) {
        await apiFetch(`/api/property-content/trust-badges/${editingBadge.id}`, {
          method: "PATCH",
          body: {
            label: badgeForm.label,
            iconKey: badgeForm.iconKey,
            description: badgeForm.description || null,
            isActive: badgeForm.isActive,
          },
        });
        success("Zapisano badge");
      } else {
        await apiFetch("/api/property-content/trust-badges", {
          method: "POST",
          body: {
            label: badgeForm.label,
            iconKey: badgeForm.iconKey,
            description: badgeForm.description || null,
          },
        });
        success("Dodano badge");
      }
      setBadgePanelOpen(false);
      loadData();
    } catch (e: any) {
      toastError("Błąd", e.message);
    } finally {
      setSavingBadge(false);
    }
  };

  const toggleBadgeActive = async (e: React.MouseEvent, b: TrustBadge) => {
    e.stopPropagation();
    try {
      await apiFetch(`/api/property-content/trust-badges/${b.id}`, {
        method: "PATCH",
        body: { isActive: !b.isActive },
      });
      success(b.isActive ? "Dezaktywowano" : "Aktywowano");
      loadData();
    } catch (e: any) {
      toastError("Błąd", (e as Error).message);
    }
  };

  // ═══ FAQ CRUD ═══

  const openFaqCreate = () => {
    setEditingFaq(null);
    setFaqForm({ question: "", answer: "", isActive: true });
    setFaqPanelOpen(true);
  };

  const openFaqEdit = (f: FaqItem) => {
    setEditingFaq(f);
    setFaqForm({ question: f.question, answer: f.answer, isActive: f.isActive });
    setFaqPanelOpen(true);
  };

  const handleSaveFaq = async () => {
    if (!faqForm.question.trim() || !faqForm.answer.trim()) return;
    setSavingFaq(true);
    try {
      if (editingFaq) {
        await apiFetch(`/api/property-content/faq/${editingFaq.id}`, {
          method: "PATCH",
          body: {
            question: faqForm.question,
            answer: faqForm.answer,
            isActive: faqForm.isActive,
          },
        });
        success("Zapisano pytanie FAQ");
      } else {
        await apiFetch("/api/property-content/faq", {
          method: "POST",
          body: {
            question: faqForm.question,
            answer: faqForm.answer,
          },
        });
        success("Dodano pytanie FAQ");
      }
      setFaqPanelOpen(false);
      loadData();
    } catch (e: any) {
      toastError("Błąd", e.message);
    } finally {
      setSavingFaq(false);
    }
  };

  const toggleFaqActive = async (e: React.MouseEvent, f: FaqItem) => {
    e.stopPropagation();
    try {
      await apiFetch(`/api/property-content/faq/${f.id}`, {
        method: "PATCH",
        body: { isActive: !f.isActive },
      });
      success(f.isActive ? "Dezaktywowano" : "Aktywowano");
      loadData();
    } catch (e: any) {
      toastError("Błąd", (e as Error).message);
    }
  };

  // ═══ Delete handler ═══

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const url = deleteTarget.type === "badge"
        ? `/api/property-content/trust-badges/${deleteTarget.id}`
        : `/api/property-content/faq/${deleteTarget.id}`;
      await apiFetch(url, { method: "DELETE" });
      success(`Usunięto: ${deleteTarget.name}`);
      setDeleteTarget(null);
      // Close panel if editing deleted item
      if (deleteTarget.type === "badge" && editingBadge?.id === deleteTarget.id) setBadgePanelOpen(false);
      if (deleteTarget.type === "faq" && editingFaq?.id === deleteTarget.id) setFaqPanelOpen(false);
      loadData();
    } catch (e: any) {
      toastError("Błąd", e.message);
    } finally {
      setDeleting(false);
    }
  };

  // ═══ DnD handlers (shared for badges & FAQ) ═══

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverId(null);
  };

  const handleBadgeDrop = async (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) { handleDragEnd(); return; }

    const list = [...badges];
    const fromIdx = list.findIndex((b) => b.id === draggedId);
    const toIdx = list.findIndex((b) => b.id === targetId);
    if (fromIdx === -1 || toIdx === -1) { handleDragEnd(); return; }

    const [moved] = list.splice(fromIdx, 1);
    list.splice(toIdx, 0, moved);

    const order = list.map((b, i) => ({ id: b.id, position: i }));
    setBadges(list.map((b, i) => ({ ...b, position: i })));
    handleDragEnd();

    try {
      await apiFetch("/api/property-content/trust-badges/reorder", { method: "PATCH", body: { order } });
    } catch (err: any) {
      toastError("Błąd", err.message);
      loadData();
    }
  };

  const handleFaqDrop = async (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) { handleDragEnd(); return; }

    const list = [...faqItems];
    const fromIdx = list.findIndex((f) => f.id === draggedId);
    const toIdx = list.findIndex((f) => f.id === targetId);
    if (fromIdx === -1 || toIdx === -1) { handleDragEnd(); return; }

    const [moved] = list.splice(fromIdx, 1);
    list.splice(toIdx, 0, moved);

    const order = list.map((f, i) => ({ id: f.id, position: i }));
    setFaqItems(list.map((f, i) => ({ ...f, position: i })));
    handleDragEnd();

    try {
      await apiFetch("/api/property-content/faq/reorder", { method: "PATCH", body: { order } });
    } catch (err: any) {
      toastError("Błąd", err.message);
      loadData();
    }
  };

  // ═══ Render ═══

  if (loading) return <PropertyContentSkeleton />;

  return (
    <div className="fade-in-up">
      {/* ── Page header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Treści obiektu</h2>
          <p className="text-[13px] text-muted-foreground mt-1">
            Informacje widoczne dla gości na stronie i w widgecie rezerwacyjnym
          </p>
        </div>
      </div>

      <div className="space-y-4 mt-6 max-w-[800px]">

        {/* ════════════════════════════════════════════
            SEKCJA 1: Hero i opis obiektu
           ════════════════════════════════════════════ */}
        <SectionCard
          title="Hero i opis obiektu"
          description="Główny nagłówek, opis i informacje o lokalizacji"
          icon={Landmark}
          defaultOpen={true}
        >
          <div className="space-y-5">
            <TextField
              label="Tytuł hero" value={heroForm.heroTitle}
              onChange={(v) => setHeroForm({ ...heroForm, heroTitle: v })}
              maxLength={100} placeholder="Nazwa obiektu wyświetlana w nagłówku"
            />
            <TextField
              label="Podtytuł hero" value={heroForm.heroSubtitle}
              onChange={(v) => setHeroForm({ ...heroForm, heroSubtitle: v })}
              maxLength={200} placeholder="Krótki slogan lub opis"
            />
            <TextField
              label="Krótki opis" value={heroForm.shortDescription}
              onChange={(v) => setHeroForm({ ...heroForm, shortDescription: v })}
              maxLength={300} placeholder="Krótki opis wyświetlany na kartach"
              hint="Wyświetlany na kartach i w wynikach wyszukiwania (max 300 znaków)"
            />
            <TextField
              label="Pełny opis" value={heroForm.fullDescription}
              onChange={(v) => setHeroForm({ ...heroForm, fullDescription: v })}
              maxLength={10000} placeholder="Szczegółowy opis obiektu..."
              multiline rows={6} hint="Obsługuje format Markdown"
            />
            <TextField
              label="Opis lokalizacji" value={heroForm.locationDescription}
              onChange={(v) => setHeroForm({ ...heroForm, locationDescription: v })}
              maxLength={3000} placeholder="Opis okolicy, atrakcji w pobliżu..."
              multiline rows={4}
            />
            <SaveButton saving={savingHero} label="Zapisz sekcję Hero" onClick={handleSaveHero} />
          </div>
        </SectionCard>

        {/* ════════════════════════════════════════════
            SEKCJA 2: Zasady pobytu
           ════════════════════════════════════════════ */}
        <SectionCard
          title="Zasady pobytu"
          description="Zameldowanie, wymeldowanie, regulamin i polityki"
          icon={ScrollText}
          defaultOpen={false}
        >
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <TextField
                label="Zameldowanie" value={rulesForm.checkInDescription}
                onChange={(v) => setRulesForm({ ...rulesForm, checkInDescription: v })}
                maxLength={2000} placeholder="Opis procedury zameldowania..."
                multiline rows={3}
              />
              <TextField
                label="Wymeldowanie" value={rulesForm.checkOutDescription}
                onChange={(v) => setRulesForm({ ...rulesForm, checkOutDescription: v })}
                maxLength={2000} placeholder="Opis procedury wymeldowania..."
                multiline rows={3}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <TextField
                label="Parking" value={rulesForm.parkingDescription}
                onChange={(v) => setRulesForm({ ...rulesForm, parkingDescription: v })}
                maxLength={2000} placeholder="Informacje o parkingu..."
                multiline rows={3}
              />
              <TextField
                label="Zwierzęta" value={rulesForm.petsDescription}
                onChange={(v) => setRulesForm({ ...rulesForm, petsDescription: v })}
                maxLength={2000} placeholder="Zasady dot. zwierząt..."
                multiline rows={3}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <TextField
                label="Dzieci" value={rulesForm.childrenDescription}
                onChange={(v) => setRulesForm({ ...rulesForm, childrenDescription: v })}
                maxLength={2000} placeholder="Udogodnienia dla dzieci..."
                multiline rows={3}
              />
              <TextField
                label="Cisza nocna" value={rulesForm.quietHoursDescription}
                onChange={(v) => setRulesForm({ ...rulesForm, quietHoursDescription: v })}
                maxLength={2000} placeholder="Godziny ciszy nocnej..."
                multiline rows={3}
              />
            </div>
            <TextField
              label="Regulamin obiektu" value={rulesForm.houseRules}
              onChange={(v) => setRulesForm({ ...rulesForm, houseRules: v })}
              maxLength={5000} placeholder="Ogólne zasady pobytu..."
              multiline rows={5} hint="Obsługuje format Markdown"
            />
            <TextField
              label="Polityka anulowania" value={rulesForm.cancellationPolicy}
              onChange={(v) => setRulesForm({ ...rulesForm, cancellationPolicy: v })}
              maxLength={5000} placeholder="Warunki anulowania rezerwacji..."
              multiline rows={4} hint="Obsługuje format Markdown"
            />
            <TextField
              label="Polityka płatności" value={rulesForm.paymentPolicy}
              onChange={(v) => setRulesForm({ ...rulesForm, paymentPolicy: v })}
              maxLength={5000} placeholder="Informacje o płatnościach, depozytach..."
              multiline rows={4} hint="Obsługuje format Markdown"
            />
            <SaveButton saving={savingRules} label="Zapisz zasady pobytu" onClick={handleSaveRules} />
          </div>
        </SectionCard>

        {/* ════════════════════════════════════════════
            SEKCJA 3: Lokalizacja i dojazd
           ════════════════════════════════════════════ */}
        <SectionCard
          title="Lokalizacja i dojazd"
          description="Adres, mapa i wskazówki dojazdu"
          icon={MapPin}
          defaultOpen={false}
        >
          <div className="space-y-5">
            <TextField
              label="Adres" value={locationForm.guestAddressLine}
              onChange={(v) => setLocationForm({ ...locationForm, guestAddressLine: v })}
              maxLength={200} placeholder="ul. Przykładowa 1"
            />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <TextField
                label="Kod pocztowy" value={locationForm.guestPostalCode}
                onChange={(v) => setLocationForm({ ...locationForm, guestPostalCode: v })}
                maxLength={20} placeholder="12-345"
              />
              <TextField
                label="Miejscowość" value={locationForm.guestCity}
                onChange={(v) => setLocationForm({ ...locationForm, guestCity: v })}
                maxLength={100} placeholder="Stare Jabłonki"
              />
              <TextField
                label="Kraj" value={locationForm.guestCountry}
                onChange={(v) => setLocationForm({ ...locationForm, guestCountry: v })}
                maxLength={10} placeholder="PL"
              />
            </div>
            <TextField
              label="Link do Google Maps" value={locationForm.googleMapsUrl}
              onChange={(v) => setLocationForm({ ...locationForm, googleMapsUrl: v })}
              maxLength={500} placeholder="https://maps.google.com/..."
            />
            <TextField
              label="Opis dojazdu" value={locationForm.directionsDescription}
              onChange={(v) => setLocationForm({ ...locationForm, directionsDescription: v })}
              maxLength={3000} placeholder="Jak dojechać od strony..."
              multiline rows={4}
            />
            <SaveButton saving={savingLocation} label="Zapisz lokalizację" onClick={handleSaveLocation} />
          </div>
        </SectionCard>

        {/* ════════════════════════════════════════════
            SEKCJA 4: Kontakt dla gościa
           ════════════════════════════════════════════ */}
        <SectionCard
          title="Kontakt dla gościa"
          description="Telefon, e-mail i WhatsApp widoczne dla gości"
          icon={Phone}
          defaultOpen={false}
        >
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <TextField
                label="Telefon" value={contactForm.guestContactPhone}
                onChange={(v) => setContactForm({ ...contactForm, guestContactPhone: v })}
                maxLength={50} placeholder="+48 123 456 789"
              />
              <TextField
                label="E-mail" value={contactForm.guestContactEmail}
                onChange={(v) => setContactForm({ ...contactForm, guestContactEmail: v })}
                maxLength={100} placeholder="kontakt@zielonewzgorza.eu"
              />
            </div>
            <TextField
              label="WhatsApp" value={contactForm.guestContactWhatsapp}
              onChange={(v) => setContactForm({ ...contactForm, guestContactWhatsapp: v })}
              maxLength={50} placeholder="+48 123 456 789"
            />
            <SaveButton saving={savingContact} label="Zapisz dane kontaktowe" onClick={handleSaveContact} />
          </div>
        </SectionCard>

        {/* ════════════════════════════════════════════
            SEKCJA 5: Trust badges
           ════════════════════════════════════════════ */}
        <SectionCard
          title="Trust badges"
          description="Wyróżniki obiektu widoczne na stronie (np. WiFi, parking, plaża)"
          icon={Award}
          defaultOpen={false}
          action={
            <button onClick={openBadgeCreate} className="btn-bubble btn-primary-bubble px-3 py-1.5 text-[12px]">
              <Plus className="h-3.5 w-3.5" /> Dodaj
            </button>
          }
        >
          {badges.length === 0 ? (
            <div className="py-12 text-center">
              <Award className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-[14px] font-medium text-muted-foreground">Brak trust badges</p>
              <p className="text-[12px] text-muted-foreground/60 mt-1">Dodaj badge, aby wyświetlać wyróżniki na stronie obiektu</p>
            </div>
          ) : (
            <>
              <p className="text-[11px] text-muted-foreground/60 flex items-center gap-1.5 mb-3">
                <Info className="h-3 w-3 shrink-0" />
                Kliknij element, aby go edytować. Przeciągnij za uchwyt, aby zmienić kolejność.
              </p>
              <div className="space-y-2">
                {badges.map((badge) => {
                  const isDragging = draggedId === badge.id;
                  const isDragOver = dragOverId === badge.id;
                  return (
                    <div
                      key={badge.id}
                      data-item-card={badge.id}
                      onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; if (draggedId && draggedId !== badge.id) setDragOverId(badge.id); }}
                      onDragLeave={() => { if (dragOverId === badge.id) setDragOverId(null); }}
                      onDrop={(e) => handleBadgeDrop(e, badge.id)}
                      onClick={() => openBadgeEdit(badge)}
                      className={cn(
                        "bubble-interactive px-4 py-3 flex items-center gap-3 cursor-pointer transition-all duration-200",
                        isDragging && "opacity-30 scale-95",
                        isDragOver && "ring-2 ring-primary ring-offset-2",
                        !badge.isActive && "opacity-50",
                      )}
                    >
                      {/* Drag handle */}
                      <div
                        draggable
                        onDragStart={(e) => {
                          e.stopPropagation();
                          const card = e.currentTarget.closest("[data-item-card]");
                          if (card instanceof HTMLElement) e.dataTransfer.setDragImage(card, 20, 20);
                          e.dataTransfer.effectAllowed = "move";
                          setDraggedId(badge.id);
                        }}
                        onDragEnd={handleDragEnd}
                        onClick={(e) => e.stopPropagation()}
                        className="cursor-grab active:cursor-grabbing text-muted-foreground/30 hover:text-muted-foreground shrink-0 p-0.5 -m-0.5"
                      >
                        <GripVertical className="h-4 w-4" />
                      </div>
                      <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <DynamicIcon iconKey={badge.iconKey} className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold truncate">{badge.label}</p>
                        {badge.description && (
                          <p className="text-[11px] text-muted-foreground truncate">{badge.description}</p>
                        )}
                      </div>
                      <ToggleSwitch checked={badge.isActive} onChange={() => {}} />
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </SectionCard>

        {/* ════════════════════════════════════════════
            SEKCJA 6: FAQ
           ════════════════════════════════════════════ */}
        <SectionCard
          title="FAQ"
          description="Często zadawane pytania wyświetlane na stronie obiektu"
          icon={HelpCircle}
          defaultOpen={false}
          action={
            <button onClick={openFaqCreate} className="btn-bubble btn-primary-bubble px-3 py-1.5 text-[12px]">
              <Plus className="h-3.5 w-3.5" /> Dodaj
            </button>
          }
        >
          {faqItems.length === 0 ? (
            <div className="py-12 text-center">
              <HelpCircle className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-[14px] font-medium text-muted-foreground">Brak pytań FAQ</p>
              <p className="text-[12px] text-muted-foreground/60 mt-1">Dodaj pytanie, aby ułatwić gościom znalezienie odpowiedzi</p>
            </div>
          ) : (
            <>
              <p className="text-[11px] text-muted-foreground/60 flex items-center gap-1.5 mb-3">
                <Info className="h-3 w-3 shrink-0" />
                Kliknij element, aby go edytować. Przeciągnij za uchwyt, aby zmienić kolejność.
              </p>
              <div className="space-y-2">
                {faqItems.map((faq) => {
                  const isDragging = draggedId === faq.id;
                  const isDragOver = dragOverId === faq.id;
                  return (
                    <div
                      key={faq.id}
                      data-item-card={faq.id}
                      onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; if (draggedId && draggedId !== faq.id) setDragOverId(faq.id); }}
                      onDragLeave={() => { if (dragOverId === faq.id) setDragOverId(null); }}
                      onDrop={(e) => handleFaqDrop(e, faq.id)}
                      onClick={() => openFaqEdit(faq)}
                      className={cn(
                        "bubble-interactive px-4 py-3 flex items-center gap-3 cursor-pointer transition-all duration-200",
                        isDragging && "opacity-30 scale-95",
                        isDragOver && "ring-2 ring-primary ring-offset-2",
                        !faq.isActive && "opacity-50",
                      )}
                    >
                      {/* Drag handle */}
                      <div
                        draggable
                        onDragStart={(e) => {
                          e.stopPropagation();
                          const card = e.currentTarget.closest("[data-item-card]");
                          if (card instanceof HTMLElement) e.dataTransfer.setDragImage(card, 20, 20);
                          e.dataTransfer.effectAllowed = "move";
                          setDraggedId(faq.id);
                        }}
                        onDragEnd={handleDragEnd}
                        onClick={(e) => e.stopPropagation()}
                        className="cursor-grab active:cursor-grabbing text-muted-foreground/30 hover:text-muted-foreground shrink-0 p-0.5 -m-0.5"
                      >
                        <GripVertical className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold truncate">{faq.question}</p>
                        <p className="text-[11px] text-muted-foreground line-clamp-2">{faq.answer}</p>
                      </div>
                      <ToggleSwitch checked={faq.isActive} onChange={() => {}} />
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </SectionCard>

      </div>

      {/* ════════════════════════════════════════════
          SlidePanel: Trust Badge create/edit
         ════════════════════════════════════════════ */}
      <SlidePanel
        open={badgePanelOpen}
        onClose={() => setBadgePanelOpen(false)}
        title={editingBadge ? "Edytuj badge" : "Nowy badge"}
      >
        <div className="space-y-5">
          <TextField
            label="Nazwa *" value={badgeForm.label}
            onChange={(v) => setBadgeForm({ ...badgeForm, label: v })}
            maxLength={100} placeholder="np. Bezpłatny parking"
          />

          {/* Icon picker — reuse B3 pattern */}
          <div>
            <label className="text-[12px] font-semibold text-muted-foreground mb-1.5 block">Ikona *</label>
            {badgeForm.iconKey && (
              <div className="flex items-center gap-2 mb-3 p-3 rounded-xl bg-primary/5 border border-primary/20">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <DynamicIcon iconKey={badgeForm.iconKey} className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-[13px] font-semibold">{badgeForm.iconKey}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {(AMENITY_ICONS as Record<string, AmenityIconDef>)[badgeForm.iconKey]?.label || ""}
                  </p>
                </div>
              </div>
            )}
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text" value={iconSearch} onChange={(e) => setIconSearch(e.target.value)}
                placeholder="Szukaj ikony..." className="input-bubble h-9 w-full text-[12px]"
                style={{ paddingLeft: 32 }}
              />
              {iconSearch && (
                <button
                  onClick={() => setIconSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-muted-foreground/20 hover:text-foreground transition-all"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
            <div className="max-h-[280px] overflow-y-auto rounded-xl border border-border p-2">
              {AMENITY_ICON_GROUPS.map((group) => {
                const icons = AMENITY_ICON_KEYS.filter((key) => {
                  const def = (AMENITY_ICONS as Record<string, AmenityIconDef>)[key];
                  if (def.group !== group) return false;
                  if (iconSearch) {
                    const q = iconSearch.toLowerCase();
                    return key.includes(q) || def.label.toLowerCase().includes(q) || def.group.toLowerCase().includes(q);
                  }
                  return true;
                });
                if (icons.length === 0) return null;
                return (
                  <div key={group} className="mb-2">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-1">{group}</p>
                    <div className="grid grid-cols-8 gap-1">
                      {icons.map((key) => (
                        <Tooltip key={key} content={`${(AMENITY_ICONS as Record<string, AmenityIconDef>)[key]?.label}`}>
                          <button
                            type="button"
                            onClick={() => setBadgeForm({ ...badgeForm, iconKey: key })}
                            className={cn(
                              "h-9 w-9 rounded-lg flex items-center justify-center transition-all",
                              badgeForm.iconKey === key
                                ? "bg-primary text-white shadow-sm"
                                : "hover:bg-muted text-muted-foreground hover:text-foreground"
                            )}
                          >
                            <DynamicIcon iconKey={key} className="h-4 w-4" />
                          </button>
                        </Tooltip>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <TextField
            label="Opis (opcjonalny)" value={badgeForm.description}
            onChange={(v) => setBadgeForm({ ...badgeForm, description: v })}
            maxLength={300} placeholder="Krótki opis wyróżnika..."
          />

          {editingBadge && (
            <ToggleSwitch
              checked={badgeForm.isActive}
              onChange={(v) => setBadgeForm({ ...badgeForm, isActive: v })}
              label={badgeForm.isActive ? "Aktywny — widoczny na stronie" : "Nieaktywny — ukryty na stronie"}
            />
          )}

          <div className="flex gap-3 pt-2 pb-8">
            <button
              onClick={handleSaveBadge}
              disabled={savingBadge || !badgeForm.label.trim() || !badgeForm.iconKey}
              className="btn-bubble btn-primary-bubble px-6 py-3 text-[13px] disabled:opacity-50"
            >
              {savingBadge ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              {savingBadge ? "Zapisywanie..." : editingBadge ? "Zapisz badge" : "Dodaj badge"}
            </button>
            {editingBadge && (
              <button
                onClick={() => setDeleteTarget({ type: "badge", id: editingBadge.id, name: editingBadge.label })}
                className="btn-bubble btn-danger-bubble px-4 py-3 text-[13px]"
              >
                <Trash2 className="h-4 w-4" /> Usuń
              </button>
            )}
          </div>
        </div>
      </SlidePanel>

      {/* ════════════════════════════════════════════
          SlidePanel: FAQ create/edit
         ════════════════════════════════════════════ */}
      <SlidePanel
        open={faqPanelOpen}
        onClose={() => setFaqPanelOpen(false)}
        title={editingFaq ? "Edytuj pytanie" : "Nowe pytanie"}
      >
        <div className="space-y-5">
          <TextField
            label="Pytanie *" value={faqForm.question}
            onChange={(v) => setFaqForm({ ...faqForm, question: v })}
            maxLength={300} placeholder="np. Czy można przyjechać ze zwierzętami?"
          />
          <TextField
            label="Odpowiedź *" value={faqForm.answer}
            onChange={(v) => setFaqForm({ ...faqForm, answer: v })}
            maxLength={5000} placeholder="Treść odpowiedzi..."
            multiline rows={6} hint="Obsługuje format Markdown"
          />

          {editingFaq && (
            <ToggleSwitch
              checked={faqForm.isActive}
              onChange={(v) => setFaqForm({ ...faqForm, isActive: v })}
              label={faqForm.isActive ? "Aktywne — widoczne na stronie" : "Nieaktywne — ukryte na stronie"}
            />
          )}

          <div className="flex gap-3 pt-2 pb-8">
            <button
              onClick={handleSaveFaq}
              disabled={savingFaq || !faqForm.question.trim() || !faqForm.answer.trim()}
              className="btn-bubble btn-primary-bubble px-6 py-3 text-[13px] disabled:opacity-50"
            >
              {savingFaq ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              {savingFaq ? "Zapisywanie..." : editingFaq ? "Zapisz pytanie" : "Dodaj pytanie"}
            </button>
            {editingFaq && (
              <button
                onClick={() => setDeleteTarget({ type: "faq", id: editingFaq.id, name: editingFaq.question })}
                className="btn-bubble btn-danger-bubble px-4 py-3 text-[13px]"
              >
                <Trash2 className="h-4 w-4" /> Usuń
              </button>
            )}
          </div>
        </div>
      </SlidePanel>

      {/* ════════════════════════════════════════════
          ConfirmDialog: Delete
         ════════════════════════════════════════════ */}
      <ConfirmDialog
        open={!!deleteTarget}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        title={deleteTarget?.type === "badge" ? "Usuń badge" : "Usuń pytanie FAQ"}
        message={`Czy na pewno chcesz usunąć "${deleteTarget?.name || ""}"? Tej operacji nie można cofnąć.`}
        confirmLabel={deleting ? "Usuwanie..." : "Usuń"}
        variant="danger"
      />
    </div>
  );
}
