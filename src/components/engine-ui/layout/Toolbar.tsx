"use client";

import * as React from "react";
import { gapToVar, type GapSize } from "./gap-size";

export interface ToolbarProps extends Omit<React.HTMLAttributes<HTMLElement>, "children"> {
  left?: React.ReactNode;
  center?: React.ReactNode;
  right?: React.ReactNode;
  gap?: GapSize;
  as?: "div" | "header" | "nav";
}

export const Toolbar = React.forwardRef<HTMLElement, ToolbarProps>(function Toolbar(
  { left, center, right, gap = "md", as = "div", className, style, ...rest },
  ref
) {
  const Element = as as React.ElementType;
  const slotGap = gapToVar(gap);

  const classes = ["eui-toolbar", className].filter(Boolean).join(" ");

  return (
    <Element ref={ref} className={classes} style={style} {...rest}>
      <div className="eui-toolbar-slot eui-toolbar-left" style={{ gap: slotGap }}>{left}</div>
      {center && (
        <div className="eui-toolbar-slot eui-toolbar-center" style={{ gap: slotGap }}>{center}</div>
      )}
      <div className="eui-toolbar-slot eui-toolbar-right" style={{ gap: slotGap }}>{right}</div>
    </Element>
  );
});
