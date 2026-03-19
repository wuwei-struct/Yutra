import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { runCli } from "../src/cli";

function createMemoryIO() {
  const stdout: string[] = [];
  const stderr: string[] = [];
  return {
    io: {
      stdout: (line: string) => stdout.push(line),
      stderr: (line: string) => stderr.push(line)
    },
    stdout,
    stderr
  };
}

function getRunId(lines: string[]): string | undefined {
  return lines.find((line) => line.startsWith("runId: "))?.replace("runId: ", "");
}

describe("PR-07A ecommerce-support", () => {
  it("ecommerce-support example can validate", async () => {
    const out = createMemoryIO();
    const code = await runCli(["validate", "examples/ecommerce-support/agent.yutra.yaml"], out.io);
    expect(code).toBe(0);
  });

  it("ecommerce-support shipping case can run to resolved", async () => {
    const dir = await mkdtemp(join(tmpdir(), "yutra-eco-ship-"));
    const traceFile = join(dir, "events.jsonl");
    const out = createMemoryIO();
    const code = await runCli(
      [
        "run",
        "examples/ecommerce-support/agent.yutra.yaml",
        "--input",
        "examples/ecommerce-support/demo-inputs/case1.json",
        "--trace-file",
        traceFile
      ],
      out.io
    );

    expect(code).toBe(0);
    expect(out.stdout.some((line) => line.includes("status: completed"))).toBe(true);
    await rm(dir, { recursive: true, force: true });
  });

  it("ecommerce-support return case can run to resolved or handoff", async () => {
    const dir = await mkdtemp(join(tmpdir(), "yutra-eco-return-"));
    const traceFile = join(dir, "events.jsonl");
    const out = createMemoryIO();
    const code = await runCli(
      [
        "run",
        "examples/ecommerce-support/agent.yutra.yaml",
        "--input",
        "examples/ecommerce-support/demo-inputs/case2.json",
        "--trace-file",
        traceFile
      ],
      out.io
    );

    expect([0, 1]).toContain(code);
    const statusLine = out.stdout.find((line) => line.startsWith("status: "));
    expect(statusLine === "status: completed" || statusLine === "status: handoff").toBe(true);
    await rm(dir, { recursive: true, force: true });
  });

  it("ecommerce-support example emits trace", async () => {
    const dir = await mkdtemp(join(tmpdir(), "yutra-eco-trace-"));
    const traceFile = join(dir, "events.jsonl");
    const runOut = createMemoryIO();
    await runCli(
      [
        "run",
        "examples/ecommerce-support/agent.yutra.yaml",
        "--input",
        "examples/ecommerce-support/demo-inputs/case1.json",
        "--trace-file",
        traceFile
      ],
      runOut.io
    );

    const runId = getRunId(runOut.stdout);
    expect(runId).toBeTruthy();

    const showOut = createMemoryIO();
    await runCli(["trace", "show", runId ?? "", "--trace-file", traceFile, "--json"], showOut.io);
    const events = JSON.parse(showOut.stdout.join("\n")) as Array<{ type: string }>;
    expect(events.length).toBeGreaterThan(0);
    expect(events.some((event) => event.type === "run.completed")).toBe(true);
    await rm(dir, { recursive: true, force: true });
  });

  it("ecommerce-support README command examples are runnable", async () => {
    const dir = await mkdtemp(join(tmpdir(), "yutra-eco-readme-"));
    const traceFile = join(dir, "events.jsonl");
    const validateOut = createMemoryIO();
    const runOut = createMemoryIO();

    const validateCode = await runCli(["validate", "examples/ecommerce-support/agent.yutra.yaml"], validateOut.io);
    const runCode = await runCli(
      [
        "run",
        "examples/ecommerce-support/agent.yutra.yaml",
        "--input",
        "examples/ecommerce-support/demo-inputs/case1.json",
        "--trace-file",
        traceFile
      ],
      runOut.io
    );

    expect(validateCode).toBe(0);
    expect(runCode).toBe(0);
    await rm(dir, { recursive: true, force: true });
  });
});

