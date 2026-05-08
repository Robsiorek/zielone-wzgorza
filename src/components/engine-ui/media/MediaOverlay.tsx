"use client";

import * as React from "react";

export interface MediaOverlayProps extends React.HTMLAttributes<HTMLDivElement> {
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right" | "center" | "cover";
  inset?: "sm" | "md" | "lg";
}

const POSITION_CLASS: Record<NonNullable<MediaOverlayProps["position"]>, string> = {
  "top-left": "eui-media-overlay-top-left",
  "top-right": "eui-media-overlay-top-right",
  "bottom-left": "eui-media-overlay-bottom-left",
  "bottom-right": "eui-media-overlay-bottom-right",
  "center": "eui-media-overlay-center",
  "cover": "eui-media-overlay-cover",
};

const INSET_CLASS: Record<NonNullable<MediaOverlayProps["inset"]>, string> = {
  sm: "eui-media-overlay-inset-sm",
  md: "eui-media-overlay-inset-md",
  lg: "eui-media-overlay-inset-lg",
};

export const MediaOverlay = React.forwardRef<HTMLDivElement, MediaOverlayProps>(function MediaOverlay(
  { position = "top-right", inset = "md", className, children, ...rest },
  ref
) {
  const classes = [
    "eui-media-overlay",
    POSITION_CLASS[position],
    INSET_CLASS[inset],
    className,
  ].filter(Boolean).join(" ");

  return <div ref={ref} className={classes} {...rest}>{children}</div>;
});
