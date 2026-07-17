import { ALL_ARCHETYPE_IDS, CROSS_CUTTING_ARCHETYPE_IDS } from "@yutra/archetype-core";
import {
  COMPOSITION_PRECEDENCE_RULES,
  compositionScopeSchema
} from "@yutra/scenario-composition-core";
import { SCENARIO_PATTERN_IDS } from "@yutra/scenario-pattern-core";
import { z } from "zod";
import { SCENARIO_TERMINAL_IDS } from "./execution-semantics";
import { SCENARIO_ORCHESTRATOR_TRACE_EVENT_TYPES } from "./trace-contract";

const productArchetypeIds = ALL_ARCHETYPE_IDS.filter(
  (id) => !(CROSS_CUTTING_ARCHETYPE_IDS as readonly string[]).includes(id)
) as [string, ...string[]];

const hashSchema = z.string().regex(/^sha256:[a-f0-9]{64}$/);

export const scenarioOrchestratorPublicExposureSchema = z
  .object({
    mode: z.literal("demo_only"),
    containsCustomerData: z.literal(false),
    containsRealEndpoint: z.literal(false),
    containsSecret: z.literal(false),
    containsCustomerSop: z.literal(false),
    containsCommercialDeliveryAsset: z.literal(false)
  })
  .strict();

export const scenarioOrchestratorSlotSchema = z
  .object({
    slotId: z.string().min(1),
    role: z.enum(["primary", "supporting"]),
    archetypeId: z.enum(productArchetypeIds),
    packConfigId: z.string().min(1),
    artifactRef: z
      .object({
        namespace: z.string().min(1),
        agentArtifactPath: z.string().min(1),
        agentArtifactHash: hashSchema,
        configHash: hashSchema
      })
      .strict(),
    inputNamespace: z.string().min(1),
    stateNamespace: z.string().min(1),
    outputNamespace: z.string().min(1),
    acceptedOutcomes: z.array(z.string().min(1)).min(1),
    callableBySlotIds: z.array(z.string().min(1))
  })
  .strict();

const routeEffectSchema = z.discriminatedUnion("type", [
  z
    .object({
      type: z.literal("invoke_slot"),
      targetSlotId: z.string().min(1),
      returnToSlotId: z.string().min(1)
    })
    .strict(),
  z.object({ type: z.literal("resume_caller") }).strict(),
  z
    .object({
      type: z.literal("terminate"),
      terminalId: z.enum(SCENARIO_TERMINAL_IDS)
    })
    .strict(),
  z
    .object({
      type: z.literal("request_handoff"),
      terminalId: z.literal("$human_handoff")
    })
    .strict(),
  z
    .object({
      type: z.literal("fail_closed"),
      terminalId: z.literal("$fail_closed")
    })
    .strict()
]);

export const scenarioOrchestratorRouteSchema = z
  .object({
    routeId: z.string().min(1),
    fromSlotId: z.string().min(1),
    outcome: z.string().min(1),
    conditionRef: z.string().min(1),
    priority: z.number().int().nonnegative(),
    effect: routeEffectSchema,
    provenanceRef: z
      .object({
        compositionRouteId: z.string().min(1)
      })
      .strict()
  })
  .strict();

export const scenarioOrchestratorBindingSchema = z
  .object({
    bindingId: z.string().min(1),
    fromSlotId: z.string().min(1),
    fromPath: z.string().min(1),
    toSlotId: z.string().min(1),
    toPath: z.string().min(1),
    required: z.boolean(),
    transform: z.literal("identity"),
    provenanceRef: z
      .object({
        compositionBindingId: z.string().min(1)
      })
      .strict()
  })
  .strict();

const terminalSchema = z
  .object({
    terminalId: z.enum(SCENARIO_TERMINAL_IDS),
    status: z.enum(["completed", "handoff_required", "failed"]),
    requiresAudit: z.literal(true),
    primaryOutputRequired: z.boolean()
  })
  .strict();

const contextPolicySchema = z
  .object({
    rootNamespace: z.literal("scenario"),
    sharedNamespace: z.literal("scenario.shared"),
    inputNamespace: z.literal("scenario.input"),
    outputNamespace: z.literal("scenario.output"),
    slotNamespacePattern: z.literal("slots.<slotId>"),
    writePolicy: z
      .object({
        scenarioInput: z.literal("read_only_after_start"),
        scenarioShared: z.literal("explicit_binding_only"),
        scenarioOutput: z.literal("primary_only"),
        slotContext: z.literal("own_slot_only")
      })
      .strict(),
    implicitMergeAllowed: z.literal(false),
    implicitCrossSlotReadAllowed: z.literal(false),
    implicitCrossSlotWriteAllowed: z.literal(false),
    secretPropagationAllowed: z.literal(false),
    adapterInheritanceAllowed: z.literal(false)
  })
  .strict();

