"use client";

import * as React from "react";
import { MediaFrame } from "./MediaFrame";

export interface ThumbnailStripProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onSelect"> {
  images: { url: string; alt: string }[];
  activeIndex: number;
  onSelect: (index: number) => void;
  size?: "sm" | "md";
  "aria-label"?: string;
}

const SIZE_CLASS: Record<NonNullable<ThumbnailStripProps["size"]>, string> = {
  sm: "eui-thumbnail-strip-sm",
  md: "eui-thumbnail-strip-md",
};

export const ThumbnailStrip = React.forwardRef<HTMLDivElement, ThumbnailStripProps>(
  function ThumbnailStrip(
    { images, activeIndex, onSelect, size = "md", "aria-label": ariaLabel, className, ...rest },
    ref
  ) {
    const classes = ["eui-thumbnail-strip", SIZE_CLASS[size], className].filter(Boolean).join(" ");

    return (
      <div ref={ref} className={classes} role="group" aria-label={ariaLabel ?? "Wybór zdjęcia"} {...rest}>
        {images.map((image, index) => {
          const isActive = index === activeIndex;
          return (
            <button
              key={index}
              type="button"
              aria-pressed={isActive}
              aria-label={`Zdjęcie ${index + 1} z ${images.length}`}
              onClick={() => onSelect(index)}
              className={`eui-thumbnail-strip-item ${isActive ? "eui-thumbnail-strip-item-active" : ""}`}
            >
              <MediaFrame aspectRatio="square" radius="sm" background={false}>
                <img src={image.url} alt={image.alt} loading="lazy" />
              </MediaFrame>
            </button>
          );
        })}
      </div>
    );
  }
);
