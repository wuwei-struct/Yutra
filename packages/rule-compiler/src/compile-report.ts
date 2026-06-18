import type { CompileMode } from "./types";
import type { RuleCompilerIssue } from "./errors";

export type RuleCompilerReport = {
  status: "passed" | "failed";
  archetypeId: string;
  archetypeVersion: string;
  packConfigId: string;
  packConfigVersion: string;
  packConfigHash: string;
  compilerVersion: string;
  mode: CompileMode;
  coverage: {
    schema: "passed" | "failed";
    requiredFields: "covered" | "missing";
    transitions: "fallback_covered" | "incomplete";
    actions: "registered" | "unknown";
    guards: "registered" | "unknown";
    sideEffects: "policy_guarded" | "unsafe";
    handoff: "covered" | "missing";
  };
  failClosedPolicy: "enabled";
  artifactHashes: Record<string, string>;
  warnings: RuleCompilerIssue[];
};
