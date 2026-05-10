"use client";

import * as React from "react";
import { HelperText, type HelperTextVariant } from "../text/HelperText";
import {
  FieldContext,
  type FieldContextValue,
  useFieldContext,
} from "./useFieldContext";
import { useFieldId } from "./useFieldId";

// ═══════════════════════════════════════════
// Field — root compound container
// ═══════════════════════════════════════════

export interface FieldProps {
  id?: string;
  required?: boolean;
  disabled?: boolean;
  invalid?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const Field = React.forwardRef<HTMLDivElement, FieldProps>(function Field(
  {
    id,
    required = false,
    disabled = false,
    invalid = false,
    children,
    className,
  },
  ref
) {
  const ids = useFieldId(id);
  const [hasDescription, setHasDescription] = React.useState(false);
  const [hasError, setHasError] = React.useState(false);

  const ctx: FieldContextValue = React.useMemo(
    () => ({
      fieldId: ids.fieldId,
      descriptionId: ids.descriptionId,
      errorId: ids.errorId,
      required,
      disabled,
      invalid,
      hasDescription,
      hasError,
      setHasDescription,
      setHasError,
    }),
    [
      ids.fieldId,
      ids.descriptionId,
      ids.errorId,
      required,
      disabled,
      invalid,
      hasDescription,
      hasError,
    ]
  );

  const classes = ["eui-field", className].filter(Boolean).join(" ");

  return (
    <FieldContext.Provider value={ctx}>
      <div ref={ref} className={classes}>
        {children}
      </div>
    </FieldContext.Provider>
  );
});

Field.displayName = "Field";

// ═══════════════════════════════════════════
// FieldLabel
// Renders raw <label> z eui-label typography class (Text reuse via class).
// Empirical rationale: TextProps does not expose htmlFor;
// raw <label> + eui-label class achieves identical visual output.
// ═══════════════════════════════════════════

export interface FieldLabelProps {
  children: React.ReactNode;
  required?: boolean;
  visuallyHidden?: boolean;
  className?: string;
}

export function FieldLabel({
  children,
  required: requiredProp,
  visuallyHidden = false,
  className,
}: FieldLabelProps) {
  const ctx = useFieldContext();
  const isRequired = requiredProp ?? ctx?.required ?? false;
  const htmlFor = ctx?.fieldId;

  const classes = [
    "eui-label",
    "eui-field-label",
    visuallyHidden && "eui-field-label-visually-hidden",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <label htmlFor={htmlFor} className={classes}>
      {children}
      {isRequired && (
        <span
          aria-hidden="true"
          className="eui-field-label-required-asterisk"
        >
          {" "}*
        </span>
      )}
    </label>
  );
}

// ═══════════════════════════════════════════
// FieldControl — transparent (NO wrapper, NO className) — v1.2 fix #2
// Pure React.cloneElement props injection.
// ═══════════════════════════════════════════

export interface FieldControlProps {
  children: React.ReactElement;
}

type ChildPropsLike = {
  id?: string;
  "aria-describedby"?: string;
  "aria-required"?: boolean;
  "aria-invalid"?: boolean;
  required?: boolean;
  disabled?: boolean;
};

export function FieldControl({ children }: FieldControlProps) {
  const ctx = useFieldContext();

  if (!ctx) {
    return children;
  }

  const childProps = children.props as ChildPropsLike;

  // id: user wins
  const finalId = childProps.id ?? ctx.fieldId;

  // aria-describedby: merge, only include IDs whose targets render in DOM (v1.2 fix #3)
  const describedByParts: string[] = [];
  if (childProps["aria-describedby"]) {
    describedByParts.push(childProps["aria-describedby"]);
  }
  if (ctx.hasDescription) describedByParts.push(ctx.descriptionId);
  if (ctx.hasError) describedByParts.push(ctx.errorId);
  const finalAriaDescribedBy =
    describedByParts.length > 0 ? describedByParts.join(" ") : undefined;

  // aria-required: user wins (explicit aria-required prop wins over context)
  const finalAriaRequired =
    childProps["aria-required"] !== undefined
      ? childProps["aria-required"]
      : ctx.required
      ? true
      : undefined;

  // aria-invalid: user wins
  const finalAriaInvalid =
    childProps["aria-invalid"] !== undefined
      ? childProps["aria-invalid"]
      : ctx.invalid
      ? true
      : undefined;

  // disabled: true wins (v1.2 fix #4 — parent safety guard)
  const finalDisabled = childProps.disabled || ctx.disabled || undefined;

  // required: true wins (v1.2 fix #4)
  const finalRequired = childProps.required || ctx.required || undefined;

  return React.cloneElement(children, {
    id: finalId,
    "aria-describedby": finalAriaDescribedBy,
    "aria-required": finalAriaRequired,
    "aria-invalid": finalAriaInvalid,
    disabled: finalDisabled,
    required: finalRequired,
  } as Partial<ChildPropsLike>);
}

// ═══════════════════════════════════════════
// FieldMessage
// v1.2 fix #3: registers presence in context (hasDescription/hasError flags),
// so FieldControl wires aria-describedby ONLY to IDs that render in DOM.
// ═══════════════════════════════════════════

export type FieldMessageVariant =
  | "default"
  | "error"
  | "success"
  | "warning";

export interface FieldMessageProps {
  children?: React.ReactNode;
  variant?: FieldMessageVariant;
  className?: string;
}

export function FieldMessage({
  children,
  variant: variantProp,
  className,
}: FieldMessageProps) {
  const ctx = useFieldContext();

  const variant: FieldMessageVariant =
    variantProp ?? (ctx?.invalid ? "error" : "default");
  const isError = variant === "error";

  const id = isError ? ctx?.errorId : ctx?.descriptionId;

  const hasContent =
    children !== undefined && children !== null && children !== "";

  // useState setters from Field are stable references — safe in dep array.
  const setHasError = ctx?.setHasError;
  const setHasDescription = ctx?.setHasDescription;

  React.useLayoutEffect(() => {
    if (!hasContent) return;
    if (isError) {
      if (!setHasError) return;
      setHasError(true);
      return () => setHasError(false);
    } else {
      if (!setHasDescription) return;
      setHasDescription(true);
      return () => setHasDescription(false);
    }
  }, [hasContent, isError, setHasError, setHasDescription]);

  if (!hasContent) return null;

  const classes = ["eui-field-message", className].filter(Boolean).join(" ");

  return (
    <HelperText
      variant={variant as HelperTextVariant}
      id={id}
      className={classes}
    >
      {children}
    </HelperText>
  );
}
