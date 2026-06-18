import type { ArchetypeId, SideEffectLevel } from "@yutra/archetype-core";
import { ALL_ARCHETYPE_IDS, SIDE_EFFECT_LEVELS } from "@yutra/archetype-core";
import { z } from "zod";
import type { ConfigField } from "./provenance";

export type BusinessObjectConfig = {
  objectId: string;
  label?: {
    en?: string;
    zhCN?: string;
  };
  fields?: string[];
};

export type AdapterConfig = {
  adapterId: string;
  mode: "mock" | "real_placeholder";
  contractRef?: string;
  fieldMappings?: Record<string, string>;
  containsRealEndpoint: false;
  containsSecret: false;
};

export type TemplateConfig = {
  templateId: string;
  purpose: string;
  locale?: "en" | "zh-CN";
  text: ConfigField<string>;
};

export type TestCaseConfig = {
  testCaseId: string;
  title: string;
  input: Record<string, unknown>;
  expectedPath?: string[];
  expectedOutcome?: string;
  tags?: string[];
};

export type PackConfigGovernance = {
  environment: "dev" | "demo" | "staging" | "prod-like" | "production";
  publishable: boolean;
  requiresHumanReview: boolean;
  unconfirmedFieldPolicy: "block_publish" | "allow_in_dev_only";
  missingFieldPolicy: "block_compile";
  sideEffectPolicy?: {
    maxAutoSideEffect: SideEffectLevel;
    requiresPolicyGuardFrom: SideEffectLevel;
  };
  auditBinding?: {
    configHash?: string;
    compilerVersion?: string;
    policyVersion?: string;
    adapterVersion?: string;
    templateVersion?: string;
  };
};

export type PackConfig = {
  packConfigId: string;
  packConfigVersion: string;
  archetypeId: ArchetypeId;
  archetypeVersion: string;
  variantId?: string;
  variantVersion?: string;
  locale?: "en" | "zh-CN";
  capabilities: Record<string, ConfigField<boolean>>;
  businessObjects: BusinessObjectConfig[];
  rules: Record<string, ConfigField<unknown>>;
  policies: Record<string, ConfigField<unknown>>;
  adapters: AdapterConfig[];
  templates: TemplateConfig[];
  tests: TestCaseConfig[];
  governance: PackConfigGovernance;
  metadata?: Record<string, unknown>;
};

export const configFieldSourceSchema = z.enum([
  "defaultFromPack",
  "inferredByAI",
  "confirmedByUser",
  "migrated",
  "requiredButMissing"
]);

export const configFieldSchema: z.ZodType<ConfigField<unknown>> = z
  .object({
    value: z.unknown().optional(),
    source: configFieldSourceSchema,
    needsConfirmation: z.boolean().optional(),
    required: z.boolean().optional(),
    label: z
      .object({
        en: z.string().optional(),
        zhCN: z.string().optional()
      })
      .optional(),
    description: z
      .object({
        en: z.string().optional(),
        zhCN: z.string().optional()
      })
      .optional(),
    updatedAt: z.string().optional(),
    updatedBy: z.string().optional()
  })
  .superRefine((field, ctx) => {
    if (field.source === "inferredByAI" && field.needsConfirmation !== true) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "inferredByAI fields must set needsConfirmation=true",
        path: ["needsConfirmation"]
      });
    }
    if (field.source === "requiredButMissing" && "value" in field) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "requiredButMissing fields must not contain value",
        path: ["value"]
      });
    }
  });

export const businessObjectConfigSchema = z.object({
  objectId: z.string().min(1),
  label: z
    .object({
      en: z.string().optional(),
      zhCN: z.string().optional()
    })
    .optional(),
  fields: z.array(z.string().min(1)).optional()
});

export const adapterConfigSchema = z.object({
  adapterId: z.string().min(1),
  mode: z.enum(["mock", "real_placeholder"]),
  contractRef: z.string().optional(),
  fieldMappings: z.record(z.string()).optional(),
  containsRealEndpoint: z.literal(false),
  containsSecret: z.literal(false)
});

export const templateConfigSchema = z.object({
  templateId: z.string().min(1),
  purpose: z.string().min(1),
  locale: z.enum(["en", "zh-CN"]).optional(),
  text: configFieldSchema as z.ZodType<ConfigField<string>>
});

export const testCaseConfigSchema = z.object({
  testCaseId: z.string().min(1),
  title: z.string().min(1),
  input: z.record(z.unknown()),
  expectedPath: z.array(z.string()).optional(),
  expectedOutcome: z.string().optional(),
  tags: z.array(z.string()).optional()
});

export const packConfigGovernanceSchema = z.object({
  environment: z.enum(["dev", "demo", "staging", "prod-like", "production"]),
  publishable: z.boolean(),
  requiresHumanReview: z.boolean(),
  unconfirmedFieldPolicy: z.enum(["block_publish", "allow_in_dev_only"]),
  missingFieldPolicy: z.literal("block_compile"),
  sideEffectPolicy: z
    .object({
      maxAutoSideEffect: z.enum(SIDE_EFFECT_LEVELS),
      requiresPolicyGuardFrom: z.enum(SIDE_EFFECT_LEVELS)
    })
    .optional(),
  auditBinding: z
    .object({
      configHash: z.string().optional(),
      compilerVersion: z.string().optional(),
      policyVersion: z.string().optional(),
      adapterVersion: z.string().optional(),
      templateVersion: z.string().optional()
    })
    .optional()
});

export const packConfigSchema: z.ZodType<PackConfig> = z.object({
  packConfigId: z.string().min(1),
  packConfigVersion: z.string().regex(/^\d+\.\d+\.\d+([-.][A-Za-z0-9.]+)?$/),
  archetypeId: z.enum(ALL_ARCHETYPE_IDS),
  archetypeVersion: z.string().min(1),
  variantId: z.string().optional(),
  variantVersion: z.string().optional(),
  locale: z.enum(["en", "zh-CN"]).optional(),
  capabilities: z.record(configFieldSchema as z.ZodType<ConfigField<boolean>>),
  businessObjects: z.array(businessObjectConfigSchema),
  rules: z.record(configFieldSchema),
  policies: z.record(configFieldSchema),
  adapters: z.array(adapterConfigSchema),
  templates: z.array(templateConfigSchema),
  tests: z.array(testCaseConfigSchema),
  governance: packConfigGovernanceSchema,
  metadata: z.record(z.unknown()).optional()
});
