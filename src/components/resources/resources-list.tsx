"use client";
import React, { useEffect, useState, useCallback, useRef } from "react";
import { Plus, Pencil, Trash2, Check, Home, Building2, UtensilsCrossed, Ship, Sparkles, Users, Loader2, Search, Layers, MapPin, Hash, Bike, ConciergeBell, Package, X, GripVertical, ArrowLeft, ImageIcon, FileText, Ruler, BedDouble, ChevronDown, Maximize2, Bath, DoorOpen, Settings, FolderOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api-fetch";
import { SlidePanel } from "@/components/ui/slide-panel";
import { SectionCard } from "@/components/ui/section-card";
import { ResourcesSkeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { BubbleSelect } from "@/components/ui/bubble-select";
import { UnitBadge } from "@/components/ui/unit-badge";
import { parseMoneyToMinor, fromMinor } from "@/lib/format";
import { ImageUpload } from "@/components/resources/image-upload";
import { BED_TYPES, BED_TYPE_KEYS, isValidBedType, getBedTypeLabel } from "@/lib/bed-types";
import { DynamicIcon } from "@/components/ui/dynamic-icon";
import { Tooltip } from "@/components/ui/tooltip";
import type { BedType } from "@/lib/bed-types";

interface Category { id: string; name: string; slug: string; unitNumber: string | null; type: string; icon: string | null; description: string | null; _count?: { resources: number }; }
interface Variant { id: string; name: string; description: string | null; capacity: number; basePrice: number | null; basePriceMinor?: number | null; isDefault: boolean; isActive: boolean; }
interface ResourceImageData { id: string; alt: string | null; position: number; isCover: boolean; sizeBytes: number; width: number; height: number; urls: { original: string; medium: string; thumbnail: string }; }
interface ResourceBedData { bedType: string; quantity: number; }
interface ResourceAmenityData { amenity: { id: string; name: string; slug: string; iconKey: string; category: { id: string; name: string; slug: string } } }
interface Resource { id: string; name: string; slug: string; unitNumber: string | null; categoryId: string; longDescription: string | null; shortDescription: string | null; maxCapacity: number | null; totalUnits: number; areaSqm: number | null; bedroomCount: number | null; bathroomCount: number | null; location: string | null; status: string; sortOrder: number; visibleInWidget: boolean; category: Category; variants: Variant[]; images?: ResourceImageData[]; beds?: ResourceBedData[]; amenities?: ResourceAmenityData[]; _count?: { variants: number; images: number; beds?: number }; }

// ── B2: Inline editors for SectionCards (DS-compliant) ──

function ResourceContentEditor({ resource, onSave }: { resource: Resource; onSave: (data: Record<string, unknown>) => Promise<boolean> }) {
  const { success: showSuccess } = useToast();
  const [short, setShort] = useState(resource.shortDescription || "");
  const [long, setLong] = useState(resource.longDescription || "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setShort(resource.shortDescription || "");
    setLong(resource.longDescription || "");
  }, [resource.id, resource.shortDescription, resource.longDescription]);

  async function handleSave() {
    setSaving(true);
    const ok = await onSave({ shortDescription: short, longDescription: long });
    if (ok) showSuccess("Treści zapisane");
    setSaving(false);
  }

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-[12px] font-semibold text-muted-foreground">Krótki opis</label>
          <span className="text-[11px] text-muted-foreground/60 tabular-nums">{short.length}/200</span>
        </div>
        <input
          type="text"
          value={short}
          onChange={(e) => { if (e.target.value.length <= 200) setShort(e.target.value); }}
          placeholder="Krótki opis wyświetlany na kartach widgetu..."
          className="input-bubble h-11"
        />
      </div>
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-[12px] font-semibold text-muted-foreground">Pełny opis</label>
          <span className="text-[11px] text-muted-foreground/60 tabular-nums">{long.length}/10000</span>
        </div>
        <textarea
          value={long}
          onChange={(e) => { if (e.target.value.length <= 10000) setLong(e.target.value); }}
          placeholder="Pełny opis zasobu wyświetlany na stronie szczegółów..."
          rows={5}
          className="input-bubble min-h-[80px] resize-y"
        />
        <p className="text-[11px] text-muted-foreground/60 mt-1">Obsługuje format Markdown</p>
      </div>
      <div className="flex gap-3 pt-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-bubble btn-primary-bubble px-5 py-2.5 text-[13px] disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          {saving ? "Zapisywanie..." : "Zapisz treści"}
        </button>
      </div>
    </div>
  );
}

