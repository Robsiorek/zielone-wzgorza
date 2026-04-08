"use client";

import React from "react";
import { cn } from "@/lib/utils";

/* ─── Base Skeleton ─── */

interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

export function Skeleton({ className, style }: SkeletonProps) {
  return (
    <div
      className={cn("rounded-xl bg-muted/60 shimmer", className)}
      style={style}
    />
  );
}

/* ─── Reusable building blocks ─── */

function SkeletonHeader() {
  return (
    <div className="flex items-center justify-between">
      <div>
        <Skeleton className="h-7 w-40 rounded-xl" />
        <Skeleton className="h-4 w-56 mt-2 rounded-lg" />
      </div>
      <Skeleton className="h-10 w-36 rounded-full" />
    </div>
  );
}

function SkeletonTabs({ count = 4 }: { count?: number }) {
  const widths = [88, 104, 80, 96, 84, 100, 92];
  return (
    <div className="flex gap-1 p-1 bg-muted/30 rounded-full w-fit">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-9 rounded-full" style={{ width: widths[i % widths.length] }} />
      ))}
    </div>
  );
}

function SkeletonToolbar() {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      <Skeleton className="h-11 flex-1 min-w-[200px] rounded-2xl" />
      <Skeleton className="h-11 w-[160px] rounded-2xl" />
      <Skeleton className="h-11 w-[160px] rounded-2xl" />
    </div>
  );
}

function SkeletonSearchBar() {
  return (
    <div className="p-1.5 bg-muted/20 rounded-full">
      <Skeleton className="h-9 rounded-full" />
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-[20px] bg-card p-5" style={{ border: "2px solid hsl(var(--border) / 0.5)" }}>
      <div className="flex items-start gap-3 mb-3">
        <Skeleton className="h-10 w-10 rounded-2xl shrink-0" />
        <div className="flex-1">
          <Skeleton className="h-4 w-3/4 rounded-lg" />
          <Skeleton className="h-3 w-1/2 mt-1.5 rounded-lg" />
        </div>
      </div>
      <div className="flex gap-2 mt-3">
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
    </div>
  );
}

function SkeletonTableRow({ cols }: { cols: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-3 py-3.5">
          <Skeleton
            className="h-4 rounded-lg"
            style={{ width: i === 0 ? 40 : i === 1 ? "70%" : i === cols - 1 ? 60 : "50%" }}
          />
        </td>
      ))}
    </tr>
  );
}


/* ═══════════════════════════════════════════
   Module-specific skeletons
   ═══════════════════════════════════════════ */

/* ─── Resources: header + tabs + search + 6 cards grid ─── */
export function ResourcesSkeleton() {
  return (
    <div className="space-y-6">
      <SkeletonHeader />
      <SkeletonTabs count={5} />
      <SkeletonSearchBar />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}

/* ─── Pricing: header + tabs + 3 cards grid ─── */
export function PricingSkeleton() {
  return (
    <div className="space-y-6">
      <SkeletonHeader />
      <SkeletonTabs count={4} />
      <div className="flex justify-end">
        <Skeleton className="h-10 w-36 rounded-full" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}

/* ─── Clients: header + toolbar (search + 3 filters) + table ─── */
export function ClientsSkeleton() {
  return (
    <div className="space-y-4">
      <SkeletonHeader />
      <SkeletonToolbar />
      <div className="bubble overflow-hidden">
        {/* Table header */}
        <div className="px-3 py-2.5 bg-muted/30" style={{ borderBottom: "1px solid hsl(var(--border))" }}>
          <div className="flex gap-6">
            <Skeleton className="h-3 w-8 rounded" />
            <Skeleton className="h-3 w-24 rounded" />
            <Skeleton className="h-3 w-20 rounded hidden md:block" />
            <Skeleton className="h-3 w-16 rounded" />
            <Skeleton className="h-3 w-16 rounded hidden lg:block" />
            <Skeleton className="h-3 w-8 rounded hidden lg:block" />
            <Skeleton className="h-3 w-8 rounded hidden lg:block" />
            <Skeleton className="h-3 w-20 rounded hidden xl:block" />
          </div>
        </div>
        {/* Table rows */}
        <div>
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 px-3 py-3.5"
              style={i < 7 ? { borderBottom: "1px solid hsl(var(--border) / 0.3)" } : undefined}
            >
              {/* # */}
              <Skeleton className="h-4 w-10 rounded shrink-0" />
              {/* Avatar + name */}
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                <div className="flex-1 min-w-0">
                  <Skeleton className="h-4 w-3/5 rounded-lg" />
                  <Skeleton className="h-3 w-2/5 mt-1 rounded" />
                </div>
              </div>
              {/* Contact */}
              <div className="hidden md:block w-32">
                <Skeleton className="h-3 w-full rounded" />
                <Skeleton className="h-3 w-2/3 mt-1 rounded" />
              </div>
              {/* Status */}
              <Skeleton className="h-6 w-20 rounded-full shrink-0" />
              {/* Segment */}
              <Skeleton className="h-4 w-16 rounded hidden lg:block shrink-0" />
              {/* Rez */}
              <Skeleton className="h-4 w-6 rounded hidden lg:block shrink-0" />
              {/* Oferty */}
              <Skeleton className="h-4 w-6 rounded hidden lg:block shrink-0" />
              {/* Aktywność */}
              <Skeleton className="h-3 w-16 rounded hidden xl:block shrink-0" />
              {/* Actions */}
              <div className="flex gap-1 shrink-0">
                <Skeleton className="h-7 w-7 rounded-lg" />
                <Skeleton className="h-7 w-7 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Pagination */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-32 rounded" />
        <div className="flex gap-1">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </div>
    </div>
  );
}
