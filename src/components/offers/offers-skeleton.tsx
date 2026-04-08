"use client";

import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export function OffersSkeleton() {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-7 w-32 rounded-xl" />
          <Skeleton className="h-4 w-20 mt-2 rounded-lg" />
        </div>
        <Skeleton className="h-10 w-36 rounded-full" />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <Skeleton className="h-11 flex-1 min-w-[200px] rounded-2xl" />
        <Skeleton className="h-11 w-[180px] rounded-2xl" />
      </div>

      {/* Table */}
      <div className="bubble overflow-hidden">
        <div className="px-3 py-2.5 bg-muted/30" style={{ borderBottom: "1px solid hsl(var(--border))" }}>
          <div className="flex gap-6">
            <Skeleton className="h-3 w-12 rounded" />
            <Skeleton className="h-3 w-24 rounded" />
            <Skeleton className="h-3 w-20 rounded hidden md:block" />
            <Skeleton className="h-3 w-20 rounded" />
            <Skeleton className="h-3 w-16 rounded hidden lg:block" />
            <Skeleton className="h-3 w-20 rounded hidden lg:block" />
          </div>
        </div>
        <div>
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 px-3 py-3.5"
              style={i < 5 ? { borderBottom: "1px solid hsl(var(--border) / 0.3)" } : undefined}
            >
              <Skeleton className="h-4 w-20 rounded shrink-0" />
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                <div className="flex-1 min-w-0">
                  <Skeleton className="h-4 w-3/5 rounded-lg" />
                  <Skeleton className="h-3 w-2/5 mt-1 rounded" />
                </div>
              </div>
              <div className="hidden md:block w-28">
                <Skeleton className="h-3 w-full rounded" />
                <Skeleton className="h-3 w-2/3 mt-1 rounded" />
              </div>
              <Skeleton className="h-6 w-24 rounded-full shrink-0" />
              <Skeleton className="h-4 w-16 rounded hidden lg:block shrink-0" />
              <div className="flex gap-1 shrink-0">
                <Skeleton className="h-7 w-7 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
