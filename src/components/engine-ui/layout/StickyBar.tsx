"use client";

import * as React from "react";

export interface StickyBarProps extends React.HTMLAttributes<HTMLElement> {
  position?: "top" | "bottom";
  blur?: boolean;
  border?: boolean;
  safeArea?: boolean;
  as?: "div" | "footer" | "header" | "aside";
}

export const StickyBar = React.forwardRef<HTMLElement, StickyBarProps>(function StickyBar(
  { position = "bottom", blur = false, border = true, safeArea = true, as = "div", className, children, ...rest },
  ref
) {
  const Element = as as React.ElementType;

  const classes = [
    "eui-sticky-bar",
    `eui-sticky-bar-${position}`,
    blur && "eui-sticky-bar-blur",
    border && "eui-sticky-bar-bordered",
    safeArea && position === "bottom" && "eui-sticky-bar-safe-area",
    className,
  ].filter(Boolean).join(" ");

  return (
    <Element ref={ref} className={classes} {...rest}>
      {children}
    </Element>
  );
});
