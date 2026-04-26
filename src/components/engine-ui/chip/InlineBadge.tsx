"use client";

import * as React from "react";

export type InlineBadgeVariant = "neutral" | "brand" | "success" | "warning" | "danger";

export interface InlineBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: InlineBadgeVariant;
  children?: React.ReactNode;
}

export const InlineBadge = React.forwardRef<HTMLSpanElement, InlineBadgeProps>(
  function InlineBadge({ variant = "neutral", className, children, ...rest }, ref) {
    const classes = ["eui-inline-badge", `eui-inline-badge-variant-${variant}`, className].filter(Boolean).join(" ");
    return <span ref={ref} className={classes} {...rest}>{children}</span>;
  }
);
