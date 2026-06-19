import { mkdtemp, rm, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync, readFileSync } from "node:fs";
import { inspectDsl, parseDsl } from "@yutra/dsl";
import { describe, expect, it } from "vitest";
import { runCli } from "../src/cli";

const workspaceRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const compileConfigPath = "examples/request-resolution-ecommerce-basic/pack.config.json";
const approvalCompileConfigPath = "examples/approval-decision-basic/pack.config.json";
const compiledArtifactFiles = [
  "agent.yutra.yaml",
  "policy.yaml",
  "adapter.config.json",
  "templates.json",
  "test-cases.json",
  "trace.expectation.json",
  "compile-report.json"
];

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

  it("compile --help displays command usage", async () => {
    const { io, stdout } = createMemoryIO();
    const code = await runCli(["compile", "--help"], io);
    expect(code).toBe(0);
    expect(stdout.some((line) => line.includes("yutra compile <pack-config.json> --out <dir>"))).toBe(true);
  });

  it("compile demo config --dry-run succeeds without writing files", async () => {
    const dir = await mkdtemp(join(tmpdir(), "yutra-compile-dry-"));
    const outDir = join(dir, "out");
    const { io, stdout } = createMemoryIO();
    const code = await runCli(["compile", compileConfigPath, "--out", outDir, "--dry-run"], io);

    expect(code).toBe(0);
    expect(stdout.some((line) => line.includes("dryRun: true"))).toBe(true);
    expect(existsSync(outDir)).toBe(false);
    await rm(dir, { recursive: true, force: true });
  });

  it("compile demo config writes all artifacts and compile report", async () => {
    const dir = await mkdtemp(join(tmpdir(), "yutra-compile-out-"));
    const { io } = createMemoryIO();
    const code = await runCli(["compile", compileConfigPath, "--out", dir], io);

    expect(code).toBe(0);
    for (const file of compiledArtifactFiles) {
      expect(existsSync(join(dir, file))).toBe(true);
    }

    const report = JSON.parse(readFileSync(join(dir, "compile-report.json"), "utf8")) as {
      compileId: string;
      compilerVersion: string;
      report: { packConfigHash: string; artifactHashes: Record<string, string> };
    };
    expect(report.compileId).toMatch(/^compile:/);
    expect(report.compilerVersion).toBeTruthy();
    expect(report.report.packConfigHash).toMatch(/^sha256:/);
    expect(report.report.artifactHashes["agent.yutra.yaml"]).toMatch(/^sha256:/);
    await rm(dir, { recursive: true, force: true });
  });

  it("compile refuses overwrite without --force and allows it with --force", async () => {
    const dir = await mkdtemp(join(tmpdir(), "yutra-compile-force-"));
    const firstIO = createMemoryIO();
    const secondIO = createMemoryIO();
    const forceIO = createMemoryIO();

    expect(await runCli(["compile", compileConfigPath, "--out", dir], firstIO.io)).toBe(0);
    expect(await runCli(["compile", compileConfigPath, "--out", dir], secondIO.io)).not.toBe(0);
    expect(secondIO.stderr.some((line) => line.includes("COMPILE_OUTPUT_EXISTS"))).toBe(true);
    expect(await runCli(["compile", compileConfigPath, "--out", dir, "--force"], forceIO.io)).toBe(0);
    await rm(dir, { recursive: true, force: true });
  });

  it("compile invalid JSON returns non-zero", async () => {
    const dir = await mkdtemp(join(tmpdir(), "yutra-compile-invalid-json-"));
    const configPath = join(dir, "bad.json");
    await writeFile(configPath, "{ not json", "utf8");

    const { io, stderr } = createMemoryIO();
    const code = await runCli(["compile", configPath, "--out", join(dir, "out")], io);
    expect(code).not.toBe(0);
    expect(stderr.some((line) => line.includes("PACK_CONFIG_JSON_INVALID"))).toBe(true);
    await rm(dir, { recursive: true, force: true });
  });

  it("compile unsupported archetype returns non-zero", async () => {
    const dir = await mkdtemp(join(tmpdir(), "yutra-compile-unsupported-"));
    const config = JSON.parse(readFileSync(resolve(workspaceRoot, compileConfigPath), "utf8")) as Record<string, unknown>;
    config.archetypeId = "knowledge-answering";
    const configPath = join(dir, "unsupported.json");
    await writeFile(configPath, JSON.stringify(config, null, 2), "utf8");

    const { io, stderr } = createMemoryIO();
    const code = await runCli(["compile", configPath, "--out", join(dir, "out")], io);
    expect(code).not.toBe(0);
    expect(stderr.some((line) => line.includes("RULE_COMPILER_UNSUPPORTED_ARCHETYPE"))).toBe(true);
    await rm(dir, { recursive: true, force: true });
  });

  it("compile approval-decision demo config --dry-run succeeds", async () => {
    const dir = await mkdtemp(join(tmpdir(), "yutra-compile-approval-dry-"));
    const outDir = join(dir, "out");
    const { io, stdout } = createMemoryIO();
    const code = await runCli(["compile", approvalCompileConfigPath, "--out", outDir, "--dry-run"], io);

    expect(code).toBe(0);
    expect(stdout.some((line) => line.includes("dryRun: true"))).toBe(true);
    expect(stdout.some((line) => line.includes("agent.yutra.yaml"))).toBe(true);
    expect(existsSync(outDir)).toBe(false);
    await rm(dir, { recursive: true, force: true });
  });

  it("compile approval-decision demo config writes artifacts", async () => {
    const dir = await mkdtemp(join(tmpdir(), "yutra-compile-approval-out-"));
    const { io } = createMemoryIO();
    const code = await runCli(["compile", approvalCompileConfigPath, "--out", dir], io);

    expect(code).toBe(0);
    for (const file of compiledArtifactFiles) {
      expect(existsSync(join(dir, file))).toBe(true);
    }

    const agentYaml = readFileSync(join(dir, "agent.yutra.yaml"), "utf8");
    const inspected = inspectDsl(parseDsl(agentYaml, "yaml"), { format: "yaml" });
    expect(inspected.issues).toHaveLength(0);
    expect(inspected.canonical.agent).toBe("approval_decision_basic");
    await rm(dir, { recursive: true, force: true });
  });

  it("compile requiredButMissing config returns non-zero", async () => {
    const dir = await mkdtemp(join(tmpdir(), "yutra-compile-missing-"));
    const config = JSON.parse(readFileSync(resolve(workspaceRoot, compileConfigPath), "utf8")) as {
      rules: Record<string, unknown>;
    };
    config.rules.required_demo_field = {
      source: "requiredButMissing",
      required: true,
      label: { en: "Required demo field", zhCN: "必填演示字段" }
    };
    const configPath = join(dir, "missing.json");
    await writeFile(configPath, JSON.stringify(config, null, 2), "utf8");

    const { io, stderr } = createMemoryIO();
    const code = await runCli(["compile", configPath, "--out", join(dir, "out")], io);
    expect(code).not.toBe(0);
    expect(stderr.some((line) => line.includes("REQUIRED_FIELD_MISSING"))).toBe(true);
    await rm(dir, { recursive: true, force: true });
  });

  it("compiled agent.yutra.yaml can be parsed and inspected by @yutra/dsl", async () => {
    const dir = await mkdtemp(join(tmpdir(), "yutra-compile-dsl-"));
    const { io } = createMemoryIO();
    const code = await runCli(["compile", compileConfigPath, "--out", dir], io);
    expect(code).toBe(0);

    const agentYaml = readFileSync(join(dir, "agent.yutra.yaml"), "utf8");
    const report = inspectDsl(parseDsl(agentYaml, "yaml"), { format: "yaml" });
    expect(report.issues).toHaveLength(0);
    expect(Object.keys(report.canonical.states)).toContain("handoff");
    await rm(dir, { recursive: true, force: true });
  });

  it("compiled output contains no secret, real endpoint, or customer name markers", async () => {
    const dir = await mkdtemp(join(tmpdir(), "yutra-compile-safe-"));
    const { io } = createMemoryIO();
    const code = await runCli(["compile", compileConfigPath, "--out", dir], io);
    expect(code).toBe(0);

    const combined = compiledArtifactFiles
      .map((file) => readFileSync(join(dir, file), "utf8"))
      .join("\n")
      .toLowerCase();
    expect(combined).not.toContain("api_key");
    expect(combined).not.toContain("bearer ");
    expect(combined).not.toContain("https://");
    expect(combined).not.toContain("customer name");
    await rm(dir, { recursive: true, force: true });
  });

  it("compile --json --dry-run returns parseable JSON summary", async () => {
    const dir = await mkdtemp(join(tmpdir(), "yutra-compile-json-"));
    const { io, stdout } = createMemoryIO();
    const code = await runCli(["compile", compileConfigPath, "--out", join(dir, "out"), "--dry-run", "--json"], io);

    expect(code).toBe(0);
    const parsed = JSON.parse(stdout.join("\n")) as {
      ok: boolean;
      dryRun: boolean;
      artifactFilenames: string[];
      artifactHashes: Record<string, string>;
    };
    expect(parsed.ok).toBe(true);
    expect(parsed.dryRun).toBe(true);
    expect(parsed.artifactFilenames).toContain("agent.yutra.yaml");
    expect(parsed.artifactHashes["trace.expectation.json"]).toMatch(/^sha256:/);
    await rm(dir, { recursive: true, force: true });
  });
});
