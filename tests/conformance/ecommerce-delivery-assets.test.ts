import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";
import { loadAndExecuteDslFile } from "../../packages/runtime/src/load-and-execute";
import { loadAndValidateDslFile } from "../../packages/dsl/src/index";

const workspaceRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const packDir = resolve(workspaceRoot, "examples", "ecommerce-support");

const requiredDocs = [
  "docs/ecommerce-demo-path.md",
  "docs/ecommerce-demo-script.md",
  "docs/ecommerce-scope-checklist.md",
  "docs/ecommerce-pricing-scope.md",
  "docs/ecommerce-delivery-plan-template.md",
  "docs/ecommerce-delivery-risks.md",
  "docs/ecommerce-deliverables.md",
  "docs/ecommerce-proposal-outline.md"
] as const;

const requiredDemoInputs = [
  "shipping-normal.json",
  "return-eligible.json",
  "refund-before-shipment.json",
  "refund-high-risk.json"
] as const;

async function loadActionRegistry() {
  const actionsPath = resolve(packDir, "actions.mjs");
  const mod = (await import(pathToFileURL(actionsPath).href)) as {
    actionRegistry?: Record<string, unknown>;
  };
  return mod.actionRegistry ?? {};
}

function read(path: string): string {
  return readFileSync(path, "utf8");
}

function collectMarkdownLinks(content: string): string[] {
  const matches = [...content.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)];
  return matches.map((m) => m[1]!).filter((href) => !href.startsWith("http"));
}

describe("P3-04 ecommerce delivery assets", () => {
  it("delivery and proposal docs exist", () => {
    for (const doc of requiredDocs) {
      expect(existsSync(resolve(workspaceRoot, doc))).toBe(true);
    }
  });

  it("demo path references real demo-inputs", () => {
    const pathDoc = read(resolve(workspaceRoot, "docs/ecommerce-demo-path.md"));
    for (const file of requiredDemoInputs) {
      const full = resolve(packDir, "demo-inputs", file);
      expect(existsSync(full)).toBe(true);
      expect(pathDoc.includes(file)).toBe(true);
    }
  });

  it("deliverables doc references generated certification and audit artifacts", () => {
    const deliverables = read(resolve(workspaceRoot, "docs/ecommerce-deliverables.md"));
    expect(deliverables.includes(".yutra/certification/summary.json")).toBe(true);
    expect(deliverables.includes(".yutra/traces/")).toBe(true);
    expect(deliverables.includes(".yutra/audit/")).toBe(true);
  });

  it("README navigation includes ecommerce delivery docs", () => {
    const readme = read(resolve(workspaceRoot, "README.md"));
    const readmeZh = read(resolve(workspaceRoot, "README.zh-CN.md"));
    expect(readme.includes("docs/ecommerce-demo-path.md")).toBe(true);
    expect(readme.includes("docs/ecommerce-pricing-scope.md")).toBe(true);
    expect(readmeZh.includes("docs/ecommerce-demo-path.md")).toBe(true);
    expect(readmeZh.includes("docs/ecommerce-proposal-outline.md")).toBe(true);
  });

  it("delivery docs links resolve to real files or generated artifact locations", () => {
    const docsToCheck = [
      "docs/ecommerce-demo-path.md",
      "docs/ecommerce-demo-script.md",
      "docs/ecommerce-scope-checklist.md",
      "docs/ecommerce-pricing-scope.md",
      "docs/ecommerce-delivery-plan-template.md",
      "docs/ecommerce-delivery-risks.md",
      "docs/ecommerce-deliverables.md",
      "docs/ecommerce-proposal-outline.md"
    ] as const;

    for (const doc of docsToCheck) {
      const content = read(resolve(workspaceRoot, doc));
      const links = collectMarkdownLinks(content);
      for (const href of links) {
        if (href.startsWith(".yutra/")) {
          continue;
        }
        const target = resolve(workspaceRoot, href);
        expect(existsSync(target)).toBe(true);
      }
    }
  });

  it("ecommerce pack still validates and core run paths remain valid", async () => {
    const validation = loadAndValidateDslFile(resolve(packDir, "agent.yutra.yaml"));
    expect(validation.validation.valid).toBe(true);

    const actionRegistry = await loadActionRegistry();
    const shippingInput = JSON.parse(read(resolve(packDir, "demo-inputs", "shipping-case.json"))) as Record<string, unknown>;
    const handoffInput = JSON.parse(read(resolve(packDir, "demo-inputs", "handoff-case.json"))) as Record<string, unknown>;

    const shippingRun = await loadAndExecuteDslFile(resolve(packDir, "agent.yutra.yaml"), { actionRegistry }, shippingInput);
    const handoffRun = await loadAndExecuteDslFile(resolve(packDir, "agent.yutra.yaml"), { actionRegistry }, handoffInput);

    expect(shippingRun.status).toBe("completed");
    expect(handoffRun.status).toBe("handoff");
  });
});
