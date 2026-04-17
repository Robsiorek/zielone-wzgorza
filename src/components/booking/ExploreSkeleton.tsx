"use client";

/**
 * ExploreSkeleton.tsx — Skeleton loader for Explore View.
 *
 * DS rules: immediate display, shimmer only, no fade-in-up/stagger.
 * Shape matches the real ExploreView layout (header + trust bar + date form + cards grid).
 */

import React from "react";

function S({ className }: { className: string }) {
  return <div className={`bg-muted shimmer rounded-lg ${className}`} />;
}

function CardSkeleton() {
  return (
    <div className="bg-card rounded-2xl border-2 border-border overflow-hidden">
      {/* Cover image placeholder */}
      <S className="w-full aspect-[16/10] rounded-none rounded-t-2xl" />
      <div className="p-4 space-y-3">
        <S className="h-5 w-3/4" />
        <S className="h-3 w-1/3" />
        <S className="h-3 w-full" />
        <S className="h-3 w-2/3" />
        <div className="flex gap-2 pt-1">
          <S className="h-6 w-16 rounded-full" />
          <S className="h-6 w-16 rounded-full" />
          <S className="h-6 w-16 rounded-full" />
        </div>
        <S className="h-10 w-full rounded-xl mt-2" />
      </div>
    </div>
  );
}

export function ExploreSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <S className="h-7 w-48 mx-auto" />
        <S className="h-4 w-72 mx-auto" />
      </div>

      {/* Trust bar */}
      <div className="flex items-center gap-2 justify-center">
        <S className="h-7 w-24 rounded-full" />
        <S className="h-7 w-28 rounded-full" />
        <S className="h-7 w-20 rounded-full" />
      </div>

      {/* Quick date form */}
      <S className="h-14 w-full rounded-2xl" />

      {/* Cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    </div>
  );
}
