"use client";

import * as React from "react";
import { FavoriteButton } from "../button/FavoriteButton";
import { MediaOverlay } from "./MediaOverlay";

export interface FavoriteOverlayProps {
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  inset?: "sm" | "md" | "lg";
  favorited: boolean;
  onChange: (next: boolean) => void;
  "aria-label"?: string;
  size?: "sm" | "md" | "lg";
}

export const FavoriteOverlay = React.forwardRef<HTMLDivElement, FavoriteOverlayProps>(
  function FavoriteOverlay(
    { position = "top-right", inset = "md", favorited, onChange, "aria-label": ariaLabel, size = "md" },
    ref
  ) {
    return (
      <MediaOverlay ref={ref} position={position} inset={inset}>
        <FavoriteButton favorited={favorited} onChange={onChange} aria-label={ariaLabel} size={size} />
      </MediaOverlay>
    );
  }
);
