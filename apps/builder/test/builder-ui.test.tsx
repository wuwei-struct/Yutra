// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import * as aiDraftCore from "@yutra/builder-ai-core";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "../src/App";
import { I18nProvider, STUDIO_LOCALE_STORAGE_KEY, resolveInitialLocale } from "../src/i18n";
import { generateDraftPreview } from "../src/lib/ai-draft-client";
import { compileCreatorPreview } from "../src/lib/creator-client";
import { inspectDsl, runPreview } from "../src/lib/runner-client";

vi.mock("../src/lib/runner-client", () => ({
  inspectDsl: vi.fn(),
  runPreview: vi.fn()
}));

vi.mock("../src/lib/ai-draft-client", () => ({
  generateDraftPreview: vi.fn()
}));

vi.mock("../src/lib/creator-client", () => ({
  compileCreatorPreview: vi.fn()
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  window.localStorage.clear();
});

function renderStudio() {
  return render(
    <I18nProvider>
      <App />
    </I18nProvider>
  );
}

function mockCompletedRun() {
  vi.mocked(runPreview).mockResolvedValue({
    ok: true,
    validation: { ok: true, issues: [] },
    run: {
      runId: "studio-run-1",
      status: "completed",
      agent: "builder-agent",
      initialState: "triage",
      finalState: "resolved",
      matchedIntent: "shipping_query",
      steps: 2
    },
    events: [
      { id: "event-1", type: "run.started", ts: "2026-01-01T00:00:00.000Z", payload: { input: { context: {} } } },
      {
        id: "event-2",
        type: "action.succeeded",
        ts: "2026-01-01T00:00:01.000Z",
        state: "query_shipping",
        action: "query_shipping_status",
        payload: {
          implementationType: "skill",
          skillName: "query_shipping_status",
          durationMs: 8,
          output: { status: "in_transit" },
          contextDelta: { shipping_status: "in_transit" }
        }
      }
    ],
    timeline: [
      { index: 0, type: "run.started", state: "triage" },
      {
        index: 1,
        type: "action.succeeded",
        state: "query_shipping",
        action: "query_shipping_status",
        implementationType: "skill",
        skillName: "query_shipping_status",
        status: "ok"
      }
    ],
    traceJsonl: "{\"type\":\"run.started\"}\n",
    auditBundle: {
      handoffOrErrorSummary: {
        handoff: false,
        failed: false
      }
    }
  });
}

function mockDslInspectSuccess() {
  vi.mocked(inspectDsl).mockResolvedValue({
    ok: true,
    format: "yaml",
    raw: { ["\u667a\u80fd\u4f53"]: "\u7535\u5546\u552e\u540e\u5ba2\u670d" },
    normalized: { agent: "\u7535\u5546\u552e\u540e\u5ba2\u670d" },
    canonical: {
      agent: "generated_agent",
      initial_state: "triage",
      states: { triage: { transitions: [{ to: "resolved" }] }, resolved: { final: true } },
      actions: [{ name: "query_shipping_status", implementation: { type: "skill", skillName: "query_shipping_status" } }],
      intents: [{ name: "shipping_query" }]
    },
    validation: { ok: true, issues: [] },
    explain: "=== Canonical IR Summary ===\nagent: generated_agent",
    summary: { agent: "generated_agent", states: 2, actions: 1, intents: 1, transitions: 1, handoffStates: 0, skillActions: 1 },
    mappings: { fieldAliases: [{ from: "\u667a\u80fd\u4f53", to: "agent" }], canonicalNames: [] },
    warnings: []
  });
}

function mockDslInspectFailure() {
  vi.mocked(inspectDsl).mockResolvedValue({
    ok: false,
    format: "yaml",
    error: { code: "DSL_PARSE_ERROR", message: "Failed to parse YAML DSL source." },
    validation: {
      ok: false,
      issues: [{ code: "DSL_PARSE_ERROR", message: "Failed to parse YAML DSL source.", severity: "error", path: ["agent"] }]
    }
  });
}

function mockCompilePreviewSuccess(options?: { agentName?: string; archetypeId?: string; packConfigId?: string }) {
  const agentName = options?.agentName ?? "request-resolution-ecommerce-basic";
  const archetypeId = options?.archetypeId ?? "request-resolution";
  const packConfigId = options?.packConfigId ?? "request-resolution:ecommerce-basic-demo";
  vi.mocked(compileCreatorPreview).mockResolvedValue({
    ok: true,
    compileId: "compile:test",
    compilerVersion: "0.1.0",
    mode: "preview",
    artifacts: {
      agent: {
        filename: "agent.yutra.yaml",
        kind: "agent",
        data: `agent: ${agentName}`,
        content: `agent: ${agentName}\n`,
        contentType: "text/yaml",
        hash: "sha256:agent"
      },
      policy: {
        filename: "policy.yaml",
        kind: "policy",
        data: {},
        content: "environment: demo\n",
        contentType: "text/yaml",
        hash: "sha256:policy"
      },
      adapterConfig: {
        filename: "adapter.config.json",
        kind: "adapter_config",
        data: { adapters: [] },
        content: "{\"adapters\":[]}",
        contentType: "application/json",
        hash: "sha256:adapter"
      },
      templates: {
        filename: "templates.json",
        kind: "templates",
        data: {},
        content: "{\"templates\":[]}",
        contentType: "application/json",
        hash: "sha256:templates"
      },
      testCases: {
        filename: "test-cases.json",
        kind: "test_cases",
        data: {},
        content: "{\"testCases\":[]}",
        contentType: "application/json",
        hash: "sha256:test"
      },
      traceExpectation: {
        filename: "trace.expectation.json",
        kind: "trace_expectation",
        data: {},
        content: "{\"expectedEventTypes\":[\"run.started\"]}",
        contentType: "application/json",
        hash: "sha256:trace"
      }
    },
    report: {
      status: "passed",
      archetypeId,
      archetypeVersion: "0.1.0",
      packConfigId,
      packConfigVersion: "0.1.0",
      packConfigHash: "sha256:config",
      compilerVersion: "0.1.0",
      mode: "preview",
      coverage: {
        schema: "passed",
        requiredFields: "covered",
        transitions: "fallback_covered",
        actions: "registered",
        guards: "registered",
        sideEffects: "policy_guarded",
        handoff: "covered"
      },
      failClosedPolicy: "enabled",
      artifactHashes: {
        "agent.yutra.yaml": "sha256:agent",
        "policy.yaml": "sha256:policy",
        "adapter.config.json": "sha256:adapter",
        "templates.json": "sha256:templates",
        "test-cases.json": "sha256:test",
        "trace.expectation.json": "sha256:trace"
      },
      warnings: []
    },
    certificationReadiness: {
      overall: "warning",
      environment: "demo",
      summary: {
        en: "Certification readiness is suitable for demo review only.",
        zhCN: "认证准备度仅适合 demo 评审。"
      },
      gates: [
        {
          gateId: "compile",
          level: "ready",
          label: { en: "Compile", zhCN: "编译" },
          message: { en: "Compile preview passed.", zhCN: "Compile Preview 通过。" },
          evidence: { ok: true }
        },
        {
          gateId: "artifacts",
          level: "ready",
          label: { en: "Artifacts", zhCN: "产物" },
          message: { en: "All six artifacts are present.", zhCN: "6 类产物均存在。" }
        },
        {
          gateId: "test_cases",
          level: "ready",
          label: { en: "Test Cases", zhCN: "测试用例" },
          message: { en: "Demo test cases exist.", zhCN: "Demo 测试用例存在。" }
        },
        {
          gateId: "trace_expectation",
          level: "ready",
          label: { en: "Trace Expectation", zhCN: "Trace 预期" },
          message: { en: "Trace expectation exists.", zhCN: "Trace 预期存在。" }
        },
        {
          gateId: "fail_closed",
          level: "ready",
          label: { en: "Fail-Closed", zhCN: "Fail-Closed" },
          message: { en: "Fail-closed coverage exists.", zhCN: "Fail-closed 覆盖存在。" }
        },
        {
          gateId: "publish_gate",
          level: "warning",
          label: { en: "Publish Gate", zhCN: "发布门禁" },
          message: { en: "Preview mode is not publish-approved.", zhCN: "Preview 模式不代表发布批准。" }
        },
        {
          gateId: "side_effect",
          level: "ready",
          label: { en: "Side Effect", zhCN: "副作用" },
          message: { en: "Side effects are policy guarded.", zhCN: "副作用已受策略保护。" }
        },
        {
          gateId: "adapter_safety",
          level: "ready",
          label: { en: "Adapter Safety", zhCN: "Adapter 安全" },
          message: { en: "Mock adapter safe.", zhCN: "Mock adapter 安全。" }
        },
        {
          gateId: "manual_runtime_run",
          level: "warning",
          label: { en: "Manual Runtime Run", zhCN: "手动 Runtime 运行" },
          message: { en: "Run Preview has not been executed in this readiness panel.", zhCN: "该面板未执行 Run Preview。" }
        },
        {
          gateId: "official_certification",
          level: "warning",
          label: { en: "Official Certification", zhCN: "正式认证" },
          message: { en: "This is not an official certification result.", zhCN: "这不是正式认证结果。" }
        }
      ],
      artifactStatus: {
        agent: true,
        policy: true,
        adapterConfig: true,
        templates: true,
        testCases: true,
        traceExpectation: true
      },
      counts: {
        testCases: 4,
        traceExpectations: 10,
        errors: 0,
        warnings: 0,
        ruleImpacts: 18
      },
      certificationBoundary: {
        previewOnly: true,
        runtimeExecuted: false,
        officialCertificationRun: false,
        productionReady: false
      }
    },
    issues: []
  });
}

function mockCompilePreviewFailure() {
  vi.mocked(compileCreatorPreview).mockResolvedValue({
    ok: false,
    error: { code: "RULE_COMPILER_REQUIRED_FIELD_MISSING", message: "Required field missing." },
    issues: [{ code: "RULE_COMPILER_REQUIRED_FIELD_MISSING", severity: "error", message: "Required field missing." }]
  });
}

async function inspectAndApplyDsl() {
  fireEvent.click(screen.getByRole("button", { name: "Inspect DSL" }));
  await waitFor(() => expect((screen.getByRole("button", { name: "Apply DSL as Run Source" }) as HTMLButtonElement).disabled).toBe(false));
  fireEvent.click(screen.getByRole("button", { name: "Apply DSL as Run Source" }));
  await waitFor(() => expect(screen.getByText("DSL Source active")).toBeTruthy());
}

describe("@yutra/builder Studio UI", () => {
  it("resolves zh-CN when browser language starts with zh", () => {
    expect(resolveInitialLocale({ navigatorLanguage: "zh-CN" })).toBe("zh-CN");
    expect(resolveInitialLocale({ navigatorLanguage: "zh-Hans" })).toBe("zh-CN");
  });

  it("resolves en when browser language is not zh", () => {
    expect(resolveInitialLocale({ navigatorLanguage: "en-US" })).toBe("en");
    expect(resolveInitialLocale({ navigatorLanguage: "fr-FR" })).toBe("en");
  });

  it("manual language switch updates TopBar and Sidebar labels", () => {
    renderStudio();
    fireEvent.change(screen.getByLabelText("Studio Language"), { target: { value: "zh-CN" } });
    expect(screen.getByText("我的 Agent")).toBeTruthy();
    expect(screen.getByText("草稿")).toBeTruthy();
    expect(screen.getByText("预览 Agent")).toBeTruthy();

    fireEvent.change(screen.getByLabelText("Studio Language"), { target: { value: "en" } });
    expect(screen.getByText("My Agent")).toBeTruthy();
    expect(screen.getByText("Draft")).toBeTruthy();
  });

  it("selected locale persists to localStorage", () => {
    renderStudio();
    fireEvent.change(screen.getByLabelText("Studio Language"), { target: { value: "zh-CN" } });
    expect(window.localStorage.getItem(STUDIO_LOCALE_STORAGE_KEY)).toBe("zh-CN");
  });

  it("stored zh-CN locale renders Chinese labels by default", () => {
    window.localStorage.setItem(STUDIO_LOCALE_STORAGE_KEY, "zh-CN");
    renderStudio();
    expect(screen.getByText("我的 Agent")).toBeTruthy();
    expect(screen.getByText("自然语言生成草案")).toBeTruthy();
  });

  it("Chinese locale does not translate DSL text or trace event type values", async () => {
    window.localStorage.setItem(STUDIO_LOCALE_STORAGE_KEY, "zh-CN");
    mockCompletedRun();
    renderStudio();
    expect((screen.getByLabelText("DSL Editor Text") as HTMLTextAreaElement).value).toContain("智能体:");
    fireEvent.click(screen.getByRole("button", { name: "运行预览" }));
    await waitFor(() => {
      expect(screen.getByLabelText("Trace Timeline").textContent).toContain("action.succeeded");
      expect(screen.getByLabelText("Trace Timeline").textContent).toContain("query_shipping_status");
    });
  });

  it("Studio shell renders", () => {
    renderStudio();
    expect(screen.getByText("Yutra Studio")).toBeTruthy();
    expect(screen.getByLabelText("Agent Editor Workbench")).toBeTruthy();
  });

  it("Sidebar navigation renders", () => {
    renderStudio();
    expect(screen.getByLabelText("Studio Navigation")).toBeTruthy();
    expect(screen.getByText("My Agent")).toBeTruthy();
    expect(screen.getByText("Scenario Packs")).toBeTruthy();
    fireEvent.click(screen.getByText("Dashboard"));
    expect(screen.getByLabelText("Coming Soon")).toBeTruthy();
  });

  it("Top bar renders current agent title", () => {
    renderStudio();
    expect(screen.getByLabelText("Studio Top Bar").textContent).toContain("My Agent /");
    expect(screen.getByText("Draft")).toBeTruthy();
    expect(screen.getByText("Not persisted")).toBeTruthy();
  });

  it("Draft assistant panel renders", () => {
    renderStudio();
    expect(screen.getByLabelText("AI Draft Assistant")).toBeTruthy();
    expect(screen.getByLabelText("AI Draft Brief")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Generate Draft" })).toBeTruthy();
  });

  it("Creator Workbench panel renders", () => {
    renderStudio();
    expect(screen.getByLabelText("Creator Workbench")).toBeTruthy();
    expect(screen.getByLabelText("Creator Workbench Header")).toBeTruthy();
    expect(screen.getByLabelText("Current Archetype Taxonomy Summary").textContent).toContain("business action result");
    expect(screen.getByLabelText("Creator Boundary Notice").textContent).toContain("No automatic Runtime execution");
    expect(screen.getByLabelText("Compile Preview Panel")).toBeTruthy();
  });

  it("Creator Workflow stepper renders the manual creation flow", () => {
    renderStudio();
    const workflow = screen.getByLabelText("Creator Workflow");
    expect(workflow.textContent).toContain("Select archetype");
    expect(workflow.textContent).toContain("Configure business rules");
    expect(workflow.textContent).toContain("Send to DSL editor");
    expect(workflow.textContent).toContain("Run preview manually");
  });

  it("request-resolution and approval-decision are enabled and other archetypes are disabled", () => {
    renderStudio();
    expect((screen.getByRole("button", { name: /request-resolution/ }) as HTMLButtonElement).disabled).toBe(false);
    expect((screen.getByRole("button", { name: /approval-decision/ }) as HTMLButtonElement).disabled).toBe(false);
    expect(screen.getByLabelText("Archetype Selector").textContent).toContain("selected");
    expect(screen.getAllByText("Coming soon").length).toBeGreaterThan(0);
  });

  it("Archetype selector renders taxonomy cards and primitive chips", () => {
    renderStudio();
    const selector = screen.getByLabelText("Archetype Selector");
    expect(selector.textContent).toContain("Primary Output");
    expect(selector.textContent).toContain("business action result");
    expect(selector.textContent).toContain("authorization decision");
    expect(selector.textContent).toContain("Behavior Primitives");
    expect(selector.textContent).toContain("evaluate");
    expect(selector.textContent).toContain("Cross-cutting capability");
    expect(selector.textContent).toContain("Not a standalone creator flow yet");
  });

  it("Archetype Detail Panel shows trigger pattern for focused archetype", () => {
    renderStudio();
    expect(screen.getByLabelText("Archetype Detail Panel").textContent).toContain("user_request");
    fireEvent.click(screen.getByRole("button", { name: /approval-decision/ }));
    expect(screen.getByLabelText("Archetype Detail Panel").textContent).toContain("approval-decision");
    expect(screen.getByLabelText("Archetype Detail Panel").textContent).toContain("human_initiated");
  });

  it("Archetype Fit Test Panel renders selection guidance", () => {
    renderStudio();
    const fitTest = screen.getByLabelText("Archetype Fit Test Panel");
    expect(fitTest.textContent).toContain("What is the primary output?");
    expect(fitTest.textContent).toContain("If the output is a business action result");
    expect(fitTest.textContent).toContain("If the output is an authorization decision");
  });

  it("request-resolution config editor renders fields and mock adapter summary", () => {
    renderStudio();
    expect(screen.getByLabelText("Request Resolution Config Editor")).toBeTruthy();
    expect(screen.getByLabelText("autoRefundMaxAmount")).toBeTruthy();
    expect(screen.getByLabelText("Adapter Mode Summary").textContent).toContain("containsRealEndpoint=false");
  });

  it("approval-decision config editor renders Approval Policy and Risk Policy", () => {
    renderStudio();
    fireEvent.click(screen.getByRole("button", { name: /approval-decision/ }));
    expect(screen.getByLabelText("Approval Decision Config Editor")).toBeTruthy();
    expect(screen.getByText("Approval Policy")).toBeTruthy();
    expect(screen.getByText("Risk Policy")).toBeTruthy();
    expect(screen.getByLabelText("lowRiskMaxAmount")).toBeTruthy();
    expect(screen.getByLabelText("PackConfig Preview").textContent).toContain('"archetypeId": "approval-decision"');
    expect(screen.getByLabelText("Adapter Mode Summary").textContent).toContain("containsRealEndpoint=false");
  });

  it("Creator Workbench renders rule impact controls", () => {
    renderStudio();
    expect(screen.getByLabelText("Rule Impact Panel")).toBeTruthy();
    expect(screen.getAllByRole("button", { name: "Impact" }).length).toBeGreaterThan(0);
    expect(screen.getByLabelText("Rule Impact Panel").textContent).toContain("autoRefundMaxAmount");
  });

  it("clicking autoRefundMaxAmount impact shows high_value_refund and affected artifacts", () => {
    renderStudio();
    const amountInput = screen.getByLabelText("autoRefundMaxAmount");
    const amountRow = amountInput.closest(".creator-field-row");
    const impactButton = amountRow?.querySelector("button");
    expect(impactButton).toBeTruthy();
    fireEvent.click(impactButton!);
    expect(screen.getByLabelText("Rule Impact Panel").textContent).toContain("high_value_refund");
    expect(screen.getByLabelText("Rule Impact Panel").textContent).toContain("policy.yaml");
    expect(screen.getByLabelText("Rule Impact Panel").textContent).toContain("trace.expectation.json");
  });

  it("editing autoRefundMaxAmount updates Pack Config state and source confirmedByUser", () => {
    renderStudio();
    fireEvent.change(screen.getByLabelText("autoRefundMaxAmount"), { target: { value: "450" } });
    expect(screen.getByLabelText("PackConfig Preview").textContent).toContain('"value": 450');
    expect(screen.getByLabelText("PackConfig Preview").textContent).toContain('"source": "confirmedByUser"');
    const amountRow = screen.getByLabelText("autoRefundMaxAmount").closest(".creator-field-row");
    expect(amountRow?.textContent).toContain("Confirmed by user");
  });

  it("editing lowRiskMaxAmount updates approval-decision source confirmedByUser", () => {
    renderStudio();
    fireEvent.click(screen.getByRole("button", { name: /approval-decision/ }));
    fireEvent.change(screen.getByLabelText("lowRiskMaxAmount"), { target: { value: "450" } });
    expect(screen.getByLabelText("PackConfig Preview").textContent).toContain('"value": 450');
    expect(screen.getByLabelText("PackConfig Preview").textContent).toContain('"source": "confirmedByUser"');
    const amountRow = screen.getByLabelText("lowRiskMaxAmount").closest(".creator-field-row");
    expect(amountRow?.textContent).toContain("Confirmed by user");
  });

  it("clicking lowRiskMaxAmount impact shows approval-decision review guards", () => {
    renderStudio();
    fireEvent.click(screen.getByRole("button", { name: /approval-decision/ }));
    const amountInput = screen.getByLabelText("lowRiskMaxAmount");
    const amountRow = amountInput.closest(".creator-field-row");
    const impactButton = amountRow?.querySelector("button");
    expect(impactButton).toBeTruthy();
    fireEvent.click(impactButton!);
    const panelText = screen.getByLabelText("Rule Impact Panel").textContent ?? "";
    expect(panelText).toContain("high_value_review_required");
    expect(panelText).toContain("evaluate_policy -> auto_approved / human_review");
    expect(panelText).toContain("trace.expectation.json");
  });

  it("Compile Preview calls runner and renders artifact tabs", async () => {
    mockCompilePreviewSuccess();
    renderStudio();
    fireEvent.click(screen.getByRole("button", { name: "Compile Preview" }));
    await waitFor(() => expect(compileCreatorPreview).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.getByLabelText("Artifact Preview")).toBeTruthy());
    expect(screen.getByRole("button", { name: "agent.yutra.yaml (not executed)" })).toBeTruthy();
    expect(screen.getByRole("button", { name: /adapter.config.json/ })).toBeTruthy();
    expect(screen.getByLabelText("Compiled Artifact Content").textContent).toContain("request-resolution-ecommerce-basic");
  });

  it("approval-decision Compile Preview calls runner and renders artifacts", async () => {
    mockCompilePreviewSuccess({
      agentName: "approval-decision-basic",
      archetypeId: "approval-decision",
      packConfigId: "approval-decision:basic-demo"
    });
    renderStudio();
    fireEvent.click(screen.getByRole("button", { name: /approval-decision/ }));
    fireEvent.click(screen.getByRole("button", { name: "Compile Preview" }));
    await waitFor(() => expect(compileCreatorPreview).toHaveBeenCalledWith(expect.objectContaining({
      config: expect.objectContaining({ archetypeId: "approval-decision" })
    })));
    await waitFor(() => expect(screen.getByLabelText("Artifact Preview")).toBeTruthy());
    expect(screen.getByLabelText("Compiled Artifact Content").textContent).toContain("approval-decision-basic");
    expect(screen.getByLabelText("Certification Readiness Panel")).toBeTruthy();
  });

  it("approval-decision agent artifact can be sent to DSL Editor without auto inspect apply or run", async () => {
    mockCompilePreviewSuccess({
      agentName: "approval-decision-basic",
      archetypeId: "approval-decision",
      packConfigId: "approval-decision:basic-demo"
    });
    renderStudio();
    fireEvent.click(screen.getByRole("button", { name: /approval-decision/ }));
    fireEvent.click(screen.getByRole("button", { name: "Compile Preview" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Send agent.yutra.yaml to DSL Editor" })).toBeTruthy());

    fireEvent.click(screen.getByRole("button", { name: "Send agent.yutra.yaml to DSL Editor" }));

    expect((screen.getByLabelText("DSL Editor Text") as HTMLTextAreaElement).value).toBe("agent: approval-decision-basic\n");
    expect(screen.getByLabelText("Compiled DSL Metadata").textContent).toContain("Not inspected yet");
    expect(screen.getByText("Builder Source active")).toBeTruthy();
    expect(runPreview).not.toHaveBeenCalled();
  });

  it("switching back to request-resolution resets the request-resolution form", () => {
    renderStudio();
    fireEvent.click(screen.getByRole("button", { name: /approval-decision/ }));
    expect(screen.getByLabelText("Approval Decision Config Editor")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /request-resolution/ }));
    expect(screen.getByLabelText("Request Resolution Config Editor")).toBeTruthy();
    expect(screen.getByLabelText("autoRefundMaxAmount")).toBeTruthy();
    expect(screen.queryByLabelText("lowRiskMaxAmount")).toBeNull();
  });

  it("Compile report renders failClosedPolicy and configHash", async () => {
    mockCompilePreviewSuccess();
    renderStudio();
    fireEvent.click(screen.getByRole("button", { name: "Compile Preview" }));
    await waitFor(() => expect(screen.getByLabelText("Compile Report").textContent).toContain("sha256:config"));
    expect(screen.getByLabelText("Compile Report").textContent).toContain("enabled");
    expect(screen.getByLabelText("Compile Report").textContent).toContain("fallback_covered");
    expect(screen.getByLabelText("Rule Impact Summary").textContent).toContain("explained fields");
  });

  it("Certification Readiness Panel renders after compile success", async () => {
    mockCompilePreviewSuccess();
    renderStudio();
    fireEvent.click(screen.getByRole("button", { name: "Compile Preview" }));
    await waitFor(() => expect(screen.getByLabelText("Certification Readiness Panel")).toBeTruthy());
    const panelText = screen.getByLabelText("Certification Readiness Panel").textContent ?? "";
    expect(panelText).toContain("Warning");
    expect(panelText).toContain("Fail-Closed");
    expect(panelText).toContain("agent.yutra.yaml");
    expect(panelText).toContain("trace.expectation.json");
    expect(panelText).toContain("This is a readiness preview, not an official certification.");
    expect(panelText).toContain("Runtime was not executed.");
    expect(panelText).toContain("Production readiness is not claimed.");
  });

  it("Certification Readiness Panel shows no manual run evidence before Run Preview", async () => {
    mockCompilePreviewSuccess();
    renderStudio();
    fireEvent.click(screen.getByRole("button", { name: "Compile Preview" }));
    await waitFor(() => expect(screen.getByLabelText("Manual Run Preview Evidence")).toBeTruthy());
    const evidenceText = screen.getByLabelText("Manual Run Preview Evidence").textContent ?? "";
    expect(evidenceText).toContain("Not run");
    expect(evidenceText).toContain("This evidence comes from manual Run Preview, not official certification.");
  });

  it("compile issues render errors and warnings", async () => {
    mockCompilePreviewFailure();
    renderStudio();
    fireEvent.click(screen.getByRole("button", { name: "Compile Preview" }));
    await waitFor(() => expect(screen.getByLabelText("Compile Issues").textContent).toContain("RULE_COMPILER_REQUIRED_FIELD_MISSING"));
    expect(screen.getAllByText("Required field missing.").length).toBeGreaterThan(0);
  });

  it("Compile Preview does not trigger Run Preview", async () => {
    mockCompilePreviewSuccess();
    renderStudio();
    fireEvent.click(screen.getByRole("button", { name: "Compile Preview" }));
    await waitFor(() => expect(compileCreatorPreview).toHaveBeenCalledTimes(1));
    expect(runPreview).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Manual Run Preview Evidence").textContent).toContain("Not run");
  });

  it("Compile Preview success shows Send to DSL Editor for agent artifact", async () => {
    mockCompilePreviewSuccess();
    renderStudio();
    fireEvent.click(screen.getByRole("button", { name: "Compile Preview" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Send agent.yutra.yaml to DSL Editor" })).toBeTruthy());
    expect(screen.getByLabelText("Compiled DSL Manual Flow").textContent).toContain("Inspect DSL");
    expect(screen.getByLabelText("Compiled DSL Manual Flow").textContent).toContain("Run Preview manually");
  });

  it("Send to DSL Editor updates DSL buffer and metadata without running or switching source mode", async () => {
    mockCompilePreviewSuccess();
    renderStudio();
    fireEvent.click(screen.getByRole("button", { name: "Compile Preview" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Send agent.yutra.yaml to DSL Editor" })).toBeTruthy());

    fireEvent.click(screen.getByRole("button", { name: "Send agent.yutra.yaml to DSL Editor" }));

    expect((screen.getByLabelText("DSL Editor Text") as HTMLTextAreaElement).value).toBe("agent: request-resolution-ecommerce-basic\n");
    expect(screen.getByLabelText("Compiled DSL Metadata").textContent).toContain("compile:test");
    expect(screen.getByLabelText("Compiled DSL Metadata").textContent).toContain("sha256:config");
    expect(screen.getByLabelText("Compiled DSL Metadata").textContent).toContain("sha256:agent");
    expect(screen.getByLabelText("Compiled DSL Metadata").textContent).toContain("Not inspected yet");
    expect(screen.getByText("Builder Source active")).toBeTruthy();
    expect(runPreview).not.toHaveBeenCalled();
  });

  it("Send to DSL Editor clears/stales inspect state and blocks Run Preview until inspect succeeds", async () => {
    mockCompilePreviewSuccess();
    renderStudio();
    fireEvent.click(screen.getByRole("button", { name: "Compile Preview" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Send agent.yutra.yaml to DSL Editor" })).toBeTruthy());

    fireEvent.click(screen.getByRole("button", { name: "Send agent.yutra.yaml to DSL Editor" }));

    expect(screen.getAllByText("not inspected").length).toBeGreaterThan(0);
    expect(screen.getByText("Compiled DSL must be inspected before running.")).toBeTruthy();
    expect((screen.getByRole("button", { name: "Run Preview" }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByLabelText("Manual Run Preview Evidence").textContent).toContain("Not run");
  });

  it("Inspect after sending compiled DSL enables Apply DSL as Run Source and updates source mode", async () => {
    mockCompilePreviewSuccess();
    mockDslInspectSuccess();
    renderStudio();
    fireEvent.click(screen.getByRole("button", { name: "Compile Preview" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Send agent.yutra.yaml to DSL Editor" })).toBeTruthy());

    fireEvent.click(screen.getByRole("button", { name: "Send agent.yutra.yaml to DSL Editor" }));
    fireEvent.click(screen.getByRole("button", { name: "Inspect DSL" }));

    await waitFor(() => {
      expect(screen.getByLabelText("Compiled DSL Metadata").textContent).toContain("inspected");
      expect((screen.getByRole("button", { name: "Apply DSL as Run Source" }) as HTMLButtonElement).disabled).toBe(false);
    });

    fireEvent.click(screen.getByRole("button", { name: "Apply DSL as Run Source" }));
    await waitFor(() => expect(screen.getByText("Running from DSL Source")).toBeTruthy());
    expect(screen.getByLabelText("Manual Run Preview Evidence").textContent).toContain("Not run");
  });

  it("Manual Run Preview records readiness evidence for inspected compiled DSL", async () => {
    mockCompilePreviewSuccess();
    mockDslInspectSuccess();
    mockCompletedRun();
    renderStudio();
    fireEvent.click(screen.getByRole("button", { name: "Compile Preview" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Send agent.yutra.yaml to DSL Editor" })).toBeTruthy());

    fireEvent.click(screen.getByRole("button", { name: "Send agent.yutra.yaml to DSL Editor" }));
    fireEvent.click(screen.getByRole("button", { name: "Inspect DSL" }));
    await waitFor(() => expect((screen.getByRole("button", { name: "Apply DSL as Run Source" }) as HTMLButtonElement).disabled).toBe(false));
    fireEvent.click(screen.getByRole("button", { name: "Apply DSL as Run Source" }));
    await waitFor(() => expect(screen.getByText("Running from DSL Source")).toBeTruthy());

    fireEvent.click(screen.getByRole("button", { name: "Run Preview" }));
    await waitFor(() => expect(runPreview).toHaveBeenCalledWith(expect.objectContaining({ sourceMode: "dsl" })));
    await waitFor(() => expect(screen.getByLabelText("Manual Run Preview Evidence").textContent).toContain("Evidence captured"));

    const evidenceText = screen.getByLabelText("Manual Run Preview Evidence").textContent ?? "";
    expect(evidenceText).toContain("studio-run-1");
    expect(evidenceText).toContain("completed");
    expect(evidenceText).toContain("dsl");
    expect(evidenceText).toContain("2");
    expect(evidenceText).toContain("true");
    expect(evidenceText).toContain("compile:test");
    expect(evidenceText).toContain("sha256:config");
    expect(screen.getByLabelText("Certification Readiness Panel").textContent).toContain("Manual Run Preview evidence was captured");
    expect(screen.getByLabelText("Certification Readiness Panel").textContent).toContain("Official certification still not run.");
    expect(screen.getByLabelText("Certification Readiness Panel").textContent).toContain("Production readiness is still not claimed.");
  });

  it("editing DSL after manual run evidence marks evidence stale", async () => {
    mockCompilePreviewSuccess();
    mockDslInspectSuccess();
    mockCompletedRun();
    renderStudio();
    fireEvent.click(screen.getByRole("button", { name: "Compile Preview" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Send agent.yutra.yaml to DSL Editor" })).toBeTruthy());

    fireEvent.click(screen.getByRole("button", { name: "Send agent.yutra.yaml to DSL Editor" }));
    fireEvent.click(screen.getByRole("button", { name: "Inspect DSL" }));
    await waitFor(() => expect((screen.getByRole("button", { name: "Apply DSL as Run Source" }) as HTMLButtonElement).disabled).toBe(false));
    fireEvent.click(screen.getByRole("button", { name: "Apply DSL as Run Source" }));
    fireEvent.click(screen.getByRole("button", { name: "Run Preview" }));
    await waitFor(() => expect(screen.getByLabelText("Manual Run Preview Evidence").textContent).toContain("Evidence captured"));

    fireEvent.change(screen.getByLabelText("DSL Editor Text"), { target: { value: "agent: changed" } });
    expect(screen.getByLabelText("Manual Run Preview Evidence").textContent).toContain("Evidence stale");
    expect(screen.getByLabelText("Manual Run Preview Evidence").textContent).toContain("DSL changed after run evidence was captured.");
  });

  it("Builder source Run Preview does not count as compiled DSL readiness evidence", async () => {
    mockCompilePreviewSuccess();
    mockCompletedRun();
    renderStudio();
    fireEvent.click(screen.getByRole("button", { name: "Compile Preview" }));
    await waitFor(() => expect(screen.getByLabelText("Manual Run Preview Evidence").textContent).toContain("Not run"));

    fireEvent.click(screen.getByRole("button", { name: "Run Preview" }));
    await waitFor(() => expect(runPreview).toHaveBeenCalledTimes(1));
    const evidenceText = screen.getByLabelText("Manual Run Preview Evidence").textContent ?? "";
    expect(evidenceText).toContain("Run failed");
    expect(evidenceText).toContain("Builder source Run Preview does not count as compiled DSL readiness evidence.");
  });

  it("DSL editor tab renders generated DSL controls", () => {
    renderStudio();
    expect(screen.getByLabelText("DSL Editor Text")).toBeTruthy();
    expect((screen.getByLabelText("DSL Editor Text") as HTMLTextAreaElement).value).toContain("\u667a\u80fd\u4f53:");
    expect(screen.getByRole("button", { name: "Validate DSL" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Inspect DSL" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Apply DSL as Run Source" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Reset from Builder" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Copy DSL" })).toBeTruthy();
  });

  it("AgentSpec JSON tab renders", () => {
    renderStudio();
    fireEvent.click(screen.getByRole("button", { name: "AgentSpec JSON" }));
    expect(screen.getByLabelText("AgentSpec JSON").textContent).toContain('"agent"');
  });

  it("inspect panel shows validation passed", () => {
    renderStudio();
    expect(screen.getByLabelText("Validation Panel")).toBeTruthy();
    expect(screen.getByText("passed")).toBeTruthy();
  });

  it("structure overview shows counts", () => {
    renderStudio();
    fireEvent.click(screen.getByRole("button", { name: "Overview" }));
    expect(screen.getByLabelText("Structure Overview").textContent).toContain("states");
    expect(screen.getByLabelText("Structure Overview").textContent).toContain("skill actions");
  });

  it("run debug panel renders", () => {
    renderStudio();
    expect(screen.getByLabelText("Run Debug Panel")).toBeTruthy();
    expect(screen.getByLabelText("Sample Input")).toBeTruthy();
    expect(screen.getByLabelText("Run Environment")).toBeTruthy();
    expect(screen.getByText("Running from Builder Config")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Run Preview" })).toBeTruthy();
  });

  it("run preview can still be triggered through UI test mock", async () => {
    mockCompletedRun();
    renderStudio();
    fireEvent.click(screen.getByRole("button", { name: "Run Preview" }));
    await waitFor(() => {
      expect(runPreview).toHaveBeenCalledTimes(1);
    });
  });

  it("editing DSL marks buffer dirty", () => {
    renderStudio();
    fireEvent.change(screen.getByLabelText("DSL Editor Text"), { target: { value: "agent: edited" } });
    expect(screen.getByText("dirty")).toBeTruthy();
    expect(screen.getByText("not inspected")).toBeTruthy();
  });

  it("inspect success updates normalized and canonical panels", async () => {
    mockDslInspectSuccess();
    renderStudio();
    fireEvent.click(screen.getByRole("button", { name: "Inspect DSL" }));
    await waitFor(() => {
      expect(inspectDsl).toHaveBeenCalledTimes(1);
      expect(screen.getByText("inspect ok")).toBeTruthy();
    });
    fireEvent.click(screen.getByRole("button", { name: "Normalized" }));
    expect(screen.getByLabelText("Normalized Builder Config").textContent).toContain("\u7535\u5546\u552e\u540e\u5ba2\u670d");
    fireEvent.click(screen.getByRole("button", { name: "Canonical IR" }));
    expect(screen.getByLabelText("Canonical IR").textContent).toContain("generated_agent");
  });

  it("inspect failure shows structured errors", async () => {
    mockDslInspectFailure();
    renderStudio();
    fireEvent.click(screen.getByRole("button", { name: "Inspect DSL" }));
    await waitFor(() => {
      expect(screen.getByText("inspect failed")).toBeTruthy();
      expect(screen.getByText("Failed to parse YAML DSL source.")).toBeTruthy();
    });
    expect(screen.getByLabelText("Validation Panel").textContent).toContain("DSL_PARSE_ERROR");
  });

  it("Apply DSL switches sourceMode to dsl", async () => {
    mockDslInspectSuccess();
    renderStudio();
    await inspectAndApplyDsl();
    expect(screen.getByText("Running from DSL Source")).toBeTruthy();
  });

  it("Reset from Builder switches sourceMode to builder", async () => {
    mockDslInspectSuccess();
    renderStudio();
    await inspectAndApplyDsl();
    fireEvent.click(screen.getByRole("button", { name: "Reset from Builder" }));
    expect(screen.getByText("Builder Source active")).toBeTruthy();
    expect(screen.getByText("Running from Builder Config")).toBeTruthy();
  });

  it("Run Preview uses DSL source when sourceMode=dsl", async () => {
    mockDslInspectSuccess();
    mockCompletedRun();
    renderStudio();
    await inspectAndApplyDsl();
    fireEvent.click(screen.getByRole("button", { name: "Run Preview" }));
    await waitFor(() => {
      expect(runPreview).toHaveBeenCalledWith(expect.objectContaining({ sourceMode: "dsl", dslText: expect.any(String), format: "yaml" }));
    });
  });

  it("Run button is blocked when DSL invalid", async () => {
    mockDslInspectSuccess();
    renderStudio();
    await inspectAndApplyDsl();
    fireEvent.change(screen.getByLabelText("DSL Editor Text"), { target: { value: "agent: [" } });
    expect((screen.getByRole("button", { name: "Run Preview" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("trace timeline renders after run result", async () => {
    mockCompletedRun();
    renderStudio();
    fireEvent.click(screen.getByRole("button", { name: "Run Preview" }));
    await waitFor(() => {
      expect(screen.getByLabelText("Trace Timeline").textContent).toContain("action.succeeded");
      expect(screen.getByText("Skill: query_shipping_status")).toBeTruthy();
    });
  });

  it("event detail updates when selecting event", async () => {
    mockCompletedRun();
    renderStudio();
    fireEvent.click(screen.getByRole("button", { name: "Run Preview" }));
    await waitFor(() => {
      expect(screen.getByText("Skill: query_shipping_status")).toBeTruthy();
    });
    fireEvent.click(screen.getByText("Skill: query_shipping_status"));
    expect(screen.getByLabelText("Studio Event Detail Panel").textContent).toContain("event-2");
    expect(screen.getByLabelText("Studio Event Detail Panel").textContent).toContain("query_shipping_status");
  });

  it("download buttons still exist", () => {
    renderStudio();
    expect(screen.getByText("Download Trace JSONL")).toBeTruthy();
    expect(screen.getByText("Download Audit JSON")).toBeTruthy();
  });

  it("existing AI Draft mock flow still passes", async () => {
    const spy = vi.spyOn(aiDraftCore, "mockAiDraftProvider");
    renderStudio();
    fireEvent.click(screen.getByRole("button", { name: "Generate Draft" }));
    await waitFor(() => {
      expect(spy).toHaveBeenCalledTimes(1);
      expect(screen.getByLabelText("FlowDraft Preview")).toBeTruthy();
    });
    expect(generateDraftPreview).not.toHaveBeenCalled();
  });

  it("AI Draft does not auto-run Runtime", async () => {
    renderStudio();
    fireEvent.click(screen.getByRole("button", { name: "Generate Draft" }));
    await waitFor(() => {
      expect(screen.getByLabelText("FlowDraft Preview")).toBeTruthy();
    });
    expect(runPreview).not.toHaveBeenCalled();
  });
});
