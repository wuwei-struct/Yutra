import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";
import { loadAndExecuteDslFile } from "../../packages/runtime/src/load-and-execute";
import type { ActionRegistry } from "../../packages/runtime/src/types";

const workspaceRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const packDir = resolve(workspaceRoot, "examples", "ecommerce-support");

function read(path: string): string {
  return readFileSync(path, "utf8");
}

async function loadActionRegistry() {
  const actionsPath = resolve(packDir, "actions.mjs");
  const mod = (await import(pathToFileURL(actionsPath).href)) as {
    actionRegistry?: ActionRegistry;
  };
  return mod.actionRegistry ?? ({} as ActionRegistry);
}

describe("P4-06 skill-based runtime release readiness", () => {
  it("skill-based docs exist", () => {
    const docs = [
      "docs/skill-based-runtime.md",
      "docs/skill-based-demo-path.md",
      "docs/skill-certification-summary.md",
      "docs/release-notes-skill-based-runtime.md"
    ];
    for (const doc of docs) {
      expect(existsSync(resolve(workspaceRoot, doc))).toBe(true);
    }
  });

  it("skill demo path references real commands", () => {
    const demoPath = read(resolve(workspaceRoot, "docs/skill-based-demo-path.md"));
    const requiredCommands = [
      "yutra skill validate",
      "yutra skill inspect",
      "yutra run examples/ecommerce-support/agent.skill.yutra.yaml",
      "yutra trace list",
      "yutra trace export"
    ];
    for (const command of requiredCommands) {
      expect(demoPath.includes(command)).toBe(true);
    }
  });

  it("skill certification summary references real skills", () => {
    const summary = read(resolve(workspaceRoot, "docs/skill-certification-summary.md"));
    const skills = [
      "query_order",
      "query_shipping_status",
      "create_return_request",
      "create_refund_request",
      "create_support_ticket"
    ];
    for (const name of skills) {
      expect(summary.includes(name)).toBe(true);
    }
  });

  it("ecommerce skill pack README links are valid", () => {
    const readme = read(resolve(packDir, "README.md"));
    const links = [
      "docs/skill-based-runtime.md",
      "docs/skill-based-demo-path.md",
      "docs/skill-certification-summary.md",
      "docs/release-notes-skill-based-runtime.md"
    ];
    for (const relative of links) {
      expect(readme.includes(relative)).toBe(true);
      expect(existsSync(resolve(workspaceRoot, relative))).toBe(true);
    }
  });

  it("release notes mention intentional exclusions", () => {
    const notes = read(resolve(workspaceRoot, "docs/release-notes-skill-based-runtime.md"));
    const exclusions = ["Marketplace", "Remote registry", "Install workflow", "Sandbox", "Real customer API", "Skill store"];
    for (const item of exclusions) {
      expect(notes.includes(item)).toBe(true);
    }
  });

  it("skill CLI list still works for ecommerce skills", () => {
    const output = execSync("pnpm exec yutra skill list --skills-dir examples/ecommerce-support/skills", {
      cwd: workspaceRoot,
      encoding: "utf8"
    });
    expect(output.includes("query_shipping_status")).toBe(true);
    expect(output.includes("create_refund_request")).toBe(true);
  });

  it("skill-based ecommerce agent still runs shipping and handoff paths", async () => {
    const actionRegistry = await loadActionRegistry();
    const shippingInput = JSON.parse(read(resolve(packDir, "demo-inputs", "shipping-case.json"))) as Record<string, unknown>;
    const handoffInput = JSON.parse(read(resolve(packDir, "demo-inputs", "handoff-case.json"))) as Record<string, unknown>;

    const shippingRun = await loadAndExecuteDslFile(
      resolve(packDir, "agent.skill.yutra.yaml"),
      {
        actionRegistry,
        skillSearchPaths: [resolve(packDir, "skills")]
      },
      shippingInput
    );
    const handoffRun = await loadAndExecuteDslFile(
      resolve(packDir, "agent.skill.yutra.yaml"),
      {
        actionRegistry,
        skillSearchPaths: [resolve(packDir, "skills")]
      },
      handoffInput
    );

    expect(shippingRun.status).toBe("completed");
    expect(handoffRun.status).toBe("handoff");
  });
});
