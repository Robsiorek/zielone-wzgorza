"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function AddonsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-7 w-32 rounded" />
          <Skeleton className="h-4 w-20 rounded mt-2" />
        </div>
        <Skeleton className="h-10 w-36 rounded-full" />
      </div>
      <div className="bubble">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-4 border-b border-border/50 last:border-0">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-40 rounded" />
              <Skeleton className="h-3 w-24 rounded" />
            </div>
            <Skeleton className="h-4 w-16 rounded" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
