"use client";

/**
 * Modal — base overlay component (engine-ui)
 * ────────────────────────────────────────────────────────────────────────
 * Full-screen overlay with backdrop blur, centered content panel,
 * enter/exit animations, ESC close, and click-outside close.
 *
 * Used by: AmenitiesModal, future confirm dialogs, detail views.
 *
 * Renders via React portal into `.engine-root` (same as Popover)
 * so engine-ui CSS rules apply.
 */

import * as React from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  /** Modal title shown in the header. */
  title?: string;
  /** Max width of the modal panel. Default 560px. */
  maxWidth?: number;
  children: React.ReactNode;
  className?: string;
}

export function Modal({
  open,
  onClose,
  title,
  maxWidth = 560,
  children,
  className,
}: ModalProps) {
  const [container, setContainer] = React.useState<HTMLElement | null>(null);

  // Find .engine-root for portal target
  React.useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.querySelector<HTMLElement>(".engine-root");
    if (root) setContainer(root);
  }, []);

  // ESC to close
  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  // Lock body scroll when open — compensate for scrollbar width
  // to prevent the "zoom" layout shift when scrollbar disappears.
  React.useEffect(() => {
    if (!open) return;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    const prevOverflow = document.body.style.overflow;
    const prevPaddingRight = document.body.style.paddingRight;
    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.paddingRight = prevPaddingRight;
    };
  }, [open]);

  if (!open || !container) return null;

  const rootClass = ["eui-modal-overlay", className].filter(Boolean).join(" ");

  const content = (
    <div className={rootClass} onClick={onClose}>
      <div
        className="eui-modal-panel"
        style={{ maxWidth }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        {/* Header — title left, close right */}
        <div className="eui-modal-header">
          {title && <h2 className="eui-modal-title">{title}</h2>}
          <button
            type="button"
            className="eui-modal-close"
            onClick={onClose}
            aria-label="Zamknij"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="eui-modal-body">
          {children}
        </div>
      </div>
    </div>
  );

  return createPortal(content, container);
}
