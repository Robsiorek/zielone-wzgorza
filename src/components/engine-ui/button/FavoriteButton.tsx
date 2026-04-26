"use client";

/**
 * FavoriteButton — heart toggle with pulse animation (engine-ui).
 * See JSDoc in blueprint for full documentation.
 */

import * as React from "react";
import { Heart } from "lucide-react";
import { IconButton, type IconButtonProps } from "./IconButton";

export interface FavoriteButtonProps
  extends Omit<IconButtonProps, "icon" | "aria-label" | "onClick" | "onChange"> {
  favorited: boolean;
  onChange: (next: boolean) => void;
  "aria-label"?: string;
}

export const FavoriteButton = React.forwardRef<
  HTMLButtonElement,
  FavoriteButtonProps
>(function FavoriteButton(
  {
    favorited,
    onChange,
    "aria-label": ariaLabel,
    variant = "inverse",
    size = "md",
    className: classNameProp,
    ...rest
  },
  ref
) {
  const [pulse, setPulse] = React.useState(false);
  const prevFavRef = React.useRef(favorited);

  // Trigger pulse animation when transitioning to favorited
  React.useEffect(() => {
    if (favorited && !prevFavRef.current) {
      setPulse(true);
      const timer = setTimeout(() => setPulse(false), 300);
      return () => clearTimeout(timer);
    }
    prevFavRef.current = favorited;
  }, [favorited]);

  const handleClick = () => {
    onChange(!favorited);
  };

  const label = ariaLabel ?? (favorited ? "Usuń z ulubionych" : "Dodaj do ulubionych");

  const className = [
    pulse && "eui-favorite-pulse",
    classNameProp,
  ]
    .filter(Boolean)
    .join(" ") || undefined;

  const heartIcon = (
    <span
      style={{
        color: favorited ? "var(--eui-danger, #ff385c)" : "var(--eui-grey-700)",
        display: "inline-flex",
      }}
    >
      <Heart
        fill={favorited ? "currentColor" : "none"}
        strokeWidth={favorited ? 0 : 2}
      />
    </span>
  );

  return (
    <IconButton
      ref={ref}
      variant={variant}
      size={size}
      icon={heartIcon}
      aria-label={label}
      aria-pressed={favorited}
      onClick={handleClick}
      className={className}
      {...rest}
    />
  );
});
