import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  buildSkillActionMap,
  SKILL_ERROR_CODES,
  createSkillRegistry,
  discoverSkills,
  loadSkillFromDir,
  skillToAction,
  skillToActionRegistry,
  validateLoadedSkill,
  validateSkillManifest,
  yutraSkillManifestSchema
} from "../src/index";

const sampleManifest = {
  name: "query_shipping_status",
  version: "0.1.0",
  type: "tool",
  sideEffect: "read",
  riskLevel: "low",
  entry: "scripts/run.mjs",
  tags: ["ecommerce", "shipping"],
  allowedEnvironments: ["dev", "demo", "prod-like"],
  maxCallsPerRun: 5
};

const workspaceRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");

describe("@yutra/skill-core", () => {
  it("valid skill manifest parses", () => {
    const parsed = yutraSkillManifestSchema.parse(sampleManifest);
    expect(parsed.name).toBe("query_shipping_status");
    expect(parsed.sideEffect).toBe("read");
  });

  it("invalid skill manifest fails with structured issues", () => {
    const result = validateSkillManifest({ version: "0.1.0", type: "unknown" });
    expect(result.ok).toBe(false);
    expect(result.issues.some((i) => i.code === SKILL_ERROR_CODES.SKILL_NAME_INVALID)).toBe(true);
  });

  it("default values are applied correctly", () => {
    const parsed = yutraSkillManifestSchema.parse({
      name: "basic",
      version: "0.1.0",
      type: "function"
    });
    expect(parsed.sideEffect).toBe("none");
    expect(parsed.riskLevel).toBe("low");
    expect(parsed.requiresApproval).toBe(false);
    expect(parsed.tags).toEqual([]);
  });

  it("tags / allowedEnvironments / riskLevel validate correctly", () => {
    const result = validateSkillManifest({
      ...sampleManifest,
      tags: ["a", "b"],
      allowedEnvironments: ["dev"],
      riskLevel: "medium"
    });
    expect(result.ok).toBe(true);
  });

  it("loadSkillFromDir can load skills/query-shipping", async () => {
    const loaded = await loadSkillFromDir(resolve(workspaceRoot, "skills/query-shipping"));
    expect(loaded.manifest.name).toBe("query_shipping_status");
    expect(loaded.files.references).toContain("shipping-policy.md");
    expect(loaded.files.assets).toContain("reply-template.md");
  });

  it("missing skill.json fails", async () => {
    const dir = await mkdtemp(join(tmpdir(), "yutra-skill-missing-manifest-"));
    await expect(loadSkillFromDir(dir)).rejects.toHaveProperty("code", SKILL_ERROR_CODES.SKILL_MANIFEST_MISSING);
    await rm(dir, { recursive: true, force: true });
  });

  it("missing SKILL.md returns warning", async () => {
    const dir = await mkdtemp(join(tmpdir(), "yutra-skill-missing-md-"));
    await mkdir(join(dir, "scripts"), { recursive: true });
    await writeFile(join(dir, "skill.json"), JSON.stringify(sampleManifest, null, 2), "utf8");
    await writeFile(join(dir, "scripts/run.mjs"), "export async function run(){ return { ok: true }; }", "utf8");

    const loaded = await loadSkillFromDir(dir);
    const validated = validateLoadedSkill(loaded);
    expect(validated.ok).toBe(true);
    expect(validated.issues.some((i) => i.code === SKILL_ERROR_CODES.SKILL_MARKDOWN_MISSING)).toBe(true);

    await rm(dir, { recursive: true, force: true });
  });

  it("missing entry file fails when entry is declared", async () => {
    const dir = await mkdtemp(join(tmpdir(), "yutra-skill-missing-entry-"));
    await writeFile(join(dir, "skill.json"), JSON.stringify(sampleManifest, null, 2), "utf8");
    await writeFile(join(dir, "SKILL.md"), "# Test Skill", "utf8");
    const loaded = await loadSkillFromDir(dir);
    const validated = validateLoadedSkill(loaded);
    expect(validated.ok).toBe(false);
    expect(validated.issues.some((i) => i.code === SKILL_ERROR_CODES.SKILL_ENTRY_MISSING)).toBe(true);
    await rm(dir, { recursive: true, force: true });
  });

  it("package exports public API correctly", async () => {
    const mod = await import("../src/index");
    expect(typeof mod.loadSkillFromDir).toBe("function");
    expect(typeof mod.validateSkillManifest).toBe("function");
    expect(typeof mod.validateLoadedSkill).toBe("function");
    expect(typeof mod.discoverSkills).toBe("function");
    expect(typeof mod.createSkillRegistry).toBe("function");
    expect(mod.yutraSkillManifestSchema).toBeTruthy();
  });

  it("discoverSkills finds skills/query-shipping", async () => {
    const discovered = await discoverSkills(["skills"], workspaceRoot);
    expect(discovered.some((item) => item.name === "query_shipping_status" && item.ok)).toBe(true);
  });

  it("discoverSkills tolerates missing directories", async () => {
    const discovered = await discoverSkills(["does-not-exist-skills-dir"], workspaceRoot);
    expect(discovered).toEqual([]);
  });

  it("discoverSkills reports invalid skill without crashing", async () => {
    const root = await mkdtemp(join(tmpdir(), "yutra-skill-discover-invalid-"));
    const invalidDir = join(root, "broken-skill");
    await mkdir(invalidDir, { recursive: true });
    await writeFile(
      join(invalidDir, "skill.json"),
      JSON.stringify({ name: "", version: "0.1.0", type: "tool" }, null, 2),
      "utf8"
    );

    const discovered = await discoverSkills([root], workspaceRoot);
    expect(discovered).toHaveLength(1);
    expect(discovered[0]?.ok).toBe(false);
    expect(discovered[0]?.issues.length).toBeGreaterThan(0);
    await rm(root, { recursive: true, force: true });
  });

  it("registry list returns loaded skills", async () => {
    const registry = createSkillRegistry({ paths: ["skills"], baseDir: workspaceRoot });
    const listed = await registry.list();
    expect(listed.some((item) => item.manifest.name === "query_shipping_status")).toBe(true);
  });

  it("registry get by name works", async () => {
    const registry = createSkillRegistry({ paths: ["skills"], baseDir: workspaceRoot });
    const skill = await registry.get("query_shipping_status");
    expect(skill?.manifest.version).toBe("0.1.0");
  });

  it("registry inspect by path works", async () => {
    const registry = createSkillRegistry({ paths: ["skills"], baseDir: workspaceRoot });
    const skill = await registry.inspect(resolve(workspaceRoot, "skills/query-shipping"));
    expect(skill.manifest.name).toBe("query_shipping_status");
  });

  it("duplicate skill names produce structured issue/warning", async () => {
    const root = await mkdtemp(join(tmpdir(), "yutra-skill-duplicate-"));
    const first = join(root, "skill-one");
    const second = join(root, "skill-two");
    await mkdir(first, { recursive: true });
    await mkdir(second, { recursive: true });
    const manifest = JSON.stringify({ ...sampleManifest, name: "duplicate_name" }, null, 2);
    await writeFile(join(first, "skill.json"), manifest, "utf8");
    await writeFile(join(second, "skill.json"), manifest, "utf8");
    await writeFile(join(first, "SKILL.md"), "# First", "utf8");
    await writeFile(join(second, "SKILL.md"), "# Second", "utf8");
    await mkdir(join(first, "scripts"), { recursive: true });
    await mkdir(join(second, "scripts"), { recursive: true });
    await writeFile(join(first, "scripts/run.mjs"), "export async function run() { return { ok: true }; }", "utf8");
    await writeFile(join(second, "scripts/run.mjs"), "export async function run() { return { ok: true }; }", "utf8");

    const discovered = await discoverSkills([root], workspaceRoot);
    expect(discovered).toHaveLength(2);
    expect(
      discovered.every((item) => item.issues.some((skillIssue) => skillIssue.code === SKILL_ERROR_CODES.SKILL_DUPLICATE_NAME))
    ).toBe(true);
    await rm(root, { recursive: true, force: true });
  });

  it("skillToAction converts query-shipping manifest to ActionSpecLike", async () => {
    const loaded = await loadSkillFromDir(resolve(workspaceRoot, "skills/query-shipping"));
    const action = skillToAction(loaded);
    expect(action.name).toBe("query_shipping_status");
    expect(action.description).toBe("Query shipping status by order id.");
    expect(action.inputSchema).toEqual(loaded.manifest.inputSchema);
    expect(action.outputSchema).toEqual(loaded.manifest.outputSchema);
    expect(action.sideEffect).toBe("read");
    expect(action.riskLevel).toBe("low");
    expect(action.requiresApproval).toBe(false);
    expect(action.implementation.type).toBe("skill");
    expect(action.implementation.skillName).toBe("query_shipping_status");
    expect(action.implementation.skillVersion).toBe("0.1.0");
    expect(action.implementation.entry).toBe("scripts/run.mjs");
    expect(action.implementation.skillDir).toBe(loaded.dir);
  });

  it("skillToAction keeps name/version/description and mapping fields", async () => {
    const loaded = await loadSkillFromDir(resolve(workspaceRoot, "skills/query-shipping"));
    const action = skillToAction(loaded.manifest);
    expect(action.name).toBe(loaded.manifest.name);
    expect(action.description).toBe(loaded.manifest.description);
    expect(action.implementation.skillVersion).toBe(loaded.manifest.version);
    expect(action.metadata?.tags).toEqual(loaded.manifest.tags);
    expect(action.metadata?.allowedEnvironments).toEqual(loaded.manifest.allowedEnvironments);
    expect(action.metadata?.maxCallsPerRun).toBe(loaded.manifest.maxCallsPerRun);
  });

  it("buildSkillActionMap rejects duplicate skill names", async () => {
    const root = await mkdtemp(join(tmpdir(), "yutra-skill-action-dup-"));
    const first = join(root, "skill-one");
    const second = join(root, "skill-two");
    await mkdir(first, { recursive: true });
    await mkdir(second, { recursive: true });
    const manifest = JSON.stringify({ ...sampleManifest, name: "duplicate_action_name" }, null, 2);
    await writeFile(join(first, "skill.json"), manifest, "utf8");
    await writeFile(join(second, "skill.json"), manifest, "utf8");
    await writeFile(join(first, "SKILL.md"), "# First", "utf8");
    await writeFile(join(second, "SKILL.md"), "# Second", "utf8");
    await mkdir(join(first, "scripts"), { recursive: true });
    await mkdir(join(second, "scripts"), { recursive: true });
    await writeFile(join(first, "scripts/run.mjs"), "export async function run() { return { ok: true }; }", "utf8");
    await writeFile(join(second, "scripts/run.mjs"), "export async function run() { return { ok: true }; }", "utf8");

    const loadedOne = await loadSkillFromDir(first);
    const loadedTwo = await loadSkillFromDir(second);
    expect(() => buildSkillActionMap([loadedOne, loadedTwo])).toThrow(/Duplicate skill name/);
    await rm(root, { recursive: true, force: true });
  });

  it("skillToActionRegistry can return structured duplicate issues", async () => {
    const root = await mkdtemp(join(tmpdir(), "yutra-skill-action-dup-issue-"));
    const first = join(root, "skill-one");
    const second = join(root, "skill-two");
    await mkdir(first, { recursive: true });
    await mkdir(second, { recursive: true });
    const manifest = JSON.stringify({ ...sampleManifest, name: "duplicate_issue_name" }, null, 2);
    await writeFile(join(first, "skill.json"), manifest, "utf8");
    await writeFile(join(second, "skill.json"), manifest, "utf8");
    await writeFile(join(first, "SKILL.md"), "# First", "utf8");
    await writeFile(join(second, "SKILL.md"), "# Second", "utf8");
    await mkdir(join(first, "scripts"), { recursive: true });
    await mkdir(join(second, "scripts"), { recursive: true });
    await writeFile(join(first, "scripts/run.mjs"), "export async function run() { return { ok: true }; }", "utf8");
    await writeFile(join(second, "scripts/run.mjs"), "export async function run() { return { ok: true }; }", "utf8");

    const loadedOne = await loadSkillFromDir(first);
    const loadedTwo = await loadSkillFromDir(second);
    const registryResult = skillToActionRegistry([loadedOne, loadedTwo], { onDuplicate: "issue" });
    expect(Object.keys(registryResult.actions)).toHaveLength(1);
    expect(registryResult.issues.some((item) => item.code === SKILL_ERROR_CODES.SKILL_DUPLICATE_NAME)).toBe(true);
    await rm(root, { recursive: true, force: true });
  });

  it("invalid loaded skill cannot be converted", async () => {
    const dir = await mkdtemp(join(tmpdir(), "yutra-skill-action-invalid-"));
    await writeFile(join(dir, "skill.json"), JSON.stringify(sampleManifest, null, 2), "utf8");
    await writeFile(join(dir, "SKILL.md"), "# Test Skill", "utf8");
    const loaded = await loadSkillFromDir(dir);
    expect(() => skillToAction(loaded)).toThrow(/Cannot convert invalid loaded skill/);
    await rm(dir, { recursive: true, force: true });
  });
});
