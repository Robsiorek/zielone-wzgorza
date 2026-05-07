"use client";

import * as React from "react";
import { gapToVar, type GapSize } from "./gap-size";

export interface StackProps extends React.HTMLAttributes<HTMLElement> {
  gap?: GapSize;
  align?: "start" | "center" | "end" | "stretch";
  as?: "div" | "section" | "article" | "main" | "form" | "aside" | "header" | "footer" | "nav";
}

const ALIGN_CLASS: Record<NonNullable<StackProps["align"]>, string> = {
  start: "eui-stack-align-start",
  center: "eui-stack-align-center",
  end: "eui-stack-align-end",
  stretch: "eui-stack-align-stretch",
};

export const Stack = React.forwardRef<HTMLElement, StackProps>(function Stack(
  { gap = "md", align = "stretch", as = "div", className, style, children, ...rest },
  ref
) {
  const Element = as as React.ElementType;

  const classes = [
    "eui-stack",
    ALIGN_CLASS[align],
    className,
  ].filter(Boolean).join(" ");

  return (
    <Element ref={ref} className={classes} style={{ gap: gapToVar(gap), ...style }} {...rest}>
      {children}
    </Element>
  );
});
