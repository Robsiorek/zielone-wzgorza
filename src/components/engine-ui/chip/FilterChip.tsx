"use client";

import * as React from "react";
import { Chip } from "./Chip";
import type { ChipProps } from "./Chip";

export interface FilterChipProps extends Omit<ChipProps, "variant" | "onClick"> {
  selected: boolean;
  onSelectedChange?: (next: boolean) => void;
  pressedOutline?: boolean;
}

export const FilterChip = React.forwardRef<HTMLElement, FilterChipProps>(
  function FilterChip({ selected, onSelectedChange, pressedOutline, ...rest }, ref) {
    const variant = selected ? (pressedOutline ? "outline" : "active") : "outline";
    return (
      <Chip ref={ref} variant={variant}
        onClick={() => onSelectedChange?.(!selected)}
        aria-pressed={selected} {...rest} />
    );
  }
);
