import type {
  ScenarioExecutionPolicy,
  ScenarioFailurePolicy,
  ScenarioHandoffPolicy,
  ScenarioTerminalDefinition,
  ScenarioTerminalId
} from "./types";

export const SCENARIO_TERMINAL_IDS = [
  "$scenario_done",
  "$human_handoff",
  "$fail_closed"
] as const satisfies readonly ScenarioTerminalId[];

export const DEFAULT_SCENARIO_TERMINALS: ScenarioTerminalDefinition[] = [
  {
    terminalId: "$scenario_done",
    status: "completed",
    requiresAudit: true,
    primaryOutputRequired: true
  },
  {
    terminalId: "$human_handoff",
    status: "handoff_required",
    requiresAudit: true,
    primaryOutputRequired: false
  },
  {
    terminalId: "$fail_closed",
    status: "failed",
    requiresAudit: true,
    primaryOutputRequired: false
  }
];

export const DEFAULT_SCENARIO_EXECUTION_POLICY: ScenarioExecutionPolicy = {
  scheduling: "single_active_slot",
  invocationModel: "call_return",
  parallelism: "disabled",
  recursion: "disabled",
  implicitLooping: "disabled",
  budgets: {
    maxSlotInvocations: 16,
    maxRouteEvaluations: 64,
    maxBindingApplications: 64,
    maxCallDepth: 1
  },
  budgetExhaustion: "fail_closed",
  ambiguousRoute: "fail_closed",
  missingRoute: "fail_closed"
};

export const DEFAULT_SCENARIO_FAILURE_POLICY: ScenarioFailurePolicy = {
  slotFailure: "explicit_route_or_fail_closed",
  actionFailure: "owned_by_slot_dsl",
  bindingFailure: "fail_closed",
  routeResolutionFailure: "fail_closed",
  overlayViolation: "deny_or_handoff",
  partialScenarioSuccessAllowed: false,
  automaticRetryAtOrchestratorLevel: false
};

export const DEFAULT_SCENARIO_HANDOFF_POLICY: ScenarioHandoffPolicy = {
  terminalId: "$human_handoff",
  reasonRequired: true,
  sourceSlotRequired: true,
  sourceRouteRequired: true,
  overlayRefRequiredWhenTriggeredByOverlay: true,
  contextSnapshotRequired: true,
  secretRedactionRequired: true,
  resumable: false
};
