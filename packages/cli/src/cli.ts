import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { loadAndValidateDslFile } from "@yutra/dsl";
import { executeRun } from "@yutra/runtime";
import type { ActionRegistry } from "@yutra/runtime";
import { JsonlTraceStorage, TraceReader } from "@yutra/trace";
import { getStringFlag, parseArgs } from "./args";
import { EXIT_CODE_GENERAL_FAILURE, EXIT_CODE_SUCCESS, EXIT_CODE_TRACE_FAILURE, EXIT_CODE_VALIDATION_FAILURE } from "./exit-codes";
import { formatIssues, formatRunSummary, formatTraceTable, formatTraceTimeline, formatValidateSummary } from "./formatters";
import type { CliIO } from "./io";

const DEFAULT_TRACE_FILE = ".yutra/traces/events.jsonl";

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
  io.stdout("  yutra run <file> [--input <json>] [--trace-file <jsonl>]");
  io.stdout("  yutra trace list [--trace-file <jsonl>]");
  io.stdout("  yutra trace show <runId> [--trace-file <jsonl>] [--json]");
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

  const exampleRegistry = await loadExampleActionRegistry(dslPath);
  const actionRegistry = (exampleRegistry ??
    createDefaultActionRegistry(loaded.spec.actions?.map((action) => action.name))) as ActionRegistry;
  const traceStorage = new JsonlTraceStorage(traceFile);

  const result = await executeRun({
    spec: loaded.spec,
    input,
    options: {
      actionRegistry,
      traceStorage
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

    io.stderr(`Unknown command: ${positionals.join(" ")}`);
    printHelp(io);
    return EXIT_CODE_GENERAL_FAILURE;
  } catch (error) {
    io.stderr(`Command failed: ${(error as Error).message}`);
    return EXIT_CODE_GENERAL_FAILURE;
  }
}
