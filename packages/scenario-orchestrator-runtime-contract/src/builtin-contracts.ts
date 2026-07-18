import { normalizeRuntimeAdapterCapabilities } from "./capability";
import type { ScenarioRuntimeAdapterDescriptor } from "./types";

export const YUTRA_RUNTIME_ADAPTER_CONTRACT_V1: ScenarioRuntimeAdapterDescriptor =
  {
    schemaVersion: "1.0.0-preview",
    adapterId: "yutra-runtime-adapter-contract-v1",
    adapterVersion: "0.1.0-contract",
    protocolVersion: "1.0.0-preview",
    implementationStatus: "contract_only",
    supportedOrchestratorSchemaVersions: ["1.0.0-preview"],
    supportedExecutionModels: ["single_active_slot_call_return"],
    supportedAgentDslVersions: ["1.0.0"],
    capabilities: normalizeRuntimeAdapterCapabilities(undefined),
    limits: {
      maxInvocationInputBytes: 262144,
      maxInvocationOutputBytes: 262144,
      maxTimeoutMs: 120000,
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
