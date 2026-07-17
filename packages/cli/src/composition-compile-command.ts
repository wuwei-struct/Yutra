import { existsSync, readFileSync } from "node:fs";
import { mkdir, rename, writeFile } from "node:fs/promises";
import { isAbsolute, relative, resolve, sep } from "node:path";
import {
  COMPOSITION_ARTIFACT_FILENAMES,
  SLOT_ARTIFACT_FILENAMES,
  compileScenarioCompositionPreview,
  type ScenarioCompositionCompileOutput,
  type ScenarioCompositionCompileResult
} from "@yutra/scenario-composition-compiler";
import { stableJson } from "@yutra/rule-compiler";
import { getStringFlag } from "./args";
import { EXIT_CODE_GENERAL_FAILURE, EXIT_CODE_SUCCESS, EXIT_CODE_TRACE_FAILURE } from "./exit-codes";
import type { CliIO } from "./io";
import { resolveWorkspacePath } from "./workspace-path";

function hasTraversal(inputPath: string): boolean {
  return inputPath.includes("\0") || inputPath.split(/[\\/]+/).includes("..");
}

function safeChild(root: string, relativePath: string): string | undefined {
  if (hasTraversal(relativePath) || isAbsolute(relativePath)) return undefined;
  const target = resolve(root, relativePath);
  const fromRoot = relative(root, target);
  if (fromRoot === "" || fromRoot === ".." || fromRoot.startsWith(`..${sep}`) || isAbsolute(fromRoot)) {
    return undefined;
  }
  return target;
}

async function writeUtf8Atomic(path: string, content: string): Promise<void> {
  const tempPath = `${path}.tmp-${process.pid}-${Date.now()}`;
  await writeFile(tempPath, content, "utf8");
  await rename(tempPath, path);
}

function compileSummary(
  output: ScenarioCompositionCompileOutput,
  options: { dryRun: boolean; outDir?: string }
) {
  if (!output.ok) {
    return {
      ok: false,
      mode: "preview",
      previewOnly: true,
      runtimeExecutable: false,
      noOrchestratorDslGenerated: true,
      dryRun: options.dryRun,
      outDir: options.outDir ?? null,
      issues: output.issues
    };
  }

  return {
    ok: true,
    mode: output.result.mode,
    compositionId: output.result.compositionId,
    compositionCompilerVersion: output.result.compositionCompilerVersion,
    previewOnly: output.result.previewOnly,
    runtimeExecutable: output.result.runtimeExecutable,
    noOrchestratorDslGenerated: true,
    dryRun: options.dryRun,
    outDir: options.outDir ?? null,
    planHash: output.result.planHash,
    bundleHash: output.result.bundleHash,
    slots: output.result.slots.map((slot) => ({
      slotId: slot.slotId,
      role: slot.role,
      archetypeId: slot.archetypeId,
      namespace: slot.namespace,
      configHash: slot.configHash,
      artifactHashes: slot.artifactHashes
    })),
    compositionArtifactFilenames: [...COMPOSITION_ARTIFACT_FILENAMES],
    issues: output.issues
  };
}

function targetFiles(result: ScenarioCompositionCompileResult): Array<{ relativePath: string; content: string }> {
  return [
    ...COMPOSITION_ARTIFACT_FILENAMES.map((filename) => ({
      relativePath: filename,
      content: result.compositionArtifacts[filename]
    })),
    ...result.slots.flatMap((slot) =>
      SLOT_ARTIFACT_FILENAMES.map((filename) => ({
        relativePath: `${slot.namespace}/${filename}`,
        content: slot.artifacts[filename]
      }))
    )
  ];
}

export function printCompositionCompileHelp(io: CliIO): void {
  io.stdout("Usage:");
  io.stdout(
    "  yutra composition compile <composition-plan.json> --out <dir> [--force] [--dry-run] [--json]"
  );
  io.stdout("");
  io.stdout("Creates a namespaced Scenario Composition Preview Bundle.");
  io.stdout("previewOnly=true; runtimeExecutable=false; no orchestrator DSL is generated.");
}

