"use client";

import * as React from "react";
import { Skeleton } from "./skeleton/Skeleton";
import { SkeletonRegion } from "./skeleton/SkeletonRegion";

export interface ResultsSkeletonProps {
  count?: number;
  showHeader?: boolean;
  className?: string;
}

export const ResultsSkeleton = React.forwardRef<HTMLDivElement, ResultsSkeletonProps>(
  function ResultsSkeleton({ count = 3, showHeader = false, className }, ref) {
    return (
      <SkeletonRegion
        ref={ref}
        loading={true}
        label="Ładowanie wyników..."
        ariaLive="polite"
        className={["eui-results-skeleton", className].filter(Boolean).join(" ")}
      >
        {showHeader && (
          <div className="eui-results-header eui-skeleton-header">
            <div className="eui-results-header-text">
              <Skeleton width={120} height={24} radius="sm" />
              <Skeleton width={180} height={16} radius="sm" />
            </div>
          </div>
        )}
        <div className="eui-results-grid">
          {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="eui-card eui-skeleton-card">
              <div className="eui-card-image">
                <Skeleton width="100%" height="100%" radius="xl" />
              </div>
              <div className="eui-card-content">
                <div className="eui-card-title-row">
                  <Skeleton width="65%" height={18} radius="sm" />
                  <Skeleton width={60} height={16} radius="sm" />
                </div>
                <Skeleton width="50%" height={14} radius="sm" />
                <div className="eui-card-bottom">
                  <Skeleton width={90} height={18} radius="sm" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </SkeletonRegion>
    );
  }
);

ResultsSkeleton.displayName = "ResultsSkeleton";
