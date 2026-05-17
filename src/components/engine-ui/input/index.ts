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

export { Select } from "./Select";
export type { SelectProps, SelectOption, SelectSize } from "./Select";

// Part 11 — Form Controls
export { Checkbox, CheckboxGroup } from "./Checkbox";
export type {
  CheckboxProps,
  CheckboxGroupProps,
  CheckboxOption,
} from "./Checkbox";

export { Radio, RadioGroup } from "./Radio";
export type { RadioProps, RadioGroupProps, RadioOption } from "./Radio";

export { Switch } from "./Switch";
export type { SwitchProps } from "./Switch";
