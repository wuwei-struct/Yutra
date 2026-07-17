import type { ScenarioContextPolicy } from "./types";

export const DEFAULT_SCENARIO_CONTEXT_POLICY: ScenarioContextPolicy = {
  rootNamespace: "scenario",
  sharedNamespace: "scenario.shared",
  inputNamespace: "scenario.input",
  outputNamespace: "scenario.output",
  slotNamespacePattern: "slots.<slotId>",
  writePolicy: {
    scenarioInput: "read_only_after_start",
    scenarioShared: "explicit_binding_only",
    scenarioOutput: "primary_only",
    slotContext: "own_slot_only"
  },
  implicitMergeAllowed: false,
  implicitCrossSlotReadAllowed: false,
  implicitCrossSlotWriteAllowed: false,
  secretPropagationAllowed: false,
  adapterInheritanceAllowed: false
};

export function expectedSlotNamespaces(slotId: string) {
  return {
    inputNamespace: `slots.${slotId}.input`,
    stateNamespace: `slots.${slotId}.state`,
    outputNamespace: `slots.${slotId}.output`
  };
}
