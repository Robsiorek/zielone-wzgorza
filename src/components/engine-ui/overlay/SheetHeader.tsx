"use client";

import * as React from "react";
import { CloseButton } from "@/components/engine-ui/button";

export interface SheetHeaderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  closeButton?: React.ReactNode;
  showClose?: boolean;
  onClose?: () => void;
  leftSlot?: React.ReactNode;
  tabs?: React.ReactNode;
  sticky?: boolean;
  children?: React.ReactNode;
}

export const SheetHeader = React.forwardRef<HTMLDivElement, SheetHeaderProps>(
  function SheetHeader(
    {
      title, subtitle, closeButton, showClose = true, onClose,
      leftSlot, tabs, sticky = true, children, className, ...rest
    },
    ref
  ) {
    const classes = [
      "eui-sheet-header",
      sticky && "eui-sheet-header-sticky",
      className,
    ].filter(Boolean).join(" ");

    const closeEl = closeButton ?? (showClose && onClose ? (
      <CloseButton onClick={onClose} />
    ) : null);

    return (
      <div ref={ref} className={classes} {...rest}>
        <div className="eui-sheet-header-row">
          {leftSlot && <div className="eui-sheet-header-left">{leftSlot}</div>}
          <div className="eui-sheet-header-center">
            {title && <h2 className="eui-sheet-header-title">{title}</h2>}
            {subtitle && <p className="eui-sheet-header-subtitle">{subtitle}</p>}
          </div>
          {closeEl && <div className="eui-sheet-header-right">{closeEl}</div>}
        </div>
        {tabs && <div className="eui-sheet-header-tabs">{tabs}</div>}
        {children}
      </div>
    );
  }
);
