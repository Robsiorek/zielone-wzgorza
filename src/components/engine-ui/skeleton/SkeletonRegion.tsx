"use client";

import * as React from "react";

export interface SkeletonRegionProps {
  loading: boolean;
  label?: string;
  ariaLive?: "off" | "polite";
  children: React.ReactNode;
  className?: string;
}

export const SkeletonRegion = React.forwardRef<HTMLDivElement, SkeletonRegionProps>(
  function SkeletonRegion(
    { loading, label = "Ładowanie...", ariaLive = "polite", children, className },
    ref
  ) {
    // role="status" + aria-live="off" to sprzeczność (role="status" jest implicit live-region).
    // Conditional render: jeśli ariaLive="off", omijamy oba atrybuty.
    const a11yProps = ariaLive === "polite"
      ? { role: "status" as const, "aria-live": "polite" as const }
      : {};

    return (
      <div
        ref={ref}
        {...a11yProps}
        aria-busy={loading}
        aria-label={loading ? label : undefined}
        className={["eui-skeleton-region", className].filter(Boolean).join(" ")}
      >
        {children}
      </div>
    );
  }
);

SkeletonRegion.displayName = "SkeletonRegion";
