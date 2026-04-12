"use client";

/**
 * PropertyContentSkeleton — shimmer skeleton for /admin/property-content.
 *
 * DS §5: Skeleton appears instantly, only shimmer animation.
 * No fade-in-up, no stagger. Matches page layout: header + 6 SectionCards.
 */

import { Skeleton } from "@/components/ui/skeleton";

export function PropertyContentSkeleton() {
  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-7 w-48 rounded-lg" />
          <Skeleton className="h-4 w-80 rounded-lg mt-2" />
        </div>
      </div>

      {/* 6 SectionCards */}
      <div className="space-y-4 mt-6 max-w-[800px]">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bubble px-5 py-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-xl" />
              <div className="flex-1">
                <Skeleton className="h-4 w-40 rounded-lg" />
                <Skeleton className="h-3 w-64 rounded-lg mt-1.5" />
              </div>
              <Skeleton className="h-4 w-4 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
