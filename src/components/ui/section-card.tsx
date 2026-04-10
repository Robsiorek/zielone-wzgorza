"use client";

/**
 * SectionCard — collapsible section with icon, title and description.
 *
 * DS §25: Accordion with bubble border + icon in rounded square bg-primary/10.
 * Uses CSS Grid animation (section-collapse / section-open) from globals.css.
 * Always renders children in DOM — never conditional {open && ...}.
 */

import React, { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

interface SectionCardProps {
  title: string;
  description?: string;
  icon: React.ElementType;
  children: React.ReactNode;
  defaultOpen?: boolean;
  /** Optional action button in header (e.g. "Dodaj") */
  action?: React.ReactNode;
}

export function SectionCard({
  title,
  description,
  icon: Icon,
  children,
  defaultOpen = true,
  action,
}: SectionCardProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="bubble" style={{ overflow: "visible" }}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-5 py-4 hover:bg-muted/20 transition-colors"
      >
        <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 text-left min-w-0">
          <h3 className="text-[14px] font-semibold">{title}</h3>
          {description && (
            <p className="text-[11px] text-muted-foreground mt-0.5">{description}</p>
          )}
        </div>
        {action && (
          <div onClick={(e) => e.stopPropagation()} className="shrink-0">
            {action}
          </div>
        )}
        {open ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
        )}
      </button>
      <div className={`section-collapse ${open ? "section-open" : ""}`}>
        <div className="section-collapse-inner">
          <div className="px-5 pb-5 border-t border-border/50 pt-4">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
