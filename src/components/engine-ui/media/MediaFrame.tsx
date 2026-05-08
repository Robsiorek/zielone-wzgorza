"use client";

import * as React from "react";
import { aspectToValue, type AspectRatio } from "./aspect-ratio";

export interface MediaFrameProps extends React.HTMLAttributes<HTMLDivElement> {
  aspectRatio?: AspectRatio;
  radius?: "none" | "sm" | "md" | "lg" | "xl" | "2xl";
  hoverable?: boolean;
  background?: boolean;
}

const RADIUS_CLASS: Record<NonNullable<MediaFrameProps["radius"]>, string> = {
  none: "eui-media-frame-radius-none",
  sm: "eui-media-frame-radius-sm",
  md: "eui-media-frame-radius-md",
  lg: "eui-media-frame-radius-lg",
  xl: "eui-media-frame-radius-xl",
  "2xl": "eui-media-frame-radius-2xl",
};

export const MediaFrame = React.forwardRef<HTMLDivElement, MediaFrameProps>(function MediaFrame(
  { aspectRatio = "photo", radius = "md", hoverable = false, background = true, className, style, children, ...rest },
  ref
) {
  const classes = [
    "eui-media-frame",
    RADIUS_CLASS[radius],
    hoverable && "eui-media-frame-hoverable",
    !background && "eui-media-frame-no-bg",
    className,
  ].filter(Boolean).join(" ");

  return (
    <div ref={ref} className={classes} style={{ aspectRatio: aspectToValue(aspectRatio), ...style }} {...rest}>
      {children}
    </div>
  );
});
