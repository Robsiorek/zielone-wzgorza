"use client";

/**
 * BackButton — a preset IconButton for navigating back.
 * ════════════════════════════════════════════════════════════════════════
 * Use in:
 *   - Mobile sheet headers (BottomSheet, Drawer)
 *   - Detail pages on mobile
 *   - Multi-step flows (booking engine checkout)
 *
 * Default:
 *   - variant: "ghost"
 *   - size: "md"
 *   - icon: lucide ChevronLeft
 *   - aria-label: "Wróć"
 *
 * For a "back with label" (text button), don't use this — use <Button
 * variant="ghost" iconLeft={<ChevronLeft />}>Wróć</Button> instead. This
 * is for icon-only back buttons.
 */

import * as React from "react";
import { ChevronLeft } from "lucide-react";
import { IconButton, type IconButtonProps } from "./IconButton";

export interface BackButtonProps
  extends Omit<IconButtonProps, "icon" | "aria-label"> {
  "aria-label"?: string;
}

export const BackButton = React.forwardRef<HTMLButtonElement, BackButtonProps>(
  function BackButton(
    { variant = "ghost", size = "md", "aria-label": ariaLabel = "Wróć", ...rest },
    ref
  ) {
    return (
      <IconButton
        ref={ref}
        variant={variant}
        size={size}
        icon={<ChevronLeft />}
        aria-label={ariaLabel}
        {...rest}
      />
    );
  }
);
