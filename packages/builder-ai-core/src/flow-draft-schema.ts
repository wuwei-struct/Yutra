import { z } from "zod";

export const flowDraftSchema = z.object({
  draftId: z.string().min(1),
  scenario: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  intents: z
    .array(
      z.object({
        id: z.string().min(1),
        label: z.string().min(1),
        description: z.string().optional()
      })
    )
    .min(1),
  selectedSkills: z.array(z.string().min(1)).min(1),
  rules: z.record(z.string(), z.unknown()),
  handoffRules: z.record(z.string(), z.unknown()).optional(),
  responseStyle: z.enum(["neutral", "service_oriented", "concise", "custom"]).optional(),
  customResponseStyle: z.string().optional(),
  assumptions: z.array(z.string().min(1)).optional(),
  warnings: z.array(z.string().min(1)).optional(),
  states: z
    .array(
      z.object({
        id: z.string().min(1),
        label: z.string().optional(),
        description: z.string().optional(),
        actions: z.array(z.string().min(1)).optional(),
        transitions: z
          .array(
            z.object({
              when: z.string().optional(),
              to: z.string().min(1),
              label: z.string().optional()
            })
          )
          .optional()
      })
    )
    .optional(),
  source: z.object({
    type: z.enum(["mock", "llm"]),
    provider: z.string().optional(),
    model: z.string().optional()
  }),
  createdAt: z.string().min(1),
  metadata: z.record(z.string(), z.unknown()).optional()
});
