"use client";

import * as React from "react";

export type BadgeVariant = "neutral" | "brand" | "outline" | "success" | "warning" | "danger";
export type BadgeSize = "xs" | "sm";
export type BadgeShape = "pill" | "rounded";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  shape?: BadgeShape;
  children?: React.ReactNode;
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  function Badge({ variant = "neutral", size = "xs", shape = "pill", className, children, ...rest }, ref) {
    const classes = [
      "eui-badge",
      `eui-badge-variant-${variant}`,
      `eui-badge-size-${size}`,
      shape === "rounded" && "eui-badge-shape-rounded",
      className,
    ].filter(Boolean).join(" ");
    return <span ref={ref} className={classes} {...rest}>{children}</span>;
  }
);
