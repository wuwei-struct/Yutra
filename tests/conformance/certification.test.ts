import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { afterAll, describe, expect, it } from "vitest";
import type { AgentSpec, TraceEvent } from "@yutra/spec";
import { agentSpecSchema, minimalAgentFixture } from "../../packages/spec/src/index";
import { inspectCanonicalization, loadAndValidateDslFile } from "../../packages/dsl/src/index";
import { executeRun } from "../../packages/runtime/src/execute-run";
import { InMemoryIdempotencyStore } from "../../packages/runtime/src/idempotency";
import { resumeRun } from "../../packages/runtime/src/resume-run";
import { InMemorySnapshotStore } from "../../packages/runtime/src/snapshot-store";
import { loadAndExecuteDslFile } from "../../packages/runtime/src/load-and-execute";
import { buildAuditBundle } from "../../packages/trace/src/audit-bundle";
import { buildContextDiffFramesFromEvents } from "../../packages/trace/src/context-diff";
import { MemoryTraceStorage } from "../../packages/trace/src/memory-storage";

type CertificationStatus = "pass" | "fail";

interface StableProjection {
  scenario: string;
  status: string;
  finalState?: string;
  statePath: string[];
  actionSequence: string[];
  eventTypeSequence: string[];
  handoffReasonCodes: string[];
  errorCodes: string[];
  approvalStatuses: string[];
  reviewSources: string[];
  contextChangedKeys: string[];
}

interface CertificationRecord {
  scenario: string;
  status: CertificationStatus;
  expectedStatus?: string;
  actualStatus?: string;
  message?: string;
}

const workspaceRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const goldenDir = resolve(workspaceRoot, "testdata", "golden-traces");
const certificationOutDir = resolve(workspaceRoot, ".yutra", "certification");
const summaryFile = resolve(certificationOutDir, "summary.json");
const updateGolden = process.env.UPDATE_GOLDEN === "1";

const records: CertificationRecord[] = [];

function addRecord(record: CertificationRecord): void {
  records.push(record);
}

function makeProjection(scenario: string, status: string, finalState: string | undefined, events: TraceEvent[]): StableProjection {
  const eventTypeSequence = events.map((event) => event.type);
  const statePath = events
    .filter((event) => event.type === "state.entered")
    .map((event) => event.state)
    .filter((state): state is string => typeof state === "string");
  const actionSequence = events
    .filter((event) => event.type === "action.started")
    .map((event) => event.action)
    .filter((action): action is string => typeof action === "string");
  const handoffReasonCodes = [
    ...new Set(
      events
        .filter((event) => event.type === "handoff.requested")
        .map((event) => (event.payload as Record<string, unknown> | undefined)?.reasonCode)
        .filter((code): code is string => typeof code === "string")
    )
  ].sort();
  const errorCodes = [
    ...new Set(
      events
        .flatMap((event) => {
          const payload = (event.payload ?? {}) as Record<string, unknown>;
          const runtimeError = (payload.error ?? {}) as Record<string, unknown>;
          const output = (payload.output ?? {}) as Record<string, unknown>;
          const outputError = (output.error ?? {}) as Record<string, unknown>;
          return [runtimeError.code, outputError.code];
        })
        .filter((code): code is string => typeof code === "string")
    )
  ].sort();
  const approvalStatuses = [
    ...new Set(
      events
        .flatMap((event) => {
          const payload = (event.payload ?? {}) as Record<string, unknown>;
          const output = (payload.output ?? {}) as Record<string, unknown>;
          const decision = (output.approvalDecision ?? payload.approvalDecision ?? {}) as Record<string, unknown>;
          const runApproval = (payload.approvalSummary ?? {}) as Record<string, unknown>;
          return [decision.status, runApproval.status];
        })
        .filter((status): status is string => typeof status === "string")
    )
  ].sort();
  const reviewSources = [
    ...new Set(
      events
        .filter((event) => event.type === "handoff.requested")
        .map((event) => (event.payload as Record<string, unknown> | undefined)?.source)
        .filter((source): source is string => typeof source === "string")
    )
  ].sort();
  const contextChangedKeys = [
    ...new Set(
      buildContextDiffFramesFromEvents(events).flatMap((frame) => [
        ...frame.change.addedKeys,
        ...frame.change.changedKeys,
        ...frame.change.removedKeys
      ])
    )
  ].sort();

  return {
    scenario,
    status,
    finalState,
    statePath,
    actionSequence,
    eventTypeSequence,
    handoffReasonCodes,
    errorCodes,
    approvalStatuses,
    reviewSources,
    contextChangedKeys
  };
}

