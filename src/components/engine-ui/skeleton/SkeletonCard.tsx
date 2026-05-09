"use client";

import * as React from "react";
import { SkeletonImage } from "./SkeletonImage";
import { SkeletonText } from "./SkeletonText";
import type { AspectRatio } from "../media/aspect-ratio";

export interface SkeletonCardProps {
  showImage?: boolean;
  imageAspectRatio?: AspectRatio;
  textLines?: number;
  className?: string;
}

export const SkeletonCard = React.forwardRef<HTMLSpanElement, SkeletonCardProps>(
  function SkeletonCard(
    { showImage = true, imageAspectRatio = "photo", textLines = 3, className },
    ref
  ) {
    return (
      <span
        ref={ref}
        className={["eui-skeleton-card-stack", className].filter(Boolean).join(" ")}
        aria-hidden="true"
      >
        {showImage && <SkeletonImage aspectRatio={imageAspectRatio} radius="lg" />}
        <span className="eui-skeleton-card-stack-content">
          {textLines >= 1 && <SkeletonText variant="title" width="80%" />}
          {textLines >= 2 && <SkeletonText variant="body" width="60%" />}
          {textLines >= 3 && <SkeletonText variant="caption" width="40%" />}
        </span>
      </span>
    );
  }
);

SkeletonCard.displayName = "SkeletonCard";
