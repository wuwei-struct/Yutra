import { scenarioRunEvidenceBundleSchema } from "./evidence-schema";
import type {
  ScenarioEvidenceReplayResult,
  ScenarioRunEvidenceBundle
} from "./types";
import { validateScenarioEvidenceBundle } from "./validate-evidence-bundle";

function emptyReplay(
  blockers: ScenarioEvidenceReplayResult["blockers"]
): ScenarioEvidenceReplayResult {
  return {
    valid: false,
    integrityStatus: "invalid",
    runtimeExecuted: false,
    replayMode: "offline_evidence",
    timeline: [],
    slotTree: [],
    projectionSummary: [],
    routeSummary: [],
    bindingSummary: [],
    overlaySummary: [],
    blockers: structuredClone(blockers)
  };
}

function slotTree(bundle: ScenarioRunEvidenceBundle) {
  const slots = new Map<string, ScenarioRunEvidenceBundle["slotInvocations"]>();
  for (const invocation of bundle.slotInvocations) {
    const group = slots.get(invocation.slotId) ?? [];
    group.push(structuredClone(invocation));
    slots.set(invocation.slotId, group);
  }
  return [...slots].map(([slotId, invocations]) => ({ slotId, invocations }));
}

export function replayScenarioEvidence(input: unknown): ScenarioEvidenceReplayResult {
  const integrity = validateScenarioEvidenceBundle(input);
  if (!integrity.valid) return emptyReplay(integrity.blockers);
  const bundle = scenarioRunEvidenceBundleSchema.parse(input);
  return {
    valid: true,
    integrityStatus: "valid",
    runtimeExecuted: false,
    replayMode: "offline_evidence",
    timeline: structuredClone(bundle.timeline),
    slotTree: slotTree(bundle),
    projectionSummary: structuredClone(bundle.decisions.projections),
    routeSummary: structuredClone(bundle.decisions.routes),
    bindingSummary: structuredClone(bundle.decisions.bindings),
    overlaySummary: structuredClone(bundle.decisions.overlays),
    terminalSummary: structuredClone(bundle.run),
    budgetUsage: structuredClone(bundle.budgetUsage),
    auditSummary: structuredClone(bundle.auditSummary),
    blockers: []
  };
}
