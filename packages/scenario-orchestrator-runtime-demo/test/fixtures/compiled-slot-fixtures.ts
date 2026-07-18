import { normalizeDsl, parseDsl } from "@yutra/dsl";
import {
  CUSTOMER_COMPLAINT_COMPOSITION_DEMO,
  ECOMMERCE_REFUND_COMPOSITION_DEMO,
  type ScenarioCompositionPlan
} from "@yutra/scenario-composition-core";
import {
  compileScenarioOrchestratorPreview,
  type ScenarioOrchestratorCompileResult
} from "@yutra/scenario-orchestrator-compiler";
import {
  createCanonicalInputHash,
  createSlotInvocationIdempotencyKey,
  type ScenarioSlotInvocationRequest,
  type SlotActionClosureReport
} from "@yutra/scenario-orchestrator-runtime-contract";
import {
  InMemorySlotArtifactStore,
  inspectSlotActionClosure
} from "../../src/index";
import { EXPLICIT_DEMO_ACTION_REGISTRY } from "./explicit-demo-action-registry";

export function compileFixture(
  plan: ScenarioCompositionPlan
): ScenarioOrchestratorCompileResult {
  const output = compileScenarioOrchestratorPreview({
    compositionPlan: structuredClone(plan)
  });
  if (!output.ok) {
    throw new Error(output.issues.map((issue) => issue.code).join(","));
  }
  return output.result;
}

export function customerComplaintFixture(): ScenarioOrchestratorCompileResult {
  return compileFixture(CUSTOMER_COMPLAINT_COMPOSITION_DEMO);
}

export function ecommerceRefundFixture(): ScenarioOrchestratorCompileResult {
  return compileFixture(ECOMMERCE_REFUND_COMPOSITION_DEMO);
}

export function registerCompiledSlots(
  result: ScenarioOrchestratorCompileResult
): InMemorySlotArtifactStore {
  const store = new InMemorySlotArtifactStore();
  for (const slot of result.compositionResult.slots) {
    const content = slot.artifacts["agent.yutra.yaml"];
    const spec = normalizeDsl(parseDsl(content, "yaml"));
    store.register({
      artifactPath: `slots/${slot.slotId}/agent.yutra.yaml`,
      artifactContent: content,
      artifactHash: slot.artifactHashes["agent.yutra.yaml"],
      configHash: slot.configHash,
      archetypeId: slot.archetypeId,
      agentDslVersion: spec.version
    });
  }
  return store;
}

export function actionClosures(
  result: ScenarioOrchestratorCompileResult
): Record<string, SlotActionClosureReport> {
  return Object.fromEntries(
    result.compositionResult.slots.map((slot) => [
      slot.slotId,
      inspectSlotActionClosure({
        slotId: slot.slotId,
        agentDsl: slot.artifacts["agent.yutra.yaml"],
        artifactHash: slot.artifactHashes["agent.yutra.yaml"],
        actionRegistry: EXPLICIT_DEMO_ACTION_REGISTRY
      })
    ])
  );
}

export function agentDslVersions(
  result: ScenarioOrchestratorCompileResult
): Record<string, string> {
  return Object.fromEntries(
    result.compositionResult.slots.map((slot) => {
      const spec = normalizeDsl(
        parseDsl(slot.artifacts["agent.yutra.yaml"], "yaml")
      );
      return [slot.slotId, spec.version];
    })
  );
}

export function invocationRequest(input: {
  result: ScenarioOrchestratorCompileResult;
  slotId: string;
  invocationIndex?: number;
  value?: Record<string, unknown>;
  timeoutMs?: number;
  maximumAllowedLevel?: ScenarioSlotInvocationRequest["sideEffectPolicy"]["maximumAllowedLevel"];
}): ScenarioSlotInvocationRequest {
  const slot = input.result.compositionResult.slots.find(
    (candidate) => candidate.slotId === input.slotId
  );
  if (!slot) throw new Error(`Unknown fixture Slot ${input.slotId}.`);
  const value =
    input.value ??
    (slot.archetypeId === "approval-decision"
      ? {
          high_risk: false,
          low_risk: true,
          policy_conflict: false,
          decision_reason_required: false,
          missing_evidence: false,
          evidence_valid: true,
          requires_human_review: false
        }
      : {});
  const invocationIndex = input.invocationIndex ?? 1;
  const idempotencyKey = createSlotInvocationIdempotencyKey({
    orchestratorRunId: `demo-orchestrator-run-${input.result.compositionId}`,
    invocationIndex,
    slotId: slot.slotId,
    agentArtifactHash: slot.artifactHashes["agent.yutra.yaml"],
    canonicalInputHash: createCanonicalInputHash(value)
  });
  return {
    schemaVersion: "1.0.0-preview",
    orchestratorRunId: `demo-orchestrator-run-${input.result.compositionId}`,
    invocationId: `${input.result.compositionId}-${slot.slotId}-${invocationIndex}`,
    invocationIndex,
    idempotencyKey,
    orchestratorId: input.result.orchestratorId,
    compositionId: input.result.compositionId,
    slotId: slot.slotId,
    archetypeId: slot.archetypeId,
    artifactRef: {
      agentArtifactPath: `slots/${slot.slotId}/agent.yutra.yaml`,
      agentArtifactHash: slot.artifactHashes["agent.yutra.yaml"],
      configHash: slot.configHash
    },
    traceParent: {
      orchestratorRunId: `demo-orchestrator-run-${input.result.compositionId}`,
      parentSequence: invocationIndex - 1,
      parentSpanId: `demo-parent-span-${invocationIndex}`
    },
    input: {
      namespace: `slots.${slot.slotId}.input`,
      value,
      byteLength: 0,
      redactionApplied: true
    },
    budget: {
      timeoutMs: input.timeoutMs ?? 2_000,
      maxRuntimeSteps: 25
    },
    sideEffectPolicy: {
      maximumAllowedLevel: input.maximumAllowedLevel ?? "read",
      requireExplicitDeclaration: true
    },
    retryPolicy: {
      orchestratorRetryAllowed: false,
      invocationAttempt: 1
    }
  };
}
