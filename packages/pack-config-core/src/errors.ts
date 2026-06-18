export type PackConfigIssueCode =
  | "PACK_CONFIG_SCHEMA_INVALID"
  | "PACK_CONFIG_ARCHETYPE_INVALID"
  | "PACK_CONFIG_VERSION_INVALID"
  | "PACK_CONFIG_UNCONFIRMED_AI_FIELD"
  | "PACK_CONFIG_REQUIRED_FIELD_MISSING"
  | "PACK_CONFIG_SECRET_NOT_ALLOWED"
  | "PACK_CONFIG_REAL_ENDPOINT_NOT_ALLOWED"
  | "PACK_CONFIG_ADAPTER_MODE_NOT_PUBLISHABLE"
  | "PACK_CONFIG_NOT_PUBLISHABLE"
  | "PACK_CONFIG_UNKNOWN_CAPABILITY"
  | "PACK_CONFIG_FIELD_TYPE_INVALID";

export type PackConfigIssue = {
  code: PackConfigIssueCode;
  severity: "error" | "warning";
  message: string;
  path?: string[];
  hint?: string;
};

export type PackConfigValidationResult = {
  ok: boolean;
  issues: PackConfigIssue[];
};

export function makeResult(issues: PackConfigIssue[]): PackConfigValidationResult {
  return {
    ok: !issues.some((issue) => issue.severity === "error"),
    issues
  };
}
