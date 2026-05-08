"use client";

import * as React from "react";
import { VisuallyHidden } from "../a11y/VisuallyHidden";

export interface ImageCounterProps extends React.HTMLAttributes<HTMLSpanElement> {
  current: number;
  total: number;
  variant?: "pill" | "minimal";
}

const VARIANT_CLASS: Record<NonNullable<ImageCounterProps["variant"]>, string> = {
  pill: "eui-image-counter-pill",
  minimal: "eui-image-counter-minimal",
};

export const ImageCounter = React.forwardRef<HTMLSpanElement, ImageCounterProps>(
  function ImageCounter({ current, total, variant = "pill", className, ...rest }, ref) {
    const classes = [
      "eui-image-counter",
      "eui-body-small",
      VARIANT_CLASS[variant],
      className,
    ].filter(Boolean).join(" ");

    // A11y: VisuallyHidden text reads naturally to AT ("Zdjęcie 3 z 12"),
    // visible "3 / 12" hidden from AT to avoid duplication.
    // aria-label on non-interactive <span> is unreliably ignored by many
    // screen readers (NVDA, JAWS) — VisuallyHidden is the robust pattern.
    return (
      <span ref={ref} className={classes} {...rest}>
        <VisuallyHidden>Zdjęcie {current} z {total}</VisuallyHidden>
        <span aria-hidden="true">{current} / {total}</span>
      </span>
    );
  }
);
