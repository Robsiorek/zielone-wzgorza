"use client";

/**
 * Button — primary interactive control (engine-ui).
 * See JSDoc in blueprint for full documentation.
 */

import * as React from "react";
import { Loader2 } from "lucide-react";
import { Pressable, type PressableProps } from "../interaction/Pressable";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "subtle"
  | "danger"
  | "link";

export type ButtonSize = "xs" | "sm" | "md" | "lg";
export type ButtonShape = "pill" | "rounded";

export interface ButtonProps
  extends Omit<PressableProps, "children" | "disableFocusRing" | "as"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  shape?: ButtonShape;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  fullWidth?: boolean;
  children?: React.ReactNode;
  type?: "button" | "submit" | "reset";
}

export const BUTTON_DIMENSIONS = {
  xs: { height: 28, paddingX: 10, fontSize: 12, fontWeight: 500, iconSize: 14, gap: 6 },
  sm: { height: 36, paddingX: 14, fontSize: 13, fontWeight: 500, iconSize: 16, gap: 8 },
  md: { height: 44, paddingX: 20, fontSize: 14, fontWeight: 500, iconSize: 16, gap: 8 },
  lg: { height: 52, paddingX: 24, fontSize: 16, fontWeight: 600, iconSize: 18, gap: 10 },
} as const;

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = "primary",
      size = "md",
      shape,
      iconLeft,
      iconRight,
      fullWidth = false,
      children,
      type = "button",
      disabled,
      loading,
      className: classNameProp,
      ...rest
    },
    ref
  ) {
    const className = [
      "eui-button",
      `eui-button-variant-${variant}`,
      `eui-button-size-${size}`,
      shape === "rounded" && "eui-button-rounded",
      shape === "pill" && "eui-button-pill",
      fullWidth && "eui-button-full-width",
      classNameProp,
    ]
      .filter(Boolean)
      .join(" ");

    // Focus ring: primary uses inverse (dark bg), danger too
    const needsInverseRing = variant === "primary" || variant === "secondary" || variant === "danger";

    return (
      <Pressable
        ref={ref as React.Ref<HTMLElement>}
        as="button"
        type={type}
        disabled={disabled}
        loading={loading}
        aria-busy={loading || undefined}
        className={className + (needsInverseRing ? " eui-focus-ring-inverse" : "")}
        disableFocusRing={false}
        {...rest}
      >
        {/* Loading spinner replaces iconLeft */}
        {loading ? (
          <span className="eui-button-icon-left">
            <Loader2 className="eui-button-spinner" />
          </span>
        ) : iconLeft ? (
          <span className="eui-button-icon-left">{iconLeft}</span>
        ) : null}

        {children && (
          <span className="eui-button-label">{children}</span>
        )}

        {iconRight && !loading && (
          <span className="eui-button-icon-right">{iconRight}</span>
        )}
      </Pressable>
    );
  }
);
