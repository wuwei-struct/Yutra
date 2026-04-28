import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";
import { buildAuditBundle } from "../../packages/trace/src/audit-bundle";
import { MemoryTraceStorage } from "../../packages/trace/src/memory-storage";
import { loadAndExecuteDslFile } from "../../packages/runtime/src/load-and-execute";

const workspaceRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const packDir = resolve(workspaceRoot, "examples", "ecommerce-support");

function readJson(path: string) {
  return JSON.parse(readFileSync(path, "utf8").replace(/^\uFEFF/, ""));
}

async function loadActionRegistry() {
  const actionsPath = resolve(packDir, "actions.mjs");
  const mod = (await import(pathToFileURL(actionsPath).href)) as {
    actionRegistry?: Record<string, unknown>;
  };
  return mod.actionRegistry ?? {};
}

describe("P3-05 ecommerce real adapter readiness", () => {
  it("real adapter skeleton files exist for all 6 adapter classes", () => {
    const files = [
      "adapters/real/order-adapter.real.example.mjs",
      "adapters/real/shipping-adapter.real.example.mjs",
      "adapters/real/return-adapter.real.example.mjs",
      "adapters/real/refund-adapter.real.example.mjs",
      "adapters/real/escalation-adapter.real.example.mjs",
      "adapters/real/channel-response-adapter.real.example.mjs"
    ];

    for (const file of files) {
      expect(existsSync(resolve(packDir, file))).toBe(true);
    }
  });

  it(".env.example exists and includes required integration keys", () => {
    const envPath = resolve(packDir, ".env.example");
    expect(existsSync(envPath)).toBe(true);
    const env = readFileSync(envPath, "utf8");

    const keys = [
      "YUTRA_ECOM_ADAPTER_MODE",
      "YUTRA_ECOM_API_BASE_URL",
      "YUTRA_ECOM_AUTH_TOKEN",
      "YUTRA_ECOM_TIMEOUT_MS",
      "YUTRA_ECOM_RETRY_MAX_ATTEMPTS",
      "YUTRA_ECOM_RETRY_BACKOFF_MS"
    ];

    for (const key of keys) {
      expect(env.includes(key)).toBe(true);
    }
  });

  it("integration profile exists and is internally consistent", () => {
    const profilePath = resolve(packDir, "integrations/generic-shop-profile/profile.json");
    const adapterMapPath = resolve(packDir, "integrations/generic-shop-profile/adapter-map.json");
    const policyOverridePath = resolve(packDir, "integrations/generic-shop-profile/policy.override.json");

    expect(existsSync(profilePath)).toBe(true);
    expect(existsSync(adapterMapPath)).toBe(true);
    expect(existsSync(policyOverridePath)).toBe(true);

    const profile = readJson(profilePath);
    const adapterMap = readJson(adapterMapPath) as Record<string, string>;

    expect(profile.adapterMode).toBe("real");
    expect(profile.policyOverride).toBe("./policy.override.json");

    for (const key of ["order", "shipping", "return", "refund", "escalation", "channel"]) {
      expect(typeof adapterMap[key]).toBe("string");
      expect(existsSync(resolve(packDir, adapterMap[key]!))).toBe(true);
    }
  });

  it("uat/joint-debug/rollout docs exist", () => {
    const docs = [
      "docs/ecommerce-uat-plan.md",
      "docs/ecommerce-joint-debug-checklist.md",
      "docs/ecommerce-rollout-checklist.md"
    ];

    for (const file of docs) {
      expect(existsSync(resolve(workspaceRoot, file))).toBe(true);
    }
  });

  it("mock mode still runs shipping/refund/handoff paths", async () => {
    const actionRegistry = await loadActionRegistry();
    const specPath = resolve(packDir, "agent.yutra.yaml");
    const cases = [
      { file: "shipping-case.json", expected: "completed" },
      { file: "refund-case.json", expected: "completed" },
      { file: "handoff-case.json", expected: "handoff" }
    ] as const;

    for (const item of cases) {
      const input = readJson(resolve(packDir, "demo-inputs", item.file));
      const result = await loadAndExecuteDslFile(specPath, { actionRegistry }, input);
      expect(result.status).toBe(item.expected);
    }
  });

  it("real adapter dry-run path returns stable contract mapping", async () => {
    const orderAdapter = await import(resolve(packDir, "adapters/order-adapter.mjs"));
    const order = await orderAdapter.getOrderById("EC-DRY-RUN", {
      adapterMode: "real",
      dryRun: true,
      environment: "demo"
    });

    expect(order.found).toBe(true);
    expect(typeof order.order_id).toBe("string");
    expect(typeof order.customer_id).toBe("string");
    expect(typeof order.status).toBe("string");
    expect(typeof order.shipment_status).toBe("string");
    expect(typeof order.adapter_meta).toBe("object");
  });

  it("trace and audit bundle remain exportable after adapter layering", async () => {
    const actionRegistry = await loadActionRegistry();
    const traceStorage = new MemoryTraceStorage();
    const input = readJson(resolve(packDir, "demo-inputs", "handoff-case.json"));
    const result = await loadAndExecuteDslFile(resolve(packDir, "agent.yutra.yaml"), { actionRegistry, traceStorage }, input);

    expect(result.status).toBe("handoff");
    const audit = await buildAuditBundle(traceStorage, result.runId);
    expect(audit.runtimeResult.status).toBe("handoff");
    expect(audit.traceEvents.length).toBeGreaterThan(0);
  });
});
