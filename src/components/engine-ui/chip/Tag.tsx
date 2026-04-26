"use client";

import * as React from "react";

export type TagVariant = "neutral" | "brand" | "success" | "warning" | "danger" | "info";

export interface TagProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: TagVariant;
  iconLeft?: React.ReactNode;
  children?: React.ReactNode;
}

export const Tag = React.forwardRef<HTMLSpanElement, TagProps>(
  function Tag({ variant = "neutral", iconLeft, className, children, ...rest }, ref) {
    const classes = ["eui-tag", `eui-tag-variant-${variant}`, className].filter(Boolean).join(" ");
    return (
      <span ref={ref} className={classes} {...rest}>
        {iconLeft && <span className="eui-tag-icon-left">{iconLeft}</span>}
        {children}
      </span>
    );
  }
);
