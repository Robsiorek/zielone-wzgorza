"use client";

import * as React from "react";
import { Skeleton } from "./Skeleton";
import type { AspectRatio } from "../media/aspect-ratio";

export interface SkeletonImageProps {
  aspectRatio?: AspectRatio;
  width?: number | string;
  radius?: "none" | "sm" | "md" | "lg" | "xl" | "2xl";
  className?: string;
}

export const SkeletonImage = React.forwardRef<HTMLSpanElement, SkeletonImageProps>(
  function SkeletonImage(
    { aspectRatio = "photo", width = "100%", radius = "lg", className },
    ref
  ) {
    return (
      <Skeleton
        ref={ref}
        width={width}
        aspectRatio={aspectRatio}
        radius={radius}
        className={className}
      />
    );
  }
);

SkeletonImage.displayName = "SkeletonImage";
