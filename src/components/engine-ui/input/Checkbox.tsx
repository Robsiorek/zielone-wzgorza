"use client";

/**
 * Checkbox — Engine UI Part 11 (Form Controls).
 *
 * Native <input type="checkbox"> sr-only + custom styled box (VISUAL-DNA:
 * native control + custom visual, B-neutral focus, no .bubble/Tailwind
 * override). Indeterminate supported (input.indeterminate property via ref).
 *
 * Tri-mode API mirror TextField (PO D5):
 *  - compound: inside Field → FieldControl injektuje id, aria-attrs,
 *    disabled, required na inner input (destructure + forward jak TextFieldInner)
 *  - standalone: label/helperText/error props (bez outer Field) → internal
 *    Field wiring + FieldMessage poniżej
 *  - bare: sam kontrolka + inline label
 *
 * Checkbox label = INLINE obok boxa (klikalny <label> wrapper) — NIE
 * FieldLabel-above (to wzorzec checkboxa, inaczej niż TextField).
 */

import * as React from "react";
import { Check, Minus } from "lucide-react";
import { Field, FieldMessage } from "./Field";
import { useFieldContext } from "./useFieldContext";
import { cx } from "../tokens/cx";

export interface CheckboxProps {
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  /** Tri-state: rysuje "−" zamiast "✓"; nie zmienia checked. */
  indeterminate?: boolean;

  disabled?: boolean;
  required?: boolean;
  name?: string;
  id?: string;
  value?: string;

  /** Inline label text obok boxa. */
  label?: React.ReactNode;
  /** Self-contained convenience (standalone mode only). */
  helperText?: string;
  error?: string;

  // Aria forwards (FieldControl injektuje w compound mode)
  "aria-describedby"?: string;
  "aria-required"?: boolean;
  "aria-invalid"?: boolean;
  "aria-label"?: string;

  className?: string;
}

// ── Inner: native input sr-only + custom box + inline label ──
type CheckboxInnerProps = Omit<CheckboxProps, "label" | "helperText" | "error"> & {
  label?: React.ReactNode;
};

const CheckboxInner = React.forwardRef<HTMLInputElement, CheckboxInnerProps>(
  function CheckboxInner(props, ref) {
    const {
      checked,
      defaultChecked,
      onChange,
      indeterminate = false,
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

    const innerRef = React.useRef<HTMLInputElement>(null);
    React.useImperativeHandle(ref, () => innerRef.current as HTMLInputElement);

    // input.indeterminate to property, nie atrybut — ustawiamy przez ref.
    React.useEffect(() => {
      if (innerRef.current) innerRef.current.indeterminate = indeterminate;
    }, [indeterminate, checked]);

    return (
      <label className={cx("eui-checkbox", disabled && "eui-checkbox-disabled", className)}>
        <input
          ref={innerRef}
          type="checkbox"
          className="eui-checkbox-input"
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
        <span className="eui-checkbox-box" aria-hidden="true">
          {indeterminate ? (
            <Minus className="eui-checkbox-mark" strokeWidth={3} />
          ) : (
            <Check className="eui-checkbox-mark" strokeWidth={3} />
          )}
        </span>
        {label !== undefined && (
          <span className="eui-checkbox-label">{label}</span>
        )}
      </label>
    );
  }
);

CheckboxInner.displayName = "CheckboxInner";

// ═══════════════════════════════════════════════════════════════════════════
// Checkbox — tri-mode orchestrator (mirror TextField)
// ═══════════════════════════════════════════════════════════════════════════

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  function Checkbox(props, ref) {
    const { label, helperText, error, ...innerProps } = props;

    const ctx = useFieldContext();
    const insideField = ctx !== null;
    const wantsSelfChrome =
      !insideField &&
      (helperText !== undefined || error !== undefined);

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
          {/* Checkbox label zostaje INLINE (nie FieldLabel-above). */}
          <CheckboxInner {...innerProps} label={label} ref={ref} />
          {messageContent !== undefined && (
            <FieldMessage variant={messageVariant}>
              {messageContent}
            </FieldMessage>
          )}
        </Field>
      );
    }

    return <CheckboxInner {...innerProps} label={label} ref={ref} />;
  }
);

Checkbox.displayName = "Checkbox";

// ═══════════════════════════════════════════════════════════════════════════
// CheckboxGroup — multi-select + opcjonalny "select all" (indeterminate)
// ═══════════════════════════════════════════════════════════════════════════

export interface CheckboxOption {
  value: string;
  label: React.ReactNode;
  disabled?: boolean;
}

export interface CheckboxGroupProps {
  options: ReadonlyArray<CheckboxOption>;
  value: string[];
  onChange: (next: string[]) => void;

  /** Group legend (standalone mode). */
  label?: string;
  helperText?: string;
  error?: string;

  /** Renderuje "select all" checkbox (indeterminate gdy częściowo). */
  selectAllLabel?: string;

  disabled?: boolean;
  name?: string;
  className?: string;
}

export function CheckboxGroup(props: CheckboxGroupProps) {
  const {
    options,
    value,
    onChange,
    label,
    helperText,
    error,
    selectAllLabel,
    disabled,
    name,
    className,
  } = props;

  const ctx = useFieldContext();
  const groupId = ctx?.fieldId;
  const describedBy = error
    ? ctx?.errorId
    : helperText
    ? ctx?.descriptionId
    : undefined;

  const enabledValues = options.filter((o) => !o.disabled).map((o) => o.value);
  const selectedEnabled = enabledValues.filter((v) => value.includes(v));
  const allChecked =
    enabledValues.length > 0 && selectedEnabled.length === enabledValues.length;
  const someChecked = selectedEnabled.length > 0 && !allChecked;

  const toggle = (v: string) => {
    onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  };

  const toggleAll = () => {
    onChange(allChecked ? value.filter((v) => !enabledValues.includes(v)) : [
      ...new Set([...value, ...enabledValues]),
    ]);
  };

  const messageContent = error ?? helperText;
  const messageVariant: "error" | "default" =
    error !== undefined ? "error" : "default";
  const insideField = ctx !== null;
  const showOwnMessage = !insideField && messageContent !== undefined;

  return (
    <div
      role="group"
      aria-label={!label && !groupId ? "Grupa opcji" : undefined}
      aria-labelledby={label && groupId ? `${groupId}-legend` : undefined}
      aria-describedby={describedBy}
      className={cx("eui-checkbox-group", className)}
    >
      {label && (
        <span id={groupId ? `${groupId}-legend` : undefined} className="eui-checkbox-group-legend">
          {label}
        </span>
      )}

      {selectAllLabel && (
        <Checkbox
          checked={allChecked}
          indeterminate={someChecked}
          onChange={toggleAll}
          disabled={disabled}
          label={selectAllLabel}
          className="eui-checkbox-group-all"
        />
      )}

      <div className="eui-checkbox-group-items">
        {options.map((opt) => (
          <Checkbox
            key={opt.value}
            name={name}
            value={opt.value}
            checked={value.includes(opt.value)}
            disabled={disabled || opt.disabled}
            onChange={() => toggle(opt.value)}
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
