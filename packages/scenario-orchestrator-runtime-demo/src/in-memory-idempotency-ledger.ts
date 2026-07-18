import type { ScenarioSlotInvocationResult } from "@yutra/scenario-orchestrator-runtime-contract";
import {
  DEMO_RUNTIME_ERROR_CODES,
  DemoRuntimeAdapterError
} from "./errors";
import type { InMemoryInvocationLedgerRecord } from "./types";

type InternalRecord = InMemoryInvocationLedgerRecord & {
  promise: Promise<ScenarioSlotInvocationResult>;
  error?: unknown;
};

function snapshot(record: InternalRecord): InMemoryInvocationLedgerRecord {
  return {
    idempotencyKey: record.idempotencyKey,
    requestFingerprint: record.requestFingerprint,
    status: record.status,
    result: record.result ? structuredClone(record.result) : undefined,
    runtimeInvocationCount: record.runtimeInvocationCount
  };
}

export class InMemoryInvocationLedger {
  private readonly records = new Map<string, InternalRecord>();

  public execute(
    idempotencyKey: string,
    requestFingerprint: string,
    invoke: (markRuntimeInvocation: () => void) => Promise<ScenarioSlotInvocationResult>
  ): Promise<ScenarioSlotInvocationResult> {
    const existing = this.records.get(idempotencyKey);
    if (existing) {
      if (existing.requestFingerprint !== requestFingerprint) {
        throw new DemoRuntimeAdapterError(
          DEMO_RUNTIME_ERROR_CODES.IDEMPOTENCY_CONFLICT,
          "Idempotency key is already bound to a different Slot request."
        );
      }
      return existing.promise.then(
        (result) => structuredClone(result) as ScenarioSlotInvocationResult
      );
    }

    const record: InternalRecord = {
      idempotencyKey,
      requestFingerprint,
      status: "running",
      runtimeInvocationCount: 0,
      promise: Promise.resolve(null as never)
    };
    const promise = invoke(() => {
      record.runtimeInvocationCount += 1;
    })
      .then((result) => {
        record.status = result.status === "completed" ? "completed" : "failed";
        record.result = structuredClone(result);
        return structuredClone(result);
      })
      .catch((error: unknown) => {
        record.status = "failed";
        record.error = error;
        throw error;
      });
    record.promise = promise;
    this.records.set(idempotencyKey, record);
    return promise;
  }

  public get(key: string): InMemoryInvocationLedgerRecord | undefined {
    const record = this.records.get(key);
    return record ? snapshot(record) : undefined;
  }

  public list(): InMemoryInvocationLedgerRecord[] {
    return [...this.records.values()]
      .sort((left, right) =>
        left.idempotencyKey.localeCompare(right.idempotencyKey)
      )
      .map(snapshot);
  }

  public clear(): void {
    this.records.clear();
  }
}
