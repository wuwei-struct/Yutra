import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import type { TraceStorage } from "./types";
import { buildContextDiffFramesFromEvents } from "./context-diff";
import { compareRuns, summarizeTracePathFromEvents, summarizeRun } from "./compare";
import { getReplayFramesFromEvents, getReplayStepsFromEvents, sortTraceEventsDeterministically } from "./replay-frames";

export interface AuditBundle {
  meta: {
    runId: string;
    agent?: string;
    startedAt?: string;
    endedAt?: string;
    resumedFrom?: string;
    isResumed: boolean;
  };
  specSummary: {
    agent?: string;
    initialState?: string;
    finalState?: string;
  };
  inputSummary: {
    text?: string;
    intent?: string;
    contextKeys: string[];
  };
  runtimeResult: {
    status: "completed" | "failed" | "handoff" | "unknown";
    eventCount: number;
    errorCode?: string;
  };
  traceEvents: unknown[];
  replaySummary: {
    frameCount: number;
    stepCount: number;
    statePath: string[];
    actionSequence: string[];
  };
  contextDiffSummary: {
    totalActionSuccessFrames: number;
    completeFrames: number;
    changedKeys: string[];
    frames: unknown[];
  };
  compareHint: {
    summary: ReturnType<typeof summarizeTracePathFromEvents>;
  };
  handoffOrErrorSummary: {
    handoff: boolean;
    failed: boolean;
    errorCode?: string;
  };
  governanceSummary: {
    environment?: string;
    policyPack?: {
      name?: string;
      version?: string;
    };
    policyErrorCodes: string[];
    handoffReasonCodes: string[];
  };
  approvalSummary: {
    decisionCount: number;
    statuses: string[];
    latestDecision?: {
      status?: string;
      decisionId?: string;
      approver?: string;
      reason?: string;
      decidedAt?: string;
    };
  };
  humanReviewSummary: {
    requestCount: number;
    sources: string[];
    latestRequest?: {
      reviewId?: string;
      reasonCode?: string;
      source?: string;
      requestedAt?: string;
      summary?: string;
    };
  };
}

