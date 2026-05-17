"use client";

/**
 * Switch — Engine UI Part 11 (Form Controls).
 *
 * Native input type=checkbox + role=switch (PO D2 — APG-endorsed: zachowuje
 * checkbox semantics + form participation, AT ogłasza "switch on/off").
 * sr-only input + custom styled track/thumb (VISUAL-DNA: native + custom
 * visual, B-neutral focus). Tri-mode mirror TextField/Checkbox (PO D5).
 */

import * as React from "react";
import { Field, FieldMessage } from "./Field";
import { useFieldContext } from "./useFieldContext";
import { cx } from "../tokens/cx";

export interface SwitchProps {
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

type SwitchInnerProps = Omit<SwitchProps, "label" | "helperText" | "error"> & {
  label?: React.ReactNode;
};

const SwitchInner = React.forwardRef<HTMLInputElement, SwitchInnerProps>(
  function SwitchInner(props, ref) {
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
      <label className={cx("eui-switch", disabled && "eui-switch-disabled", className)}>
        <input
          ref={ref}
          type="checkbox"
          role="switch"
          className="eui-switch-input"
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
        <span className="eui-switch-track" aria-hidden="true">
          <span className="eui-switch-thumb" />
        </span>
        {label !== undefined && (
          <span className="eui-switch-label">{label}</span>
        )}
      </label>
    );
  }
);

SwitchInner.displayName = "SwitchInner";

export const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  function Switch(props, ref) {
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
          <SwitchInner {...innerProps} label={label} ref={ref} />
          {messageContent !== undefined && (
            <FieldMessage variant={messageVariant}>
              {messageContent}
            </FieldMessage>
          )}
        </Field>
      );
    }

    return <SwitchInner {...innerProps} label={label} ref={ref} />;
  }
);

Switch.displayName = "Switch";
