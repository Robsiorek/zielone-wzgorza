"use client";

import * as React from "react";

export interface InlineMetaProps extends Omit<React.HTMLAttributes<HTMLElement>, "children"> {
  items: Array<React.ReactNode | null | undefined | false>;
  separator?: React.ReactNode;
  variant?: "default" | "caption" | "primary";
  as?: "div" | "p" | "span";
}

export const InlineMeta = React.forwardRef<HTMLElement, InlineMetaProps>(
  function InlineMeta(
    { items, separator = "·", variant = "default", as = "div", className, ...rest },
    ref
  ) {
    const Element = as as React.ElementType;
    const visibleItems = items.filter((item): item is React.ReactNode =>
      item !== null && item !== undefined && item !== false
    );

    const sizeClass = variant === "caption" ? "eui-caption" : "eui-body-small";

    const classes = [
      "eui-inline-meta", `eui-inline-meta-${variant}`, sizeClass, className,
    ].filter(Boolean).join(" ");

    return (
      <Element ref={ref} className={classes} {...rest}>
        {visibleItems.map((item, i) => (
          <React.Fragment key={i}>
            {i > 0 && (
              <span className="eui-inline-meta-separator" aria-hidden="true">{separator}</span>
            )}
            <span className="eui-inline-meta-item">{item}</span>
          </React.Fragment>
        ))}
      </Element>
    );
  }
);
