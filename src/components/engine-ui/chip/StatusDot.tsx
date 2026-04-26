"use client";

import * as React from "react";

export type StatusDotVariant = "available" | "limited" | "unavailable" | "promo" | "new";

export interface StatusDotProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant: StatusDotVariant;
  label?: React.ReactNode;
}

export const StatusDot = React.forwardRef<HTMLSpanElement, StatusDotProps>(
  function StatusDot({ variant, label, className, ...rest }, ref) {
    const classes = [
      "eui-status-dot",
      `eui-status-dot-variant-${variant}`,
      label && "eui-status-dot-with-label",
      className,
    ].filter(Boolean).join(" ");

    if (label) {
      return (
        <span ref={ref} className={classes} {...rest}>
          <span className="eui-status-dot-circle" aria-hidden="true" />
          <span className="eui-status-dot-label">{label}</span>
        </span>
      );
    }

    return (
      <span ref={ref} className={classes} aria-hidden="true" {...rest}>
        <span className="eui-status-dot-circle" />
      </span>
    );
  }
);
