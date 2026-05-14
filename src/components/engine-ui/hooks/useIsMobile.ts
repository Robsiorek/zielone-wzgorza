"use client";

/**
 * useIsMobile — viewport width detection (mobile breakpoint).
 *
 * Returns `true` when viewport width ≤ 767px. Matches the Engine UI
 * mobile breakpoint convention used throughout responsive utilities and
 * BottomSheet's mobile-vs-desktop branching.
 *
 * Usage:
 *   const isMobile = useIsMobile();
 *   return isMobile ? <BottomSheet>{...}</BottomSheet> : <Popover>{...}</Popover>;
 *
 * SSR safety:
 *   First render returns `false`. The effect updates state on mount —
 *   one re-render on the client if viewport matches.
 *
 * Reactive: listens to `change` event on the MediaQueryList — orientation
 * change or DevTools resize updates the value live.
 */

import * as React from "react";

const MOBILE_QUERY = "(max-width: 767px)";

export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia(MOBILE_QUERY);
    setIsMobile(mq.matches);

    const listener = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    if (mq.addEventListener) {
      mq.addEventListener("change", listener);
      return () => mq.removeEventListener("change", listener);
    } else {
      // Safari < 14 fallback
      mq.addListener(listener);
      return () => mq.removeListener(listener);
    }
  }, []);

  return isMobile;
}
