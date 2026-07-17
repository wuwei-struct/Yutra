import { existsSync, readFileSync } from "node:fs";
import { mkdir, rename, writeFile } from "node:fs/promises";
import { isAbsolute, relative, resolve, sep } from "node:path";
import {
  COMPOSITION_ARTIFACT_FILENAMES,
  SLOT_ARTIFACT_FILENAMES
} from "@yutra/scenario-composition-compiler";
import {
  ORCHESTRATOR_ARTIFACT_FILENAMES,
  compileScenarioOrchestratorPreview,
  type ScenarioOrchestratorCompileResult
} from "@yutra/scenario-orchestrator-compiler";
import { stableJson } from "@yutra/rule-compiler";
import { getStringFlag } from "./args";
import {
  EXIT_CODE_GENERAL_FAILURE,
  EXIT_CODE_SUCCESS,
  EXIT_CODE_TRACE_FAILURE
} from "./exit-codes";
import type { CliIO } from "./io";
import { resolveWorkspacePath } from "./workspace-path";

function hasTraversal(inputPath: string): boolean {
  return (
    inputPath.includes("\0") ||
    inputPath.split(/[\\/]+/).includes("..")
  );
}

function safeChild(root: string, relativePath: string): string | undefined {
  if (hasTraversal(relativePath) || isAbsolute(relativePath)) return undefined;
  const target = resolve(root, relativePath);
  const fromRoot = relative(root, target);
  if (
    fromRoot === "" ||
    fromRoot === ".." ||
    fromRoot.startsWith(`..${sep}`) ||
    isAbsolute(fromRoot)
  ) {
    return undefined;
  }
  return target;
}

async function writeUtf8Atomic(path: string, content: string): Promise<void> {
  const tempPath = `${path}.tmp-${process.pid}-${Date.now()}`;
  await writeFile(tempPath, content, "utf8");
  await rename(tempPath, path);
}

function targetFiles(
  result: ScenarioOrchestratorCompileResult
): Array<{ relativePath: string; content: string }> {
  return [
    ...COMPOSITION_ARTIFACT_FILENAMES.map((filename) => ({
      relativePath: filename,
      content: result.compositionResult.compositionArtifacts[filename]
    })),
    ...result.compositionResult.slots.flatMap((slot) =>
      SLOT_ARTIFACT_FILENAMES.map((filename) => ({
        relativePath: `${slot.namespace}/${filename}`,
        content: slot.artifacts[filename]
      }))
    ),
    ...ORCHESTRATOR_ARTIFACT_FILENAMES.map((filename) => ({
      relativePath: filename,
      content: result.orchestratorArtifacts[filename]
    }))
  ];
}

function summary(
  result: ScenarioOrchestratorCompileResult,
  options: { dryRun: boolean; outDir?: string }
) {
  return {
    ok: true,
    mode: "preview",
    compositionId: result.compositionId,
    orchestratorId: result.orchestratorId,
    compilerVersion: result.compilerVersion,
    previewOnly: true,
    runtimeExecutable: false,
    currentRuntimeSupported: false,
    noRuntimeExecutionPerformed: true,
    noAgentDslGenerated: true,
    dryRun: options.dryRun,
    outDir: options.outDir ?? null,
    planHash: result.planHash,
    compositionBundleHash: result.compositionBundleHash,
    orchestratorHash: result.orchestratorHash,
    previewBundleHash: result.previewBundleHash,
    slotCount: result.compositionResult.slots.length,
    compositionArtifactFilenames: [...COMPOSITION_ARTIFACT_FILENAMES],
    orchestratorArtifactFilenames: [...ORCHESTRATOR_ARTIFACT_FILENAMES],
    issues: []
  };
}

export function printOrchestratorCompileHelp(io: CliIO): void {
  io.stdout("Usage:");
  io.stdout(
    "  yutra orchestrator compile <composition-plan.json> --out <dir> [--force] [--dry-run] [--json]"
  );
  io.stdout("");
  io.stdout("Creates a preview-only Scenario Orchestrator Contract Bundle.");
  io.stdout(
    "previewOnly=true; runtimeExecutable=false; currentRuntimeSupported=false."
  );
  io.stdout("No Runtime execution is performed and no Agent DSL is generated.");
}

