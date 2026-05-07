"use client";

import * as React from "react";
import { gapToVar, type GapSize } from "./gap-size";

export interface InlineProps extends React.HTMLAttributes<HTMLElement> {
  gap?: GapSize;
  align?: "start" | "center" | "end" | "baseline" | "stretch";
  justify?: "start" | "center" | "end" | "between" | "around";
  wrap?: boolean;
  as?: "div" | "section" | "nav" | "ul" | "ol" | "header" | "footer";
}

const ALIGN_CLASS: Record<NonNullable<InlineProps["align"]>, string> = {
  start: "eui-inline-align-start",
  center: "eui-inline-align-center",
  end: "eui-inline-align-end",
  baseline: "eui-inline-align-baseline",
  stretch: "eui-inline-align-stretch",
};

const JUSTIFY_CLASS: Record<NonNullable<InlineProps["justify"]>, string> = {
  start: "eui-inline-justify-start",
  center: "eui-inline-justify-center",
  end: "eui-inline-justify-end",
  between: "eui-inline-justify-between",
  around: "eui-inline-justify-around",
};

export const Inline = React.forwardRef<HTMLElement, InlineProps>(function Inline(
  { gap = "md", align = "center", justify = "start", wrap = true, as = "div", className, style, children, ...rest },
  ref
) {
  const Element = as as React.ElementType;

  const classes = [
    "eui-inline",
    ALIGN_CLASS[align],
    JUSTIFY_CLASS[justify],
    !wrap && "eui-inline-nowrap",
    className,
  ].filter(Boolean).join(" ");

  return (
    <Element ref={ref} className={classes} style={{ gap: gapToVar(gap), ...style }} {...rest}>
      {children}
    </Element>
  );
});
