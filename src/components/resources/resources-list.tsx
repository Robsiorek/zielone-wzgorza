"use client";
import React, { useEffect, useState, useCallback } from "react";
import { Plus, Pencil, Trash2, Check, Home, Building2, UtensilsCrossed, Ship, Sparkles, Users, Loader2, Search, Layers, MapPin, Hash, Bike, ConciergeBell, Package, X, GripVertical, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api-fetch";
import { SlidePanel } from "@/components/ui/slide-panel";
import { ResourcesSkeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { BubbleSelect } from "@/components/ui/bubble-select";
import { UnitBadge } from "@/components/ui/unit-badge";
import { parseMoneyToMinor, fromMinor } from "@/lib/format";

interface Category { id: string; name: string; slug: string; unitNumber: string | null; type: string; icon: string | null; description: string | null; _count?: { resources: number }; }
interface Variant { id: string; name: string; description: string | null; capacity: number; basePrice: number | null; basePriceMinor?: number | null; isDefault: boolean; isActive: boolean; }
interface Resource { id: string; name: string; slug: string; unitNumber: string | null; categoryId: string; description: string | null; maxCapacity: number | null; totalUnits: number; location: string | null; status: string; sortOrder: number; visibleInWidget: boolean; category: Category; variants: Variant[]; _count?: { variants: number; images: number }; }

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
  const [panelMode, setPanelMode] = useState<"create" | "edit" | "view">("create");
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "", categoryId: "", description: "", maxCapacity: "", totalUnits: "1", location: "", status: "ACTIVE", unitNumber: "", visibleInWidget: false,
  });
  const [showVarForm, setShowVarForm] = useState(false);
  const [editingVariant, setEditingVariant] = useState<Variant | null>(null);
  const [varForm, setVarForm] = useState({ name: "", capacity: "", basePrice: "", isDefault: false });
  const [savingVar, setSavingVar] = useState(false);

  // Drag & drop sorting
  const [sortMode, setSortMode] = useState(false);
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
    setFormData({ name: "", categoryId: categories[0]?.id || "", description: "", maxCapacity: "", totalUnits: "1", location: "", status: "ACTIVE", unitNumber: "", visibleInWidget: false });
    setSelectedResource(null);
    setPanelMode("create");
    setPanelOpen(true);
  }

  function openEdit(r: Resource) {
    setFormData({
      name: r.name, categoryId: r.categoryId, description: r.description || "", unitNumber: r.unitNumber || "",
      maxCapacity: r.maxCapacity?.toString() || "", totalUnits: r.totalUnits.toString(),
      location: r.location || "", status: r.status, visibleInWidget: r.visibleInWidget ?? false,
    });
    setSelectedResource(r);
    setPanelMode("edit");
    setPanelOpen(true);
  }

  function openView(r: Resource) {
    setSelectedResource(r);
    setPanelMode("view");
    setPanelOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const url = panelMode === "edit" && selectedResource
        ? "/api/resources/" + selectedResource.id
        : "/api/resources";
      const method = panelMode === "edit" ? "PUT" : "POST";
      await apiFetch(url, { method, body: formData });
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

  // ── Drag & drop sorting ──
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = "move";
    // Make the drag image slightly transparent
    if (e.currentTarget instanceof HTMLElement) {
      e.dataTransfer.setDragImage(e.currentTarget, 20, 20);
    }
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (draggedId && draggedId !== id) {
      setDragOverId(id);
    }
  };

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
      return r.name.toLowerCase().includes(s) || r.description?.toLowerCase().includes(s) || r.category.name.toLowerCase().includes(s);
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
            {resources.length} {" zasob\u00f3w w "} {categories.length} {" kategoriach"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSortMode(!sortMode)}
            className={cn(
              "btn-bubble px-5 py-2.5 text-[13px] flex items-center gap-1.5 transition-all",
              sortMode
                ? "btn-primary-bubble"
                : "btn-secondary-bubble"
            )}
          >
            <ArrowUpDown className="h-4 w-4" />
            {sortMode ? "Zapisuję kolejność" : "Sortuj"}
            {savingSort && <Loader2 className="h-3.5 w-3.5 animate-spin ml-1" />}
          </button>
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
                draggable={sortMode}
                onDragStart={sortMode ? (e) => handleDragStart(e, resource.id) : undefined}
                onDragOver={sortMode ? (e) => handleDragOver(e, resource.id) : undefined}
                onDrop={sortMode ? (e) => handleDrop(e, resource.id) : undefined}
                onDragEnd={sortMode ? handleDragEnd : undefined}
                className={cn(
                  "bubble-interactive p-5 group transition-all",
                  sortMode && "cursor-grab active:cursor-grabbing",
                  isDragging && "opacity-30 scale-95",
                  isDragOver && "ring-2 ring-primary ring-offset-2",
                )}
                onClick={sortMode ? undefined : () => openView(resource)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {sortMode && (
                      <div className="text-muted-foreground/40 shrink-0">
                        <GripVertical className="h-5 w-5" />
                      </div>
                    )}
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
                    <button
                      onClick={() => openEdit(resource)}
                      className="h-8 w-8 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(resource.id)}
                      className="h-8 w-8 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                {resource.description && (
                  <p className="text-[12px] text-muted-foreground line-clamp-2 mb-3">
                    {resource.description}
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
        title={
          panelMode === "create"
            ? "Nowy zas\u00f3b"
            : panelMode === "edit"
            ? "Edytuj zas\u00f3b"
            : selectedResource?.name || "Zas\u00f3b"
        }
      >
        {panelMode === "view" && selectedResource ? (
          <div className="space-y-6">
            <div className="flex gap-2">
              <button
                onClick={() => openEdit(selectedResource)}
                className="btn-bubble btn-secondary-bubble px-4 py-2 text-[13px] flex-1"
              >
                <Pencil className="h-3.5 w-3.5" /> Edytuj
              </button>
              <button
                onClick={() => handleDelete(selectedResource.id)}
                className="btn-bubble btn-danger-bubble px-4 py-2 text-[13px]"
              >
                <Trash2 className="h-3.5 w-3.5" /> {"Usu\u0144"}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bubble p-4">
                <p className="text-[11px] font-medium text-muted-foreground mb-1">Kategoria</p>
                <div className="flex items-center gap-2">
                  {getIcon(selectedResource.category.slug)}
                  <span className="text-[13px] font-semibold">{selectedResource.category.name}</span>
                </div>
              </div>
              <div className="bubble p-4">
                <p className="text-[11px] font-medium text-muted-foreground mb-1">Status</p>
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold",
                    statusConfig[selectedResource.status]?.color
                  )}
                >
                  <span className={cn("h-1.5 w-1.5 rounded-full", statusConfig[selectedResource.status]?.dot)} />
                  {statusConfig[selectedResource.status]?.label}
                </span>
              </div>
              {selectedResource.maxCapacity && (
                <div className="bubble p-4">
                  <p className="text-[11px] font-medium text-muted-foreground mb-1">{"\u0050ojemno\u015b\u0107"}</p>
                  <p className="text-[13px] font-semibold">{selectedResource.maxCapacity} {" os\u00f3b"}</p>
                </div>
              )}
              {selectedResource.unitNumber && (
                <div className="bubble p-4">
                  <p className="text-[11px] font-medium text-muted-foreground mb-1">Numer</p>
                  <UnitBadge number={selectedResource.unitNumber} />
                </div>
              )}
              {selectedResource.totalUnits > 1 && (
                <div className="bubble p-4">
                  <p className="text-[11px] font-medium text-muted-foreground mb-1">Sztuk</p>
                  <p className="text-[13px] font-semibold">{selectedResource.totalUnits}</p>
                </div>
              )}
            </div>

            {selectedResource.description && (
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground mb-1.5">Opis</p>
                <p className="text-[13px] text-muted-foreground leading-relaxed">
                  {selectedResource.description}
                </p>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-[13px] font-semibold flex items-center gap-2">
                  <Layers className="h-4 w-4 text-primary" /> {"Warianty sprzeda\u017cowe"}
                </h4>
                <button
                  onClick={openVarCreate}
                  className="text-[12px] text-primary font-semibold hover:underline inline-flex items-center gap-1"
                >
                  <Plus className="h-3 w-3" /> Dodaj
                </button>
              </div>

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
                      <label className="text-[11px] font-semibold text-muted-foreground">{"\u0050ojemno\u015b\u0107"}</label>
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
                        <span className="text-[12px] font-medium">{"\u0044omy\u015blny"}</span>
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
                  <p className="text-[12px] text-muted-foreground">{"Brak wariant\u00f3w"}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedResource.variants.map((v) => (
                    <div key={v.id} className="bubble p-4 flex items-center justify-between group/v">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-semibold">{v.name}</span>
                          {v.isDefault && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                              {"\u0044OMY\u015aLNY"}
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
                        <button
                          onClick={() => openVarEdit(v)}
                          className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => handleDeleteVariant(v.id)}
                          className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[12px] font-semibold text-muted-foreground">{"\u0050ojemno\u015b\u0107"}</label>
                <input
                  type="number"
                  placeholder="6"
                  value={formData.maxCapacity}
                  onChange={(e) => setFormData({ ...formData, maxCapacity: e.target.value })}
                  className="input-bubble h-11 mt-1.5"
                />
              </div>
              <div>
                <label className="text-[12px] font-semibold text-muted-foreground">Sztuk</label>
                <input
                  type="number"
                  placeholder="1"
                  value={formData.totalUnits}
                  onChange={(e) => setFormData({ ...formData, totalUnits: e.target.value })}
                  className="input-bubble h-11 mt-1.5"
                />
              </div>
            </div>
            <div>
              <label className="text-[12px] font-semibold text-muted-foreground">Numer (domku/pokoju)</label>
              <input
                type="text"
                placeholder="np. 1, 101, A3"
                value={formData.unitNumber}
                onChange={(e) => setFormData({ ...formData, unitNumber: e.target.value })}
                className="input-bubble h-11 mt-1.5"
              />
            </div>
            <div>
              <label className="text-[12px] font-semibold text-muted-foreground">Lokalizacja</label>
              <input
                type="text"
                placeholder="np. Nad jeziorem"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="input-bubble h-11 mt-1.5"
              />
            </div>
            <BubbleSelect
              label="Status"
              options={statusOptions}
              value={formData.status}
              onChange={(v) => setFormData({ ...formData, status: v })}
            />
            <div>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, visibleInWidget: !formData.visibleInWidget })}
                className="flex items-center gap-3 w-full text-left"
              >
                <span className={cn(
                  "relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0",
                  formData.visibleInWidget ? "bg-primary" : "bg-muted-foreground/20"
                )}>
                  <span className={cn(
                    "inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform",
                    formData.visibleInWidget ? "translate-x-6" : "translate-x-1"
                  )} />
                </span>
                <span className="text-[12px] text-muted-foreground">Widoczny w widgecie rezerwacyjnym</span>
              </button>
            </div>
            <div>
              <label className="text-[12px] font-semibold text-muted-foreground">Opis</label>
              <textarea
                rows={3}
                placeholder="Opis zasobu..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input-bubble mt-1.5 py-3 resize-none"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={handleSave}
                disabled={saving || !formData.name || !formData.categoryId}
                className="btn-bubble btn-primary-bubble px-5 py-2.5 text-[13px] flex-1 disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}{" "}
                {panelMode === "edit" ? "Zapisz" : "Dodaj"}
              </button>
              <button
                onClick={() => setPanelOpen(false)}
                className="btn-bubble btn-secondary-bubble px-5 py-2.5 text-[13px]"
              >
                Anuluj
              </button>
            </div>
          </div>
        )}
      </SlidePanel>
    </div>
  );
}
