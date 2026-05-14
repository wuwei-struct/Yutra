import type { BuilderIssue } from "@yutra/builder-core";
import type { BuilderPreviewResult } from "../types";

export function prettyJson(input: unknown): string {
  return JSON.stringify(input, null, 2);
}

export function formatIssuePath(path?: string[]): string {
  return path && path.length > 0 ? path.join(".") : "-";
}

export function collectPreviewIssues(result: BuilderPreviewResult): BuilderIssue[] {
  const issues: BuilderIssue[] = [];
  issues.push(...result.formIssues);
  issues.push(...result.generationIssues);
  if (result.validation) {
    issues.push(...result.validation.issues);
  }
  return issues;
}
