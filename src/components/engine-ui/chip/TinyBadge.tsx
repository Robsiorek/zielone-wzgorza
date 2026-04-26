"use client";

import * as React from "react";

export type TinyBadgeVariant = "neutral" | "brand" | "danger";

export interface TinyBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: TinyBadgeVariant;
  children?: React.ReactNode;
}

export const TinyBadge = React.forwardRef<HTMLSpanElement, TinyBadgeProps>(
  function TinyBadge({ variant = "neutral", className, children, ...rest }, ref) {
    const classes = ["eui-tiny-badge", `eui-tiny-badge-variant-${variant}`, className].filter(Boolean).join(" ");
    return <span ref={ref} className={classes} {...rest}>{children}</span>;
  }
);
