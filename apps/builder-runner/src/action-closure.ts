import type { ActionRegistry } from "@yutra/runtime";
import type { AgentSpec } from "@yutra/spec";

export interface CompiledActionClosureResult {
  actionIds: string[];
  unresolvedActionIds: string[];
}

export function getCompiledActionClosure(
  compiledDsl: AgentSpec,
  actionRegistry: ActionRegistry
): CompiledActionClosureResult {
  const actionIds = [
    ...new Set(Object.values(compiledDsl.states).flatMap((state) => state.actions ?? []))
  ].sort();
  const unresolvedActionIds = actionIds.filter((actionId) => !actionRegistry[actionId]);
  return { actionIds, unresolvedActionIds };
}

export function assertCompiledActionsResolvable({
  compiledDsl,
  actionRegistry
}: {
  compiledDsl: AgentSpec;
  actionRegistry: ActionRegistry;
}): CompiledActionClosureResult {
  const result = getCompiledActionClosure(compiledDsl, actionRegistry);
  if (result.unresolvedActionIds.length > 0) {
    throw new Error(`Unresolved compiled Action IDs: ${result.unresolvedActionIds.join(", ")}`);
  }
  return result;
}
