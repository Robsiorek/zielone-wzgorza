"use client";

import * as React from "react";

export interface BackdropProps extends React.HTMLAttributes<HTMLDivElement> {
  blur?: boolean;
  onDismiss?: () => void;
  intensity?: "light" | "medium" | "heavy";
  open?: boolean;
}

export const Backdrop = React.forwardRef<HTMLDivElement, BackdropProps>(
  function Backdrop(
    { blur = true, onDismiss, intensity = "medium", open, className, onClick, ...rest },
    ref
  ) {
    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
      onClick?.(e);
      if (e.target === e.currentTarget && onDismiss) {
        onDismiss();
      }
    };

    const classes = [
      "eui-backdrop",
      `eui-backdrop-${intensity}`,
      blur && "eui-backdrop-blur",
      open && "eui-backdrop-visible",
      className,
    ].filter(Boolean).join(" ");

    return (
      <div
        ref={ref}
        className={classes}
        data-state={open ? "open" : "closed"}
        onClick={handleClick}
        aria-hidden="true"
        {...rest}
      />
    );
  }
);
