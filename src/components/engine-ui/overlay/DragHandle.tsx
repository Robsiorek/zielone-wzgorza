"use client";

import * as React from "react";

export interface DragHandleProps extends React.HTMLAttributes<HTMLDivElement> {
  visible?: boolean;
}

export const DragHandle = React.forwardRef<HTMLDivElement, DragHandleProps>(
  function DragHandle({ visible = true, className, ...rest }, ref) {
    const classes = [
      "eui-drag-handle",
      !visible && "eui-drag-handle-hidden",
      className,
    ].filter(Boolean).join(" ");

    return (
      <div ref={ref} className={classes} aria-hidden="true" {...rest}>
        <div className="eui-drag-handle-bar" />
      </div>
    );
  }
);
