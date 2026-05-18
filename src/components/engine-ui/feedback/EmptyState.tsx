"use client";

/**
 * EmptyState + ErrorState — Engine UI Part 12 (Feedback + State).
 *
 * Kompozycja: opcjonalna ikona w miękkim kółku + EmptyStateText
 * (reuse text primitive — DRY typografia) + opcjonalny CTA Button.
 * ErrorState = preset EmptyState (error ikona + retry) — zastępuje
 * ad-hoc bloki AlertCircle w booking (StepResults/ExploreView/StepQuote).
 *
 * Statyczny (brak aria-live); semantyczny kontener. cx z tokens,
 * B-neutral focus dziedziczony z Button (VISUAL-DNA).
 */

import * as React from "react";
import { AlertCircle } from "lucide-react";
import { EmptyStateText } from "../text/EmptyStateText";
import { Button } from "../button/Button";
import { cx } from "../tokens/cx";

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  size?: "sm" | "md" | "lg";
  /** CTA — renderuje Button variant=primary gdy podane. */
  actionLabel?: string;
  onAction?: () => void;
  /** Slot override zamiast actionLabel/onAction (np. własny Button/link). */
  action?: React.ReactNode;
  /** Wariant tła ikony: neutral (domyślny) lub error (danger tint). */
  tone?: "neutral" | "error";
  className?: string;
}

export const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  function EmptyState(
    {
      icon,
      title,
      description,
      size = "md",
      actionLabel,
      onAction,
      action,
      tone = "neutral",
      className,
    },
    ref
  ) {
    const cta =
      action ??
      (actionLabel ? (
        <Button variant="primary" size="md" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null);

    return (
      <div
        ref={ref}
        className={cx("eui-empty-state", className)}
      >
        {icon && (
          <span
            className={cx(
              "eui-empty-state-icon",
              tone === "error" && "eui-empty-state-icon-error"
            )}
            aria-hidden="true"
          >
            {icon}
          </span>
        )}
        <EmptyStateText
          title={title}
          description={description}
          size={size}
          align="center"
        />
        {cta && <div className="eui-empty-state-action">{cta}</div>}
      </div>
    );
  }
);

EmptyState.displayName = "EmptyState";

// ── ErrorState — preset EmptyState (error tone + retry) ──

export interface ErrorStateProps {
  title?: React.ReactNode;
  /** Treść błędu (description). */
  description?: React.ReactNode;
  onRetry?: () => void;
  retryLabel?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const ErrorState = React.forwardRef<HTMLDivElement, ErrorStateProps>(
  function ErrorState(
    {
      title = "Coś poszło nie tak",
      description,
      onRetry,
      retryLabel = "Spróbuj ponownie",
      size = "md",
      className,
    },
    ref
  ) {
    return (
      <EmptyState
        ref={ref}
        tone="error"
        icon={<AlertCircle size={28} aria-hidden="true" />}
        title={title}
        description={description}
        size={size}
        actionLabel={onRetry ? retryLabel : undefined}
        onAction={onRetry}
        className={className}
      />
    );
  }
);

ErrorState.displayName = "ErrorState";
