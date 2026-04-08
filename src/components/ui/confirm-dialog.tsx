"use client";

import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle } from "lucide-react";

interface ConfirmDialogProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "default";
}

export function ConfirmDialog({
  open,
  onConfirm,
  onCancel,
  title,
  message,
  confirmLabel = "Potwierdź",
  cancelLabel = "Anuluj",
  variant = "danger",
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
      if (e.key === "Enter") onConfirm();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel, onConfirm]);

  if (!open || typeof window === "undefined") return null;

  return createPortal(
    <div style={{ position: "fixed", inset: 0, zIndex: 99999 }}>
      <div
        style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.25)", backdropFilter: "blur(4px)" }}
        className="fade-in"
        onClick={onCancel}
      />
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div
          className="bg-card w-full fade-in-scale"
          style={{ maxWidth: 420, borderRadius: 20, border: "none", boxShadow: "0 8px 40px rgba(0,0,0,0.12)" }}
        >
          {/* Header: icon + title */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "24px 24px 16px" }}>
            <div
              style={{
                width: 40, height: 40, borderRadius: 12,
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                background: variant === "danger" ? "hsl(var(--destructive) / 0.1)" : "hsl(var(--primary) / 0.1)",
              }}
            >
              <AlertTriangle style={{
                width: 20, height: 20,
                color: variant === "danger" ? "hsl(var(--destructive))" : "hsl(var(--primary))",
              }} />
            </div>
            <div>
              {title && <h3 style={{ fontSize: 15, fontWeight: 700, color: "hsl(var(--foreground))" }}>{title}</h3>}
              <p style={{ fontSize: 13, color: "hsl(var(--muted-foreground))", lineHeight: 1.5, marginTop: 2 }}>{message}</p>
            </div>
          </div>

          {/* Footer */}
          <div style={{
            display: "flex", gap: 8, justifyContent: "flex-end",
            padding: "16px 24px 24px",
            borderTop: "1px solid hsl(var(--border) / 0.5)",
          }}>
            <button onClick={onCancel} className="btn-bubble btn-secondary-bubble" style={{ padding: "10px 20px", fontSize: 13 }}>
              {cancelLabel}
            </button>
            <button
              onClick={onConfirm}
              className="btn-bubble"
              style={{
                padding: "10px 20px", fontSize: 13,
                background: variant === "danger" ? "hsl(var(--destructive))" : "hsl(var(--primary))",
                color: "white", border: "2px solid transparent",
              }}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
