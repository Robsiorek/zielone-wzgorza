"use client";

/**
 * Radio + RadioGroup — Engine UI Part 11 (Form Controls).
 *
 * Native input type=radio sr-only + custom circular dot (VISUAL-DNA:
 * native control + custom visual, B-neutral focus). RadioGroup zarządza
 * wspólnym name + value/onChange — natywne radia ze wspólnym name dają
 * strzałki klawiatury + roving focus ZA DARMO (zachowanie przeglądarki,
 * bez własnego keyboard JS). role=radiogroup + aria z FieldContext gdy
 * obecny (R1 zde-ryzykowany w Stage 1 — context wystarcza).
 *
 * Single Radio wspiera tri-mode dla parytetu z TextField (PO D5), choć
 * realnie używany zwykrywany w RadioGroup.
 */

import * as React from "react";
import { Field, FieldMessage } from "./Field";
import { useFieldContext } from "./useFieldContext";
import { cx } from "../tokens/cx";

export interface RadioProps {
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;

  disabled?: boolean;
  required?: boolean;
  name?: string;
  id?: string;
  value?: string;

  label?: React.ReactNode;
  helperText?: string;
  error?: string;

  // Aria forwards (FieldControl injektuje w compound mode)
  "aria-describedby"?: string;
  "aria-required"?: boolean;
  "aria-invalid"?: boolean;
  "aria-label"?: string;

  className?: string;
}

type RadioInnerProps = Omit<RadioProps, "label" | "helperText" | "error"> & {
  label?: React.ReactNode;
};

const RadioInner = React.forwardRef<HTMLInputElement, RadioInnerProps>(
  function RadioInner(props, ref) {
    const {
      checked,
      defaultChecked,
      onChange,
      disabled,
      required,
      name,
      id,
      value,
      label,
      "aria-describedby": ariaDescribedBy,
      "aria-required": ariaRequired,
      "aria-invalid": ariaInvalid,
      "aria-label": ariaLabel,
      className,
    } = props;

    return (
      <label className={cx("eui-radio", disabled && "eui-radio-disabled", className)}>
        <input
          ref={ref}
          type="radio"
          className="eui-radio-input"
          checked={checked}
          defaultChecked={defaultChecked}
          disabled={disabled}
          required={required}
          name={name}
          id={id}
          value={value}
          aria-describedby={ariaDescribedBy}
          aria-required={ariaRequired}
          aria-invalid={ariaInvalid}
          aria-label={ariaLabel}
          onChange={(e) => onChange?.(e.target.checked)}
        />
        <span className="eui-radio-box" aria-hidden="true">
          <span className="eui-radio-dot" />
        </span>
        {label !== undefined && (
          <span className="eui-radio-label">{label}</span>
        )}
      </label>
    );
  }
);

RadioInner.displayName = "RadioInner";

// Single Radio — tri-mode orchestrator (mirror TextField/Checkbox)
export const Radio = React.forwardRef<HTMLInputElement, RadioProps>(
  function Radio(props, ref) {
    const { label, helperText, error, ...innerProps } = props;

    const ctx = useFieldContext();
    const insideField = ctx !== null;
    const wantsSelfChrome =
      !insideField && (helperText !== undefined || error !== undefined);

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
          <RadioInner {...innerProps} label={label} ref={ref} />
          {messageContent !== undefined && (
            <FieldMessage variant={messageVariant}>
              {messageContent}
            </FieldMessage>
          )}
        </Field>
      );
    }

    return <RadioInner {...innerProps} label={label} ref={ref} />;
  }
);

Radio.displayName = "Radio";

// ═══════════════════════════════════════════════════════════════════════════
// RadioGroup — single-select; wspólny name → natywne strzałki klawiatury
// ═══════════════════════════════════════════════════════════════════════════

export interface RadioOption {
  value: string;
  label: React.ReactNode;
  disabled?: boolean;
}

export interface RadioGroupProps {
  options: ReadonlyArray<RadioOption>;
  value: string;
  onChange: (next: string) => void;
  /** Wspólny name dla natywnych radiów (wymagany dla keyboard/roving). */
  name: string;

  label?: string;
  helperText?: string;
  error?: string;

  disabled?: boolean;
  className?: string;
}

export function RadioGroup(props: RadioGroupProps) {
  const {
    options,
    value,
    onChange,
    name,
    label,
    helperText,
    error,
    disabled,
    className,
  } = props;

  const ctx = useFieldContext();
  const groupId = ctx?.fieldId;
  const describedBy = error
    ? ctx?.errorId
    : helperText
    ? ctx?.descriptionId
    : undefined;

  const messageContent = error ?? helperText;
  const messageVariant: "error" | "default" =
    error !== undefined ? "error" : "default";
  const insideField = ctx !== null;
  const showOwnMessage = !insideField && messageContent !== undefined;

  return (
    <div
      role="radiogroup"
      aria-label={!label ? "Grupa wyboru" : undefined}
      aria-labelledby={label && groupId ? `${groupId}-legend` : undefined}
      aria-describedby={describedBy}
      className={cx("eui-radio-group", className)}
    >
      {label && (
        <span
          id={groupId ? `${groupId}-legend` : undefined}
          className="eui-radio-group-legend"
        >
          {label}
        </span>
      )}

      <div className="eui-radio-group-items">
        {options.map((opt) => (
          <RadioInner
            key={opt.value}
            name={name}
            value={opt.value}
            checked={value === opt.value}
            disabled={disabled || opt.disabled}
            onChange={(c) => {
              if (c) onChange(opt.value);
            }}
            label={opt.label}
          />
        ))}
      </div>

      {showOwnMessage && (
        <FieldMessage variant={messageVariant}>{messageContent}</FieldMessage>
      )}
    </div>
  );
}
