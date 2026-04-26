"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from "lucide-react";
import type { LucideProps } from "lucide-react";

export interface ChevronProps extends React.SVGAttributes<SVGSVGElement> {
  direction: "left" | "right" | "up" | "down";
  size?: number;
  strokeWidth?: number;
}

const DIRECTION_MAP: Record<ChevronProps["direction"], React.ComponentType<LucideProps>> = {
  left: ChevronLeft,
  right: ChevronRight,
  up: ChevronUp,
  down: ChevronDown,
};

export const Chevron = React.forwardRef<SVGSVGElement, ChevronProps>(
  function Chevron({ direction, size = 18, strokeWidth = 2, ...rest }, ref) {
    const Icon = DIRECTION_MAP[direction];
    return <Icon ref={ref} size={size} strokeWidth={strokeWidth} {...rest} />;
  }
);
