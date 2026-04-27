"use client";

import * as React from "react";

export interface MetaTextProps extends React.HTMLAttributes<HTMLElement> {
  as?: "span" | "p" | "div";
  iconLeft?: React.ReactNode;
  variant?: "default" | "primary";
  children: React.ReactNode;
}

export const MetaText = React.forwardRef<HTMLElement, MetaTextProps>(
  function MetaText({ as = "span", iconLeft, variant = "default", className, children, ...rest }, ref) {
    const Element = as as React.ElementType;
    const classes = [
      "eui-meta-text", `eui-meta-text-${variant}`, "eui-caption", className,
    ].filter(Boolean).join(" ");

    return (
      <Element ref={ref} className={classes} {...rest}>
        {iconLeft && <span className="eui-meta-text-icon">{iconLeft}</span>}
        {children}
      </Element>
    );
  }
);
