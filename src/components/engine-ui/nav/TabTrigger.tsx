"use client";

import * as React from "react";
import { Pressable } from "../interaction/Pressable";

export interface TabTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "underline" | "pill" | "segmented";
  size?: "sm" | "md" | "lg";
  active?: boolean;
  iconLeft?: React.ReactNode;
  count?: number;
  children: React.ReactNode;
}

export const TabTrigger = React.forwardRef<HTMLButtonElement, TabTriggerProps>(
  function TabTrigger(
    {
      variant = "underline",
      size = "md",
      active = false,
      iconLeft,
      count,
      className,
      children,
      ...rest
    },
    ref
  ) {
    const classes = [
      "eui-tab-trigger",
      `eui-tab-trigger-${variant}`,
      `eui-tab-trigger-size-${size}`,
      active && "eui-tab-trigger-active",
      className,
    ].filter(Boolean).join(" ");

    return (
      <Pressable
        ref={ref}
        as="button"
        type="button"
        className={classes}
        role="tab"
        aria-selected={active}
        disablePressScale
        {...rest}
      >
        {iconLeft && <span className="eui-tab-trigger-icon">{iconLeft}</span>}
        <span className="eui-tab-trigger-label">{children}</span>
        {typeof count === "number" && (
          <span className="eui-tab-trigger-count">({count})</span>
        )}
      </Pressable>
    );
  }
);
