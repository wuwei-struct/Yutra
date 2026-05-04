export type SkillType = "tool" | "knowledge" | "llm" | "function";
export type SkillSideEffect = "none" | "read" | "write" | "external";
export type SkillRiskLevel = "low" | "medium" | "high";
export type SkillEnvironment = "dev" | "demo" | "prod-like";

export type YutraSkillManifest = {
  name: string;
  version: string;
  description?: string;
  type: SkillType;
  inputSchema?: Record<string, unknown>;
  outputSchema?: Record<string, unknown>;
  sideEffect?: SkillSideEffect;
  riskLevel?: SkillRiskLevel;
  requiresApproval?: boolean;
  entry?: string;
  tags?: string[];
  allowedEnvironments?: SkillEnvironment[];
  maxCallsPerRun?: number;
  metadata?: Record<string, unknown>;
};

export type LoadedSkill = {
  dir: string;
  manifestPath: string;
  readmePath?: string;
  manifest: YutraSkillManifest;
  skillMarkdown?: string;
  files: {
    entryExists: boolean;
    references: string[];
    assets: string[];
  };
};

export type SkillValidationIssue = {
  code: string;
  message: string;
  path?: string[];
  severity: "error" | "warning";
  hint?: string;
};

export type SkillValidationResult = {
  ok: boolean;
  issues: SkillValidationIssue[];
};

export type DiscoveredSkill = {
  name?: string;
  version?: string;
  dir: string;
  manifestPath?: string;
  ok: boolean;
  issues: SkillValidationIssue[];
  manifest?: YutraSkillManifest;
};

export type SkillRegistry = {
  list(): Promise<LoadedSkill[]>;
  get(name: string): Promise<LoadedSkill | undefined>;
  inspect(nameOrPath: string): Promise<LoadedSkill>;
  validate(nameOrPath: string): Promise<SkillValidationResult>;
  discover(): Promise<DiscoveredSkill[]>;
};