function ResourceTechnicalEditor({ resource, onSave }: { resource: Resource; onSave: (data: Record<string, unknown>) => Promise<boolean> }) {
  const { success: showSuccess } = useToast();
  const [areaSqm, setAreaSqm] = useState(resource.areaSqm?.toString() || "");
  const [bedrooms, setBedrooms] = useState(resource.bedroomCount?.toString() || "");
  const [bathrooms, setBathrooms] = useState(resource.bathroomCount?.toString() || "");
  const [capacity, setCapacity] = useState(resource.maxCapacity?.toString() || "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setAreaSqm(resource.areaSqm?.toString() || "");
    setBedrooms(resource.bedroomCount?.toString() || "");
    setBathrooms(resource.bathroomCount?.toString() || "");
    setCapacity(resource.maxCapacity?.toString() || "");
  }, [resource.id, resource.areaSqm, resource.bedroomCount, resource.bathroomCount, resource.maxCapacity]);

  async function handleSave() {
    setSaving(true);
    const ok = await onSave({
      areaSqm: areaSqm || null,
      bedroomCount: bedrooms || null,
      bathroomCount: bathrooms || null,
      maxCapacity: capacity || null,
    });
    if (ok) showSuccess("Dane techniczne zapisane");
    setSaving(false);
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-[12px] font-semibold text-muted-foreground mb-1.5 flex items-center gap-1.5"><Maximize2 className="h-3.5 w-3.5" /> Powierzchnia (m²)</label>
          <input type="number" value={areaSqm} onChange={(e) => setAreaSqm(e.target.value)} placeholder="np. 45" min="1" max="9999" className="input-bubble h-11" />
        </div>
        <div>
          <label className="text-[12px] font-semibold text-muted-foreground mb-1.5 flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> Pojemność (osób)</label>
          <input type="number" value={capacity} onChange={(e) => setCapacity(e.target.value)} placeholder="np. 7" min="1" className="input-bubble h-11" />
        </div>
        <div>
          <label className="text-[12px] font-semibold text-muted-foreground mb-1.5 flex items-center gap-1.5"><DoorOpen className="h-3.5 w-3.5" /> Sypialnie</label>
          <input type="number" value={bedrooms} onChange={(e) => setBedrooms(e.target.value)} placeholder="np. 2" min="0" max="50" className="input-bubble h-11" />
        </div>
        <div>
          <label className="text-[12px] font-semibold text-muted-foreground mb-1.5 flex items-center gap-1.5"><Bath className="h-3.5 w-3.5" /> Łazienki</label>
          <input type="number" value={bathrooms} onChange={(e) => setBathrooms(e.target.value)} placeholder="np. 1" min="0" max="50" className="input-bubble h-11" />
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-bubble btn-primary-bubble px-5 py-2.5 text-[13px] disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          {saving ? "Zapisywanie..." : "Zapisz dane techniczne"}
        </button>
      </div>
    </div>
  );
}

function ResourceSettingsEditor({ resource, categories, onSave }: { resource: Resource; categories: Category[]; onSave: (data: Record<string, unknown>) => Promise<boolean> }) {
  const { success: showSuccess } = useToast();
  const [name, setName] = useState(resource.name);
  const [categoryId, setCategoryId] = useState(resource.categoryId);
  const [unitNumber, setUnitNumber] = useState(resource.unitNumber || "");
  const [totalUnits, setTotalUnits] = useState(resource.totalUnits.toString());
  const [location, setLocation] = useState(resource.location || "");
  const [status, setStatus] = useState(resource.status);
  const [visible, setVisible] = useState(resource.visibleInWidget);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName(resource.name);
    setCategoryId(resource.categoryId);
    setUnitNumber(resource.unitNumber || "");
    setTotalUnits(resource.totalUnits.toString());
    setLocation(resource.location || "");
    setStatus(resource.status);
    setVisible(resource.visibleInWidget);
  }, [resource.id]);

  const categoryOptions = categories.map((c) => ({ value: c.id, label: c.name }));
  const statusOptions = [
    { value: "ACTIVE", label: "Aktywny" },
    { value: "INACTIVE", label: "Nieaktywny" },
    { value: "MAINTENANCE", label: "W remoncie" },
  ];

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    const ok = await onSave({ name, categoryId, unitNumber: unitNumber || null, totalUnits: parseInt(totalUnits) || 1, location: location || null, status, visibleInWidget: visible });
    if (ok) showSuccess("Ustawienia zapisane");
    setSaving(false);
  }

  return (
    <div className="space-y-5">
      <div>
        <label className="text-[12px] font-semibold text-muted-foreground mb-1.5 flex items-center gap-1.5"><Pencil className="h-3.5 w-3.5" /> Nazwa zasobu *</label>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input-bubble h-11" />
      </div>
      <BubbleSelect label="Kategoria" options={categoryOptions} value={categoryId} onChange={setCategoryId} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-[12px] font-semibold text-muted-foreground mb-1.5 flex items-center gap-1.5"><Hash className="h-3.5 w-3.5" /> Numer</label>
          <input type="text" value={unitNumber} onChange={(e) => setUnitNumber(e.target.value)} placeholder="np. 1, A3" className="input-bubble h-11" />
        </div>
        <div>
          <label className="text-[12px] font-semibold text-muted-foreground mb-1.5 flex items-center gap-1.5"><Layers className="h-3.5 w-3.5" /> Ilość sztuk</label>
          <input type="number" value={totalUnits} onChange={(e) => setTotalUnits(e.target.value)} min="1" className="input-bubble h-11" />
        </div>
      </div>
      <div>
        <label className="text-[12px] font-semibold text-muted-foreground mb-1.5 flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> Lokalizacja</label>
        <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="np. Nad jeziorem" className="input-bubble h-11" />
      </div>
      <BubbleSelect label="Status" options={statusOptions} value={status} onChange={setStatus} />
      <button type="button" onClick={() => setVisible(!visible)} className="flex items-center gap-3 w-full text-left">
        <span className={cn("relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0", visible ? "bg-primary" : "bg-muted-foreground/20")}>
          <span className={cn("inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform", visible ? "translate-x-6" : "translate-x-1")} />
        </span>
        <span className="text-[12px] text-muted-foreground">Widoczny w widgecie rezerwacyjnym</span>
      </button>
      <div className="flex gap-3 pt-2">
        <button onClick={handleSave} disabled={saving || !name.trim()} className="btn-bubble btn-primary-bubble px-5 py-2.5 text-[13px] disabled:opacity-50">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          {saving ? "Zapisywanie..." : "Zapisz ustawienia"}
        </button>
      </div>
    </div>
  );
}

