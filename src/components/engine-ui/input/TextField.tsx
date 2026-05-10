"use client";

import * as React from "react";
import { AlertCircle, Eye, EyeOff, X } from "lucide-react";
import { IconButton, type IconButtonSize } from "../button/IconButton";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../primitives/Popover";
import { Field, FieldLabel, FieldControl, FieldMessage } from "./Field";
import { useFieldContext } from "./useFieldContext";

export type TextFieldType =
  | "text"
  | "email"
  | "tel"
  | "number"
  | "password"
  | "search";

export type TextFieldSize = "sm" | "md" | "lg";

export interface TextFieldProps {
  // HTML pass-through (controlled OR uncontrolled — cannot mix)
  type?: TextFieldType;
  value?: string;
  defaultValue?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClear?: () => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  readOnly?: boolean;
  autoComplete?: string;
  autoFocus?: boolean;
  name?: string;
  id?: string;

  // Self-contained convenience (used in standalone mode only)
  label?: string;
  helperText?: string;
  error?: string;

  // Visual
  size?: TextFieldSize;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;

  // Stage 4 enhancement (opt-in, standalone mode only).
  // v1: uncontrolled only. controlled open/onOpenChange pair deferred.
  // Activates when: showErrorPopover === true && error set && standalone mode.
  // Compound mode: silently ignored (consumer wires popover via Field+IconButton).
  showErrorPopover?: boolean;

  // Aria forwards (FieldControl injects these in compound mode)
  "aria-describedby"?: string;
  "aria-required"?: boolean;
  "aria-invalid"?: boolean;
  "aria-label"?: string;

  // Class hooks
  className?: string;
  inputClassName?: string;
}

// IconButton size mapping per TextField size (D7 sign-off)
const ICON_BUTTON_SIZE_MAP: Record<TextFieldSize, IconButtonSize> = {
  sm: "xs", // 24px button, 14px icon
  md: "sm", // 32px button, 16px icon (matches blueprint default)
  lg: "md", // 40px button, 18px icon
};

// ═══════════════════════════════════════════════════════════════════════════
// TextFieldInner — handles input core rendering only.
// Used in compound mode (consumer-wrapped Field) AND bare mode (no Field).
// Standalone mode wraps this via internal Field structure (TextField below).
// ═══════════════════════════════════════════════════════════════════════════

// Internal-only props passed by TextField outer when standalone mode resolves
// showErrorPopover + error. Public TextFieldProps does NOT expose these.
type TextFieldInnerInternalProps = {
  _errorPopoverMessage?: string; // when set, render AlertCircle popover trigger in iconRight
};

type TextFieldInnerProps = Omit<
  TextFieldProps,
  "label" | "helperText" | "error" | "showErrorPopover"
> &
  TextFieldInnerInternalProps;

const TextFieldInner = React.forwardRef<
  HTMLInputElement,
  TextFieldInnerProps
