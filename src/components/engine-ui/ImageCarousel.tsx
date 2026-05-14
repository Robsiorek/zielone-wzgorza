"use client";

/**
 * ImageCarousel — Airbnb-style image slider (engine-ui)
 * ────────────────────────────────────────────────────────────────────────
 * Horizontal image carousel with:
 *   - Dot indicators at the bottom (PaginationDot, Part 4)
 *   - Left/right arrows visible on hover (GalleryNavButton, Part 8)
 *   - Touch swipe support (CSS scroll-snap via .eui-image-carousel-track)
 *   - Lazy loading on non-visible images
 *   - Placeholder when no images (ImagePlaceholder, Part 8)
 *
 * Część 8.5a Stage 2: refactor on Engine UI primitives.
 * State (useRef + useState + useEffect) preserved. e.stopPropagation
 * is handled inside GalleryNavButton itself.
 */

import * as React from "react";
import type { ResultImage } from "./results-types";

import { MediaFrame } from "./media/MediaFrame";
import { ImagePlaceholder } from "./media/ImagePlaceholder";
import { GalleryNavButton } from "./media/GalleryNavButton";
import { PaginationDot } from "./nav/PaginationDot";

export interface ImageCarouselProps {
  images: ResultImage[];
  className?: string;
}

export function ImageCarousel({ images, className }: ImageCarouselProps) {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = React.useState(0);

  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const onScroll = () => {
      const scrollLeft = el.scrollLeft;
      const width = el.offsetWidth;
      if (width === 0) return;
      const idx = Math.round(scrollLeft / width);
      setActiveIndex(Math.min(idx, images.length - 1));
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [images.length]);

  const goTo = (index: number) => {
    const el = scrollRef.current;
    if (!el) return;
    const target = Math.max(0, Math.min(index, images.length - 1));
    el.scrollTo({ left: target * el.offsetWidth, behavior: "smooth" });
  };

  const rootClass = ["relative", className].filter(Boolean).join(" ");

  if (images.length === 0) {
    return (
      <div className={rootClass}>
        <MediaFrame aspectRatio="16 / 10">
          <ImagePlaceholder size="lg" />
        </MediaFrame>
      </div>
    );
  }

  return (
    <div className={rootClass}>
      <div ref={scrollRef} className="eui-image-carousel-track">
        {images.map((img, i) => (
          <MediaFrame key={i} aspectRatio="16 / 10">
            <img
              src={img.url}
              alt={img.alt}
              className="w-full h-full object-cover select-none"
              loading={i === 0 ? "eager" : "lazy"}
              draggable={false}
            />
          </MediaFrame>
        ))}
      </div>

      {images.length > 1 && (
        <>
          <GalleryNavButton
            direction="left"
            visible={activeIndex > 0}
            onClick={() => goTo(activeIndex - 1)}
          />
          <GalleryNavButton
            direction="right"
            visible={activeIndex < images.length - 1}
            onClick={() => goTo(activeIndex + 1)}
          />

          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-[2] pointer-events-none">
            {images.map((_, i) => (
              <PaginationDot
                key={i}
                state={i === activeIndex ? "active" : "inactive"}
                size="sm"
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
