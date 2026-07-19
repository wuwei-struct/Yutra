import { createCanonicalInputHash } from "@yutra/scenario-orchestrator-runtime-contract";
import { DEMO_ORCHESTRATOR_ENGINE_ERROR_CODES, DemoOrchestratorEngineError } from "./errors";
import type { ScenarioRunRequest, ScenarioRunResult } from "./types";

export function scenarioRequestFingerprint(request: ScenarioRunRequest): string {
  const clone = structuredClone(request);
  clone.idempotencyKey = "";
  clone.input.byteLength = 0;
  return createCanonicalInputHash(clone);
}

export class InMemoryScenarioRunLedger {
  readonly #records = new Map<string, { fingerprint: string; promise: Promise<ScenarioRunResult> }>();
  execute(request: ScenarioRunRequest, run: () => Promise<ScenarioRunResult>): Promise<ScenarioRunResult> {
    const fingerprint = scenarioRequestFingerprint(request);
    const existing = this.#records.get(request.idempotencyKey);
    if (existing) {
      if (existing.fingerprint !== fingerprint) throw new DemoOrchestratorEngineError(DEMO_ORCHESTRATOR_ENGINE_ERROR_CODES.IDEMPOTENCY_CONFLICT, "Scenario idempotency key conflicts with a different request.");
      return existing.promise.then((value) => structuredClone(value));
    }
    const promise = run().then((value) => structuredClone(value));
    this.#records.set(request.idempotencyKey, { fingerprint, promise });
    return promise;
  }
}
