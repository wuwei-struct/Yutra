import { resolve } from "node:path";
import { z } from "zod";
import { SKILL_ERROR_CODES } from "./errors";
import { yutraSkillManifestSchema } from "./schema";
import type { LoadedSkill, SkillValidationIssue, SkillValidationResult, YutraSkillManifest } from "./types";

function issue(
  code: string,
  message: string,
  severity: "error" | "warning",
  path?: string[],
  hint?: string
): SkillValidationIssue {
  return { code, message, severity, path, hint };
}

function manifestIssuesFromZodError(error: z.ZodError): SkillValidationIssue[] {
  const issues: SkillValidationIssue[] = [];
  for (const i of error.issues) {
    let code: string = SKILL_ERROR_CODES.SKILL_MANIFEST_INVALID;
    const joined = i.path.join(".");
    if (joined === "name") code = SKILL_ERROR_CODES.SKILL_NAME_INVALID;
    if (joined === "version") code = SKILL_ERROR_CODES.SKILL_VERSION_INVALID;
    if (joined === "type") code = SKILL_ERROR_CODES.SKILL_UNSUPPORTED_TYPE;
    if (joined === "sideEffect") code = SKILL_ERROR_CODES.SKILL_INVALID_SIDEEFFECT;
    if (joined === "riskLevel") code = SKILL_ERROR_CODES.SKILL_INVALID_RISK_LEVEL;

    issues.push(issue(code, i.message, "error", i.path.map(String)));
  }
  return issues;
}

export function validateSkillManifest(input: unknown): SkillValidationResult & { manifest?: YutraSkillManifest } {
  if (!input) {
    return {
      ok: false,
      issues: [issue(SKILL_ERROR_CODES.SKILL_MANIFEST_MISSING, "skill manifest is missing", "error")]
    };
  }

  const parsed = yutraSkillManifestSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      issues: manifestIssuesFromZodError(parsed.error)
    };
  }

  return {
    ok: true,
    issues: [],
    manifest: parsed.data
  };
}

export function validateLoadedSkill(skill: LoadedSkill): SkillValidationResult {
  const issues: SkillValidationIssue[] = [];
  const manifestResult = validateSkillManifest(skill.manifest);
  issues.push(...manifestResult.issues);

  if (!skill.readmePath) {
    issues.push(
      issue(
        SKILL_ERROR_CODES.SKILL_MARKDOWN_MISSING,
        "SKILL.md is missing",
        "warning",
        ["SKILL.md"],
        "Add SKILL.md for human/LLM instructions."
      )
    );
  }

  if (skill.manifest.entry) {
    const entryPath = resolve(skill.dir, skill.manifest.entry);
    if (!skill.files.entryExists) {
      issues.push(
        issue(
          SKILL_ERROR_CODES.SKILL_ENTRY_MISSING,
          `declared entry file is missing: ${skill.manifest.entry}`,
          "error",
          ["entry"],
          `Expected entry at ${entryPath}`
        )
      );
    }
  }

  return {
    ok: !issues.some((i) => i.severity === "error"),
    issues
  };
}
