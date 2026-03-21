import type { AgentSpec } from "@yutra/spec";
import { executeRun } from "./execute-run";
import type { RuntimeInput, RuntimeOptions, RuntimeResult, RuntimeSnapshot } from "./types";

export interface ResumeRunArgs {
  spec: AgentSpec;
  snapshot: RuntimeSnapshot;
  input?: RuntimeInput;
  options?: RuntimeOptions;
}

export async function resumeRun(args: ResumeRunArgs): Promise<RuntimeResult> {
  return executeRun({
    spec: args.spec,
    input: args.input,
    options: {
      ...(args.options ?? {}),
      resumeFromSnapshot: args.snapshot
    }
  });
}
