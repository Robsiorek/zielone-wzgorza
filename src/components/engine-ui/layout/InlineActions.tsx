"use client";

import * as React from "react";
import { gapToVar, type GapSize } from "./gap-size";

export interface InlineActionsProps extends React.HTMLAttributes<HTMLElement> {
  gap?: GapSize;
  align?: "start" | "center" | "end";
  as?: "div" | "nav";
}

const ALIGN_CLASS: Record<NonNullable<InlineActionsProps["align"]>, string> = {
  start: "eui-inline-actions-align-start",
  center: "eui-inline-actions-align-center",
  end: "eui-inline-actions-align-end",
};

export const InlineActions = React.forwardRef<HTMLElement, InlineActionsProps>(function InlineActions(
  { gap = "xs", align = "center", as = "div", className, style, children, ...rest },
  ref
) {
  const Element = as as React.ElementType;

  const classes = [
    "eui-inline-actions",
    ALIGN_CLASS[align],
    className,
  ].filter(Boolean).join(" ");

  return (
    <Element ref={ref} className={classes} style={{ gap: gapToVar(gap), ...style }} {...rest}>
      {children}
    </Element>
  );
});
