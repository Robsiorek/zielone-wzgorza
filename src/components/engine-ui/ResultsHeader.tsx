"use client";

/**
 * ResultsHeader — results count + sort info popover (engine-ui)
 * ────────────────────────────────────────────────────────────────────────
 * Shows result count with nice subtitle, plus "Jak sortowane są wyniki"
 * info link with a popover explaining the sort logic.
 */

import * as React from "react";
import { Info } from "lucide-react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "./primitives/Popover";

export interface ResultsHeaderProps {
  count: number;
  subtitle?: string;
  /** Slot for future sort/filter controls. */
  actions?: React.ReactNode;
  /** Sort explanation text for the info popover. */
  sortExplanation?: string;
  /** Link text/URL for "Dowiedz się więcej" in sort popover. */
  sortLearnMoreHref?: string;
  className?: string;
}

function pluralizeResults(n: number): string {
  if (n === 1) return "1 miejsce";
  if (n < 5) return `${n} miejsca`;
  return `${n} miejsc`;
}

export function ResultsHeader({
  count,
  subtitle,
  actions,
  sortExplanation = "Wyniki sortowane są na podstawie dostępności, ocen gości oraz dopasowania do Twojego zapytania.",
  sortLearnMoreHref,
  className,
}: ResultsHeaderProps) {
  const rootClass = ["eui-results-header", className]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={rootClass}>
      <div className="eui-results-header-text">
        <h2 className="eui-results-count">
          {pluralizeResults(count)} do wyboru
        </h2>
        {subtitle && (
          <p className="eui-results-subtitle">{subtitle}</p>
        )}
        <div className="eui-results-sort-info" onClick={(e) => e.stopPropagation()}>
          <Popover>
            <PopoverTrigger asChild>
              <button type="button" className="eui-results-sort-trigger">
                <Info size={14} aria-hidden="true" />
                <span>Jak sortowane są wyniki</span>
              </button>
            </PopoverTrigger>
            <PopoverContent size="small" align="start" side="bottom" sideOffset={8}>
              <div className="eui-results-sort-popover">
                <p className="eui-results-sort-text">{sortExplanation}</p>
                {sortLearnMoreHref && (
                  <a
                    href={sortLearnMoreHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="eui-results-sort-link"
                  >
                    Dowiedz się więcej
                  </a>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
      {actions && (
        <div className="eui-results-header-actions">{actions}</div>
      )}
    </div>
  );
}
