import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { loadAndExecuteDslFile } from "../src/load-and-execute";
import { itHelpdeskActions } from "../../../examples/it-helpdesk/actions";

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

describe("@yutra/runtime it-helpdesk minimal run", () => {
  it("can execute it-helpdesk example once", async () => {
    const workspaceRoot = findWorkspaceRoot(process.cwd());
    const dslPath = resolve(workspaceRoot, "examples", "it-helpdesk", "agent.yutra.yaml");
    const inputPath = resolve(workspaceRoot, "examples", "it-helpdesk", "demo-inputs", "case1.json");
    const input = JSON.parse(readFileSync(inputPath, "utf8")) as {
      text?: string;
      intent?: string;
      context?: Record<string, unknown>;
    };

    const result = await loadAndExecuteDslFile(dslPath, { actionRegistry: itHelpdeskActions }, input);

    expect(result.status).toBe("completed");
    expect(result.finalState).toBe("resolved");
    expect(result.context.ticket_status).toBe("closed");
  });

  it("chinese it-helpdesk example can run to completion", async () => {
    const workspaceRoot = findWorkspaceRoot(process.cwd());
    const dslPath = resolve(workspaceRoot, "examples", "it-helpdesk", "agent.zh-CN.yutra.yaml");
    const inputPath = resolve(workspaceRoot, "examples", "it-helpdesk", "demo-inputs", "case1.json");
    const input = JSON.parse(readFileSync(inputPath, "utf8")) as {
      text?: string;
      intent?: string;
      context?: Record<string, unknown>;
    };

    const result = await loadAndExecuteDslFile(dslPath, { actionRegistry: itHelpdeskActions }, input);

    expect(result.status).toBe("completed");
    expect(result.steps).toBeGreaterThan(0);
  });
});
