"use client";

/**
 * useReducedMotion — respect the user's OS-level motion preference.
 *
 * Users can set `prefers-reduced-motion: reduce` in their OS or browser.
 * Our components must honor it: animations either disappear or become
 * near-instant. This hook tells you which mode the user is in.
 *
 * Usage:
 *   const reduced = useReducedMotion();
 *   const duration = reduced ? 0 : DURATION.base;
 *
 * For pure CSS animations, prefer the CSS media query:
 *   @media (prefers-reduced-motion: reduce) {
 *     .eui-popover-content { animation: none; }
 *   }
 *
 * Use this hook when motion is orchestrated in JS (e.g. spring physics,
 * sequential animations). It's reactive — if the user changes their
 * preference mid-session, the component re-renders.
 */

import * as React from "react";

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);

    const listener = (e: MediaQueryListEvent) => setReduced(e.matches);
    // Safari < 14 uses addListener. Modern uses addEventListener.
    if (mq.addEventListener) {
      mq.addEventListener("change", listener);
      return () => mq.removeEventListener("change", listener);
    } else {
      mq.addListener(listener);
      return () => mq.removeListener(listener);
    }
  }, []);

  return reduced;
}
