export type DslFormat = "yaml" | "json";

export interface LoadedDslFile {
  path: string;
  format: DslFormat;
  source: string;
  raw: unknown;
}

export interface DslValidationResult {
  valid: boolean;
  errors: import("./errors").DslValidationIssue[];
  warnings: import("./errors").DslValidationIssue[];
}

export interface LoadedAndValidatedDslFile extends LoadedDslFile {
  spec: import("@yutra/spec").AgentSpec;
  validation: DslValidationResult;
}

export interface FieldAliasMappingRecord {
  from: string;
  to: string;
  provenance: "alias_map";
  path?: string[];
}

export interface NameCanonicalizationRecord {
  kind: import("./name-normalizer").CanonicalNameKind;
  from: string;
  to: string;
  strategy: "dictionary" | "slug" | "codepoint_fallback" | "existing";
  path?: string[];
}

export interface DslNormalizationResult {
  normalizedInput: unknown;
  spec: import("@yutra/spec").AgentSpec;
  fieldAliasMappings: FieldAliasMappingRecord[];
  nameCanonicalizations: NameCanonicalizationRecord[];
  issues: import("./errors").DslValidationIssue[];
}

export interface DslExplainResult {
  raw: unknown;
  normalizedInput: unknown;
  fieldAliasMappings: FieldAliasMappingRecord[];
  nameCanonicalizations: NameCanonicalizationRecord[];
  canonicalIR: import("@yutra/spec").AgentSpec;
  issues: import("./errors").DslValidationIssue[];
}

export interface DslInspectionReport {
  source: {
    format?: DslFormat;
    path?: string;
    hasChineseAliases: boolean;
  };
  raw: unknown;
  normalized: unknown;
  canonical: import("@yutra/spec").AgentSpec;
  mappings: {
    fieldAliases: FieldAliasMappingRecord[];
    canonicalNames: NameCanonicalizationRecord[];
  };
  issues: import("./errors").DslValidationIssue[];
  warnings: import("./errors").DslValidationIssue[];
}
