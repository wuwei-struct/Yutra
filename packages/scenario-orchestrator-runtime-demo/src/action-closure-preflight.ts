import { normalizeDsl, parseDsl, validateDsl } from "@yutra/dsl";
import type { ActionRegistry } from "@yutra/runtime";
import {
  createSlotActionClosureReport,
  type SlotActionClosureReport
} from "@yutra/scenario-orchestrator-runtime-contract";
import {
  DEMO_RUNTIME_ERROR_CODES,
  DemoRuntimeAdapterError
} from "./errors";

export function parseAndValidateSlotAgentDsl(agentDsl: string) {
  try {
    const spec = normalizeDsl(parseDsl(agentDsl, "yaml"));
    const validation = validateDsl(spec);
    if (!validation.valid) {
      throw new Error("validation failed");
    }
    return spec;
  } catch {
    throw new DemoRuntimeAdapterError(
      DEMO_RUNTIME_ERROR_CODES.DSL_INVALID,
      "Slot Agent DSL is invalid."
    );
  }
}

export function inspectSlotActionClosure(input: {
  slotId: string;
  agentDsl: string;
  artifactHash: string;
  actionRegistry: ActionRegistry;
}): SlotActionClosureReport {
  const spec = parseAndValidateSlotAgentDsl(input.agentDsl);
  const referencedActionIds = [
    ...new Set(
      Object.values(spec.states).flatMap((state) => state.actions ?? [])
    )
  ].sort();
  const resolvableActionIds = referencedActionIds.filter(
    (actionId) => typeof input.actionRegistry[actionId] === "function"
  );
  return createSlotActionClosureReport({
    slotId: input.slotId,
    artifactHash: input.artifactHash,
    referencedActionIds,
    resolvableActionIds
  });
}
