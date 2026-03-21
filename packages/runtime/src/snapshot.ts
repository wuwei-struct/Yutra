import { randomUUID } from "node:crypto";
import type { IdempotencyRecord, RuntimeRunContext, RuntimeSnapshot, RuntimeStatus } from "./types";

export interface CreateSnapshotArgs {
  ctx: RuntimeRunContext;
  agent: string;
  status?: RuntimeStatus | "running";
  idempotencyRecords?: IdempotencyRecord[];
  resumedFrom?: string;
}

export function createRuntimeSnapshot(args: CreateSnapshotArgs): RuntimeSnapshot {
  const rootRunId = args.ctx.idempotencyScopeId;
  return {
    snapshotId: randomUUID(),
    runId: args.ctx.runId,
    agent: args.agent,
    currentState: args.ctx.currentState,
    context: { ...args.ctx.context },
    stepCount: args.ctx.step,
    externalCallCount: args.ctx.externalCalls,
    visitedStates: [...args.ctx.visitedStates],
    completedActionKeys: [...args.ctx.completedActionKeys],
    idempotencyRecords: args.idempotencyRecords ? [...args.idempotencyRecords] : [],
    ts: new Date().toISOString(),
    status: args.status ?? "running",
    lineage: {
      rootRunId,
      resumedFrom: args.resumedFrom
    }
  };
}
