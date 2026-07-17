import { ALL_ARCHETYPE_IDS, CROSS_CUTTING_ARCHETYPE_IDS } from "@yutra/archetype-core";
import { SCENARIO_PATTERN_IDS } from "@yutra/scenario-pattern-core";
import { z } from "zod";
import { COMPOSITION_PRECEDENCE_RULES } from "./precedence";

const productArchetypeIds = ALL_ARCHETYPE_IDS.filter(
  (id) => !(CROSS_CUTTING_ARCHETYPE_IDS as readonly string[]).includes(id)
) as [string, ...string[]];

const localizedTextSchema = z
  .object({
    en: z.string().min(1),
    zhCN: z.string().min(1)
  })
  .strict();

export const compositionPublicExposureSchema = z
  .object({
    mode: z.literal("demo_only"),
    containsCustomerData: z.literal(false),
    containsRealEndpoint: z.literal(false),
    containsSecret: z.literal(false),
    containsCustomerSop: z.literal(false),
    containsCommercialDeliveryAsset: z.literal(false)
  })
  .strict();

export const compositionScopeSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("scenario") }).strict(),
  z.object({ type: z.literal("slot"), slotId: z.string().min(1) }).strict(),
  z.object({ type: z.literal("route"), routeId: z.string().min(1) }).strict()
]);

export const compositionSlotSchema = z
  .object({
    slotId: z.string().min(1),
    role: z.enum(["primary", "supporting"]),
    archetypeId: z.enum(productArchetypeIds),
    packConfigId: z.string().min(1),
    packConfig: z.unknown(),
    purpose: localizedTextSchema
  })
  .strict();

export const crossCuttingOverlaySchema = z
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
    ])
  })
  .strict();

export const compositionRouteSchema = z
  .object({
    routeId: z.string().min(1),
    fromSlotId: z.string().min(1),
    toSlotId: z.string().min(1),
    trigger: z.enum(["on_result", "on_guard", "on_handoff", "on_failure"]),
    conditionRef: z.string().min(1),
    returnMode: z.enum(["return_to_caller", "replace_current_flow", "terminate_scenario"])
  })
  .strict();

export const compositionDataBindingSchema = z
  .object({
    bindingId: z.string().min(1),
    fromSlotId: z.string().min(1),
    fromPath: z.string().min(1),
    toSlotId: z.string().min(1),
    toPath: z.string().min(1),
    required: z.boolean(),
    transform: z.literal("identity")
  })
  .strict();

export const compositionPrecedencePolicySchema = z
  .object({
    rules: z.array(z.enum(COMPOSITION_PRECEDENCE_RULES)).min(1),
    conflictMode: z.literal("fail_closed")
  })
  .strict();

export const scenarioCompositionPlanSchema = z
  .object({
    schemaVersion: z.literal("1.0.0"),
    compositionId: z.string().min(1),
    version: z.string().regex(/^\d+\.\d+\.\d+([-.][A-Za-z0-9.]+)?$/),
    patternRef: z
      .object({
        patternId: z.enum(SCENARIO_PATTERN_IDS),
        version: z.string().min(1)
      })
      .strict(),
    executionModel: z.literal("orchestrated_subflows"),
    primarySlotId: z.string().min(1),
    slots: z.array(compositionSlotSchema).min(1),
    crossCuttingOverlays: z.array(crossCuttingOverlaySchema),
    routes: z.array(compositionRouteSchema),
    dataBindings: z.array(compositionDataBindingSchema),
    precedencePolicy: compositionPrecedencePolicySchema,
    publicExposure: compositionPublicExposureSchema
  })
  .strict();
