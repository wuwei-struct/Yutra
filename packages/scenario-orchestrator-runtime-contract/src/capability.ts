import type { RuntimeAdapterCapabilityId } from "./types";

export const RUNTIME_ADAPTER_CAPABILITY_IDS = [
  "slot_execution",
  "agent_artifact_hash_verification",
  "action_closure_preflight",
  "idempotent_invocation",
  "timeout_enforcement",
  "cancellation",
  "trace_parent_binding",
  "audit_reference",
  "side_effect_reporting",
  "context_redaction",
  "snapshot_resume"
] as const satisfies readonly RuntimeAdapterCapabilityId[];

export const MANDATORY_RUNTIME_ADAPTER_CAPABILITIES = [
  "slot_execution",
  "agent_artifact_hash_verification",
  "action_closure_preflight",
  "idempotent_invocation",
  "timeout_enforcement",
  "trace_parent_binding",
  "audit_reference",
  "side_effect_reporting",
  "context_redaction"
] as const satisfies readonly RuntimeAdapterCapabilityId[];

export function normalizeRuntimeAdapterCapabilities(
  capabilities: Partial<Record<RuntimeAdapterCapabilityId, boolean>> | undefined
): Record<RuntimeAdapterCapabilityId, boolean> {
  return Object.fromEntries(
    RUNTIME_ADAPTER_CAPABILITY_IDS.map((capabilityId) => [
      capabilityId,
      capabilities?.[capabilityId] === true
    ])
  ) as Record<RuntimeAdapterCapabilityId, boolean>;
}
