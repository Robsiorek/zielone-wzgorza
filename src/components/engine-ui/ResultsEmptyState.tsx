"use client";

/**
 * ResultsEmptyState — "no results" message (engine-ui)
 * ────────────────────────────────────────────────────────────────────────
 * Centered message with optional icon, title, description, and CTA.
 * Used when a search returns zero results.
 */

import * as React from "react";
import { SearchX } from "lucide-react";

export interface ResultsEmptyStateProps {
  title?: string;
  message?: string;
  /** Optional icon. Defaults to SearchX. */
  icon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function ResultsEmptyState({
  title = "Brak wyników",
  message = "Nie znaleźliśmy dostępnych miejsc dla podanych kryteriów. Spróbuj zmienić daty lub liczbę gości.",
  icon,
  actionLabel = "Zmień kryteria",
  onAction,
  className,
}: ResultsEmptyStateProps) {
  const rootClass = ["eui-empty-state", className].filter(Boolean).join(" ");

  return (
    <div className={rootClass}>
      <div className="eui-empty-icon" aria-hidden="true">
        {icon ?? <SearchX size={48} strokeWidth={1.5} />}
      </div>
      <h3 className="eui-empty-title">{title}</h3>
      <p className="eui-empty-message">{message}</p>
      {onAction && (
        <button
          type="button"
          className="eui-empty-action"
          onClick={onAction}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
