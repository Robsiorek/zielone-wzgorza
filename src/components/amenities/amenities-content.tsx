"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Plus, Search, X, Loader2, Trash2,
  Check, Sparkles, FolderOpen, ChevronDown, ChevronRight,
  GripVertical, Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api-fetch";
import { useToast } from "@/components/ui/toast";
import { SlidePanel } from "@/components/ui/slide-panel";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { BubbleSelect } from "@/components/ui/bubble-select";
import { DynamicIcon } from "@/components/ui/dynamic-icon";
import { AmenitiesSkeleton } from "@/components/amenities/amenities-skeleton";
import {
  AMENITY_ICONS, AMENITY_ICON_KEYS, AMENITY_ICON_GROUPS,
  type AmenityIconDef,
} from "@/lib/amenity-icons";

// ── Types ──

interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  iconKey: string | null;
  position: number;
  isActive: boolean;
  _count: { amenities: number };
}

interface AmenityRow {
  id: string;
  name: string;
  slug: string;
  iconKey: string;
  position: number;
  isActive: boolean;
  categoryId?: string;
  category: { id: string; name: string; slug: string };
  _count: { resources: number };
}

// ── Component ──

export function AmenitiesContent() {
  const { success, error: toastError } = useToast();

  // ── State ──
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [amenities, setAmenities] = useState<AmenityRow[]>([]);
  const [tab, setTab] = useState<"amenities" | "categories">("amenities");

  // Filters
  const [search, setSearch] = useState("");
  const [filterCatId, setFilterCatId] = useState("");

  // Collapsible category sections (open by default)
  const [openSections, setOpenSections] = useState<Set<string>>(new Set());

  // Panels
  const [amenityPanelOpen, setAmenityPanelOpen] = useState(false);
  const [editingAmenity, setEditingAmenity] = useState<AmenityRow | null>(null);
  const [catPanelOpen, setCatPanelOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<CategoryRow | null>(null);

  // Forms
  const [amenityForm, setAmenityForm] = useState({ name: "", categoryId: "", iconKey: "" });
  const [catForm, setCatForm] = useState({ name: "", iconKey: "" });
  const [saving, setSaving] = useState(false);

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState<{ type: "amenity" | "category"; id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Icon picker
  const [iconSearch, setIconSearch] = useState("");

  // Drag & drop
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const searchRef = useRef<HTMLInputElement>(null);

  // ── Load data ──
  const loadData = useCallback(async () => {
    try {
      const [catData, amenData] = await Promise.all([
        apiFetch<{ categories: CategoryRow[] }>("/api/amenity-categories"),
        apiFetch<{ amenities: AmenityRow[] }>("/api/amenities"),
      ]);
      setCategories(catData.categories);
      setAmenities(amenData.amenities);
      // Open all sections by default on first load
      if (openSections.size === 0) {
        setOpenSections(new Set(catData.categories.map((c) => c.id)));
      }
    } catch (e: any) {
      toastError("Błąd", e.message);
    } finally {
      setLoading(false);
    }
  }, [toastError]);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Filtered amenities ──
  const filtered = amenities.filter((a) => {
    if (filterCatId && a.category.id !== filterCatId) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!a.name.toLowerCase().includes(q) && !a.category.name.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  // Group by category (preserve category order)
  const grouped: { category: { id: string; name: string }; items: AmenityRow[] }[] = [];
  const catOrder = categories.map((c) => c.id);
  const groupMap = new Map<string, AmenityRow[]>();
  for (const a of filtered) {
    if (!groupMap.has(a.category.id)) groupMap.set(a.category.id, []);
    groupMap.get(a.category.id)!.push(a);
  }
  for (const catId of catOrder) {
    if (groupMap.has(catId)) {
      const cat = categories.find((c) => c.id === catId)!;
      grouped.push({ category: { id: cat.id, name: cat.name }, items: groupMap.get(catId)! });
    }
  }

  // Toggle section
  const toggleSection = (catId: string) => {
    const next = new Set(openSections);
    if (next.has(catId)) next.delete(catId);
    else next.add(catId);
    setOpenSections(next);
  };

  // Category filter options
  const catOptions = [
    { value: "", label: "Wszystkie kategorie" },
    ...categories.map((c) => ({ value: c.id, label: c.name })),
  ];

  // ── AMENITY CRUD ──
  const openAmenityCreate = () => {
    setEditingAmenity(null);
    setAmenityForm({ name: "", categoryId: categories[0]?.id || "", iconKey: "sparkles" });
    setIconSearch("");
    setAmenityPanelOpen(true);
  };

  const openAmenityEdit = (a: AmenityRow) => {
    setEditingAmenity(a);
    setAmenityForm({ name: a.name, categoryId: a.category.id, iconKey: a.iconKey });
    setIconSearch("");
    setAmenityPanelOpen(true);
  };

  const handleSaveAmenity = async () => {
    if (!amenityForm.name.trim() || !amenityForm.categoryId || !amenityForm.iconKey) return;
    setSaving(true);
    try {
      if (editingAmenity) {
        await apiFetch(`/api/amenities/${editingAmenity.id}`, {
          method: "PATCH",
          body: { name: amenityForm.name, categoryId: amenityForm.categoryId, iconKey: amenityForm.iconKey },
        });
        success("Zapisano udogodnienie");
      } else {
        await apiFetch("/api/amenities", {
          method: "POST",
          body: { name: amenityForm.name, categoryId: amenityForm.categoryId, iconKey: amenityForm.iconKey },
        });
        success("Dodano udogodnienie");
      }
      setAmenityPanelOpen(false);
      loadData();
    } catch (e: any) {
      toastError("Błąd", e.message);
    } finally {
      setSaving(false);
    }
  };

  // ── CATEGORY CRUD ──
  const openCatCreate = () => {
    setEditingCat(null);
    setCatForm({ name: "", iconKey: "" });
    setIconSearch("");
    setCatPanelOpen(true);
  };

  const openCatEdit = (c: CategoryRow) => {
    setEditingCat(c);
    setCatForm({ name: c.name, iconKey: c.iconKey || "" });
    setIconSearch("");
    setCatPanelOpen(true);
  };

  const handleSaveCat = async () => {
    if (!catForm.name.trim()) return;
    setSaving(true);
    try {
      if (editingCat) {
        await apiFetch(`/api/amenity-categories/${editingCat.id}`, {
          method: "PATCH",
          body: { name: catForm.name, iconKey: catForm.iconKey || null },
        });
        success("Zapisano kategorię");
      } else {
        await apiFetch("/api/amenity-categories", {
          method: "POST",
          body: { name: catForm.name, iconKey: catForm.iconKey || null },
        });
        success("Dodano kategorię");
      }
      setCatPanelOpen(false);
      loadData();
    } catch (e: any) {
      toastError("Błąd", e.message);
    } finally {
      setSaving(false);
    }
  };

  // ── DELETE ──
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const url = deleteTarget.type === "amenity"
        ? `/api/amenities/${deleteTarget.id}`
        : `/api/amenity-categories/${deleteTarget.id}`;
      await apiFetch(url, { method: "DELETE" });
      success(`Usunięto: ${deleteTarget.name}`);
      setDeleteTarget(null);
      loadData();
    } catch (e: any) {
      toastError("Błąd", e.message);
    } finally {
      setDeleting(false);
    }
  };

  // ── Toggle active ──
  const toggleAmenityActive = async (e: React.MouseEvent, a: AmenityRow) => {
    e.stopPropagation();
    try {
      await apiFetch(`/api/amenities/${a.id}`, {
        method: "PATCH",
        body: { isActive: !a.isActive },
      });
      success(a.isActive ? "Dezaktywowano" : "Aktywowano");
      loadData();
    } catch (e: any) {
      toastError("Błąd", (e as Error).message);
    }
  };

  const toggleCatActive = async (e: React.MouseEvent, c: CategoryRow) => {
    e.stopPropagation();
    try {
      await apiFetch(`/api/amenity-categories/${c.id}`, {
        method: "PATCH",
        body: { isActive: !c.isActive },
      });
      success(c.isActive ? "Dezaktywowano" : "Aktywowano");
      loadData();
    } catch (e: any) {
      toastError("Błąd", (e as Error).message);
    }
  };

  // ── DRAG & DROP (categories) ──
  const handleCatDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = "move";
    if (e.currentTarget instanceof HTMLElement) {
      e.dataTransfer.setDragImage(e.currentTarget, 20, 20);
    }
  };

  const handleCatDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (draggedId && draggedId !== id) setDragOverId(id);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverId(null);
  };

  const handleCatDrop = async (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) { handleDragEnd(); return; }

    const list = [...categories];
    const fromIdx = list.findIndex((c) => c.id === draggedId);
    const toIdx = list.findIndex((c) => c.id === targetId);
    if (fromIdx === -1 || toIdx === -1) { handleDragEnd(); return; }

    const [moved] = list.splice(fromIdx, 1);
    list.splice(toIdx, 0, moved);

    const order = list.map((c, i) => ({ id: c.id, position: i }));
    setCategories(list.map((c, i) => ({ ...c, position: i })));
    handleDragEnd();

    try {
      await apiFetch("/api/amenity-categories/reorder", { method: "PATCH", body: { order } });
    } catch (err: any) {
      toastError("Błąd", err.message);
      loadData();
    }
  };

  // ── DRAG & DROP (amenities within category) ──
  const handleAmenityDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = "move";
    if (e.currentTarget instanceof HTMLElement) {
      e.dataTransfer.setDragImage(e.currentTarget, 20, 20);
    }
  };

  const handleAmenityDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (draggedId && draggedId !== id) setDragOverId(id);
  };

  const handleAmenityDrop = async (e: React.DragEvent, targetId: string, categoryItems: AmenityRow[]) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) { handleDragEnd(); return; }

    const list = [...categoryItems];
    const fromIdx = list.findIndex((a) => a.id === draggedId);
    const toIdx = list.findIndex((a) => a.id === targetId);
    if (fromIdx === -1 || toIdx === -1) { handleDragEnd(); return; }

    const [moved] = list.splice(fromIdx, 1);
    list.splice(toIdx, 0, moved);

    const order = list.map((a, i) => ({ id: a.id, position: i }));

    // Optimistic update
    setAmenities((prev) => {
      const updated = [...prev];
      for (const o of order) {
        const idx = updated.findIndex((a) => a.id === o.id);
        if (idx !== -1) updated[idx] = { ...updated[idx], position: o.position };
      }
      return updated.sort((a, b) => a.position - b.position);
    });
    handleDragEnd();

    try {
      await apiFetch("/api/amenities/reorder", { method: "PATCH", body: { order } });
    } catch (err: any) {
      toastError("Błąd", err.message);
      loadData();
    }
  };

  // ── Skeleton ──
  if (loading) return <AmenitiesSkeleton />;

  return (
    <div className="space-y-4 fade-in-up">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Udogodnienia</h2>
          <p className="text-[13px] text-muted-foreground mt-1">
            Katalog udogodnień zasobów. Przypisuj je w panelu każdego zasobu.
          </p>
        </div>
        <button
          onClick={tab === "amenities" ? openAmenityCreate : openCatCreate}
          className="btn-bubble btn-primary-bubble px-5 py-2.5 text-[13px]"
        >
          <Plus className="h-4 w-4" />
          {tab === "amenities" ? "Dodaj udogodnienie" : "Dodaj kategorię"}
        </button>
      </div>

      {/* ── Tabs ── */}
      <div className="tabs-bubble">
        <button
          onClick={() => setTab("amenities")}
          className={cn("tab-bubble", tab === "amenities" && "tab-bubble-active")}
        >
          Udogodnienia
          <span className="count-bubble">{amenities.length}</span>
        </button>
        <button
          onClick={() => setTab("categories")}
          className={cn("tab-bubble", tab === "categories" && "tab-bubble-active")}
        >
          Kategorie
          <span className="count-bubble">{categories.length}</span>
        </button>
      </div>

      {/* ═══ TAB: AMENITIES ═══ */}
      {tab === "amenities" && (
        <>
          {/* Search + filter */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Szukaj udogodnienia..."
                className="input-bubble input-bubble-search h-11 w-full"
                style={search ? { paddingRight: 36 } : undefined}
              />
              {search && (
                <button
                  onClick={() => { setSearch(""); searchRef.current?.focus(); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-muted-foreground/20 hover:text-foreground transition-all"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
            <BubbleSelect
              options={catOptions}
              value={filterCatId}
              onChange={setFilterCatId}
              className="w-[200px]"
            />
          </div>

          {/* Hint */}
          <p className="text-[11px] text-muted-foreground/60 flex items-center gap-1.5">
            <Info className="h-3 w-3 shrink-0" />
            Kliknij udogodnienie, aby je edytować. Przeciągnij za uchwyt, aby zmienić kolejność.
          </p>

          {/* Grouped amenities in collapsible sections */}
          {grouped.length === 0 ? (
            <div className="py-16 text-center">
              <Sparkles className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-[14px] font-medium text-muted-foreground">
                {search || filterCatId ? "Brak wyników" : "Brak udogodnień"}
              </p>
              <p className="text-[12px] text-muted-foreground/60 mt-1">
                {search || filterCatId ? "Zmień filtr lub wyszukiwanie" : "Dodaj pierwsze udogodnienie przyciskiem powyżej"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {grouped.map(({ category, items }) => {
                const isOpen = openSections.has(category.id);
                const catRow = categories.find((c) => c.id === category.id);
                return (
                  <div key={category.id} className="bubble" style={{ overflow: "visible" }}>
                    {/* Collapsible header */}
                    <button
                      onClick={() => toggleSection(category.id)}
                      className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-muted/20 transition-colors rounded-2xl"
                    >
                      <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        {catRow?.iconKey ? (
                          <DynamicIcon iconKey={catRow.iconKey} className="h-4 w-4 text-primary" />
                        ) : (
                          <FolderOpen className="h-4 w-4 text-primary" />
                        )}
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <h3 className="text-[14px] font-semibold">{category.name}</h3>
                        <p className="text-[11px] text-muted-foreground">{items.length} udogodnień w tej kategorii</p>
                      </div>
                      {isOpen ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                      )}
                    </button>

                    {/* Collapsible content — section-collapse animation */}
                    <div className={`section-collapse ${isOpen ? "section-open" : ""}`}>
                      <div className="section-collapse-inner">
                        <div className="px-4 pb-4 pt-1 border-t border-border/50 space-y-1">
                          {items.map((a) => {
                            const isDragging = draggedId === a.id;
                            const isDragOver = dragOverId === a.id;
                            return (
                              <div
                                key={a.id}
                                data-amenity-card={a.id}
                                onDragOver={(e) => handleAmenityDragOver(e, a.id)}
                                onDrop={(e) => handleAmenityDrop(e, a.id, items)}
                                onDragEnd={handleDragEnd}
                                onClick={() => openAmenityEdit(a)}
                                className={cn(
                                  "flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer group/a transition-all duration-200",
                                  "hover:bg-muted/30",
                                  !a.isActive && "opacity-50",
                                  isDragging && "opacity-30 scale-95",
                                  isDragOver && "ring-2 ring-primary ring-offset-2",
                                )}
                              >
                                {/* Drag handle — ONLY this element is draggable */}
                                <div
                                  draggable
                                  onDragStart={(e) => {
                                    e.stopPropagation();
                                    const card = e.currentTarget.closest("[data-amenity-card]");
                                    if (card instanceof HTMLElement) e.dataTransfer.setDragImage(card, 20, 20);
                                    handleAmenityDragStart(e, a.id);
                                  }}
                                  onDragEnd={handleDragEnd}
                                  onClick={(e) => e.stopPropagation()}
                                  className="cursor-grab active:cursor-grabbing text-muted-foreground/40 hover:text-muted-foreground shrink-0 p-1 -m-1"
                                >
                                  <GripVertical className="h-4 w-4" />
                                </div>
                                {/* Icon */}
                                <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                  <DynamicIcon iconKey={a.iconKey} className="h-4 w-4 text-primary" />
                                </div>
                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                  <p className="text-[13px] font-semibold truncate">{a.name}</p>
                                  <p className="text-[11px] text-muted-foreground">
                                    Przypisane do {a._count.resources} {a._count.resources === 1 ? "zasobu" : "zasobów"}
                                  </p>
                                </div>
                                {/* Actions */}
                                <div className="flex gap-1 opacity-0 group-hover/a:opacity-100 transition-opacity shrink-0"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <button
                                    onClick={(e) => toggleAmenityActive(e, a)}
                                    className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
                                    title={a.isActive ? "Dezaktywuj" : "Aktywuj"}
                                  >
                                    <div className={cn(
                                      "relative inline-flex h-4 w-7 items-center rounded-full transition-colors",
                                      a.isActive ? "bg-primary" : "bg-muted-foreground/20"
                                    )}>
                                      <span className={cn(
                                        "inline-block h-3 w-3 transform rounded-full bg-white shadow-sm transition-transform",
                                        a.isActive ? "translate-x-3.5" : "translate-x-0.5"
                                      )} />
                                    </div>
                                  </button>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); setDeleteTarget({ type: "amenity", id: a.id, name: a.name }); }}
                                    className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ═══ TAB: CATEGORIES ═══ */}
      {tab === "categories" && (
        <>
          {/* Hint */}
          <p className="text-[11px] text-muted-foreground/60 flex items-center gap-1.5">
            <Info className="h-3 w-3 shrink-0" />
            Kategorie grupują udogodnienia. Kliknij, aby edytować. Przeciągnij za uchwyt, aby zmienić kolejność wyświetlania.
          </p>

          {categories.length === 0 ? (
            <div className="py-16 text-center">
              <FolderOpen className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-[14px] font-medium text-muted-foreground">Brak kategorii</p>
              <p className="text-[12px] text-muted-foreground/60 mt-1">Dodaj pierwszą kategorię przyciskiem powyżej</p>
            </div>
          ) : (
            <div className="space-y-2">
              {categories.map((c) => {
                const isDragging = draggedId === c.id;
                const isDragOver = dragOverId === c.id;
                return (
                  <div
                    key={c.id}
                    data-category-card={c.id}
                    onDragOver={(e) => handleCatDragOver(e, c.id)}
                    onDrop={(e) => handleCatDrop(e, c.id)}
                    onDragEnd={handleDragEnd}
                    onClick={() => openCatEdit(c)}
                    className={cn(
                      "bubble-interactive px-5 py-4 flex items-center gap-3 cursor-pointer group/c transition-all duration-200",
                      !c.isActive && "opacity-50",
                      isDragging && "opacity-30 scale-95",
                      isDragOver && "ring-2 ring-primary ring-offset-2",
                    )}
                  >
                    {/* Drag handle — ONLY this element is draggable */}
                    <div
                      draggable
                      onDragStart={(e) => {
                        e.stopPropagation();
                        const card = e.currentTarget.closest("[data-category-card]");
                        if (card instanceof HTMLElement) e.dataTransfer.setDragImage(card, 20, 20);
                        handleCatDragStart(e, c.id);
                      }}
                      onDragEnd={handleDragEnd}
                      onClick={(e) => e.stopPropagation()}
                      className="cursor-grab active:cursor-grabbing text-muted-foreground/40 hover:text-muted-foreground shrink-0 p-1 -m-1"
                    >
                      <GripVertical className="h-4 w-4" />
                    </div>
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      {c.iconKey ? (
                        <DynamicIcon iconKey={c.iconKey} className="h-5 w-5 text-primary" />
                      ) : (
                        <FolderOpen className="h-5 w-5 text-primary" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-semibold">{c.name}</p>
                      <p className="text-[12px] text-muted-foreground">
                        Zawiera {c._count.amenities} {c._count.amenities === 1 ? "udogodnienie" : "udogodnień"}
                      </p>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover/c:opacity-100 transition-opacity shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={(e) => toggleCatActive(e, c)}
                        className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
                        title={c.isActive ? "Dezaktywuj" : "Aktywuj"}
                      >
                        <div className={cn(
                          "relative inline-flex h-4 w-7 items-center rounded-full transition-colors",
                          c.isActive ? "bg-primary" : "bg-muted-foreground/20"
                        )}>
                          <span className={cn(
                            "inline-block h-3 w-3 transform rounded-full bg-white shadow-sm transition-transform",
                            c.isActive ? "translate-x-3.5" : "translate-x-0.5"
                          )} />
                        </div>
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setDeleteTarget({ type: "category", id: c.id, name: c.name }); }}
                        className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ═══ SLIDEPANEL: AMENITY CREATE/EDIT ═══ */}
      <SlidePanel
        open={amenityPanelOpen}
        onClose={() => setAmenityPanelOpen(false)}
        title={editingAmenity ? "Edytuj udogodnienie" : "Nowe udogodnienie"}
      >
        <div className="space-y-5">
          <div>
            <label className="text-[12px] font-semibold text-muted-foreground mb-1.5 block">Nazwa *</label>
            <input
              type="text"
              value={amenityForm.name}
              onChange={(e) => setAmenityForm({ ...amenityForm, name: e.target.value })}
              placeholder="np. Wi-Fi"
              className="input-bubble h-11 w-full"
              maxLength={100}
            />
          </div>

          <div>
            <BubbleSelect
              label="Kategoria *"
              options={categories.map((c) => ({ value: c.id, label: c.name }))}
              value={amenityForm.categoryId}
              onChange={(v) => setAmenityForm({ ...amenityForm, categoryId: v })}
            />
          </div>

          {/* Icon picker */}
          <div>
            <label className="text-[12px] font-semibold text-muted-foreground mb-1.5 block">Ikona *</label>
            {amenityForm.iconKey && (
              <div className="flex items-center gap-2 mb-3 p-3 rounded-xl bg-primary/5 border border-primary/20">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <DynamicIcon iconKey={amenityForm.iconKey} className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-[13px] font-semibold">{amenityForm.iconKey}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {(AMENITY_ICONS as Record<string, AmenityIconDef>)[amenityForm.iconKey]?.label || ""}
                  </p>
                </div>
              </div>
            )}
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input type="text" value={iconSearch} onChange={(e) => setIconSearch(e.target.value)}
                placeholder="Szukaj ikony..." className="input-bubble h-9 w-full text-[12px]" style={{ paddingLeft: 32 }} />
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
                        <button key={key} type="button"
                          onClick={() => setAmenityForm({ ...amenityForm, iconKey: key })}
                          className={cn("h-9 w-9 rounded-lg flex items-center justify-center transition-all",
                            amenityForm.iconKey === key ? "bg-primary text-white shadow-sm" : "hover:bg-muted text-muted-foreground hover:text-foreground"
                          )}
                          title={`${key} — ${(AMENITY_ICONS as Record<string, AmenityIconDef>)[key]?.label}`}
                        >
                          <DynamicIcon iconKey={key} className="h-4 w-4" />
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex gap-3 pt-2 pb-8">
            <button onClick={handleSaveAmenity}
              disabled={saving || !amenityForm.name.trim() || !amenityForm.categoryId || !amenityForm.iconKey}
              className="btn-bubble btn-primary-bubble px-6 py-3 text-[13px] disabled:opacity-50">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              {saving ? "Zapisywanie..." : editingAmenity ? "Zapisz" : "Dodaj"}
            </button>
            <button onClick={() => setAmenityPanelOpen(false)}
              className="btn-bubble btn-secondary-bubble px-6 py-3 text-[13px]">Anuluj</button>
          </div>
        </div>
      </SlidePanel>

      {/* ═══ SLIDEPANEL: CATEGORY CREATE/EDIT ═══ */}
      <SlidePanel
        open={catPanelOpen}
        onClose={() => setCatPanelOpen(false)}
        title={editingCat ? "Edytuj kategorię" : "Nowa kategoria"}
      >
        <div className="space-y-5">
          <div>
            <label className="text-[12px] font-semibold text-muted-foreground mb-1.5 block">Nazwa *</label>
            <input type="text" value={catForm.name} onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
              placeholder="np. Pokój" className="input-bubble h-11 w-full" maxLength={100} />
          </div>
          <div>
            <label className="text-[12px] font-semibold text-muted-foreground mb-1.5 block">Ikona (opcjonalna)</label>
            {catForm.iconKey && (
              <div className="flex items-center gap-2 mb-3 p-3 rounded-xl bg-primary/5 border border-primary/20">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <DynamicIcon iconKey={catForm.iconKey} className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1"><p className="text-[13px] font-semibold">{catForm.iconKey}</p></div>
                <button onClick={() => setCatForm({ ...catForm, iconKey: "" })}
                  className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all">
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input type="text" value={iconSearch} onChange={(e) => setIconSearch(e.target.value)}
                placeholder="Szukaj ikony..." className="input-bubble h-9 w-full text-[12px]" style={{ paddingLeft: 32 }} />
            </div>
            <div className="max-h-[200px] overflow-y-auto rounded-xl border border-border p-2">
              <div className="grid grid-cols-8 gap-1">
                {AMENITY_ICON_KEYS.filter((key) => {
                  if (!iconSearch) return true;
                  const q = iconSearch.toLowerCase();
                  const def = (AMENITY_ICONS as Record<string, AmenityIconDef>)[key];
                  return key.includes(q) || def.label.toLowerCase().includes(q) || def.group.toLowerCase().includes(q);
                }).map((key) => (
                  <button key={key} type="button"
                    onClick={() => setCatForm({ ...catForm, iconKey: key })}
                    className={cn("h-9 w-9 rounded-lg flex items-center justify-center transition-all",
                      catForm.iconKey === key ? "bg-primary text-white shadow-sm" : "hover:bg-muted text-muted-foreground hover:text-foreground"
                    )}
                    title={key}>
                    <DynamicIcon iconKey={key} className="h-4 w-4" />
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-3 pt-2 pb-8">
            <button onClick={handleSaveCat} disabled={saving || !catForm.name.trim()}
              className="btn-bubble btn-primary-bubble px-6 py-3 text-[13px] disabled:opacity-50">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              {saving ? "Zapisywanie..." : editingCat ? "Zapisz" : "Dodaj"}
            </button>
            <button onClick={() => setCatPanelOpen(false)}
              className="btn-bubble btn-secondary-bubble px-6 py-3 text-[13px]">Anuluj</button>
          </div>
        </div>
      </SlidePanel>

      {/* ═══ CONFIRM DIALOG ═══ */}
      <ConfirmDialog
        open={!!deleteTarget}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        title={`Usunąć ${deleteTarget?.type === "category" ? "kategorię" : "udogodnienie"}?`}
        message={`"${deleteTarget?.name}" zostanie trwale usunięte. Tej operacji nie można cofnąć.`}
        confirmLabel={deleting ? "Usuwanie..." : "Usuń"}
        variant="danger"
      />
    </div>
  );
}
