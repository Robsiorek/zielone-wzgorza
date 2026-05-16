"use client";

import * as React from "react";

export interface CardSurfaceProps extends React.HTMLAttributes<HTMLDivElement> {
  elevation?: "flat" | "raised" | "elevated" | "floating";
  radius?: "md" | "lg" | "xl" | "2xl";
  /**
   * Chrome variant (Stage 2 governance — eliminuje !important bypassy):
   *  - "surface" (default): bg grey-0 + 1px border (zachowanie historyczne)
   *  - "bordered": transparent bg + 2px border var(--eui-border), bez shadow,
   *                hover → border-strong (Airbnb explore card)
   *  - "bare": transparent, bez border/shadow (legacy .eui-card look)
   * "surface" NIE emituje klasy wariantu — pełna wsteczna kompatybilność.
   */
  variant?: "surface" | "bordered" | "bare";
  interactive?: boolean;
  padding?: 0 | "sm" | "md" | "lg";
  children?: React.ReactNode;
}

export const CardSurface = React.forwardRef<HTMLDivElement, CardSurfaceProps>(
  function CardSurface(
    { elevation = "raised", radius = "lg", variant = "surface", interactive = false, padding = 0, children, className, ...rest },
    ref
  ) {
    const classes = [
      "eui-card-surface",
      `eui-card-elev-${elevation}`,
      `eui-card-radius-${radius}`,
      variant !== "surface" && `eui-card-variant-${variant}`,
      interactive && "eui-card-interactive",
      padding && `eui-card-pad-${padding}`,
      className,
    ].filter(Boolean).join(" ");

    return (
      <div ref={ref} className={classes} {...rest}>
        {children}
      </div>
    );
  }
);
