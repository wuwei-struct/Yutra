import { z } from "zod";

export const builderFormSchema = z.object({
  agentName: z.string().min(1),
  version: z.string().optional(),
  templateId: z.string().min(1),
  selectedIntentIds: z.array(z.string().min(1)).min(1),
  selectedSkillNames: z.array(z.string().min(1)).min(1),
  rules: z.record(z.string(), z.unknown()).optional(),
  handoffRules: z.record(z.string(), z.unknown()).optional(),
  responseStyle: z.enum(["neutral", "service_oriented", "concise", "custom"]).optional(),
  customResponseStyle: z.string().optional(),
  language: z.enum(["zh-CN", "en"]).default("zh-CN"),
  metadata: z.record(z.string(), z.unknown()).optional()
});
