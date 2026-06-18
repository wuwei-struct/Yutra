// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import * as aiDraftCore from "@yutra/builder-ai-core";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "../src/App";
import { I18nProvider, STUDIO_LOCALE_STORAGE_KEY, resolveInitialLocale } from "../src/i18n";
import { generateDraftPreview } from "../src/lib/ai-draft-client";
import { inspectDsl, runPreview } from "../src/lib/runner-client";

vi.mock("../src/lib/runner-client", () => ({
  inspectDsl: vi.fn(),
  runPreview: vi.fn()
}));

vi.mock("../src/lib/ai-draft-client", () => ({
  generateDraftPreview: vi.fn()
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
