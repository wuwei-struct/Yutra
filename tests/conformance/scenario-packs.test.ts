import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";
import type { RuntimeResult } from "../../packages/runtime/src/types";
import { loadAndValidateDslFile } from "../../packages/dsl/src/index";
import { loadAndExecuteDslFile } from "../../packages/runtime/src/load-and-execute";

type PackManifest = {
  pack: string;
  version: string;
  domain: string;
  includes: {
    dsl: string[];
    knowledge?: string[];
    tools?: string[];
    policy?: string[];
    inputs?: string[];
    certification?: string[];
    docs?: string[];
  };
  entrypoints?: {
    canonical?: string;
    zhCN?: string;
  };
};

const workspaceRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");

const scenarioPacks = [
  "examples/it-helpdesk",
  "examples/ecommerce-support",
  "examples/approval-agent"
] as const;

const starterPacks = ["starters/minimal-agent-pack", "starters/support-pack"] as const;

const expectedCertificationRefs: Record<string, string[]> = {
  "examples/it-helpdesk": ["it-helpdesk-happy", "it-helpdesk-zh"],
  "examples/ecommerce-support": ["ecommerce-happy"],
  "examples/approval-agent": ["approval-approved", "approval-denied", "approval-handoff"]
};

const runCases: Array<{
  packDir: (typeof scenarioPacks)[number];
  dsl: string;
  input: string;
  expectedStatus: RuntimeResult["status"];
}> = [
  {
    packDir: "examples/it-helpdesk",
    dsl: "agent.yutra.yaml",
    input: "demo-inputs/case1.json",
    expectedStatus: "completed"
  },
  {
    packDir: "examples/ecommerce-support",
    dsl: "agent.yutra.yaml",
    input: "demo-inputs/case1.json",
    expectedStatus: "completed"
  },
  {
    packDir: "examples/approval-agent",
    dsl: "agent.yutra.yaml",
    input: "demo-inputs/case1.json",
    expectedStatus: "completed"
  },
  {
    packDir: "examples/approval-agent",
    dsl: "agent.yutra.yaml",
    input: "demo-inputs/case2.json",
    expectedStatus: "handoff"
  }
];

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

async function loadActionRegistry(packDir: string): Promise<Record<string, unknown>> {
  const actionsPath = resolve(workspaceRoot, packDir, "actions.mjs");
  const mod = (await import(pathToFileURL(actionsPath).href)) as {
    actionRegistry?: Record<string, unknown>;
    default?: Record<string, unknown>;
  };

  return mod.actionRegistry ?? mod.default ?? {};
}

