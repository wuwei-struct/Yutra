import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { isAbsolute } from "node:path";
import { pathToFileURL } from "node:url";
import { mkdir, writeFile } from "node:fs/promises";
import { formatExplainOutput, inspectCanonicalization, loadAndValidateDslFile, loadDslFile } from "@yutra/dsl";
import { executeRun } from "@yutra/runtime";
import type { ActionRegistry } from "@yutra/runtime";
import { createSkillRegistry, discoverSkills, loadSkillFromDir, skillToAction, validateLoadedSkill } from "@yutra/skill-core";
import type { DiscoveredSkill } from "@yutra/skill-core";
import * as TraceCore from "@yutra/trace";
import { JsonlTraceStorage, TraceReader } from "@yutra/trace";
import { getStringFlag, parseArgs } from "./args";
import { EXIT_CODE_GENERAL_FAILURE, EXIT_CODE_SUCCESS, EXIT_CODE_TRACE_FAILURE, EXIT_CODE_VALIDATION_FAILURE } from "./exit-codes";
import { formatIssues, formatRunSummary, formatTraceTable, formatTraceTimeline, formatValidateSummary } from "./formatters";
import type { CliIO } from "./io";

const DEFAULT_TRACE_FILE = ".yutra/traces/events.jsonl";
const DEFAULT_SKILL_PATHS = ["skills", ".yutra/skills", "examples/ecommerce-support/skills"];

function findWorkspaceRoot(start: string): string {
  let current = start;
  while (true) {
    if (existsSync(resolve(current, "pnpm-workspace.yaml"))) {
      return current;
    }

    const parent = dirname(current);
    if (parent === current) {
      return start;
    }
    current = parent;
  }
}

function resolveWorkspacePath(inputPath: string): string {
  if (isAbsolute(inputPath)) {
    return inputPath;
  }

  const cwdPath = resolve(process.cwd(), inputPath);
  if (existsSync(cwdPath)) {
    return cwdPath;
  }

  const workspaceRoot = findWorkspaceRoot(process.cwd());
  return resolve(workspaceRoot, inputPath);
}

function printHelp(io: CliIO): void {
  io.stdout("Yutra CLI v0.1");
  io.stdout("");
  io.stdout("Commands:");
  io.stdout("  yutra validate <file>");
  io.stdout("  yutra run <file> [--input <json>] [--trace-file <jsonl>] [--skills-dir <path>]");
  io.stdout("  yutra dsl explain <file>");
  io.stdout("  yutra dsl inspect <file> [--json]");
  io.stdout("  yutra skill list [--json] [--skills-dir <path>]");
  io.stdout("  yutra skill inspect <nameOrPath> [--as-action] [--json] [--skills-dir <path>]");
  io.stdout("  yutra skill validate <path> [--json]");
  io.stdout("  yutra trace list [--trace-file <jsonl>]");
  io.stdout("  yutra trace show <runId> [--trace-file <jsonl>] [--json]");
  io.stdout("  yutra trace export <runId> --out <json> [--trace-file <jsonl>]");
}

