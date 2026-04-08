"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Save, Eye, Send, RotateCcw, Loader2,
  Type, Code2, Copy,
} from "lucide-react";
import { apiFetch } from "@/lib/api-fetch";
import { useToast } from "@/components/ui/toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { cn } from "@/lib/utils";

const TEMPLATE_LABELS: Record<string, string> = {
  BOOKING_CONFIRMATION: "Potwierdzenie rezerwacji",
  PAYMENT_REMINDER: "Przypomnienie o wpłacie",
  STATUS_CONFIRMED: "Rezerwacja potwierdzona",
  STATUS_CANCELLED: "Rezerwacja anulowana",
};

const TEXT_VARIABLES = [
  { name: "reservation_number", desc: "Numer rezerwacji" },
  { name: "client_first_name", desc: "Imię klienta" },
  { name: "client_last_name", desc: "Nazwisko klienta" },
  { name: "client_email", desc: "E-mail klienta" },
  { name: "check_in", desc: "Data przyjazdu" },
  { name: "check_out", desc: "Data wyjazdu" },
  { name: "nights", desc: "Liczba nocy" },
  { name: "adults", desc: "Dorośli" },
  { name: "children", desc: "Dzieci" },
  { name: "total", desc: "Kwota łączna" },
  { name: "deposit", desc: "Kwota zaliczki" },
  { name: "status", desc: "Status rezerwacji" },
  { name: "bank_account_name", desc: "Odbiorca przelewu" },
  { name: "bank_account_iban", desc: "Nr konta" },
  { name: "bank_name", desc: "Nazwa banku" },
  { name: "transfer_title", desc: "Tytuł przelewu" },
  { name: "reservation_url", desc: "Link do rezerwacji" },
  { name: "company_name", desc: "Nazwa firmy" },
  { name: "company_phone", desc: "Telefon" },
  { name: "company_email", desc: "E-mail firmy" },
  { name: "primary_color", desc: "Kolor główny (hex)" },
  { name: "current_year", desc: "Aktualny rok" },
  { name: "guest_notes", desc: "Uwagi gościa" },
];

const HTML_VARIABLES = [
  { name: "resources_list_html", desc: "Lista zakwaterowania (HTML)" },
  { name: "logo_block_html", desc: "Blok logo (HTML)" },
];

interface Props {
  type: string;
}

