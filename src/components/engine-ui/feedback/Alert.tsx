"use client";

/**
 * Alert + Banner — Engine UI Part 12 (Feedback + State).
 *
 * Statyczny komunikat severity (info / success / warning / error).
 * Reuse semantic tokenów (eui-danger/success/warning/info + -bg-soft),
 * ikony spójne z HelperText (AlertCircle / CheckCircle2 / AlertTriangle
 * / Info). cx z tokens, B-neutral focus na dismiss (VISUAL-DNA).
 *
 * A11y: error/warning → role="alert" (assertive); info/success →
 * role="status" + aria-live="polite". Dismiss = Pressable-style button.
 *
 * Alert = inline (radius, w treści). Banner = full-width, square edges,
 * page-level (ten sam rdzeń, modyfikator .eui-banner).
 */

import * as React from "react";
import { AlertCircle, CheckCircle2, AlertTriangle, Info, X } from "lucide-react";
import { cx } from "../tokens/cx";

export type AlertVariant = "info" | "success" | "warning" | "error";

const VARIANT_ICON: Record<AlertVariant, React.ComponentType<{ size?: number | string; className?: string }>> = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  error: AlertCircle,
};

// error/warning = assertywne; info/success = polite status
function ariaFor(variant: AlertVariant) {
  const assertive = variant === "error" || variant === "warning";
  return assertive
    ? ({ role: "alert" as const })
    : ({ role: "status" as const, "aria-live": "polite" as const });
}

interface FeedbackBoxProps {
  variant?: AlertVariant;
  title?: React.ReactNode;
  children?: React.ReactNode;
  /** Pokaż przycisk zamknięcia. */
  dismissible?: boolean;
  onDismiss?: () => void;
  /** Override domyślnej ikony wariantu (lub null = bez ikony). */
  icon?: React.ReactNode | null;
  className?: string;
}

function FeedbackBox(
  base: string,
  { variant = "info", title, children, dismissible, onDismiss, icon, className }: FeedbackBoxProps
) {
  const Icon = VARIANT_ICON[variant];
  const showIcon = icon !== null;

  return (
    <div
      className={cx(base, `${base}-${variant}`, className)}
      {...ariaFor(variant)}
    >
      {showIcon && (
        <span className={`${base}-icon`} aria-hidden="true">
          {icon ?? <Icon size={18} />}
        </span>
      )}
      <div className={`${base}-body`}>
        {title !== undefined && (
          <span className={`${base}-title`}>{title}</span>
        )}
        {children !== undefined && (
          <span className={`${base}-message`}>{children}</span>
        )}
      </div>
      {dismissible && (
        <button
          type="button"
          className={`${base}-dismiss`}
          onClick={onDismiss}
          aria-label="Zamknij"
        >
          <X size={16} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

export interface AlertProps extends FeedbackBoxProps {}

export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  function Alert(props, _ref) {
    return FeedbackBox("eui-alert", props);
  }
);
Alert.displayName = "Alert";

export interface BannerProps extends FeedbackBoxProps {}

export const Banner = React.forwardRef<HTMLDivElement, BannerProps>(
  function Banner(props, _ref) {
    return FeedbackBox("eui-banner", props);
  }
);
Banner.displayName = "Banner";
