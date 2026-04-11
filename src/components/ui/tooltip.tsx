"use client";

import React, { useRef, useState, useEffect } from "react";
import {
  useFloating, offset, flip, shift, arrow,
  useHover, useFocus, useDismiss, useRole, useInteractions,
  autoUpdate, FloatingPortal, FloatingArrow,
} from "@floating-ui/react";

type Props = {
  content: React.ReactNode;
  children: React.ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  delay?: number;
  disabled?: boolean;
  maxWidth?: number;
};

const BG = "hsl(220, 15%, 13%)";

let styleInjected = false;
function injectStyles() {
  if (styleInjected || typeof document === "undefined") return;
  const s = document.createElement("style");
  s.textContent = "@keyframes tooltipIn{from{opacity:0;transform:scale(.96) translateY(3px)}to{opacity:1;transform:scale(1) translateY(0)}}";
  document.head.appendChild(s);
  styleInjected = true;
}

export function Tooltip({ content, children, side = "top", delay = 180, disabled = false, maxWidth = 280 }: Props) {
  const [open, setOpen] = useState(false);
  const arrowRef = useRef<SVGSVGElement>(null);
  useEffect(() => { injectStyles(); }, []);

  const { refs, floatingStyles, context } = useFloating({
    open, onOpenChange: setOpen, placement: side,
    middleware: [offset(8), flip({ padding: 8 }), shift({ padding: 8 }), arrow({ element: arrowRef })],
    whileElementsMounted: autoUpdate,
  });

  const { getReferenceProps, getFloatingProps } = useInteractions([
    useHover(context, { delay: { open: delay, close: 0 } }),
    useFocus(context), useDismiss(context), useRole(context, { role: "tooltip" }),
  ]);

  if (disabled) return <>{children}</>;

  return (
    <>
      <span ref={refs.setReference} style={{ display: "inline-flex" }} {...getReferenceProps()}>{children}</span>
      {open && (
        <FloatingPortal>
          <div ref={refs.setFloating} style={{ ...floatingStyles, zIndex: 99999, pointerEvents: "none" }} {...getFloatingProps()}>
            <div style={{
              background: BG, color: "hsl(220, 10%, 95%)", borderRadius: 12, padding: "7px 14px",
              fontSize: 12, fontWeight: 500, lineHeight: 1.4, maxWidth, letterSpacing: "0.01em",
              boxShadow: "0 4px 20px rgba(0,0,0,0.15), 0 1px 4px rgba(0,0,0,0.1)",
              animation: "tooltipIn .15s cubic-bezier(.16,1,.3,1) both", position: "relative",
            }}>
              {content}
              <FloatingArrow ref={arrowRef} context={context} fill={BG} width={12} height={6} />
            </div>
          </div>
        </FloatingPortal>
      )}
    </>
  );
}
