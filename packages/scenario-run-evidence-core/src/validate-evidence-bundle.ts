import { scenarioRunEvidenceBundleSchema } from "./evidence-schema";
import { createScenarioEvidenceHash } from "./evidence-hash";
import { SCENARIO_EVIDENCE_ERROR_CODES } from "./errors";
import type {
  ScenarioEvidenceBlocker,
  ScenarioEvidenceIntegrityReport,
  ScenarioRunEvidenceBundle
} from "./types";

const TERMINAL_EVENTS = {
  completed: "orchestrator.completed",
  handoff_required: "orchestrator.handoff.requested",
  failed: "orchestrator.failed"
} as const;

function blocker(code: string, message: string): ScenarioEvidenceBlocker {
  return { code, message };
}

function validateReferences(bundle: ScenarioRunEvidenceBundle): ScenarioEvidenceBlocker[] {
  const blockers: ScenarioEvidenceBlocker[] = [];
  const byInvocation = new Map(
    bundle.slotInvocations.map((invocation) => [invocation.invocationIndex, invocation])
  );
  if (
    bundle.slotInvocations.some(
      (invocation, index) => invocation.invocationIndex !== index + 1
    ) ||
    new Set(bundle.slotInvocations.map((item) => item.invocationId)).size !==
      bundle.slotInvocations.length
  ) {
    blockers.push(
      blocker(
        SCENARIO_EVIDENCE_ERROR_CODES.REFERENCE_INVALID,
        "Slot invocation references must be unique and contiguous."
      )
    );
  }
  if (bundle.budgetUsage.slotInvocations !== bundle.slotInvocations.length) {
    blockers.push(
      blocker(
        SCENARIO_EVIDENCE_ERROR_CODES.REFERENCE_INVALID,
        "Budget slot invocation count does not match evidence references."
      )
    );
  }
  for (const projection of bundle.decisions.projections) {
    const invocation = byInvocation.get(projection.invocationIndex);
    if (
      !invocation ||
      invocation.slotId !== projection.slotId ||
      invocation.semanticOutcome !== projection.semanticOutcome ||
      invocation.projectionId !== projection.projectionId
    ) {
      blockers.push(
        blocker(
          SCENARIO_EVIDENCE_ERROR_CODES.REFERENCE_INVALID,
          `Projection ${projection.projectionId} does not resolve to its Slot invocation.`
        )
      );
    }
  }
  for (const item of bundle.timeline.filter(
    (candidate) => candidate.source === "projection_evidence"
  )) {
    const invocation = item.invocationIndex
      ? byInvocation.get(item.invocationIndex)
      : undefined;
    if (
      !invocation ||
      invocation.slotId !== item.slotId ||
      invocation.semanticOutcome !== item.semanticOutcome ||
      invocation.projectionId !== item.projectionId
    ) {
      blockers.push(
        blocker(
          SCENARIO_EVIDENCE_ERROR_CODES.REFERENCE_INVALID,
          `Timeline projection at index ${item.index} has an invalid invocation reference.`
        )
      );
    }
  }
  return blockers;
}

function validateTimeline(bundle: ScenarioRunEvidenceBundle): ScenarioEvidenceBlocker[] {
  const blockers: ScenarioEvidenceBlocker[] = [];
  if (bundle.timeline.some((item, index) => item.index !== index + 1)) {
    blockers.push(
      blocker(
        SCENARIO_EVIDENCE_ERROR_CODES.TIMELINE_INVALID,
        "Evidence timeline indexes must be contiguous."
      )
    );
  }
  const traceEvents = bundle.timeline.filter(
    (item) => item.source === "orchestrator_trace"
  );
  if (
    traceEvents.some(
      (item, index) => item.sequence !== index + 1
    )
  ) {
    blockers.push(
      blocker(
        SCENARIO_EVIDENCE_ERROR_CODES.TIMELINE_INVALID,
        "Orchestrator trace sequence must be contiguous."
      )
    );
  }
  const finalEvent = traceEvents.at(-1);
  const expectedType = TERMINAL_EVENTS[bundle.run.status];
  if (
    !finalEvent ||
    finalEvent.type !== expectedType ||
    finalEvent.terminalId !== bundle.run.terminalId ||
    bundle.run.scenarioCompleted !== (bundle.run.status === "completed") ||
    (bundle.run.status === "completed" && bundle.run.terminalId !== "$scenario_done") ||
    (bundle.run.status === "handoff_required" &&
      bundle.run.terminalId !== "$human_handoff") ||
    (bundle.run.status === "failed" && bundle.run.terminalId !== "$fail_closed")
  ) {
    blockers.push(
      blocker(
        SCENARIO_EVIDENCE_ERROR_CODES.TERMINAL_MISMATCH,
        "Scenario terminal does not match the final orchestrator event."
      )
    );
  }
  return blockers;
}

export function validateScenarioEvidenceBundle(
  input: unknown
): ScenarioEvidenceIntegrityReport {
  const parsed = scenarioRunEvidenceBundleSchema.safeParse(input);
  if (!parsed.success) {
    return {
      valid: false,
      integrityStatus: "invalid",
      blockers: [
        blocker(
          SCENARIO_EVIDENCE_ERROR_CODES.SCHEMA_INVALID,
          "Scenario evidence does not match the strict bundle schema."
        )
      ]
    };
  }
  const bundle = parsed.data;
  const expectedHash = createScenarioEvidenceHash(bundle);
  const blockers: ScenarioEvidenceBlocker[] = [];
  if (expectedHash !== bundle.evidenceHash) {
    blockers.push(
      blocker(
        SCENARIO_EVIDENCE_ERROR_CODES.HASH_INVALID,
        "Scenario evidence hash does not match its canonical contents."
      )
    );
  }
  blockers.push(...validateTimeline(bundle), ...validateReferences(bundle));
  return {
    valid: blockers.length === 0,
    integrityStatus: blockers.length === 0 ? "valid" : "invalid",
    expectedHash,
    actualHash: bundle.evidenceHash,
    blockers
  };
}
