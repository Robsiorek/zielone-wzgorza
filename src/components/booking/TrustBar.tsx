"use client";

/**
 * TrustBar.tsx — Trust badges from B4 PropertyContent.
 *
 * B5a Phase 3: Max 5 badges on desktop, horizontal scroll on mobile (2-3 visible).
 * Lightweight — signal of trust, not information overload.
 * Uses DynamicIcon for badge icons (registry-gated).
 */

import React from "react";
import { DynamicIcon } from "@/components/ui/dynamic-icon";

interface TrustBadge {
  id: string;
  label: string;
  iconKey: string | null;
  description: string | null;
}

interface Props {
  badges: TrustBadge[];
}

export function TrustBar({ badges }: Props) {
  if (!badges || badges.length === 0) return null;

  // Max 5 badges
  const visible = badges.slice(0, 5);

  return (
    <div className="overflow-x-auto scrollbar-hide -mx-1">
      <div className="flex items-center gap-2 px-1 py-1 min-w-max">
        {visible.map((badge) => (
          <div
            key={badge.id}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/5 border border-primary/10 flex-shrink-0"
          >
            {badge.iconKey && (
              <DynamicIcon iconKey={badge.iconKey} className="h-3.5 w-3.5 text-primary" />
            )}
            <span className="text-[12px] font-medium text-foreground/80 whitespace-nowrap">
              {badge.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
