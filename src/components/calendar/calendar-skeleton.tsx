"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function CalendarSkeleton() {
  return (
    <div className="space-y-4">
      {/* ── Header: title + actions (left) | nav tools (right) ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div>
            <Skeleton className="h-7 w-32 rounded-lg" />
            <Skeleton className="h-4 w-52 rounded-lg mt-2" />
          </div>
          <div className="flex items-center gap-1.5 ml-2">
            <Skeleton className="h-10 w-[170px] rounded-2xl" />
            <Skeleton className="h-9 w-9 rounded-2xl" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-[200px] rounded-2xl" />
          <Skeleton className="h-9 w-9 rounded-2xl" />
          <Skeleton className="h-9 w-14 rounded-2xl" />
          <Skeleton className="h-9 w-9 rounded-2xl" />
          <Skeleton className="h-5 w-28 rounded-lg" />
          <Skeleton className="h-9 w-9 rounded-2xl" />
        </div>
      </div>

      {/* ── Legend + stats ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-4">
          <Skeleton className="h-4 w-20 rounded-lg" />
          <Skeleton className="h-4 w-16 rounded-lg" />
          <Skeleton className="h-4 w-18 rounded-lg" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-4 w-24 rounded-lg" />
          <Skeleton className="h-4 w-24 rounded-lg" />
          <Skeleton className="h-4 w-16 rounded-lg" />
          <Skeleton className="h-4 w-20 rounded-lg" />
        </div>
      </div>

      {/* ── Grid ── */}
      <div className="bubble overflow-hidden p-0">
        {/* Month header */}
        <div className="flex border-b border-border/50">
          <div className="w-[200px] shrink-0" />
          <div className="flex-1 flex">
            <Skeleton className="h-6 w-20 rounded-lg m-2" />
            <div className="flex-1" />
            <Skeleton className="h-6 w-20 rounded-lg m-2" />
          </div>
        </div>

        {/* Day header row */}
        <div className="flex border-b border-border">
          <Skeleton className="h-14 w-[200px] shrink-0 rounded-none" />
          <div className="flex flex-1">
            {Array.from({ length: 31 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-[42px] shrink-0 rounded-none opacity-30" />
            ))}
          </div>
        </div>

        {/* Category: DOMKI */}
        <div className="flex border-b border-border/50">
          <Skeleton className="h-8 w-[200px] shrink-0 rounded-none opacity-40" />
          <Skeleton className="h-8 flex-1 rounded-none opacity-10" />
        </div>

        {/* 10 domki rows */}
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={`d-${i}`} className="flex border-b border-border/30" style={{ height: 48 }}>
            <div className="w-[200px] shrink-0 flex items-center gap-2 px-3">
              <Skeleton className="h-4 w-24 rounded-lg" />
              <Skeleton className="h-5 w-10 rounded-full" />
            </div>
            <div className="flex-1 relative">
              {/* Fake entry blocks */}
              {i < 7 && (
                <Skeleton
                  className="absolute rounded-lg"
                  style={{
                    height: 36,
                    top: 6,
                    left: `${(i * 37 + 20) % 60}%`,
                    width: `${20 + (i * 13) % 25}%`,
                    opacity: 0.15 + (i % 3) * 0.1,
                  }}
                />
              )}
            </div>
          </div>
        ))}

        {/* Category: POKOJE */}
        <div className="flex border-b border-border/50">
          <Skeleton className="h-8 w-[200px] shrink-0 rounded-none opacity-40" />
          <Skeleton className="h-8 flex-1 rounded-none opacity-10" />
        </div>

        {/* 4 pokoje rows */}
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={`p-${i}`} className="flex border-b border-border/30 last:border-b-0" style={{ height: 48 }}>
            <div className="w-[200px] shrink-0 flex items-center gap-2 px-3">
              <Skeleton className="h-4 w-28 rounded-lg" />
              <Skeleton className="h-5 w-10 rounded-full" />
            </div>
            <div className="flex-1 relative">
              {i < 3 && (
                <Skeleton
                  className="absolute rounded-lg"
                  style={{
                    height: 36,
                    top: 6,
                    left: `${(i * 29 + 15) % 50}%`,
                    width: `${25 + (i * 11) % 20}%`,
                    opacity: 0.15 + (i % 2) * 0.1,
                  }}
                />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
