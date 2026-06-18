export type RuleCompilerIssueCode =
  | "RULE_COMPILER_UNSUPPORTED_ARCHETYPE"
  | "RULE_COMPILER_CONFIG_INVALID"
  | "RULE_COMPILER_REQUIRED_FIELD_MISSING"
  | "RULE_COMPILER_UNCONFIRMED_AI_FIELD"
  | "RULE_COMPILER_SECRET_NOT_ALLOWED"
  | "RULE_COMPILER_REAL_ENDPOINT_NOT_ALLOWED"
  | "RULE_COMPILER_REAL_ADAPTER_NOT_PUBLISHABLE"
  | "RULE_COMPILER_FAIL_CLOSED"
  | "RULE_COMPILER_DSL_INVALID"
  | "RULE_COMPILER_ARTIFACT_INVALID"
  | "RULE_COMPILER_SIDE_EFFECT_UNGUARDED"
  | "RULE_COMPILER_TEMPLATE_MISSING"
  | "RULE_COMPILER_TEST_CASE_MISSING"
  | "RULE_COMPILER_TRACE_EXPECTATION_MISSING";

export type RuleCompilerIssue = {
  code: RuleCompilerIssueCode;
  severity: "error" | "warning";
  message: string;
  path?: string[];
  hint?: string;
};

export function hasCompilerErrors(issues: RuleCompilerIssue[]): boolean {
  return issues.some((issue) => issue.severity === "error");
}
