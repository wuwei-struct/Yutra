import type { ZodError } from "zod";
import { BUILDER_ISSUE_CODES, type BuilderIssue, type BuilderIssueCode } from "./types";

export { BUILDER_ISSUE_CODES };

export class BuilderCoreError extends Error {
  public readonly issues: BuilderIssue[];

  public constructor(message: string, issues: BuilderIssue[]) {
    super(message);
    this.name = "BuilderCoreError";
    this.issues = issues;
  }
}

export function issue(code: BuilderIssueCode, message: string, path?: string[], severity: "error" | "warning" = "error"): BuilderIssue {
  return { code, message, path, severity };
}

export function zodToBuilderIssues(code: BuilderIssueCode, err: ZodError<unknown>): BuilderIssue[] {
  return err.issues.map((item) =>
    issue(
      code,
      item.message,
      item.path.map((part) => String(part)),
      "error"
    )
  );
}

export function throwIfIssues(message: string, issues: BuilderIssue[]): void {
  if (issues.some((item) => item.severity === "error")) {
    throw new BuilderCoreError(message, issues);
  }
}

export function unknownIntentIssue(intentId: string): BuilderIssue {
  return issue(BUILDER_ISSUE_CODES.UNKNOWN_INTENT, `Unknown intent id '${intentId}'.`, ["selectedIntentIds"]);
}

export function unknownSkillIssue(skillName: string): BuilderIssue {
  return issue(BUILDER_ISSUE_CODES.UNKNOWN_SKILL, `Unknown skill name '${skillName}'.`, ["selectedSkillNames"]);
}
