"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Mail, Building2, Clock, Send, CheckCircle2, AlertCircle,
  Loader2, Server, Bell, ChevronDown, ChevronRight,
} from "lucide-react";
import { apiFetch } from "@/lib/api-fetch";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

interface EmailConfig {
  senderEmail: string | null;
  senderName: string;
  replyToEmail: string | null;
  bankAccountName: string;
  bankAccountIban: string;
  bankName: string;
  reminderEnabled: boolean;
  reminderDays: number;
  maxReminders: number;
}

interface SmtpField {
  ok: boolean;
  value: string | null;
}

interface SmtpStatus {
  configured: boolean;
  dryRun: boolean;
  fields: {
    host: SmtpField;
    port: SmtpField;
    secure: SmtpField;
    user: SmtpField;
    password: SmtpField;
  };
}

export function EmailSettingsContent() {
  const { success: showSuccess, error: showError } = useToast();
  const [config, setConfig] = useState<EmailConfig | null>(null);
  const [smtp, setSmtp] = useState<SmtpStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testAddress, setTestAddress] = useState("");
  const [testSending, setTestSending] = useState(false);

  // Collapsible section states
  const [senderOpen, setSenderOpen] = useState(true);
  const [bankOpen, setBankOpen] = useState(true);
  const [reminderOpen, setReminderOpen] = useState(true);
  const [testOpen, setTestOpen] = useState(true);
  const [smtpOpen, setSmtpOpen] = useState(true);

  // SMTP connection test
  const [connTesting, setConnTesting] = useState(false);
  const [connResult, setConnResult] = useState<{ success: boolean; message: string; error?: string } | null>(null);

  const loadConfig = useCallback(async () => {
    try {
      const data = await apiFetch("/api/settings/email");
      setConfig(data.config);
      setSmtp(data.smtp);
    } catch {
      showError("Nie udało się załadować konfiguracji email");
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadConfig(); }, [loadConfig]);

  async function saveField(field: string, value: any) {
    setSaving(true);
    try {
      const data = await apiFetch("/api/settings/email", { method: "PATCH", body: { [field]: value } });
      setConfig(data.config);
      showSuccess("Zapisano");
    } catch (e: any) {
      showError(e.message || "Błąd zapisu");
    }
    setSaving(false);
  }

  async function handleTestEmail() {
    if (!testAddress.trim()) {
      showError("Wpisz adres email do testu");
      return;
    }
    setTestSending(true);
    try {
      const data = await apiFetch("/api/settings/email/test", {
        method: "POST",
        body: { toAddress: testAddress.trim() },
      });
      showSuccess(data.message || `E-mail testowy wysłany na ${testAddress.trim()}`);
    } catch (e: any) {
      showError(e.message || "Nie udało się wysłać e-maila testowego");
    }
    setTestSending(false);
  }

  async function handleTestConnection() {
    setConnTesting(true);
    setConnResult(null);
    try {
      const data = await apiFetch("/api/settings/email/test-connection", { method: "POST" });
      setConnResult(data);
    } catch (e: any) {
      setConnResult({ success: false, message: e.message || "Błąd testu połączenia" });
    }
    setConnTesting(false);
  }

  if (loading || !config) {
    return (
      <div className="space-y-4 max-w-[800px]">
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

      {/* ── Konfiguracja SMTP (collapsible diagnostic panel) ── */}
      <div className={cn("bubble border-2", smtp?.configured ? (smtp.dryRun ? "border-amber-300" : "border-emerald-300") : "border-destructive/30")}>
        <button onClick={() => setSmtpOpen(!smtpOpen)}
          className="w-full flex items-center gap-3 px-5 py-4 hover:bg-muted/20 transition-colors">
          <div className={cn("h-8 w-8 rounded-xl flex items-center justify-center shrink-0",
            smtp?.configured ? (smtp.dryRun ? "bg-amber-100" : "bg-emerald-100") : "bg-destructive/10"
          )}>
            <Server className={cn("h-4 w-4", smtp?.configured ? (smtp.dryRun ? "text-amber-600" : "text-emerald-600") : "text-destructive")} />
          </div>
          <div className="flex-1 text-left">
            <h3 className="text-[14px] font-semibold">Konfiguracja SMTP</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {smtp?.configured
                ? (smtp.dryRun ? "Połączenie skonfigurowane, tryb dry-run (emaile nie są wysyłane)." : "Serwer SMTP aktywny, emaile są wysyłane.")
                : "Brak konfiguracji — ustaw zmienne SMTP w pliku .env na serwerze."}
            </p>
          </div>
          <div className={cn("h-3 w-3 rounded-full shrink-0", smtp?.configured ? (smtp.dryRun ? "bg-amber-400" : "bg-emerald-400") : "bg-destructive")} />
          {smtpOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
        </button>
        <div className={`section-collapse ${smtpOpen ? "section-open" : ""}`}>
          <div className="section-collapse-inner">
            <div className="border-t border-border/50 px-5 py-4 space-y-3">
              {/* Per-field diagnostics */}
              {smtp?.fields && (
                <div className="space-y-2">
                  {[
                    { label: "Host (SMTP_HOST)", field: smtp.fields.host },
                    { label: "Port (SMTP_PORT)", field: smtp.fields.port },
                    { label: "Szyfrowanie (SMTP_SECURE)", field: smtp.fields.secure },
                    { label: "Login (SMTP_USER)", field: smtp.fields.user },
                    { label: "Hasło (SMTP_PASSWORD)", field: smtp.fields.password },
                  ].map(({ label, field }) => (
                    <div key={label} className="flex items-start gap-2 py-1.5">
                      <div className={cn("h-2.5 w-2.5 rounded-full shrink-0 mt-1", field.ok ? "bg-emerald-400" : "bg-destructive")} />
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] text-muted-foreground">{label}</p>
                        <p className={cn("text-[12px] font-mono break-all", field.ok ? "text-foreground" : "text-destructive")}>
                          {field.value || "— nie ustawione —"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Dry-run warning */}
              {smtp?.dryRun && (
                <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
                  <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[12px] font-semibold text-amber-700">Tryb dry-run aktywny</p>
                    <p className="text-[11px] text-amber-600">Emaile są logowane, ale nie wysyłane. Zmień EMAIL_DRY_RUN=false w .env i zrestartuj PM2.</p>
                  </div>
                </div>
              )}

              {/* Test connection button */}
              <div className="pt-1">
                <button onClick={handleTestConnection} disabled={connTesting || !smtp?.configured}
                  className="btn-bubble btn-secondary-bubble px-4 py-2 text-[12px] disabled:opacity-50">
                  {connTesting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Server className="h-3.5 w-3.5" />}
                  {connTesting ? "Testuję..." : "Testuj połączenie"}
                </button>
              </div>

              {/* Connection test result */}
              {connResult && (
                <div className={cn(
                  "flex items-start gap-2 px-3 py-2.5 rounded-xl text-[12px]",
                  connResult.success ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-destructive/5 text-destructive border border-destructive/20"
                )}>
                  {connResult.success ? <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" /> : <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />}
                  <div>
                    <p className="font-semibold">{connResult.message}</p>
                    {connResult.error && <p className="text-[11px] mt-0.5 opacity-75 font-mono">{connResult.error}</p>}
                  </div>
                </div>
              )}

              <p className="text-[10px] text-muted-foreground">Zmiana konfiguracji SMTP wymaga edycji pliku .env na serwerze i restartu PM2.</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Nadawca (collapsible) ── */}
      <div className="bubble">
        <button onClick={() => setSenderOpen(!senderOpen)}
          className="w-full flex items-center gap-3 px-5 py-4 hover:bg-muted/20 transition-colors">
          <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Mail className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 text-left">
            <h3 className="text-[14px] font-semibold">Nadawca</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">Dane nadawcy widoczne w nagłówku e-maili wysyłanych do klientów.</p>
          </div>
          {senderOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
        </button>
        <div className={`section-collapse ${senderOpen ? "section-open" : ""}`}>
          <div className="section-collapse-inner">
            <div className="border-t border-border/50 px-5 py-5 space-y-4">
              <div>
                <label className="text-[12px] font-semibold text-muted-foreground block mb-1.5">Nazwa nadawcy</label>
                <input type="text" value={config.senderName || ""}
                  onChange={(e) => setConfig(prev => prev ? { ...prev, senderName: e.target.value } : prev)}
                  onBlur={(e) => saveField("senderName", e.target.value)}
                  placeholder="Zielone Wzgórza" className="input-bubble h-11 w-full text-[14px]" />
              </div>
              <div>
                <label className="text-[12px] font-semibold text-muted-foreground block mb-1.5">Adres email nadawcy</label>
                <input type="email" value={config.senderEmail || ""}
                  onChange={(e) => setConfig(prev => prev ? { ...prev, senderEmail: e.target.value } : prev)}
                  onBlur={(e) => saveField("senderEmail", e.target.value)}
                  placeholder="system@zielonewzgorza.eu" className="input-bubble h-11 w-full text-[14px]" />
                <p className="text-[10px] text-muted-foreground mt-1">Widoczny dla klienta jako nadawca. Musi być zgodny z kontem SMTP.</p>
              </div>
              <div>
                <label className="text-[12px] font-semibold text-muted-foreground block mb-1.5">Adres do odpowiedzi (opcjonalny)</label>
                <input type="email" value={config.replyToEmail || ""}
                  onChange={(e) => setConfig(prev => prev ? { ...prev, replyToEmail: e.target.value } : prev)}
                  onBlur={(e) => saveField("replyToEmail", e.target.value)}
                  placeholder="kontakt@zielonewzgorza.eu" className="input-bubble h-11 w-full text-[14px]" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Dane do przelewu (collapsible) ── */}
      <div className="bubble">
        <button onClick={() => setBankOpen(!bankOpen)}
          className="w-full flex items-center gap-3 px-5 py-4 hover:bg-muted/20 transition-colors">
          <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Building2 className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 text-left">
            <h3 className="text-[14px] font-semibold">Dane do przelewu</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">Informacje bankowe wyświetlane w e-mailach i na stronie rezerwacji klienta.</p>
          </div>
          {bankOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
        </button>
        <div className={`section-collapse ${bankOpen ? "section-open" : ""}`}>
          <div className="section-collapse-inner">
            <div className="border-t border-border/50 px-5 py-5 space-y-4">
              <div>
                <label className="text-[12px] font-semibold text-muted-foreground block mb-1.5">Nazwa odbiorcy</label>
                <input type="text" value={config.bankAccountName || ""}
                  onChange={(e) => setConfig(prev => prev ? { ...prev, bankAccountName: e.target.value } : prev)}
                  onBlur={(e) => saveField("bankAccountName", e.target.value)}
                  className="input-bubble h-11 w-full text-[14px]" />
              </div>
              <div>
                <label className="text-[12px] font-semibold text-muted-foreground block mb-1.5">Numer konta (IBAN)</label>
                <input type="text" value={config.bankAccountIban || ""}
                  onChange={(e) => setConfig(prev => prev ? { ...prev, bankAccountIban: e.target.value } : prev)}
                  onBlur={(e) => saveField("bankAccountIban", e.target.value)}
                  className="input-bubble h-11 w-full text-[14px] font-mono" />
              </div>
              <div>
                <label className="text-[12px] font-semibold text-muted-foreground block mb-1.5">Nazwa banku</label>
                <input type="text" value={config.bankName || ""}
                  onChange={(e) => setConfig(prev => prev ? { ...prev, bankName: e.target.value } : prev)}
                  onBlur={(e) => saveField("bankName", e.target.value)}
                  className="input-bubble h-11 w-full text-[14px]" />
              </div>
              <p className="text-[10px] text-muted-foreground">Te dane są wyświetlane w emailach z potwierdzeniem rezerwacji i na stronie rezerwacji klienta.</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Przypomnienia o wpłacie (collapsible) ── */}
      <div className="bubble">
        <button onClick={() => setReminderOpen(!reminderOpen)}
          className="w-full flex items-center gap-3 px-5 py-4 hover:bg-muted/20 transition-colors">
          <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Bell className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 text-left">
            <h3 className="text-[14px] font-semibold">Przypomnienia o wpłacie</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">Automatyczne przypomnienia dla rezerwacji oczekujących na wpłatę zaliczki.</p>
          </div>
          {reminderOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
        </button>
        <div className={`section-collapse ${reminderOpen ? "section-open" : ""}`}>
          <div className="section-collapse-inner">
            <div className="border-t border-border/50 px-5 py-5 space-y-4">
              <div>
                <button type="button" onClick={() => saveField("reminderEnabled", !config.reminderEnabled)}
                  className="flex items-center gap-3 w-full text-left">
                  <span className={cn(
                    "relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0",
                    config.reminderEnabled ? "bg-primary" : "bg-muted-foreground/20"
                  )}>
                    <span className={cn(
                      "inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform",
                      config.reminderEnabled ? "translate-x-6" : "translate-x-1"
                    )} />
                  </span>
                  <span className="text-[13px] font-medium">Wysyłaj przypomnienia o wpłacie</span>
                </button>
              </div>
              {config.reminderEnabled && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[12px] font-semibold text-muted-foreground block mb-1.5">Po ilu dniach (od rezerwacji)</label>
                    <input type="number" min={1} max={30} value={config.reminderDays}
                      onChange={(e) => setConfig(prev => prev ? { ...prev, reminderDays: parseInt(e.target.value) || 3 } : prev)}
                      onBlur={(e) => saveField("reminderDays", parseInt(e.target.value) || 3)}
                      className="input-bubble h-11 w-full text-[14px]" />
                  </div>
                  <div>
                    <label className="text-[12px] font-semibold text-muted-foreground block mb-1.5">Maks. przypomnień</label>
                    <input type="number" min={1} max={10} value={config.maxReminders}
                      onChange={(e) => setConfig(prev => prev ? { ...prev, maxReminders: parseInt(e.target.value) || 2 } : prev)}
                      onBlur={(e) => saveField("maxReminders", parseInt(e.target.value) || 2)}
                      className="input-bubble h-11 w-full text-[14px]" />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── E-mail testowy (collapsible) ── */}
      <div className="bubble">
        <button onClick={() => setTestOpen(!testOpen)}
          className="w-full flex items-center gap-3 px-5 py-4 hover:bg-muted/20 transition-colors">
          <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Send className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 text-left">
            <h3 className="text-[14px] font-semibold">E-mail testowy</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">Wyślij testową wiadomość, aby sprawdzić poprawność konfiguracji SMTP.</p>
          </div>
          {testOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
        </button>
        <div className={`section-collapse ${testOpen ? "section-open" : ""}`}>
          <div className="section-collapse-inner">
            <div className="border-t border-border/50 px-5 py-5 space-y-3">
              <div className="flex gap-2">
                <input type="email" value={testAddress}
                  onChange={(e) => setTestAddress(e.target.value)}
                  placeholder="twoj@email.pl"
                  className="input-bubble h-11 flex-1 text-[14px]"
                  onKeyDown={(e) => { if (e.key === "Enter") handleTestEmail(); }} />
                <button onClick={handleTestEmail}
                  disabled={testSending || !testAddress.trim()}
                  className="btn-bubble btn-primary-bubble px-5 h-11 text-[13px] disabled:opacity-50">
                  {testSending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Wyślij test"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Saving indicator */}
      {saving && (
        <div className="fixed bottom-4 right-4 bg-card border border-border rounded-xl px-3 py-2 shadow-lg flex items-center gap-2 text-[12px] text-muted-foreground z-50">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Zapisuję...
        </div>
      )}
    </div>
  );
}
