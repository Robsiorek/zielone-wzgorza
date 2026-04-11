"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function AmenitiesSkeleton() {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-7 w-48 rounded-lg" />
          <Skeleton className="h-4 w-72 rounded-lg mt-2" />
        </div>
        <Skeleton className="h-11 w-40 rounded-2xl" />
      </div>

      {/* Tabs */}
      <Skeleton className="h-11 w-80 rounded-full" />

      {/* Search + filter */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-11 flex-1 rounded-2xl" />
        <Skeleton className="h-11 w-[160px] rounded-2xl" />
      </div>

      {/* Category groups */}
      {[1, 2, 3].map((g) => (
        <div key={g} className="space-y-2">
          <Skeleton className="h-5 w-36 rounded-lg" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-16 rounded-2xl" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
