"use client";

/**
 * B1 ImageUpload — Resource image management component (redesign).
 *
 * Click thumbnail → detail section below grid: podgląd, alt text, okładka, usuń.
 * Zero inline editing na miniaturce.
 *
 * Features:
 * - Drag & drop upload zone (+ click to browse)
 * - Thumbnail grid with drag-to-reorder
 * - Cover badge (right side, no overlap with drag handle)
 * - Click thumbnail → detail section below
 * - Upload progress indicator
 * - Counter: X / 20
 */

import React, { useState, useCallback, useRef } from "react";
import {
  Upload,
  Star,
  Trash2,
  GripVertical,
  Loader2,
  AlertCircle,
  X,
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

export function ImageUpload({ resourceId, images, onImagesChange }: Props) {
  const { error: showError, success: showSuccess } = useToast();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Selected image for detail view
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [altValue, setAltValue] = useState("");
  const [savingAlt, setSavingAlt] = useState(false);

  // Drag reorder state
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [reordering, setReordering] = useState(false);

  const remaining = MAX_IMAGES - images.length;
  const selectedImage = selectedId ? images.find((img) => img.id === selectedId) : null;

  // ── Upload ──────────────────────────────────────────────

  const uploadFile = useCallback(async (file: File) => {
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
    } catch {
      showError("Nie udało się przesłać zdjęcia");
    } finally {
      setUploading(false);
      setUploadProgress("");
    }
  }, [resourceId, images, onImagesChange, showError, showSuccess]);

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;
    uploadFile(files[0]);
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

      if (selectedId === imageId) setSelectedId(null);
      onImagesChange(json.data.images);
      showSuccess("Zdjęcie usunięte");
    } catch {
      showError("Nie udało się usunąć zdjęcia");
    } finally {
      setDeleting(null);
    }
  }, [resourceId, selectedId, onImagesChange, showError, showSuccess]);

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

      const updated = images.map((img) => ({
        ...img,
        isCover: img.id === imageId,
      }));
      onImagesChange(updated);
      showSuccess("Okładka ustawiona");
    } catch {
      showError("Nie udało się ustawić okładki");
    }
  }, [resourceId, images, onImagesChange, showError, showSuccess]);

  // ── Alt Text ────────────────────────────────────────────

  const handleSelectImage = (img: ImageWithUrls) => {
    if (selectedId === img.id) {
      setSelectedId(null);
    } else {
      setSelectedId(img.id);
      setAltValue(img.alt || "");
    }
  };

  const handleSaveAlt = useCallback(async () => {
    if (!selectedId) return;

    setSavingAlt(true);
    try {
      const res = await fetch(`/api/resources/${resourceId}/images/${selectedId}`, {
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
        img.id === selectedId ? { ...img, alt: altValue || null } : img
      );
      onImagesChange(updated);
      showSuccess("Tekst alternatywny zapisany");
    } catch {
      showError("Nie udało się zapisać tekstu alternatywnego");
    } finally {
      setSavingAlt(false);
    }
  }, [selectedId, altValue, resourceId, images, onImagesChange, showError, showSuccess]);

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

    const optimisticImages = reordered.map((img, idx) => ({ ...img, position: idx }));
    onImagesChange(optimisticImages);

    setDraggedId(null);
    setDragOverId(null);

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
        return;
      }

      onImagesChange(json.data.images);
    } catch {
      showError("Nie udało się zmienić kolejności");
    } finally {
      setReordering(false);
    }
  };

  // ── Render ──────────────────────────────────────────────

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      {remaining > 0 && (
        <div
          className={`relative border-2 border-dashed rounded-xl p-5 text-center transition-colors cursor-pointer ${
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
            onChange={(e) => { handleFiles(e.target.files); if (e.target) e.target.value = ""; }}
          />

          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-5 w-5 text-primary animate-spin" />
              <p className="text-[12px] text-muted-foreground">{uploadProgress}</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1.5">
              <Upload className="h-5 w-5 text-muted-foreground" />
              <p className="text-[12px] text-muted-foreground">
                Przeciągnij lub <span className="text-primary font-semibold">kliknij</span>
              </p>
              <p className="text-[10px] text-muted-foreground/60">
                JPEG, PNG, WebP • max {MAX_SIZE_MB}MB • {images.length}/{MAX_IMAGES}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Limit reached */}
      {remaining <= 0 && (
        <div className="flex items-center gap-2 text-[12px] text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400 rounded-xl px-4 py-3">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          Limit {MAX_IMAGES} zdjęć osiągnięty
        </div>
      )}

      {/* Images grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {images.map((img) => (
            <div
              key={img.id}
              draggable={!deleting}
              onDragStart={(e) => handleReorderDragStart(e, img.id)}
              onDragEnd={handleReorderDragEnd}
              onDragOver={(e) => { e.preventDefault(); setDragOverId(img.id); }}
              onClick={() => handleSelectImage(img)}
              className={`group relative rounded-xl overflow-hidden cursor-pointer transition-all ${
                selectedId === img.id
                  ? "ring-2 ring-primary ring-offset-2"
                  : dragOverId === img.id && draggedId && draggedId !== img.id
                  ? "ring-2 ring-primary/50"
                  : "hover:ring-1 hover:ring-border"
              } ${deleting === img.id ? "opacity-50 pointer-events-none" : ""}`}
            >
              <div className="aspect-square bg-muted overflow-hidden">
                <img
                  src={img.urls.thumbnail}
                  alt={img.alt || "Zdjęcie zasobu"}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>

              {/* Drag handle — top left */}
              <div className="absolute top-2.5 left-2.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
                <div className="bg-white/90 dark:bg-black/70 rounded-lg p-1">
                  <GripVertical className="h-3 w-3 text-gray-600 dark:text-gray-300" />
                </div>
              </div>

              {/* Cover badge — top right */}
              {img.isCover && (
                <div className="absolute top-2.5 right-2.5 bg-amber-500 text-white text-[8px] font-bold px-2 py-1 rounded-lg flex items-center gap-0.5">
                  <Star className="h-2.5 w-2.5 fill-current" />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Detail section — shown when image selected */}
      {selectedImage && (
        <div className="bubble p-5 space-y-4">
          <div className="flex items-start gap-4">
            {/* Preview */}
            <div className="w-28 h-20 rounded-xl overflow-hidden bg-muted shrink-0">
              <img
                src={selectedImage.urls.medium}
                alt={selectedImage.alt || "Podgląd"}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[11px] text-muted-foreground">
                  {selectedImage.width}×{selectedImage.height}px • {(selectedImage.sizeBytes / 1024).toFixed(0)} KB
                </p>
                <button
                  onClick={() => setSelectedId(null)}
                  className="inline-flex h-6 w-6 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>

              {/* Alt text */}
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground mb-1 block">
                  Tekst alternatywny
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={altValue}
                    onChange={(e) => setAltValue(e.target.value)}
                    placeholder="Opis zdjęcia..."
                    className="input-bubble h-8 text-[12px] flex-1"
                    onKeyDown={(e) => { if (e.key === "Enter") handleSaveAlt(); }}
                  />
                  <button
                    onClick={handleSaveAlt}
                    disabled={savingAlt || altValue === (selectedImage.alt || "")}
                    className="btn-bubble btn-primary-bubble px-3 py-1.5 text-[11px] shrink-0 disabled:opacity-40"
                  >
                    {savingAlt ? <Loader2 className="h-3 w-3 animate-spin" /> : "Zapisz"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 pt-4 mt-1 border-t border-border/50">
            {!selectedImage.isCover ? (
              <button
                onClick={() => handleSetCover(selectedImage.id)}
                className="btn-bubble btn-secondary-bubble px-3 py-1.5 text-[11px] flex items-center gap-1"
              >
                <Star className="h-3 w-3" /> Ustaw jako okładkę
              </button>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] text-amber-600 font-semibold px-2 py-1.5">
                <Star className="h-3 w-3 fill-amber-500" /> Okładka zasobu
              </span>
            )}
            <button
              onClick={() => handleDelete(selectedImage.id)}
              disabled={!!deleting}
              className="btn-bubble btn-danger-bubble px-3 py-1.5 text-[11px] flex items-center gap-1 ml-auto"
            >
              {deleting === selectedImage.id ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <><Trash2 className="h-3 w-3" /> Usuń</>
              )}
            </button>
          </div>
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
