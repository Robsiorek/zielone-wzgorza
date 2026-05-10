"use client";

import * as React from "react";

export type FieldIds = {
  fieldId: string;
  descriptionId: string;
  errorId: string;
};

export function useFieldId(idProp?: string): FieldIds {
  const generatedId = React.useId();
  const fieldId = idProp ?? generatedId;
  return {
    fieldId,
    descriptionId: `${fieldId}-description`,
    errorId: `${fieldId}-error`,
  };
}
