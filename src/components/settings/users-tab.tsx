"use client";

/**
 * UsersTab — User management with elegant compact cards.
 *
 * D0: Card grid layout, avatar upload in SlidePanel.
 * Design: compact horizontal cards, avatar prominent, info dense.
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Plus, Pencil, UserX, UserCheck, KeyRound, Loader2, Copy, Check,
  Mail, Phone, Clock, Shield, Camera, Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api-fetch";
import { SlidePanel } from "@/components/ui/slide-panel";
import { Tooltip } from "@/components/ui/tooltip";
import { BubbleSelect } from "@/components/ui/bubble-select";
import { useToast } from "@/components/ui/toast";

const ROLE_OPTIONS = [
  { value: "OWNER", label: "Właściciel" },
  { value: "MANAGER", label: "Kierownik" },
  { value: "RECEPTION", label: "Recepcja" },
];

const ROLE_LABELS: Record<string, string> = { OWNER: "Właściciel", MANAGER: "Kierownik", RECEPTION: "Recepcja" };
const ROLE_COLORS: Record<string, string> = {
  OWNER: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  MANAGER: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  RECEPTION: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
};

interface UserRow {
  id: string; email: string; firstName: string; lastName: string;
  role: string; phone: string | null; isActive: boolean; avatar: string | null;
  lastLoginAt: string | null; createdAt: string;
}

function getInitials(f: string, l: string) { return ((f?.[0] || "") + (l?.[0] || "")).toUpperCase(); }

function fmtDate(d: string | null) {
  if (!d) return null;
  return new Date(d).toLocaleDateString("pl-PL", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function UsersTab() {
  const toast = useToast();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [panelOpen, setPanelOpen] = useState(false);
  const [editUser, setEditUser] = useState<UserRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [confirmDeactivate, setConfirmDeactivate] = useState<UserRow | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", role: "RECEPTION" });

  const load = useCallback(async () => {
    try {
      const data = await apiFetch("/api/users");
      setUsers(data.users || []);
    } catch { /* */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    apiFetch("/api/auth/me").then(d => setCurrentUserId(d.user?.id || null)).catch(() => {});
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditUser(null);
    setForm({ firstName: "", lastName: "", email: "", phone: "", role: "RECEPTION" });
    setTempPassword(null); setConfirmReset(false); setAvatarPreview(null);
    setPanelOpen(true);
  };

  const openEdit = (u: UserRow) => {
    setEditUser(u);
    setForm({ firstName: u.firstName, lastName: u.lastName, email: u.email, phone: u.phone || "", role: u.role });
    setTempPassword(null); setConfirmReset(false); setAvatarPreview(u.avatar || null);
    setPanelOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editUser) {
        await apiFetch(`/api/users/${editUser.id}`, { method: "PATCH", body: JSON.stringify(form) });
        toast.success("Użytkownik zaktualizowany");
        setPanelOpen(false);
      } else {
        const data = await apiFetch("/api/users", { method: "POST", body: JSON.stringify(form) });
        setTempPassword(data.tempPassword);
        toast.success("Użytkownik utworzony");
      }
      load();
    } catch (err: any) { toast.error(err?.message || "Błąd zapisu"); }
    finally { setSaving(false); }
  };

  const handleDeactivate = async (u: UserRow) => {
    try {
      await apiFetch(`/api/users/${u.id}/deactivate`, { method: "POST", body: JSON.stringify({ activate: !u.isActive }) });
      toast.success(u.isActive ? "Użytkownik deaktywowany" : "Użytkownik aktywowany");
      setConfirmDeactivate(null);
      load();
    } catch (err: any) { toast.error(err?.message || "Błąd"); }
  };

  const handleResetPassword = async () => {
    if (!editUser) return;
    setResetting(true);
    try {
      const data = await apiFetch(`/api/users/${editUser.id}/reset-password`, { method: "POST" });
      setTempPassword(data.tempPassword);
      setConfirmReset(false);
      toast.success("Nowe hasło wygenerowane");
    } catch (err: any) { toast.error(err?.message || "Błąd"); }
    finally { setResetting(false); }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editUser) return;

    // Preview immediately
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    // Upload
    setUploadingAvatar(true);
    try {
      const fd = new FormData();
      fd.append("avatar", file);
      const res = await fetch(`/api/users/${editUser.id}/avatar`, { method: "POST", body: fd });
      const data = await res.json();
      if (data.success) {
        setAvatarPreview(data.data.avatar);
        toast.success("Zdjęcie zaktualizowane");
        load();
      } else {
        toast.error(data.error || "Błąd uploadu");
        setAvatarPreview(editUser.avatar || null);
      }
    } catch { toast.error("Błąd uploadu"); setAvatarPreview(editUser.avatar || null); }
    finally { setUploadingAvatar(false); if (fileInputRef.current) fileInputRef.current.value = ""; }
  };

  const handleAvatarRemove = async () => {
    if (!editUser) return;
    try {
      await fetch(`/api/users/${editUser.id}/avatar`, { method: "DELETE" });
      setAvatarPreview(null);
      toast.success("Zdjęcie usunięte");
      load();
    } catch { toast.error("Błąd usuwania"); }
  };

  const copyPassword = () => {
    if (!tempPassword) return;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(tempPassword);
      } else {
        const ta = document.createElement("textarea");
        ta.value = tempPassword;
        ta.style.position = "fixed"; ta.style.left = "-9999px";
        document.body.appendChild(ta); ta.select();
        document.execCommand("copy"); document.body.removeChild(ta);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { toast.error("Zaznacz hasło ręcznie i skopiuj"); }
  };

  const isSelf = (u: UserRow) => u.id === currentUserId;

  return (
    <div className="space-y-4">
      {/* Add button */}
      <div className="flex items-center justify-end">
        <button onClick={openCreate} className="btn-bubble btn-primary-bubble px-5 py-2.5 text-[13px] font-semibold flex items-center gap-1.5">
          <Plus className="h-4 w-4" /> Dodaj użytkownika
        </button>
      </div>

      {/* Card grid */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : users.length === 0 ? (
        <div className="bubble text-center py-16">
          <Shield className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-[13px] text-muted-foreground">Brak użytkowników</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {users.map(u => (
            <div key={u.id} onClick={() => openEdit(u)} className={cn(
              "bubble-interactive group transition-all cursor-pointer",
              !u.isActive && "opacity-50"
            )}>
              {/* Card body */}
              <div className="flex gap-4 p-4">
                {/* Avatar */}
                <div className="shrink-0">
                  {u.avatar ? (
                    <img src={u.avatar} alt="" className="h-12 w-12 rounded-2xl object-cover" />
                  ) : (
                    <div className={cn(
                      "h-12 w-12 rounded-2xl flex items-center justify-center text-[15px] font-bold",
                      u.isActive ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                    )}>
                      {getInitials(u.firstName, u.lastName)}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="text-[14px] font-semibold leading-tight truncate">
                      {u.firstName} {u.lastName}
                    </h3>
                    {isSelf(u) && <span className="text-[10px] text-muted-foreground shrink-0">(Ty)</span>}
                  </div>
                  <span className={cn(
                    "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold",
                    ROLE_COLORS[u.role]
                  )}>
                    {ROLE_LABELS[u.role] || u.role}
                  </span>
                  <div className="mt-2 space-y-1">
                    <InfoLine icon={Mail} value={u.email} />
                    {u.phone && <InfoLine icon={Phone} value={u.phone} />}
                  </div>
                </div>

                {/* Hover actions */}
                <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                  onClick={e => e.stopPropagation()}>
                  <Tooltip content="Edytuj">
                  <button onClick={() => openEdit(u)}
                    className="h-8 w-8 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-all">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  </Tooltip>
                  {!isSelf(u) && (
                    <Tooltip content={u.isActive ? "Dezaktywuj" : "Aktywuj"}>
                    <button onClick={() => setConfirmDeactivate(u)}
                      className={cn("h-8 w-8 rounded-xl flex items-center justify-center transition-all",
                        u.isActive ? "text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                          : "text-muted-foreground hover:bg-emerald-100 hover:text-emerald-700 dark:hover:bg-emerald-900/20"
                      )}>
                      {u.isActive ? <UserX className="h-3.5 w-3.5" /> : <UserCheck className="h-3.5 w-3.5" />}
                    </button>
                    </Tooltip>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-4 py-2.5 border-t border-border/30">
                <span className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                  u.isActive
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                    : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                )}>
                  <span className={cn("h-1.5 w-1.5 rounded-full", u.isActive ? "bg-emerald-500" : "bg-red-500")} />
                  {u.isActive ? "Aktywny" : "Nieaktywny"}
                </span>
                <span className="text-[10px] text-muted-foreground/50">
                  {fmtDate(u.lastLoginAt) || "Nigdy"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirm deactivate dialog */}
      {confirmDeactivate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setConfirmDeactivate(null)}>
          <div className="bubble mx-4 w-full max-w-[400px] p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-[16px] font-bold mb-2">
              {confirmDeactivate.isActive ? "Dezaktywuj użytkownika?" : "Aktywuj użytkownika?"}
            </h3>
            <p className="text-[13px] text-muted-foreground mb-5">
              {confirmDeactivate.isActive
                ? `${confirmDeactivate.firstName} ${confirmDeactivate.lastName} straci dostęp do panelu natychmiast.`
                : `${confirmDeactivate.firstName} ${confirmDeactivate.lastName} odzyska dostęp do panelu.`}
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setConfirmDeactivate(null)}
                className="btn-bubble btn-secondary-bubble px-4 py-2 text-[13px] font-semibold">Anuluj</button>
              <button onClick={() => handleDeactivate(confirmDeactivate)}
                className={cn("btn-bubble px-4 py-2 text-[13px] font-semibold",
                  confirmDeactivate.isActive ? "btn-danger-bubble" : "btn-primary-bubble"
                )}>
                {confirmDeactivate.isActive ? "Dezaktywuj" : "Aktywuj"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SlidePanel — Add / Edit */}
      <SlidePanel open={panelOpen} onClose={() => { setPanelOpen(false); setTempPassword(null); }}
        title={editUser ? "Edytuj użytkownika" : "Nowy użytkownik"} width={440}>

        {/* Avatar upload — only in edit mode */}
        {editUser && (
          <div className="flex items-center gap-4 mb-6">
            <div className="relative group/av">
              {avatarPreview ? (
                <img src={avatarPreview} alt="" className="h-16 w-16 rounded-2xl object-cover" />
              ) : (
                <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center text-[20px] font-bold text-primary">
                  {getInitials(editUser.firstName, editUser.lastName)}
                </div>
              )}
              <button onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 rounded-2xl bg-black/0 group-hover/av:bg-black/40 flex items-center justify-center transition-all">
                <Camera className="h-5 w-5 text-white opacity-0 group-hover/av:opacity-100 transition-opacity" />
              </button>
              {uploadingAvatar && (
                <div className="absolute inset-0 rounded-2xl bg-black/40 flex items-center justify-center">
                  <Loader2 className="h-5 w-5 text-white animate-spin" />
                </div>
              )}
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp"
                className="hidden" onChange={handleAvatarUpload} />
            </div>
            <div>
              <button onClick={() => fileInputRef.current?.click()}
                className="text-[12px] font-semibold text-primary hover:underline">
                Zmień zdjęcie
              </button>
              {avatarPreview && (
                <button onClick={handleAvatarRemove}
                  className="text-[12px] font-semibold text-destructive hover:underline ml-3">
                  Usuń
                </button>
              )}
              <p className="text-[10px] text-muted-foreground mt-0.5">JPG, PNG lub WebP, max 5 MB</p>
            </div>
          </div>
        )}

        {/* Temp password */}
        {tempPassword && (
          <div className="mb-6 rounded-2xl border-2 border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 px-4 py-3.5">
            <div className="flex items-center gap-2 mb-2">
              <KeyRound className="h-4 w-4 text-amber-600" />
              <span className="text-[13px] font-semibold text-amber-800 dark:text-amber-300">Tymczasowe hasło</span>
            </div>
            <p className="text-[11px] text-amber-700 dark:text-amber-400 mb-2">
              Skopiuj teraz — nie będzie widoczne ponownie.
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-white dark:bg-gray-900 px-3 py-2 rounded-xl text-[13px] font-mono border border-amber-200 dark:border-amber-800 select-all">
                {tempPassword}
              </code>
              <button onClick={copyPassword}
                className="btn-bubble btn-secondary-bubble h-9 px-3 text-[12px] font-semibold flex items-center gap-1.5">
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Skopiowano" : "Kopiuj"}
              </button>
            </div>
          </div>
        )}

        {/* Form */}
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[12px] font-semibold text-muted-foreground block mb-1.5">Imię</label>
              <input type="text" value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })}
                className="input-bubble h-11 w-full text-[13px]" placeholder="Jan" />
            </div>
            <div>
              <label className="text-[12px] font-semibold text-muted-foreground block mb-1.5">Nazwisko</label>
              <input type="text" value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })}
                className="input-bubble h-11 w-full text-[13px]" placeholder="Kowalski" />
            </div>
          </div>
          <div>
            <label className="text-[12px] font-semibold text-muted-foreground block mb-1.5">Email</label>
            <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
              className="input-bubble h-11 w-full text-[13px]" placeholder="jan@zielonewzgorza.eu" />
          </div>
          <div>
            <label className="text-[12px] font-semibold text-muted-foreground block mb-1.5">Telefon</label>
            <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
              className="input-bubble h-11 w-full text-[13px]" placeholder="+48 600 100 200" />
          </div>
          <BubbleSelect label="Rola" options={ROLE_OPTIONS} value={form.role}
            onChange={v => setForm({ ...form, role: v })} />

          <div className="flex gap-3 pt-2">
            <button onClick={handleSave} disabled={saving || !form.firstName || !form.lastName || !form.email}
              className="btn-bubble btn-primary-bubble px-5 py-2.5 text-[13px] font-semibold flex items-center gap-1.5 disabled:opacity-50">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              {saving ? "Zapisywanie..." : editUser ? "Zapisz" : "Utwórz"}
            </button>
            <button onClick={() => { setPanelOpen(false); setTempPassword(null); }}
              className="btn-bubble btn-secondary-bubble px-5 py-2.5 text-[13px] font-semibold">Anuluj</button>
          </div>

          {/* Reset password */}
          {editUser && !tempPassword && (
            <div className="pt-4 border-t border-border/50">
              {!confirmReset ? (
                <button onClick={() => setConfirmReset(true)}
                  className="btn-bubble btn-danger-bubble px-4 py-2 text-[13px] font-semibold flex items-center gap-1.5">
                  <KeyRound className="h-3.5 w-3.5" /> Wygeneruj nowe hasło
                </button>
              ) : (
                <div className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3.5">
                  <p className="text-[13px] font-semibold text-foreground mb-1">Wygenerować nowe hasło?</p>
                  <p className="text-[11px] text-muted-foreground mb-3">
                    Dotychczasowe hasło {editUser.firstName} {editUser.lastName} przestanie działać natychmiast.
                  </p>
                  <div className="flex gap-3">
                    <button onClick={handleResetPassword} disabled={resetting}
                      className="btn-bubble btn-danger-bubble px-4 py-2 text-[13px] font-semibold flex items-center gap-1.5 disabled:opacity-50">
                      {resetting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <KeyRound className="h-3.5 w-3.5" />}
                      {resetting ? "Generowanie..." : "Tak, wygeneruj"}
                    </button>
                    <button onClick={() => setConfirmReset(false)}
                      className="btn-bubble btn-secondary-bubble px-4 py-2 text-[13px] font-semibold">Anuluj</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </SlidePanel>
    </div>
  );
}

function InfoLine({ icon: Icon, value, muted = false }: { icon: React.ElementType; value: string; muted?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className={cn("h-3 w-3 shrink-0", muted ? "text-muted-foreground/30" : "text-muted-foreground/60")} />
      <span className={cn("text-[12px] truncate", muted ? "text-muted-foreground/40" : "text-muted-foreground")}>
        {value}
      </span>
    </div>
  );
}
