"use client";

import React from "react";

interface UnitBadgeProps {
  number: string | number;
  size?: "sm" | "md";
}

export function UnitBadge({ number, size = "md" }: UnitBadgeProps) {
  return (
    <span
      className={
        size === "sm"
          ? "inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-bold tracking-wide bg-primary/10 text-primary"
          : "inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide bg-primary/10 text-primary"
      }
    >
      NR.&nbsp;{number}
    </span>
  );
}
