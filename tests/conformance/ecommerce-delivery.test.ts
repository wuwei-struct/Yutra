import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";
import { loadAndValidateDslFile } from "../../packages/dsl/src/index";
import { loadAndExecuteDslFile } from "../../packages/runtime/src/load-and-execute";
import { buildAuditBundle } from "../../packages/trace/src/audit-bundle";
import { MemoryTraceStorage } from "../../packages/trace/src/memory-storage";

type ScenarioDefinition = {
  id: string;
  input: string;
};

type ScenarioConfig = {
  scenarios: ScenarioDefinition[];
};

const workspaceRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const packDir = resolve(workspaceRoot, "examples", "ecommerce-support");

function readJson<T>(filePath: string): T {
  const raw = readFileSync(filePath, "utf8").replace(/^\uFEFF/, "");
  return JSON.parse(raw) as T;
}

async function loadActionRegistry() {
  const actionsPath = resolve(packDir, "actions.mjs");
  const mod = (await import(pathToFileURL(actionsPath).href)) as {
    actionRegistry?: Record<string, unknown>;
  };
  return mod.actionRegistry ?? {};
}

describe("P3-02 ecommerce business-depth certification", () => {
  it("ecommerce pack manifest is valid and delivery docs exist", () => {
    const manifestPath = resolve(packDir, "pack.manifest.json");
    expect(existsSync(manifestPath)).toBe(true);

    const manifest = readJson<Record<string, unknown>>(manifestPath);
    expect(manifest.pack).toBe("ecommerce-support-pack");

    const includes = manifest.includes as Record<string, string[]>;
    for (const section of ["dsl", "knowledge", "tools", "policy", "inputs", "certification", "docs"]) {
      expect(Array.isArray(includes[section])).toBe(true);
      expect(includes[section]!.length).toBeGreaterThan(0);
    }

    for (const doc of ["DELIVERY.md", "CONFIG.md", "SOP.md"]) {
      expect(existsSync(resolve(packDir, doc))).toBe(true);
    }
  });

  it("shipping scenarios are certified (normal/delayed/exception)", async () => {
    const actionRegistry = await loadActionRegistry();
    const cases = [
      { file: "shipping-normal.json", status: "completed" },
      { file: "shipping-delayed.json", status: "completed" },
      { file: "shipping-exception.json", status: "handoff" }
    ] as const;

    for (const item of cases) {
      const input = readJson<Record<string, unknown>>(resolve(packDir, "demo-inputs", item.file));
      const result = await loadAndExecuteDslFile(resolve(packDir, "agent.yutra.yaml"), { actionRegistry }, input);
       expect(result.status).toBe(item.status);
    }
  });

  it("return scenarios are certified (eligible/expired/damaged)", async () => {
    const actionRegistry = await loadActionRegistry();
    const cases = [
      { file: "return-eligible.json", status: "completed" },
      { file: "return-expired.json", status: "completed" },
      { file: "return-damaged.json", status: "handoff" }
    ] as const;

    for (const item of cases) {
      const input = readJson<Record<string, unknown>>(resolve(packDir, "demo-inputs", item.file));
      const result = await loadAndExecuteDslFile(resolve(packDir, "agent.yutra.yaml"), { actionRegistry }, input);
       expect(result.status).toBe(item.status);
    }
  });

  it("refund scenarios are certified (before-shipment/after-delivery/high-risk)", async () => {
    const actionRegistry = await loadActionRegistry();
    const cases = [
      { file: "refund-before-shipment.json", status: "completed" },
      { file: "refund-after-delivery.json", status: "completed" },
      { file: "refund-high-risk.json", status: "handoff" }
    ] as const;

    for (const item of cases) {
      const input = readJson<Record<string, unknown>>(resolve(packDir, "demo-inputs", item.file));
      const result = await loadAndExecuteDslFile(resolve(packDir, "agent.yutra.yaml"), { actionRegistry }, input);
       expect(result.status).toBe(item.status);
    }
  });

  it("at least two distinct handoff reasons are certified", async () => {
    const actionRegistry = await loadActionRegistry();
    const cases = ["shipping-exception.json", "return-damaged.json", "refund-high-risk.json"];
    const reasons = new Set<string>();

    for (const file of cases) {
      const input = readJson<Record<string, unknown>>(resolve(packDir, "demo-inputs", file));
      const result = await loadAndExecuteDslFile(resolve(packDir, "agent.yutra.yaml"), { actionRegistry }, input);
      expect(result.status).toBe("handoff");
      if (typeof result.context.handoff_reason === "string") {
        reasons.add(result.context.handoff_reason);
      }
    }

    expect(reasons.size).toBeGreaterThanOrEqual(2);
  });

  it("policy parameter change affects runtime outcome deterministically", async () => {
    const actionRegistry = await loadActionRegistry();
    const base = readJson<Record<string, unknown>>(resolve(packDir, "demo-inputs", "refund-after-delivery.json"));

    const autoCase = {
      ...base,
      context: {
        ...((base.context ?? {}) as Record<string, unknown>),
        policy_params: {
          requireHumanForRefundAfterDelivery: false,
          highRiskAmountThreshold: 5000
        }
      }
    };

    const strictCase = {
      ...base,
      context: {
        ...((base.context ?? {}) as Record<string, unknown>),
        policy_params: {
          requireHumanForRefundAfterDelivery: true,
          highRiskAmountThreshold: 100
        }
      }
    };

    const autoRun = await loadAndExecuteDslFile(resolve(packDir, "agent.yutra.yaml"), { actionRegistry }, autoCase);
    const strictRun = await loadAndExecuteDslFile(resolve(packDir, "agent.yutra.yaml"), { actionRegistry }, strictCase);

     expect(autoRun.status).toBe("completed");
    expect(strictRun.status).toBe("handoff");
  });

  it("response templates are present and consistently referenced in docs", () => {
    const templates = ["shipping.md", "return.md", "refund.md", "handoff.md"];
    const readme = readFileSync(resolve(packDir, "README.md"), "utf8");
    const config = readFileSync(resolve(packDir, "CONFIG.md"), "utf8");
    const sop = readFileSync(resolve(packDir, "SOP.md"), "utf8");

    for (const template of templates) {
      expect(existsSync(resolve(packDir, "response-templates", template))).toBe(true);
      expect(readme.includes(template)).toBe(true);
      expect(config.includes(template)).toBe(true);
    }

    expect(sop.includes("handoff")).toBe(true);
  });

  it("trace and audit bundle can be exported for handoff paths", async () => {
    const actionRegistry = await loadActionRegistry();
    const input = readJson<Record<string, unknown>>(resolve(packDir, "demo-inputs", "handoff-missing-info.json"));
    const traceStorage = new MemoryTraceStorage();

    const result = await loadAndExecuteDslFile(
      resolve(packDir, "agent.yutra.yaml"),
      { actionRegistry, traceStorage },
      input
    );

    expect(result.status).toBe("handoff");
    const audit = await buildAuditBundle(traceStorage, result.runId);
    expect(audit.runtimeResult.status).toBe("handoff");
    expect(audit.traceEvents.length).toBeGreaterThan(0);
  });

  it("scenario and expected-outcomes files are aligned", () => {
    const scenarioFile = resolve(packDir, "certification", "scenarios.json");
    const scenarios = readJson<ScenarioConfig>(scenarioFile).scenarios;
    const outcomes = readJson<{ outcomes: Record<string, unknown> }>(resolve(packDir, "certification", "expected-outcomes.json"));

    for (const scenario of scenarios) {
      expect(outcomes.outcomes[scenario.id]).toBeTruthy();
    }
  });

  it("main ecommerce entrypoint remains valid", () => {
    const result = loadAndValidateDslFile(resolve(packDir, "agent.yutra.yaml"));
    expect(result.validation.valid).toBe(true);
  });
});


