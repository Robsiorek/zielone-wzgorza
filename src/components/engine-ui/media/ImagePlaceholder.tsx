"use client";

import * as React from "react";
import { ImageOff } from "lucide-react";

export interface ImagePlaceholderProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  text?: string;
  size?: "sm" | "md" | "lg";
}

const ICON_SIZE: Record<NonNullable<ImagePlaceholderProps["size"]>, number> = {
  sm: 24, md: 32, lg: 48,
};

const SIZE_CLASS: Record<NonNullable<ImagePlaceholderProps["size"]>, string> = {
  sm: "eui-image-placeholder-sm",
  md: "eui-image-placeholder-md",
  lg: "eui-image-placeholder-lg",
};

const TEXT_UTILITY_CLASS: Record<NonNullable<ImagePlaceholderProps["size"]>, string> = {
  sm: "eui-caption",
  md: "eui-body-small",
  lg: "eui-body",
};

export const ImagePlaceholder = React.forwardRef<HTMLDivElement, ImagePlaceholderProps>(
  function ImagePlaceholder({ icon, text, size = "md", className, ...rest }, ref) {
    const classes = ["eui-image-placeholder", SIZE_CLASS[size], className].filter(Boolean).join(" ");
    const renderedIcon = icon ?? <ImageOff size={ICON_SIZE[size]} aria-hidden="true" />;
    const textClasses = ["eui-image-placeholder-text", TEXT_UTILITY_CLASS[size]].join(" ");

    return (
      <div ref={ref} className={classes} {...rest}>
        <div className="eui-image-placeholder-icon">{renderedIcon}</div>
        {text && <div className={textClasses}>{text}</div>}
      </div>
    );
  }
);
