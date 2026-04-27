"use client";

import * as React from "react";

export interface EmptyStateTextProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title: React.ReactNode;
  description?: React.ReactNode;
  size?: "sm" | "md" | "lg";
  align?: "left" | "center";
  titleAs?: "h2" | "h3" | "h4" | "h5";
}

const TITLE_CLASS: Record<string, string> = {
  sm: "eui-title-3",
  md: "eui-title-2",
  lg: "eui-display-2",
};

const DESCRIPTION_CLASS: Record<string, string> = {
  sm: "eui-body-small",
  md: "eui-body",
  lg: "eui-body-large",
};

export const EmptyStateText = React.forwardRef<HTMLDivElement, EmptyStateTextProps>(
  function EmptyStateText(
    { title, description, size = "md", align = "center", titleAs = "h3", className, ...rest },
    ref
  ) {
    const TitleElement = titleAs;

    const classes = [
      "eui-empty-state-text",
      align === "center" && "eui-empty-state-text-align-center",
      className,
    ].filter(Boolean).join(" ");

    return (
      <div ref={ref} className={classes} {...rest}>
        <TitleElement className={`eui-empty-state-text-title ${TITLE_CLASS[size]}`}>{title}</TitleElement>
        {description && <p className={`eui-empty-state-text-description ${DESCRIPTION_CLASS[size]}`}>{description}</p>}
      </div>
    );
  }
);
