"use client";

import * as React from "react";

export type TextVariant =
  | "display-1" | "display-2"
  | "title-1" | "title-2" | "title-3"
  | "body-large" | "body" | "body-small"
  | "caption" | "label";

export type TextColor =
  | "primary" | "secondary" | "muted" | "brand"
  | "success" | "warning" | "danger" | "info" | "inherit";

export type TextElement = "p" | "span" | "div" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "strong" | "em";

export interface TextProps extends React.HTMLAttributes<HTMLElement> {
  variant?: TextVariant;
  color?: TextColor;
  as?: TextElement;
  inline?: boolean;
  truncate?: boolean;
  maxLines?: number;
  align?: "left" | "center" | "right";
  weight?: "regular" | "medium" | "semibold" | "bold";
  children?: React.ReactNode;
}

const DEFAULT_ELEMENT: Record<TextVariant, TextElement> = {
  "display-1": "h1",
  "display-2": "h2",
  "title-1": "h2",
  "title-2": "h3",
  "title-3": "h4",
  "body-large": "p",
  "body": "p",
  "body-small": "p",
  "caption": "span",
  "label": "span",
};

export const Text = React.forwardRef<HTMLElement, TextProps>(function Text(
  {
    variant = "body", color, as, inline = false,
    truncate = false, maxLines, align, weight,
    className, children, style: styleProp, ...rest
  },
  ref
) {
  // Priority: explicit `as` always wins. `inline` is shortcut for `as="span"`
  const Element = (as ?? (inline ? "span" : DEFAULT_ELEMENT[variant])) as React.ElementType;

  const classes = [
    `eui-${variant}`,
    color && color !== "inherit" && `eui-text-color-${color}`,
    align && `eui-text-align-${align}`,
    weight && `eui-text-weight-${weight}`,
    truncate && !maxLines && "eui-text-truncate",
    maxLines && "eui-text-clamp",
    className,
  ].filter(Boolean).join(" ");

  const style = maxLines
    ? { WebkitLineClamp: maxLines, ...styleProp } as React.CSSProperties
    : styleProp;

  return (
    <Element ref={ref} className={classes} style={style} {...rest}>
      {children}
    </Element>
  );
});
