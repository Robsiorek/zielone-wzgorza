"use client";

/**
 * ImageCarousel — Airbnb-style image slider (engine-ui)
 * ────────────────────────────────────────────────────────────────────────
 * Horizontal image carousel with:
 *   - Dot indicators at the bottom
 *   - Left/right arrows visible on hover (desktop)
 *   - Touch swipe support (CSS scroll-snap)
 *   - Lazy loading on non-visible images
 *   - Placeholder when no images
 *
 * Clicks on arrows stop propagation so the parent card's onClick
 * doesn't fire when navigating images.
 */

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ResultImage } from "./results-types";

export interface ImageCarouselProps {
  images: ResultImage[];
  className?: string;
}

export function ImageCarousel({ images, className }: ImageCarouselProps) {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = React.useState(0);

  // Track scroll position to update dots
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

  const goTo = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const el = scrollRef.current;
    if (!el) return;
    const target = Math.max(0, Math.min(index, images.length - 1));
    el.scrollTo({ left: target * el.offsetWidth, behavior: "smooth" });
  };

  if (images.length === 0) {
    return (
      <div className={["eui-carousel", className].filter(Boolean).join(" ")}>
        <div className="eui-carousel-placeholder">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="m21 15-5-5L5 21" />
          </svg>
        </div>
      </div>
    );
  }

  return (
    <div className={["eui-carousel", className].filter(Boolean).join(" ")}>
      {/* Scrollable image track */}
      <div ref={scrollRef} className="eui-carousel-track">
        {images.map((img, i) => (
          <div key={i} className="eui-carousel-slide">
            <img
              src={img.url}
              alt={img.alt}
              className="eui-carousel-img"
              loading={i === 0 ? "eager" : "lazy"}
              draggable={false}
            />
          </div>
        ))}
      </div>

      {/* Arrows — only when multiple images */}
      {images.length > 1 && (
        <>
          {activeIndex > 0 && (
            <button
              type="button"
              className="eui-carousel-arrow eui-carousel-prev"
              onClick={(e) => goTo(activeIndex - 1, e)}
              aria-label="Poprzednie zdjęcie"
            >
              <ChevronLeft size={16} />
            </button>
          )}
          {activeIndex < images.length - 1 && (
            <button
              type="button"
              className="eui-carousel-arrow eui-carousel-next"
              onClick={(e) => goTo(activeIndex + 1, e)}
              aria-label="Następne zdjęcie"
            >
              <ChevronRight size={16} />
            </button>
          )}
        </>
      )}

      {/* Dots */}
      {images.length > 1 && (
        <div className="eui-carousel-dots">
          {images.map((_, i) => (
            <span
              key={i}
              className={[
                "eui-carousel-dot",
                i === activeIndex && "eui-carousel-dot-active",
              ]
                .filter(Boolean)
                .join(" ")}
            />
          ))}
        </div>
      )}
    </div>
  );
}
