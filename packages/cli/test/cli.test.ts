import { mkdtemp, rm, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { runCli } from "../src/cli";

const workspaceRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");

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

  it("cli explain command works for canonical english DSL", async () => {
    const { io, stdout } = createMemoryIO();
    const code = await runCli(["dsl", "explain", "examples/it-helpdesk/agent.yutra.yaml"], io);

    expect(code).toBe(0);
    expect(stdout.some((line) => line.includes("=== Source ==="))).toBe(true);
    expect(stdout.some((line) => line.includes("=== Canonical IR Summary ==="))).toBe(true);
  });

  it("cli explain command works for zh-CN DSL", async () => {
    const { io, stdout } = createMemoryIO();
    const code = await runCli(["dsl", "explain", "examples/it-helpdesk/agent.zh-CN.yutra.yaml"], io);

    expect(code).toBe(0);
    expect(stdout.some((line) => line.includes("chinese_alias_detected: yes"))).toBe(true);
    expect(stdout.some((line) => line.includes("it_helpdesk_agent"))).toBe(true);
  });

  it("cli inspect --json returns stable structured output", async () => {
    const { io, stdout } = createMemoryIO();
    const code = await runCli(["dsl", "inspect", "examples/it-helpdesk/agent.zh-CN.yutra.yaml", "--json"], io);

    expect(code).toBe(0);
    const parsed = JSON.parse(stdout.join("\n")) as {
      source: { hasChineseAliases: boolean };
      mappings: { fieldAliases: unknown[]; canonicalNames: unknown[] };
      canonical: { agent: string };
    };
    expect(parsed.source.hasChineseAliases).toBe(true);
    expect(Array.isArray(parsed.mappings.fieldAliases)).toBe(true);
    expect(Array.isArray(parsed.mappings.canonicalNames)).toBe(true);
    expect(parsed.canonical.agent).toBe("it_helpdesk_agent");
  });

  it("explain output contains field alias mapping summary", async () => {
    const { io, stdout } = createMemoryIO();
    await runCli(["dsl", "explain", "examples/it-helpdesk/agent.zh-CN.yutra.yaml"], io);
    expect(stdout.some((line) => line.includes("智能体 -> agent"))).toBe(true);
  });

  it("explain output contains canonicalization mapping summary", async () => {
    const { io, stdout } = createMemoryIO();
    await runCli(["dsl", "explain", "examples/it-helpdesk/agent.zh-CN.yutra.yaml"], io);
    expect(stdout.some((line) => line.includes("(state) 诊断 -> triage"))).toBe(true);
  });

  it("inspect output includes mapping provenance", async () => {
    const { io, stdout } = createMemoryIO();
    await runCli(["dsl", "inspect", "examples/it-helpdesk/agent.zh-CN.yutra.yaml", "--json"], io);
    const parsed = JSON.parse(stdout.join("\n")) as {
      mappings: { fieldAliases: Array<{ provenance: string }>; canonicalNames: Array<{ strategy: string }> };
    };

    expect(parsed.mappings.fieldAliases.every((item) => item.provenance === "alias_map")).toBe(true);
    expect(parsed.mappings.canonicalNames.every((item) => Boolean(item.strategy))).toBe(true);
  });

  it("mixed zh/en DSL produces deterministic warnings or stable output", async () => {
    const { io, stdout } = createMemoryIO();
    const code = await runCli(["dsl", "inspect", "packages/dsl/test/fixtures/chinese-alias.yutra.yaml", "--json"], io);
    expect(code).toBe(0);
    const parsed = JSON.parse(stdout.join("\n")) as { warnings: Array<{ code: string }> };
    expect(Array.isArray(parsed.warnings)).toBe(true);
  });

  it("unsupported terms appear in warnings instead of being silently swallowed", async () => {
    const { io, stdout } = createMemoryIO();
    await runCli(["dsl", "inspect", "packages/dsl/test/fixtures/chinese-alias.yutra.yaml", "--json"], io);
    const parsed = JSON.parse(stdout.join("\n")) as { warnings: Array<{ message: string }> };
    expect(parsed.warnings.length).toBeGreaterThan(0);
    expect(parsed.warnings.some((item) => item.message.includes("deterministic fallback"))).toBe(true);
  });

  it("CLI run still works after runtime hardening", async () => {
    const dir = await mkdtemp(join(tmpdir(), "yutra-cli-hardening-"));
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

  it("trace export command writes bundle file", async () => {
    const dir = await mkdtemp(join(tmpdir(), "yutra-cli-export-"));
    const traceFile = join(dir, "events.jsonl");
    const outFile = join(dir, "audit.json");

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

    const exportIO = createMemoryIO();
    const code = await runCli(
      ["trace", "export", runId ?? "", "--trace-file", traceFile, "--out", outFile],
      exportIO.io
    );

    expect(code).toBe(0);
    expect(exportIO.stdout.some((line) => line.includes("audit_bundle:"))).toBe(true);
    const parsed = JSON.parse(readFileSync(outFile, "utf8")) as { meta: { runId: string } };
    expect(parsed.meta.runId).toBe(runId);
    await rm(dir, { recursive: true, force: true });
  });

  it("yutra skill list works", async () => {
    const { io, stdout } = createMemoryIO();
    const code = await runCli(["skill", "list"], io);
    expect(code).toBe(0);
    expect(stdout.some((line) => line.includes("query_shipping_status"))).toBe(true);
  });

  it("yutra skill list --json returns stable JSON", async () => {
    const { io, stdout } = createMemoryIO();
    const code = await runCli(["skill", "list", "--json"], io);
    expect(code).toBe(0);
    const parsed = JSON.parse(stdout.join("\n")) as {
      skills: Array<{ name: string; version: string; type: string; dir: string; ok: boolean }>;
    };
    expect(Array.isArray(parsed.skills)).toBe(true);
    expect(parsed.skills.some((item) => item.name === "query_shipping_status" && item.ok)).toBe(true);
  });

  it("yutra skill inspect query_shipping_status works with scoped skills-dir", async () => {
    const { io, stdout } = createMemoryIO();
    const code = await runCli(["skill", "inspect", "query_shipping_status", "--skills-dir", "skills"], io);
    expect(code).toBe(0);
    expect(stdout.some((line) => line.includes("name: query_shipping_status"))).toBe(true);
  });

  it("yutra skill inspect skills/query-shipping works", async () => {
    const { io, stdout } = createMemoryIO();
    const code = await runCli(["skill", "inspect", "skills/query-shipping"], io);
    expect(code).toBe(0);
    expect(stdout.some((line) => line.includes("entryExists: true"))).toBe(true);
  });

  it("yutra skill inspect skills/query-shipping --as-action works", async () => {
    const { io, stdout } = createMemoryIO();
    const code = await runCli(["skill", "inspect", "skills/query-shipping", "--as-action"], io);
    expect(code).toBe(0);
    expect(stdout.some((line) => line.includes("action.name: query_shipping_status"))).toBe(true);
    expect(stdout.some((line) => line.includes("implementation.type: skill"))).toBe(true);
    expect(stdout.some((line) => line.includes("implementation.entry: scripts/run.mjs"))).toBe(true);
  });

  it("yutra skill inspect skills/query-shipping --as-action --json returns stable JSON", async () => {
    const { io, stdout } = createMemoryIO();
    const code = await runCli(["skill", "inspect", "skills/query-shipping", "--as-action", "--json"], io);
    expect(code).toBe(0);
    const parsed = JSON.parse(stdout.join("\n")) as {
      name: string;
      sideEffect: string;
      riskLevel: string;
      requiresApproval: boolean;
      implementation: { type: string; skillName: string; entry: string };
    };
    expect(parsed.name).toBe("query_shipping_status");
    expect(parsed.sideEffect).toBe("read");
    expect(parsed.riskLevel).toBe("low");
    expect(parsed.requiresApproval).toBe(false);
    expect(parsed.implementation.type).toBe("skill");
    expect(parsed.implementation.skillName).toBe("query_shipping_status");
    expect(parsed.implementation.entry).toBe("scripts/run.mjs");
  });

  it("yutra skill validate skills/query-shipping exits 0", async () => {
    const { io, stdout } = createMemoryIO();
    const code = await runCli(["skill", "validate", "skills/query-shipping"], io);
    expect(code).toBe(0);
    expect(stdout.some((line) => line.includes("OK"))).toBe(true);
  });

  it("yutra skill list --skills-dir examples/ecommerce-support/skills works", async () => {
    const { io, stdout } = createMemoryIO();
    const code = await runCli(["skill", "list", "--skills-dir", "examples/ecommerce-support/skills"], io);
    expect(code).toBe(0);
    expect(stdout.some((line) => line.includes("query_order"))).toBe(true);
    expect(stdout.some((line) => line.includes("create_support_ticket"))).toBe(true);
  });

  it("yutra skill inspect ecommerce query-shipping --as-action --json works", async () => {
    const { io, stdout } = createMemoryIO();
    const code = await runCli(
      [
        "skill",
        "inspect",
        "examples/ecommerce-support/skills/query-shipping",
        "--as-action",
        "--json"
      ],
      io
    );
    expect(code).toBe(0);
    const parsed = JSON.parse(stdout.join("\n")) as {
      name: string;
      implementation: { type: string; skillName: string };
      sideEffect: string;
    };
    expect(parsed.name).toBe("query_shipping_status");
    expect(parsed.implementation.type).toBe("skill");
    expect(parsed.implementation.skillName).toBe("query_shipping_status");
    expect(parsed.sideEffect).toBe("read");
  });

  it("CLI run supports skill-based ecommerce agent with --skills-dir and trace export", async () => {
    const dir = await mkdtemp(join(tmpdir(), "yutra-cli-ecom-skill-"));
    const traceFile = join(dir, "events.jsonl");
    const outFile = join(dir, "audit.json");
    const previousCwd = process.cwd();
    process.chdir(workspaceRoot);
    try {
      const runIO = createMemoryIO();
      const shippingCode = await runCli(
        [
          "run",
          "examples/ecommerce-support/agent.skill.yutra.yaml",
          "--input",
          "examples/ecommerce-support/demo-inputs/shipping-case.json",
          "--skills-dir",
          "examples/ecommerce-support/skills",
          "--trace-file",
          traceFile
        ],
        runIO.io
      );
      expect(shippingCode).toBe(0);
      expect(runIO.stdout.some((line) => line.includes("status: completed"))).toBe(true);

      const runId = runIO.stdout.find((line) => line.startsWith("runId: "))?.replace("runId: ", "");
      expect(runId).toBeTruthy();
      const exportIO = createMemoryIO();
      const exportCode = await runCli(["trace", "export", runId ?? "", "--trace-file", traceFile, "--out", outFile], exportIO.io);
      expect(exportCode).toBe(0);
      expect(exportIO.stdout.some((line) => line.includes("audit_bundle:"))).toBe(true);

      const handoffIO = createMemoryIO();
      const handoffCode = await runCli(
        [
          "run",
          "examples/ecommerce-support/agent.skill.yutra.yaml",
          "--input",
          "examples/ecommerce-support/demo-inputs/refund-high-risk.json",
          "--skills-dir",
          "examples/ecommerce-support/skills",
          "--trace-file",
          traceFile
        ],
        handoffIO.io
      );
      expect(handoffCode).toBe(0);
      expect(handoffIO.stdout.some((line) => line.includes("status: handoff"))).toBe(true);
    } finally {
      process.chdir(previousCwd);
    }
    await rm(dir, { recursive: true, force: true });
  });

  it("invalid skill validate exits non-zero", async () => {
    const dir = await mkdtemp(join(tmpdir(), "yutra-cli-skill-invalid-"));
    await mkdir(join(dir, "bad-skill"), { recursive: true });
    await writeFile(
      join(dir, "bad-skill", "skill.json"),
      JSON.stringify({ name: "", version: "0.1.0", type: "unknown" }, null, 2),
      "utf8"
    );

    const { io } = createMemoryIO();
    const code = await runCli(["skill", "validate", join(dir, "bad-skill")], io);
    expect(code).not.toBe(0);
    await rm(dir, { recursive: true, force: true });
  });

  it("SKILL.md missing appears as warning, not failure", async () => {
    const dir = await mkdtemp(join(tmpdir(), "yutra-cli-skill-missing-md-"));
    const skillDir = join(dir, "no-md-skill");
    await mkdir(join(skillDir, "scripts"), { recursive: true });
    await writeFile(
      join(skillDir, "skill.json"),
      JSON.stringify(
        {
          name: "no_md_skill",
          version: "0.1.0",
          type: "function",
          entry: "scripts/run.mjs"
        },
        null,
        2
      ),
      "utf8"
    );
    await writeFile(join(skillDir, "scripts/run.mjs"), "export async function run(){ return { ok: true }; }", "utf8");

    const { io, stdout } = createMemoryIO();
    const code = await runCli(["skill", "validate", skillDir], io);
    expect(code).toBe(0);
    expect(stdout.some((line) => line.includes("warnings: 1"))).toBe(true);
    await rm(dir, { recursive: true, force: true });
  });
});
