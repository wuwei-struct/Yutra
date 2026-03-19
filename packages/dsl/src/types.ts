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
