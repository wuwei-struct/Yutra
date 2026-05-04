import { existsSync } from "node:fs";
import { readdir } from "node:fs/promises";
import { isAbsolute, resolve } from "node:path";
import { SKILL_ERROR_CODES } from "./errors";
import { loadSkillFromDir } from "./loader";
import { validateLoadedSkill } from "./validator";
import type { DiscoveredSkill, LoadedSkill, SkillRegistry, SkillValidationIssue, SkillValidationResult } from "./types";

function issue(code: string, message: string, severity: "error" | "warning", hint?: string): SkillValidationIssue {
  return { code, message, severity, hint };
}

function toAbsolute(baseDir: string, pathValue: string): string {
  return isAbsolute(pathValue) ? pathValue : resolve(baseDir, pathValue);
}

async function discoverDirs(rootPath: string): Promise<string[]> {
  const entries = await readdir(rootPath, { withFileTypes: true }).catch(() => null);
  if (!entries) {
    return [];
  }

  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => resolve(rootPath, entry.name))
    .sort((a, b) => a.localeCompare(b));
}

function hasSkillManifest(dir: string): boolean {
  return existsSync(resolve(dir, "skill.json"));
}

function duplicateNameIssues(skills: DiscoveredSkill[]): void {
  const grouped = new Map<string, DiscoveredSkill[]>();
  for (const skill of skills) {
    if (!skill.name) {
      continue;
    }
    const list = grouped.get(skill.name) ?? [];
    list.push(skill);
    grouped.set(skill.name, list);
  }

  for (const [name, list] of grouped.entries()) {
    if (list.length <= 1) {
      continue;
    }

    for (const skill of list) {
      skill.issues.push(
        issue(
          SKILL_ERROR_CODES.SKILL_DUPLICATE_NAME,
          `duplicate skill name detected: ${name}`,
          "warning",
          "Use unique skill names to avoid ambiguous CLI inspect by name."
        )
      );
    }
  }
}

export async function discoverSkills(paths: string[], baseDir = process.cwd()): Promise<DiscoveredSkill[]> {
  const roots = paths.map((pathValue) => toAbsolute(baseDir, pathValue));
  const candidates = new Set<string>();

  for (const root of roots) {
    if (hasSkillManifest(root)) {
      candidates.add(root);
      continue;
    }

    const dirs = await discoverDirs(root);
    for (const dir of dirs) {
      if (hasSkillManifest(dir)) {
        candidates.add(dir);
      }
    }
  }

  const discovered: DiscoveredSkill[] = [];
  for (const dir of Array.from(candidates).sort((a, b) => a.localeCompare(b))) {
    try {
      const loaded = await loadSkillFromDir(dir);
      const validation = validateLoadedSkill(loaded);
      discovered.push({
        name: loaded.manifest.name,
        version: loaded.manifest.version,
        dir: loaded.dir,
        manifestPath: loaded.manifestPath,
        ok: validation.ok,
        issues: validation.issues,
        manifest: loaded.manifest
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown skill loading error";
      const codeValue =
        typeof error === "object" && error && "code" in error && typeof (error as { code?: string }).code === "string"
          ? (error as { code: string }).code
          : SKILL_ERROR_CODES.SKILL_MANIFEST_INVALID;
      discovered.push({
        dir,
        manifestPath: resolve(dir, "skill.json"),
        ok: false,
        issues: [issue(codeValue, message, "error")]
      });
    }
  }

  duplicateNameIssues(discovered);
  return discovered;
}

export function createSkillRegistry(options?: {
  paths?: string[];
  baseDir?: string;
}): SkillRegistry {
  const baseDir = options?.baseDir ?? process.cwd();
  const paths = options?.paths ?? ["skills", ".yutra/skills", "examples/ecommerce-support/skills", "examples/it-helpdesk/skills"];

  async function resolveByName(name: string): Promise<LoadedSkill | undefined> {
    const all = await discoverSkills(paths, baseDir);
    const matches = all.filter((skill) => skill.name === name);
    if (matches.length === 0) {
      return undefined;
    }
    if (matches.length > 1) {
      throw new Error(`Multiple skills found for name "${name}". Use a path with inspect/validate.`);
    }
    return loadSkillFromDir(matches[0].dir);
  }

  async function resolveNameOrPath(nameOrPath: string): Promise<LoadedSkill> {
    const asPath = toAbsolute(baseDir, nameOrPath);
    if (existsSync(asPath)) {
      return loadSkillFromDir(asPath);
    }

    const fromName = await resolveByName(nameOrPath);
    if (!fromName) {
      throw new Error(`Skill not found: ${nameOrPath}`);
    }
    return fromName;
  }

  return {
    async list(): Promise<LoadedSkill[]> {
      const all = await discoverSkills(paths, baseDir);
      const valid = all.filter((skill) => skill.ok && skill.name);
      const loaded: LoadedSkill[] = [];
      for (const item of valid) {
        loaded.push(await loadSkillFromDir(item.dir));
      }
      return loaded;
    },
    async get(name: string): Promise<LoadedSkill | undefined> {
      return resolveByName(name);
    },
    async inspect(nameOrPath: string): Promise<LoadedSkill> {
      return resolveNameOrPath(nameOrPath);
    },
    async validate(nameOrPath: string): Promise<SkillValidationResult> {
      try {
        const loaded = await resolveNameOrPath(nameOrPath);
        return validateLoadedSkill(loaded);
      } catch (error) {
        const message = error instanceof Error ? error.message : "skill validation failed";
        return {
          ok: false,
          issues: [issue(SKILL_ERROR_CODES.SKILL_MANIFEST_INVALID, message, "error")]
        };
      }
    },
    async discover(): Promise<DiscoveredSkill[]> {
      return discoverSkills(paths, baseDir);
    }
  };
}
