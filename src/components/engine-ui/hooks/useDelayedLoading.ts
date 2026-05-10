"use client";

/**
 * useDelayedLoading — anti-flash debouncing dla skeleton/spinner states.
 *
 * Returns true only after `isLoading` has been true for at least `delay` ms,
 * and stays true for at least `minDuration` ms once shown — eliminates
 * "skeleton flash and gone" pattern dla sub-400ms requests.
 *
 * @param isLoading - Source loading state
 * @param options.delay - Wait this many ms before showing skeleton (default 400ms)
 * @param options.minDuration - Once shown, stay visible for at least this long (default 0ms)
 * @returns Debounced loading state — use to gate skeleton render
 *
 * @example
 * const showSkeleton = useDelayedLoading(isFetching, { delay: 400 });
 * return showSkeleton ? <SkeletonCard /> : <ResultCard data={data} />;
 */

import * as React from "react";

export interface UseDelayedLoadingOptions {
  /** Delay before showing skeleton (ms). Default 400ms. */
  delay?: number;

  /** Minimum visible duration once shown (ms). Default 0ms. */
  minDuration?: number;
}

export function useDelayedLoading(
  isLoading: boolean,
  options: UseDelayedLoadingOptions = {}
): boolean {
  const { delay = 400, minDuration = 0 } = options;

  const [showLoading, setShowLoading] = React.useState(false);
  const showTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const shownAtRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    // Clear any pending timers
    if (showTimerRef.current) {
      clearTimeout(showTimerRef.current);
      showTimerRef.current = null;
    }
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }

    if (isLoading) {
      // Schedule "show" after delay
      showTimerRef.current = setTimeout(() => {
        setShowLoading(true);
        shownAtRef.current = Date.now();
        showTimerRef.current = null;
      }, delay);
    } else {
      // Hide — but respect minDuration
      if (showLoading && shownAtRef.current !== null) {
        const elapsed = Date.now() - shownAtRef.current;
        const remaining = Math.max(0, minDuration - elapsed);

        if (remaining > 0) {
          hideTimerRef.current = setTimeout(() => {
            setShowLoading(false);
            shownAtRef.current = null;
            hideTimerRef.current = null;
          }, remaining);
        } else {
          setShowLoading(false);
          shownAtRef.current = null;
        }
      } else {
        setShowLoading(false);
      }
    }

    return () => {
      // Cleanup on unmount (per ChatGPT v1.3 review reminder — prevents react leaks)
      if (showTimerRef.current) clearTimeout(showTimerRef.current);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, delay, minDuration]);

  return showLoading;
}
