"use client";

import * as React from "react";

export interface SheetFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  layout?: "end" | "between" | "stacked";
  sticky?: boolean;
  children: React.ReactNode;
}

export const SheetFooter = React.forwardRef<HTMLDivElement, SheetFooterProps>(
  function SheetFooter({ layout = "between", sticky = true, children, className, ...rest }, ref) {
    const classes = [
      "eui-sheet-footer",
      `eui-sheet-footer-${layout}`,
      sticky && "eui-sheet-footer-sticky",
      className,
    ].filter(Boolean).join(" ");

    return (
      <div ref={ref} className={classes} {...rest}>
        {children}
      </div>
    );
  }
);
