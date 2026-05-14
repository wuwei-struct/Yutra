import { z } from "zod";
import { BUILTIN_SCENARIOS } from "./types";

export const tagSelectionSchema = z.object({
  scenario: z.enum(BUILTIN_SCENARIOS),
  capabilities: z.array(z.string().min(1)).min(1),
  strategies: z.array(z.string().min(1)).default([]),
  language: z.enum(["zh-CN", "en"]).default("zh-CN"),
  metadata: z.record(z.string(), z.unknown()).optional()
});
