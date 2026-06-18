import { afterEach, describe, expect, it } from "vitest";
import type { BuilderFormConfig } from "@yutra/builder-core";
import { agentSpecToChineseDsl, ecommerceSupportTemplate, formConfigToAgentSpec } from "@yutra/builder-core";
import { REQUEST_RESOLUTION_ECOMMERCE_BASIC_CONFIG } from "@yutra/pack-config-core";
import { createBuilderRunnerServer } from "../src/server";

const baseForm: BuilderFormConfig = {
  agentName: "电商售后客服",
  version: "0.1.0",
  templateId: "ecommerce-support",
  selectedIntentIds: ["shipping_query", "refund_request", "handoff"],
  selectedSkillNames: ["query_order", "query_shipping_status", "create_refund_request", "create_support_ticket"],
  responseStyle: "service_oriented",
  language: "zh-CN",
  rules: {
    delayedShipmentThresholdHours: 48,
    returnWindowDays: 7,
    highRiskAmountThreshold: 100,
    requireHumanForRefundAfterDelivery: true,
    requireHumanForDamagedGoods: true
  }
};

const startedServers: Array<{ close: () => Promise<void> }> = [];

function buildValidDsl(): string {
  return agentSpecToChineseDsl(formConfigToAgentSpec(baseForm, ecommerceSupportTemplate));
}

async function startServer() {
  const server = createBuilderRunnerServer();
  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve());
  });
  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Failed to bind builder runner test server.");
  }
  startedServers.push({
    close: () =>
      new Promise<void>((resolveClose, rejectClose) => {
        server.close((err) => (err ? rejectClose(err) : resolveClose()));
      })
  });
  return `http://127.0.0.1:${address.port}`;
}

afterEach(async () => {
  while (startedServers.length > 0) {
    const item = startedServers.pop();
    if (item) {
      await item.close();
    }
  }
});

