"use client";

import * as React from "react";
import { Star } from "lucide-react";

export interface RatingPillProps extends React.HTMLAttributes<HTMLSpanElement> {
  score: number;
  count?: number;
  variant?: "solid" | "soft" | "inline";
  size?: "sm" | "md";
  formatScore?: (score: number) => string;
}

export const RatingPill = React.forwardRef<HTMLSpanElement, RatingPillProps>(
  function RatingPill(
    { score, count, variant = "solid", size = "md", formatScore = (s) => s.toFixed(2), className, ...rest },
    ref
  ) {
    const classes = [
      "eui-rating-pill",
      `eui-rating-pill-variant-${variant}`,
      `eui-rating-pill-size-${size}`,
      className,
    ].filter(Boolean).join(" ");

    const iconSize = size === "sm" ? 12 : 14;

    return (
      <span ref={ref} className={classes} {...rest}>
        <Star size={iconSize} className="eui-rating-pill-star" aria-hidden="true" />
        <span className="eui-rating-pill-score">{formatScore(score)}</span>
        {typeof count === "number" && (
          <>
            <span className="eui-rating-pill-separator" aria-hidden="true">·</span>
            <span className="eui-rating-pill-count">{count}</span>
          </>
        )}
      </span>
    );
  }
);