const executionPolicySchema = z
  .object({
    scheduling: z.literal("single_active_slot"),
    invocationModel: z.literal("call_return"),
    parallelism: z.literal("disabled"),
    recursion: z.literal("disabled"),
    implicitLooping: z.literal("disabled"),
    budgets: z
      .object({
        maxSlotInvocations: z.number().int().positive().max(1024),
        maxRouteEvaluations: z.number().int().positive().max(1024),
        maxBindingApplications: z.number().int().positive().max(1024),
        maxCallDepth: z.literal(1)
      })
      .strict(),
    budgetExhaustion: z.literal("fail_closed"),
    ambiguousRoute: z.literal("fail_closed"),
    missingRoute: z.literal("fail_closed")
  })
  .strict();

const failurePolicySchema = z
  .object({
    slotFailure: z.literal("explicit_route_or_fail_closed"),
    actionFailure: z.literal("owned_by_slot_dsl"),
    bindingFailure: z.literal("fail_closed"),
    routeResolutionFailure: z.literal("fail_closed"),
    overlayViolation: z.literal("deny_or_handoff"),
    partialScenarioSuccessAllowed: z.literal(false),
    automaticRetryAtOrchestratorLevel: z.literal(false)
  })
  .strict();

const handoffPolicySchema = z
  .object({
    terminalId: z.literal("$human_handoff"),
    reasonRequired: z.literal(true),
    sourceSlotRequired: z.literal(true),
    sourceRouteRequired: z.literal(true),
    overlayRefRequiredWhenTriggeredByOverlay: z.literal(true),
    contextSnapshotRequired: z.literal(true),
    secretRedactionRequired: z.literal(true),
    resumable: z.literal(false)
  })
  .strict();

const tracePolicySchema = z
  .object({
    contractVersion: z.literal("1.0.0-preview"),
    mandatoryEventTypes: z.array(z.enum(SCENARIO_ORCHESTRATOR_TRACE_EVENT_TYPES)).min(1),
    eventEmissionImplemented: z.literal(false),
    auditRequired: z.literal(true),
    contextSnapshotRedactionRequired: z.literal(true),
    provenanceRequired: z.literal(true)
  })
  .strict();

const overlayRefSchema = z
  .object({
    overlayId: z.string().min(1),
    archetypeId: z.enum(CROSS_CUTTING_ARCHETYPE_IDS),
    scopes: z.array(compositionScopeSchema).min(1),
    enforcementMode: z.enum([
      "deny_override",
      "require_handoff",
      "audit_required",
      "adapter_boundary",
      "feedback_capture"
    ]),
    provenanceRef: z
      .object({
        compositionOverlayId: z.string().min(1)
      })
      .strict()
  })
  .strict();

const provenanceSchema = z
  .object({
    compositionId: z.string().min(1),
    compositionVersion: z.string().min(1),
    patternId: z.string().min(1),
    planHash: hashSchema,
    bundleHash: hashSchema,
    orchestratorHash: hashSchema,
    slotSources: z.array(
      z
        .object({
          slotId: z.string().min(1),
          archetypeId: z.string().min(1),
          packConfigId: z.string().min(1),
          configHash: hashSchema,
          agentArtifactHash: hashSchema
        })
        .strict()
    ),
    routeSources: z.array(
      z
        .object({
          routeId: z.string().min(1),
          compositionRouteId: z.string().min(1)
        })
        .strict()
    ),
    bindingSources: z.array(
      z
        .object({
          bindingId: z.string().min(1),
          compositionBindingId: z.string().min(1)
        })
        .strict()
    ),
    overlaySources: z.array(
      z
        .object({
          overlayId: z.string().min(1),
          compositionOverlayId: z.string().min(1)
        })
        .strict()
    )
  })
  .strict();

export const scenarioOrchestratorDocumentSchema = z
  .object({
    schemaVersion: z.literal("1.0.0-preview"),
    kind: z.literal("scenario_orchestrator"),
    orchestratorId: z.string().min(1),
    version: z.string().regex(/^\d+\.\d+\.\d+([-.][A-Za-z0-9.]+)?$/),
    compositionRef: z
      .object({
        compositionId: z.string().min(1),
        compositionVersion: z.string().min(1),
        patternId: z.enum(SCENARIO_PATTERN_IDS),
        planHash: hashSchema,
        bundleHash: hashSchema
      })
      .strict(),
    executionModel: z.literal("single_active_slot_call_return"),
    previewOnly: z.literal(true),
    runtimeExecutable: z.literal(false),
    entrySlotId: z.string().min(1),
    slots: z.array(scenarioOrchestratorSlotSchema).min(1),
    routes: z.array(scenarioOrchestratorRouteSchema).min(1),
    bindings: z.array(scenarioOrchestratorBindingSchema),
    terminals: z.array(terminalSchema).min(1),
    contextPolicy: contextPolicySchema,
    executionPolicy: executionPolicySchema,
    failurePolicy: failurePolicySchema,
    handoffPolicy: handoffPolicySchema,
    tracePolicy: tracePolicySchema,
    precedencePolicyRef: z
      .object({
        conflictMode: z.literal("fail_closed"),
        rules: z.array(z.enum(COMPOSITION_PRECEDENCE_RULES)).min(1)
      })
      .strict(),
    overlayRefs: z.array(overlayRefSchema),
    provenance: provenanceSchema,
    publicExposure: scenarioOrchestratorPublicExposureSchema
  })
  .strict();
