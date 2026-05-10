"use client";

import * as React from "react";
import { Field, FieldLabel, FieldControl, FieldMessage } from "./Field";
import { useFieldContext } from "./useFieldContext";

export type TextareaSize = "sm" | "md" | "lg";

export interface TextareaProps {
  // HTML pass-through (controlled OR uncontrolled — cannot mix)
  value?: string;
  defaultValue?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  readOnly?: boolean;
  autoComplete?: string;
  autoFocus?: boolean;
  name?: string;
  id?: string;
  rows?: number;
  maxLength?: number;

  // Self-contained convenience (used in standalone mode only)
  label?: string;
  helperText?: string;
  error?: string;

  // Visual
  size?: TextareaSize;

  // Aria forwards (FieldControl injects these in compound mode)
  "aria-describedby"?: string;
  "aria-required"?: boolean;
  "aria-invalid"?: boolean;
  "aria-label"?: string;

  // Class hooks
  className?: string;
  textareaClassName?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// TextareaInner — handles textarea core rendering only.
// Used in compound mode (consumer-wrapped Field) AND bare mode (no Field).
// Standalone mode wraps this via internal Field structure (Textarea below).
// Mirror pattern from Stage 2 TextField — split-component avoids forwardRef
// self-reference TypeScript error (Część 10 empirical catch #22).
// ═══════════════════════════════════════════════════════════════════════════

type TextareaInnerProps = Omit<
  TextareaProps,
  "label" | "helperText" | "error"
>;

const TextareaInner = React.forwardRef<
  HTMLTextAreaElement,
  TextareaInnerProps
>(function TextareaInner(props, ref) {
  const {
    value,
    defaultValue,
    onChange,
    placeholder,
    disabled,
    required,
    readOnly,
    autoComplete,
    autoFocus,
    name,
    id,
    rows = 4,
    maxLength,
    size = "md",
    className,
    textareaClassName,
    "aria-describedby": ariaDescribedBy,
    "aria-required": ariaRequired,
    "aria-invalid": ariaInvalid,
    "aria-label": ariaLabel,
  } = props;

  const textareaClasses = [
    "eui-textarea",
    `eui-textarea-${size}`,
    textareaClassName,
  ]
    .filter(Boolean)
    .join(" ");

  // Wrapper exists for className parity z TextField (consumer className lands here).
  const wrapperClasses = [
    "eui-textarea-wrap",
    `eui-textarea-wrap-${size}`,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={wrapperClasses}>
      <textarea
        ref={ref}
        value={value}
        defaultValue={defaultValue}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        readOnly={readOnly}
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        name={name}
        id={id}
        rows={rows}
        maxLength={maxLength}
        aria-describedby={ariaDescribedBy}
        aria-required={ariaRequired}
        aria-invalid={ariaInvalid}
        aria-label={ariaLabel}
        className={textareaClasses}
      />
    </div>
  );
});

TextareaInner.displayName = "TextareaInner";

// ═══════════════════════════════════════════════════════════════════════════
// Textarea — public orchestrator.
// Mode detection:
//   1. inside Field (consumer-wrapped) → render inner core directly,
//      consumer's FieldControl injects id/aria-* on these props
//   2. standalone (label/helperText/error set, no outer Field) →
//      wrap in internal Field+FieldLabel+FieldControl+FieldMessage
//   3. bare (no Field, no chrome props) → render inner core directly
// Out of scope (per blueprint v1.2 sekcja 3):
//   - icon slots (NIE leading/trailing)
//   - auto-resize (osobna iteracja)
//   - height via size variant (rows prop handles height)
// ═══════════════════════════════════════════════════════════════════════════

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea(props, ref) {
    const { label, helperText, error, ...innerProps } = props;

    // Compound detection: if consumer wraps Textarea in <Field>, ctx is non-null.
    // In that case label/helperText/error props are ignored — consumer's
    // FieldLabel/FieldMessage handle that chrome.
    const ctx = useFieldContext();
    const insideField = ctx !== null;
    const wantsSelfChrome =
      !insideField &&
      (label !== undefined ||
        helperText !== undefined ||
        error !== undefined);

    if (wantsSelfChrome) {
      const messageContent = error ?? helperText;
      const messageVariant: "error" | "default" =
        error !== undefined ? "error" : "default";

      return (
        <Field
          id={innerProps.id}
          required={innerProps.required}
          disabled={innerProps.disabled}
          invalid={error !== undefined}
        >
          {label !== undefined && <FieldLabel>{label}</FieldLabel>}
          <FieldControl>
            <TextareaInner {...innerProps} ref={ref} />
          </FieldControl>
          {messageContent !== undefined && (
            <FieldMessage variant={messageVariant}>
              {messageContent}
            </FieldMessage>
          )}
        </Field>
      );
    }

    return <TextareaInner {...innerProps} ref={ref} />;
  }
);

Textarea.displayName = "Textarea";
