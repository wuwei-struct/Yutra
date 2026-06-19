import { z } from "zod";
import { BEHAVIOR_PRIMITIVE_IDS } from "./behavior-primitive";
import { ALL_ARCHETYPE_IDS, CROSS_CUTTING_ARCHETYPE_IDS } from "./ids";
import { SIDE_EFFECT_LEVELS } from "./side-effect";

export const localizedTextSchema = z.object({
  en: z.string().min(1),
  zhCN: z.string().min(1)
});

export const sideEffectLevelSchema = z.enum(SIDE_EFFECT_LEVELS);

export const capabilityAtomSchema = z.object({
  id: z.string().min(1),
  label: localizedTextSchema,
  description: z
    .object({
      en: z.string().min(1).optional(),
      zhCN: z.string().min(1).optional()
    })
    .optional(),
  businessObjects: z.array(z.string().min(1)).optional(),
  inputs: z.array(z.string().min(1)).optional(),
  outputs: z.array(z.string().min(1)).optional(),
  commonActions: z.array(z.string().min(1)).optional(),
  commonGuards: z.array(z.string().min(1)).optional(),
  sideEffectLevel: sideEffectLevelSchema.optional(),
  requiresPolicyGuard: z.boolean().optional(),
  requiresAudit: z.boolean().optional()
});

export const compositionModeSchema = z.enum(["sequence", "nested", "routing", "supervision", "event_triggered"]);

export const contextPolicySchema = z.object({
  namespace: z.boolean(),
  read: z.array(z.string()).optional(),
  write: z.array(z.string()).optional(),
  sharedFields: z.array(z.string()).optional(),
  writeConflicts: z.enum(["deny", "most_restrictive_wins", "last_write_wins"])
});

export const guardPolicySchema = z.object({
  priority: z.array(z.string().min(1)),
  conflictResolution: z.enum(["most_restrictive_wins", "first_match", "deny_on_conflict"])
});

export const failurePolicySchema = z.enum(["fail_closed_to_handoff", "fail_closed_error", "fallback_state", "stop_run"]);

export const tracePolicySchema = z.enum(["unified_timeline", "unified_timeline_with_child_runs"]);

export const sideEffectPolicySchema = z.object({
  maxAutoSideEffect: sideEffectLevelSchema,
  requiresPolicyGuardFrom: sideEffectLevelSchema
});

export const compositionContractSchema = z.object({
  mode: compositionModeSchema,
  children: z.array(z.enum(ALL_ARCHETYPE_IDS)).optional(),
  contextPolicy: contextPolicySchema,
  guardPolicy: guardPolicySchema,
  failurePolicy: failurePolicySchema,
  tracePolicy: tracePolicySchema,
  sideEffectPolicy: sideEffectPolicySchema
});

export const publicExposureSchema = z.object({
  level: z.enum(["base", "demo"]),
  containsCustomerAssets: z.literal(false),
  containsRealEndpoints: z.literal(false),
  containsCommercialSop: z.literal(false)
});

export const archetypeLayerSchema = z.enum(["product_archetype", "cross_cutting_archetype"]);

export const triggerPatternSchema = z.enum(["user_request", "system_event", "scheduled", "human_initiated", "mixed"]);

export const archetypeTaxonomySchema = z.object({
  layer: archetypeLayerSchema,
  primitiveRefs: z.array(z.enum(BEHAVIOR_PRIMITIVE_IDS)).min(1),
  primaryOutput: localizedTextSchema.optional(),
  acceptanceObject: localizedTextSchema.optional(),
  governanceFocus: z
    .object({
      en: z.array(z.string().min(1)),
      zhCN: z.array(z.string().min(1))
    })
    .optional(),
  triggerPattern: triggerPatternSchema.optional(),
  scenarioPatternHints: z
    .object({
      en: z.array(z.string().min(1)).optional(),
      zhCN: z.array(z.string().min(1)).optional()
    })
    .optional()
});

export const archetypeManifestSchema = z.object({
  archetypeId: z.enum(ALL_ARCHETYPE_IDS),
  archetypeVersion: z.string().regex(/^\d+\.\d+\.\d+([-.][A-Za-z0-9.]+)?$/),
  kind: z.enum(["main", "cross_cutting"]),
  name: localizedTextSchema,
  summary: localizedTextSchema,
  description: z
    .object({
      en: z.string().min(1).optional(),
      zhCN: z.string().min(1).optional()
    })
    .optional(),
  coreFlow: z.array(z.string().min(1)).min(2),
  commonScenarios: z.array(z.string().min(1)),
  commonRules: z.array(z.string().min(1)),
  capabilities: z.array(capabilityAtomSchema),
  inputs: z.array(z.string().min(1)),
  outputs: z.array(z.string().min(1)),
  compatibleCrossCutting: z.array(z.enum(CROSS_CUTTING_ARCHETYPE_IDS)).optional(),
  recommendedCompositions: z.array(compositionModeSchema).optional(),
  taxonomy: archetypeTaxonomySchema,
  defaultGovernance: z.object({
    contextPolicy: contextPolicySchema,
    guardPolicy: guardPolicySchema,
    failurePolicy: failurePolicySchema,
    tracePolicy: tracePolicySchema,
    sideEffectPolicy: sideEffectPolicySchema
  }),
  publicExposure: publicExposureSchema,
  metadata: z.record(z.unknown()).optional()
});
