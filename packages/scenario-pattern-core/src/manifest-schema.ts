import { CROSS_CUTTING_ARCHETYPE_IDS, MAIN_ARCHETYPE_IDS, triggerPatternSchema } from "@yutra/archetype-core";
import { z } from "zod";
import { SCENARIO_PATTERN_IDS } from "./ids";

const localizedScenarioTextSchema = z
  .object({
    en: z.string().min(1),
    zhCN: z.string().min(1)
  })
  .strict();

export const scenarioPatternPublicExposureSchema = z
  .object({
    mode: z.literal("demo_only"),
    containsCustomerData: z.literal(false),
    containsRealEndpoint: z.literal(false),
    containsSecret: z.literal(false),
    containsCustomerSop: z.literal(false),
    containsCommercialDeliveryAsset: z.literal(false)
  })
  .strict();

export const scenarioPatternManifestSchema = z
  .object({
    schemaVersion: z.literal("1.0.0"),
    patternId: z.enum(SCENARIO_PATTERN_IDS),
    version: z.string().regex(/^\d+\.\d+\.\d+([-.][A-Za-z0-9.]+)?$/),
    name: localizedScenarioTextSchema,
    summary: localizedScenarioTextSchema,
    primaryArchetypeId: z.enum(MAIN_ARCHETYPE_IDS),
    supportingArchetypeIds: z.array(z.enum(MAIN_ARCHETYPE_IDS)),
    crossCuttingArchetypeIds: z.array(z.enum(CROSS_CUTTING_ARCHETYPE_IDS)),
    triggerPattern: triggerPatternSchema,
    compositionRationale: localizedScenarioTextSchema,
    acceptanceSummary: localizedScenarioTextSchema,
    scenarioTags: z.array(z.string().min(1)),
    publicExposure: scenarioPatternPublicExposureSchema
  })
  .strict();
