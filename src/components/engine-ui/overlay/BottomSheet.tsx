"use client";

import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { DragHandle } from "./DragHandle";
import { useIsMobile } from "../hooks/useIsMobile";

// ── useSwipeToDismiss ──

interface UseSwipeToDismissArgs {
  onDismiss: () => void;
  enabled: boolean;
  /** Pass open state so transform resets when sheet closes externally. */
  open: boolean;
  threshold?: number;
  velocityThreshold?: number;
}

function useSwipeToDismiss({
  onDismiss, enabled, open, threshold = 150, velocityThreshold = 0.5,
}: UseSwipeToDismissArgs): React.RefObject<HTMLDivElement> {
  const ref = React.useRef<HTMLDivElement>(null);
  const state = React.useRef({ startY: 0, startTime: 0, isDragging: false });

  // Fix 2B: Reset transform when open state changes (external close, reopen)
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = "";
    el.style.transition = "";
    state.current.isDragging = false;
  }, [open]);

  React.useEffect(() => {
    if (!enabled) return;
    const el = ref.current;
    if (!el) return;

    const onPointerDown = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const relativeY = e.clientY - rect.top;
      const scrollContainer = el.querySelector<HTMLElement>(".eui-bottom-sheet-body");
      const atTop = scrollContainer ? scrollContainer.scrollTop === 0 : true;
      if (relativeY > 80 && !atTop) return;

      state.current.startY = e.clientY;
      state.current.startTime = performance.now();
      state.current.isDragging = true;
      el.setPointerCapture(e.pointerId);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!state.current.isDragging) return;
      const deltaY = e.clientY - state.current.startY;
      if (deltaY > 0) {
        el.style.transform = `translateY(${deltaY}px)`;
        el.style.transition = "none";
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      if (!state.current.isDragging) return;
      state.current.isDragging = false;
      const deltaY = e.clientY - state.current.startY;
      const deltaTime = performance.now() - state.current.startTime;
      const velocity = deltaY / deltaTime;

      if (deltaY > threshold || (deltaY > 50 && velocity > velocityThreshold)) {
        // Fix 2A: Reset transform BEFORE dismiss to prevent stale inline style on reopen
        el.style.transform = "translateY(0)";
        el.style.transition = "";
        onDismiss();
      } else {
        el.style.transition = "transform 200ms var(--eui-ease-standard)";
        el.style.transform = "translateY(0)";
      }
    };

    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointermove", onPointerMove);
    el.addEventListener("pointerup", onPointerUp);
    el.addEventListener("pointercancel", onPointerUp);

    return () => {
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerup", onPointerUp);
      el.removeEventListener("pointercancel", onPointerUp);
    };
  }, [enabled, onDismiss, threshold, velocityThreshold]);

  return ref;
}

// ── BottomSheet ──

export interface BottomSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  height?: "full" | "auto" | "half";
  desktopVariant?: "modal" | "sheet";
  desktopSize?: "sm" | "md" | "lg" | "xl";
  className?: string;
  swipeToDismiss?: boolean;
  showDragHandle?: boolean;
  closeOnEscape?: boolean;
  closeOnOutsideClick?: boolean;
  label?: string;
  labelledBy?: string;
  describedBy?: string;
}

export const BottomSheet = React.forwardRef<HTMLDivElement, BottomSheetProps>(
  function BottomSheet(
    {
      open, onOpenChange,
      header, footer, children,
      height = "full",
      desktopVariant = "modal",
      desktopSize = "md",
      className,
      swipeToDismiss: swipeToDismissProp = true,
      showDragHandle,
      closeOnEscape = true,
      closeOnOutsideClick = true,
      label, labelledBy, describedBy,
    },
    ref
  ) {
    // Fix 1: Portal container — wait until DOM is ready
    const [container, setContainer] = React.useState<HTMLElement | null>(null);
    React.useEffect(() => {
      setContainer(document.querySelector<HTMLElement>(".engine-root"));
    }, []);

    // Fix 3: Disable swipe on desktop — modal pattern, no swipe
    const isMobile = useIsMobile();

    const effectiveSwipe = swipeToDismissProp && isMobile;
    const effectiveShowDragHandle = (showDragHandle ?? swipeToDismissProp) && isMobile;

    const contentClasses = [
      "eui-bottom-sheet",
      `eui-bottom-sheet-height-${height}`,
      `eui-bottom-sheet-desktop-${desktopVariant}`,
      desktopVariant === "modal" && `eui-bottom-sheet-desktop-size-${desktopSize}`,
      className,
    ].filter(Boolean).join(" ");

    const swipeRef = useSwipeToDismiss({
      onDismiss: () => onOpenChange(false),
      enabled: effectiveSwipe,
      open,
    });

    // Fix 1: Guard — don't render Portal until container is found
    if (!container) return null;

    return (
      <Dialog.Root open={open} onOpenChange={onOpenChange}>
        <Dialog.Portal container={container}>
          <Dialog.Overlay className="eui-backdrop eui-backdrop-medium eui-backdrop-blur" />
          <Dialog.Content
            ref={ref}
            className={contentClasses}
            onEscapeKeyDown={closeOnEscape ? undefined : (e) => e.preventDefault()}
            onPointerDownOutside={closeOnOutsideClick ? undefined : (e) => e.preventDefault()}
            aria-label={label}
            aria-labelledby={labelledBy}
            aria-describedby={describedBy}
          >
            <div ref={swipeRef as React.RefObject<HTMLDivElement>} className="eui-bottom-sheet-inner">
              {effectiveShowDragHandle && <DragHandle />}
              {header}
              <div className="eui-bottom-sheet-body">
                {children}
              </div>
              {footer}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    );
  }
);