export async function buildAuditBundle(storage: TraceStorage, runId: string): Promise<AuditBundle> {
  const events = sortTraceEventsDeterministically(await storage.getRunEvents(runId));
  const summary = await summarizeRun(storage, runId);
  const replayFrames = getReplayFramesFromEvents(events);
  const replaySteps = getReplayStepsFromEvents(events);
  const contextDiffFrames = buildContextDiffFramesFromEvents(events);
  const runStarted = events.find((event) => event.type === "run.started");
  const runCompleted = [...events].reverse().find((event) =>
    event.type === "run.completed" || event.type === "run.failed" || event.type === "handoff.requested"
  );

  const runStartedPayload = (runStarted?.payload ?? {}) as Record<string, unknown>;
  const input = (runStartedPayload.input ?? {}) as Record<string, unknown>;
  const inputContext = (input.context ?? {}) as Record<string, unknown>;
  const changedKeys = [...new Set(contextDiffFrames.flatMap((frame) => Object.keys(frame.delta ?? {})))].sort();
  const resumedFrom = typeof runStartedPayload.resumedFrom === "string" ? runStartedPayload.resumedFrom : undefined;
  const isResumed = runStartedPayload.isResumed === true;
  const errorCode = summary.errorCode;
  const appliedPolicyPack = (runStartedPayload.appliedPolicyPack ?? {}) as Record<string, unknown>;
  const governanceEvents = events.filter((event) => event.type === "action.failed" || event.type === "handoff.requested");
  const policyErrorCodes = [
    ...new Set(
      governanceEvents
        .map((event) => ((event.payload ?? {}) as Record<string, unknown>).error)
        .map((error) => (error && typeof error === "object" ? (error as Record<string, unknown>).code : undefined))
        .filter((code): code is string => typeof code === "string" && code.startsWith("POLICY_"))
    )
  ].sort();
  const handoffReasonCodes = [
    ...new Set(
      events
        .filter((event) => event.type === "handoff.requested")
        .map((event) => ((event.payload ?? {}) as Record<string, unknown>).reasonCode)
        .filter((code): code is string => typeof code === "string")
    )
  ].sort();
  const approvalDecisionEvents = events.filter((event) => event.type === "action.succeeded");
  const approvalDecisions = approvalDecisionEvents
    .map((event) => (event.payload ?? {}) as Record<string, unknown>)
    .map((payload) => {
      const output = (payload.output ?? {}) as Record<string, unknown>;
      const decision = (output.approvalDecision ?? payload.approvalDecision) as Record<string, unknown>;
      if (!decision || typeof decision !== "object" || typeof decision.status !== "string") {
        return undefined;
      }
      return {
        status: decision.status as string,
        decisionId: typeof decision.decisionId === "string" ? decision.decisionId : undefined,
        approver: typeof decision.approver === "string" ? decision.approver : undefined,
        reason: typeof decision.reason === "string" ? decision.reason : undefined,
        decidedAt: typeof decision.decidedAt === "string" ? decision.decidedAt : undefined
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));
  const humanReviewRequests = events
    .filter((event) => event.type === "handoff.requested")
    .map((event) => (event.payload ?? {}) as Record<string, unknown>)
    .map((payload) => ({
      reviewId: typeof payload.reviewId === "string" ? payload.reviewId : undefined,
      reasonCode: typeof payload.reasonCode === "string" ? payload.reasonCode : undefined,
      source: typeof payload.source === "string" ? payload.source : undefined,
      requestedAt: typeof payload.requestedAt === "string" ? payload.requestedAt : undefined,
      summary: typeof payload.summary === "string" ? payload.summary : undefined
    }));

  return {
    meta: {
      runId,
      agent: summary.agent,
      startedAt: events[0]?.ts,
      endedAt: events[events.length - 1]?.ts,
      resumedFrom,
      isResumed
    },
    specSummary: {
      agent: summary.agent,
      initialState: summary.statePath[0],
      finalState: summary.finalState
    },
    inputSummary: {
      text: typeof input.text === "string" ? input.text : undefined,
      intent: typeof input.intent === "string" ? input.intent : undefined,
      contextKeys: Object.keys(inputContext).sort()
    },
    runtimeResult: {
      status: summary.status,
      eventCount: summary.eventCount,
      errorCode
    },
    traceEvents: events,
    replaySummary: {
      frameCount: replayFrames.length,
      stepCount: replaySteps.length,
      statePath: summary.statePath,
      actionSequence: summary.actionSequence
    },
    contextDiffSummary: {
      totalActionSuccessFrames: contextDiffFrames.length,
      completeFrames: contextDiffFrames.filter((frame) => frame.complete).length,
      changedKeys,
      frames: contextDiffFrames
    },
    compareHint: {
      summary
    },
    handoffOrErrorSummary: {
      handoff: runCompleted?.type === "handoff.requested",
      failed: runCompleted?.type === "run.failed",
      errorCode
    },
    governanceSummary: {
      environment: typeof runStartedPayload.environment === "string" ? runStartedPayload.environment : undefined,
      policyPack:
        typeof appliedPolicyPack.name === "string"
          ? {
              name: appliedPolicyPack.name,
              version: typeof appliedPolicyPack.version === "string" ? appliedPolicyPack.version : undefined
            }
          : undefined,
      policyErrorCodes,
      handoffReasonCodes
    },
    approvalSummary: {
      decisionCount: approvalDecisions.length,
      statuses: [...new Set(approvalDecisions.map((decision) => decision.status))].sort(),
      latestDecision: approvalDecisions[approvalDecisions.length - 1]
    },
    humanReviewSummary: {
      requestCount: humanReviewRequests.length,
      sources: [...new Set(humanReviewRequests.map((request) => request.source).filter(Boolean) as string[])].sort(),
      latestRequest: humanReviewRequests[humanReviewRequests.length - 1]
    }
  };
}

export async function exportAuditBundle(
  storage: TraceStorage,
  runId: string,
  outPath: string
): Promise<AuditBundle> {
  const bundle = await buildAuditBundle(storage, runId);
  await mkdir(dirname(outPath), { recursive: true });
  await writeFile(outPath, JSON.stringify(bundle, null, 2), "utf8");
  return bundle;
}

export async function compareWithLatest(storage: TraceStorage, runId: string) {
  const runIds = await storage.listRuns();
  const candidates = runIds.filter((id) => id !== runId);
  if (candidates.length === 0) {
    return null;
  }
  const latest = candidates[candidates.length - 1];
  return compareRuns(storage, runId, latest);
}