describe("P2-09 scenario packs and starter packs", () => {
  it("every scenario pack has a valid manifest and existing entrypoints", () => {
    for (const packDir of scenarioPacks) {
      const manifestPath = resolve(workspaceRoot, packDir, "pack.manifest.json");
      expect(existsSync(manifestPath)).toBe(true);

      const manifest = readJson<PackManifest>(manifestPath);
      expect(typeof manifest.pack).toBe("string");
      expect(typeof manifest.version).toBe("string");
      expect(typeof manifest.domain).toBe("string");
      expect(Array.isArray(manifest.includes.dsl)).toBe(true);
      expect(manifest.includes.dsl.length).toBeGreaterThan(0);

      const canonicalEntrypoint = manifest.entrypoints?.canonical;
      expect(typeof canonicalEntrypoint).toBe("string");
      expect(existsSync(resolve(workspaceRoot, packDir, canonicalEntrypoint!))).toBe(true);

      if (manifest.entrypoints?.zhCN) {
        expect(existsSync(resolve(workspaceRoot, packDir, manifest.entrypoints.zhCN))).toBe(true);
      }

      for (const relative of manifest.includes.dsl) {
        expect(existsSync(resolve(workspaceRoot, packDir, relative))).toBe(true);
      }

      const certRefs = manifest.includes.certification ?? [];
      expect(certRefs).toEqual(expectedCertificationRefs[packDir]);
    }
  });

  it("every scenario pack entrypoint can validate", () => {
    for (const packDir of scenarioPacks) {
      const manifestPath = resolve(workspaceRoot, packDir, "pack.manifest.json");
      const manifest = readJson<PackManifest>(manifestPath);
      const entrypoints = [manifest.entrypoints?.canonical, manifest.entrypoints?.zhCN].filter(
        (value): value is string => Boolean(value)
      );

      for (const file of entrypoints) {
        const result = loadAndValidateDslFile(resolve(workspaceRoot, packDir, file));
        expect(result.validation.valid).toBe(true);
      }
    }
  });

  it("certified scenario packs still pass core run paths", async () => {
    for (const item of runCases) {
      const actionRegistry = await loadActionRegistry(item.packDir);
      const input = readJson<Record<string, unknown>>(resolve(workspaceRoot, item.packDir, item.input));
      const result = await loadAndExecuteDslFile(resolve(workspaceRoot, item.packDir, item.dsl), { actionRegistry }, input);
      expect(result.status).toBe(item.expectedStatus);
    }
  });

  it("zh-CN and canonical it-helpdesk entrypoints remain aligned", async () => {
    const packDir = "examples/it-helpdesk";
    const actionRegistry = await loadActionRegistry(packDir);
    const input = readJson<Record<string, unknown>>(resolve(workspaceRoot, packDir, "demo-inputs/case1.json"));

    const canonicalRun = await loadAndExecuteDslFile(
      resolve(workspaceRoot, packDir, "agent.yutra.yaml"),
      { actionRegistry },
      input
    );
    const zhRun = await loadAndExecuteDslFile(resolve(workspaceRoot, packDir, "agent.zh-CN.yutra.yaml"), { actionRegistry }, input);

    expect(canonicalRun.status).toBe("completed");
    expect(zhRun.status).toBe("completed");
    expect((canonicalRun.traceEvents ?? []).map((event) => event.type)).toEqual(
      (zhRun.traceEvents ?? []).map((event) => event.type)
    );
  });

  it("starter packs are internally consistent and entrypoint dsl validates", () => {
    for (const starterDir of starterPacks) {
      const manifestPath = resolve(workspaceRoot, starterDir, "pack.manifest.json");
      const readmePath = resolve(workspaceRoot, starterDir, "README.md");
      const inputPath = resolve(workspaceRoot, starterDir, "demo-inputs/case1.json");

      expect(existsSync(manifestPath)).toBe(true);
      expect(existsSync(readmePath)).toBe(true);
      expect(existsSync(inputPath)).toBe(true);

      const manifest = readJson<PackManifest>(manifestPath);
      expect(typeof manifest.entrypoints?.canonical).toBe("string");
      const dslPath = resolve(workspaceRoot, starterDir, manifest.entrypoints!.canonical!);
      expect(existsSync(dslPath)).toBe(true);

      const validation = loadAndValidateDslFile(dslPath);
      expect(validation.validation.valid).toBe(true);
    }
  });

  it("README and walkthrough link to scenario pack docs", () => {
    const readme = readFileSync(resolve(workspaceRoot, "README.md"), "utf8");
    const readmeZh = readFileSync(resolve(workspaceRoot, "README.zh-CN.md"), "utf8");
    const walkthrough = readFileSync(resolve(workspaceRoot, "docs/example-walkthrough.md"), "utf8");
    const scenarioDoc = resolve(workspaceRoot, "docs/scenario-packs.md");

    expect(existsSync(scenarioDoc)).toBe(true);
    expect(readme.includes("docs/scenario-packs.md")).toBe(true);
    expect(readmeZh.includes("docs/scenario-packs.md")).toBe(true);
    expect(walkthrough.includes("docs/scenario-packs.md")).toBe(true);
    expect(readme.includes("starters/minimal-agent-pack")).toBe(true);
  });
});

