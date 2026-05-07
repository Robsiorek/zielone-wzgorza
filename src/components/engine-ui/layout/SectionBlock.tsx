"use client";

import * as React from "react";
import { SectionHeading, type SectionHeadingProps } from "../text";

export interface SectionBlockProps extends React.HTMLAttributes<HTMLElement> {
  heading?: Omit<SectionHeadingProps, "ref">;
  padding?: "none" | "sm" | "md" | "lg";
  as?: "section" | "div" | "article" | "aside";
}

const PADDING_CLASS: Record<NonNullable<SectionBlockProps["padding"]>, string> = {
  none: "",
  sm: "eui-section-block-padding-sm",
  md: "eui-section-block-padding-md",
  lg: "eui-section-block-padding-lg",
};

export const SectionBlock = React.forwardRef<HTMLElement, SectionBlockProps>(function SectionBlock(
  { heading, padding = "none", as = "section", className, children, ...rest },
  ref
) {
  const Element = as as React.ElementType;

  const classes = [
    "eui-section-block",
    PADDING_CLASS[padding],
    className,
  ].filter(Boolean).join(" ");

  return (
    <Element ref={ref} className={classes} {...rest}>
      {heading && <SectionHeading {...heading} />}
      <div className="eui-section-block-content">{children}</div>
    </Element>
  );
});
