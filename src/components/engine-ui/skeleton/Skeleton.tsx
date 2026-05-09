"use client";

import * as React from "react";
import { type AspectRatio, aspectToValue } from "../media/aspect-ratio";

export interface SkeletonProps {
  /** Width: number → px, string → as-is ("60%", "100%", "auto") */
  width?: number | string;

  /** Height: number → px, string → as-is */
  height?: number | string;

  /** Border radius token */
  radius?: "none" | "sm" | "md" | "lg" | "xl" | "2xl" | "full";

  /** Aspect ratio (override height) */
  aspectRatio?: AspectRatio;

  /** Custom className (composition) */
  className?: string;

  /** Inline styles (rare — escape hatch) */
  style?: React.CSSProperties;
}

const formatDim = (v: number | string | undefined): string | undefined => {
  if (v === undefined) return undefined;
  return typeof v === "number" ? `${v}px` : v;
};

export const Skeleton = React.forwardRef<HTMLSpanElement, SkeletonProps>(
  function Skeleton(
    { width, height, radius = "md", aspectRatio, className, style },
    ref
  ) {
    const computedStyle: React.CSSProperties = {
      ...style,
      width: formatDim(width),
      height: aspectRatio ? undefined : formatDim(height),
      aspectRatio: aspectRatio ? aspectToValue(aspectRatio) : undefined,
    };

    const classes = [
      "eui-skeleton",
      `eui-skeleton-radius-${radius}`,
      className,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <span
        ref={ref}
        aria-hidden="true"
        className={classes}
        style={computedStyle}
      />
    );
  }
);

Skeleton.displayName = "Skeleton";
