import type { ScenarioOrchestratorCompileResult } from "@yutra/scenario-orchestrator-compiler";
import {
  InMemorySlotArtifactStore,
  parseAndValidateSlotAgentDsl
} from "@yutra/scenario-orchestrator-runtime-demo";
import { DEMO_ORCHESTRATOR_ENGINE_ERROR_CODES, DemoOrchestratorEngineError } from "./errors";

export function hydrateSlotArtifactsFromCompileResult(
  result: ScenarioOrchestratorCompileResult,
  store: InMemorySlotArtifactStore
): InMemorySlotArtifactStore {
  for (const documentSlot of result.orchestratorDocument.slots) {
    const compiledSlot = result.compositionResult.slots.find(
      (slot) => slot.slotId === documentSlot.slotId
    );
    const content = compiledSlot?.artifacts["agent.yutra.yaml"];
    const artifactHash = compiledSlot?.artifactHashes["agent.yutra.yaml"];
    if (
      !compiledSlot ||
      !content ||
      !artifactHash ||
      documentSlot.artifactRef.agentArtifactPath !== `slots/${documentSlot.slotId}/agent.yutra.yaml` ||
      documentSlot.artifactRef.agentArtifactHash !== artifactHash ||
      documentSlot.artifactRef.configHash !== compiledSlot.configHash
    ) {
      throw new DemoOrchestratorEngineError(
        DEMO_ORCHESTRATOR_ENGINE_ERROR_CODES.SLOT_ARTIFACT_MISSING,
        `Slot ${documentSlot.slotId} has no closed Agent artifact binding.`
      );
    }
    const spec = parseAndValidateSlotAgentDsl(content);
    store.register({
      artifactPath: documentSlot.artifactRef.agentArtifactPath,
      artifactContent: content,
      artifactHash,
      configHash: compiledSlot.configHash,
      archetypeId: compiledSlot.archetypeId,
      agentDslVersion: spec.version
    });
  }
  return store;
}
