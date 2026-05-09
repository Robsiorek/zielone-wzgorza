"use client";

import * as React from "react";
import { Skeleton } from "./Skeleton";

const SIZE_TOKEN: Record<"xs" | "sm" | "md" | "lg" | "xl", number> = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 56,
  xl: 80,
};

export interface SkeletonCircleProps {
  size?: number | "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}

export const SkeletonCircle = React.forwardRef<HTMLSpanElement, SkeletonCircleProps>(
  function SkeletonCircle({ size = "md", className }, ref) {
    const dimension = typeof size === "number" ? size : SIZE_TOKEN[size];

    return (
      <Skeleton
        ref={ref}
        width={dimension}
        height={dimension}
        radius="full"
        className={className}
      />
    );
  }
);

SkeletonCircle.displayName = "SkeletonCircle";
