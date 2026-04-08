"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Palette, Upload, Trash2, Image, Type, Loader2, Check, RotateCcw,
  ChevronDown, ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api-fetch";
import { useToast } from "@/components/ui/toast";
import { BubbleColorPicker } from "@/components/ui/bubble-color-picker";

interface WidgetConfigData {
  id: string;
  logoUrl: string | null;
  logoHeight: number;
  primaryColor: string;
  primaryForeground: string;
  backgroundColor: string;
  foregroundColor: string;
  cardColor: string;
  mutedColor: string;
  borderColor: string;
  successColor: string;
  warningColor: string;
  dangerColor: string;
  fontFamily: string;
  termsUrl: string | null;
  privacyUrl: string | null;
}

const DEFAULT_CONFIG: Partial<WidgetConfigData> = {
  primaryColor: "#2563EB",
  primaryForeground: "#FFFFFF",
  backgroundColor: "#F8FAFC",
  foregroundColor: "#1E293B",
  cardColor: "#FFFFFF",
  mutedColor: "#64748B",
  borderColor: "#E2E8F0",
  successColor: "#16A34A",
  warningColor: "#D97706",
  dangerColor: "#DC2626",
  fontFamily: "Plus Jakarta Sans",
  logoHeight: 40,
};

const COLOR_FIELDS: { key: keyof WidgetConfigData; desc: string }[] = [
  { key: "primaryColor", desc: "Przyciski, linki, akcenty, stepper" },
  { key: "primaryForeground", desc: "Tekst na przyciskach i elementach głównego koloru" },
  { key: "backgroundColor", desc: "Tło całej strony rezerwacji" },
  { key: "foregroundColor", desc: "Nagłówki, tytuły, treść tekstowa" },
  { key: "cardColor", desc: "Tło kart, formularzy, sekcji" },
  { key: "mutedColor", desc: "Opisy, placeholdery, tekst pomocniczy" },
  { key: "borderColor", desc: "Obramowania kart, inputów, separatory" },
  { key: "successColor", desc: "Potwierdzenia, ikony sukcesu" },
  { key: "warningColor", desc: "Oczekujące płatności, ostrzeżenia" },
  { key: "dangerColor", desc: "Błędy walidacji, wymagane pola" },
];

const FONT_OPTIONS = [
  "Plus Jakarta Sans", "Inter", "DM Sans", "Outfit", "Poppins",
  "Montserrat", "Lato", "Open Sans", "Nunito", "Raleway", "Rubik", "Source Sans 3",
];

const LOGO_SIZE_PRESETS = [
  { label: "S", value: 28 },
  { label: "M", value: 40 },
  { label: "L", value: 56 },
  { label: "XL", value: 72 },
];

