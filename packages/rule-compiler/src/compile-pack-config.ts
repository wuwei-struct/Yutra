import { createPackConfigFingerprint, type PackConfig } from "@yutra/pack-config-core";
import { compilerVersion } from "./compiler-version";
import type { RuleCompilerReport } from "./compile-report";
import { resolveCompileOptions } from "./compile-options";
import { hasCompilerErrors, type RuleCompilerIssue } from "./errors";
import { validateCompileInput } from "./fail-closed";
import { approvalDecisionCompiler } from "./approval-decision-compiler";
import { requestResolutionCompiler } from "./request-resolution-compiler";
import { sha256, stableJson } from "./serialize-artifacts";
import type { RuleCompilerInput, RuleCompilerOutput } from "./types";
import { validateCompileOutput } from "./validate-compile-output";
import type { RuleCompilerArtifacts } from "./artifacts";

function emptyReport(config: PackConfig, mode: "preview" | "publish", configHash: string, issues: RuleCompilerIssue[]): RuleCompilerReport {
  return {
    status: "failed",
    archetypeId: config.archetypeId,
    archetypeVersion: config.archetypeVersion,
    packConfigId: config.packConfigId,
    packConfigVersion: config.packConfigVersion,
    packConfigHash: configHash,
    compilerVersion,
    mode,
    coverage: {
      schema: issues.some((issue) => issue.code === "RULE_COMPILER_CONFIG_INVALID") ? "failed" : "passed",
      requiredFields: issues.some((issue) => issue.code === "RULE_COMPILER_REQUIRED_FIELD_MISSING") ? "missing" : "covered",
      transitions: "incomplete",
      actions: "unknown",
      guards: "unknown",
      sideEffects: issues.some((issue) => issue.code === "RULE_COMPILER_SIDE_EFFECT_UNGUARDED") ? "unsafe" : "policy_guarded",
      handoff: issues.some((issue) => issue.code === "RULE_COMPILER_FAIL_CLOSED") ? "missing" : "covered"
    },
    failClosedPolicy: "enabled",
    artifactHashes: {},
    warnings: issues.filter((issue) => issue.severity === "warning")
  };
}

function artifactHashes(artifacts: RuleCompilerArtifacts): Record<string, string> {
  return {
    [artifacts.agent.filename]: artifacts.agent.hash,
    [artifacts.policy.filename]: artifacts.policy.hash,
    [artifacts.adapterConfig.filename]: artifacts.adapterConfig.hash,
    [artifacts.templates.filename]: artifacts.templates.hash,
    [artifacts.testCases.filename]: artifacts.testCases.hash,
    [artifacts.traceExpectation.filename]: artifacts.traceExpectation.hash
  };
}

function passedReport(config: PackConfig, mode: "preview" | "publish", configHash: string, artifacts: RuleCompilerArtifacts, issues: RuleCompilerIssue[]): RuleCompilerReport {
  return {
    status: hasCompilerErrors(issues) ? "failed" : "passed",
    archetypeId: config.archetypeId,
    archetypeVersion: config.archetypeVersion,
    packConfigId: config.packConfigId,
    packConfigVersion: config.packConfigVersion,
    packConfigHash: configHash,
    compilerVersion,
    mode,
    coverage: {
      schema: "passed",
      requiredFields: "covered",
      transitions: "fallback_covered",
      actions: "registered",
      guards: "registered",
      sideEffects: "policy_guarded",
      handoff: "covered"
    },
    failClosedPolicy: "enabled",
    artifactHashes: artifactHashes(artifacts),
    warnings: issues.filter((issue) => issue.severity === "warning")
  };
}

function compileId(config: PackConfig, configHash: string, mode: "preview" | "publish"): string {
  return `compile:${sha256(stableJson({ compilerVersion, configHash, mode, packConfigId: config.packConfigId })).slice("sha256:".length, "sha256:".length + 16)}`;
}

export function compilePackConfig(input: RuleCompilerInput): RuleCompilerOutput {
  const options = resolveCompileOptions(input);
  const configHash = createPackConfigFingerprint(input.config);
  const inputIssues = validateCompileInput({ ...input, mode: options.mode, locale: options.locale });
  if (hasCompilerErrors(inputIssues)) {
    return {
      ok: false,
      compileId: compileId(input.config, configHash, options.mode),
      compilerVersion,
      mode: options.mode,
      report: emptyReport(input.config, options.mode, configHash, inputIssues),
      issues: inputIssues
    };
  }

  if (input.config.archetypeId !== "request-resolution" && input.config.archetypeId !== "approval-decision") {
    const issues: RuleCompilerIssue[] = [
      {
        code: "RULE_COMPILER_UNSUPPORTED_ARCHETYPE",
        severity: "error",
        message: `Unsupported archetype ${input.config.archetypeId}.`,
        path: ["archetypeId"]
      }
    ];
    return {
      ok: false,
      compileId: compileId(input.config, configHash, options.mode),
      compilerVersion,
      mode: options.mode,
      report: emptyReport(input.config, options.mode, configHash, issues),
      issues
    };
  }

  const artifacts =
    input.config.archetypeId === "approval-decision"
      ? approvalDecisionCompiler(input.config, options.locale)
      : requestResolutionCompiler(input.config, options.locale);
  const outputShell: RuleCompilerOutput = {
    ok: true,
    compileId: compileId(input.config, configHash, options.mode),
    compilerVersion,
    mode: options.mode,
    artifacts,
    report: passedReport(input.config, options.mode, configHash, artifacts, inputIssues),
    issues: inputIssues
  };
  const outputIssues = validateCompileOutput(outputShell);
  const allIssues = [...inputIssues, ...outputIssues];

  return {
    ...outputShell,
    ok: !hasCompilerErrors(allIssues),
    report: passedReport(input.config, options.mode, configHash, artifacts, allIssues),
    issues: allIssues
  };
}
