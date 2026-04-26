"use client";

/**
 * IconButton — square/circular button with only an icon (engine-ui).
 * See JSDoc in blueprint for full documentation.
 */

import * as React from "react";
import { Loader2 } from "lucide-react";
import { Pressable, type PressableProps } from "../interaction/Pressable";

export type IconButtonVariant = "ghost" | "soft" | "solid" | "inverse";
export type IconButtonSize = "xs" | "sm" | "md" | "lg";
export type IconButtonShape = "pill" | "square";

export interface IconButtonProps
  extends Omit<PressableProps, "children" | "as" | "aria-label"> {
  "aria-label": string;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  shape?: IconButtonShape;
  icon: React.ReactNode;
  type?: "button" | "submit" | "reset";
}

export const ICON_BUTTON_DIMENSIONS = {
  xs: { size: 24, iconSize: 14 },
  sm: { size: 32, iconSize: 16 },
  md: { size: 40, iconSize: 18 },
  lg: { size: 48, iconSize: 20 },
} as const;

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  function IconButton(
    {
      "aria-label": ariaLabel,
      variant = "ghost",
      size = "md",
      shape = "pill",
      icon,
      type = "button",
      disabled,
      loading,
      className: classNameProp,
      ...rest
    },
    ref
  ) {
    // Dev-mode accessibility check
    if (process.env.NODE_ENV === "development" && !ariaLabel) {
      console.error("[IconButton] aria-label is required for accessibility");
    }

    const className = [
      "eui-icon-button",
      `eui-icon-button-variant-${variant}`,
      `eui-icon-button-size-${size}`,
      shape === "square" && "eui-icon-button-square",
      variant === "solid" && "eui-focus-ring-inverse",
      classNameProp,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <Pressable
        ref={ref as React.Ref<HTMLElement>}
        as="button"
        type={type}
        disabled={disabled}
        loading={loading}
        aria-label={ariaLabel}
        aria-busy={loading || undefined}
        className={className}
        {...rest}
      >
        {loading ? (
          <Loader2 className="eui-icon-button-spinner" />
        ) : (
          <span className="eui-icon-button-icon">{icon}</span>
        )}
      </Pressable>
    );
  }
);
