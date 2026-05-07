"use client";

import * as React from "react";

export interface DividerProps extends React.HTMLAttributes<HTMLElement> {
  orientation?: "horizontal" | "vertical";
  spacing?: "none" | "sm" | "md" | "lg";
  decorative?: boolean;
}

const SPACING_CLASS: Record<NonNullable<DividerProps["spacing"]>, string> = {
  none: "",
  sm: "eui-divider-spacing-sm",
  md: "eui-divider-spacing-md",
  lg: "eui-divider-spacing-lg",
};

export const Divider = React.forwardRef<HTMLElement, DividerProps>(function Divider(
  { orientation = "horizontal", spacing = "none", decorative = false, className, ...rest },
  ref
) {
  const classes = [
    "eui-divider",
    `eui-divider-${orientation}`,
    SPACING_CLASS[spacing],
    className,
  ].filter(Boolean).join(" ");

  // Decorative: purely visual, hidden from AT
  if (decorative) {
    return (
      <div ref={ref as React.Ref<HTMLDivElement>} className={classes} aria-hidden="true" {...rest} />
    );
  }

  // Semantic horizontal: native <hr>
  if (orientation === "horizontal") {
    return <hr ref={ref as React.Ref<HTMLHRElement>} className={classes} {...rest} />;
  }

  // Semantic vertical: <div role="separator" aria-orientation="vertical">
  return (
    <div
      ref={ref as React.Ref<HTMLDivElement>}
      className={classes}
      role="separator"
      aria-orientation="vertical"
      {...rest}
    />
  );
});
