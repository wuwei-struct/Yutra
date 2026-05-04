import { z } from "zod";

const relativePathRegex = /^(?![a-zA-Z]:\\)(?!\/)(?!\\)(?!.*:\/\/).+/;

export const yutraSkillManifestSchema = z.object({
  name: z.string().min(1, "name is required"),
  version: z.string().min(1, "version is required"),
  description: z.string().optional(),
  type: z.enum(["tool", "knowledge", "llm", "function"]),
  inputSchema: z.record(z.unknown()).optional(),
  outputSchema: z.record(z.unknown()).optional(),
  sideEffect: z.enum(["none", "read", "write", "external"]).default("none"),
  riskLevel: z.enum(["low", "medium", "high"]).default("low"),
  requiresApproval: z.boolean().default(false),
  entry: z.string().regex(relativePathRegex, "entry must be a relative path").optional(),
  tags: z.array(z.string()).default([]),
  allowedEnvironments: z.array(z.enum(["dev", "demo", "prod-like"])).optional(),
  maxCallsPerRun: z.number().int().positive().optional(),
  metadata: z.record(z.unknown()).optional()
});

export type YutraSkillManifestSchema = z.infer<typeof yutraSkillManifestSchema>;
