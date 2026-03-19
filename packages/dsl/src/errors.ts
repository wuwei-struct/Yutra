export type DslErrorCode =
  | "DSL_PARSE_ERROR"
  | "DSL_UNSUPPORTED_EXTENSION"
  | "DSL_SCHEMA_INVALID"
  | "DSL_INITIAL_STATE_MISSING"
  | "DSL_UNKNOWN_STATE"
  | "DSL_UNKNOWN_ACTION"
  | "DSL_UNKNOWN_GUARD"
  | "DSL_UNREACHABLE_STATE";

export type DslSeverity = "error" | "warning";

export interface DslValidationIssue {
  code: DslErrorCode;
  message: string;
  path?: string[];
  severity?: DslSeverity;
  hint?: string;
}

export class DslError extends Error {
  public readonly issue: DslValidationIssue;

  public constructor(issue: DslValidationIssue) {
    super(issue.message);
    this.name = "DslError";
    this.issue = issue;
  }
}

export function formatDslIssue(issue: DslValidationIssue): string {
  const severity = issue.severity ?? "error";
  const path = issue.path && issue.path.length > 0 ? ` at ${issue.path.join(".")}` : "";
  const hint = issue.hint ? ` Hint: ${issue.hint}` : "";
  return `[${severity}] ${issue.code}${path}: ${issue.message}${hint}`;
}

export function formatDslIssues(issues: DslValidationIssue[]): string {
  return issues.map((issue) => formatDslIssue(issue)).join("\n");
}
