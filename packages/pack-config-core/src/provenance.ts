export type ConfigFieldSource = "defaultFromPack" | "inferredByAI" | "confirmedByUser" | "migrated" | "requiredButMissing";

export type ConfigField<T = unknown> = {
  value?: T;
  source: ConfigFieldSource;
  needsConfirmation?: boolean;
  required?: boolean;
  label?: {
    en?: string;
    zhCN?: string;
  };
  description?: {
    en?: string;
    zhCN?: string;
  };
  updatedAt?: string;
  updatedBy?: string;
};

type ConfigLike = {
  capabilities?: Record<string, ConfigField<unknown>>;
  rules?: Record<string, ConfigField<unknown>>;
  policies?: Record<string, ConfigField<unknown>>;
  templates?: Array<{ text: ConfigField<string>; templateId: string }>;
};

export function isFieldConfirmed(field: ConfigField<unknown>): boolean {
  return field.source === "confirmedByUser";
}

export function isFieldMissing(field: ConfigField<unknown>): boolean {
  return field.source === "requiredButMissing";
}

export function isFieldNeedsConfirmation(field: ConfigField<unknown>): boolean {
  return field.source === "inferredByAI" || field.needsConfirmation === true;
}

export function collectUnconfirmedFields(config: ConfigLike): Array<{ path: string[]; field: ConfigField<unknown> }> {
  const results: Array<{ path: string[]; field: ConfigField<unknown> }> = [];

  for (const [section, fields] of [
    ["capabilities", config.capabilities],
    ["rules", config.rules],
    ["policies", config.policies]
  ] as const) {
    for (const [fieldId, field] of Object.entries(fields ?? {})) {
      if (!isFieldConfirmed(field)) {
        results.push({ path: [section, fieldId], field });
      }
    }
  }

  for (const template of config.templates ?? []) {
    if (!isFieldConfirmed(template.text)) {
      results.push({ path: ["templates", template.templateId, "text"], field: template.text });
    }
  }

  return results;
}
