import { z } from "zod";

export const naturalLanguageBriefSchema = z.object({
  text: z.string().trim().min(1),
  locale: z.enum(["zh-CN", "en"]).default("zh-CN"),
  constraints: z.array(z.string().min(1)).optional(),
  examples: z
    .array(
      z.object({
        input: z.string().min(1),
        expectedBehavior: z.string().optional()
      })
    )
    .optional(),
  metadata: z.record(z.string(), z.unknown()).optional()
});
