import { CROSS_CUTTING_ARCHETYPE_IDS, createArchetypeRegistry } from "@yutra/archetype-core";
import {
  compileScenarioCompositionPreview,
  type ScenarioCompositionCompileOutput
} from "@yutra/scenario-composition-compiler";
import {
  BUILTIN_SCENARIO_COMPOSITION_PLANS,
  RENEWAL_CHURN_WARNING_COMPOSITION_DRAFT,
  resolveCompositionReadiness,
  type CompositionSupportContext,
  type ScenarioCompositionDraft,
  type ScenarioCompositionPlan
} from "@yutra/scenario-composition-core";
import {
  getScenarioPattern,
  resolveScenarioPatternComposition,
  type ScenarioPatternId,
  type ScenarioPatternSupportContext
} from "@yutra/scenario-pattern-core";
import type {
  ScenarioCompositionCatalogItem,
  ScenarioCompositionCatalogResponse,
  ScenarioCompositionCompilePreviewRequest,
  ScenarioCompositionCompilePreviewResponse,
  ScenarioCompositionDetailResponse
} from "./types";

const PRODUCT_ARCHETYPE_IDS = [
  "request-resolution",
  "approval-decision",
  "knowledge-answering"
] as const;

const SUPPORT_CONTEXT: CompositionSupportContext = {
  compilerEnabledArchetypeIds: [...PRODUCT_ARCHETYPE_IDS],
  workbenchEnabledArchetypeIds: [...PRODUCT_ARCHETYPE_IDS],
  availableCrossCuttingArchetypeIds: [...CROSS_CUTTING_ARCHETYPE_IDS],
  compositionCompilerAvailable: true
};

const PATTERN_SUPPORT_CONTEXT: ScenarioPatternSupportContext = {
  compilerEnabledArchetypeIds: [...PRODUCT_ARCHETYPE_IDS],
  workbenchEnabledArchetypeIds: [...PRODUCT_ARCHETYPE_IDS]
};

const compositionInputs: Array<ScenarioCompositionPlan | ScenarioCompositionDraft> = [
  ...BUILTIN_SCENARIO_COMPOSITION_PLANS,
  RENEWAL_CHURN_WARNING_COMPOSITION_DRAFT
];

export class ScenarioCompositionApiError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly statusCode: 400 | 404 | 422 | 500
  ) {
    super(message);
    this.name = "ScenarioCompositionApiError";
  }
}

function getCompositionInput(compositionId: string): ScenarioCompositionPlan | ScenarioCompositionDraft | undefined {
  return compositionInputs.find((input) => input.compositionId === compositionId);
}

function patternFor(input: ScenarioCompositionPlan | ScenarioCompositionDraft) {
  const pattern = getScenarioPattern(input.patternRef.patternId as ScenarioPatternId);
  if (!pattern) {
    throw new ScenarioCompositionApiError(
      "SCENARIO_COMPOSITION_PATTERN_NOT_FOUND",
      `Scenario Pattern ${input.patternRef.patternId} was not found.`,
      500
    );
  }
  return pattern;
}

function catalogItem(input: ScenarioCompositionPlan | ScenarioCompositionDraft): ScenarioCompositionCatalogItem {
  const pattern = patternFor(input);
  const compositionSummary = resolveScenarioPatternComposition(
    pattern,
    createArchetypeRegistry(),
    PATTERN_SUPPORT_CONTEXT
  );
  const readiness = resolveCompositionReadiness(input, SUPPORT_CONTEXT);
  return {
    compositionId: input.compositionId,
    patternId: pattern.patternId,
    name: { ...pattern.name },
    summary: { ...pattern.summary },
    primaryArchetypeId: pattern.primaryArchetypeId,
    supportingArchetypeIds: [...pattern.supportingArchetypeIds],
    crossCuttingArchetypeIds: [...pattern.crossCuttingArchetypeIds],
    triggerPattern: pattern.triggerPattern,
    primaryOutput: { ...compositionSummary.primaryOutput },
    acceptanceObject: { ...compositionSummary.acceptanceObject },
    readiness,
    eligibleForCompilePreview:
      !("eligibleForCompilerInput" in input) &&
      readiness.status === "compile_ready" &&
      readiness.compositionCompilerAvailable
  };
}

export function listScenarioCompositionCatalog(): ScenarioCompositionCatalogResponse {
  return {
    compositions: compositionInputs.map(catalogItem)
  };
}

export function getScenarioCompositionDetail(compositionId: string): ScenarioCompositionDetailResponse {
  const plan = getCompositionInput(compositionId);
  if (!plan) {
    throw new ScenarioCompositionApiError(
      "SCENARIO_COMPOSITION_NOT_FOUND",
      `Scenario Composition ${compositionId} was not found.`,
      404
    );
  }
  const pattern = patternFor(plan);
  const compositionSummary = resolveScenarioPatternComposition(
    pattern,
    createArchetypeRegistry(),
    PATTERN_SUPPORT_CONTEXT
  );
  const readiness = resolveCompositionReadiness(plan, SUPPORT_CONTEXT);
  return {
    compositionId,
    pattern,
    plan,
    compositionSummary,
    readiness,
    publicBoundary: plan.publicExposure,
    compositionCompilerAvailable: true,
    eligibleForCompilePreview:
      !("eligibleForCompilerInput" in plan) &&
      readiness.status === "compile_ready" &&
      readiness.compositionCompilerAvailable
  };
}

export function parseScenarioCompositionCompileRequest(input: unknown): ScenarioCompositionCompilePreviewRequest {
  if (
    !input ||
    typeof input !== "object" ||
    Array.isArray(input) ||
    Object.keys(input).length !== 1 ||
    typeof (input as { compositionId?: unknown }).compositionId !== "string" ||
    !(input as { compositionId: string }).compositionId.trim()
  ) {
    throw new ScenarioCompositionApiError(
      "SCENARIO_COMPOSITION_REQUEST_INVALID",
      "Request must contain only a non-empty compositionId.",
      400
    );
  }
  return {
    compositionId: (input as { compositionId: string }).compositionId
  };
}

function compileFailure(output: Extract<ScenarioCompositionCompileOutput, { ok: false }>): ScenarioCompositionCompilePreviewResponse {
  const issue = output.issues[0];
  return {
    ok: false,
    error: {
      code: issue?.code ?? "COMPOSITION_COMPILE_INPUT_INVALID",
      message: issue?.message ?? "Scenario Composition Compile Preview failed."
    },
    issues: output.issues
  };
}

export function compileBuiltInScenarioComposition(
  request: ScenarioCompositionCompilePreviewRequest
): ScenarioCompositionCompilePreviewResponse {
  const plan = getCompositionInput(request.compositionId);
  if (!plan) {
    throw new ScenarioCompositionApiError(
      "SCENARIO_COMPOSITION_NOT_FOUND",
      `Scenario Composition ${request.compositionId} was not found.`,
      404
    );
  }

  const output = compileScenarioCompositionPreview(plan, {
    supportContext: SUPPORT_CONTEXT
  });
  if (!output.ok) return compileFailure(output);
  return {
    ok: true,
    result: output.result
  };
}
