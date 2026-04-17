"use client";

/**
 * LabSidebar — sticky sidebar navigation for UI Lab
 * ────────────────────────────────────────────────────────────────────────
 * Lists all sections with anchor links. Lives in ADMIN DOM (not under
 * `.engine-root`) so it uses the admin design system — Tailwind tokens,
 * rounded-xl "bubble" styling, bg-card/border-border, auto light/dark.
 *
 * Features:
 *   - Smooth scroll to section on click
 *   - Active section tracking via IntersectionObserver
 *   - Keyboard nav via native <button>
 */

import * as React from "react";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export interface LabSidebarItem {
  /** Section id to scroll to. Must match the `id` prop of a LabSection. */
  id: string;
  /** Visible label. */
  label: string;
  /** Optional icon rendered to the left. */
  icon?: React.ReactNode;
}

export interface LabSidebarProps {
  /** Items, in the order they appear in the content pane. */
  items: LabSidebarItem[];
}

export function LabSidebar({ items }: LabSidebarProps) {
  const [activeId, setActiveId] = React.useState<string>(items[0]?.id ?? "");

  // IntersectionObserver: whichever section is most visible wins.
  React.useEffect(() => {
    if (typeof window === "undefined" || items.length === 0) return;

    const targets: HTMLElement[] = [];
    for (const item of items) {
      const el = document.getElementById(item.id);
      if (el) targets.push(el);
    }
    if (targets.length === 0) return;

    const ratios = new Map<string, number>();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          ratios.set(e.target.id, e.intersectionRatio);
        }
        let bestId = activeId;
        let bestRatio = 0;
        for (const [id, ratio] of ratios.entries()) {
          if (ratio > bestRatio) {
            bestRatio = ratio;
            bestId = id;
          }
        }
        if (bestRatio > 0 && bestId !== activeId) {
          setActiveId(bestId);
        }
      },
      {
        rootMargin: "-80px 0px -50% 0px",
        threshold: [0, 0.25, 0.5, 0.75, 1],
      }
    );

    for (const t of targets) observer.observe(t);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  const handleClick = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    setActiveId(id);
  };

  return (
    <aside className="eui-lab-sidebar" aria-label="Nawigacja UI Lab">
      <div className="rounded-2xl border border-border/60 bg-card p-2.5 shadow-sm">
        <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border/40 mb-2">
          <Sparkles className="h-4 w-4 text-foreground shrink-0" aria-hidden="true" />
          <span className="text-[13px] font-semibold text-foreground">
            Engine UI Lab
          </span>
          <span className="ml-auto text-[9px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded font-bold">
            LAB
          </span>
        </div>
        <nav className="flex flex-col gap-0.5">
          {items.map((item) => {
            const isActive = item.id === activeId;
            return (
              <button
                key={item.id}
                type="button"
                className={cn(
                  "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left transition-all duration-200",
                  "text-[12px] font-medium",
                  isActive
                    ? "bg-primary/10 text-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
                onClick={() => handleClick(item.id)}
                aria-current={isActive ? "location" : undefined}
              >
                <span className={cn("shrink-0", isActive && "text-primary")}>
                  {item.icon}
                </span>
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
