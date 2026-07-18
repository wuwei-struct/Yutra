import {
  compileScenarioOrchestratorPreview,
  getBuiltinScenarioOrchestratorCompileProfile,
  type ScenarioOrchestratorCompileOutput
} from "@yutra/scenario-orchestrator-compiler";
import {
  BUILTIN_SCENARIO_COMPOSITION_PLANS,
  RENEWAL_CHURN_WARNING_COMPOSITION_DRAFT
} from "@yutra/scenario-composition-core";
import type {
  ScenarioOrchestratorCompilePreviewRequest,
  ScenarioOrchestratorCompilePreviewResponse
} from "./types";

const compositionInputs = [
  ...BUILTIN_SCENARIO_COMPOSITION_PLANS,
  RENEWAL_CHURN_WARNING_COMPOSITION_DRAFT
] as const;

const RENEWAL_CHURN_BLOCKERS = [
  "Orchestrator Compile Profile is unavailable.",
  "monitoring-response compiler unavailable",
  "data-insight compiler unavailable",
  "lead-engagement compiler unavailable"
] as const;

export class ScenarioOrchestratorApiError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly statusCode: 400 | 404 | 422 | 500
  ) {
    super(message);
    this.name = "ScenarioOrchestratorApiError";
  }
}

export function getScenarioOrchestratorSupport(compositionId: string): {
  orchestratorPreviewAvailable: boolean;
  orchestratorCompileProfileId?: string;
  orchestratorRuntimeSupported: false;
  orchestratorBlockers: string[];
} {
  const profile = getBuiltinScenarioOrchestratorCompileProfile(compositionId);
  if (profile) {
    return {
      orchestratorPreviewAvailable: true,
      orchestratorCompileProfileId: profile.profileId,
      orchestratorRuntimeSupported: false,
      orchestratorBlockers: []
    };
  }
  return {
    orchestratorPreviewAvailable: false,
    orchestratorRuntimeSupported: false,
    orchestratorBlockers:
      compositionId === "renewal-churn-warning-composition-demo"
        ? [...RENEWAL_CHURN_BLOCKERS]
        : ["Orchestrator Compile Profile is unavailable."]
  };
}

export function parseScenarioOrchestratorCompileRequest(
  input: unknown
): ScenarioOrchestratorCompilePreviewRequest {
  if (
    !input ||
    typeof input !== "object" ||
    Array.isArray(input) ||
    Object.keys(input).length !== 1 ||
    typeof (input as { compositionId?: unknown }).compositionId !== "string" ||
    !(input as { compositionId: string }).compositionId.trim()
  ) {
    throw new ScenarioOrchestratorApiError(
      "SCENARIO_ORCHESTRATOR_REQUEST_INVALID",
      "Request must contain only a non-empty compositionId.",
      400
    );
  }
  return {
    compositionId: (input as { compositionId: string }).compositionId
  };
}

function compileFailure(
  output: Extract<ScenarioOrchestratorCompileOutput, { ok: false }>
): ScenarioOrchestratorCompilePreviewResponse {
  const issue = output.issues[0];
  return {
    ok: false,
    error: {
      code: issue?.code ?? "ORCHESTRATOR_COMPILE_INPUT_INVALID",
      message: issue?.message ?? "Scenario Orchestrator Compile Preview failed."
    },
    issues: output.issues
  };
}

export function compileBuiltInScenarioOrchestrator(
  request: ScenarioOrchestratorCompilePreviewRequest
): ScenarioOrchestratorCompilePreviewResponse {
  const compositionPlan = compositionInputs.find(
    (candidate) => candidate.compositionId === request.compositionId
  );
  if (!compositionPlan) {
    throw new ScenarioOrchestratorApiError(
      "SCENARIO_ORCHESTRATOR_COMPOSITION_NOT_FOUND",
      `Scenario Composition ${request.compositionId} was not found.`,
      404
    );
  }

  const compileProfile = getBuiltinScenarioOrchestratorCompileProfile(
    request.compositionId
  );
  const output = compileScenarioOrchestratorPreview({
    compositionPlan,
    ...(compileProfile ? { compileProfile } : {})
  });
  if (!output.ok) return compileFailure(output);
  return {
    ok: true,
    result: output.result
  };
}
