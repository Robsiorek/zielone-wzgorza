"use client";

import * as React from "react";

export interface MediaBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "brand" | "dark";
}

const VARIANT_CLASS: Record<NonNullable<MediaBadgeProps["variant"]>, string> = {
  default: "eui-media-badge-default",
  brand: "eui-media-badge-brand",
  dark: "eui-media-badge-dark",
};

export const MediaBadge = React.forwardRef<HTMLSpanElement, MediaBadgeProps>(function MediaBadge(
  { variant = "default", className, children, ...rest },
  ref
) {
  const classes = [
    "eui-media-badge",
    "eui-label",
    VARIANT_CLASS[variant],
    className,
  ].filter(Boolean).join(" ");

  return <span ref={ref} className={classes} {...rest}>{children}</span>;
});
