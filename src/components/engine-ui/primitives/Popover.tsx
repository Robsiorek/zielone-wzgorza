"use client";

/**
 * Popover — primitive (engine-ui)
 * ────────────────────────────────────────────────────────────────────────
 * Thin wrapper around @radix-ui/react-popover that applies engine-ui
 * styling (`eui-popover-content`, size variants) and renders content in
 * a Portal by default. All other Radix props (`align`, `side`, `sideOffset`,
 * `collisionPadding`, `onOpenChange`, `modal`, …) pass through unchanged.
 *
 * Why a wrapper:
 *   - Single import point for engine-ui consumers:
 *       `import { Popover, PopoverTrigger, PopoverContent } from "@/components/engine-ui/primitives/Popover"`
 *   - Forces the `eui-popover-content` class (with optional `eui-size-*`),
 *     so component authors can't accidentally ship an unstyled popover.
 *   - Keeps the door open for future engine-ui-specific concerns (focus
 *     management defaults, RTL handling, scroll locking) without touching
 *     every call site.
 *
 * Accessibility:
 *   - Radix handles focus trap, ESC close, outside-click close, and
 *     `aria-expanded` on the trigger by default.
 *   - Enter/exit animations are driven by `data-state` in engine-ui.css.
 *   - `prefers-reduced-motion` is honoured there (no JS-side check needed).
 */

import * as React from "react";
import * as RadixPopover from "@radix-ui/react-popover";

// ═══════════════════════════════════════════
// Re-exports (pass-through)
// ═══════════════════════════════════════════

export const Popover = RadixPopover.Root;
export const PopoverTrigger = RadixPopover.Trigger;
export const PopoverAnchor = RadixPopover.Anchor;
export const PopoverClose = RadixPopover.Close;

export type PopoverProps = RadixPopover.PopoverProps;
export type PopoverTriggerProps = RadixPopover.PopoverTriggerProps;
export type PopoverAnchorProps = RadixPopover.PopoverAnchorProps;
export type PopoverCloseProps = RadixPopover.PopoverCloseProps;

// ═══════════════════════════════════════════
// PopoverContent
// ═══════════════════════════════════════════

/**
 * Width variant for the popover surface.
 *
 * - "small"       = 280px (compact menus, short lists)
 * - "medium"      = 360px (default; guest picker, simple forms)
 * - "large"       = 520px (date picker, dense content)
 * - "contextual"  = content-sized (tooltips, inline hints)
 */
export type PopoverSize = "small" | "medium" | "large" | "contextual";

export interface PopoverContentProps extends RadixPopover.PopoverContentProps {
  /**
   * Width preset. Defaults to "medium".
   * Use "contextual" when the content should size itself (min 180, max 320).
   */
  size?: PopoverSize;
  /**
   * Whether to render in a React Portal. Defaults to `true`.
   * Disable only when the popover must stay inside a transformed parent
   * (e.g. for scroll-linked effects). Radix still handles positioning.
   */
  portalled?: boolean;
}

const SIZE_CLASS: Record<PopoverSize, string> = {
  small: "eui-size-small",
  medium: "eui-size-medium",
  large: "eui-size-large",
  contextual: "eui-size-contextual",
};

/**
 * Popover surface. Apply engine-ui styling and render in a portal by default.
 *
 * Sensible defaults (chosen so popovers look good out of the box):
 *   - `sideOffset={8}` — small gap between trigger and content
 *   - `collisionPadding={8}` — keep 8px from viewport edges
 *
 * Alignment (`align`, `side`) is intentionally NOT defaulted here — Radix's
 * own defaults apply. Positioning is always a call-site decision: a search
 * segment may want `align="start"`, a guest picker `align="end"`, a
 * tooltip `side="top"`. Forcing a default here would nudge every popover
 * toward one use case.
 *
 * Callers can override any prop.
 */
export const PopoverContent = React.forwardRef<
  HTMLDivElement,
  PopoverContentProps
>(function PopoverContent(
  {
    size = "medium",
    portalled = true,
    className,
    sideOffset = 8,
    collisionPadding = 8,
    children,
    ...rest
  },
  ref
) {
  const merged = ["eui-popover-content", SIZE_CLASS[size], className]
    .filter(Boolean)
    .join(" ");

  // Find the nearest .engine-root at mount-time so the portal mounts INSIDE
  // the scoped subtree. Without this, Radix portals into <body>, which sits
  // OUTSIDE `.engine-root`, and every scoped `.engine-root .eui-*` rule
  // silently fails to apply — the popover renders as an unstyled <div>.
  //
  // SSR-safety: `document` is not available during server rendering, so the
  // container stays `undefined` until the first client paint. Radix handles
  // `undefined` by falling back to `document.body`; after hydration the
  // effect re-resolves the container to the real `.engine-root` and the
  // portal re-targets.
  const [container, setContainer] = React.useState<HTMLElement | undefined>(
    undefined
  );
  React.useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.querySelector<HTMLElement>(".engine-root");
    if (root) setContainer(root);
  }, []);

  const content = (
    <RadixPopover.Content
      ref={ref}
      className={merged}
      sideOffset={sideOffset}
      collisionPadding={collisionPadding}
      {...rest}
    >
      {children}
    </RadixPopover.Content>
  );

  if (!portalled) return content;
  return <RadixPopover.Portal container={container}>{content}</RadixPopover.Portal>;
});

// ═══════════════════════════════════════════
// Low-level escape hatches
// ═══════════════════════════════════════════

/**
 * Expose Radix's raw Portal for rare cases where consumers need to render
 * siblings (e.g. a backdrop) inside the same portal root as the content.
 * Prefer the default (portalled) PopoverContent whenever possible.
 */
export const PopoverPortal = RadixPopover.Portal;
export type PopoverPortalProps = RadixPopover.PopoverPortalProps;