function compareWithGolden(name: string, projection: StableProjection): void {
  const path = resolve(goldenDir, `${name}.json`);
  if (updateGolden || !existsSync(path)) {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, JSON.stringify(projection, null, 2), "utf8");
    addRecord({
      scenario: name,
      status: "pass",
      actualStatus: projection.status,
      expectedStatus: projection.status,
      message: updateGolden ? "golden updated" : "golden initialized"
    });
    return;
  }

  const expected = JSON.parse(readFileSync(path, "utf8")) as StableProjection;
  expect(projection).toEqual(expected);
  addRecord({
    scenario: name,
    status: "pass",
    actualStatus: projection.status,
    expectedStatus: expected.status
  });
}

async function loadExampleActionRegistry(exampleDir: string) {
  const actionsPath = resolve(workspaceRoot, "examples", exampleDir, "actions.mjs");
  const mod = (await import(pathToFileURL(actionsPath).href)) as { actionRegistry?: Record<string, unknown> };
  return (mod.actionRegistry ?? {}) as Record<string, (ctx: unknown) => Promise<unknown>>;
}

function loadExampleInput(exampleDir: string, file: string): Record<string, unknown> {
  const inputPath = resolve(workspaceRoot, "examples", exampleDir, "demo-inputs", file);
  return JSON.parse(readFileSync(inputPath, "utf8")) as Record<string, unknown>;
}

