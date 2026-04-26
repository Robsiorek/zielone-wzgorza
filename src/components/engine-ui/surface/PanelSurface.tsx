"use client";

import * as React from "react";

export interface PanelSurfaceProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: "none" | "sm" | "md" | "lg" | "xl";
  direction?: "column" | "row";
  gap?: "none" | "xs" | "sm" | "md" | "lg" | "xl";
  scrollable?: boolean;
  children?: React.ReactNode;
}

export const PanelSurface = React.forwardRef<HTMLDivElement, PanelSurfaceProps>(
  function PanelSurface(
    { padding = "md", direction = "column", gap = "md", scrollable = false, children, className, ...rest },
    ref
  ) {
    const classes = [
      "eui-panel-surface",
      `eui-panel-dir-${direction}`,
      `eui-panel-pad-${padding}`,
      `eui-panel-gap-${gap}`,
      scrollable && "eui-panel-scroll",
      className,
    ].filter(Boolean).join(" ");

    return (
      <div ref={ref} className={classes} {...rest}>
        {children}
      </div>
    );
  }
);
