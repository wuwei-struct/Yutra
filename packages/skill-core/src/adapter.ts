import { SKILL_ERROR_CODES } from "./errors";
import { validateLoadedSkill, validateSkillManifest } from "./validator";
import type {
  LoadedSkill,
  SkillEnvironment,
  SkillRiskLevel,
  SkillSideEffect,
  SkillValidationIssue,
  YutraSkillManifest
} from "./types";

export type SkillActionImplementation = {
  type: "skill";
  skillName: string;
  skillVersion?: string;
  skillDir?: string;
  entry?: string;
};

export type ActionSpecLike = {
  name: string;
  description?: string;
  inputSchema?: Record<string, unknown>;
  outputSchema?: Record<string, unknown>;
  sideEffect?: SkillSideEffect;
  riskLevel?: SkillRiskLevel;
  requiresApproval?: boolean;
  implementation: SkillActionImplementation;
  metadata?: {
    tags?: string[];
    allowedEnvironments?: SkillEnvironment[];
    maxCallsPerRun?: number;
  };
};

export type SkillToActionOptions = {
  validate?: boolean;
};

export type SkillToActionRegistryOptions = {
  onDuplicate?: "throw" | "issue";
  onInvalid?: "throw" | "issue";
};

export type SkillActionRegistry = {
  actions: Record<string, ActionSpecLike>;
  issues: SkillValidationIssue[];
};

function createAdapterError(code: string, message: string, issues?: SkillValidationIssue[]): Error & { code: string; issues?: SkillValidationIssue[] } {
  const error = new Error(message) as Error & { code: string; issues?: SkillValidationIssue[] };
  error.code = code;
  if (issues) {
    error.issues = issues;
  }
  return error;
}

function normalizeManifest(skill: LoadedSkill | YutraSkillManifest, validate = true): {
  manifest: YutraSkillManifest;
  skillDir?: string;
} {
  if ("manifest" in skill) {
    if (validate) {
      const result = validateLoadedSkill(skill);
      if (!result.ok) {
        const errors = result.issues.filter((issue) => issue.severity === "error");
        throw createAdapterError(
          SKILL_ERROR_CODES.SKILL_MANIFEST_INVALID,
          `Cannot convert invalid loaded skill "${skill.manifest.name}" to action.`,
          errors
        );
      }
    }
    return { manifest: skill.manifest, skillDir: skill.dir };
  }

  if (!validate) {
    return { manifest: skill };
  }

  const result = validateSkillManifest(skill);
  if (!result.ok || !result.manifest) {
    const errors = result.issues.filter((issue) => issue.severity === "error");
    throw createAdapterError(
      SKILL_ERROR_CODES.SKILL_MANIFEST_INVALID,
      "Cannot convert invalid skill manifest to action.",
      errors
    );
  }
  return { manifest: result.manifest };
}

export function skillToAction(skill: LoadedSkill | YutraSkillManifest, options?: SkillToActionOptions): ActionSpecLike {
  const normalized = normalizeManifest(skill, options?.validate ?? true);
  const manifest = normalized.manifest;
  return {
    name: manifest.name,
    description: manifest.description,
    inputSchema: manifest.inputSchema,
    outputSchema: manifest.outputSchema,
    sideEffect: manifest.sideEffect,
    riskLevel: manifest.riskLevel,
    requiresApproval: manifest.requiresApproval,
    implementation: {
      type: "skill",
      skillName: manifest.name,
      skillVersion: manifest.version,
      skillDir: normalized.skillDir,
      entry: manifest.entry
    },
    metadata: {
      tags: manifest.tags,
      allowedEnvironments: manifest.allowedEnvironments,
      maxCallsPerRun: manifest.maxCallsPerRun
    }
  };
}

export function skillToActionRegistry(skills: LoadedSkill[], options?: SkillToActionRegistryOptions): SkillActionRegistry {
  const actions: Record<string, ActionSpecLike> = {};
  const issues: SkillValidationIssue[] = [];
  const seen = new Set<string>();
  const onDuplicate = options?.onDuplicate ?? "throw";
  const onInvalid = options?.onInvalid ?? "issue";

  for (const skill of skills) {
    const validation = validateLoadedSkill(skill);
    if (!validation.ok) {
      const errorIssues = validation.issues.filter((issue) => issue.severity === "error");
      if (onInvalid === "throw") {
        throw createAdapterError(
          SKILL_ERROR_CODES.SKILL_MANIFEST_INVALID,
          `Cannot convert invalid loaded skill "${skill.manifest.name}" to action registry.`,
          errorIssues
        );
      }
      issues.push(...errorIssues);
      continue;
    }

    const actionName = skill.manifest.name;
    if (seen.has(actionName)) {
      const duplicateIssue: SkillValidationIssue = {
        code: SKILL_ERROR_CODES.SKILL_DUPLICATE_NAME,
        message: `duplicate skill name detected: ${actionName}`,
        severity: "error",
        path: ["name"],
        hint: "Use unique skill names before building action registry."
      };
      if (onDuplicate === "throw") {
        throw createAdapterError(
          SKILL_ERROR_CODES.SKILL_DUPLICATE_NAME,
          `Duplicate skill name found while building action registry: "${actionName}".`,
          [duplicateIssue]
        );
      }
      issues.push(duplicateIssue);
      continue;
    }

    seen.add(actionName);
    actions[actionName] = skillToAction(skill, { validate: false });
  }

  return { actions, issues };
}

export function buildSkillActionMap(skills: LoadedSkill[]): Record<string, ActionSpecLike> {
  return skillToActionRegistry(skills, { onDuplicate: "throw", onInvalid: "throw" }).actions;
}
