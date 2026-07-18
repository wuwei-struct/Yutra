import { afterEach, describe, expect, it } from "vitest";
import type { BuilderFormConfig } from "@yutra/builder-core";
import { agentSpecToChineseDsl, ecommerceSupportTemplate, formConfigToAgentSpec } from "@yutra/builder-core";
import type { AgentSpec } from "@yutra/spec";
import {
  APPROVAL_DECISION_BASIC_CONFIG,
  KNOWLEDGE_ANSWERING_BASIC_CONFIG,
  REQUEST_RESOLUTION_ECOMMERCE_BASIC_CONFIG,
  type PackConfig
} from "@yutra/pack-config-core";
import { compilePackConfig } from "@yutra/rule-compiler";
import { assertCompiledActionsResolvable } from "../src/action-closure";
import { creatorDemoActionRegistry } from "../src/actions/creator-demo-action-registry";
import { inspectDslText } from "../src/dsl-inspect";
import { runBuilderPreview } from "../src/run-preview";
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

function compileDemoDsl(config: PackConfig): string {
  const output = compilePackConfig({ config });
  expect(output.ok, JSON.stringify(output.issues, null, 2)).toBe(true);
  return output.artifacts?.agent.content ?? "";
}

function inspectCompiledSpec(dslText: string): AgentSpec {
  const inspected = inspectDslText({ dslText, format: "yaml" });
  expect(inspected.ok).toBe(true);
  if (!inspected.ok) {
    throw new Error(inspected.error.message);
  }
  return inspected.canonical as AgentSpec;
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

  it("resolves every generated Action ID for all three Creator demo archetypes", () => {
    const configs = [
      REQUEST_RESOLUTION_ECOMMERCE_BASIC_CONFIG,
      APPROVAL_DECISION_BASIC_CONFIG,
      KNOWLEDGE_ANSWERING_BASIC_CONFIG
    ];

    for (const config of configs) {
      const result = assertCompiledActionsResolvable({
        compiledDsl: inspectCompiledSpec(compileDemoDsl(config)),
        actionRegistry: creatorDemoActionRegistry
      });
      expect(result.actionIds.length).toBeGreaterThan(0);
      expect(result.unresolvedActionIds).toEqual([]);
    }
    expect(creatorDemoActionRegistry.classify_question_intent).toBeTypeOf("function");
  });

  it("runs the knowledge-answering compiled DSL success path to completion", async () => {
    const response = await runBuilderPreview({
      sourceMode: "dsl",
      dslText: compileDemoDsl(KNOWLEDGE_ANSWERING_BASIC_CONFIG),
      format: "yaml",
      input: {
        context: {
          question_id: "DEMO-Q-SUCCESS",
          question_text: "demo governed question"
        }
      }
    });

    expect(response.ok).toBe(true);
    if (!response.ok) {
      throw new Error(response.error.message);
    }
    expect(response.run.status).toBe("completed");
    expect(response.run.errorCode).toBeUndefined();
    expect(response.events.some((event) => event.type === "action.succeeded")).toBe(true);
    expect(response.events.some((event) => event.type === "transition.resolved")).toBe(true);
    expect(response.events.some((event) => event.type === "run.completed")).toBe(true);
    expect(JSON.stringify(response.events)).not.toContain("RUNTIME_ACTION_NOT_FOUND");
    expect(response.auditBundle).toBeDefined();
  });

  it("keeps knowledge-answering low-confidence and no-answer paths fail-closed", async () => {
    const dslText = compileDemoDsl(KNOWLEDGE_ANSWERING_BASIC_CONFIG);
    const lowConfidence = await runBuilderPreview({
      sourceMode: "dsl",
      dslText,
      input: {
        context: {
          question_id: "DEMO-Q-LOW",
          question_text: "demo ambiguous question",
          confidence_score: 0.4
        }
      }
    });
    const noAnswer = await runBuilderPreview({
      sourceMode: "dsl",
      dslText,
      input: {
        context: {
          question_id: "DEMO-Q-NONE",
          question_text: "demo unsupported question",
          knowledge_hit: false
        }
      }
    });

    expect(lowConfidence.ok).toBe(true);
    expect(noAnswer.ok).toBe(true);
    expect(JSON.stringify(lowConfidence)).toContain("ask_clarification");
    expect(JSON.stringify(noAnswer)).toContain("no_answer");
    expect(JSON.stringify(noAnswer)).toContain("fail_closed");
  });

  it("routes sensitive knowledge questions to demo handoff without real external effects", async () => {
    const response = await runBuilderPreview({
      sourceMode: "dsl",
      dslText: compileDemoDsl(KNOWLEDGE_ANSWERING_BASIC_CONFIG),
      input: {
        context: {
          question_id: "DEMO-Q-SENSITIVE",
          question_text: "demo sensitive question",
          sensitive_question: true
        }
      }
    });

    expect(response.ok).toBe(true);
    if (!response.ok) {
      throw new Error(response.error.message);
    }
    expect(response.run.status).toBe("completed");
    expect(response.timeline.some((item) => item.state === "handoff")).toBe(true);
    expect(response.timeline.some((item) => item.action === "escalate_human" && item.type === "action.succeeded")).toBe(true);
    expect(JSON.stringify(response.events)).toContain('"external_side_effect_executed":false');
    expect(JSON.stringify(response.events)).toContain('"networkAccess":false');
  });

  it("keeps unknown compiled Actions fail-closed with RUNTIME_ACTION_NOT_FOUND", async () => {
    const dslText = compileDemoDsl(KNOWLEDGE_ANSWERING_BASIC_CONFIG).replaceAll(
      "classify_question_intent",
      "unknown_demo_action"
    );
    const response = await runBuilderPreview({ sourceMode: "dsl", dslText, input: { context: {} } });

    expect(response.ok).toBe(true);
    if (!response.ok) {
      throw new Error(response.error.message);
    }
    expect(response.run.status).toBe("failed");
    expect(response.run.errorCode).toBe("RUNTIME_ACTION_NOT_FOUND");
    expect(response.events.some((event) => event.type === "run.failed")).toBe(true);
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
      certificationReadiness?: {
        overall?: string;
        gates?: Array<{ gateId: string; level: string }>;
        certificationBoundary?: { runtimeExecuted?: boolean };
      };
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
    expect(body.certificationReadiness?.overall).toBe("warning");
    expect(body.certificationReadiness?.gates?.some((gate) => gate.gateId === "official_certification" && gate.level === "warning")).toBe(true);
    expect(body.certificationReadiness?.certificationBoundary?.runtimeExecuted).toBe(false);
    expect(body.events).toBeUndefined();
  });

  it("POST /creator/compile-preview valid approval-decision config returns artifacts and report", async () => {
    const baseUrl = await startServer();
    const res = await fetch(`${baseUrl}/creator/compile-preview`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        config: APPROVAL_DECISION_BASIC_CONFIG,
        mode: "preview",
        locale: "en"
      })
    });
    const body = (await res.json()) as {
      ok: boolean;
      artifacts?: Record<string, { filename: string; content?: string }>;
      report?: { packConfigHash?: string; failClosedPolicy?: string };
      certificationReadiness?: { overall?: string; certificationBoundary?: { runtimeExecuted?: boolean } };
      events?: unknown[];
    };

    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.artifacts?.agent.filename).toBe("agent.yutra.yaml");
    expect(body.artifacts?.policy.filename).toBe("policy.yaml");
    expect(body.artifacts?.adapterConfig.filename).toBe("adapter.config.json");
    expect(body.artifacts?.templates.filename).toBe("templates.json");
    expect(body.artifacts?.testCases.filename).toBe("test-cases.json");
    expect(body.artifacts?.traceExpectation.filename).toBe("trace.expectation.json");
    expect(body.artifacts?.agent.content).toContain("approval-decision-basic");
    expect(body.report?.packConfigHash).toMatch(/^sha256:/);
    expect(body.report?.failClosedPolicy).toBe("enabled");
    expect(body.certificationReadiness?.overall).toBe("warning");
    expect(body.certificationReadiness?.certificationBoundary?.runtimeExecuted).toBe(false);
    expect(body.events).toBeUndefined();
  });

  it("POST /creator/compile-preview valid knowledge-answering config returns artifacts and report", async () => {
    const baseUrl = await startServer();
    const res = await fetch(`${baseUrl}/creator/compile-preview`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        config: KNOWLEDGE_ANSWERING_BASIC_CONFIG,
        mode: "preview",
        locale: "en"
      })
    });
    const body = (await res.json()) as {
      ok: boolean;
      artifacts?: Record<string, { filename: string; content?: string }>;
      report?: { packConfigHash?: string; failClosedPolicy?: string };
      certificationReadiness?: { overall?: string; certificationBoundary?: { runtimeExecuted?: boolean } };
      events?: unknown[];
    };

    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.artifacts?.agent.filename).toBe("agent.yutra.yaml");
    expect(body.artifacts?.policy.filename).toBe("policy.yaml");
    expect(body.artifacts?.adapterConfig.filename).toBe("adapter.config.json");
    expect(body.artifacts?.templates.filename).toBe("templates.json");
    expect(body.artifacts?.testCases.filename).toBe("test-cases.json");
    expect(body.artifacts?.traceExpectation.filename).toBe("trace.expectation.json");
    expect(body.artifacts?.agent.content).toContain("knowledge-answering-basic");
    expect(body.report?.packConfigHash).toMatch(/^sha256:/);
    expect(body.report?.failClosedPolicy).toBe("enabled");
    expect(body.certificationReadiness?.overall).toBe("warning");
    expect(body.certificationReadiness?.certificationBoundary?.runtimeExecuted).toBe(false);
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
    const body = (await res.json()) as { ok: boolean; error?: { code?: string }; artifacts?: unknown; certificationReadiness?: { overall?: string } };
    expect(res.status).toBe(400);
    expect(body.ok).toBe(false);
    expect(body.error?.code).toContain("REQUIRED");
    expect(body.artifacts).toBeUndefined();
    expect(body.certificationReadiness?.overall).toBe("blocked");
  });

  it("POST /creator/compile-preview unsupported archetype returns ok=false", async () => {
    const baseUrl = await startServer();
    const res = await fetch(`${baseUrl}/creator/compile-preview`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        config: {
          ...REQUEST_RESOLUTION_ECOMMERCE_BASIC_CONFIG,
          archetypeId: "intake-collector"
        }
      })
    });
    const body = (await res.json()) as { ok: boolean; error?: { code?: string }; artifacts?: unknown };
    expect(res.status).toBe(400);
    expect(body.ok).toBe(false);
    expect(body.error?.code).toMatch(/^RULE_COMPILER_/);
    expect(body.artifacts).toBeUndefined();
  });

  it("GET /creator/scenario-compositions returns three canonical compositions", async () => {
    const baseUrl = await startServer();
    const res = await fetch(`${baseUrl}/creator/scenario-compositions`);
    const body = (await res.json()) as {
      compositions: Array<{
        compositionId: string;
        readiness: { status: string };
        eligibleForCompilePreview: boolean;
        compositionPreviewAvailable: boolean;
        orchestratorPreviewAvailable: boolean;
        orchestratorCompileProfileId?: string;
        orchestratorRuntimeSupported: boolean;
        orchestratorBlockers: string[];
      }>;
    };

    expect(res.status).toBe(200);
    expect(body.compositions).toHaveLength(3);
    expect(
      body.compositions.find((item) => item.compositionId === "customer-complaint-composition-demo")
        ?.eligibleForCompilePreview
    ).toBe(true);
    expect(
      body.compositions.find((item) => item.compositionId === "customer-complaint-composition-demo")
    ).toMatchObject({
      compositionPreviewAvailable: true,
      orchestratorPreviewAvailable: true,
      orchestratorCompileProfileId: "customer-complaint-orchestrator-profile",
      orchestratorRuntimeSupported: false,
      orchestratorBlockers: []
    });
    expect(
      body.compositions.find((item) => item.compositionId === "ecommerce-refund-composition-demo")
        ?.eligibleForCompilePreview
    ).toBe(true);
    const renewal = body.compositions.find(
      (item) => item.compositionId === "renewal-churn-warning-composition-demo"
    );
    expect(renewal?.readiness.status).toBe("contract_only");
    expect(renewal?.eligibleForCompilePreview).toBe(false);
    expect(renewal?.compositionPreviewAvailable).toBe(false);
    expect(renewal?.orchestratorPreviewAvailable).toBe(false);
    expect(renewal?.orchestratorRuntimeSupported).toBe(false);
    expect(renewal?.orchestratorBlockers).toEqual(
      expect.arrayContaining([
        expect.stringContaining("Profile"),
        expect.stringContaining("monitoring-response"),
        expect.stringContaining("data-insight"),
        expect.stringContaining("lead-engagement")
      ])
    );
  });

  it("GET /creator/scenario-compositions/:id returns plan, summary, readiness, and boundary", async () => {
    const baseUrl = await startServer();
    const res = await fetch(
      `${baseUrl}/creator/scenario-compositions/customer-complaint-composition-demo`
    );
    const body = (await res.json()) as {
      plan: { slots?: unknown[] };
      compositionSummary: { primaryOutput?: { en?: string } };
      readiness: { status: string; compositionCompilerAvailable: boolean };
      publicBoundary: { mode: string; containsRealEndpoint: boolean; containsSecret: boolean };
      eligibleForCompilePreview: boolean;
      compositionPreviewAvailable: boolean;
      orchestratorPreviewAvailable: boolean;
      orchestratorCompileProfileId?: string;
      orchestratorRuntimeSupported: boolean;
      orchestratorBlockers: string[];
    };

    expect(res.status).toBe(200);
    expect(body.plan.slots).toHaveLength(3);
    expect(body.compositionSummary.primaryOutput?.en).toBeTruthy();
    expect(body.readiness.status).toBe("compile_ready");
    expect(body.readiness.compositionCompilerAvailable).toBe(true);
    expect(body.publicBoundary).toMatchObject({
      mode: "demo_only",
      containsRealEndpoint: false,
      containsSecret: false
    });
    expect(body.eligibleForCompilePreview).toBe(true);
    expect(body.compositionPreviewAvailable).toBe(true);
    expect(body.orchestratorPreviewAvailable).toBe(true);
    expect(body.orchestratorCompileProfileId).toBe(
      "customer-complaint-orchestrator-profile"
    );
    expect(body.orchestratorRuntimeSupported).toBe(false);
    expect(body.orchestratorBlockers).toEqual([]);
  });

  it.each([
    ["customer-complaint-composition-demo", 3],
    ["ecommerce-refund-composition-demo", 2]
  ])("POST Scenario Composition Compile Preview compiles %s in memory", async (compositionId, slotCount) => {
    const baseUrl = await startServer();
    const res = await fetch(`${baseUrl}/creator/scenario-compositions/compile-preview`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ compositionId })
    });
    const body = (await res.json()) as {
      ok: boolean;
      result?: {
        previewOnly: boolean;
        runtimeExecutable: boolean;
        slots: Array<{ artifacts: Record<string, string> }>;
        compositionArtifacts: Record<string, string>;
      };
    };

    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.result?.previewOnly).toBe(true);
    expect(body.result?.runtimeExecutable).toBe(false);
    expect(body.result?.slots).toHaveLength(slotCount);
    for (const slot of body.result?.slots ?? []) {
      expect(Object.keys(slot.artifacts)).toHaveLength(6);
    }
    expect(Object.keys(body.result?.compositionArtifacts ?? {})).toHaveLength(7);
    expect(body.result?.compositionArtifacts).not.toHaveProperty("orchestrator.yutra.yaml");
    expect(JSON.stringify(body)).not.toContain("RUNTIME_ACTION_NOT_FOUND");
  });

  it("POST Scenario Composition Compile Preview rejects renewal churn without partial artifacts", async () => {
    const baseUrl = await startServer();
    const res = await fetch(`${baseUrl}/creator/scenario-compositions/compile-preview`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ compositionId: "renewal-churn-warning-composition-demo" })
    });
    const body = (await res.json()) as {
      ok: boolean;
      error?: { code?: string };
      result?: unknown;
    };

    expect(res.status).toBe(422);
    expect(body.ok).toBe(false);
    expect(body.error?.code).toBe("COMPOSITION_NOT_COMPILE_READY");
    expect(body.result).toBeUndefined();
  });

  it("Scenario Composition APIs reject unknown IDs and arbitrary request fields", async () => {
    const baseUrl = await startServer();
    const unknown = await fetch(`${baseUrl}/creator/scenario-compositions/not-a-composition`);
    const unknownBody = (await unknown.json()) as { error?: { code?: string } };
    expect(unknown.status).toBe(404);
    expect(unknownBody.error?.code).toBe("SCENARIO_COMPOSITION_NOT_FOUND");

    const invalid = await fetch(`${baseUrl}/creator/scenario-compositions/compile-preview`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        compositionId: "customer-complaint-composition-demo",
        plan: { arbitrary: true }
      })
    });
    const invalidBody = (await invalid.json()) as { error?: { code?: string } };
    expect(invalid.status).toBe(400);
    expect(invalidBody.error?.code).toBe("SCENARIO_COMPOSITION_REQUEST_INVALID");
  });

  it("Scenario Composition Compile Preview rejects oversized requests without exposing internals", async () => {
    const baseUrl = await startServer();
    const res = await fetch(`${baseUrl}/creator/scenario-compositions/compile-preview`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ compositionId: "x".repeat(5000) })
    });
    const body = (await res.json()) as { error?: { code?: string; message?: string } };

    expect(res.status).toBe(400);
    expect(body.error?.code).toBe("SCENARIO_COMPOSITION_REQUEST_INVALID");
    expect(body.error?.message).not.toContain("node_modules");
    expect(body.error?.message).not.toContain(process.cwd());
  });

  it.each([
    ["customer-complaint-composition-demo", 3],
    ["ecommerce-refund-composition-demo", 2]
  ])("POST Scenario Orchestrator Compile Preview compiles %s in memory", async (compositionId, slotCount) => {
    const baseUrl = await startServer();
    const res = await fetch(`${baseUrl}/creator/scenario-orchestrators/compile-preview`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ compositionId })
    });
    const body = (await res.json()) as {
      ok: boolean;
      result?: {
        previewOnly: boolean;
        runtimeExecutable: boolean;
        currentRuntimeSupported: boolean;
        orchestratorDocument: {
          kind: string;
          slots: unknown[];
          tracePolicy: {
            mandatoryEventTypes: string[];
            eventEmissionImplemented: boolean;
          };
        };
        orchestratorArtifacts: Record<string, string>;
        compositionResult: {
          compositionArtifacts: Record<string, string>;
          slots: Array<{ artifacts: Record<string, string> }>;
        };
        compileReport: {
          noAgentDslGenerated: boolean;
          noRuntimeExecution: boolean;
        };
      };
    };

    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.result).toMatchObject({
      previewOnly: true,
      runtimeExecutable: false,
      currentRuntimeSupported: false
    });
    expect(body.result?.orchestratorDocument.kind).toBe("scenario_orchestrator");
    expect(body.result?.orchestratorDocument.slots).toHaveLength(slotCount);
    expect(body.result?.orchestratorDocument.tracePolicy.mandatoryEventTypes).toHaveLength(13);
    expect(body.result?.orchestratorDocument.tracePolicy.eventEmissionImplemented).toBe(false);
    expect(Object.keys(body.result?.orchestratorArtifacts ?? {})).toHaveLength(6);
    expect(body.result?.orchestratorArtifacts).toHaveProperty("scenario.orchestrator.yaml");
    expect(body.result?.orchestratorArtifacts).not.toHaveProperty("agent.yutra.yaml");
    expect(Object.keys(body.result?.compositionResult.compositionArtifacts ?? {})).toHaveLength(7);
    for (const slot of body.result?.compositionResult.slots ?? []) {
      expect(Object.keys(slot.artifacts)).toHaveLength(6);
    }
    expect(body.result?.compileReport).toMatchObject({
      noAgentDslGenerated: true,
      noRuntimeExecution: true
    });
    expect(JSON.stringify(body)).not.toContain(process.cwd());
  });

  it("POST Scenario Orchestrator Compile Preview rejects renewal churn without partial output", async () => {
    const baseUrl = await startServer();
    const res = await fetch(`${baseUrl}/creator/scenario-orchestrators/compile-preview`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ compositionId: "renewal-churn-warning-composition-demo" })
    });
    const body = (await res.json()) as {
      ok: boolean;
      error?: { code?: string; message?: string };
      result?: unknown;
    };

    expect(res.status).toBe(422);
    expect(body.ok).toBe(false);
    expect(body.error?.code).toBe("ORCHESTRATOR_COMPOSITION_NOT_READY");
    expect(body.result).toBeUndefined();
    expect(body.error?.message).not.toContain("node_modules");
    expect(body.error?.message).not.toContain(process.cwd());
  });

  it("Scenario Orchestrator API rejects unknown compositions and client-supplied profiles", async () => {
    const baseUrl = await startServer();
    const unknown = await fetch(`${baseUrl}/creator/scenario-orchestrators/compile-preview`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ compositionId: "not-a-composition" })
    });
    const unknownBody = (await unknown.json()) as { error?: { code?: string } };
    expect(unknown.status).toBe(404);
    expect(unknownBody.error?.code).toBe(
      "SCENARIO_ORCHESTRATOR_COMPOSITION_NOT_FOUND"
    );

    for (const field of ["compileProfile", "plan", "planHash", "routes", "slots"]) {
      const invalid = await fetch(`${baseUrl}/creator/scenario-orchestrators/compile-preview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          compositionId: "customer-complaint-composition-demo",
          [field]: {}
        })
      });
      const invalidBody = (await invalid.json()) as { error?: { code?: string } };
      expect(invalid.status).toBe(400);
      expect(invalidBody.error?.code).toBe(
        "SCENARIO_ORCHESTRATOR_REQUEST_INVALID"
      );
    }
  });

  it("Scenario Orchestrator API rejects oversized requests without exposing internals", async () => {
    const baseUrl = await startServer();
    const res = await fetch(`${baseUrl}/creator/scenario-orchestrators/compile-preview`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ compositionId: "x".repeat(5000) })
    });
    const body = (await res.json()) as { error?: { code?: string; message?: string } };

    expect(res.status).toBe(400);
    expect(body.error?.code).toBe("SCENARIO_ORCHESTRATOR_REQUEST_INVALID");
    expect(body.error?.message).not.toContain("node_modules");
    expect(body.error?.message).not.toContain(process.cwd());
  });
});
