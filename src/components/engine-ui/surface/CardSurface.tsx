"use client";

import * as React from "react";

export interface CardSurfaceProps extends React.HTMLAttributes<HTMLDivElement> {
  elevation?: "flat" | "raised" | "elevated" | "floating";
  radius?: "md" | "lg" | "xl" | "2xl";
  interactive?: boolean;
  padding?: 0 | "sm" | "md" | "lg";
  children?: React.ReactNode;
}

export const CardSurface = React.forwardRef<HTMLDivElement, CardSurfaceProps>(
  function CardSurface(
    { elevation = "raised", radius = "lg", interactive = false, padding = 0, children, className, ...rest },
    ref
  ) {
    const classes = [
      "eui-card-surface",
      `eui-card-elev-${elevation}`,
      `eui-card-radius-${radius}`,
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
