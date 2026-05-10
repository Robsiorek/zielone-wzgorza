// Engine UI Inputs Foundation (Part 10) — Stage 1 barrel
// useFieldContext / FieldContext are intentionally NOT re-exported (internal).

export {
  Field,
  FieldLabel,
  FieldControl,
  FieldMessage,
} from "./Field";
export type {
  FieldProps,
  FieldLabelProps,
  FieldControlProps,
  FieldMessageProps,
  FieldMessageVariant,
} from "./Field";

export { useFieldId } from "./useFieldId";
export type { FieldIds } from "./useFieldId";

export { TextField } from "./TextField";
export type { TextFieldProps, TextFieldType, TextFieldSize } from "./TextField";

export { Textarea } from "./Textarea";
export type { TextareaProps, TextareaSize } from "./Textarea";
