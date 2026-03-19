import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { loadAndExecuteDslFile } from "../src/load-and-execute";
import { itHelpdeskActions } from "../../../examples/it-helpdesk/actions";

describe("@yutra/runtime it-helpdesk minimal run", () => {
  it("can execute it-helpdesk example once", async () => {
    const dslPath = resolve(process.cwd(), "examples", "it-helpdesk", "agent.yutra.yaml");
    const inputPath = resolve(process.cwd(), "examples", "it-helpdesk", "demo-inputs", "case1.json");
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
});
