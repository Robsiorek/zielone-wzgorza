"use client";

import * as React from "react";
import { NavigationArrow } from "../nav/NavigationArrow";

export interface GalleryNavButtonProps {
  direction: "left" | "right";
  onClick?: (e: React.MouseEvent) => void;
  visible?: boolean;
  size?: "sm" | "md";
  "aria-label"?: string;
}

const DEFAULT_LABELS = {
  left: "Poprzednie zdjęcie",
  right: "Następne zdjęcie",
};

export const GalleryNavButton = React.forwardRef<HTMLButtonElement, GalleryNavButtonProps>(
  function GalleryNavButton(
    { direction, onClick, visible, size = "md", "aria-label": ariaLabel },
    ref
  ) {
    const handleClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      onClick?.(e);
    };

    // Marker class only — NO position/transform (comes from NavigationArrow wrapper)
    const markerClass = [
      "eui-gallery-nav-button",
      visible === true && "eui-gallery-nav-button-visible",
      visible === false && "eui-gallery-nav-button-hidden",
    ].filter(Boolean).join(" ");

    // When explicitly hidden: remove from tab order + AT + disable functionally
    const isExplicitlyHidden = visible === false;

    return (
      <NavigationArrow
        ref={ref}
        direction={direction}
        position="floating"
        navVariant="default"
        size={size}
        onClick={handleClick}
        aria-label={ariaLabel ?? DEFAULT_LABELS[direction]}
        className={markerClass}
        disabled={isExplicitlyHidden}
        tabIndex={isExplicitlyHidden ? -1 : undefined}
        aria-hidden={isExplicitlyHidden ? true : undefined}
      />
    );
  }
);
