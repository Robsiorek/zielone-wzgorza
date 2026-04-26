"use client";

import * as React from "react";
import { X } from "lucide-react";
import { Pressable } from "../interaction/Pressable";

export type ChipVariant = "neutral" | "active" | "outline" | "brand" | "success" | "warning";
export type ChipSize = "sm" | "md";

export interface ChipProps extends Omit<React.HTMLAttributes<HTMLElement>, "onClick"> {
  variant?: ChipVariant;
  size?: ChipSize;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  count?: number;
  onClick?: () => void;
  onRemove?: () => void;
  removeAriaLabel?: string;
  disabled?: boolean;
  children?: React.ReactNode;
}

export const Chip = React.forwardRef<HTMLElement, ChipProps>(function Chip(
  {
    variant = "neutral", size = "md",
    iconLeft, iconRight, count,
    onClick, onRemove, removeAriaLabel = "Usuń",
    disabled = false, className, children, ...rest
  },
  ref
) {
  // Guard: button-in-button is invalid HTML
  if (process.env.NODE_ENV !== "production" && onClick && onRemove) {
    console.error(
      "[Chip] Cannot use both `onClick` and `onRemove` — button-in-button violates HTML spec. " +
      "Use onClick only (chip interactive) OR onRemove only (X button in static chip)."
    );
  }

  const isInteractive = !!onClick;

  const classes = [
    "eui-chip",
    `eui-chip-variant-${variant}`,
    `eui-chip-size-${size}`,
    isInteractive && "eui-chip-interactive",
    disabled && "eui-chip-disabled",
    className,
  ].filter(Boolean).join(" ");

  const bodyContent = (
    <>
      {iconLeft && <span className="eui-chip-icon-left">{iconLeft}</span>}
      <span className="eui-chip-label">{children}</span>
      {typeof count === "number" && <span className="eui-chip-count">({count})</span>}
      {iconRight && !onRemove && <span className="eui-chip-icon-right">{iconRight}</span>}
    </>
  );

  // Case A: onClick → Pressable button, onRemove ignored (dev warning above)
  if (onClick) {
    return (
      <Pressable ref={ref} as="button" type="button" className={classes}
        onClick={disabled ? undefined : onClick} disabled={disabled}
        disablePressScale={size === "sm"} {...rest}>
        {bodyContent}
      </Pressable>
    );
  }

  // Case B: onRemove only → static span + nested remove button (valid HTML)
  if (onRemove) {
    return (
      <span ref={ref as React.Ref<HTMLSpanElement>} className={classes}
        {...(rest as React.HTMLAttributes<HTMLSpanElement>)}>
        {bodyContent}
        <button type="button" className="eui-chip-remove"
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          aria-label={removeAriaLabel} disabled={disabled}>
          <X size={14} />
        </button>
      </span>
    );
  }

  // Case C: static span
  return (
    <span ref={ref as React.Ref<HTMLSpanElement>} className={classes}
      {...(rest as React.HTMLAttributes<HTMLSpanElement>)}>
      {bodyContent}
    </span>
  );
});
