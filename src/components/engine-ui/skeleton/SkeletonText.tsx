"use client";

import * as React from "react";
import { Skeleton } from "./Skeleton";

const VARIANT_HEIGHT: Record<NonNullable<SkeletonTextProps["variant"]>, number> = {
  title: 24,
  body: 16,
  caption: 12,
  label: 14,
};

export interface SkeletonTextProps {
  variant?: "title" | "body" | "caption" | "label";
  width?: number | string;
  lines?: number;
  lastLineWidth?: number | string;
  className?: string;
}

export const SkeletonText = React.forwardRef<HTMLSpanElement, SkeletonTextProps>(
  function SkeletonText(
    { variant = "body", width = "100%", lines = 1, lastLineWidth = "70%", className },
    ref
  ) {
    const height = VARIANT_HEIGHT[variant];

    if (lines === 1) {
      return (
        <Skeleton
          ref={ref}
          width={width}
          height={height}
          radius="sm"
          className={className}
        />
      );
    }

    return (
      <span
        ref={ref}
        className={["eui-skeleton-text-stack", className].filter(Boolean).join(" ")}
        aria-hidden="true"
      >
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton
            key={i}
            width={i === lines - 1 ? lastLineWidth : width}
            height={height}
            radius="sm"
          />
        ))}
      </span>
    );
  }
);

SkeletonText.displayName = "SkeletonText";
