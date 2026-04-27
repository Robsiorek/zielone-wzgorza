"use client";

import * as React from "react";
import { Eyebrow } from "./Eyebrow";

export interface SectionHeadingProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  eyebrow?: React.ReactNode;
  eyebrowVariant?: "default" | "brand" | "success";
  title: React.ReactNode;
  description?: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  align?: "left" | "center" | "between";
  action?: React.ReactNode;
  titleAs?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
}

const TITLE_CLASS: Record<string, string> = {
  sm: "eui-title-3",
  md: "eui-title-2",
  lg: "eui-title-1",
  xl: "eui-display-2",
};

const DESCRIPTION_CLASS: Record<string, string> = {
  sm: "eui-body-small",
  md: "eui-body",
  lg: "eui-body-large",
  xl: "eui-body-large",
};

export const SectionHeading = React.forwardRef<HTMLDivElement, SectionHeadingProps>(
  function SectionHeading(
    {
      eyebrow, eyebrowVariant = "default",
      title, description,
      size = "md", align = "left", action,
      titleAs = "h2",
      className, ...rest
    },
    ref
  ) {
    const TitleElement = titleAs;

    const classes = [
      "eui-section-heading",
      align !== "left" && `eui-section-heading-align-${align}`,
      className,
    ].filter(Boolean).join(" ");

    const content = (
      <div className="eui-section-heading-content">
        {eyebrow && <Eyebrow variant={eyebrowVariant}>{eyebrow}</Eyebrow>}
        <TitleElement className={`eui-section-heading-title ${TITLE_CLASS[size]}`}>{title}</TitleElement>
        {description && <p className={`eui-section-heading-description ${DESCRIPTION_CLASS[size]}`}>{description}</p>}
      </div>
    );

    return (
      <div ref={ref} className={classes} {...rest}>
        {content}
        {action && align === "between" && (
          <div className="eui-section-heading-action">{action}</div>
        )}
      </div>
    );
  }
);
