import type { AgentSpec } from "@yutra/spec";
import type { DslValidationIssue } from "./errors";
import type { DslValidationResult } from "./types";

function stateExists(spec: AgentSpec, state: string): boolean {
  return Object.prototype.hasOwnProperty.call(spec.states, state);
}

export function validateDsl(spec: AgentSpec): DslValidationResult {
  const errors: DslValidationIssue[] = [];
  const warnings: DslValidationIssue[] = [];

  const stateEntries = Object.entries(spec.states);
  if (stateEntries.length === 0) {
    errors.push({
      code: "DSL_SCHEMA_INVALID",
      message: "states must not be empty.",
      path: ["states"],
      severity: "error"
    });
  }

  if (!stateExists(spec, spec.initial_state)) {
    errors.push({
      code: "DSL_INITIAL_STATE_MISSING",
      message: `initial_state '${spec.initial_state}' does not exist in states.`,
      path: ["initial_state"],
      severity: "error"
    });
  }

  const knownActions = new Set((spec.actions ?? []).map((action) => action.name));
  const knownGuards = new Set((spec.guards ?? []).map((guard) => guard.name));

  for (const [stateName, state] of stateEntries) {
    for (let index = 0; index < (state.actions ?? []).length; index += 1) {
      const actionName = state.actions?.[index];
      if (actionName && !knownActions.has(actionName)) {
        errors.push({
          code: "DSL_UNKNOWN_ACTION",
          message: `Unknown action '${actionName}' referenced by state '${stateName}'.`,
          path: ["states", stateName, "actions", String(index)],
          severity: "error"
        });
      }
    }

    for (let index = 0; index < (state.guards ?? []).length; index += 1) {
      const guardName = state.guards?.[index];
      if (guardName && !knownGuards.has(guardName)) {
        errors.push({
          code: "DSL_UNKNOWN_GUARD",
          message: `Unknown guard '${guardName}' referenced by state '${stateName}'.`,
          path: ["states", stateName, "guards", String(index)],
          severity: "error"
        });
      }
    }

    for (let index = 0; index < (state.transitions ?? []).length; index += 1) {
      const transition = state.transitions?.[index];
      if (!transition) {
        continue;
      }

      if (!stateExists(spec, transition.to)) {
        errors.push({
          code: "DSL_UNKNOWN_STATE",
          message: `Transition from '${stateName}' references unknown state '${transition.to}'.`,
          path: ["states", stateName, "transitions", String(index), "to"],
          severity: "error"
        });
      }

      if (transition.guard && !knownGuards.has(transition.guard)) {
        errors.push({
          code: "DSL_UNKNOWN_GUARD",
          message: `Unknown guard '${transition.guard}' referenced by transition in state '${stateName}'.`,
          path: ["states", stateName, "transitions", String(index), "guard"],
          severity: "error"
        });
      }
    }

    if (state.final === true && state.handoff === true) {
      warnings.push({
        code: "DSL_SCHEMA_INVALID",
        message: `State '${stateName}' is both final and handoff. This is usually contradictory.`,
        path: ["states", stateName],
        severity: "warning"
      });
    }
  }

  if (stateExists(spec, spec.initial_state)) {
    const visited = new Set<string>();
    const queue: string[] = [spec.initial_state];

    while (queue.length > 0) {
      const current = queue.shift();
      if (!current || visited.has(current)) {
        continue;
      }

      visited.add(current);
      const state = spec.states[current];
      for (const transition of state.transitions ?? []) {
        if (!visited.has(transition.to) && stateExists(spec, transition.to)) {
          queue.push(transition.to);
        }
      }
    }

    for (const stateName of Object.keys(spec.states)) {
      if (!visited.has(stateName)) {
        warnings.push({
          code: "DSL_UNREACHABLE_STATE",
          message: `State '${stateName}' is unreachable from initial_state '${spec.initial_state}'.`,
          path: ["states", stateName],
          severity: "warning"
        });
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}
