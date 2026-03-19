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

describe("@yutra/cli", () => {
  it("cli validate success exits 0", async () => {
    const { io, stdout } = createMemoryIO();
    const code = await runCli(["validate", "examples/it-helpdesk/agent.yutra.yaml"], io);
    expect(code).toBe(0);
    expect(stdout.some((line) => line.includes("Validation succeeded."))).toBe(true);
  });

  it("cli validate invalid file exits non-zero", async () => {
    const { io } = createMemoryIO();
    const code = await runCli(["validate", "packages/dsl/test/fixtures/invalid-initial.yutra.yaml"], io);
    expect(code).not.toBe(0);
  });

  it("cli run can execute it-helpdesk once", async () => {
    const dir = await mkdtemp(join(tmpdir(), "yutra-cli-run-"));
    const traceFile = join(dir, "events.jsonl");
    const { io, stdout } = createMemoryIO();
    const code = await runCli(
      [
        "run",
        "examples/it-helpdesk/agent.yutra.yaml",
        "--input",
        "examples/it-helpdesk/demo-inputs/case1.json",
        "--trace-file",
        traceFile
      ],
      io
    );

    expect(code).toBe(0);
    expect(stdout.some((line) => line.includes("status: completed"))).toBe(true);
    await rm(dir, { recursive: true, force: true });
  });

  it("cli run writes trace file", async () => {
    const dir = await mkdtemp(join(tmpdir(), "yutra-cli-trace-"));
    const traceFile = join(dir, "events.jsonl");
    const { io } = createMemoryIO();
    const code = await runCli(
      [
        "run",
        "examples/it-helpdesk/agent.yutra.yaml",
        "--input",
        "examples/it-helpdesk/demo-inputs/case1.json",
        "--trace-file",
        traceFile
      ],
      io
    );

    expect(code).toBe(0);
    const listIO = createMemoryIO();
    await runCli(["trace", "list", "--trace-file", traceFile], listIO.io);
    expect(listIO.stdout.some((line) => line.includes("runId"))).toBe(true);
    await rm(dir, { recursive: true, force: true });
  });

  it("cli trace list reads persisted runs", async () => {
    const dir = await mkdtemp(join(tmpdir(), "yutra-cli-list-"));
    const traceFile = join(dir, "events.jsonl");
    const runIO = createMemoryIO();
    await runCli(
      [
        "run",
        "examples/it-helpdesk/agent.yutra.yaml",
        "--input",
        "examples/it-helpdesk/demo-inputs/case1.json",
        "--trace-file",
        traceFile
      ],
      runIO.io
    );

    const listIO = createMemoryIO();
    const code = await runCli(["trace", "list", "--trace-file", traceFile], listIO.io);
    expect(code).toBe(0);
    expect(listIO.stdout.some((line) => line.includes("completed"))).toBe(true);
    await rm(dir, { recursive: true, force: true });
  });

  it("cli trace show prints one run timeline", async () => {
    const dir = await mkdtemp(join(tmpdir(), "yutra-cli-show-"));
    const traceFile = join(dir, "events.jsonl");
    const runIO = createMemoryIO();
    await runCli(
      [
        "run",
        "examples/it-helpdesk/agent.yutra.yaml",
        "--input",
        "examples/it-helpdesk/demo-inputs/case1.json",
        "--trace-file",
        traceFile
      ],
      runIO.io
    );
    const runId = runIO.stdout.find((line) => line.startsWith("runId: "))?.replace("runId: ", "");
    expect(runId).toBeTruthy();

    const showIO = createMemoryIO();
    const code = await runCli(["trace", "show", runId ?? "", "--trace-file", traceFile], showIO.io);
    expect(code).toBe(0);
    expect(showIO.stdout.some((line) => line.includes("run.started"))).toBe(true);
    await rm(dir, { recursive: true, force: true });
  });

  it("cli --json outputs valid json", async () => {
    const dir = await mkdtemp(join(tmpdir(), "yutra-cli-json-"));
    const traceFile = join(dir, "events.jsonl");
    const runIO = createMemoryIO();
    await runCli(
      [
        "run",
        "examples/it-helpdesk/agent.yutra.yaml",
        "--input",
        "examples/it-helpdesk/demo-inputs/case1.json",
        "--trace-file",
        traceFile
      ],
      runIO.io
    );
    const runId = runIO.stdout.find((line) => line.startsWith("runId: "))?.replace("runId: ", "");
    expect(runId).toBeTruthy();

    const showIO = createMemoryIO();
    const code = await runCli(
      ["trace", "show", runId ?? "", "--trace-file", traceFile, "--json"],
      showIO.io
    );
    expect(code).toBe(0);
    const parsed = JSON.parse(showIO.stdout.join("\n")) as unknown[];
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed.length).toBeGreaterThan(0);
    await rm(dir, { recursive: true, force: true });
  });
});
