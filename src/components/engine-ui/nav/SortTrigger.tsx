"use client";

import * as React from "react";
import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";

export type SortDirection = "asc" | "desc" | null;

export interface SortTriggerProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onClick"> {
  direction: SortDirection;
  onDirectionChange?: (next: SortDirection) => void;
  cycle?: "asc-desc-null" | "asc-desc";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

const NEXT_STATE: Record<
  NonNullable<SortTriggerProps["cycle"]>,
  Record<string, SortDirection>
> = {
  "asc-desc-null": { null: "asc", asc: "desc", desc: null as SortDirection },
  "asc-desc": { null: "asc", asc: "desc", desc: "asc" },
};

export const SortTrigger = React.forwardRef<HTMLButtonElement, SortTriggerProps>(
  function SortTrigger(
    {
      direction,
      onDirectionChange,
      cycle = "asc-desc-null",
      size = "md",
      className,
      children,
      ...rest
    },
    ref
  ) {
    const handleClick = () => {
      const key = String(direction);
      const next = NEXT_STATE[cycle][key];
      onDirectionChange?.(next);
    };

    const classes = [
      "eui-sort-trigger",
      `eui-sort-trigger-size-${size}`,
      direction && "eui-sort-trigger-active",
      className,
    ].filter(Boolean).join(" ");

    const icon = direction === "asc" ? (
      <ArrowUp size={14} />
    ) : direction === "desc" ? (
      <ArrowDown size={14} />
    ) : (
      <ArrowUpDown size={14} />
    );

    const labelText = typeof children === "string" ? children : "";
    const dynamicAriaLabel =
      direction === "asc"
        ? `${labelText}, sortuj malejąco`
        : direction === "desc"
        ? cycle === "asc-desc-null"
          ? `${labelText}, wyłącz sortowanie`
          : `${labelText}, sortuj rosnąco`
        : `${labelText}, sortuj rosnąco`;

    return (
      <button
        ref={ref}
        type="button"
        className={classes}
        onClick={handleClick}
        aria-label={dynamicAriaLabel}
        aria-pressed={direction !== null}
        {...rest}
      >
        <span className="eui-sort-trigger-label">{children}</span>
        <span className="eui-sort-trigger-icon">{icon}</span>
      </button>
    );
  }
);
