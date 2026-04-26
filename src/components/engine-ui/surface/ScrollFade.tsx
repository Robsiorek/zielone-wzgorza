"use client";

import * as React from "react";

export interface ScrollFadeProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: "vertical" | "horizontal";
  size?: "sm" | "md" | "lg";
  fadeColor?: string;
  children?: React.ReactNode;
}

export const ScrollFade = React.forwardRef<HTMLDivElement, ScrollFadeProps>(
  function ScrollFade(
    { orientation = "vertical", size = "md", fadeColor, children, className, style, ...rest },
    ref
  ) {
    const classes = [
      "eui-scroll-fade",
      `eui-scroll-fade-${orientation}`,
      `eui-scroll-fade-${size}`,
      className,
    ].filter(Boolean).join(" ");

    const customStyle = fadeColor
      ? { ...style, "--eui-scroll-fade-color": fadeColor } as React.CSSProperties
      : style;

    return (
      <div ref={ref} className={classes} style={customStyle} {...rest}>
        <div className="eui-scroll-fade-content">{children}</div>
      </div>
    );
  }
);
