import { describe, expect, it } from "vitest";
import {
  createScenarioEvidenceHash,
  createScenarioRunEvidenceBundle,
  replayScenarioEvidence,
  validateScenarioEvidenceBundle,
  type ScenarioEvidenceRunStatus,
  type ScenarioEvidenceTerminalId,
  type ScenarioRunEvidenceDraft
} from "../src";

const HASH = `sha256:${"a".repeat(64)}`;

function draft(
  status: ScenarioEvidenceRunStatus = "completed"
): ScenarioRunEvidenceDraft {
  const terminalByStatus: Record<ScenarioEvidenceRunStatus, ScenarioEvidenceTerminalId> = {
    completed: "$scenario_done",
    handoff_required: "$human_handoff",
    failed: "$fail_closed"
  };
  const eventByStatus: Record<ScenarioEvidenceRunStatus, string> = {
    completed: "orchestrator.completed",
    handoff_required: "orchestrator.handoff.requested",
    failed: "orchestrator.failed"
  };
  const hasSlot = status !== "failed";
  return {
    schemaVersion: "1.0.0-preview",
    evidenceId: `scenario-evidence:run-${status}`,
    run: {
      orchestratorRunId: `run-${status}`,
      orchestratorId: "demo-orchestrator",
      compositionId: "demo-composition",
      demoCase: `case-${status}`,
      status,
      terminalId: terminalByStatus[status],
      scenarioCompleted: status === "completed"
    },
    sources: {
      planHash: HASH,
      compositionBundleHash: HASH,
      orchestratorHash: HASH,
      previewBundleHash: HASH
    },
    slotInvocations: hasSlot
      ? [
          {
            invocationIndex: 1,
            invocationId: "invocation-1",
            slotId: "primary_slot",
            runtimeStatus: "completed",
            runtimeFinalState: "done",
            semanticOutcome: "primary_acceptance_satisfied",
            projectionId: "primary.accepted",
            runtimeRunId: "runtime-1",
            traceReferenceStatus: "available",
            auditReferenceStatus: "available"
          }
        ]
      : [],
    decisions: {
      projections: hasSlot
        ? [
            {
              invocationIndex: 1,
              slotId: "primary_slot",
              semanticOutcome: "primary_acceptance_satisfied",
              projectionId: "primary.accepted"
            }
          ]
        : [],
      routes: status === "completed" ? [{ routeId: "complete", effect: "terminate" }] : [],
      bindings: status === "completed" ? [{ bindingId: "result_to_primary" }] : [],
      overlays: [{ overlayId: "demo_guard", stage: "scenario_start", decision: "allow" }]
    },
    timeline: [
      {
        index: 1,
        source: "orchestrator_trace",
        type: "orchestrator.started",
        sequence: 1
      },
      ...(hasSlot
        ? [
            {
              index: 2,
              source: "orchestrator_trace" as const,
              type: "orchestrator.slot.invocation.completed",
              sequence: 2,
              invocationIndex: 1,
              slotId: "primary_slot",
              runtimeStatus: "completed"
            },
            {
              index: 3,
              source: "projection_evidence" as const,
              type: "Outcome Projection",
              invocationIndex: 1,
              slotId: "primary_slot",
              semanticOutcome: "primary_acceptance_satisfied",
              projectionId: "primary.accepted",
              runtimeStatus: "completed"
            }
          ]
        : []),
      {
        index: hasSlot ? 4 : 2,
        source: "orchestrator_trace",
        type: eventByStatus[status],
        sequence: hasSlot ? 3 : 2,
        terminalId: terminalByStatus[status]
      }
    ],
    budgetUsage: {
      slotInvocations: hasSlot ? 1 : 0,
      routeEvaluations: status === "completed" ? 1 : 0,
      bindingApplications: status === "completed" ? 1 : 0
    },
    auditSummary: {
      status: "available",
      redacted: true,
      externalEffectsOccurred: false
    },
    redactionSummary: {
      redacted: true,
      completeInputIncluded: false,
      completeOutputIncluded: false,
      completeSlotTraceIncluded: false,
      completeAuditIncluded: false
    },
    publicExposure: {
      mode: "demo_only",
      containsCustomerData: false,
      containsRealEndpoint: false,
      containsSecret: false,
      containsCustomerSop: false,
      containsCommercialDeliveryAsset: false
    }
  };
}