export async function runOrchestratorCompile(
  args: string[],
  flags: Record<string, string | boolean>,
  io: CliIO
): Promise<number> {
  if (flags.help === true) {
    printOrchestratorCompileHelp(io);
    return EXIT_CODE_SUCCESS;
  }
  const file = args[0];
  if (!file) {
    io.stderr("Missing required argument <composition-plan.json>.");
    return EXIT_CODE_GENERAL_FAILURE;
  }
  const out = getStringFlag(flags, "out");
  if (!out) {
    io.stderr("Missing required flag --out <dir>.");
    return EXIT_CODE_GENERAL_FAILURE;
  }

  const dryRun = flags["dry-run"] === true;
  const force = flags.force === true;
  const json = flags.json === true;
  if (hasTraversal(out)) {
    const issue = {
      code: "ORCHESTRATOR_OUTPUT_PATH_UNSAFE",
      severity: "error",
      message:
        "Orchestrator output path must not contain parent-directory traversal."
    };
    if (json) io.stdout(stableJson({ ok: false, issues: [issue] }));
    else io.stderr(`${issue.code}: ${issue.message}`);
    return EXIT_CODE_GENERAL_FAILURE;
  }

  const inputPath = resolveWorkspacePath(file);
  const outDir = isAbsolute(out) ? resolve(out) : resolve(process.cwd(), out);
  let compositionPlan: unknown;
  try {
    compositionPlan = JSON.parse(readFileSync(inputPath, "utf8"));
  } catch (error) {
    const issue = {
      code: "ORCHESTRATOR_COMPILE_INPUT_INVALID",
      severity: "error",
      message: `Failed to read or parse Scenario Composition Plan JSON: ${(error as Error).message}`
    };
    if (json) io.stdout(stableJson({ ok: false, issues: [issue] }));
    else io.stderr(`${issue.code}: ${issue.message}`);
    return EXIT_CODE_GENERAL_FAILURE;
  }

  const output = compileScenarioOrchestratorPreview({ compositionPlan });
  if (!output.ok) {
    if (json) {
      io.stdout(
        stableJson({
          ok: false,
          mode: "preview",
          previewOnly: true,
          runtimeExecutable: false,
          currentRuntimeSupported: false,
          dryRun,
          issues: output.issues
        })
      );
    } else {
      io.stderr("orchestrator compile: failed");
      for (const issue of output.issues) {
        io.stderr(`- [${issue.severity}] ${issue.code}: ${issue.message}`);
      }
    }
    return EXIT_CODE_GENERAL_FAILURE;
  }

  const compileSummary = summary(output.result, {
    dryRun,
    outDir: dryRun ? undefined : outDir
  });
  if (dryRun) {
    if (json) io.stdout(stableJson(compileSummary));
    else {
      io.stdout(`compositionId: ${output.result.compositionId}`);
      io.stdout(`orchestratorId: ${output.result.orchestratorId}`);
      io.stdout(`orchestratorHash: ${output.result.orchestratorHash}`);
      io.stdout(`previewBundleHash: ${output.result.previewBundleHash}`);
      io.stdout("previewOnly: true");
      io.stdout("runtimeExecutable: false");
      io.stdout("currentRuntimeSupported: false");
      io.stdout("runtimeExecutionPerformed: false");
      io.stdout("agentDslGenerated: false");
      io.stdout("dryRun: true");
    }
    return EXIT_CODE_SUCCESS;
  }

  if (existsSync(outDir) && !force) {
    const issue = {
      code: "ORCHESTRATOR_OUTPUT_EXISTS",
      severity: "error",
      message: `Output directory already exists: ${outDir}`,
      hint: "Use --force to overwrite known preview artifacts."
    };
    if (json) io.stdout(stableJson({ ok: false, issues: [issue] }));
    else io.stderr(`${issue.code}: ${issue.message}`);
    return EXIT_CODE_GENERAL_FAILURE;
  }

  const files = targetFiles(output.result);
  const resolvedFiles = files.map((item) => ({
    ...item,
    path: safeChild(outDir, item.relativePath)
  }));
  const unsafe = resolvedFiles.find((item) => !item.path);
  if (unsafe) {
    const issue = {
      code: "ORCHESTRATOR_OUTPUT_PATH_UNSAFE",
      severity: "error",
      message: `Unsafe Orchestrator artifact path: ${unsafe.relativePath}`
    };
    if (json) io.stdout(stableJson({ ok: false, issues: [issue] }));
    else io.stderr(`${issue.code}: ${issue.message}`);
    return EXIT_CODE_GENERAL_FAILURE;
  }

  try {
    await mkdir(outDir, { recursive: true });
    for (const artifact of resolvedFiles) {
      await mkdir(resolve(artifact.path!, ".."), { recursive: true });
      await writeUtf8Atomic(artifact.path!, artifact.content);
    }
  } catch {
    const issue = {
      code: "ORCHESTRATOR_WRITE_FAILED",
      severity: "error",
      message: "Failed to write Orchestrator Preview Bundle."
    };
    if (json) io.stdout(stableJson({ ok: false, issues: [issue] }));
    else io.stderr(`${issue.code}: ${issue.message}`);
    return EXIT_CODE_TRACE_FAILURE;
  }

  if (json) {
    io.stdout(
      stableJson({
        ...compileSummary,
        writtenFiles: files.map((item) => item.relativePath)
      })
    );
  } else {
    io.stdout(`compositionId: ${output.result.compositionId}`);
    io.stdout(`orchestratorId: ${output.result.orchestratorId}`);
    io.stdout(`outDir: ${outDir}`);
    io.stdout(`orchestratorHash: ${output.result.orchestratorHash}`);
    io.stdout(`previewBundleHash: ${output.result.previewBundleHash}`);
    io.stdout("previewOnly: true");
    io.stdout("runtimeExecutable: false");
    io.stdout("currentRuntimeSupported: false");
    io.stdout("runtimeExecutionPerformed: false");
    io.stdout("agentDslGenerated: false");
    for (const artifact of files) {
      io.stdout(`artifact: ${artifact.relativePath}`);
    }
  }
  return EXIT_CODE_SUCCESS;
}
