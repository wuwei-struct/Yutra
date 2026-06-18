import type { PackConfig } from "@yutra/pack-config-core";

export function compileTraceExpectationArtifact(config: PackConfig, configHash: string, compilerVersion: string): Record<string, unknown> {
  return {
    generatedFrom: {
      packConfigId: config.packConfigId,
      configHash,
      compilerVersion
    },
    expectedEventTypes: [
      "run.started",
      "intent.resolved",
      "state.entered",
      "action.started",
      "action.succeeded",
      "action.failed",
      "transition.resolved",
      "handoff.requested",
      "run.completed",
      "run.failed"
    ],
    expectedMarkers: {
      failClosed: true,
      handoffRequiredForHighRisk: true,
      ignoreVolatileFields: ["runId", "ts", "timestamp", "eventId"]
    },
    expectedPaths: {
      normal: ["classify_request", "collect_required_info", "check_order", "evaluate_rules", "execute_resolution", "done"],
      highRisk: ["classify_request", "check_order", "evaluate_rules", "handoff"],
      apiFailure: ["classify_request", "check_order", "handoff"]
    }
  };
}
