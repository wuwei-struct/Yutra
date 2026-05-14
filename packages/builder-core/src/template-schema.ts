import { z } from "zod";

export const templateIntentSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  description: z.string().optional(),
  entryState: z.string().min(1).optional()
});

export const templateSkillSchema = z.object({
  name: z.string().min(1),
  label: z.string().optional(),
  description: z.string().optional(),
  required: z.boolean().optional(),
  defaultSelected: z.boolean().optional(),
  sideEffect: z.enum(["none", "read", "write", "external"]).optional(),
  riskLevel: z.enum(["low", "medium", "high"]).optional(),
  requiresApproval: z.boolean().optional()
});

export const templateContextFieldSchema = z.object({
  name: z.string().min(1),
  type: z.enum(["string", "number", "boolean", "object", "array", "any"]),
  default: z.unknown().optional(),
  required: z.boolean().optional()
});

export const templateStateSchema = z.object({
  name: z.string().min(1),
  label: z.string().optional(),
  description: z.string().optional(),
  final: z.boolean().optional(),
  handoff: z.boolean().optional()
});

export const builderTemplateSchema = z.object({
  templateId: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  domain: z.string().min(1),
  supportedIntents: z.array(templateIntentSchema).min(1),
  availableSkills: z.array(templateSkillSchema).min(1),
  defaultContextFields: z.array(templateContextFieldSchema).optional(),
  defaultStates: z.array(templateStateSchema).optional(),
  defaultRules: z.record(z.string(), z.unknown()).optional(),
  metadata: z.record(z.string(), z.unknown()).optional()
});
