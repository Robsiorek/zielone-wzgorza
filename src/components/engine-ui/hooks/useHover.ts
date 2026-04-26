"use client";

/**
 * useHover — pointer hover state, **pointer input only**.
 *
 * Touch devices fire synthetic mouseover/mouseenter on tap, which makes
 * hover-driven UI stick after a tap. This hook checks the PointerEvent's
 * pointerType and only reports hover for "mouse" (and "pen"). On touch,
 * isHovered stays false.
 *
 * Why not CSS :hover? Two reasons:
 *   1. Same issue — CSS :hover on mobile sticks after tap, causing hover
 *      states to persist incorrectly. You need `@media (hover: hover)`
 *      wrappers in CSS, which is doable but ugly.
 *   2. Sometimes hover state needs to be in JS (e.g. showing a tooltip
 *      on hover). This hook is the right tool then.
 *
 * For pure visual hovers, prefer CSS with `@media (hover: hover)`.
 * Reach for this hook for JS-driven hover behavior.
 */

import * as React from "react";

export interface HoverOptions {
  disabled?: boolean;
}

export interface HoverResult {
  isHovered: boolean;
  hoverProps: {
    onPointerEnter: (e: React.PointerEvent) => void;
    onPointerLeave: (e: React.PointerEvent) => void;
  };
}

export function useHover({ disabled }: HoverOptions = {}): HoverResult {
  const [isHovered, setIsHovered] = React.useState(false);

  const hoverProps: HoverResult["hoverProps"] = {
    onPointerEnter: (e) => {
      if (disabled) return;
      // Touch input fires synthetic pointer events; skip them.
      if (e.pointerType === "touch") return;
      setIsHovered(true);
    },
    onPointerLeave: (e) => {
      if (e.pointerType === "touch") return;
      setIsHovered(false);
    },
  };

  return { isHovered: disabled ? false : isHovered, hoverProps };
}
