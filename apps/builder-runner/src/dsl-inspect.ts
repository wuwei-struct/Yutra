import type { AgentSpec } from "@yutra/spec";
import { DslError, formatExplainOutput, inspectDsl, parseDsl } from "@yutra/dsl";
import type {
  BuilderDslInspectRequest,
  BuilderDslInspectResponse,
  BuilderDslInspectSummary,
  BuilderRunnerIssue,
  BuilderRunnerValidationResult
} from "./types";
import { sanitizeErrorMessage } from "./response-formatters";

export function summarizeAgentSpec(spec: AgentSpec): BuilderDslInspectSummary {
  const states = Object.values(spec.states);
  return {
    agent: spec.agent,
    states: states.length,
    actions: spec.actions?.length ?? 0,
    intents: spec.intents?.length ?? 0,
    transitions: states.reduce((count, state) => count + (state.transitions?.length ?? 0), 0),
    handoffStates: states.filter((state) => state.handoff).length,
    skillActions: (spec.actions ?? []).filter((action) => action.implementation?.type === "skill").length
  };
}

export function dslIssuesToValidation(issues: BuilderRunnerIssue[], warnings: BuilderRunnerIssue[] = []): BuilderRunnerValidationResult {
  return {
    ok: issues.length === 0,
    issues: [...issues, ...warnings]
  };
}

function normalizeIssue(issue: {
  code: string;
  message: string;
  path?: string[];
  severity?: "error" | "warning";
  hint?: string;
}): BuilderRunnerIssue {
  return {
    code: issue.code,
    message: issue.message,
    path: issue.path,
    severity: issue.severity ?? "error",
    hint: issue.hint
  };
}

export function inspectDslText(request: BuilderDslInspectRequest): BuilderDslInspectResponse {
  const format = request.format ?? "yaml";
  try {
    const raw = parseDsl(request.dslText, format);
    const report = inspectDsl(raw, { format });
    const issues = report.issues.map(normalizeIssue);
    const warnings = report.warnings.map(normalizeIssue);
    const validation = dslIssuesToValidation(issues, warnings);

    return {
      ok: true,
      format,
      raw: report.raw,
      normalized: report.normalized,
      canonical: report.canonical,
      validation,
      explain: formatExplainOutput(report).join("\n"),
      summary: summarizeAgentSpec(report.canonical),
      mappings: {
        fieldAliases: report.mappings.fieldAliases,
        canonicalNames: report.mappings.canonicalNames
      },
      warnings
    };
  } catch (error) {
    const issue =
      error instanceof DslError
        ? normalizeIssue(error.issue)
        : {
            code: "DSL_INSPECT_FAILED",
            message: sanitizeErrorMessage(error instanceof Error ? error.message : "DSL inspect failed."),
            severity: "error" as const
          };

    return {
      ok: false,
      format,
      error: {
        code: issue.code,
        message: issue.message
      },
      validation: {
        ok: false,
        issues: [issue]
      }
    };
  }
}

