"use client";

/**
 * ResultsSkeleton — loading skeleton for Airbnb-style cards (engine-ui)
 * ────────────────────────────────────────────────────────────────────────
 * Matches the exact layout of the redesigned ResultCard:
 *   - Image area (aspect-ratio)
 *   - Name + rating line
 *   - Subtitle line
 *   - Price line
 *
 * Shimmer only — instant appearance, no fade-in/stagger.
 */

export interface ResultsSkeletonProps {
  count?: number;
  showHeader?: boolean;
  className?: string;
}

function SkeletonCard() {
  return (
    <div className="eui-card eui-skeleton-card" aria-hidden="true">
      <div className="eui-card-image">
        <div className="eui-skeleton-box eui-skeleton-image" />
      </div>
      <div className="eui-card-content">
        <div className="eui-card-title-row">
          <div className="eui-skeleton-box eui-skeleton-name" />
          <div className="eui-skeleton-box eui-skeleton-rating" />
        </div>
        <div className="eui-skeleton-box eui-skeleton-subtitle" />
        <div className="eui-card-bottom">
          <div className="eui-skeleton-box eui-skeleton-price" />
        </div>
      </div>
    </div>
  );
}

function SkeletonHeader() {
  return (
    <div className="eui-results-header eui-skeleton-header" aria-hidden="true">
      <div className="eui-results-header-text">
        <div className="eui-skeleton-box eui-skeleton-header-count" />
        <div className="eui-skeleton-box eui-skeleton-header-sub" />
      </div>
    </div>
  );
}

export function ResultsSkeleton({
  count = 3,
  showHeader = false,
  className,
}: ResultsSkeletonProps) {
  const rootClass = ["eui-results-skeleton", className]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={rootClass}>
      {showHeader && <SkeletonHeader />}
      <div className="eui-results-grid">
        {Array.from({ length: count }, (_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}
