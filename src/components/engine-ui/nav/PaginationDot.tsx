"use client";

import * as React from "react";

export interface PaginationDotProps extends Omit<React.HTMLAttributes<HTMLButtonElement>, "onClick"> {
  state?: "inactive" | "active" | "disabled";
  size?: "sm" | "md" | "lg";
  interactive?: boolean;
  onClick?: () => void;
  "aria-label"?: string;
}

export const PaginationDot = React.forwardRef<HTMLElement, PaginationDotProps>(
  function PaginationDot(
    {
      state = "inactive",
      size = "md",
      interactive = false,
      onClick,
      className,
      "aria-label": ariaLabel,
      ...rest
    },
    ref
  ) {
    const classes = [
      "eui-pagination-dot",
      `eui-pagination-dot-${state}`,
      `eui-pagination-dot-size-${size}`,
      interactive && "eui-pagination-dot-interactive",
      className,
    ].filter(Boolean).join(" ");

    if (interactive) {
      return (
        <button
          ref={ref as React.Ref<HTMLButtonElement>}
          type="button"
          className={classes}
          onClick={onClick}
          disabled={state === "disabled"}
          aria-label={ariaLabel}
          aria-current={state === "active" ? "true" : undefined}
          {...(rest as React.ButtonHTMLAttributes<HTMLButtonElement>)}
        />
      );
    }

    return (
      <span
        ref={ref as React.Ref<HTMLSpanElement>}
        className={classes}
        aria-hidden="true"
        {...(rest as React.HTMLAttributes<HTMLSpanElement>)}
      />
    );
  }
);
