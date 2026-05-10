"use client";

import * as React from "react";
import { Spinner } from "./Spinner";

export interface LoadingOverlayProps {
  open: boolean;
  blocking?: boolean;
  variant?: "fullscreen" | "container";
  label?: string;
  ariaLive?: "off" | "polite";
  children?: React.ReactNode;
}

export const LoadingOverlay = React.forwardRef<HTMLDivElement, LoadingOverlayProps>(
  function LoadingOverlay(
    {
      open,
      blocking = true,
      variant = "container",
      label = "Ładowanie...",
      ariaLive = "off",
      children,
    },
    ref
  ) {
    if (!open) return null;

    // role="status" + aria-live="off" to sprzeczność (role="status" jest implicit live-region).
    // Conditional render: jeśli ariaLive="off", omijamy oba atrybuty.
    const a11yProps = ariaLive === "polite"
      ? { role: "status" as const, "aria-live": "polite" as const }
      : {};

    return (
      <div
        ref={ref}
        {...a11yProps}
        aria-label={label}
        aria-busy="true"
        className={[
          "eui-loading-overlay",
          `eui-loading-overlay-${variant}`,
          blocking ? "eui-loading-overlay-blocking" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <div className="eui-loading-overlay-card">
          {children ?? (
            <>
              <Spinner size="lg" variant="primary" />
              <span className="eui-body-small eui-loading-overlay-label">{label}</span>
            </>
          )}
        </div>
      </div>
    );
  }
);

LoadingOverlay.displayName = "LoadingOverlay";
