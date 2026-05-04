import { readdir, readFile, stat } from "node:fs/promises";
import { join, resolve } from "node:path";
import { SKILL_ERROR_CODES } from "./errors";
import { validateSkillManifest } from "./validator";
import type { LoadedSkill } from "./types";

async function listFilesIfExists(path: string): Promise<string[]> {
  try {
    const entries = await readdir(path, { withFileTypes: true });
    return entries.filter((entry) => entry.isFile()).map((entry) => entry.name).sort();
  } catch {
    return [];
  }
}

export async function loadSkillFromDir(dir: string): Promise<LoadedSkill> {
  const absDir = resolve(dir);
  const dirStats = await stat(absDir).catch(() => null);
  if (!dirStats || !dirStats.isDirectory()) {
    throw new Error(`Skill directory does not exist: ${absDir}`);
  }

  const manifestPath = join(absDir, "skill.json");
  const manifestText = await readFile(manifestPath, "utf8").catch(() => null);
  if (!manifestText) {
    const error = new Error(`skill.json is missing in ${absDir}`);
    (error as Error & { code: string }).code = SKILL_ERROR_CODES.SKILL_MANIFEST_MISSING;
    throw error;
  }

  const rawManifest = JSON.parse(manifestText.replace(/^\uFEFF/, "")) as unknown;
  const validation = validateSkillManifest(rawManifest);
  if (!validation.ok || !validation.manifest) {
    const error = new Error("skill.json is invalid");
    (error as Error & { code: string; issues?: unknown }).code = SKILL_ERROR_CODES.SKILL_MANIFEST_INVALID;
    (error as Error & { code: string; issues?: unknown }).issues = validation.issues;
    throw error;
  }

  const readmePath = join(absDir, "SKILL.md");
  const readmeText = await readFile(readmePath, "utf8").catch(() => undefined);

  const entryExists = validation.manifest.entry
    ? Boolean(await stat(join(absDir, validation.manifest.entry)).catch(() => null))
    : false;

  return {
    dir: absDir,
    manifestPath,
    readmePath: readmeText ? readmePath : undefined,
    manifest: validation.manifest,
    skillMarkdown: readmeText,
    files: {
      entryExists,
      references: await listFilesIfExists(join(absDir, "references")),
      assets: await listFilesIfExists(join(absDir, "assets"))
    }
  };
}