describe("PR-07B approval-agent", () => {
  it("approval-agent example can validate", async () => {
    const out = createMemoryIO();
    const code = await runCli(["validate", "examples/approval-agent/agent.yutra.yaml"], out.io);
    expect(code).toBe(0);
  });

  it("approval-agent happy path can complete", async () => {
    const dir = await mkdtemp(join(tmpdir(), "yutra-appr-happy-"));
    const traceFile = join(dir, "events.jsonl");
    const out = createMemoryIO();
    const code = await runCli(
      [
        "run",
        "examples/approval-agent/agent.yutra.yaml",
        "--input",
        "examples/approval-agent/demo-inputs/case1.json",
        "--trace-file",
        traceFile
      ],
      out.io
    );

    expect(code).toBe(0);
    expect(out.stdout.some((line) => line.includes("status: completed"))).toBe(true);
    await rm(dir, { recursive: true, force: true });
  });

  it("approval-agent high risk case can handoff", async () => {
    const dir = await mkdtemp(join(tmpdir(), "yutra-appr-risk-"));
    const traceFile = join(dir, "events.jsonl");
    const out = createMemoryIO();
    const code = await runCli(
      [
        "run",
        "examples/approval-agent/agent.yutra.yaml",
        "--input",
        "examples/approval-agent/demo-inputs/case2.json",
        "--trace-file",
        traceFile
      ],
      out.io
    );

    expect(code).toBe(0);
    expect(out.stdout.some((line) => line.includes("status: handoff"))).toBe(true);
    await rm(dir, { recursive: true, force: true });
  });

  it("approval-agent emits guard.evaluated and handoff.requested or run.completed", async () => {
    const dir = await mkdtemp(join(tmpdir(), "yutra-appr-trace-"));
    const traceFile = join(dir, "events.jsonl");
    const runOut = createMemoryIO();
    await runCli(
      [
        "run",
        "examples/approval-agent/agent.yutra.yaml",
        "--input",
        "examples/approval-agent/demo-inputs/case2.json",
        "--trace-file",
        traceFile
      ],
      runOut.io
    );

    const runId = getRunId(runOut.stdout);
    const showOut = createMemoryIO();
    await runCli(["trace", "show", runId ?? "", "--trace-file", traceFile, "--json"], showOut.io);
    const events = JSON.parse(showOut.stdout.join("\n")) as Array<{ type: string }>;
    expect(events.some((event) => event.type === "guard.evaluated")).toBe(true);
    expect(
      events.some((event) => event.type === "handoff.requested") ||
        events.some((event) => event.type === "run.completed")
    ).toBe(true);
    await rm(dir, { recursive: true, force: true });
  });

  it("approval-agent trace sequence is structurally correct", async () => {
    const dir = await mkdtemp(join(tmpdir(), "yutra-appr-seq-"));
    const traceFile = join(dir, "events.jsonl");
    const runOut = createMemoryIO();
    await runCli(
      [
        "run",
        "examples/approval-agent/agent.yutra.yaml",
        "--input",
        "examples/approval-agent/demo-inputs/case1.json",
        "--trace-file",
        traceFile
      ],
      runOut.io
    );

    const runId = getRunId(runOut.stdout);
    const showOut = createMemoryIO();
    await runCli(["trace", "show", runId ?? "", "--trace-file", traceFile, "--json"], showOut.io);
    const events = JSON.parse(showOut.stdout.join("\n")) as Array<{ type: string }>;

    expect(events[0]?.type).toBe("run.started");
    expect(events.some((event) => event.type === "state.entered")).toBe(true);
    expect(events.some((event) => event.type === "transition.resolved")).toBe(true);
    expect(events[events.length - 1]?.type === "run.completed" || events[events.length - 1]?.type === "handoff.requested").toBe(true);
    await rm(dir, { recursive: true, force: true });
  });
});

describe("it-helpdesk regression", () => {
  it("it-helpdesk example still runs successfully", async () => {
    const dir = await mkdtemp(join(tmpdir(), "yutra-helpdesk-regression-"));
    const traceFile = join(dir, "events.jsonl");
    const out = createMemoryIO();
    const code = await runCli(
      [
        "run",
        "examples/it-helpdesk/agent.yutra.yaml",
        "--input",
        "examples/it-helpdesk/demo-inputs/case1.json",
        "--trace-file",
        traceFile
      ],
      out.io
    );

    expect(code).toBe(0);
    expect(out.stdout.some((line) => line.includes("status: completed"))).toBe(true);
    await rm(dir, { recursive: true, force: true });
  });
});
