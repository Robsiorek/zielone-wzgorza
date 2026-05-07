"use client";

import * as React from "react";
import { gapToVar, type GapSize } from "./gap-size";

export interface SpacerProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  size?: GapSize;
  axis?: "vertical" | "horizontal";
}

export const Spacer = React.forwardRef<HTMLDivElement, SpacerProps>(function Spacer(
  { size = "md", axis = "vertical", className, style, ...rest },
  ref
) {
  const dimension = gapToVar(size);

  const classes = [
    "eui-spacer",
    axis === "vertical" ? "eui-spacer-vertical" : "eui-spacer-horizontal",
    className,
  ].filter(Boolean).join(" ");

  const sizeStyle =
    axis === "vertical"
      ? { height: dimension, width: "100%" }
      : { width: dimension, height: "100%" };

  return (
    <div ref={ref} className={classes} aria-hidden="true" style={{ ...sizeStyle, ...style }} {...rest} />
  );
});