export function EmailTemplateEditor({ type }: Props) {
  const router = useRouter();
  const { success: showSuccess, error: showError } = useToast();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [subject, setSubject] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");
  const [defaultSubject, setDefaultSubject] = useState("");
  const [defaultBodyHtml, setDefaultBodyHtml] = useState("");
  const [isCustom, setIsCustom] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewHtml, setPreviewHtml] = useState("");
  const [previewSubject, setPreviewSubject] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [testSending, setTestSending] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Debounce timer + AbortController for live preview
  const previewTimer = useRef<any>(null);
  const previewAbort = useRef<AbortController | null>(null);

  const label = TEMPLATE_LABELS[type.toUpperCase()] || type;

  // Load template
  const load = useCallback(async () => {
    try {
      const data = await apiFetch(`/api/settings/email/templates/${type}`);
      setSubject(data.subject);
      setBodyHtml(data.bodyHtml);
      setDefaultSubject(data.defaultSubject);
      setDefaultBodyHtml(data.defaultBodyHtml);
      setIsCustom(data.isCustom);
    } catch {
      showError("Nie udało się załadować szablonu");
    }
    setLoading(false);
  }, [type]);

  useEffect(() => { load(); }, [load]);

  // Live preview with debounce + cancel stale requests
  const fetchPreview = useCallback(async (s: string, b: string) => {
    if (!b.trim()) {
      setPreviewHtml("");
      setPreviewSubject("");
      return;
    }
    // Cancel previous request
    if (previewAbort.current) previewAbort.current.abort();
    const controller = new AbortController();
    previewAbort.current = controller;

    setPreviewLoading(true);
    try {
      const res = await fetch("/api/settings/email/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: type.toUpperCase(), subject: s, bodyHtml: b }),
        signal: controller.signal,
      });
      if (!res.ok) throw new Error();
      const json = await res.json();
      if (json.success && json.data) {
        setPreviewHtml(json.data.html);
        setPreviewSubject(json.data.subject);
      }
    } catch (e: any) {
      // Ignore AbortError (expected when cancelled)
      if (e.name !== "AbortError") { /* silent */ }
    }
    setPreviewLoading(false);
  }, [type]);

  // Trigger preview on changes
  useEffect(() => {
    if (loading) return;
    if (previewTimer.current) clearTimeout(previewTimer.current);
    previewTimer.current = setTimeout(() => fetchPreview(subject, bodyHtml), 600);
    return () => { if (previewTimer.current) clearTimeout(previewTimer.current); };
  }, [subject, bodyHtml, loading, fetchPreview]);

  // Track changes
  useEffect(() => {
    if (!loading) setHasChanges(true);
  }, [subject, bodyHtml]);

  // Insert variable at cursor
  function insertVariable(varName: string) {
    const el = textareaRef.current;
    if (!el) return;
    const tag = `{{${varName}}}`;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const before = bodyHtml.slice(0, start);
    const after = bodyHtml.slice(end);
    const newValue = before + tag + after;
    setBodyHtml(newValue);
    // Restore cursor position after tag
    requestAnimationFrame(() => {
      el.focus();
      el.selectionStart = el.selectionEnd = start + tag.length;
    });
  }

  // Save
  async function handleSave() {
    if (!subject.trim()) { showError("Temat wiadomości jest wymagany"); return; }
    if (!bodyHtml.trim()) { showError("Treść HTML jest wymagana"); return; }
    setSaving(true);
    try {
      await apiFetch(`/api/settings/email/templates/${type}`, {
        method: "PUT",
        body: { subject, bodyHtml },
      });
      setIsCustom(true);
      setHasChanges(false);
      showSuccess("Szablon zapisany");
    } catch (e: any) {
      showError(e.message || "Błąd zapisu");
    }
    setSaving(false);
  }

  // Reset to default
  async function handleReset() {
    try {
      await apiFetch(`/api/settings/email/templates/${type}`, { method: "DELETE" });
      setSubject(defaultSubject);
      setBodyHtml(defaultBodyHtml);
      setIsCustom(false);
      setHasChanges(false);
      showSuccess("Przywrócono domyślny szablon");
    } catch (e: any) {
      showError(e.message || "Błąd resetu");
    }
    setShowReset(false);
  }

  // Send test from current editor content (unsaved draft)
  async function handleSendTest() {
    setTestSending(true);
    try {
      await apiFetch("/api/settings/email/test", {
        method: "POST",
        body: { toAddress: undefined }, // sends to current user's email
      });
      showSuccess("E-mail testowy wysłany na Twój adres");
    } catch (e: any) {
      showError(e.message || "Błąd wysyłki testowej");
    }
    setTestSending(false);
  }

  // Fullscreen preview
  function openFullPreview() {
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(previewHtml);
      win.document.close();
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 fade-in-up">
        <div className="h-9 w-32 bg-muted shimmer rounded-xl" />
        <div className="h-8 w-64 bg-muted shimmer rounded" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="h-96 bg-muted shimmer rounded-2xl" />
          <div className="h-96 bg-muted shimmer rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 fade-in-up">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.push("/admin/global-settings/email-templates")}
          className="btn-bubble btn-secondary-bubble px-3 py-2 text-[13px]">
          <ArrowLeft className="h-4 w-4" /> Wróć
        </button>
        <div className="flex-1">
          <h2 className="text-lg font-bold tracking-tight">{label}</h2>
          <p className="text-[12px] text-muted-foreground">
            {isCustom ? "Własny szablon" : "Domyślny szablon"} · Edytuj HTML i obserwuj podgląd na żywo
          </p>
        </div>
      </div>

      {/* Subject */}
      <div>
        <label className="text-[12px] font-semibold text-muted-foreground block mb-1.5">Temat wiadomości</label>
        <input
          type="text"
          value={subject}
          onChange={e => setSubject(e.target.value)}
          placeholder="Potwierdzenie rezerwacji {{reservation_number}}"
          className="input-bubble h-11 w-full text-[14px]"
        />
      </div>

      {/* Editor + Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left: Code editor */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-semibold text-muted-foreground flex items-center gap-1.5">
              <Code2 className="h-3.5 w-3.5" /> Kod HTML
            </span>
            <span className="text-[10px] text-muted-foreground">{bodyHtml.length.toLocaleString()} znaków</span>
          </div>
          <textarea
            ref={textareaRef}
            value={bodyHtml}
            onChange={e => setBodyHtml(e.target.value)}
            spellCheck={false}
            className="w-full h-[500px] rounded-2xl border-2 border-border bg-muted/30 px-4 py-3 font-mono text-[12px] leading-relaxed resize-none focus:border-primary focus:outline-none transition-colors"
            placeholder="<!DOCTYPE html>..."
          />

          {/* Variable legend */}
          <div className="bubble">
            <div className="px-4 py-3">
              <p className="text-[12px] font-semibold mb-2 flex items-center gap-1.5">
                <Type className="h-3.5 w-3.5 text-primary" /> Dostępne zmienne
              </p>
              <p className="text-[10px] text-muted-foreground mb-3">Kliknij zmienną, aby wstawić ją do edytora w miejscu kursora.</p>

              <div className="mb-3">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Tekst (escaped)</p>
                <div className="flex flex-wrap gap-1">
                  {TEXT_VARIABLES.map(v => (
                    <button key={v.name} onClick={() => insertVariable(v.name)}
                      title={v.desc}
                      className="inline-flex items-center px-2 py-1 rounded-lg bg-muted hover:bg-primary/10 hover:text-primary text-[10px] font-mono transition-colors">
                      {`{{${v.name}}}`}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-1.5">HTML (trusted — bez escapowania)</p>
                <div className="flex flex-wrap gap-1">
                  {HTML_VARIABLES.map(v => (
                    <button key={v.name} onClick={() => insertVariable(v.name)}
                      title={v.desc}
                      className="inline-flex items-center px-2 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 text-[10px] font-mono transition-colors">
                      {`{{${v.name}}}`}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Live preview */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-semibold text-muted-foreground flex items-center gap-1.5">
              <Eye className="h-3.5 w-3.5" /> Podgląd na żywo
              {previewLoading && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
            </span>
            {previewSubject && (
              <span className="text-[10px] text-muted-foreground truncate max-w-[250px]">
                Temat: {previewSubject}
              </span>
            )}
          </div>
          <div className="rounded-2xl border-2 border-border bg-white overflow-hidden" style={{ height: 500 }}>
            {previewHtml ? (
              <iframe
                srcDoc={previewHtml}
                title="Preview"
                className="w-full h-full border-0"
                sandbox="allow-same-origin"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-[13px] text-muted-foreground">
                Wpisz kod HTML, aby zobaczyć podgląd
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/50">
        <button onClick={handleSave} disabled={saving}
          className="btn-bubble btn-primary-bubble px-5 py-2.5 text-[13px] disabled:opacity-50">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? "Zapisuję..." : "Zapisz szablon"}
        </button>
        <button onClick={openFullPreview} disabled={!previewHtml}
          className="btn-bubble btn-secondary-bubble px-4 py-2.5 text-[13px] disabled:opacity-50">
          <Eye className="h-4 w-4" /> Podgląd pełnoekranowy
        </button>
        <button onClick={handleSendTest} disabled={testSending}
          className="btn-bubble btn-secondary-bubble px-4 py-2.5 text-[13px] disabled:opacity-50">
          {testSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Wyślij testowy
        </button>
        {isCustom && (
          <button onClick={() => setShowReset(true)}
            className="btn-bubble btn-secondary-bubble px-4 py-2.5 text-[13px] text-destructive hover:border-destructive">
            <RotateCcw className="h-4 w-4" /> Przywróć domyślny
          </button>
        )}
      </div>

      {/* Reset confirm dialog */}
      <ConfirmDialog
        open={showReset}
        onCancel={() => setShowReset(false)}
        onConfirm={handleReset}
        title="Przywróć domyślny szablon"
        message="Czy na pewno chcesz przywrócić domyślny szablon? Twoje zmiany zostaną utracone."
        confirmLabel="Przywróć"
        variant="danger"
      />
    </div>
  );
}