describe("Scenario Run Evidence Core", () => {
  it.each(["completed", "handoff_required", "failed"] as const)(
    "creates and replays valid %s evidence offline",
    (status) => {
      const bundle = createScenarioRunEvidenceBundle(draft(status));
      const replay = replayScenarioEvidence(bundle);
      expect(validateScenarioEvidenceBundle(bundle).valid).toBe(true);
      expect(replay).toMatchObject({
        valid: true,
        integrityStatus: "valid",
        runtimeExecuted: false,
        replayMode: "offline_evidence"
      });
      expect(replay.terminalSummary?.status).toBe(status);
    }
  );

  it("produces deterministic hashes and a stable Slot tree", () => {
    const first = createScenarioRunEvidenceBundle(draft());
    const second = createScenarioRunEvidenceBundle(draft());
    expect(first.evidenceHash).toBe(second.evidenceHash);
    expect(replayScenarioEvidence(first).slotTree).toEqual([
      { slotId: "primary_slot", invocations: first.slotInvocations }
    ]);
  });

  it.each(["terminal", "route", "binding", "slot"])(
    "detects %s tampering through the evidence hash",
    (target) => {
      const bundle = createScenarioRunEvidenceBundle(draft());
      if (target === "terminal") bundle.run.terminalId = "$fail_closed";
      if (target === "route") bundle.decisions.routes[0]!.routeId = "tampered";
      if (target === "binding") bundle.decisions.bindings[0]!.bindingId = "tampered";
      if (target === "slot") bundle.slotInvocations[0]!.slotId = "tampered";
      expect(validateScenarioEvidenceBundle(bundle)).toMatchObject({
        valid: false,
        integrityStatus: "invalid"
      });
    }
  );

  it("rejects timeline sequence and terminal mismatches without repairing evidence", () => {
    const badSequence = createScenarioRunEvidenceBundle(draft());
    badSequence.timeline[1]!.sequence = 7;
    badSequence.evidenceHash = createScenarioEvidenceHash(badSequence);
    const sequenceReplay = replayScenarioEvidence(badSequence);
    expect(sequenceReplay.valid).toBe(false);
    expect(sequenceReplay.timeline).toEqual([]);

    const badTerminal = createScenarioRunEvidenceBundle(draft());
    badTerminal.timeline.at(-1)!.type = "orchestrator.failed";
    badTerminal.evidenceHash = createScenarioEvidenceHash(badTerminal);
    expect(replayScenarioEvidence(badTerminal).blockers[0]?.code).toBe(
      "SCENARIO_EVIDENCE_TERMINAL_MISMATCH"
    );
  });

  it("rejects broken Slot and projection references", () => {
    const bundle = createScenarioRunEvidenceBundle(draft());
    bundle.decisions.projections[0]!.invocationIndex = 2;
    bundle.evidenceHash = createScenarioEvidenceHash(bundle);
    expect(validateScenarioEvidenceBundle(bundle).blockers).toContainEqual(
      expect.objectContaining({ code: "SCENARIO_EVIDENCE_REFERENCE_INVALID" })
    );
  });

  it("contains summaries only and no executable or sensitive payload fields", () => {
    const serialized = JSON.stringify(createScenarioRunEvidenceBundle(draft()));
    expect(serialized).toContain('"containsSecret":false');
    expect(serialized).toContain('"containsRealEndpoint":false');
    for (const forbidden of [
      '"completeInputIncluded":true',
      '"completeOutputIncluded":true',
      '"adapterConfig":',
      '"handler":',
      '"secret":',
      '"endpoint":'
    ]) {
      expect(serialized.toLowerCase()).not.toContain(forbidden.toLowerCase());
    }
  });
});
