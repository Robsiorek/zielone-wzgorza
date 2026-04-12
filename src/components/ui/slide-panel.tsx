"use client";

import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { Z, FloatingZContext } from "@/lib/z-layers";

interface SlidePanelProps {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  children: React.ReactNode;
  width?: number | string;
}

function SlidePanelContent({ open, onClose, title, children, width = 520 }: SlidePanelProps) {
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (open) {
      setVisible(true);
      setClosing(false);
    } else if (visible && !closing) {
      setClosing(true);
      setTimeout(() => {
        setVisible(false);
        setClosing(false);
      }, 250);
    }
  }, [open]);

  const handleClose = useCallback(() => {
    setClosing(true);
    setTimeout(() => {
      setVisible(false);
      setClosing(false);
      onClose();
    }, 250);
  }, [onClose]);

  if (!visible) return null;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: Z.SLIDE_PANEL }}>
      <div
        style={{
          position: "absolute", inset: 0,
          background: "rgba(0,0,0,0.2)", backdropFilter: "blur(4px)",
          transition: "opacity 250ms ease",
          opacity: closing ? 0 : 1,
        }}
        onClick={handleClose}
      />
      <div
        style={{
          position: "absolute", right: 0, top: 0, height: "100%",
          width: "100%", maxWidth: width,
          display: "flex", flexDirection: "column",
          transition: "transform 250ms cubic-bezier(0.4, 0, 0.2, 1)",
          transform: closing ? "translateX(100%)" : "translateX(0)",
        }}
        className="bg-card border-l slide-in"
      >
        <div className="flex items-center justify-between px-6 h-16 border-b shrink-0">
          <div className="text-[15px] font-semibold flex-1 min-w-0">{title}</div>
          <button
            onClick={handleClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-2xl text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          <FloatingZContext.Provider value={Z.PANEL_DROPDOWN}>
            {children}
          </FloatingZContext.Provider>
        </div>
      </div>
    </div>
  );
}

export function SlidePanel(props: SlidePanelProps) {
  if (typeof window === "undefined") return null;
  return createPortal(<SlidePanelContent {...props} />, document.body);
}
