import type { ScenarioOrchestratorBinding } from "@yutra/scenario-orchestrator-core";
import { DEMO_ORCHESTRATOR_ENGINE_ERROR_CODES, DemoOrchestratorEngineError } from "./errors";
import { ScenarioContextStore } from "./scenario-context-store";

function readPath(value: unknown, path: string): unknown {
  let cursor = value;
  for (const segment of path.split(".")) {
    if (!cursor || typeof cursor !== "object" || Array.isArray(cursor) || !Object.prototype.hasOwnProperty.call(cursor, segment)) return undefined;
    cursor = (cursor as Record<string, unknown>)[segment];
  }
  return structuredClone(cursor);
}

export function applyIdentityBindings(input: {
  bindings: readonly ScenarioOrchestratorBinding[];
  fromSlotId: string;
  toSlotId: string;
  slotOutput: unknown;
  context: ScenarioContextStore;
  consume(): void;
  onApplied(bindingId: string): void;
}): void {
  const applicable = input.bindings.filter((binding) => binding.fromSlotId === input.fromSlotId && binding.toSlotId === input.toSlotId);
  for (const binding of applicable) {
    input.consume();
    if (binding.transform !== "identity") throw new DemoOrchestratorEngineError(DEMO_ORCHESTRATOR_ENGINE_ERROR_CODES.BINDING_TARGET_INVALID, "Only identity Binding is supported.");
    const value = readPath(input.slotOutput, binding.fromPath);
    if (value === undefined && binding.required) throw new DemoOrchestratorEngineError(DEMO_ORCHESTRATOR_ENGINE_ERROR_CODES.BINDING_SOURCE_MISSING, `Required Binding ${binding.bindingId} has no source value.`);
    if (value !== undefined) {
      input.context.writePath(`slots.${binding.toSlotId}.input`, binding.toPath, value);
      input.onApplied(binding.bindingId);
    }
  }
}
