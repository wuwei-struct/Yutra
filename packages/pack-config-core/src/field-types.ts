export type PackConfigFieldType =
  | "boolean"
  | "enum"
  | "multi_select"
  | "number"
  | "text"
  | "condition_table"
  | "priority"
  | "mapping";

export const PACK_CONFIG_FIELD_TYPES = [
  "boolean",
  "enum",
  "multi_select",
  "number",
  "text",
  "condition_table",
  "priority",
  "mapping"
] as const satisfies readonly PackConfigFieldType[];

export type FieldDefinition = {
  fieldId: string;
  type: PackConfigFieldType;
  label: {
    en: string;
    zhCN: string;
  };
  description?: {
    en?: string;
    zhCN?: string;
  };
  required?: boolean;
  defaultValue?: unknown;
  enumOptions?: Array<{
    value: string;
    label: {
      en: string;
      zhCN: string;
    };
  }>;
  min?: number;
  max?: number;
};
