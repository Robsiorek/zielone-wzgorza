"use client";

/**
 * B1 ImageUpload — Resource image management component.
 *
 * Features:
 * - Drag & drop upload zone (+ click to browse)
 * - Thumbnail grid with drag-to-reorder
 * - Cover badge + set cover action
 * - Delete with confirmation
 * - Alt text editing (inline)
 * - Upload progress indicator
 * - Counter: X / 20
 *
 * Design System: bubble cards, btn-bubble, input-bubble, shimmer skeleton.
 */

import React, { useState, useCallback, useRef } from "react";
import {
  Upload,
  X,
  Star,
  Trash2,
  GripVertical,
  Loader2,
  ImageIcon,
  AlertCircle,
  Pencil,
  Check,
} from "lucide-react";
import { useToast } from "@/components/ui/toast";

interface ImageWithUrls {
  id: string;
  alt: string | null;
  position: number;
  isCover: boolean;
  sizeBytes: number;
  width: number;
  height: number;
  urls: {
    original: string;
    medium: string;
    thumbnail: string;
  };
}

interface Props {
  resourceId: string;
  images: ImageWithUrls[];
  onImagesChange: (images: ImageWithUrls[]) => void;
}

const MAX_IMAGES = 20;
const MAX_SIZE_MB = 5;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function ImageUpload({ resourceId, images, onImagesChange }: Props) {
  const { error: showError, success: showSuccess } = useToast();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [editingAlt, setEditingAlt] = useState<string | null>(null);
  const [altValue, setAltValue] = useState("");
  const [savingAlt, setSavingAlt] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Drag reorder state
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [reordering, setReordering] = useState(false);

  const remaining = MAX_IMAGES - images.length;

  // ── Upload ──────────────────────────────────────────────

  const uploadFile = useCallback(async (file: File) => {
    // Client-side pre-validation
    if (!ACCEPTED_TYPES.includes(file.type) && !file.name.match(/\.(jpg|jpeg|png|webp)$/i)) {
      showError("Nieobsługiwany format. Akceptowane: JPEG, PNG, WebP");
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      showError(`Plik przekracza limit ${MAX_SIZE_MB}MB`);
      return;
    }
    if (images.length >= MAX_IMAGES) {
      showError(`Osiągnięto limit ${MAX_IMAGES} zdjęć`);
      return;
    }

    setUploading(true);
    setUploadProgress("Przetwarzanie...");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`/api/resources/${resourceId}/images`, {
        method: "POST",
        body: formData,
      });

      const json = await res.json();

      if (!json.success) {
        showError(json.error || "Błąd uploadu");
        return;
      }

      onImagesChange([...images, json.data.image]);
      showSuccess("Zdjęcie dodane");
    } catch (err) {
      showError("Nie udało się przesłać zdjęcia");
    } finally {
      setUploading(false);
      setUploadProgress("");
    }
  }, [resourceId, images, onImagesChange, showError, showSuccess]);

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;
    // Upload one at a time (sequential, not parallel)
    const file = files[0];
    uploadFile(file);
  }, [uploadFile]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  // ── Delete ──────────────────────────────────────────────

  const handleDelete = useCallback(async (imageId: string) => {
    if (!confirm("Czy na pewno chcesz usunąć to zdjęcie?")) return;

    setDeleting(imageId);
    try {
      const res = await fetch(`/api/resources/${resourceId}/images/${imageId}`, {
        method: "DELETE",
      });
      const json = await res.json();

      if (!json.success) {
        showError(json.error || "Błąd usuwania");
        return;
      }

      onImagesChange(json.data.images);
      showSuccess("Zdjęcie usunięte");
    } catch (err) {
      showError("Nie udało się usunąć zdjęcia");
    } finally {
      setDeleting(null);
    }
  }, [resourceId, onImagesChange, showError, showSuccess]);

  // ── Set Cover ───────────────────────────────────────────

  const handleSetCover = useCallback(async (imageId: string) => {
    try {
      const res = await fetch(`/api/resources/${resourceId}/images/${imageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isCover: true }),
      });
      const json = await res.json();

      if (!json.success) {
        showError(json.error || "Błąd ustawiania okładki");
        return;
      }

      // Update cover flag on all images
      const updated = images.map((img) => ({
        ...img,
        isCover: img.id === imageId,
      }));
      onImagesChange(updated);
      showSuccess("Okładka ustawiona");
    } catch (err) {
      showError("Nie udało się ustawić okładki");
    }
  }, [resourceId, images, onImagesChange, showError, showSuccess]);

  // ── Alt Text ────────────────────────────────────────────

  const handleStartEditAlt = (img: ImageWithUrls) => {
    setEditingAlt(img.id);
    setAltValue(img.alt || "");
  };

  const handleSaveAlt = useCallback(async () => {
    if (!editingAlt) return;

    setSavingAlt(true);
    try {
      const res = await fetch(`/api/resources/${resourceId}/images/${editingAlt}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alt: altValue || null }),
      });
      const json = await res.json();

      if (!json.success) {
        showError(json.error || "Błąd zapisu");
        return;
      }

      const updated = images.map((img) =>
        img.id === editingAlt ? { ...img, alt: altValue || null } : img
      );
      onImagesChange(updated);
    } catch (err) {
      showError("Nie udało się zapisać tekstu alternatywnego");
    } finally {
      setSavingAlt(false);
      setEditingAlt(null);
    }
  }, [editingAlt, altValue, resourceId, images, onImagesChange, showError]);

  // ── Drag Reorder ────────────────────────────────────────

  const handleReorderDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = "move";
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = "0.5";
    }
  };

  const handleReorderDragEnd = async (e: React.DragEvent) => {
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = "1";
    }

    if (!draggedId || !dragOverId || draggedId === dragOverId) {
      setDraggedId(null);
      setDragOverId(null);
      return;
    }

    // Compute new order
    const oldIndex = images.findIndex((img) => img.id === draggedId);
    const newIndex = images.findIndex((img) => img.id === dragOverId);

    if (oldIndex === -1 || newIndex === -1) {
      setDraggedId(null);
      setDragOverId(null);
      return;
    }

    const reordered = [...images];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);

    // Optimistic update
    const optimisticImages = reordered.map((img, idx) => ({ ...img, position: idx }));
    onImagesChange(optimisticImages);

    setDraggedId(null);
    setDragOverId(null);

    // Persist to backend
    setReordering(true);
    try {
      const res = await fetch(`/api/resources/${resourceId}/images/reorder`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageIds: reordered.map((img) => img.id) }),
      });
      const json = await res.json();

      if (!json.success) {
        showError(json.error || "Błąd zmiany kolejności");
        // Revert on failure — reload from current state
        return;
      }

      onImagesChange(json.data.images);
    } catch (err) {
      showError("Nie udało się zmienić kolejności");
    } finally {
      setReordering(false);
    }
  };

  // ── Render ──────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-[13px] font-semibold flex items-center gap-2">
          <ImageIcon className="h-4 w-4 text-primary" />
          Zdjęcia
        </h4>
        <span className="text-[11px] text-muted-foreground font-medium">
          {images.length} / {MAX_IMAGES}
        </span>
      </div>

      {/* Drop zone */}
      {remaining > 0 && (
        <div
          className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer ${
            dragOver
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/40"
          } ${uploading ? "pointer-events-none opacity-60" : ""}`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => !uploading && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />

          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-6 w-6 text-primary animate-spin" />
              <p className="text-[12px] text-muted-foreground">{uploadProgress}</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload className="h-6 w-6 text-muted-foreground" />
              <p className="text-[12px] text-muted-foreground">
                Przeciągnij zdjęcie lub <span className="text-primary font-semibold">kliknij aby wybrać</span>
              </p>
              <p className="text-[10px] text-muted-foreground/60">
                JPEG, PNG, WebP • max {MAX_SIZE_MB}MB • pozostało: {remaining}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Limit reached */}
      {remaining <= 0 && (
        <div className="flex items-center gap-2 text-[12px] text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400 rounded-xl px-4 py-3">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          Osiągnięto limit {MAX_IMAGES} zdjęć
        </div>
      )}

      {/* Images grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {images.map((img) => (
            <div
              key={img.id}
              draggable={!deleting && !editingAlt}
              onDragStart={(e) => handleReorderDragStart(e, img.id)}
              onDragEnd={handleReorderDragEnd}
              onDragOver={(e) => { e.preventDefault(); setDragOverId(img.id); }}
              className={`group relative bubble p-0 overflow-hidden transition-all ${
                dragOverId === img.id && draggedId && draggedId !== img.id
                  ? "ring-2 ring-primary"
                  : ""
              } ${deleting === img.id ? "opacity-50 pointer-events-none" : ""}`}
            >
              {/* Thumbnail */}
              <div className="aspect-[4/3] bg-muted overflow-hidden">
                <img
                  src={img.urls.thumbnail}
                  alt={img.alt || "Zdjęcie zasobu"}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>

              {/* Overlay actions — visible on hover */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-start justify-between p-1.5">
                {/* Drag handle */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
                  <div className="bg-white/90 dark:bg-black/70 rounded-md p-1">
                    <GripVertical className="h-3.5 w-3.5 text-gray-700 dark:text-gray-300" />
                  </div>
                </div>

                {/* Actions: cover, delete */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  {!img.isCover && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleSetCover(img.id); }}
                      title="Ustaw jako okładkę"
                      className="bg-white/90 dark:bg-black/70 rounded-md p-1 hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors"
                    >
                      <Star className="h-3.5 w-3.5 text-gray-700 dark:text-gray-300" />
                    </button>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(img.id); }}
                    title="Usuń zdjęcie"
                    className="bg-white/90 dark:bg-black/70 rounded-md p-1 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
                  >
                    {deleting === img.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5 text-gray-700 dark:text-gray-300" />
                    )}
                  </button>
                </div>
              </div>

              {/* Cover badge */}
              {img.isCover && (
                <div className="absolute top-1.5 left-1.5 bg-amber-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                  <Star className="h-2.5 w-2.5 fill-current" /> Okładka
                </div>
              )}

              {/* Alt text section */}
              <div className="p-2">
                {editingAlt === img.id ? (
                  <div className="flex gap-1">
                    <input
                      type="text"
                      value={altValue}
                      onChange={(e) => setAltValue(e.target.value)}
                      placeholder="Tekst alternatywny..."
                      className="input-bubble h-7 text-[11px] flex-1"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveAlt();
                        if (e.key === "Escape") setEditingAlt(null);
                      }}
                    />
                    <button
                      onClick={handleSaveAlt}
                      disabled={savingAlt}
                      className="btn-icon-bubble h-7 w-7 flex items-center justify-center"
                    >
                      {savingAlt ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Check className="h-3 w-3 text-primary" />
                      )}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleStartEditAlt(img)}
                    className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors w-full text-left truncate"
                  >
                    <Pencil className="h-2.5 w-2.5 flex-shrink-0" />
                    {img.alt || "Dodaj tekst alt..."}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {images.length === 0 && !uploading && (
        <p className="text-[12px] text-muted-foreground text-center py-2">
          Brak zdjęć — dodaj pierwsze zdjęcie powyżej
        </p>
      )}

      {/* Reorder indicator */}
      {reordering && (
        <div className="flex items-center justify-center gap-2 text-[11px] text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" />
          Zapisywanie kolejności...
        </div>
      )}
    </div>
  );
}
