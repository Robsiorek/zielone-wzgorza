"use client";

import * as React from "react";
import { gapToVar, type GapSize } from "./gap-size";

export interface ActionRowProps extends React.HTMLAttributes<HTMLElement> {
  align?: "left" | "right" | "center" | "between" | "between-reverse";
  gap?: GapSize;
  as?: "div" | "footer";
}

const ALIGN_CLASS: Record<NonNullable<ActionRowProps["align"]>, string> = {
  left: "eui-action-row-left",
  right: "eui-action-row-right",
  center: "eui-action-row-center",
  between: "eui-action-row-between",
  "between-reverse": "eui-action-row-between-reverse",
};

export const ActionRow = React.forwardRef<HTMLElement, ActionRowProps>(function ActionRow(
  { align = "right", gap = "sm", as = "div", className, style, children, ...rest },
  ref
) {
  const Element = as as React.ElementType;

  const classes = [
    "eui-action-row",
    ALIGN_CLASS[align],
    className,
  ].filter(Boolean).join(" ");

  return (
    <Element ref={ref} className={classes} style={{ gap: gapToVar(gap), ...style }} {...rest}>
      {children}
    </Element>
  );
});
