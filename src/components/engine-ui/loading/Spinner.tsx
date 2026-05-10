"use client";

import * as React from "react";

const SIZE_PX: Record<"sm" | "md" | "lg", number> = {
  sm: 16,
  md: 24,
  lg: 40,
};

const STROKE_WIDTH: Record<"sm" | "md" | "lg", number> = {
  sm: 2,
  md: 2.5,
  lg: 3,
};

export interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  variant?: "default" | "primary" | "inverse";
  className?: string;
}

export const Spinner = React.forwardRef<SVGSVGElement, SpinnerProps>(
  function Spinner({ size = "md", variant = "default", className }, ref) {
    const dimension = SIZE_PX[size];
    const strokeWidth = STROKE_WIDTH[size];

    return (
      <svg
        ref={ref}
        width={dimension}
        height={dimension}
        viewBox="0 0 24 24"
        className={[
          "eui-spinner",
          `eui-spinner-${variant}`,
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        aria-hidden="true"
      >
        <circle
          cx="12"
          cy="12"
          r="10"
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeOpacity="0.2"
        />
        <circle
          cx="12"
          cy="12"
          r="10"
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray="60"
          strokeDashoffset="40"
        />
      </svg>
    );
  }
);

Spinner.displayName = "Spinner";
