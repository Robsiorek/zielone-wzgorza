"use client";

/**
 * CloseButton — a preset IconButton for closing modals, popovers, sheets.
 * ════════════════════════════════════════════════════════════════════════
 * There's no reason every modal should re-type <IconButton icon={<X />}
 * aria-label="Zamknij" />. This is that, reused.
 *
 * Default:
 *   - variant: "ghost"
 *   - size: "md"
 *   - icon: lucide X
 *   - aria-label: "Zamknij"   (in Polish — matches all our user-facing copy)
 *
 * Placement hint: typically top-right corner of a modal header, with
 * consistent spacing (16px padding). The caller is responsible for
 * placement; CloseButton only renders itself.
 *
 * If you need a close button with different copy (e.g. "Anuluj"),
 * override `aria-label`.
 */

import * as React from "react";
import { X } from "lucide-react";
import { IconButton, type IconButtonProps } from "./IconButton";

export interface CloseButtonProps
  extends Omit<IconButtonProps, "icon" | "aria-label"> {
  /** Override aria-label. Default "Zamknij". */
  "aria-label"?: string;
}

export const CloseButton = React.forwardRef<HTMLButtonElement, CloseButtonProps>(
  function CloseButton(
    { variant = "ghost", size = "md", "aria-label": ariaLabel = "Zamknij", ...rest },
    ref
  ) {
    return (
      <IconButton
        ref={ref}
        variant={variant}
        size={size}
        icon={<X />}
        aria-label={ariaLabel}
        {...rest}
      />
    );
  }
);
