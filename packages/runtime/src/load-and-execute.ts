import { loadAndValidateDslFile } from "@yutra/dsl";
import type { RuntimeInput, RuntimeOptions, RuntimeResult } from "./types";
import { executeRun } from "./execute-run";

export async function loadAndExecuteDslFile(
  path: string,
  options?: RuntimeOptions,
  input?: RuntimeInput
): Promise<RuntimeResult> {
  const loaded = loadAndValidateDslFile(path);

  if (!loaded.validation.valid) {
    return {
      runId: "",
      agent: loaded.spec.agent,
      status: "failed",
      steps: 0,
      visitedStates: [],
      context: {},
      error: {
        code: "DSL_VALIDATION_FAILED",
        message: loaded.validation.errors.map((error) => error.message).join("; "),
        details: {
          errors: loaded.validation.errors,
          warnings: loaded.validation.warnings
        }
      }
    };
  }

  return executeRun({
    spec: loaded.spec,
    input,
    options
  });
}