function resolveSkillsSearchPaths(flags: Record<string, string | boolean>): string[] {
  const configured = getStringFlag(flags, "skills-dir");
  if (!configured) {
    return DEFAULT_SKILL_PATHS;
  }
  return configured
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function toSkillListJson(discovered: DiscoveredSkill[]) {
  return {
    skills: discovered.map((skill) => ({
      name: skill.name ?? null,
      version: skill.version ?? null,
      type: skill.manifest?.type ?? null,
      sideEffect: skill.manifest?.sideEffect ?? null,
      riskLevel: skill.manifest?.riskLevel ?? null,
      requiresApproval: skill.manifest?.requiresApproval ?? null,
      dir: skill.dir,
      ok: skill.ok,
      status: skill.ok ? "ok" : "invalid",
      issues: skill.issues
    }))
  };
}

function createDefaultActionRegistry(actionNames: string[] = []) {
  const names = Array.isArray(actionNames) ? actionNames : [];
  return Object.fromEntries(
    names.map((name) => [
      name,
      async () => ({
        ok: true,
        output: { mocked: true }
      })
    ])
  );
}

async function loadExampleActionRegistry(
  dslPath: string
): Promise<Record<string, (ctx: unknown) => Promise<unknown>> | null> {
  const candidateFiles = ["actions.mjs", "actions.js", "actions.cjs"];
  const baseDir = dirname(dslPath);

  for (const candidate of candidateFiles) {
    const fullPath = resolve(baseDir, candidate);
    if (!existsSync(fullPath)) {
      continue;
    }

    const module = await import(pathToFileURL(fullPath).href);
    const exported =
      (module.actionRegistry as Record<string, (ctx: unknown) => Promise<unknown>> | undefined) ??
      (module.default as Record<string, (ctx: unknown) => Promise<unknown>> | undefined);
    if (exported && typeof exported === "object") {
      return exported;
    }
  }

  return null;
}

function getInitialStateFromTrace(events: Array<{ type: string; state?: string }>): string | undefined {
  return events.find((event) => event.type === "state.entered")?.state;
}

async function runValidate(args: string[], io: CliIO): Promise<number> {
  const file = args[0];
  if (!file) {
    io.stderr("Missing required argument <file>.");
    return EXIT_CODE_GENERAL_FAILURE;
  }

  const loaded = loadAndValidateDslFile(resolveWorkspacePath(file));
  const summaryLines = formatValidateSummary(loaded.spec, loaded.validation);
  summaryLines.forEach((line) => io.stdout(line));

  formatIssues("errors", loaded.validation.errors).forEach((line) => io.stdout(line));
  formatIssues("warnings", loaded.validation.warnings).forEach((line) => io.stdout(line));

  if (!loaded.validation.valid) {
    return EXIT_CODE_VALIDATION_FAILURE;
  }

  io.stdout("Validation succeeded.");
  return EXIT_CODE_SUCCESS;
}

async function runRun(args: string[], flags: Record<string, string | boolean>, io: CliIO): Promise<number> {
  const file = args[0];
  if (!file) {
    io.stderr("Missing required argument <file>.");
    return EXIT_CODE_GENERAL_FAILURE;
  }

  const dslPath = resolveWorkspacePath(file);
  const inputPath = getStringFlag(flags, "input");
  const traceFile = resolveWorkspacePath(getStringFlag(flags, "trace-file") ?? DEFAULT_TRACE_FILE);
  const skillSearchPaths = resolveSkillsSearchPaths(flags).map((path) => resolveWorkspacePath(path));

  let input: { text?: string; intent?: string; context?: Record<string, unknown> } | undefined;
  if (inputPath) {
    const parsed = JSON.parse(readFileSync(resolveWorkspacePath(inputPath), "utf8")) as {
      text?: string;
      message?: string;
      intent?: string;
      context?: Record<string, unknown>;
    };
    input = {
      text: parsed.text ?? parsed.message,
      intent: parsed.intent,
      context: parsed.context
    };
  }

  const loaded = loadAndValidateDslFile(dslPath);
  if (!loaded.validation.valid) {
    formatIssues("errors", loaded.validation.errors).forEach((line) => io.stderr(line));
    formatIssues("warnings", loaded.validation.warnings).forEach((line) => io.stderr(line));
    return EXIT_CODE_VALIDATION_FAILURE;
  }

  let specForRun = loaded.spec;
  if ((loaded.spec.actions ?? []).some((action) => action.implementation?.type === "skill")) {
    const skillRegistry = createSkillRegistry({
      paths: skillSearchPaths
    });
    const discovered = await skillRegistry.discover();
    const index = new Map<string, string>();
    for (const item of discovered) {
      if (item.ok && item.name) {
        index.set(item.name, item.dir);
      }
    }

    specForRun = {
      ...loaded.spec,
      actions: (loaded.spec.actions ?? []).map((action) => {
        if (action.implementation?.type !== "skill") {
          return action;
        }
        const implementation = { ...(action.implementation as Record<string, unknown>) } as Record<string, unknown> & {
          type: "skill";
        };
        if (typeof implementation.skillDir !== "string") {
          const skillName = typeof implementation.skillName === "string" ? implementation.skillName : action.name;
          const skillDir = index.get(skillName);
          if (skillDir) {
            implementation.skillDir = skillDir;
          }
        }
        return {
          ...action,
          implementation: implementation as typeof action.implementation
        };
      })
    };
  }

  const exampleRegistry = await loadExampleActionRegistry(dslPath);
  const actionRegistry = (exampleRegistry ??
    createDefaultActionRegistry(loaded.spec.actions?.map((action) => action.name))) as ActionRegistry;
  const traceStorage = new JsonlTraceStorage(traceFile);

  const result = await executeRun({
    spec: specForRun,
    input,
    options: {
      actionRegistry,
      traceStorage,
      skillSearchPaths
    }
  });

  formatRunSummary({
    runId: result.runId,
    agent: result.agent,
    status: result.status,
    intent: result.intent,
    initialState: getInitialStateFromTrace(result.traceEvents ?? []),
    finalState: result.finalState,
    steps: result.steps,
    traceFile,
    errorCode: result.error?.code,
    errorMessage: result.error?.message
  }).forEach((line) => io.stdout(line));

  return result.status === "failed" ? EXIT_CODE_GENERAL_FAILURE : EXIT_CODE_SUCCESS;
}

async function runTraceList(flags: Record<string, string | boolean>, io: CliIO): Promise<number> {
  const traceFile = resolveWorkspacePath(getStringFlag(flags, "trace-file") ?? DEFAULT_TRACE_FILE);
  const storage = new JsonlTraceStorage(traceFile);
  const reader = new TraceReader(storage);

  try {
    const runIds = await reader.listRuns();
    const rows: Array<Record<string, string>> = [];

    for (const runId of runIds) {
      const summary = await storage.getRunSummary(runId);
      const events = await storage.getRunEvents(runId);
      rows.push({
        runId,
        agent: events[0]?.agent ?? "-",
        status: summary?.status ?? "unknown",
        startedAt: summary?.startedAt ?? "-",
        endedAt: summary?.endedAt ?? "-",
        eventCount: String(summary?.eventCount ?? 0)
      });
    }

    formatTraceTable(rows).forEach((line) => io.stdout(line));
    return EXIT_CODE_SUCCESS;
  } catch (error) {
    io.stderr(`Trace read failed: ${(error as Error).message}`);
    return EXIT_CODE_TRACE_FAILURE;
  }
}

async function runTraceShow(
  args: string[],
  flags: Record<string, string | boolean>,
  io: CliIO
): Promise<number> {
  const runId = args[0];
  if (!runId) {
    io.stderr("Missing required argument <runId>.");
    return EXIT_CODE_GENERAL_FAILURE;
  }

  const traceFile = resolveWorkspacePath(getStringFlag(flags, "trace-file") ?? DEFAULT_TRACE_FILE);
  const storage = new JsonlTraceStorage(traceFile);
  const reader = new TraceReader(storage);

  try {
    const events = await reader.getRunTimeline(runId);
    if (flags.json === true) {
      io.stdout(JSON.stringify(events, null, 2));
      return EXIT_CODE_SUCCESS;
    }

    formatTraceTimeline(events).forEach((line) => io.stdout(line));
    return EXIT_CODE_SUCCESS;
  } catch (error) {
    io.stderr(`Trace read failed: ${(error as Error).message}`);
    return EXIT_CODE_TRACE_FAILURE;
  }
}

async function runTraceExport(
  args: string[],
  flags: Record<string, string | boolean>,
  io: CliIO
): Promise<number> {
  const runId = args[0];
  if (!runId) {
    io.stderr("Missing required argument <runId>.");
    return EXIT_CODE_GENERAL_FAILURE;
  }

  const out = getStringFlag(flags, "out");
  if (!out) {
    io.stderr("Missing required flag --out <json>.");
    return EXIT_CODE_GENERAL_FAILURE;
  }

  const traceFile = resolveWorkspacePath(getStringFlag(flags, "trace-file") ?? DEFAULT_TRACE_FILE);
  const outPath = resolveWorkspacePath(out);
  const storage = new JsonlTraceStorage(traceFile);

  try {
    const maybeExportAuditBundle = (TraceCore as { exportAuditBundle?: unknown }).exportAuditBundle;
    const bundle =
      typeof maybeExportAuditBundle === "function"
        ? await (
            maybeExportAuditBundle as (
              storageArg: JsonlTraceStorage,
              runIdArg: string,
              outPathArg: string
            ) => Promise<{ meta: { runId: string }; runtimeResult: { status: string; eventCount: number } }>
          )(storage, runId, outPath)
        : await exportAuditBundleFallback(storage, runId, outPath);
    io.stdout(`audit_bundle: ${outPath}`);
    io.stdout(`runId: ${bundle.meta.runId}`);
    io.stdout(`status: ${bundle.runtimeResult.status}`);
    io.stdout(`eventCount: ${bundle.runtimeResult.eventCount}`);
    return EXIT_CODE_SUCCESS;
  } catch (error) {
    io.stderr(`Trace export failed: ${(error as Error).message}`);
    return EXIT_CODE_TRACE_FAILURE;
  }
}

async function exportAuditBundleFallback(
  storage: JsonlTraceStorage,
  runId: string,
  outPath: string
): Promise<{ meta: { runId: string }; runtimeResult: { status: string; eventCount: number } }> {
  const reader = new TraceReader(storage);
  const events = await reader.getRunTimeline(runId);
  const summary = await storage.getRunSummary(runId);
  const bundle = {
    meta: {
      runId
    },
    runtimeResult: {
      status: summary?.status ?? "unknown",
      eventCount: events.length
    },
    traceEvents: events
  };

  await mkdir(dirname(outPath), { recursive: true });
  await writeFile(outPath, JSON.stringify(bundle, null, 2), "utf8");
  return bundle;
}

async function runDslExplain(args: string[], io: CliIO): Promise<number> {
  const file = args[0];
  if (!file) {
    io.stderr("Missing required argument <file>.");
    return EXIT_CODE_GENERAL_FAILURE;
  }

  const loaded = loadDslFile(resolveWorkspacePath(file));
  const report = inspectCanonicalization(loaded.raw, { path: loaded.path, format: loaded.format });
  formatExplainOutput(report).forEach((line) => io.stdout(line));
  return EXIT_CODE_SUCCESS;
}

async function runDslInspect(
  args: string[],
  flags: Record<string, string | boolean>,
  io: CliIO
): Promise<number> {
  const file = args[0];
  if (!file) {
    io.stderr("Missing required argument <file>.");
    return EXIT_CODE_GENERAL_FAILURE;
  }

  const loaded = loadDslFile(resolveWorkspacePath(file));
  const report = inspectCanonicalization(loaded.raw, { path: loaded.path, format: loaded.format });

  if (flags.json === true) {
    io.stdout(JSON.stringify(report, null, 2));
    return EXIT_CODE_SUCCESS;
  }

  io.stdout(`path: ${report.source.path ?? "-"}`);
  io.stdout(`format: ${report.source.format ?? "-"}`);
  io.stdout(`field_alias_mappings: ${report.mappings.fieldAliases.length}`);
  io.stdout(`canonical_name_mappings: ${report.mappings.canonicalNames.length}`);
  io.stdout(`issues: ${report.issues.length}`);
  io.stdout(`warnings: ${report.warnings.length}`);
  return EXIT_CODE_SUCCESS;
}

async function runSkillList(flags: Record<string, string | boolean>, io: CliIO): Promise<number> {
  const paths = resolveSkillsSearchPaths(flags);
  const discovered = await discoverSkills(paths, findWorkspaceRoot(process.cwd()));

  if (flags.json === true) {
    io.stdout(JSON.stringify(toSkillListJson(discovered), null, 2));
    return EXIT_CODE_SUCCESS;
  }

  if (discovered.length === 0) {
    io.stdout("No skills found.");
    return EXIT_CODE_SUCCESS;
  }

  for (const skill of discovered) {
    const status = skill.ok ? "ok" : `invalid(${skill.issues.filter((issue) => issue.severity === "error").length})`;
    io.stdout(
      `${skill.name ?? "-"} | ${skill.version ?? "-"} | ${skill.manifest?.type ?? "-"} | ${skill.manifest?.sideEffect ?? "-"} | ${
        skill.manifest?.riskLevel ?? "-"
      } | requiresApproval=${skill.manifest?.requiresApproval ?? false} | ${status} | ${skill.dir}`
    );
  }

  return EXIT_CODE_SUCCESS;
}

async function runSkillInspect(
  args: string[],
  flags: Record<string, string | boolean>,
  io: CliIO
): Promise<number> {
  const nameOrPath = args[0];
  if (!nameOrPath) {
    io.stderr("Missing required argument <nameOrPath>.");
    return EXIT_CODE_GENERAL_FAILURE;
  }

  const registry = createSkillRegistry({
    paths: resolveSkillsSearchPaths(flags),
    baseDir: findWorkspaceRoot(process.cwd())
  });

  const loaded = existsSync(resolveWorkspacePath(nameOrPath))
    ? await loadSkillFromDir(resolveWorkspacePath(nameOrPath))
    : await registry.inspect(nameOrPath);
  const validation = validateLoadedSkill(loaded);
  const asAction = flags["as-action"] === true;

  if (asAction) {
    const action = skillToAction(loaded);
    if (flags.json === true) {
      io.stdout(JSON.stringify(action, null, 2));
      return EXIT_CODE_SUCCESS;
    }

    io.stdout(`action.name: ${action.name}`);
    io.stdout(`action.description: ${action.description ?? "-"}`);
    io.stdout(`action.sideEffect: ${action.sideEffect ?? "none"}`);
    io.stdout(`action.riskLevel: ${action.riskLevel ?? "low"}`);
    io.stdout(`action.requiresApproval: ${action.requiresApproval ?? false}`);
    io.stdout(`implementation.type: ${action.implementation.type}`);
    io.stdout(`implementation.skillName: ${action.implementation.skillName}`);
    io.stdout(`implementation.skillVersion: ${action.implementation.skillVersion ?? "-"}`);
    io.stdout(`implementation.entry: ${action.implementation.entry ?? "-"}`);
    io.stdout(`implementation.skillDir: ${action.implementation.skillDir ?? "-"}`);
    return EXIT_CODE_SUCCESS;
  }

  if (flags.json === true) {
    io.stdout(
      JSON.stringify(
        {
          skill: {
            dir: loaded.dir,
            manifestPath: loaded.manifestPath,
            readmePath: loaded.readmePath,
            manifest: loaded.manifest,
            files: loaded.files
          },
          validation
        },
        null,
        2
      )
    );
    return EXIT_CODE_SUCCESS;
  }

  io.stdout(`name: ${loaded.manifest.name}`);
  io.stdout(`version: ${loaded.manifest.version}`);
  io.stdout(`description: ${loaded.manifest.description ?? "-"}`);
  io.stdout(`type: ${loaded.manifest.type}`);
  io.stdout(`sideEffect: ${loaded.manifest.sideEffect ?? "none"}`);
  io.stdout(`riskLevel: ${loaded.manifest.riskLevel ?? "low"}`);
  io.stdout(`requiresApproval: ${loaded.manifest.requiresApproval ?? false}`);
  io.stdout(`allowedEnvironments: ${(loaded.manifest.allowedEnvironments ?? []).join(",") || "-"}`);
  io.stdout(`maxCallsPerRun: ${loaded.manifest.maxCallsPerRun ?? "-"}`);
  io.stdout(`entry: ${loaded.manifest.entry ?? "-"}`);
  io.stdout(`entryExists: ${loaded.files.entryExists}`);
  io.stdout(`skillMarkdownExists: ${Boolean(loaded.readmePath)}`);
  io.stdout(`references: ${loaded.files.references.join(",") || "-"}`);
  io.stdout(`assets: ${loaded.files.assets.join(",") || "-"}`);
  io.stdout(`tags: ${(loaded.manifest.tags ?? []).join(",") || "-"}`);
  io.stdout(`validation: ${validation.ok ? "ok" : "failed"}`);
  for (const item of validation.issues) {
    io.stdout(`- [${item.severity}] ${item.code}: ${item.message}`);
  }
  return EXIT_CODE_SUCCESS;
}

async function runSkillValidate(
  args: string[],
  flags: Record<string, string | boolean>,
  io: CliIO
): Promise<number> {
  const skillPath = args[0];
  if (!skillPath) {
    io.stderr("Missing required argument <path>.");
    return EXIT_CODE_GENERAL_FAILURE;
  }

  try {
    const loaded = await loadSkillFromDir(resolveWorkspacePath(skillPath));
    const validation = validateLoadedSkill(loaded);
    if (flags.json === true) {
      io.stdout(JSON.stringify(validation, null, 2));
    } else {
      io.stdout(validation.ok ? "OK" : "FAILED");
      const errors = validation.issues.filter((issue) => issue.severity === "error");
      const warnings = validation.issues.filter((issue) => issue.severity === "warning");
      io.stdout(`errors: ${errors.length}`);
      for (const item of errors) {
        io.stdout(`- [${item.code}] ${item.message}`);
      }
      io.stdout(`warnings: ${warnings.length}`);
      for (const item of warnings) {
        io.stdout(`- [${item.code}] ${item.message}`);
      }
    }

    return validation.ok ? EXIT_CODE_SUCCESS : EXIT_CODE_VALIDATION_FAILURE;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (flags.json === true) {
      io.stdout(
        JSON.stringify(
          {
            ok: false,
            issues: [
              {
                code: "SKILL_MANIFEST_INVALID",
                message,
                severity: "error"
              }
            ]
          },
          null,
          2
        )
      );
    } else {
      io.stderr(`FAILED: ${message}`);
    }
    return EXIT_CODE_VALIDATION_FAILURE;
  }
}

export async function runCli(argv: string[], io: CliIO): Promise<number> {
  const { positionals, flags } = parseArgs(argv);
  const [command, subcommand, ...rest] = positionals;

  if (!command || command === "--help" || command === "help") {
    printHelp(io);
    return EXIT_CODE_SUCCESS;
  }

  try {
    if (command === "validate") {
      return runValidate([subcommand, ...rest].filter(Boolean) as string[], io);
    }

    if (command === "run") {
      return runRun([subcommand, ...rest].filter(Boolean) as string[], flags, io);
    }

    if (command === "trace" && subcommand === "list") {
      return runTraceList(flags, io);
    }

    if (command === "trace" && subcommand === "show") {
      return runTraceShow(rest, flags, io);
    }

    if (command === "trace" && subcommand === "export") {
      return runTraceExport(rest, flags, io);
    }

    if (command === "dsl" && subcommand === "explain") {
      return runDslExplain(rest, io);
    }

    if (command === "dsl" && subcommand === "inspect") {
      return runDslInspect(rest, flags, io);
    }

    if (command === "skill" && subcommand === "list") {
      return runSkillList(flags, io);
    }

    if (command === "skill" && subcommand === "inspect") {
      return runSkillInspect(rest, flags, io);
    }

    if (command === "skill" && subcommand === "validate") {
      return runSkillValidate(rest, flags, io);
    }

    io.stderr(`Unknown command: ${positionals.join(" ")}`);
    printHelp(io);
    return EXIT_CODE_GENERAL_FAILURE;
  } catch (error) {
    io.stderr(`Command failed: ${(error as Error).message}`);
    return EXIT_CODE_GENERAL_FAILURE;
  }
}
