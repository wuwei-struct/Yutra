import type { ZodError } from "zod";
import { AI_DRAFT_ERROR_CODES, type AiDraftErrorCode, type AiDraftIssue, type AiDraftSeverity, type AiDraftValidationResult } from "./types";

export { AI_DRAFT_ERROR_CODES };

export class BuilderAiCoreError extends Error {
  public readonly issues: AiDraftIssue[];

  public constructor(message: string, issues: AiDraftIssue[]) {
    super(message);
    this.name = "BuilderAiCoreError";
    this.issues = issues;
  }
}

export function aiDraftIssue(
  code: AiDraftErrorCode,
  message: string,
  path?: string[],
  severity: AiDraftSeverity = "error",
  hint?: string
): AiDraftIssue {
  return { code, message, severity, path, hint };
}

export function zodToAiDraftIssues(code: AiDraftErrorCode, err: ZodError<unknown>, severity: AiDraftSeverity = "error"): AiDraftIssue[] {
  return err.issues.map((item) => ({
    code,
    severity,
    message: item.message,
    path: item.path.map((part) => String(part))
  }));
}

export function toValidationResult(issues: AiDraftIssue[]): AiDraftValidationResult {
  return {
    ok: !issues.some((item) => item.severity === "error"),
    issues
  };
}

export function throwIfAiDraftErrors(message: string, issues: AiDraftIssue[]): void {
  if (issues.some((item) => item.severity === "error")) {
    throw new BuilderAiCoreError(message, issues);
  }
}
