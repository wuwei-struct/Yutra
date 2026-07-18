import type { ScenarioRuntimeAdapterDescriptor } from "@yutra/scenario-orchestrator-runtime-contract";

const descriptor = {
    schemaVersion: "1.0.0-preview",
    adapterId: "yutra.in-memory-demo-runtime-adapter",
    adapterVersion: "0.3.0-vnext-preview.1",
    protocolVersion: "1.0.0-preview",
    implementationStatus: "available",
    supportedOrchestratorSchemaVersions: ["1.0.0-preview"],
    supportedExecutionModels: ["single_active_slot_call_return"],
    supportedAgentDslVersions: ["0.1.0"],
    capabilities: {
      slot_execution: true,
      agent_artifact_hash_verification: true,
      action_closure_preflight: true,
      idempotent_invocation: true,
      timeout_enforcement: true,
      cancellation: false,
      trace_parent_binding: true,
      audit_reference: true,
      side_effect_reporting: true,
      context_redaction: true,
      snapshot_resume: false
    },
    limits: {
      maxInvocationInputBytes: 64 * 1024,
      maxInvocationOutputBytes: 64 * 1024,
      maxTimeoutMs: 10_000,
      maxConcurrentSlotInvocations: 1
    },
    publicExposure: {
      mode: "demo_only",
      containsCustomerData: false,
      containsRealEndpoint: false,
      containsSecret: false,
      containsCustomerSop: false,
      containsCommercialDeliveryAsset: false
    }
  } satisfies ScenarioRuntimeAdapterDescriptor;

export const YUTRA_IN_MEMORY_DEMO_RUNTIME_ADAPTER_V1: ScenarioRuntimeAdapterDescriptor =
  Object.freeze(descriptor);