function ResourceBedsEditor({ resourceId, beds, onBedsChange }: { resourceId: string; beds: ResourceBedData[]; onBedsChange: (beds: ResourceBedData[]) => void }) {
  const { error: showError, success: showSuccess } = useToast();
  const [localBeds, setLocalBeds] = useState<ResourceBedData[]>(beds);
  const [saving, setSaving] = useState(false);

  useEffect(() => { setLocalBeds(beds); }, [beds]);

  const usedTypes = new Set(localBeds.map((b) => b.bedType));
  const availableTypes = BED_TYPE_KEYS.filter((t) => !usedTypes.has(t));

  function addBed() {
    if (availableTypes.length === 0) return;
    setLocalBeds([...localBeds, { bedType: availableTypes[0], quantity: 1 }]);
  }

  function removeBed(index: number) {
    setLocalBeds(localBeds.filter((_, i) => i !== index));
  }

  function updateBed(index: number, field: "bedType" | "quantity", value: string | number) {
    const updated = [...localBeds];
    if (field === "bedType") updated[index] = { ...updated[index], bedType: value as string };
    if (field === "quantity") updated[index] = { ...updated[index], quantity: Math.max(1, Math.min(20, Number(value))) };
    setLocalBeds(updated);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await apiFetch("/api/resources/" + resourceId + "/beds", {
        method: "PUT",
        body: { beds: localBeds },
      });
      onBedsChange(res.beds || []);
      showSuccess("Łóżka zapisane");
    } catch (e: any) {
      showError(e.message || "Błąd zapisu łóżek");
    }
    setSaving(false);
  }

  const bedTypeOptions = BED_TYPE_KEYS.map((t) => ({
    value: t,
    label: getBedTypeLabel(t),
  }));

  return (
    <div className="space-y-5">
      {localBeds.length === 0 && (
        <div className="py-8 text-center">
          <BedDouble className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-[13px] text-muted-foreground">Brak łóżek</p>
          <p className="text-[12px] text-muted-foreground/60 mt-1">Dodaj konfigurację miejsc sypialnych</p>
        </div>
      )}
      {localBeds.map((bed, idx) => (
        <div key={idx} className="flex items-end gap-3">
          <div className="flex-1">
            <BubbleSelect
              label={idx === 0 ? "Typ łóżka" : undefined}
              options={bedTypeOptions.map((o) => ({
                ...o,
                label: usedTypes.has(o.value) && o.value !== bed.bedType ? `${o.label} (użyty)` : o.label,
              }))}
              value={bed.bedType}
              onChange={(v) => updateBed(idx, "bedType", v)}
            />
          </div>
          <div className="w-[100px] shrink-0">
            {idx === 0 && <label className="text-[12px] font-semibold text-muted-foreground mb-1.5 block">Ilość</label>}
            <input
              type="number"
              value={bed.quantity}
              onChange={(e) => updateBed(idx, "quantity", e.target.value)}
              min="1"
              max="20"
              className="input-bubble h-11 text-center"
            />
          </div>
          <div className="h-11 flex items-center shrink-0">
            <Tooltip content="Usuń">
            <button
              onClick={() => removeBed(idx)}
              className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all"
            >
              <Trash2 className="h-3 w-3" />
            </button>
            </Tooltip>
          </div>
        </div>
      ))}
      <div className="flex items-center gap-3 pt-2">
        {availableTypes.length > 0 && (
          <button
            onClick={addBed}
            className="btn-bubble btn-secondary-bubble px-5 py-2.5 text-[13px]"
          >
            <Plus className="h-4 w-4" /> Dodaj łóżko
          </button>
        )}
        {localBeds.length > 0 && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-bubble btn-primary-bubble px-5 py-2.5 text-[13px] disabled:opacity-50 ml-auto"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            {saving ? "Zapisywanie..." : "Zapisz łóżka"}
          </button>
        )}
      </div>
    </div>
  );
}

// ── End B2 inline editors ─────────────────────────────

// ── B3: Amenities editor for SectionCard #7 ──

interface AllAmenityRow { id: string; name: string; iconKey: string; category: { id: string; name: string } }

