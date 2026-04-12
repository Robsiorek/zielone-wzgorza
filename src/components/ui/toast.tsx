"use client";

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
}

interface ToastContextValue {
  toast: (opts: Omit<Toast, "id">) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
  warning: (title: string, description?: string) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

const typeConfig: Record<ToastType, { icon: React.ElementType; iconBg: string; iconColor: string; accent: string }> = {
  success: {
    icon: CheckCircle2,
    iconBg: "bg-emerald-100 dark:bg-emerald-900/30",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    accent: "#10B981",
  },
  error: {
    icon: AlertCircle,
    iconBg: "bg-red-100 dark:bg-red-900/30",
    iconColor: "text-red-600 dark:text-red-400",
    accent: "#EF4444",
  },
  info: {
    icon: Info,
    iconBg: "bg-blue-100 dark:bg-blue-900/30",
    iconColor: "text-blue-600 dark:text-blue-400",
    accent: "#3B82F6",
  },
  warning: {
    icon: AlertTriangle,
    iconBg: "bg-amber-100 dark:bg-amber-900/30",
    iconColor: "text-amber-600 dark:text-amber-400",
    accent: "#F59E0B",
  },
};

function ToastItem({ toast: t, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const cfg = typeConfig[t.type];
  const Icon = cfg.icon;
  const [exiting, setExiting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const dismiss = useCallback(() => {
    setExiting(true);
    setTimeout(() => onDismiss(t.id), 200);
  }, [t.id, onDismiss]);

  useEffect(() => {
    const dur = t.duration ?? 4000;
    if (dur > 0) timerRef.current = setTimeout(dismiss, dur);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [t.duration, dismiss]);

  return (
    <div
      className={cn(
        "pointer-events-auto flex items-start gap-3 bg-card transition-all duration-200",
        exiting ? "opacity-0 translate-x-4" : "opacity-100 translate-x-0"
      )}
      style={{
        borderRadius: 16,
        border: "2px solid hsl(var(--border))",
        borderLeft: `4px solid ${cfg.accent}`,
        padding: "14px 16px",
        animation: exiting ? undefined : "toastIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) both",
        maxWidth: 400,
        width: "100%",
        boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
      }}
      role="alert"
    >
      <div className={cn("h-8 w-8 rounded-xl flex items-center justify-center shrink-0", cfg.iconBg)}>
        <Icon className={cn("h-4 w-4", cfg.iconColor)} />
      </div>
      <div className="flex-1 min-w-0 pt-0.5">
        <p className="text-[13px] font-semibold text-foreground leading-tight">{t.title}</p>
        {t.description && (
          <p className="text-[12px] text-muted-foreground mt-1 leading-snug">{t.description}</p>
        )}
      </div>
      <button onClick={dismiss}
        className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground/40 hover:text-foreground hover:bg-muted transition-all shrink-0">
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function Toaster({ toasts, dismiss }: { toasts: Toast[]; dismiss: (id: string) => void }) {
  if (toasts.length === 0) return null;
  return (
    <div className="fixed bottom-5 right-5 z-[600] flex flex-col-reverse gap-3 pointer-events-none"
      style={{ maxWidth: 400, width: "calc(100% - 40px)" }}>
      {toasts.map((t) => <ToastItem key={t.id} toast={t} onDismiss={dismiss} />)}
    </div>
  );
}

let globalId = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const dismiss = useCallback((id: string) => { setToasts((p) => p.filter((t) => t.id !== id)); }, []);
  const addToast = useCallback((opts: Omit<Toast, "id">) => {
    const id = `toast-${++globalId}-${Date.now()}`;
    setToasts((p) => [...p, { ...opts, id }]);
  }, []);

  const success = useCallback((title: string, description?: string) => addToast({ type: "success", title, description }), [addToast]);
  const error = useCallback((title: string, description?: string) => addToast({ type: "error", title, description }), [addToast]);
  const info = useCallback((title: string, description?: string) => addToast({ type: "info", title, description }), [addToast]);
  const warning = useCallback((title: string, description?: string) => addToast({ type: "warning", title, description }), [addToast]);

  return (
    <ToastContext.Provider value={{ toast: addToast, success, error, info, warning, dismiss }}>
      {children}
      <Toaster toasts={toasts} dismiss={dismiss} />
    </ToastContext.Provider>
  );
}
