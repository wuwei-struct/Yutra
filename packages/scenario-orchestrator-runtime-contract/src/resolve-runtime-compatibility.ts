import {
  MANDATORY_RUNTIME_ADAPTER_CAPABILITIES,
  normalizeRuntimeAdapterCapabilities
} from "./capability";
import { isSlotActionClosureComplete } from "./action-closure";
import { validateRuntimeAdapterDescriptor } from "./validate-runtime-adapter";
import type {
  OrchestratorRuntimeCompatibilityReport,
  RuntimeAdapterCapabilityId,
  RuntimeCompatibilityBlocker,
  RuntimeCompatibilityInput,
  RuntimeCompatibilityWarning,
  ScenarioRuntimeAdapterDescriptor
} from "./types";

function uniqueCapabilities(
  values: readonly RuntimeAdapterCapabilityId[]
): RuntimeAdapterCapabilityId[] {
  return [...new Set(values)];
}

export function resolveOrchestratorRuntimeCompatibility(
  input: RuntimeCompatibilityInput
): OrchestratorRuntimeCompatibilityReport {
  const validation = validateRuntimeAdapterDescriptor(
    input.adapterDescriptor
  );
  const fallbackDescriptor: ScenarioRuntimeAdapterDescriptor = {
    schemaVersion: "1.0.0-preview",
    adapterId: "invalid-adapter",
    adapterVersion: "invalid",
    protocolVersion: "1.0.0-preview",
    implementationStatus: "disabled",
    supportedOrchestratorSchemaVersions: [],
    supportedExecutionModels: ["single_active_slot_call_return"],
    supportedAgentDslVersions: [],
    capabilities: normalizeRuntimeAdapterCapabilities(undefined),
    limits: {
      maxInvocationInputBytes: 1,
      maxInvocationOutputBytes: 1,
      maxTimeoutMs: 1,
      maxConcurrentSlotInvocations: 1
    },
    publicExposure: {
      mode: "contract_only",
      containsCustomerData: false,
      containsRealEndpoint: false,
      containsSecret: false,
      containsCustomerSop: false,
      containsCommercialDeliveryAsset: false
    }
  };
  const descriptor = validation.ok ? validation.value : fallbackDescriptor;
  const blockers: RuntimeCompatibilityBlocker[] = [];
  const warnings: RuntimeCompatibilityWarning[] = [];
  if (!validation.ok) {
    blockers.push({
      code: "protocol_unsupported",
      message: "Runtime Adapter Descriptor is invalid."
    });
  }
  if (descriptor.implementationStatus !== "available") {
    blockers.push({
      code: "implementation_unavailable",
      message: `Runtime Adapter ${descriptor.adapterId} is ${descriptor.implementationStatus}.`
    });
  }
  if (descriptor.protocolVersion !== "1.0.0-preview") {
    blockers.push({
      code: "protocol_unsupported",
      message: `Runtime Adapter protocol ${descriptor.protocolVersion} is unsupported.`
    });
  }
  const schemaVersionSupported =
    descriptor.supportedOrchestratorSchemaVersions.includes(
      input.orchestratorDocument.schemaVersion
    );
  if (!schemaVersionSupported) {
    blockers.push({
      code: "orchestrator_schema_unsupported",
      message: `Orchestrator schema ${input.orchestratorDocument.schemaVersion} is unsupported.`
    });
  }
  const executionModelSupported =
    descriptor.supportedExecutionModels.includes(
      input.orchestratorDocument.executionModel
    );
  if (!executionModelSupported) {
    blockers.push({
      code: "execution_model_unsupported",
      message: `Execution model ${input.orchestratorDocument.executionModel} is unsupported.`
    });
  }

  let allAgentDslVersionsSupported = true;
  let allActionClosuresComplete = true;
  for (const slot of input.orchestratorDocument.slots) {
    const dslVersion = input.agentDslVersionsBySlot[slot.slotId];
    if (
      !dslVersion ||
      !descriptor.supportedAgentDslVersions.includes(dslVersion)
    ) {
      allAgentDslVersionsSupported = false;
      blockers.push({
        code: dslVersion
          ? "agent_dsl_version_unsupported"
          : "slot_contract_missing",
        message: dslVersion
          ? `Slot ${slot.slotId} Agent DSL version ${dslVersion} is unsupported.`
          : `Slot ${slot.slotId} has no Agent DSL version binding.`,
        slotId: slot.slotId
      });
    }
    const closure = input.actionClosureBySlot[slot.slotId];
    if (!closure) {
      allActionClosuresComplete = false;
      blockers.push({
        code: "slot_contract_missing",
        message: `Slot ${slot.slotId} has no Action Closure report.`,
        slotId: slot.slotId
      });
    } else if (
      closure.slotId !== slot.slotId ||
      closure.artifactHash !== slot.artifactRef.agentArtifactHash
    ) {
      allActionClosuresComplete = false;
      blockers.push({
        code: "artifact_hash_mismatch",
        message: `Slot ${slot.slotId} Action Closure is not bound to its Agent artifact hash.`,
        slotId: slot.slotId
      });
    } else if (!isSlotActionClosureComplete(closure)) {
      allActionClosuresComplete = false;
      blockers.push({
        code: "action_closure_incomplete",
        message: `Slot ${slot.slotId} has unresolved Action IDs.`,
        slotId: slot.slotId
      });
    }
  }

  const requiredCapabilities = uniqueCapabilities([
    ...MANDATORY_RUNTIME_ADAPTER_CAPABILITIES,
    ...(input.requiredCapabilities ?? [])
  ]);
  let allMandatoryCapabilitiesSupported = true;
  for (const capabilityId of requiredCapabilities) {
    if (!descriptor.capabilities[capabilityId]) {
      allMandatoryCapabilitiesSupported = false;
      blockers.push({
        code: "mandatory_capability_missing",
        message: `Mandatory Runtime Adapter capability ${capabilityId} is unavailable.`,
        capabilityId
      });
    }
  }
  for (const capabilityId of ["cancellation", "snapshot_resume"] as const) {
    if (
      !requiredCapabilities.includes(capabilityId) &&
      !descriptor.capabilities[capabilityId]
    ) {
      warnings.push({
        code: "optional_capability_unavailable",
        message: `Optional capability ${capabilityId} is unavailable.`,
        capabilityId
      });
    }
  }

  const compatible = blockers.length === 0;
  return {
    compatible,
    status: compatible ? "compatible" : "incompatible",
    orchestratorId: input.orchestratorDocument.orchestratorId,
    adapterId: descriptor.adapterId,
    adapterVersion: descriptor.adapterVersion,
    schemaVersionSupported,
    executionModelSupported,
    allAgentDslVersionsSupported,
    allMandatoryCapabilitiesSupported,
    allActionClosuresComplete,
    blockers,
    warnings,
    currentRuntimeSupported: compatible
  };
}