describe("@yutra/builder-runner", () => {
  it("GET /health returns ok", async () => {
    const baseUrl = await startServer();
    const res = await fetch(`${baseUrl}/health`);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; service: string };
    expect(body.ok).toBe(true);
    expect(body.service).toBe("yutra-builder-runner");
  });

  it("POST /dsl/inspect valid YAML returns normalized canonical summary", async () => {
    const baseUrl = await startServer();
    const res = await fetch(`${baseUrl}/dsl/inspect`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dslText: buildValidDsl(), format: "yaml" })
    });
    const body = (await res.json()) as {
      ok: boolean;
      normalized?: unknown;
      canonical?: { agent?: string };
      summary?: { states?: number; skillActions?: number };
      explain?: string;
    };
    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.canonical?.agent).toBe("generated_agent");
    expect(body.summary?.states).toBeGreaterThan(0);
    expect(body.summary?.skillActions).toBeGreaterThan(0);
    expect(body.explain).toContain("=== Canonical IR Summary ===");
  });

  it("POST /dsl/inspect invalid YAML returns structured error", async () => {
    const baseUrl = await startServer();
    const res = await fetch(`${baseUrl}/dsl/inspect`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dslText: "智能体: [", format: "yaml" })
    });
    const body = (await res.json()) as { ok: boolean; error?: { code?: string }; validation?: { ok?: boolean; issues?: unknown[] } };
    expect(res.status).toBe(400);
    expect(body.ok).toBe(false);
    expect(body.error?.code).toBe("DSL_PARSE_ERROR");
    expect(body.validation?.ok).toBe(false);
    expect((body.validation?.issues ?? []).length).toBeGreaterThan(0);
  });

  it("POST /run-preview with default shipping form returns completed", async () => {
    const baseUrl = await startServer();
    const res = await fetch(`${baseUrl}/run-preview`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        form: baseForm,
        input: {
          context: {
            issue_type: "shipping_query",
            order_id: "ORDER-1001"
          }
        }
      })
    });
    const body = (await res.json()) as { ok: boolean; run?: { status: string } };
    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.run?.status).toBe("completed");
  });

  it("POST /run-preview sourceMode=builder still works", async () => {
    const baseUrl = await startServer();
    const res = await fetch(`${baseUrl}/run-preview`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sourceMode: "builder",
        form: baseForm,
        input: {
          context: {
            issue_type: "shipping_query",
            order_id: "ORDER-1001"
          }
        }
      })
    });
    const body = (await res.json()) as { ok: boolean; run?: { status: string } };
    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.run?.status).toBe("completed");
  });

  it("POST /run-preview sourceMode=dsl works and preserves skill trace metadata", async () => {
    const baseUrl = await startServer();
    const res = await fetch(`${baseUrl}/run-preview`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sourceMode: "dsl",
        dslText: buildValidDsl(),
        format: "yaml",
        input: {
          context: {
            issue_type: "shipping_query",
            order_id: "ORDER-1001"
          }
        }
      })
    });
    const body = (await res.json()) as {
      ok: boolean;
      run?: { status: string };
      events?: Array<{ payload?: Record<string, unknown> }>;
    };
    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.run?.status).toBe("completed");
    expect((body.events ?? []).some((event) => event.payload?.implementationType === "skill")).toBe(true);
  });

  it("POST /run-preview sourceMode=dsl invalid DSL does not execute Runtime", async () => {
    const baseUrl = await startServer();
    const res = await fetch(`${baseUrl}/run-preview`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sourceMode: "dsl",
        dslText: "智能体: [",
        format: "yaml",
        input: { context: { issue_type: "shipping_query" } }
      })
    });
    const body = (await res.json()) as { ok: boolean; error?: { code?: string }; events?: unknown[] };
    expect(res.status).toBe(400);
    expect(body.ok).toBe(false);
    expect(body.error?.code).toBe("DSL_PARSE_ERROR");
    expect(body.events).toEqual([]);
  });

  it("POST /run-preview with invalid form returns structured error", async () => {
    const baseUrl = await startServer();
    const res = await fetch(`${baseUrl}/run-preview`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        form: {
          ...baseForm,
          selectedSkillNames: []
        },
        input: {
          context: {
            issue_type: "shipping_query",
            order_id: "ORDER-1001"
          }
        }
      })
    });
    const body = (await res.json()) as { ok: boolean; error?: { code: string }; validation?: { ok: boolean } };
    expect(res.status).toBe(400);
    expect(body.ok).toBe(false);
    expect(body.error?.code).toBe("BUILDER_FORM_INVALID");
    expect(body.validation?.ok).toBe(false);
  });

  it("POST /run-preview returns trace events and traceJsonl and auditBundle", async () => {
    const baseUrl = await startServer();
    const res = await fetch(`${baseUrl}/run-preview`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        form: baseForm,
        input: {
          context: {
            issue_type: "shipping_query",
            order_id: "ORDER-1001"
          }
        }
      })
    });
    const body = (await res.json()) as {
      ok: boolean;
      events?: Array<{ type: string }>;
      traceJsonl?: string;
      auditBundle?: { meta?: { runId?: string } };
    };
    expect(body.ok).toBe(true);
    expect((body.events ?? []).length).toBeGreaterThan(0);
    expect(body.traceJsonl).toContain("\"type\"");
    expect(body.auditBundle?.meta?.runId).toBeTruthy();
  });

  it("handoff sample includes handoff evidence", async () => {
    const baseUrl = await startServer();
    const res = await fetch(`${baseUrl}/run-preview`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        form: baseForm,
        input: {
          context: {
            issue_type: "handoff",
            order_id: "ORDER-NEEDS-HUMAN",
            risk_level: "high"
          }
        }
      })
    });
    const body = (await res.json()) as {
      ok: boolean;
      run?: { status?: string };
      events?: Array<{ type: string }>;
    };
    expect(body.ok).toBe(true);
    expect(body.run?.status === "handoff" || (body.events ?? []).some((event) => event.type === "handoff.requested")).toBe(true);
  });

  it("POST /ai-draft-preview mock returns draft", async () => {
    const baseUrl = await startServer();
    const res = await fetch(`${baseUrl}/ai-draft-preview`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        providerMode: "mock",
        tags: {
          scenario: "ecommerce_support",
          capabilities: ["query_order", "query_shipping_status"],
          strategies: ["full_trace_audit"],
          language: "zh-CN"
        },
        brief: {
          text: "物流超过48小时未更新，需要标记延迟。",
          locale: "zh-CN"
        }
      })
    });
    const body = (await res.json()) as { ok: boolean; draft?: { source?: { type?: string } }; meta?: { providerMode?: string } };
    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.draft?.source?.type).toBe("mock");
    expect(body.meta?.providerMode).toBe("mock");
  });

  it("POST /ai-draft-preview invalid brief returns structured error", async () => {
    const baseUrl = await startServer();
    const res = await fetch(`${baseUrl}/ai-draft-preview`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        providerMode: "mock",
        tags: {
          scenario: "ecommerce_support",
          capabilities: ["query_order"],
          strategies: [],
          language: "zh-CN"
        },
        brief: {
          text: "   ",
          locale: "zh-CN"
        }
      })
    });
    const body = (await res.json()) as { ok: boolean; error?: { code?: string }; issues?: Array<{ code: string }> };
    expect(res.status).toBe(400);
    expect(body.ok).toBe(false);
    expect(body.error?.code).toBe("AI_DRAFT_BRIEF_INVALID");
    expect((body.issues ?? []).some((item) => item.code === "AI_DRAFT_BRIEF_INVALID")).toBe(true);
  });

  it("POST /ai-draft-preview real without config returns structured error", async () => {
    const prev = process.env.YUTRA_BUILDER_AI_PROVIDER;
    process.env.YUTRA_BUILDER_AI_PROVIDER = "mock";
    const baseUrl = await startServer();
    const res = await fetch(`${baseUrl}/ai-draft-preview`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        providerMode: "real",
        tags: {
          scenario: "ecommerce_support",
          capabilities: ["query_order"],
          strategies: [],
          language: "zh-CN"
        },
        brief: {
          text: "请生成草案。",
          locale: "zh-CN"
        }
      })
    });
    const body = (await res.json()) as { ok: boolean; error?: { code?: string; message?: string }; meta?: Record<string, unknown> };
    process.env.YUTRA_BUILDER_AI_PROVIDER = prev;
    expect(res.status).toBe(400);
    expect(body.ok).toBe(false);
    expect(body.error?.code).toBe("AI_DRAFT_REAL_PROVIDER_DISABLED");
    expect(JSON.stringify(body)).not.toContain("YUTRA_BUILDER_AI_API_KEY");
  });

  it("POST /creator/compile-preview valid request-resolution config returns artifacts and report", async () => {
    const baseUrl = await startServer();
    const res = await fetch(`${baseUrl}/creator/compile-preview`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        config: REQUEST_RESOLUTION_ECOMMERCE_BASIC_CONFIG,
        mode: "preview",
        locale: "en"
      })
    });
    const body = (await res.json()) as {
      ok: boolean;
      compilerVersion?: string;
      artifacts?: Record<string, { filename: string }>;
      report?: { packConfigHash?: string; artifactHashes?: Record<string, string>; failClosedPolicy?: string };
      events?: unknown[];
    };

    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.compilerVersion).toBeTruthy();
    expect(body.artifacts?.agent.filename).toBe("agent.yutra.yaml");
    expect(body.artifacts?.policy.filename).toBe("policy.yaml");
    expect(body.artifacts?.adapterConfig.filename).toBe("adapter.config.json");
    expect(body.artifacts?.templates.filename).toBe("templates.json");
    expect(body.artifacts?.testCases.filename).toBe("test-cases.json");
    expect(body.artifacts?.traceExpectation.filename).toBe("trace.expectation.json");
    expect(body.report?.packConfigHash).toMatch(/^sha256:/);
    expect(body.report?.artifactHashes?.["agent.yutra.yaml"]).toMatch(/^sha256:/);
    expect(body.report?.failClosedPolicy).toBe("enabled");
    expect(body.events).toBeUndefined();
  });

  it("POST /creator/compile-preview invalid config returns ok=false", async () => {
    const baseUrl = await startServer();
    const res = await fetch(`${baseUrl}/creator/compile-preview`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        config: {
          ...REQUEST_RESOLUTION_ECOMMERCE_BASIC_CONFIG,
          rules: {
            ...REQUEST_RESOLUTION_ECOMMERCE_BASIC_CONFIG.rules,
            required_demo_field: { source: "requiredButMissing", required: true }
          }
        }
      })
    });
    const body = (await res.json()) as { ok: boolean; error?: { code?: string }; artifacts?: unknown };
    expect(res.status).toBe(400);
    expect(body.ok).toBe(false);
    expect(body.error?.code).toContain("REQUIRED");
    expect(body.artifacts).toBeUndefined();
  });

  it("POST /creator/compile-preview unsupported archetype returns ok=false", async () => {
    const baseUrl = await startServer();
    const res = await fetch(`${baseUrl}/creator/compile-preview`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        config: {
          ...REQUEST_RESOLUTION_ECOMMERCE_BASIC_CONFIG,
          archetypeId: "knowledge-answering"
        }
      })
    });
    const body = (await res.json()) as { ok: boolean; error?: { code?: string }; artifacts?: unknown };
    expect(res.status).toBe(400);
    expect(body.ok).toBe(false);
    expect(body.error?.code).toMatch(/^RULE_COMPILER_/);
    expect(body.artifacts).toBeUndefined();
  });
});
