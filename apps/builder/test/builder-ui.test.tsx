// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import * as aiDraftCore from "@yutra/builder-ai-core";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "../src/App";
import { runPreview } from "../src/lib/runner-client";
import { generateDraftPreview } from "../src/lib/ai-draft-client";

vi.mock("../src/lib/runner-client", () => ({
  runPreview: vi.fn()
}));

vi.mock("../src/lib/ai-draft-client", () => ({
  generateDraftPreview: vi.fn()
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("@yutra/builder UI", () => {
  it("Builder app renders", () => {
    render(<App />);
    expect(screen.getByText("Yutra Agent Builder")).toBeTruthy();
  });

  it("default ecommerce template is selected", () => {
    render(<App />);
    const select = screen.getByLabelText("Template") as HTMLSelectElement;
    expect(select.value).toBe("ecommerce-support");
  });

  it("changing agent name updates generated JSON", () => {
    render(<App />);
    const input = screen.getByLabelText("Agent Name");
    fireEvent.change(input, { target: { value: "My Custom Agent" } });
    expect(screen.getByLabelText("AgentSpec JSON").textContent).toContain('"agent": "my-custom-agent"');
  });

  it("selecting/deselecting skill updates generated spec", () => {
    render(<App />);
    const skillCheckbox = screen.getByLabelText("skill-query_shipping_status");
    fireEvent.click(skillCheckbox);
    expect(screen.getByLabelText("AgentSpec JSON").textContent).not.toContain("query_shipping_status");
  });

  it("generated Chinese DSL is visible", () => {
    render(<App />);
    fireEvent.click(screen.getByText("中文 DSL"));
    expect(screen.getByLabelText("Chinese DSL").textContent).toContain("智能体:");
  });

  it("validation panel shows ok for default form", () => {
    render(<App />);
    fireEvent.click(screen.getByText("Validation"));
    expect(screen.getByText("passed")).toBeTruthy();
  });

  it("invalid form state shows validation error", () => {
    render(<App />);
    const input = screen.getByLabelText("Agent Name");
    fireEvent.change(input, { target: { value: "" } });
    fireEvent.click(screen.getByText("Validation"));
    expect(screen.getByText("failed")).toBeTruthy();
  });

  it("copy buttons exist", () => {
    render(<App />);
    expect(screen.getByText("Copy AgentSpec JSON")).toBeTruthy();
    fireEvent.click(screen.getByText("中文 DSL"));
    expect(screen.getByText("Copy 中文 DSL")).toBeTruthy();
  });

  it("Builder app renders Run Preview UI", () => {
    render(<App />);
    expect(screen.getByRole("button", { name: "Run Preview" })).toBeTruthy();
    expect(screen.getByLabelText("Sample Input")).toBeTruthy();
    expect(screen.getByLabelText("Context JSON")).toBeTruthy();
  });

  it("sample input selector works", () => {
    render(<App />);
    const sampleSelect = screen.getByLabelText("Sample Input") as HTMLSelectElement;
    fireEvent.change(sampleSelect, { target: { value: "handoffCase" } });
    expect(sampleSelect.value).toBe("handoffCase");
    expect((screen.getByLabelText("Context JSON") as HTMLTextAreaElement).value).toContain("ORDER-NEEDS-HUMAN");
  });

  it("invalid JSON input shows error", async () => {
    render(<App />);
    fireEvent.change(screen.getByLabelText("Context JSON"), { target: { value: "{ bad-json" } });
    fireEvent.click(screen.getByRole("button", { name: "Run Preview" }));
    await waitFor(() => {
      expect(screen.getByText("Invalid JSON input.")).toBeTruthy();
    });
  });

  it("run button calls runner-client", async () => {
    vi.mocked(runPreview).mockResolvedValue({
      ok: true,
      validation: { ok: true, issues: [] },
      run: {
        runId: "run-1",
        status: "completed",
        agent: "test-agent",
        initialState: "triage",
        finalState: "resolved",
        matchedIntent: "shipping_query",
        steps: 2
      },
      events: [],
      timeline: [],
      traceJsonl: "",
      auditBundle: {}
    });
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Run Preview" }));
    await waitFor(() => {
      expect(runPreview).toHaveBeenCalledTimes(1);
    });
  });

  it("run summary renders", async () => {
    vi.mocked(runPreview).mockResolvedValue({
      ok: true,
      validation: { ok: true, issues: [] },
      run: {
        runId: "run-summary-1",
        status: "completed",
        agent: "builder-agent",
        initialState: "triage",
        finalState: "resolved",
        matchedIntent: "shipping_query",
        steps: 3
      },
      events: [],
      timeline: [],
      traceJsonl: "",
      auditBundle: {}
    });
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Run Preview" }));
    await waitFor(() => {
      const summary = screen.getByLabelText("Run Summary");
      expect(summary).toBeTruthy();
      expect(summary.textContent).toContain("status: completed");
    });
  });

  it("trace timeline renders skill event", async () => {
    vi.mocked(runPreview).mockResolvedValue({
      ok: true,
      validation: { ok: true, issues: [] },
      run: {
        runId: "run-trace-1",
        status: "completed",
        agent: "builder-agent",
        steps: 2
      },
      events: [{ type: "action.succeeded", payload: { implementationType: "skill", skillName: "query_shipping_status" } }],
      timeline: [
        {
          index: 0,
          type: "action.succeeded",
          state: "query_shipping",
          action: "query_shipping_status",
          implementationType: "skill",
          skillName: "query_shipping_status"
        }
      ],
      traceJsonl: "{\"type\":\"action.succeeded\"}\n",
      auditBundle: {}
    });
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Run Preview" }));
    await waitFor(() => {
      expect(screen.getByLabelText("Trace Timeline")).toBeTruthy();
      expect(screen.getByText("Skill: query_shipping_status")).toBeTruthy();
    });
  });

  it("audit panel renders", async () => {
    vi.mocked(runPreview).mockResolvedValue({
      ok: true,
      validation: { ok: true, issues: [] },
      run: {
        runId: "run-audit-1",
        status: "completed",
        agent: "builder-agent",
        steps: 2
      },
      events: [{ type: "run.completed" }],
      timeline: [],
      traceJsonl: "{\"type\":\"run.completed\"}\n",
      auditBundle: {
        handoffOrErrorSummary: {
          handoff: false,
          failed: false
        }
      }
    });
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Run Preview" }));
    await waitFor(() => {
      expect(screen.getByLabelText("Audit Panel")).toBeTruthy();
      expect(screen.getByText("Download Audit JSON")).toBeTruthy();
    });
  });

  it("download buttons exist", () => {
    render(<App />);
    expect(screen.getByText("Download Trace JSONL")).toBeTruthy();
  });

  it("AI Draft panel renders", () => {
    render(<App />);
    expect(screen.getByLabelText("AI Draft Assistant")).toBeTruthy();
    expect(screen.getByText("Show AI Draft Assistant")).toBeTruthy();
  });

  it("provider mode selector renders with default mock", () => {
    render(<App />);
    fireEvent.click(screen.getByText("Show AI Draft Assistant"));
    const select = screen.getByLabelText("AI Draft Provider Mode") as HTMLSelectElement;
    expect(select.value).toBe("mock");
    expect(screen.getByText("Mock Draft Provider")).toBeTruthy();
  });

  it("default scenario is ecommerce_support", () => {
    render(<App />);
    fireEvent.click(screen.getByText("Show AI Draft Assistant"));
    const scenarioSelect = screen.getByLabelText("AI Draft Scenario") as HTMLSelectElement;
    expect(scenarioSelect.value).toBe("ecommerce_support");
  });

  it("capability tags render", () => {
    render(<App />);
    fireEvent.click(screen.getByText("Show AI Draft Assistant"));
    expect(screen.getByLabelText("capability-query_order")).toBeTruthy();
    expect(screen.getByLabelText("capability-create_refund_request")).toBeTruthy();
  });

  it("strategy tags render", () => {
    render(<App />);
    fireEvent.click(screen.getByText("Show AI Draft Assistant"));
    expect(screen.getByLabelText("strategy-full_trace_audit")).toBeTruthy();
    expect(screen.getByLabelText("strategy-service_oriented_response")).toBeTruthy();
  });

  it("brief editor renders default text", () => {
    render(<App />);
    fireEvent.click(screen.getByText("Show AI Draft Assistant"));
    const brief = screen.getByLabelText("AI Draft Brief") as HTMLTextAreaElement;
    expect(brief.value).toContain("48 小时");
    expect(brief.value).toContain("5000");
  });

  it("Generate Draft calls mock provider flow", async () => {
    const spy = vi.spyOn(aiDraftCore, "mockAiDraftProvider");
    render(<App />);
    fireEvent.click(screen.getByText("Show AI Draft Assistant"));
    fireEvent.click(screen.getByRole("button", { name: "Generate Draft" }));
    await waitFor(() => {
      expect(spy).toHaveBeenCalledTimes(1);
    });
    expect(generateDraftPreview).not.toHaveBeenCalled();
  });

  it("real mode shows configuration hint", () => {
    render(<App />);
    fireEvent.click(screen.getByText("Show AI Draft Assistant"));
    fireEvent.change(screen.getByLabelText("AI Draft Provider Mode"), { target: { value: "real" } });
    expect(screen.getByText(/Do not input API key in browser/i)).toBeTruthy();
  });

  it("runner unavailable shows friendly error", async () => {
    vi.mocked(generateDraftPreview).mockRejectedValue(new Error("Builder Runner is not running. Start it with pnpm builder:runner."));
    render(<App />);
    fireEvent.click(screen.getByText("Show AI Draft Assistant"));
    fireEvent.change(screen.getByLabelText("AI Draft Provider Mode"), { target: { value: "real" } });
    fireEvent.click(screen.getByRole("button", { name: "Generate Draft" }));
    await waitFor(() => {
      expect(screen.getByText("Builder Runner is not running. Start it with pnpm builder:runner.")).toBeTruthy();
    });
  });

  it("FlowDraft preview renders", async () => {
    render(<App />);
    fireEvent.click(screen.getByText("Show AI Draft Assistant"));
    fireEvent.click(screen.getByRole("button", { name: "Generate Draft" }));
    await waitFor(() => {
      expect(screen.getByLabelText("FlowDraft Preview")).toBeTruthy();
      expect(screen.getByLabelText("FlowDraft JSON").textContent).toContain('"source"');
      expect(screen.getByText("This is a draft. Review before applying.")).toBeTruthy();
    });
  });

  it("explainFlowDraft output renders", async () => {
    render(<App />);
    fireEvent.click(screen.getByText("Show AI Draft Assistant"));
    fireEvent.click(screen.getByRole("button", { name: "Generate Draft" }));
    await waitFor(() => {
      const explanation = screen.getByLabelText("FlowDraft Explanation Text");
      expect(explanation.textContent).toContain("识别到的意图");
      expect(explanation.textContent).toContain("请先 validate");
    });
  });

  it("warnings render", async () => {
    render(<App />);
    fireEvent.click(screen.getByText("Show AI Draft Assistant"));
    fireEvent.click(screen.getByLabelText("strategy-strict_policy_boundary"));
    fireEvent.click(screen.getByRole("button", { name: "Generate Draft" }));
    await waitFor(() => {
      expect(screen.getByLabelText("Draft Warnings")).toBeTruthy();
      expect(screen.queryByText("No warnings.")).toBeNull();
    });
  });

  it("Draft Apply Preview renders changed fields", async () => {
    render(<App />);
    fireEvent.click(screen.getByText("Show AI Draft Assistant"));
    fireEvent.click(screen.getByLabelText("capability-create_return_request"));
    fireEvent.click(screen.getByRole("button", { name: "Generate Draft" }));
    await waitFor(() => {
      expect(screen.getByLabelText("Draft Apply Preview")).toBeTruthy();
      expect(screen.getByText("agentName")).toBeTruthy();
      expect(screen.getByText("rules")).toBeTruthy();
    });
  });

  it("Apply Draft updates agentName / intents / skills / rules", async () => {
    render(<App />);
    fireEvent.click(screen.getByText("Show AI Draft Assistant"));
    fireEvent.click(screen.getByLabelText("capability-create_return_request"));
    fireEvent.click(screen.getByRole("button", { name: "Generate Draft" }));
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Apply Draft" })).toBeTruthy();
    });
    fireEvent.click(screen.getByRole("button", { name: "Apply Draft" }));
    expect((screen.getByLabelText("Agent Name") as HTMLInputElement).value).toBe("电商售后客服草案");
    expect(screen.getByLabelText("intent-return_request")).toBeTruthy();
    expect((screen.getByLabelText("skill-create_return_request") as HTMLInputElement).checked).toBe(true);
    expect((screen.getByLabelText("highRiskAmountThreshold") as HTMLInputElement).value).toBe("5000");
  });

  it("After Apply, AgentSpec JSON updates", async () => {
    render(<App />);
    const before = screen.getByLabelText("AgentSpec JSON").textContent ?? "";
    fireEvent.click(screen.getByText("Show AI Draft Assistant"));
    fireEvent.click(screen.getByLabelText("capability-create_return_request"));
    fireEvent.click(screen.getByRole("button", { name: "Generate Draft" }));
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Apply Draft" })).toBeTruthy();
    });
    fireEvent.click(screen.getByRole("button", { name: "Apply Draft" }));
    const after = screen.getByLabelText("AgentSpec JSON").textContent ?? "";
    expect(after).not.toBe(before);
    expect(after).toContain("handle_return");
  });

  it("After Apply, Chinese DSL updates", async () => {
    render(<App />);
    fireEvent.click(screen.getByText("Show AI Draft Assistant"));
    fireEvent.click(screen.getByLabelText("capability-create_return_request"));
    fireEvent.click(screen.getByRole("button", { name: "Generate Draft" }));
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Apply Draft" })).toBeTruthy();
    });
    fireEvent.click(screen.getByRole("button", { name: "Apply Draft" }));
    fireEvent.click(screen.getByText("中文 DSL"));
    expect(screen.getByLabelText("Chinese DSL").textContent).toContain("handle_return:");
  });

  it("After Apply, validation still passes", async () => {
    render(<App />);
    fireEvent.click(screen.getByText("Show AI Draft Assistant"));
    fireEvent.click(screen.getByLabelText("capability-create_return_request"));
    fireEvent.click(screen.getByRole("button", { name: "Generate Draft" }));
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Apply Draft" })).toBeTruthy();
    });
    fireEvent.click(screen.getByRole("button", { name: "Apply Draft" }));
    fireEvent.click(screen.getByText("Validation"));
    expect(screen.getByText("passed")).toBeTruthy();
  });

  it("Generate Draft does not auto-run Runtime", async () => {
    render(<App />);
    fireEvent.click(screen.getByText("Show AI Draft Assistant"));
    fireEvent.click(screen.getByRole("button", { name: "Generate Draft" }));
    await waitFor(() => {
      expect(screen.getByLabelText("FlowDraft Preview")).toBeTruthy();
    });
    expect(runPreview).not.toHaveBeenCalled();
  });

  it("Run Preview remains manual", async () => {
    vi.mocked(runPreview).mockResolvedValue({
      ok: true,
      validation: { ok: true, issues: [] },
      run: {
        runId: "run-manual-1",
        status: "completed",
        agent: "builder-agent",
        steps: 2
      },
      events: [],
      timeline: [],
      traceJsonl: "",
      auditBundle: {}
    });
    render(<App />);
    fireEvent.click(screen.getByText("Show AI Draft Assistant"));
    fireEvent.click(screen.getByRole("button", { name: "Generate Draft" }));
    await waitFor(() => {
      expect(screen.getByLabelText("FlowDraft Preview")).toBeTruthy();
    });
    expect(runPreview).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Run Preview" }));
    await waitFor(() => {
      expect(runPreview).toHaveBeenCalledTimes(1);
    });
  });

  it("invalid brief shows error", async () => {
    render(<App />);
    fireEvent.click(screen.getByText("Show AI Draft Assistant"));
    fireEvent.change(screen.getByLabelText("AI Draft Brief"), { target: { value: "   " } });
    fireEvent.click(screen.getByRole("button", { name: "Generate Draft" }));
    await waitFor(() => {
      expect(screen.getByText(/String must contain at least 1 character/i)).toBeTruthy();
    });
  });
});
