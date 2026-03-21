import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";
import type { ActionRegistry, RuntimeInput } from "../src/types";
import { loadAndExecuteDslFile } from "../src/load-and-execute";

function findWorkspaceRoot(start: string): string {
  let current = start;
  while (true) {
    if (existsSync(resolve(current, "pnpm-workspace.yaml"))) {
      return current;
    }
    const parent = dirname(current);
    if (parent === current) {
      return start;
    }
    current = parent;
  }
}

const workspaceRoot = findWorkspaceRoot(process.cwd());

async function loadActionRegistry(exampleDir: string): Promise<ActionRegistry> {
  const modulePath = resolve(workspaceRoot, "examples", exampleDir, "actions.mjs");
  const mod = (await import(pathToFileURL(modulePath).href)) as {
    actionRegistry?: ActionRegistry;
    default?: ActionRegistry;
  };

  return (mod.actionRegistry ?? mod.default ?? {}) as ActionRegistry;
}

function loadJsonInput(exampleDir: string, fileName: string): RuntimeInput {
  const inputPath = resolve(workspaceRoot, "examples", exampleDir, "demo-inputs", fileName);
  return JSON.parse(readFileSync(inputPath, "utf8")) as RuntimeInput;
}

describe("@yutra/runtime examples regression", () => {
  it("it-helpdesk still runs successfully", async () => {
    const dslPath = resolve(workspaceRoot, "examples", "it-helpdesk", "agent.yutra.yaml");
    const input = loadJsonInput("it-helpdesk", "case1.json");
    const registry = await loadActionRegistry("it-helpdesk");
    const result = await loadAndExecuteDslFile(dslPath, { actionRegistry: registry }, input);

    expect(result.status).toBe("completed");
  });

  it("ecommerce-support still runs successfully", async () => {
    const dslPath = resolve(workspaceRoot, "examples", "ecommerce-support", "agent.yutra.yaml");
    const input = loadJsonInput("ecommerce-support", "case1.json");
    const registry = await loadActionRegistry("ecommerce-support");
    const result = await loadAndExecuteDslFile(dslPath, { actionRegistry: registry }, input);

    expect(result.status).toBe("completed");
  });

  it("approval-agent happy path still completes", async () => {
    const dslPath = resolve(workspaceRoot, "examples", "approval-agent", "agent.yutra.yaml");
    const input = loadJsonInput("approval-agent", "case1.json");
    const registry = await loadActionRegistry("approval-agent");
    const result = await loadAndExecuteDslFile(dslPath, { actionRegistry: registry }, input);

    expect(result.status).toBe("completed");
  });

  it("approval-agent handoff case still handoffs", async () => {
    const dslPath = resolve(workspaceRoot, "examples", "approval-agent", "agent.yutra.yaml");
    const input = loadJsonInput("approval-agent", "case2.json");
    const registry = await loadActionRegistry("approval-agent");
    const result = await loadAndExecuteDslFile(dslPath, { actionRegistry: registry }, input);

    expect(result.status).toBe("handoff");
  });

  it("approval-agent denied case reaches denied final path", async () => {
    const dslPath = resolve(workspaceRoot, "examples", "approval-agent", "agent.yutra.yaml");
    const input = loadJsonInput("approval-agent", "case3.json");
    const registry = await loadActionRegistry("approval-agent");
    const result = await loadAndExecuteDslFile(dslPath, { actionRegistry: registry }, input);

    expect(result.status).toBe("completed");
    expect(result.finalState).toBe("denied");
  });
});