export async function runCompositionCompile(
  args: string[],
  flags: Record<string, string | boolean>,
  io: CliIO
): Promise<number> {
  if (flags.help === true) {
    printCompositionCompileHelp(io);
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
      code: "COMPOSITION_OUTPUT_PATH_UNSAFE",
      severity: "error",
      message: "Composition output path must not contain parent-directory traversal."
    };
    if (json) io.stdout(stableJson({ ok: false, issues: [issue] }));
    else io.stderr(`${issue.code}: ${issue.message}`);
    return EXIT_CODE_GENERAL_FAILURE;
  }

  const inputPath = resolveWorkspacePath(file);
  const outDir = isAbsolute(out) ? resolve(out) : resolve(process.cwd(), out);
  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(inputPath, "utf8"));
  } catch (error) {
    const issue = {
      code: "COMPOSITION_PLAN_JSON_INVALID",
      severity: "error",
      message: `Failed to read or parse Scenario Composition Plan JSON: ${(error as Error).message}`
    };
    if (json) io.stdout(stableJson({ ok: false, issues: [issue] }));
    else io.stderr(`${issue.code}: ${issue.message}`);
    return EXIT_CODE_GENERAL_FAILURE;
  }

  const output = compileScenarioCompositionPreview(parsed);
  if (!output.ok) {
    const summary = compileSummary(output, { dryRun, outDir: dryRun ? undefined : outDir });
    if (json) io.stdout(stableJson(summary));
    else {
      io.stderr("composition compile: failed");
      for (const issue of output.issues) {
        io.stderr(`- [${issue.severity}] ${issue.code}: ${issue.message}`);
      }
    }
    return EXIT_CODE_GENERAL_FAILURE;
  }

  const summary = compileSummary(output, { dryRun, outDir: dryRun ? undefined : outDir });
  if (dryRun) {
    if (json) io.stdout(stableJson(summary));
    else {
      io.stdout(`compositionId: ${output.result.compositionId}`);
      io.stdout(`compositionCompilerVersion: ${output.result.compositionCompilerVersion}`);
      io.stdout(`planHash: ${output.result.planHash}`);
      io.stdout(`bundleHash: ${output.result.bundleHash}`);
      io.stdout(`slots: ${output.result.slots.length}`);
      io.stdout("previewOnly: true");
      io.stdout("runtimeExecutable: false");
      io.stdout("orchestratorDslGenerated: false");
      io.stdout("dryRun: true");
    }
    return EXIT_CODE_SUCCESS;
  }

  if (existsSync(outDir) && !force) {
    const issue = {
      code: "COMPOSITION_OUTPUT_EXISTS",
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
      code: "COMPOSITION_OUTPUT_PATH_UNSAFE",
      severity: "error",
      message: `Unsafe composition artifact path: ${unsafe.relativePath}`
    };
    if (json) io.stdout(stableJson({ ok: false, issues: [issue] }));
    else io.stderr(`${issue.code}: ${issue.message}`);
    return EXIT_CODE_GENERAL_FAILURE;
  }

  try {
    await mkdir(outDir, { recursive: true });
    for (const fileToWrite of resolvedFiles) {
      await mkdir(resolve(fileToWrite.path!, ".."), { recursive: true });
      await writeUtf8Atomic(fileToWrite.path!, fileToWrite.content);
    }
  } catch (error) {
    const issue = {
      code: "COMPOSITION_WRITE_FAILED",
      severity: "error",
      message: `Failed to write composition preview artifacts: ${(error as Error).message}`
    };
    if (json) io.stdout(stableJson({ ok: false, issues: [issue] }));
    else io.stderr(`${issue.code}: ${issue.message}`);
    return EXIT_CODE_TRACE_FAILURE;
  }

  if (json) {
    io.stdout(stableJson({ ...summary, writtenFiles: files.map((item) => item.relativePath) }));
  } else {
    io.stdout(`compositionId: ${output.result.compositionId}`);
    io.stdout(`outDir: ${outDir}`);
    io.stdout(`planHash: ${output.result.planHash}`);
    io.stdout(`bundleHash: ${output.result.bundleHash}`);
    io.stdout("previewOnly: true");
    io.stdout("runtimeExecutable: false");
    io.stdout("orchestratorDslGenerated: false");
    for (const item of files) io.stdout(`artifact: ${item.relativePath}`);
  }
  return EXIT_CODE_SUCCESS;
}
