import { agentSpecSchema, type AgentSpec } from "@yutra/spec";
import { BUILDER_ISSUE_CODES, type BuilderIssue, type BuilderValidationResult } from "./types";

function pushIssue(
  issues: BuilderIssue[],
  code: BuilderIssue["code"],
  message: string,
  severity: BuilderIssue["severity"],
  path?: string[]
): void {
  issues.push({ code, message, severity, path });
}

export function validateGeneratedSpec(spec: AgentSpec): BuilderValidationResult {
  const issues: BuilderIssue[] = [];
  const schemaResult = agentSpecSchema.safeParse(spec);

  if (!schemaResult.success) {
    for (const item of schemaResult.error.issues) {
      pushIssue(
        issues,
        BUILDER_ISSUE_CODES.SPEC_INVALID,
        item.message,
        "error",
        item.path.map((part) => String(part))
      );
    }
    return { ok: false, issues };
  }

  if (!Object.prototype.hasOwnProperty.call(spec.states, spec.initial_state)) {
    pushIssue(
      issues,
      BUILDER_ISSUE_CODES.SPEC_INVALID,
      `initial_state '${spec.initial_state}' does not exist in states.`,
      "error",
      ["initial_state"]
    );
  }

  const knownActions = new Set((spec.actions ?? []).map((action) => action.name));
  for (const [stateName, state] of Object.entries(spec.states)) {
    for (let index = 0; index < (state.actions ?? []).length; index += 1) {
      const actionName = state.actions?.[index];
      if (actionName && !knownActions.has(actionName)) {
        pushIssue(
          issues,
          BUILDER_ISSUE_CODES.ACTION_REFERENCE_INVALID,
          `Unknown action '${actionName}' referenced by state '${stateName}'.`,
          "error",
          ["states", stateName, "actions", String(index)]
        );
      }
    }

    for (let index = 0; index < (state.transitions ?? []).length; index += 1) {
      const transition = state.transitions?.[index];
      if (!transition) {
        continue;
      }
      if (!Object.prototype.hasOwnProperty.call(spec.states, transition.to)) {
        pushIssue(
          issues,
          BUILDER_ISSUE_CODES.TRANSITION_INVALID,
          `Transition from '${stateName}' references unknown state '${transition.to}'.`,
          "error",
          ["states", stateName, "transitions", String(index), "to"]
        );
      }
    }
  }

  const hasTerminalState = Object.values(spec.states).some((state) => state.final === true || state.handoff === true);
  if (!hasTerminalState) {
    pushIssue(
      issues,
      BUILDER_ISSUE_CODES.SPEC_INVALID,
      "Generated spec should have at least one final or handoff state.",
      "error",
      ["states"]
    );
  }

  return {
    ok: issues.every((item) => item.severity !== "error"),
    issues
  };
}
