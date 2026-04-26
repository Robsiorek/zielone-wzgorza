"use client";

/**
 * ShareButton — a preset IconButton for sharing content.
 * ════════════════════════════════════════════════════════════════════════
 * Typically used next to FavoriteButton on gallery/detail pages.
 *
 * Default:
 *   - variant: "inverse" (same reasoning as FavoriteButton — usually on
 *     media)
 *   - size: "md"
 *   - icon: lucide Share (iOS-style, not Share2 which is Android-style)
 *   - aria-label: "Udostępnij"
 *
 * Caller controls onClick. ShareButton doesn't have built-in share-sheet
 * logic — leave that to the consumer (different contexts share different
 * things: a resource URL, a booking confirmation, a review).
 *
 * Recommended onClick pattern for consumers:
 *   1. If navigator.share exists → use Web Share API (native share sheet)
 *   2. Else → open custom share popover with copy-link + social icons
 */

import * as React from "react";
import { Share } from "lucide-react";
import { IconButton, type IconButtonProps } from "./IconButton";

export interface ShareButtonProps
  extends Omit<IconButtonProps, "icon" | "aria-label"> {
  "aria-label"?: string;
}

export const ShareButton = React.forwardRef<HTMLButtonElement, ShareButtonProps>(
  function ShareButton(
    {
      variant = "inverse",
      size = "md",
      "aria-label": ariaLabel = "Udostępnij",
      ...rest
    },
    ref
  ) {
    return (
      <IconButton
        ref={ref}
        variant={variant}
        size={size}
        icon={<Share />}
        aria-label={ariaLabel}
        {...rest}
      />
    );
  }
);
