import type { DslValidationIssue } from "./errors";
import { normalizeDslWithDetails } from "./normalize";
import type { DslExplainResult, DslFormat, DslInspectionReport } from "./types";
import { validateDsl } from "./validator";

function bySeverity(issues: DslValidationIssue[], severity: "error" | "warning"): DslValidationIssue[] {
  return issues.filter((issue) => (issue.severity ?? "error") === severity);
}

export function inspectDsl(
  input: unknown,
  source?: {
    format?: DslFormat;
    path?: string;
  }
): DslInspectionReport {
  const normalized = normalizeDslWithDetails(input);
  const validation = validateDsl(normalized.spec);
  const allIssues = [...normalized.issues, ...validation.errors, ...validation.warnings];

  return {
    source: {
      format: source?.format,
      path: source?.path,
      hasChineseAliases: normalized.fieldAliasMappings.length > 0
    },
    raw: input,
    normalized: normalized.normalizedInput,
    canonical: normalized.spec,
    mappings: {
      fieldAliases: normalized.fieldAliasMappings,
      canonicalNames: normalized.nameCanonicalizations
    },
    issues: bySeverity(allIssues, "error"),
    warnings: bySeverity(allIssues, "warning")
  };
}

export function inspectCanonicalization(
  input: unknown,
  source?: {
    format?: DslFormat;
    path?: string;
  }
): DslInspectionReport {
  return inspectDsl(input, source);
}

export function explainDsl(
  input: unknown,
  source?: {
    format?: DslFormat;
    path?: string;
  }
): DslExplainResult {
  const report = inspectDsl(input, source);
  return {
    raw: report.raw,
    normalizedInput: report.normalized,
    fieldAliasMappings: report.mappings.fieldAliases,
    nameCanonicalizations: report.mappings.canonicalNames,
    canonicalIR: report.canonical,
    issues: [...report.issues, ...report.warnings]
  };
}

export function getCanonicalizationReport(
  input: unknown,
  source?: {
    format?: DslFormat;
    path?: string;
  }
): DslInspectionReport {
  return inspectDsl(input, source);
}

export function formatExplainOutput(report: DslInspectionReport): string[] {
  const lines: string[] = [];
  lines.push("=== Source ===");
  lines.push(`path: ${report.source.path ?? "-"}`);
  lines.push(`format: ${report.source.format ?? "-"}`);
  lines.push(`chinese_alias_detected: ${report.source.hasChineseAliases ? "yes" : "no"}`);
  lines.push("");

  lines.push("=== Structural Normalize ===");
  if (report.mappings.fieldAliases.length === 0) {
    lines.push("- none");
  } else {
    for (const mapping of report.mappings.fieldAliases) {
      const path = mapping.path && mapping.path.length > 0 ? ` path=${mapping.path.join(".")}` : "";
      lines.push(`- ${mapping.from} -> ${mapping.to} [${mapping.provenance}]${path}`);
    }
  }
  lines.push("");

  lines.push("=== Canonicalization ===");
  if (report.mappings.canonicalNames.length === 0) {
    lines.push("- none");
  } else {
    for (const mapping of report.mappings.canonicalNames) {
      const path = mapping.path && mapping.path.length > 0 ? ` path=${mapping.path.join(".")}` : "";
      lines.push(`- (${mapping.kind}) ${mapping.from} -> ${mapping.to} [${mapping.strategy}]${path}`);
    }
  }
  lines.push("");

  lines.push("=== Canonical IR Summary ===");
  lines.push(`agent: ${report.canonical.agent}`);
  lines.push(`initial_state: ${report.canonical.initial_state}`);
  lines.push(`states: ${Object.keys(report.canonical.states).join(", ") || "-"}`);
  lines.push(`actions: ${report.canonical.actions?.map((action) => action.name).join(", ") || "-"}`);
  lines.push(`guards: ${report.canonical.guards?.map((guard) => guard.name).join(", ") || "-"}`);
  lines.push(`intents: ${report.canonical.intents?.map((intent) => intent.name).join(", ") || "-"}`);
  lines.push(`context_fields: ${Object.keys(report.canonical.context?.fields ?? {}).join(", ") || "-"}`);
  lines.push("");

  lines.push("=== Issues / Warnings ===");
  if (report.issues.length === 0 && report.warnings.length === 0) {
    lines.push("- none");
  } else {
    for (const issue of report.issues) {
      const path = issue.path && issue.path.length > 0 ? ` path=${issue.path.join(".")}` : "";
      lines.push(`- [error] ${issue.code}: ${issue.message}${path}`);
    }
    for (const warning of report.warnings) {
      const path = warning.path && warning.path.length > 0 ? ` path=${warning.path.join(".")}` : "";
      lines.push(`- [warning] ${warning.code}: ${warning.message}${path}`);
    }
  }

  return lines;
}