describe.sequential("P2-08 conformance and certification", () => {
  it("spec conformance is stable", () => {
    const parsed = agentSpecSchema.parse(minimalAgentFixture);
    expect(parsed.agent).toBe("minimal-agent");
    const bad = { ...minimalAgentFixture, initial_state: undefined };
    const result = agentSpecSchema.safeParse(bad);
    expect(result.success).toBe(false);
    addRecord({ scenario: "spec-conformance", status: "pass" });
  });

  it("dsl conformance covers english/cn/mixed and inspect stability", () => {
    const english = loadAndValidateDslFile(resolve(workspaceRoot, "examples", "it-helpdesk", "agent.yutra.yaml"));
    expect(english.validation.valid).toBe(true);

    const chinese = loadAndValidateDslFile(resolve(workspaceRoot, "examples", "it-helpdesk", "agent.zh-CN.yutra.yaml"));
    expect(chinese.validation.valid).toBe(true);
    expect(chinese.spec.agent).toBeTypeOf("string");

    const mixedInput = {
      "\u667a\u80fd\u4f53": "\u6df7\u5408Agent",
      initial_state: "\u5f00\u59cb",
      "\u72b6\u6001\u96c6": {
        "\u5f00\u59cb": {
          actions: ["say_hi"],
          "\u8f6c\u79fb": [{ "\u5230": "\u7ed3\u675f" }]
        },
        "\u7ed3\u675f": { final: true }
      }
    };
    const report = inspectCanonicalization(mixedInput, { format: "yaml", path: "inline-mixed" });
    expect(report.mappings.fieldAliases.length).toBeGreaterThan(0);
    expect(report.mappings.canonicalNames.length).toBeGreaterThan(0);
    expect(Array.isArray(report.warnings)).toBe(true);
    addRecord({ scenario: "dsl-conformance", status: "pass" });
  });

  it("runtime/trace conformance with golden traces for examples", async () => {
    const cases = [
      { scenario: "it-helpdesk-happy", dsl: "it-helpdesk/agent.yutra.yaml", input: "it-helpdesk/case1.json", expected: "completed" },
      { scenario: "ecommerce-happy", dsl: "ecommerce-support/agent.yutra.yaml", input: "ecommerce-support/case1.json", expected: "completed" },
      { scenario: "approval-approved", dsl: "approval-agent/agent.yutra.yaml", input: "approval-agent/case1.json", expected: "completed" },
      { scenario: "approval-denied", dsl: "approval-agent/agent.yutra.yaml", input: "approval-agent/case3.json", expected: "completed" },
      { scenario: "approval-handoff", dsl: "approval-agent/agent.yutra.yaml", input: "approval-agent/case2.json", expected: "handoff" },
      { scenario: "it-helpdesk-zh", dsl: "it-helpdesk/agent.zh-CN.yutra.yaml", input: "it-helpdesk/case1.json", expected: "completed" }
    ] as const;

    for (const item of cases) {
      const exampleDir = item.dsl.split("/")[0]!;
      const specPath = resolve(workspaceRoot, "examples", item.dsl);
      const input = loadExampleInput(item.input.split("/")[0]!, item.input.split("/")[1]!);
      const registry = await loadExampleActionRegistry(exampleDir);
      const result = await loadAndExecuteDslFile(specPath, { actionRegistry: registry }, input);
      expect(result.status).toBe(item.expected);

      const projection = makeProjection(item.scenario, result.status, result.finalState, result.traceEvents ?? []);
      compareWithGolden(item.scenario, projection);
    }
  });

  it("resumed run conformance has stable golden projection", async () => {
    const spec: AgentSpec = {
      agent: "resume-conformance-agent",
      initial_state: "start",
      actions: [{ name: "once", side_effect: "external" }],
      states: {
        start: { actions: ["once"], transitions: [{ to: "done" }] },
        done: { final: true }
      }
    };

    const snapshotStore = new InMemorySnapshotStore();
    const idempotencyStore = new InMemoryIdempotencyStore();
    let calls = 0;
    const first = await executeRun({
      spec,
      options: {
        maxSteps: 1,
        snapshotStore,
        idempotencyStore,
        actionPolicies: {
          once: { sideEffect: "external", idempotencyKey: "resume_once" }
        },
        actionRegistry: {
          once: async () => {
            calls += 1;
            return { ok: true, contextPatch: { calls } };
          }
        }
      }
    });
    const snapshot = snapshotStore.list(first.runId).find((item) => item.status === "running");
    expect(snapshot).toBeTruthy();

    const resumed = await resumeRun({
      spec,
      snapshot: snapshot!,
      options: {
        snapshotStore,
        idempotencyStore,
        actionPolicies: {
          once: { sideEffect: "external", idempotencyKey: "resume_once" }
        },
        actionRegistry: {
          once: async () => {
            calls += 1;
            return { ok: true, contextPatch: { calls } };
          }
        }
      }
    });

    expect(resumed.status).toBe("completed");
    const projection = makeProjection("resumed-run", resumed.status, resumed.finalState, resumed.traceEvents ?? []);
    compareWithGolden("resumed-run", projection);
    addRecord({ scenario: "resumed-run-idempotent", status: calls === 1 ? "pass" : "fail", message: `calls=${calls}` });
  });

  it("trace/audit conformance keeps stable summary shape", async () => {
    const storage = new MemoryTraceStorage();
    const specPath = resolve(workspaceRoot, "examples", "approval-agent", "agent.yutra.yaml");
    const registry = await loadExampleActionRegistry("approval-agent");
    const input = loadExampleInput("approval-agent", "case3.json");

    const result = await loadAndExecuteDslFile(specPath, { actionRegistry: registry, traceStorage: storage }, input);
    expect(result.status).toBe("completed");
    const bundle = await buildAuditBundle(storage, result.runId);
    expect(bundle.governanceSummary).toBeTruthy();
    expect(bundle.approvalSummary.decisionCount).toBeGreaterThanOrEqual(1);
    expect(Array.isArray(bundle.humanReviewSummary.sources)).toBe(true);
    addRecord({ scenario: "trace-audit-conformance", status: "pass" });
  });
});

afterAll(() => {
  mkdirSync(certificationOutDir, { recursive: true });
  const payload = {
    generatedAt: new Date().toISOString(),
    updateGolden,
    totals: {
      pass: records.filter((record) => record.status === "pass").length,
      fail: records.filter((record) => record.status === "fail").length
    },
    records
  };
  writeFileSync(summaryFile, JSON.stringify(payload, null, 2), "utf8");
});



