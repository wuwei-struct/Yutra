import type { PackConfig } from "@yutra/pack-config-core";
import type { RuleCompilerIssue } from "./errors";
import type { RuleCompilerArtifacts } from "./artifacts";
import type { RuleCompilerReport } from "./compile-report";

export type CompileMode = "preview" | "publish";

export type RuleCompilerInput = {
  config: PackConfig;
  mode?: CompileMode;
  locale?: "en" | "zh-CN";
};

export type RuleCompilerOutput = {
  ok: boolean;
  compileId: string;
  compilerVersion: string;
  mode: CompileMode;
  artifacts?: RuleCompilerArtifacts;
  report: RuleCompilerReport;
  issues: RuleCompilerIssue[];
};
