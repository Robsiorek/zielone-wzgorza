"use client";

/**
 * BookingSkeleton — per-step skeleton loaders for booking widget.
 *
 * Design System rules:
 * - Skeletons are IMMEDIATE (no fade-in-up, no stagger)
 * - Shimmer only (.shimmer class from globals.css)
 * - Shape matches the real content layout exactly
 */

import React from "react";

function S({ className }: { className: string }) {
  return <div className={`bg-muted shimmer rounded-lg ${className}`} />;
}

// ═══════════════════════════════════════════
// Full page skeleton (initial load before React hydrates)
// ═══════════════════════════════════════════

export function BookingPageSkeleton() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/80 border-b border-border/50">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center gap-2.5 mb-3">
            <S className="h-8 w-8 rounded-xl" />
            <S className="h-4 w-28" />
          </div>
          {/* Stepper */}
          <div className="flex items-center justify-center gap-2">
            {[1, 2, 3, 4, 5].map(i => (
              <React.Fragment key={i}>
                {i > 1 && <S className="h-[2px] w-8" />}
                <S className="h-8 w-8 rounded-full" />
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Content — step 1 shape */}
      <div className="flex-1 max-w-4xl mx-auto px-4 py-8 w-full">
        <div className="text-center space-y-2 mb-6">
          <S className="h-7 w-52 mx-auto" />
          <S className="h-4 w-72 mx-auto" />
        </div>
        <div className="rounded-2xl border-2 border-border p-5 space-y-4">
          <S className="h-5 w-28" />
          <div className="grid grid-cols-2 gap-3">
            <S className="h-11 rounded-2xl" />
            <S className="h-11 rounded-2xl" />
          </div>
          <S className="h-[1px] w-full" />
          <S className="h-5 w-16" />
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <S className="h-4 w-20" />
              <div className="flex items-center gap-3">
                <S className="h-9 w-9 rounded-xl" />
                <S className="h-5 w-6" />
                <S className="h-9 w-9 rounded-xl" />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <S className="h-4 w-16" />
              <div className="flex items-center gap-3">
                <S className="h-9 w-9 rounded-xl" />
                <S className="h-5 w-6" />
                <S className="h-9 w-9 rounded-xl" />
              </div>
            </div>
          </div>
        </div>
        <S className="h-[52px] w-full rounded-2xl mt-6" />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// Step 2 — Resource cards loading
// ═══════════════════════════════════════════

export function ResultsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="text-center space-y-2 pt-2">
        <S className="h-6 w-44 mx-auto" />
        <S className="h-4 w-56 mx-auto" />
      </div>
      {[1, 2, 3].map(i => (
        <div key={i} className="bg-card rounded-2xl border-2 border-border p-4">
          <div className="flex gap-4">
            <S className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl shrink-0" />
            <div className="flex-1 space-y-2 py-1">
              <S className="h-4 w-32" />
              <S className="h-3 w-20" />
              <S className="h-3 w-full max-w-[200px]" />
              <div className="flex items-center gap-3 pt-1">
                <S className="h-3 w-24" />
                <S className="h-4 w-28" />
              </div>
            </div>
            <S className="h-6 w-6 rounded-lg shrink-0" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════
// Step 3 — Quote loading
// ═══════════════════════════════════════════

export function QuoteSkeleton() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <S className="h-6 w-36" />
          <S className="h-4 w-20" />
        </div>
        <S className="h-7 w-16 rounded-full" />
      </div>
      <div className="bg-card rounded-2xl border-2 border-border overflow-hidden">
        {[1, 2].map(i => (
          <div key={i} className={`p-4 ${i > 1 ? "border-t border-border/50" : ""}`}>
            <div className="flex items-center justify-between mb-2">
              <S className="h-4 w-32" />
              <S className="h-4 w-20" />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between"><S className="h-3 w-36" /><S className="h-3 w-16" /></div>
              <div className="flex justify-between"><S className="h-3 w-32" /><S className="h-3 w-16" /></div>
              <div className="flex justify-between"><S className="h-3 w-28" /><S className="h-3 w-16" /></div>
            </div>
          </div>
        ))}
        <div className="border-t-2 border-border bg-muted/30 p-4 space-y-2">
          <div className="flex justify-between"><S className="h-4 w-16" /><S className="h-4 w-20" /></div>
          <div className="flex justify-between"><S className="h-5 w-24" /><S className="h-5 w-24" /></div>
          <div className="flex justify-between"><S className="h-3 w-36" /><S className="h-3 w-16" /></div>
        </div>
      </div>
      <S className="h-[52px] w-full rounded-2xl" />
    </div>
  );
}

// ═══════════════════════════════════════════
// Price loading (for step 2 cards — price line only)
// ═══════════════════════════════════════════

export function PriceSkeleton() {
  return <S className="h-4 w-24 inline-block" />;
}