>(function TextFieldInner(props, ref) {
  const {
    type = "text",
    value,
    defaultValue,
    onChange,
    onClear,
    placeholder,
    disabled,
    required,
    readOnly,
    autoComplete,
    autoFocus,
    name,
    id,
    size = "md",
    iconLeft,
    iconRight,
    className,
    inputClassName,
    _errorPopoverMessage,
    "aria-describedby": ariaDescribedBy,
    "aria-required": ariaRequired,
    "aria-invalid": ariaInvalid,
    "aria-label": ariaLabel,
  } = props;

  // Password show/hide — single input, type attr toggle preserves autofill
  const [showPassword, setShowPassword] = React.useState(false);
  const isPassword = type === "password";
  const effectiveType: TextFieldType =
    isPassword && showPassword ? "text" : type;

  // Search clear: strict 4-condition guard (controlled mode only)
  const isSearch = type === "search";
  const showClearButton =
    isSearch &&
    value !== undefined &&
    onClear !== undefined &&
    value.length > 0;

  // Icon slot priority (D4 sign-off):
  //   password show/hide > search clear > error popover trigger > consumer iconRight
  // Limitation: when password type combined with showErrorPopover, password wins
  // (popover is suppressed). Error visual remains via FieldMessage + red border.
  const showErrorPopoverTrigger = _errorPopoverMessage !== undefined;
  let resolvedIconRight: React.ReactNode = iconRight;
  if (isPassword) {
    resolvedIconRight = (
      <IconButton
        aria-label={showPassword ? "Ukryj hasło" : "Pokaż hasło"}
        icon={showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
        variant="ghost"
        size={ICON_BUTTON_SIZE_MAP[size]}
        onClick={() => setShowPassword((v) => !v)}
        onMouseDown={(e) => e.preventDefault()}
        disabled={disabled}
        tabIndex={-1}
      />
    );
  } else if (showClearButton) {
    resolvedIconRight = (
      <IconButton
        aria-label="Wyczyść"
        icon={<X size={16} />}
        variant="ghost"
        size={ICON_BUTTON_SIZE_MAP[size]}
        onClick={() => onClear?.()}
        onMouseDown={(e) => e.preventDefault()}
        disabled={disabled}
        tabIndex={-1}
      />
    );
  } else if (showErrorPopoverTrigger) {
    resolvedIconRight = (
      <Popover>
        <PopoverTrigger asChild>
          <IconButton
            aria-label="Pokaż szczegóły błędu"
            icon={<AlertCircle size={16} />}
            variant="ghost"
            size={ICON_BUTTON_SIZE_MAP[size]}
            onMouseDown={(e) => e.preventDefault()}
            disabled={disabled}
            tabIndex={-1}
            className="eui-textfield-error-popover-trigger"
          />
        </PopoverTrigger>
        <PopoverContent size="contextual">
          {_errorPopoverMessage}
        </PopoverContent>
      </Popover>
    );
  }

  const hasIconLeft = iconLeft !== undefined && iconLeft !== null;
  const hasIconRight =
    resolvedIconRight !== undefined && resolvedIconRight !== null;

  const inputClasses = [
    "eui-textfield-input",
    `eui-textfield-input-${size}`,
    hasIconLeft && "eui-textfield-input--with-icon-left",
    hasIconRight && "eui-textfield-input--with-icon-right",
    inputClassName,
  ]
    .filter(Boolean)
    .join(" ");

  const wrapperClasses = [
    "eui-textfield-wrap",
    `eui-textfield-wrap-${size}`,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={wrapperClasses}>
      {hasIconLeft && (
        <span
          className="eui-textfield-icon eui-textfield-icon-left"
          aria-hidden="true"
        >
          {iconLeft}
        </span>
      )}
      <input
        ref={ref}
        type={effectiveType}
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
        aria-describedby={ariaDescribedBy}
        aria-required={ariaRequired}
        aria-invalid={ariaInvalid}
        aria-label={ariaLabel}
        className={inputClasses}
      />
      {hasIconRight && (
        <span className="eui-textfield-icon eui-textfield-icon-right">
          {resolvedIconRight}
        </span>
      )}
    </div>
  );
});

TextFieldInner.displayName = "TextFieldInner";

// ═══════════════════════════════════════════════════════════════════════════
// TextField — public orchestrator.
// Mode detection:
//   1. inside Field (consumer-wrapped) → render inner core directly,
//      consumer's FieldControl injects id/aria-* on these props
//   2. standalone (label/helperText/error set, no outer Field) →
//      wrap in internal Field+FieldLabel+FieldControl+FieldMessage
//   3. bare (no Field, no chrome props) → render inner core directly
// ═══════════════════════════════════════════════════════════════════════════

export const TextField = React.forwardRef<HTMLInputElement, TextFieldProps>(
  function TextField(props, ref) {
    const { label, helperText, error, showErrorPopover, ...innerProps } =
      props;

    // Compound detection: if consumer wraps TextField in <Field>, ctx is non-null.
    // In that case label/helperText/error props are ignored — consumer's
    // FieldLabel/FieldMessage handle that chrome. showErrorPopover also no-ops
    // in compound mode (D2 sign-off): consumers wire popover via Field+IconButton.
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
      // Stage 4: thread error popover trigger to inner via internal-only prop.
      const errorPopoverMessage =
        showErrorPopover && error !== undefined ? error : undefined;

      return (
        <Field
          id={innerProps.id}
          required={innerProps.required}
          disabled={innerProps.disabled}
          invalid={error !== undefined}
        >
          {label !== undefined && <FieldLabel>{label}</FieldLabel>}
          <FieldControl>
            <TextFieldInner
              {...innerProps}
              _errorPopoverMessage={errorPopoverMessage}
              ref={ref}
            />
          </FieldControl>
          {messageContent !== undefined && (
            <FieldMessage variant={messageVariant}>
              {messageContent}
            </FieldMessage>
          )}
        </Field>
      );
    }

    return <TextFieldInner {...innerProps} ref={ref} />;
  }
);

TextField.displayName = "TextField";
