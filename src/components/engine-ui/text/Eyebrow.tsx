"use client";

import * as React from "react";

export interface EyebrowProps extends React.HTMLAttributes<HTMLElement> {
  variant?: "default" | "brand" | "success";
  as?: "span" | "p" | "div";
  children: React.ReactNode;
}

export const Eyebrow = React.forwardRef<HTMLElement, EyebrowProps>(
  function Eyebrow({ variant = "default", as = "span", className, children, ...rest }, ref) {
    const Element = as as React.ElementType;
    const classes = [
      "eui-eyebrow", `eui-eyebrow-${variant}`, "eui-label", className,
    ].filter(Boolean).join(" ");

    return <Element ref={ref} className={classes} {...rest}>{children}</Element>;
  }
);