export function AppearanceConfigTab() {
  const { success: showSuccess, error: showError } = useToast();
  const [config, setConfig] = useState<WidgetConfigData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [logoOpen, setLogoOpen] = useState(true);
  const [colorsOpen, setColorsOpen] = useState(true);
  const [fontOpen, setFontOpen] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadConfig = useCallback(async () => {
    try {
      const data = await apiFetch("/api/settings/widget");
      setConfig(data.config);
    } catch (e) {
      showError("Nie udało się załadować konfiguracji");
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadConfig(); }, [loadConfig]);

  async function saveField(field: string, value: any) {
    setSaving(true);
    try {
      const data = await apiFetch("/api/settings/widget", {
        method: "PATCH",
        body: { [field]: value },
      });
      setConfig(data.config);
      showSuccess("Zapisano");
    } catch (e: any) {
      showError(e.message || "Błąd zapisu");
    }
    setSaving(false);
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("logo", file);
      const res = await fetch("/api/settings/widget", { method: "POST", body: formData });
      const json = await res.json();
      if (json.success) {
        setConfig(prev => prev ? { ...prev, logoUrl: json.data.logoUrl } : prev);
        showSuccess("Logo wgrane");
      } else {
        showError(json.error || "Błąd uploadu");
      }
    } catch {
      showError("Błąd uploadu logo");
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleLogoDelete() {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("action", "delete");
      const res = await fetch("/api/settings/widget", { method: "POST", body: formData });
      const json = await res.json();
      if (json.success) {
        setConfig(prev => prev ? { ...prev, logoUrl: null } : prev);
        showSuccess("Logo usunięte");
      }
    } catch {
      showError("Błąd usuwania logo");
    }
    setUploading(false);
  }

  async function resetToDefaults() {
    setSaving(true);
    try {
      const data = await apiFetch("/api/settings/widget", { method: "PATCH", body: DEFAULT_CONFIG });
      setConfig(data.config);
      showSuccess("Przywrócono domyślne");
    } catch {
      showError("Błąd przywracania");
    }
    setSaving(false);
  }

  if (loading || !config) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="bubble p-5">
            <div className="h-5 w-32 bg-muted shimmer rounded mb-3" />
            <div className="h-11 w-full bg-muted shimmer rounded-2xl" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-[800px]">
      {/* ── Logo ── */}
      <div className="bubble" style={{ overflow: "visible" }}>
        <button onClick={() => setLogoOpen(!logoOpen)}
          className="w-full flex items-center gap-3 px-5 py-4 hover:bg-muted/20 transition-colors">
          <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Image className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 text-left">
            <h3 className="text-[14px] font-semibold">Logo</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">Logo wyświetlane w nagłówku widżetu rezerwacyjnego i w emailach do klientów.</p>
          </div>
          {logoOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
        </button>
        <div className={`section-collapse ${logoOpen ? "section-open" : ""}`}>
          <div className="section-collapse-inner">
            <div className="border-t border-border/50 px-5 py-5">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                <div
                  className="flex-shrink-0 border-2 border-dashed border-border rounded-2xl flex items-center justify-center bg-muted/20"
                  style={{ width: 120, height: 80 }}
                >
                  {config.logoUrl ? (
                    <img src={config.logoUrl} alt="Logo" style={{ height: Math.min(config.logoHeight, 64) }} className="object-contain max-w-[100px]" />
                  ) : (
                    <span className="text-[11px] text-muted-foreground">Brak logo</span>
                  )}
                </div>
                <div className="flex-1 space-y-3 w-full sm:w-auto">
                  <input ref={fileInputRef} type="file" accept=".svg,.png,.webp,.jpg,.jpeg" onChange={handleLogoUpload} className="hidden" />
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="btn-bubble btn-primary-bubble px-4 py-2 text-[12px]">
                      {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                      {" "}Wgraj logo
                    </button>
                    {config.logoUrl && (
                      <button onClick={handleLogoDelete} disabled={uploading} className="btn-bubble btn-danger-bubble px-4 py-2 text-[12px]">
                        <Trash2 className="h-3.5 w-3.5" /> Usuń
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground">SVG, PNG lub WebP, max 5 MB</p>
                  {config.logoUrl && (
                    <div>
                      <p className="text-[11px] font-semibold text-muted-foreground mb-1.5">Rozmiar</p>
                      <div className="flex flex-wrap gap-2">
                        {LOGO_SIZE_PRESETS.map(p => (
                          <button key={p.label} onClick={() => saveField("logoHeight", p.value)}
                            className={cn("h-9 px-4 rounded-xl text-[12px] font-semibold border-2 transition-colors",
                              config.logoHeight === p.value ? "border-primary bg-primary/5 text-primary" : "border-border hover:border-primary/40"
                            )}>{p.label} ({p.value}px)</button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Kolory ── */}
      <div className="bubble">
        <div className="flex items-center gap-3 px-5 py-4">
          <button onClick={() => setColorsOpen(!colorsOpen)}
            className="flex-1 flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Palette className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 text-left">
              <h3 className="text-[14px] font-semibold">Kolorystyka</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Kolory przycisków, tekstu, tła i akcentów w widżecie rezerwacyjnym.</p>
            </div>
            {colorsOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
          </button>
          <button onClick={resetToDefaults} disabled={saving} className="btn-bubble btn-secondary-bubble px-3 py-1.5 text-[11px] shrink-0">
            <RotateCcw className="h-3 w-3" /> Domyślne
          </button>
        </div>
        <div className={`section-collapse ${colorsOpen ? "section-open" : ""}`}>
          <div className="section-collapse-inner">
            <div className="border-t border-border/50 p-5">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-5">
                {COLOR_FIELDS.map((field) => (
                  <div key={field.key} className="flex flex-col items-center text-center">
                    <BubbleColorPicker
                      value={(config as any)[field.key] || "#000000"}
                      onChange={(hex) => {
                        setConfig(prev => prev ? { ...prev, [field.key]: hex } : prev);
                        saveField(field.key, hex);
                      }}
                    />
                    <p className="text-[11px] text-primary font-medium mt-2 cursor-pointer">Zmień kolor</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{field.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Font ── */}
      <div className="bubble">
        <button onClick={() => setFontOpen(!fontOpen)}
          className="w-full flex items-center gap-3 px-5 py-4 hover:bg-muted/20 transition-colors">
          <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Type className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 text-left">
            <h3 className="text-[14px] font-semibold">Czcionka</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">Czcionka tekstu w widżecie rezerwacyjnym. Pobierana automatycznie z Google Fonts.</p>
          </div>
          {fontOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
        </button>
        <div className={`section-collapse ${fontOpen ? "section-open" : ""}`}>
          <div className="section-collapse-inner">
            <div className="border-t border-border/50 px-5 py-5">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {FONT_OPTIONS.map(font => (
                  <button key={font} onClick={() => saveField("fontFamily", font)}
                    className={cn("h-11 px-3 rounded-xl text-[12px] font-medium border-2 transition-colors text-left truncate",
                      config.fontFamily === font ? "border-primary bg-primary/5 text-primary" : "border-border hover:border-primary/40"
                    )}>
                    {config.fontFamily === font && <Check className="h-3 w-3 inline mr-1.5" />}
                    {font}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground mt-2">Zmiana dotyczy publicznego frontendu (/booking, /reservation).</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Info ── */}
      <div className="bg-primary/5 border border-primary/20 rounded-2xl px-4 py-3">
        <p className="text-[12px] text-primary font-medium">
          Zmiany są widoczne na stronie /booking po odświeżeniu (Ctrl+Shift+R wymusza pominięcie cache przeglądarki).
        </p>
      </div>

      {saving && (
        <div className="fixed bottom-4 right-4 bg-card border border-border rounded-xl px-3 py-2 shadow-lg flex items-center gap-2 text-[12px] text-muted-foreground z-50">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Zapisuję...
        </div>
      )}
    </div>
  );
}
