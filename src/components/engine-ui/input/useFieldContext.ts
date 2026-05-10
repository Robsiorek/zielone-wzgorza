"use client";

import * as React from "react";

export type FieldContextValue = {
  fieldId: string;
  descriptionId: string;
  errorId: string;
  required: boolean;
  disabled: boolean;
  invalid: boolean;
  hasDescription: boolean;
  hasError: boolean;
  setHasDescription: (v: boolean) => void;
  setHasError: (v: boolean) => void;
};

export const FieldContext = React.createContext<FieldContextValue | null>(null);

export function useFieldContext(): FieldContextValue | null {
  return React.useContext(FieldContext);
}
