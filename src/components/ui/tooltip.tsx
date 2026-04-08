"use client";

import React, { useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
}

export function Tooltip({ content, children }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLSpanElement>(null);

  const handleEnter = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setCoords({
      top: rect.top + window.scrollY,
      left: rect.left + rect.width / 2,
    });
    setVisible(true);
  }, []);

  const handleLeave = useCallback(() => {
    setVisible(false);
  }, []);

  return (
    <>
      <span
        ref={triggerRef}
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
        style={{ cursor: "pointer", display: "inline-flex" }}
      >
        {children}
      </span>
      {visible && typeof document !== "undefined" && createPortal(
        <div
          style={{
            position: "absolute",
            top: coords.top - 10,
            left: coords.left,
            transform: "translate(-50%, -100%)",
            zIndex: 99999,
            pointerEvents: "none",
            animation: "tooltipFadeIn 0.18s ease-out both",
          }}
        >
          <div
            style={{
              background: "hsl(220, 15%, 13%)",
              color: "hsl(220, 10%, 92%)",
              borderRadius: 10,
              padding: "10px 14px",
              fontSize: 11,
              fontWeight: 500,
              lineHeight: 1.7,
              minWidth: 140,
              maxWidth: 280,
              boxShadow: "0 4px 24px rgba(0,0,0,0.25)",
            }}
          >
            {content}
          </div>
          <div
            style={{
              width: 0,
              height: 0,
              margin: "0 auto",
              borderLeft: "6px solid transparent",
              borderRight: "6px solid transparent",
              borderTop: "6px solid hsl(220, 15%, 13%)",
            }}
          />
        </div>,
        document.body
      )}
    </>
  );
}
