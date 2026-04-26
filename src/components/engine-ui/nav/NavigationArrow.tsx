"use client";

import * as React from "react";
import { IconButton } from "../button/IconButton";
import type { IconButtonProps } from "../button/IconButton";
import { Chevron } from "./Chevron";

export interface NavigationArrowProps
  extends Omit<IconButtonProps, "icon" | "aria-label" | "variant"> {
  direction: "left" | "right" | "up" | "down";
  position?: "default" | "floating";
  navVariant?: "default" | "ghost" | "inverse";
  "aria-label"?: string;
}

const DEFAULT_LABELS: Record<NavigationArrowProps["direction"], string> = {
  left: "Poprzedni",
  right: "Następny",
  up: "Do góry",
  down: "Do dołu",
};

const VARIANT_MAP: Record<
  NonNullable<NavigationArrowProps["navVariant"]>,
  "ghost" | "soft" | "inverse"
> = {
  default: "soft",
  ghost: "ghost",
  inverse: "inverse",
};

export const NavigationArrow = React.forwardRef<HTMLButtonElement, NavigationArrowProps>(
  function NavigationArrow(
    {
      direction,
      position = "default",
      navVariant = "default",
      size = "md",
      "aria-label": ariaLabel,
      className,
      ...rest
    },
    ref
  ) {
    const button = (
      <IconButton
        ref={ref}
        variant={VARIANT_MAP[navVariant]}
        size={size}
        icon={<Chevron direction={direction} />}
        aria-label={ariaLabel ?? DEFAULT_LABELS[direction]}
        className={className}
        {...rest}
      />
    );

    // Floating: wrap in positioned div to avoid Pressable inline
    // transform conflicting with CSS translateY(-50%) centering
    if (position === "floating") {
      const wrapperClasses = [
        "eui-nav-arrow-floating-wrapper",
        `eui-nav-arrow-dir-${direction}`,
      ].join(" ");

      return <div className={wrapperClasses}>{button}</div>;
    }

    return button;
  }
);