function ResourceAmenitiesEditor({ resourceId, currentAmenities, onAmenitiesChange }: {
  resourceId: string;
  currentAmenities: ResourceAmenityData[];
  onAmenitiesChange: (amenities: ResourceAmenityData[]) => void;
}) {
  const { success: showSuccess, error: showError } = useToast();
  const [allAmenities, setAllAmenities] = useState<AllAmenityRow[]>([]);
  const [loadingAll, setLoadingAll] = useState(true);
  const [saving, setSaving] = useState(false);

  // Selected amenity IDs (local state for toggling)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [dirty, setDirty] = useState(false);

  // Load all amenities catalog
  useEffect(() => {
    (async () => {
      try {
        const data = await apiFetch<{ amenities: AllAmenityRow[] }>("/api/amenities");
        setAllAmenities(data.amenities.filter((a: any) => a.isActive));
      } catch (e: any) {
        showError("Błąd", e.message);
      } finally {
        setLoadingAll(false);
      }
    })();
  }, [showError]);

  // Sync selectedIds from resource data
  useEffect(() => {
    const ids = new Set(currentAmenities.map((ra) => ra.amenity.id));
    setSelectedIds(ids);
    setDirty(false);
  }, [currentAmenities]);

  // Group all amenities by category
  const grouped = new Map<string, { catName: string; items: AllAmenityRow[] }>();
  for (const a of allAmenities) {
    const key = a.category.id;
    if (!grouped.has(key)) grouped.set(key, { catName: a.category.name, items: [] });
    grouped.get(key)!.items.push(a);
  }

  const toggle = (amenityId: string) => {
    const next = new Set(selectedIds);
    if (next.has(amenityId)) next.delete(amenityId);
    else next.add(amenityId);
    setSelectedIds(next);
    setDirty(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const result = await apiFetch<{ amenities: any[] }>(`/api/resources/${resourceId}/amenities`, {
        method: "PUT",
        body: { amenityIds: [...selectedIds] },
      });
      // Update parent state — map to ResourceAmenityData shape
      const newAmenities: ResourceAmenityData[] = result.amenities.map((a: any) => ({
        amenity: {
          id: a.id,
          name: a.name,
          slug: a.slug,
          iconKey: a.iconKey,
          category: { id: a.categoryId, name: a.categoryName, slug: a.categorySlug },
        },
      }));
      onAmenitiesChange(newAmenities);
      setDirty(false);
      showSuccess("Udogodnienia zapisane");
    } catch (e: any) {
      showError("Błąd", e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loadingAll) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (allAmenities.length === 0) {
    return (
      <div className="py-8 text-center">
        <Sparkles className="h-6 w-6 text-muted-foreground/30 mx-auto mb-2" />
        <p className="text-[12px] text-muted-foreground">Brak udogodnień w katalogu</p>
        <p className="text-[11px] text-muted-foreground/60 mt-1">
          Dodaj udogodnienia w zakładce Udogodnienia
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {[...grouped.entries()].map(([catId, { catName, items }]) => (
        <div key={catId}>
          <p className="text-[12px] font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
            <FolderOpen className="h-3 w-3" />
            {catName}
          </p>
          <div className="space-y-1">
            {items.map((a) => {
              const checked = selectedIds.has(a.id);
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => toggle(a.id)}
                  className="flex items-center gap-3 w-full text-left px-3 py-2 rounded-xl hover:bg-muted/30 transition-colors"
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
                  <DynamicIcon iconKey={a.iconKey} className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-[13px]">{a.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
      {dirty && (
        <div className="pt-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-bubble btn-primary-bubble px-5 py-2.5 text-[13px] disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            {saving ? "Zapisywanie..." : `Zapisz udogodnienia (${selectedIds.size})`}
          </button>
        </div>
      )}
    </div>
  );
}

// ── End B3 inline editor ─────────────────────────────

const statusConfig: Record<string, { label: string; color: string; dot: string }> = {
  ACTIVE: { label: "Aktywny", color: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400", dot: "bg-emerald-500" },
  INACTIVE: { label: "Nieaktywny", color: "bg-muted text-muted-foreground", dot: "bg-gray-400" },
  MAINTENANCE: { label: "W remoncie", color: "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400", dot: "bg-amber-500" },
  SEASONAL: { label: "Sezonowy", color: "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400", dot: "bg-blue-500" },
};

const catIcons: Record<string, React.ReactNode> = {
  domki: <Home className="h-4 w-4" />, pokoje: <Building2 className="h-4 w-4" />, sale: <Building2 className="h-4 w-4" />,
  restauracja: <UtensilsCrossed className="h-4 w-4" />, "sprzet-wodny": <Ship className="h-4 w-4" />,
  "sprzet-ladowy": <Bike className="h-4 w-4" />, atrakcje: <Sparkles className="h-4 w-4" />, uslugi: <ConciergeBell className="h-4 w-4" />,
};

function getIcon(slug: string) {
  return catIcons[slug] || <Package className="h-4 w-4" />;
}

export function ResourcesList() {
  const { error: showError } = useToast();
  const [resources, setResources] = useState<Resource[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelMode, setPanelMode] = useState<"create" | "view">("create");
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "", categoryId: "",
  });
  const [showVarForm, setShowVarForm] = useState(false);
  const [editingVariant, setEditingVariant] = useState<Variant | null>(null);
  const [varForm, setVarForm] = useState({ name: "", capacity: "", basePrice: "", isDefault: false });
  const [savingVar, setSavingVar] = useState(false);

  // Drag & drop sorting
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [savingSort, setSavingSort] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [d1, d2] = await Promise.all([
        apiFetch("/api/resources"),
        apiFetch("/api/resource-categories"),
      ]);
      setResources(d1.resources || []);
      setCategories(d2.categories || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  function openCreate() {
    setFormData({ name: "", categoryId: categories[0]?.id || "" });
    setSelectedResource(null);
    setPanelMode("create");
    setPanelOpen(true);
  }

  async function openView(r: Resource) {
    setSelectedResource(r);
    setPanelMode("view");
    setPanelOpen(true);
    try {
      const d = await apiFetch("/api/resources/" + r.id);
      setSelectedResource(d.resource);
    } catch (e) { console.error("Failed to load resource detail:", e); }
  }

  async function handleSave() {
    setSaving(true);
    try {
      await apiFetch("/api/resources", { method: "POST", body: formData });
      await loadData(); setPanelOpen(false);
    } catch (e) { console.error(e); }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Czy na pewno chcesz usunąć ten zasób?")) return;
    try {
      await apiFetch("/api/resources/" + id, { method: "DELETE" });
      await loadData();
      if (selectedResource?.id === id) setPanelOpen(false);
    } catch (e: any) { showError(e.message || "Błąd usuwania zasobu"); }
  }

  function openVarCreate() {
    setEditingVariant(null);
    setVarForm({ name: "", capacity: "", basePrice: "", isDefault: false });
    setShowVarForm(true);
  }

  function openVarEdit(v: Variant) {
    setEditingVariant(v);
    setVarForm({
      name: v.name,
      capacity: v.capacity.toString(),
      basePrice: v.basePriceMinor ? fromMinor(v.basePriceMinor).toString() : v.basePrice ? Number(v.basePrice).toString() : "",
      isDefault: v.isDefault,
    });
    setShowVarForm(true);
  }

  async function handleSaveVariant() {
    if (!selectedResource) return;
    setSavingVar(true);
    try {
      const isEdit = editingVariant !== null;
      const url = isEdit
        ? "/api/resources/" + selectedResource.id + "/variants/" + editingVariant!.id
        : "/api/resources/" + selectedResource.id + "/variants";
      const method = isEdit ? "PUT" : "POST";
      await apiFetch(url, { method, body: { ...varForm, basePrice: varForm.basePrice ? parseMoneyToMinor(varForm.basePrice) : null } });
      await loadData();
      const d = await apiFetch("/api/resources/" + selectedResource.id);
      setSelectedResource(d.resource);
      setShowVarForm(false);
      setEditingVariant(null);
      setVarForm({ name: "", capacity: "", basePrice: "", isDefault: false });
    } catch (e) { console.error(e); }
    setSavingVar(false);
  }

  async function handleDeleteVariant(vid: string) {
    if (!selectedResource) return;
    if (!confirm("Usunąć wariant?")) return;
    try {
      await apiFetch("/api/resources/" + selectedResource.id + "/variants/" + vid, { method: "DELETE" });
      const d = await apiFetch("/api/resources/" + selectedResource.id);
      setSelectedResource(d.resource);
      await loadData();
    } catch (e: any) { showError(e.message || "Błąd usuwania wariantu"); }
  }

  // ── Drag & drop sorting (always-on, grip handle only) ──

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverId(null);
  };

  const handleDrop = async (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) {
      handleDragEnd();
      return;
    }

    // Reorder in the current filtered list
    const list = [...filtered];
    const fromIdx = list.findIndex(r => r.id === draggedId);
    const toIdx = list.findIndex(r => r.id === targetId);
    if (fromIdx === -1 || toIdx === -1) { handleDragEnd(); return; }

    const [moved] = list.splice(fromIdx, 1);
    list.splice(toIdx, 0, moved);

    // Optimistic update — update local state immediately
    const order = list.map((r, i) => ({ id: r.id, sortOrder: i }));
    setResources(prev => {
      const updated = [...prev];
      for (const o of order) {
        const idx = updated.findIndex(r => r.id === o.id);
        if (idx !== -1) updated[idx] = { ...updated[idx], sortOrder: o.sortOrder };
      }
      return updated.sort((a, b) => {
        if (a.categoryId !== b.categoryId) return 0;
        return a.sortOrder - b.sortOrder;
      });
    });

    handleDragEnd();

    // Save to backend
    setSavingSort(true);
    try {
      await apiFetch("/api/resources/reorder", { method: "PATCH", body: { order } });
    } catch (e: any) {
      showError(e.message || "Błąd zapisywania kolejności");
      await loadData(); // Revert on error
    }
    setSavingSort(false);
  };

  const filtered = resources.filter((r) => {
    if (activeCategory !== "all" && r.categoryId !== activeCategory) return false;
    if (search) {
      const s = search.toLowerCase();
      return r.name.toLowerCase().includes(s) || r.longDescription?.toLowerCase().includes(s) || r.category.name.toLowerCase().includes(s);
    }
    return true;
  });

  if (loading) {
    return <ResourcesSkeleton />;
  }

  const categoryOptions = [
    { value: "", label: "Wybierz..." },
    ...categories.map((c) => ({ value: c.id, label: c.name })),
  ];
  const statusOptions = [
    { value: "ACTIVE", label: "Aktywny" },
    { value: "INACTIVE", label: "Nieaktywny" },
    { value: "MAINTENANCE", label: "W remoncie" },
    { value: "SEASONAL", label: "Sezonowy" },
  ];

  return (
    <div className="space-y-6 fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Zasoby</h2>
          <p className="text-[13px] text-muted-foreground mt-1">
            {resources.length} {" zasobów w "} {categories.length} {" kategoriach"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={openCreate} className="btn-bubble btn-primary-bubble px-5 py-2.5 text-[13px]">
            <Plus className="h-4 w-4" /> Dodaj zasób
          </button>
        </div>
      </div>

      {categories.length > 0 && (
        <div className="overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0"><div className="tabs-bubble inline-flex min-w-max">
          <button
            onClick={() => setActiveCategory("all")}
            className={cn("tab-bubble", activeCategory === "all" && "tab-bubble-active")}
          >
            Wszystkie{" "}
            <span className={cn("count-bubble", activeCategory === "all" && "count-bubble-active")}>
              {resources.length}
            </span>
          </button>
          {categories
            .filter((c) => (c._count?.resources || 0) > 0 || activeCategory === c.id)
            .map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={cn("tab-bubble", activeCategory === cat.id && "tab-bubble-active")}
              >
                {getIcon(cat.slug)} {cat.name}{" "}
                <span className={cn("count-bubble", activeCategory === cat.id && "count-bubble-active")}>
                  {cat._count?.resources || 0}
                </span>
              </button>
            ))}
        </div></div>
      )}

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Szukaj zasobów..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-bubble input-bubble-search h-11 w-full"
            style={search ? { paddingRight: 36 } : undefined}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-muted-foreground/20 hover:text-foreground transition-all"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bubble text-center py-16">
          <Package className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-[14px] font-medium text-muted-foreground">
            {search ? "Brak wyników" : "Brak zasobów"}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 stagger">
          {filtered.map((resource) => {
            const st = statusConfig[resource.status] || statusConfig.ACTIVE;
            const isDragging = draggedId === resource.id;
            const isDragOver = dragOverId === resource.id;
            return (
              <div
                key={resource.id}
                data-resource-card={resource.id}
                onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; if (draggedId && draggedId !== resource.id) setDragOverId(resource.id); }}
                onDrop={(e) => handleDrop(e, resource.id)}
                onDragEnd={handleDragEnd}
                className={cn(
                  "bubble-interactive p-5 group transition-all",
                  isDragOver && "ring-2 ring-primary ring-offset-2",
                )}
                onClick={() => openView(resource)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {/* Drag handle — always visible, only draggable element */}
                    {/* Drag handle */}
                    <div
                      draggable
                      onDragStart={(e) => {
                        e.stopPropagation();
                        const card = e.currentTarget.closest("[data-resource-card]") as HTMLElement | null;
                        if (card) e.dataTransfer.setDragImage(card, 20, 20);
                        e.dataTransfer.effectAllowed = "move";
                        setDraggedId(resource.id);
                      }}
                      onDragEnd={handleDragEnd}
                      onClick={(e) => e.stopPropagation()}
                      className="cursor-grab active:cursor-grabbing text-muted-foreground/30 hover:text-muted-foreground shrink-0 p-0.5 -m-0.5"
                    >
                      <GripVertical className="h-4 w-4" />
                    </div>
                    <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                      {getIcon(resource.category.slug)}
                    </div>
                    <div>
                      <h3 className="text-[14px] font-semibold leading-tight flex items-center gap-1.5">
                        {resource.unitNumber && (
                          <UnitBadge number={resource.unitNumber} />
                        )}
                        {resource.name}
                      </h3>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {resource.category.name}
                      </p>
                    </div>
                  </div>
                  <div
                    className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Tooltip content="Edytuj">
                    <button
                      onClick={() => openView(resource)}
                      className="h-8 w-8 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    </Tooltip>
                    <Tooltip content="Usuń">
                    <button
                      onClick={() => handleDelete(resource.id)}
                      className="h-8 w-8 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                    </Tooltip>
                  </div>
                </div>
                {resource.longDescription && (
                  <p className="text-[12px] text-muted-foreground line-clamp-2 mb-3">
                    {resource.longDescription}
                  </p>
                )}
                <div className="flex items-center gap-3 flex-wrap">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold",
                      st.color
                    )}
                  >
                    <span className={cn("h-1.5 w-1.5 rounded-full", st.dot)} />
                    {st.label}
                  </span>
                  {resource.maxCapacity && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Users className="h-3 w-3" /> {resource.maxCapacity} os.
                    </span>
                  )}
                  {resource.totalUnits > 1 && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Hash className="h-3 w-3" /> {resource.totalUnits} szt.
                    </span>
                  )}
                  {(resource._count?.variants || 0) > 0 && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Layers className="h-3 w-3" /> {resource._count?.variants} war.
                    </span>
                  )}
                  {resource.location && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                      <MapPin className="h-3 w-3" /> {resource.location}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <SlidePanel
        open={panelOpen}
        onClose={() => {
          setPanelOpen(false);
          setShowVarForm(false);
          setEditingVariant(null);
        }}
        width={panelMode === "view" ? 620 : 480}
        title={
          panelMode === "create"
            ? "Nowy zasób"
            : "Właściwości zasobu"
        }
      >
        {panelMode === "view" && selectedResource ? (
          <div className="space-y-4">
            {/* Hero — title, badges, full-width stats grid */}
            <div className="pb-4">
              {/* Title row */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h2 className="text-xl font-bold tracking-tight">{selectedResource.name}</h2>
                  {selectedResource.unitNumber && (
                    <UnitBadge number={selectedResource.unitNumber} size="md" />
                  )}
                </div>
                <Tooltip content="Usuń zasób">
                <button
                  onClick={() => handleDelete(selectedResource.id)}
                  className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all shrink-0 mt-1"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
                </Tooltip>
              </div>

              {/* Status badges */}
              <div className="flex items-center gap-2 flex-wrap mb-5">
                <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold", statusConfig[selectedResource.status]?.color)}>
                  <span className={cn("h-1.5 w-1.5 rounded-full", statusConfig[selectedResource.status]?.dot)} />
                  {statusConfig[selectedResource.status]?.label}
                </span>
                {selectedResource.visibleInWidget ? (
                  <span className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold bg-primary/10 text-primary">
                    Widoczny w widgecie
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold bg-destructive/10 text-destructive">
                    Niewidoczny w widgecie
                  </span>
                )}
              </div>

              {/* Stats 2×2 grid — full width, inline number + label */}
              <div className="grid grid-cols-2 gap-3">
                {selectedResource.maxCapacity && (
                  <div className="rounded-xl bg-muted/40 px-4 py-3.5 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-background flex items-center justify-center shrink-0">
                      <Users className="h-4 w-4 text-primary" />
                    </div>
                    <p className="flex items-baseline gap-1.5">
                      <span className="text-[18px] font-bold">{selectedResource.maxCapacity}</span>
                      <span className="text-[12px] text-muted-foreground">osób</span>
                    </p>
                  </div>
                )}
                {selectedResource.areaSqm && (
                  <div className="rounded-xl bg-muted/40 px-4 py-3.5 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-background flex items-center justify-center shrink-0">
                      <Maximize2 className="h-4 w-4 text-primary" />
                    </div>
                    <p className="flex items-baseline gap-1.5">
                      <span className="text-[18px] font-bold">{selectedResource.areaSqm}</span>
                      <span className="text-[12px] text-muted-foreground">m²</span>
                    </p>
                  </div>
                )}
                {selectedResource.bedroomCount != null && selectedResource.bedroomCount > 0 && (
                  <div className="rounded-xl bg-muted/40 px-4 py-3.5 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-background flex items-center justify-center shrink-0">
                      <DoorOpen className="h-4 w-4 text-primary" />
                    </div>
                    <p className="flex items-baseline gap-1.5">
                      <span className="text-[18px] font-bold">{selectedResource.bedroomCount}</span>
                      <span className="text-[12px] text-muted-foreground">{selectedResource.bedroomCount === 1 ? "sypialnia" : selectedResource.bedroomCount < 5 ? "sypialnie" : "sypialni"}</span>
                    </p>
                  </div>
                )}
                {selectedResource.bathroomCount != null && selectedResource.bathroomCount > 0 && (
                  <div className="rounded-xl bg-muted/40 px-4 py-3.5 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-background flex items-center justify-center shrink-0">
                      <Bath className="h-4 w-4 text-primary" />
                    </div>
                    <p className="flex items-baseline gap-1.5">
                      <span className="text-[18px] font-bold">{selectedResource.bathroomCount}</span>
                      <span className="text-[12px] text-muted-foreground">{selectedResource.bathroomCount === 1 ? "łazienka" : selectedResource.bathroomCount < 5 ? "łazienki" : "łazienek"}</span>
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* SectionCard: Ustawienia zasobu */}
            <SectionCard
              title="Ustawienia zasobu"
              description="Nazwa, kategoria, status, widoczność w widgecie."
              icon={Settings}
              defaultOpen={false}
            >
              <ResourceSettingsEditor
                resource={selectedResource}
                categories={categories}
                onSave={async (data) => {
                  try {
                    const res = await apiFetch("/api/resources/" + selectedResource.id, { method: "PATCH", body: data });
                    setSelectedResource(res.resource);
                    await loadData();
                    return true;
                  } catch (e: any) { showError(e.message || "Błąd zapisu"); return false; }
                }}
              />
            </SectionCard>

            {/* B2: Content & Technical data */}
            <SectionCard
              title="Treści"
              description="Opisy zasobu. Krótki opis na kartach, pełny na stronie szczegółów."
              icon={FileText}
              defaultOpen={false}
            >
              <ResourceContentEditor
                resource={selectedResource}
                onSave={async (data) => {
                  try {
                    const res = await apiFetch("/api/resources/" + selectedResource.id, { method: "PATCH", body: data });
                    setSelectedResource(res.resource);
                    return true;
                  } catch (e: any) { showError(e.message || "Błąd zapisu"); return false; }
                }}
              />
            </SectionCard>

            <SectionCard
              title="Dane techniczne"
              description="Metraż, sypialnie, łazienki i pojemność zasobu."
              icon={Ruler}
              defaultOpen={false}
            >
              <ResourceTechnicalEditor
                resource={selectedResource}
                onSave={async (data) => {
                  try {
                    const res = await apiFetch("/api/resources/" + selectedResource.id, { method: "PATCH", body: data });
                    setSelectedResource(res.resource);
                    return true;
                  } catch (e: any) { showError(e.message || "Błąd zapisu"); return false; }
                }}
              />
            </SectionCard>

            <SectionCard
              title="Łóżka"
              description="Konfiguracja łóżek i miejsc sypialnych w zasobie."
              icon={BedDouble}
              defaultOpen={false}
            >
              <ResourceBedsEditor
                resourceId={selectedResource.id}
                beds={selectedResource.beds || []}
                onBedsChange={(newBeds) => {
                  setSelectedResource({ ...selectedResource, beds: newBeds });
                }}
              />
            </SectionCard>

            {/* B1: Image management */}
            <SectionCard
              title="Zdjęcia"
              description="Galeria zdjęć zasobu. Pierwsze zdjęcie jest okładką."
              icon={ImageIcon}
              defaultOpen={false}
            >
              <ImageUpload
                resourceId={selectedResource.id}
                images={selectedResource.images || []}
                onImagesChange={(newImages) => {
                  setSelectedResource({
                    ...selectedResource,
                    images: newImages,
                    _count: {
                      ...selectedResource._count,
                      variants: selectedResource._count?.variants || 0,
                      images: newImages.length,
                    },
                  });
                }}
              />
            </SectionCard>

            <SectionCard
              title="Warianty sprzedażowe"
              description="Opcje cenowe i konfiguracje pojemności zasobu."
              icon={Layers}
              defaultOpen={false}
            >
              <div>

              {showVarForm && (
                <div className="bubble p-4 mb-3 space-y-3">
                  <p className="text-[12px] font-semibold text-muted-foreground">
                    {editingVariant ? "Edytuj wariant" : "Nowy wariant"}
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-muted-foreground">Nazwa *</label>
                      <input
                        type="text"
                        placeholder="np. 4-osobowy"
                        value={varForm.name}
                        onChange={(e) => setVarForm({ ...varForm, name: e.target.value })}
                        className="input-bubble h-9 mt-1 text-[13px]"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-muted-foreground">{"Pojemność"}</label>
                      <input
                        type="number"
                        placeholder="4"
                        value={varForm.capacity}
                        onChange={(e) => setVarForm({ ...varForm, capacity: e.target.value })}
                        className="input-bubble h-9 mt-1 text-[13px]"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-muted-foreground">Cena bazowa (PLN)</label>
                      <input
                        type="number"
                        placeholder="350"
                        value={varForm.basePrice}
                        onChange={(e) => setVarForm({ ...varForm, basePrice: e.target.value })}
                        className="input-bubble h-9 mt-1 text-[13px]"
                      />
                    </div>
                    <div className="flex items-end pb-1">
                      <button
                        type="button"
                        onClick={() => setVarForm({ ...varForm, isDefault: !varForm.isDefault })}
                        className="flex items-center gap-2.5"
                      >
                        <div
                          className={cn(
                            "relative w-10 h-[22px] rounded-full transition-colors duration-200",
                            varForm.isDefault ? "bg-primary" : "bg-muted-foreground/20"
                          )}
                        >
                          <div
                            className={cn(
                              "absolute top-[2px] left-[2px] w-[18px] h-[18px] rounded-full bg-white shadow-sm transition-transform duration-200",
                              varForm.isDefault && "translate-x-[18px]"
                            )}
                          />
                        </div>
                        <span className="text-[12px] font-medium">{"Domyślny"}</span>
                      </button>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveVariant}
                      disabled={savingVar || !varForm.name}
                      className="btn-bubble btn-primary-bubble px-4 py-2 text-[12px] disabled:opacity-50"
                    >
                      {savingVar ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Check className="h-3.5 w-3.5" />
                      )}{" "}
                      {editingVariant ? "Zapisz" : "Dodaj"}
                    </button>
                    <button
                      onClick={() => {
                        setShowVarForm(false);
                        setEditingVariant(null);
                      }}
                      className="btn-bubble btn-secondary-bubble px-4 py-2 text-[12px]"
                    >
                      Anuluj
                    </button>
                  </div>
                </div>
              )}

              {selectedResource.variants.length === 0 ? (
                <div className="bubble p-6 text-center">
                  <Layers className="h-6 w-6 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-[12px] text-muted-foreground">{"Brak wariantów"}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedResource.variants.filter((v) => editingVariant?.id !== v.id).map((v) => (
                    <div key={v.id} className="bubble p-4 flex items-center justify-between group/v">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-semibold">{v.name}</span>
                          {v.isDefault && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                              {"DOMYŚLNY"}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <Users className="h-3 w-3" /> {v.capacity} os.
                          </span>
                          {v.basePrice && (
                            <span className="text-[11px] font-semibold text-primary">
                              {(v as any).basePriceMinor ? fromMinor((v as any).basePriceMinor).toFixed(0) : Number(v.basePrice).toFixed(0)} PLN/noc
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover/v:opacity-100 transition-opacity">
                        <Tooltip content="Edytuj wariant">
                        <button
                          onClick={() => openVarEdit(v)}
                          className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                        </Tooltip>
                        <Tooltip content="Usuń wariant">
                        <button
                          onClick={() => handleDeleteVariant(v.id)}
                          className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                        </Tooltip>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {/* Dodaj wariant — inside content, not on header */}
              {!showVarForm && (
                <div className="pt-3">
                  <button
                    onClick={openVarCreate}
                    className="btn-bubble btn-secondary-bubble px-5 py-2.5 text-[13px]"
                  >
                    <Plus className="h-4 w-4" /> Dodaj wariant
                  </button>
                </div>
              )}
            </div>
            </SectionCard>

            {/* B3: Amenities management */}
            <SectionCard
              title="Udogodnienia"
              description="Przypisz udogodnienia do zasobu."
              icon={Sparkles}
              defaultOpen={false}
            >
              <ResourceAmenitiesEditor
                resourceId={selectedResource.id}
                currentAmenities={selectedResource.amenities || []}
                onAmenitiesChange={(newAmenities) => {
                  setSelectedResource({
                    ...selectedResource,
                    amenities: newAmenities,
                  });
                }}
              />
            </SectionCard>
          </div>
        ) : panelMode === "create" ? (
          <div className="space-y-5">
            <div>
              <label className="text-[12px] font-semibold text-muted-foreground">Nazwa *</label>
              <input
                type="text"
                placeholder="np. Domek Hobbita #1"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input-bubble h-11 mt-1.5"
                autoFocus
              />
            </div>
            <BubbleSelect
              label="Kategoria *"
              options={categoryOptions}
              value={formData.categoryId}
              onChange={(v) => setFormData({ ...formData, categoryId: v })}
            />
            <div className="flex gap-2 pt-2">
              <button
                onClick={handleSave}
                disabled={saving || !formData.name || !formData.categoryId}
                className="btn-bubble btn-primary-bubble px-5 py-2.5 text-[13px] flex-1 disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Dodaj
              </button>
              <button
                onClick={() => setPanelOpen(false)}
                className="btn-bubble btn-secondary-bubble px-5 py-2.5 text-[13px]"
              >
                Anuluj
              </button>
            </div>
          </div>
        ) : null}
      </SlidePanel>
    </div>
  );
}
