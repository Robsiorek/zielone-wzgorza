"use client";

/**
 * Tooltip — Engine UI Part 12 (Feedback + State).
 *
 * Zbudowany na @floating-ui/react (już dep; mirror działającego admin
 * ui/tooltip — zero nowych paczek). Styl przez .eui-tooltip + tokeny
 * (NIE inline hardcoded jak legacy admin; NIE JS-injected keyframes).
 *
 * Interakcje (PO D6): useHover (desktop) + useFocus (keyboard) +
 * useClick (tap-to-toggle na touch / klik) + useDismiss (ESC/outside) +
 * useRole role=tooltip. aria-describedby przez floating-ui useRole.
 *
 * Canonical engine-ui Tooltip — zastępuje legacy @/components/ui/tooltip
 * w booking (przyszły front). Admin ui/tooltip = legacy, NIE ruszamy.
 */

import * as React from "react";
import {
  useFloating,
  offset,
  flip,
  shift,
  arrow,
  useHover,
  useFocus,
  useClick,
  useDismiss,
  useRole,
  useInteractions,
  autoUpdate,
  FloatingPortal,
  FloatingArrow,
} from "@floating-ui/react";

export interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  delay?: number;
  disabled?: boolean;
  maxWidth?: number;
}

export function Tooltip({
  content,
  children,
  side = "top",
  delay = 180,
  disabled = false,
  maxWidth = 280,
}: TooltipProps) {
  const [open, setOpen] = React.useState(false);
  const arrowRef = React.useRef<SVGSVGElement>(null);

  // .eui-tooltip CSS jest scoped pod .engine-root; FloatingPortal domyślnie
  // ląduje w document.body (poza .engine-root) → styl by nie zadziałał.
  // Portal root = element .engine-root (mirror wzorca BottomSheet).
  const [container, setContainer] = React.useState<HTMLElement | null>(null);
  React.useEffect(() => {
    setContainer(document.querySelector<HTMLElement>(".engine-root"));
  }, []);

  const { refs, floatingStyles, context } = useFloating({
    open,
    onOpenChange: setOpen,
    placement: side,
    strategy: "fixed",
    middleware: [
      offset(8),
      flip({ padding: 8 }),
      shift({ padding: 8 }),
      arrow({ element: arrowRef }),
    ],
    whileElementsMounted: autoUpdate,
  });

  const { getReferenceProps, getFloatingProps } = useInteractions([
    useHover(context, { delay: { open: delay, close: 0 } }),
    useFocus(context),
    // PO D6 — tap-to-toggle na touch/mobile (klik też na desktop, nieszkodliwy)
    useClick(context),
    useDismiss(context),
    useRole(context, { role: "tooltip" }),
  ]);

  if (disabled) return <>{children}</>;

  return (
    <>
      <span
        ref={refs.setReference}
        style={{ display: "inline-flex" }}
        {...getReferenceProps()}
      >
        {children}
      </span>
      {open && container && (
        <FloatingPortal root={container}>
          <div
            ref={refs.setFloating}
            style={{ ...floatingStyles, pointerEvents: "none" }}
            className="eui-tooltip-layer"
            {...getFloatingProps()}
          >
            <div className="eui-tooltip" style={{ maxWidth }}>
              {content}
              <FloatingArrow
                ref={arrowRef}
                context={context}
                fill="var(--eui-grey-900)"
                width={12}
                height={6}
              />
            </div>
          </div>
        </FloatingPortal>
      )}
    </>
  );
}
