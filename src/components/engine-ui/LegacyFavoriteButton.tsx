"use client";

/**
 * FavoriteButton — heart toggle (engine-ui)
 * ────────────────────────────────────────────────────────────────────────
 * Airbnb-style heart icon on card images. Filled when active, outline
 * when inactive. Scale-bounce animation on toggle.
 *
 * Stops event propagation so parent card click doesn't fire.
 */

import * as React from "react";
import { Heart } from "lucide-react";

export interface FavoriteButtonProps {
  active?: boolean;
  onChange?: (next: boolean) => void;
  className?: string;
}

export function FavoriteButton({
  active = false,
  onChange,
  className,
}: FavoriteButtonProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onChange?.(!active);
  };

  const rootClass = [
    "eui-favorite-btn",
    active && "eui-favorite-active",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type="button"
      className={rootClass}
      onClick={handleClick}
      aria-label={active ? "Usuń z ulubionych" : "Dodaj do ulubionych"}
      aria-pressed={active}
    >
      <Heart
        size={20}
        fill={active ? "currentColor" : "none"}
        strokeWidth={active ? 0 : 2}
      />
    </button>
  );
}
