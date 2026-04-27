"use client";

import * as React from "react";
import { AlertCircle, CheckCircle2, AlertTriangle } from "lucide-react";

export type HelperTextVariant = "default" | "error" | "success" | "warning";

export interface HelperTextProps extends React.HTMLAttributes<HTMLElement> {
  variant?: HelperTextVariant;
  showIcon?: boolean;
  size?: "sm" | "md";
  as?: "p" | "span" | "div";
  children: React.ReactNode;
}

const VARIANT_ICONS = {
  error: AlertCircle,
  success: CheckCircle2,
  warning: AlertTriangle,
  default: null,
} as const;

export const HelperText = React.forwardRef<HTMLElement, HelperTextProps>(
  function HelperText(
    { variant = "default", showIcon, size = "md", as = "p", className, children, ...rest },
    ref
  ) {
    const effectiveShowIcon = showIcon ?? (variant !== "default");
    const Icon = VARIANT_ICONS[variant];
    const Element = as as React.ElementType;
    const sizeClass = size === "sm" ? "eui-caption" : "eui-body-small";

    const classes = [
      "eui-helper-text",
      `eui-helper-text-${variant}`,
      sizeClass,
      className,
    ].filter(Boolean).join(" ");

    return (
      <Element ref={ref} className={classes} {...rest}>
        {effectiveShowIcon && Icon && (
          <Icon size={size === "sm" ? 12 : 14} className="eui-helper-text-icon" aria-hidden="true" />
        )}
        <span className="eui-helper-text-label">{children}</span>
      </Element>
    );
  }
);
