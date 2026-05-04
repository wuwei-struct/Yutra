import { randomUUID } from "node:crypto";
import type { ActionSideEffect, AgentSpec, TraceEventType } from "@yutra/spec";
import { MemoryTraceStorage, TraceRecorder } from "@yutra/trace";
import { ActionExecutor } from "./action-executor";
import { RUNTIME_ERROR_CODES } from "./error-codes";
import { createRuntimeError } from "./errors";
import { GuardEvaluator } from "./guard-evaluator";
import { InMemoryIdempotencyStore } from "./idempotency";
import { deterministicIntentResolver } from "./intent-resolver";
import { evaluatePolicyForAction } from "./policy-evaluator";
import { resolveEnvironmentProfile } from "./policy";
import { createRuntimeSnapshot } from "./snapshot";
import { InMemorySnapshotStore } from "./snapshot-store";
import { TransitionResolver } from "./transition-resolver";
import type {
  ActionExecutionResult,
  CheckpointPolicy,
  IdempotencyRecord,
  RuntimeInput,
  RuntimeOptions,
  RuntimeResult,
  RuntimeRunContext,
  RuntimeStatus,
  RuntimeSnapshot,
  TransitionResolutionResult
} from "./types";

function defaultContextFromSpec(spec: AgentSpec): Record<string, unknown> {
  const defaults: Record<string, unknown> = {};
  for (const [key, field] of Object.entries(spec.context?.fields ?? {})) {
    if (Object.prototype.hasOwnProperty.call(field, "default")) {
      defaults[key] = field.default;
    }
  }
  return defaults;
}

function resolveInitialState(spec: AgentSpec, resolvedIntent: { intent?: string; entryState?: string }): string {
  if (resolvedIntent.entryState) {
    return resolvedIntent.entryState;
  }

  if (resolvedIntent.intent) {
    const intentSpec = spec.intents?.find((intent) => intent.name === resolvedIntent.intent);
    if (intentSpec?.entry_state) {
      return intentSpec.entry_state;
    }
  }

  return spec.initial_state;
}

function normalizeCheckpointPolicy(policy?: CheckpointPolicy): Required<CheckpointPolicy> {
  return {
    onStateEntered: policy?.onStateEntered ?? true,
    onActionSucceeded: policy?.onActionSucceeded ?? true
  };
}

function resolveActionSideEffect(
  spec: AgentSpec,
  actionName: string,
  actionPolicies: RuntimeOptions["actionPolicies"]
): ActionSideEffect {
  const policySideEffect = actionPolicies?.[actionName]?.sideEffect;
  if (policySideEffect) {
    return policySideEffect;
  }
  const action = spec.actions?.find((item) => item.name === actionName);
  return action?.side_effect ?? action?.sideEffect ?? "none";
}

function extractApprovalSummary(context: Record<string, unknown>) {
  const decision = (context.approval_decision ?? {}) as Record<string, unknown>;
  const status =
    typeof context.approval_status === "string"
      ? context.approval_status
      : typeof decision.status === "string"
        ? decision.status
        : undefined;
  if (!status) {
    return undefined;
  }

  return {
    status,
    decisionId: typeof decision.decisionId === "string" ? decision.decisionId : undefined,
    reviewId:
      typeof context.review_id === "string"
        ? context.review_id
        : typeof decision.reviewId === "string"
          ? decision.reviewId
          : undefined,
    approver:
      typeof context.approver === "string"
        ? context.approver
        : typeof decision.approver === "string"
          ? decision.approver
          : undefined,
    reason:
      typeof context.approval_reason === "string"
        ? context.approval_reason
        : typeof decision.reason === "string"
          ? decision.reason
          : undefined,
    decidedAt: typeof decision.decidedAt === "string" ? decision.decidedAt : undefined,
    requestedAt:
      typeof context.review_requested_at === "string"
        ? context.review_requested_at
        : typeof decision.requestedAt === "string"
          ? decision.requestedAt
          : undefined
  };
}

function extractHumanReviewRequest(context: Record<string, unknown>, stateName: string): Record<string, unknown> | undefined {
  const request = (context.human_review_request ?? {}) as Record<string, unknown>;
  if (typeof request.reasonCode === "string" && typeof request.reason === "string" && typeof request.source === "string") {
    return {
      reviewId: typeof request.reviewId === "string" ? request.reviewId : `review-${Date.now()}`,
      reasonCode: request.reasonCode,
      reason: request.reason,
      source: request.source,
      state: typeof request.state === "string" ? request.state : stateName,
      action: typeof request.action === "string" ? request.action : undefined,
      severity: typeof request.severity === "string" ? request.severity : "medium",
      summary:
        typeof request.summary === "string"
          ? request.summary
          : `Human review requested for state '${stateName}'.`,
      requiredFields: Array.isArray(request.requiredFields) ? request.requiredFields : undefined,
      recommendedActions: Array.isArray(request.recommendedActions) ? request.recommendedActions : undefined,
      requestedAt:
        typeof request.requestedAt === "string" ? request.requestedAt : new Date().toISOString(),
      metadata: typeof request.metadata === "object" && request.metadata ? request.metadata : undefined
    };
  }

  return undefined;
}

export interface ExecuteRunArgs {
  spec: AgentSpec;
  input?: RuntimeInput;
  options?: RuntimeOptions;
}

export async function executeRun(args: ExecuteRunArgs): Promise<RuntimeResult> {
  const spec = args.spec;
  const input = args.input ?? {};
  const options = args.options ?? {};
  const checkpointPolicy = normalizeCheckpointPolicy(options.checkpointPolicy);
  const maxSteps = options.maxSteps ?? 50;
  const maxDurationMs = options.maxDurationMs;
  const maxExternalCalls = options.maxExternalCalls;
  const resumedSnapshot = options.resumeFromSnapshot;
  const isResumed = Boolean(resumedSnapshot);
  const environment = resolveEnvironmentProfile(options.policyPack, options.environment);

  const runId = randomUUID();
  const runStartedAt = Date.now();
  const idempotencyScopeId =
    resumedSnapshot?.lineage?.rootRunId ?? resumedSnapshot?.runId ?? runId;
  const resumedFrom = resumedSnapshot?.snapshotId;
  const snapshotStore = options.snapshotStore ?? new InMemorySnapshotStore();
  const idempotencyStore = options.idempotencyStore ?? new InMemoryIdempotencyStore();
  const recorder =
    options.traceRecorder ?? new TraceRecorder(options.traceStorage ?? new MemoryTraceStorage());

  if (resumedSnapshot?.idempotencyRecords?.length) {
    for (const record of resumedSnapshot.idempotencyRecords) {
      await idempotencyStore.set(record);
    }
  }

  const baseContext = defaultContextFromSpec(spec);
  const runtimeContext: Record<string, unknown> = resumedSnapshot
    ? { ...resumedSnapshot.context }
    : {
        ...baseContext,
        ...(input.context ?? {})
      };

  let eventCounter = 0;
  const emit = async (
    type: TraceEventType,
    data?: {
      state?: string;
      action?: string;
      transition?: string;
      payload?: Record<string, unknown>;
    }
  ) => {
    eventCounter += 1;
    await recorder.append({
      id: `${runId}-${eventCounter}`,
      runId,
      type,
      ts: new Date().toISOString(),
      agent: spec.agent,
      state: data?.state,
      action: data?.action,
      transition: data?.transition,
      payload: data?.payload
    });
  };

  const collectIdempotencyRecords = async (ctx: RuntimeRunContext): Promise<IdempotencyRecord[]> => {
    const records: IdempotencyRecord[] = [];
    for (const key of ctx.completedActionKeys) {
      const record = await idempotencyStore.get(key);
      if (record) {
        records.push(record);
      }
    }
    return records;
  };

  const saveCheckpoint = async (
    ctx: RuntimeRunContext,
    status: RuntimeStatus | "running",
    reason: "state.entered" | "action.succeeded" | "run.ended"
  ): Promise<RuntimeSnapshot> => {
    const snapshot = createRuntimeSnapshot({
      ctx,
      agent: spec.agent,
      status,
      resumedFrom,
      idempotencyRecords: await collectIdempotencyRecords(ctx)
    });
    await snapshotStore.save(snapshot);
    void reason;
    return snapshot;
  };

  const buildResult = async (
    status: RuntimeStatus,
    ctx: RuntimeRunContext,
    finalState: string,
    error?: ReturnType<typeof createRuntimeError>
  ): Promise<RuntimeResult> => {
    await saveCheckpoint(ctx, status, "run.ended");
    await recorder.flush();
    return {
      runId,
      agent: spec.agent,
      status,
      finalState,
      steps: ctx.step,
      visitedStates: ctx.visitedStates,
      context: ctx.context,
      error,
      traceEvents: await recorder.storage.getRunEvents(runId)
    };
  };

  const elapsedMs = () => Date.now() - runStartedAt;
  const governanceMeta = {
    environment,
    appliedPolicyPack: options.policyPack
      ? {
          name: options.policyPack.name,
          version: options.policyPack.version
        }
      : undefined
  };
  const durationBudgetError = (ctx: RuntimeRunContext) =>
    createRuntimeError(
      RUNTIME_ERROR_CODES.MAX_DURATION_EXCEEDED,
      `Run exceeded max duration budget (${maxDurationMs}ms).`,
      {
        stage: "run.budget.duration",
        budgetType: "duration",
        step: ctx.step,
        state: ctx.currentState,
        details: {
          maxDurationMs,
          elapsedMs: elapsedMs()
        }
      }
    );
  const externalCallsBudgetError = (ctx: RuntimeRunContext) =>
    createRuntimeError(
      RUNTIME_ERROR_CODES.MAX_EXTERNAL_CALLS_EXCEEDED,
      `Run exceeded max external calls budget (${maxExternalCalls}).`,
      {
        stage: "run.budget.external_calls",
        budgetType: "external_calls",
        step: ctx.step,
        state: ctx.currentState,
        details: {
          maxExternalCalls,
          externalCallsUsed: ctx.externalCalls
        }
      }
    );
  const exceedDurationBudget = () =>
    typeof maxDurationMs === "number" && Number.isFinite(maxDurationMs) && elapsedMs() > maxDurationMs;
  const exceedExternalCallBudget = (ctx: RuntimeRunContext) =>
    typeof maxExternalCalls === "number" &&
    Number.isFinite(maxExternalCalls) &&
    ctx.externalCalls > maxExternalCalls;

  await emit("run.started", {
    payload: {
      input: {
        text: input.text,
        intent: input.intent,
        context: input.context ?? {}
      },
      isResumed,
      resumedFrom,
      ...governanceMeta,
      approvalSummary: extractApprovalSummary(runtimeContext)
    }
  });

  const seedContext: RuntimeRunContext = {
    runId,
    idempotencyScopeId,
    spec,
    input,
    context: runtimeContext,
    currentState: resumedSnapshot?.currentState ?? spec.initial_state,
    step: resumedSnapshot?.stepCount ?? 0,
    externalCalls: resumedSnapshot?.externalCallCount ?? 0,
    visitedStates: resumedSnapshot?.visitedStates ? [...resumedSnapshot.visitedStates] : [],
    completedActionKeys: resumedSnapshot?.completedActionKeys ? [...resumedSnapshot.completedActionKeys] : [],
    resumedFrom,
    isResumed,
    environment,
    appliedPolicyPack: governanceMeta.appliedPolicyPack
  };

  const intentResolver = options.intentResolver ?? deterministicIntentResolver;
  const resolvedIntent = resumedSnapshot
    ? { intent: input.intent }
    : await intentResolver.resolve(input, spec, seedContext);
  const initialState = resumedSnapshot
    ? resumedSnapshot.currentState
    : resolveInitialState(spec, resolvedIntent);

  await emit("intent.resolved", {
    payload: {
      intent: resolvedIntent.intent,
      entryState: initialState,
      meta: resolvedIntent.meta,
      isResumed,
      resumedFrom,
      ...governanceMeta,
      approvalSummary: extractApprovalSummary(seedContext.context)
    }
  });

  if (!spec.states[initialState]) {
    const error = createRuntimeError(
      RUNTIME_ERROR_CODES.INVALID_INITIAL_STATE,
      `Initial state '${initialState}' not found.`,
      {
        stage: "run.init",
        details: {
          initialState
        }
      }
    );
    await emit("run.failed", {
      state: initialState,
      payload: {
        error: { code: error.code, message: error.message },
        stage: error.stage,
        ...governanceMeta,
        approvalSummary: extractApprovalSummary(seedContext.context)
      }
    });
    const result = await buildResult("failed", seedContext, initialState, error);
    return {
      ...result,
      intent: resolvedIntent.intent
    };
  }

  const guardEvaluator = new GuardEvaluator(spec);
  const actionExecutor = new ActionExecutor(options.actionRegistry, {
    defaultTimeoutMs: options.actionTimeoutMs,
    defaultRetryPolicy: options.retryPolicy,
    actionPolicies: options.actionPolicies,
    contextMergePolicy: options.contextMergePolicy,
    idempotencyStore,
    spec,
    skillRegistry: options.skillRegistry,
    skillSearchPaths: options.skillSearchPaths
  });
  const transitionResolver = new TransitionResolver(guardEvaluator);

  const runCtx: RuntimeRunContext = {
    ...seedContext,
    currentState: initialState
  };

  while (runCtx.step < maxSteps) {
    if (exceedDurationBudget()) {
      const error = durationBudgetError(runCtx);
      await emit("run.failed", {
        state: runCtx.currentState,
        payload: {
          error: { code: error.code, message: error.message },
          stage: error.stage,
          budgetType: error.budgetType,
          isResumed,
          resumedFrom,
          ...governanceMeta,
          approvalSummary: extractApprovalSummary(runCtx.context)
        }
      });
      const result = await buildResult("failed", runCtx, runCtx.currentState, error);
      return {
        ...result,
        intent: resolvedIntent.intent
      };
    }

    runCtx.step += 1;
    const stateName = runCtx.currentState;
    const state = spec.states[stateName];
    if (!state) {
      const error = createRuntimeError(
        RUNTIME_ERROR_CODES.TRANSITION_RESOLUTION_FAILED,
        `State '${stateName}' not found.`,
        { stage: "state.resolve", state: stateName, step: runCtx.step }
      );
      await emit("run.failed", {
        state: stateName,
        payload: {
          error: { code: error.code, message: error.message },
          stage: error.stage,
          ...governanceMeta,
          approvalSummary: extractApprovalSummary(runCtx.context)
        }
      });
      const result = await buildResult("failed", runCtx, stateName, error);
      return {
        ...result,
        intent: resolvedIntent.intent
      };
    }

    runCtx.visitedStates.push(stateName);
    await emit("state.entered", { state: stateName });
    if (checkpointPolicy.onStateEntered) {
      await saveCheckpoint(runCtx, "running", "state.entered");
    }

    const stateGuardResults = await guardEvaluator.evaluateStateGuards(state, runCtx.context);
    for (const guardResult of stateGuardResults) {
      await emit("guard.evaluated", {
        state: stateName,
        payload: {
          guard: guardResult.guardName,
          passed: guardResult.passed,
          expression: guardResult.expression,
          reason: guardResult.reason
        }
      });

      if (!guardResult.passed) {
        const error = createRuntimeError(
          RUNTIME_ERROR_CODES.GUARD_EVALUATION_FAILED,
          `Guard '${guardResult.guardName}' did not pass in state '${stateName}'.`,
          {
            stage: "guard.evaluate",
            state: stateName,
            step: runCtx.step,
            details: {
              guard: guardResult.guardName,
              expression: guardResult.expression,
              reason: guardResult.reason
            }
          }
        );
        await emit("run.failed", {
          state: stateName,
          payload: {
            error: { code: error.code, message: error.message },
            stage: error.stage,
            ...governanceMeta,
            approvalSummary: extractApprovalSummary(runCtx.context)
          }
        });
        const result = await buildResult("failed", runCtx, stateName, error);
        return {
          ...result,
          intent: resolvedIntent.intent
        };
      }
    }

    const runAction = async (actionName: string): Promise<ActionExecutionResult> => {
      const sideEffect = resolveActionSideEffect(spec, actionName, options.actionPolicies);
      const policyDecision = evaluatePolicyForAction({
        policyPack: options.policyPack,
        environment,
        actionName,
        stateName,
        sideEffect,
        externalCallsUsed: runCtx.externalCalls
      });

      if (policyDecision.effect === "deny") {
        const deniedError = createRuntimeError(
          policyDecision.errorCode ?? RUNTIME_ERROR_CODES.POLICY_ACTION_DENIED,
          policyDecision.reason ?? `Action '${actionName}' denied by policy.`,
          {
            stage: "policy.action",
            action: actionName,
            state: stateName,
            step: runCtx.step,
            details: {
              environment,
              policyName: policyDecision.policyName,
              policyVersion: policyDecision.policyVersion,
              sideEffect,
              reasonCode: policyDecision.reasonCode
            }
          }
        );

        await emit("action.failed", {
          state: stateName,
          action: actionName,
          payload: {
            attempt: 0,
            maxAttempts: 0,
            durationMs: 0,
            retryable: false,
            finalAttempt: true,
            sideEffect,
            error: {
              code: deniedError.code,
              message: deniedError.message
            },
            policyName: policyDecision.policyName,
            policyVersion: policyDecision.policyVersion,
            environment,
            reason: policyDecision.reason,
            reasonCode: policyDecision.reasonCode
          }
        });

        return {
          actionName,
          ok: false,
          error: deniedError,
          attempt: 0,
          maxAttempts: 0,
          finalAttempt: true,
          durationMs: 0,
          timeoutMs: 0,
          retryable: false,
          sideEffect,
          externalCallCount: 0,
          meta: {
            governance: {
              environment,
              policyName: policyDecision.policyName,
              policyVersion: policyDecision.policyVersion,
              reasonCode: policyDecision.reasonCode
            }
          }
        };
      }

      if (policyDecision.effect === "handoff") {
        const handoffError = createRuntimeError(
          policyDecision.errorCode ?? RUNTIME_ERROR_CODES.POLICY_HANDOFF_REQUIRED,
          policyDecision.reason ?? `Action '${actionName}' requires handoff by policy.`,
          {
            stage: "policy.action",
            action: actionName,
            state: stateName,
            step: runCtx.step,
            details: {
              environment,
              policyName: policyDecision.policyName,
              policyVersion: policyDecision.policyVersion,
              sideEffect,
              reasonCode: policyDecision.reasonCode
            }
          }
        );

        await emit("handoff.requested", {
          state: stateName,
          action: actionName,
          payload: {
            ...(policyDecision.handoffPayload ?? {
              reasonCode: policyDecision.reasonCode ?? "policy_handoff_required",
              reason: policyDecision.reason ?? "Policy requires handoff.",
              source: "policy"
            }),
            policyName: policyDecision.policyName,
            policyVersion: policyDecision.policyVersion,
            environment,
            steps: runCtx.step,
            isResumed,
            resumedFrom
          }
        });

        return {
          actionName,
          ok: false,
          error: handoffError,
          attempt: 0,
          maxAttempts: 0,
          finalAttempt: true,
          durationMs: 0,
          timeoutMs: 0,
          retryable: false,
          sideEffect,
          externalCallCount: 0,
          meta: {
            handoffRequested: true,
            handoffPayload: policyDecision.handoffPayload,
            governance: {
              environment,
              policyName: policyDecision.policyName,
              policyVersion: policyDecision.policyVersion,
              reasonCode: policyDecision.reasonCode
            }
          }
        };
      }

      const result = await actionExecutor.executeAction(actionName, runCtx, {
        onAttemptStart: async (info) => {
          await emit("action.started", {
            state: stateName,
            action: actionName,
            payload: {
              attempt: info.attempt,
              maxAttempts: info.maxAttempts,
              timeoutMs: info.timeoutMs,
              sideEffect: info.sideEffect,
              idempotencyKey: info.idempotencyKey,
              idempotencyHit: info.idempotencyHit,
              resumedRun: info.resumedRun,
              implementationType: info.implementationType,
              skillName: info.skillName,
              skillVersion: info.skillVersion,
              skillEntry: info.skillEntry,
              riskLevel: info.riskLevel,
              requiresApproval: info.requiresApproval,
              inputValidated: info.inputValidated
            }
          });
        },
        onAttemptResult: async (info) => {
          if (info.ok) {
            await emit("action.succeeded", {
              state: stateName,
              action: actionName,
              payload: {
                attempt: info.attempt,
                maxAttempts: info.maxAttempts,
                durationMs: info.durationMs,
                contextDelta: info.contextPatch,
                sideEffect: info.sideEffect,
                output: info.output,
                idempotencyKey: info.idempotencyKey,
                idempotencyHit: info.idempotencyHit,
                resumedRun: info.resumedRun,
                implementationType: info.implementationType,
                skillName: info.skillName,
                skillVersion: info.skillVersion,
                skillEntry: info.skillEntry,
                riskLevel: info.riskLevel,
                requiresApproval: info.requiresApproval,
                inputValidated: info.inputValidated,
                outputValidated: info.outputValidated,
                meta: info.meta
              }
            });
            return;
          }

          await emit("action.failed", {
            state: stateName,
            action: actionName,
            payload: {
              attempt: info.attempt,
              maxAttempts: info.maxAttempts,
              durationMs: info.durationMs,
              retryable: info.retryable,
              finalAttempt: info.finalAttempt,
              idempotencyKey: info.idempotencyKey,
              idempotencyHit: info.idempotencyHit,
              resumedRun: info.resumedRun,
              implementationType: info.implementationType,
              skillName: info.skillName,
              skillVersion: info.skillVersion,
              skillEntry: info.skillEntry,
              riskLevel: info.riskLevel,
              requiresApproval: info.requiresApproval,
              inputValidated: info.inputValidated,
              outputValidated: info.outputValidated,
              error: info.error
                ? {
                    code: info.error.code,
                    message: info.error.message
                  }
                : undefined,
              meta: info.meta
            }
          });
        }
      });

      runCtx.externalCalls += result.externalCallCount;
      if (result.idempotencyKey && !runCtx.completedActionKeys.includes(result.idempotencyKey)) {
        runCtx.completedActionKeys.push(result.idempotencyKey);
      }

      if (checkpointPolicy.onActionSucceeded && result.ok) {
        await saveCheckpoint(runCtx, "running", "action.succeeded");
      }

      if (exceedExternalCallBudget(runCtx)) {
        const budgetError = externalCallsBudgetError(runCtx);
        await emit("run.failed", {
          state: stateName,
          action: actionName,
          payload: {
            error: { code: budgetError.code, message: budgetError.message },
            stage: budgetError.stage,
            budgetType: budgetError.budgetType,
            ...governanceMeta
          }
        });
        return {
          actionName,
          ok: false,
          error: budgetError,
          meta: result.meta,
          attempt: result.attempt,
          maxAttempts: result.maxAttempts,
          finalAttempt: true,
          durationMs: result.durationMs,
          timeoutMs: result.timeoutMs,
          retryable: false,
          sideEffect: result.sideEffect,
          externalCallCount: result.externalCallCount,
          idempotencyKey: result.idempotencyKey,
          idempotencyHit: result.idempotencyHit
        };
      }

      return result;
    };

    for (const actionName of state.on_enter ?? []) {
      const result = await runAction(actionName);
      if (!result.ok) {
        const error = result.error ?? createRuntimeError(RUNTIME_ERROR_CODES.ACTION_FAILED, "Action failed.", {
          stage: "action.execute",
          action: actionName,
          state: stateName,
          step: runCtx.step
        });
        if (error.code === RUNTIME_ERROR_CODES.POLICY_HANDOFF_REQUIRED) {
          const runtimeResult = await buildResult("handoff", runCtx, stateName, error);
          return {
            ...runtimeResult,
            intent: resolvedIntent.intent
          };
        }
        if (error.code !== RUNTIME_ERROR_CODES.MAX_EXTERNAL_CALLS_EXCEEDED) {
          await emit("run.failed", {
            state: stateName,
            action: actionName,
            payload: {
              error: { code: error.code, message: error.message },
              stage: error.stage,
              budgetType: error.budgetType,
              ...governanceMeta,
              approvalSummary: extractApprovalSummary(runCtx.context)
            }
          });
        }
        const runtimeResult = await buildResult("failed", runCtx, stateName, error);
        return {
          ...runtimeResult,
          intent: resolvedIntent.intent
        };
      }
    }

    for (const actionName of state.actions ?? []) {
      const result = await runAction(actionName);
      if (!result.ok) {
        const error = result.error ?? createRuntimeError(RUNTIME_ERROR_CODES.ACTION_FAILED, "Action failed.", {
          stage: "action.execute",
          action: actionName,
          state: stateName,
          step: runCtx.step
        });
        if (error.code === RUNTIME_ERROR_CODES.POLICY_HANDOFF_REQUIRED) {
          const runtimeResult = await buildResult("handoff", runCtx, stateName, error);
          return {
            ...runtimeResult,
            intent: resolvedIntent.intent
          };
        }
        if (error.code !== RUNTIME_ERROR_CODES.MAX_EXTERNAL_CALLS_EXCEEDED) {
          await emit("run.failed", {
            state: stateName,
            action: actionName,
            payload: {
              error: { code: error.code, message: error.message },
              stage: error.stage,
              budgetType: error.budgetType,
              ...governanceMeta,
              approvalSummary: extractApprovalSummary(runCtx.context)
            }
          });
        }
        const runtimeResult = await buildResult("failed", runCtx, stateName, error);
        return {
          ...runtimeResult,
          intent: resolvedIntent.intent
        };
      }
    }

    let transitionResult: TransitionResolutionResult;
    try {
      transitionResult = await transitionResolver.resolveNextTransition(stateName, state, runCtx.context);
    } catch (error) {
      const transitionError = createRuntimeError(
        RUNTIME_ERROR_CODES.TRANSITION_RESOLUTION_FAILED,
        `Failed to resolve transition for state '${stateName}'.`,
        {
          stage: "transition.resolve",
          state: stateName,
          step: runCtx.step,
          cause: {
            message: error instanceof Error ? error.message : String(error)
          }
        }
      );
      await emit("run.failed", {
        state: stateName,
        payload: {
          error: { code: transitionError.code, message: transitionError.message },
          stage: transitionError.stage,
          ...governanceMeta,
          approvalSummary: extractApprovalSummary(runCtx.context)
        }
      });
      const result = await buildResult("failed", runCtx, stateName, transitionError);
      return {
        ...result,
        intent: resolvedIntent.intent
      };
    }
    const resolvedTransition = transitionResult.transition;
    for (const guardEvaluation of transitionResult.guardEvaluations ?? []) {
      await emit("guard.evaluated", {
        state: stateName,
        payload: {
          guard: guardEvaluation.guardName,
          passed: guardEvaluation.passed,
          expression: guardEvaluation.expression,
          reason: guardEvaluation.reason,
          scope: "transition"
        }
      });
    }

    if (!resolvedTransition) {
      for (const actionName of state.on_exit ?? []) {
        const result = await runAction(actionName);
        if (!result.ok) {
          const error = result.error ?? createRuntimeError(RUNTIME_ERROR_CODES.ACTION_FAILED, "Action failed.", {
            stage: "action.execute",
            action: actionName,
            state: stateName,
            step: runCtx.step
          });
          if (error.code === RUNTIME_ERROR_CODES.POLICY_HANDOFF_REQUIRED) {
            const runtimeResult = await buildResult("handoff", runCtx, stateName, error);
            return {
              ...runtimeResult,
              intent: resolvedIntent.intent
            };
          }
          if (error.code !== RUNTIME_ERROR_CODES.MAX_EXTERNAL_CALLS_EXCEEDED) {
            await emit("run.failed", {
              state: stateName,
              action: actionName,
              payload: {
                error: { code: error.code, message: error.message },
                stage: error.stage,
                budgetType: error.budgetType,
                ...governanceMeta,
                approvalSummary: extractApprovalSummary(runCtx.context)
              }
            });
          }
          const runtimeResult = await buildResult("failed", runCtx, stateName, error);
          return {
            ...runtimeResult,
            intent: resolvedIntent.intent
          };
        }
      }

      await emit("state.exited", { state: stateName, payload: { reason: transitionResult.reason } });

      if (state.final) {
        await emit("run.completed", {
          state: stateName,
          payload: {
            steps: runCtx.step,
            isResumed,
            resumedFrom,
            ...governanceMeta,
            approvalSummary: extractApprovalSummary(runCtx.context)
          }
        });
        const result = await buildResult("completed", runCtx, stateName);
        return {
          ...result,
          intent: resolvedIntent.intent
        };
      }

      if (state.handoff) {
        await emit("handoff.requested", {
          state: stateName,
          payload: {
            steps: runCtx.step,
            isResumed,
            resumedFrom,
            ...(extractHumanReviewRequest(runCtx.context, stateName) ?? {
              reasonCode: "state_handoff",
              reason: `State '${stateName}' is configured as handoff.`,
              source: "runtime",
              state: stateName,
              summary: `Handoff requested because state '${stateName}' is marked as handoff.`,
              requestedAt: new Date().toISOString()
            }),
            ...governanceMeta,
            approvalSummary: extractApprovalSummary(runCtx.context)
          }
        });
        const result = await buildResult("handoff", runCtx, stateName);
        return {
          ...result,
          intent: resolvedIntent.intent
        };
      }

      const error = createRuntimeError(
        RUNTIME_ERROR_CODES.NO_NEXT_STEP,
        `No valid transition from non-final state '${stateName}'.`,
        { stage: "transition.resolve", state: stateName, step: runCtx.step }
      );
      await emit("run.failed", {
        state: stateName,
        payload: {
          error: { code: error.code, message: error.message },
          stage: error.stage,
          ...governanceMeta,
          approvalSummary: extractApprovalSummary(runCtx.context)
        }
      });
      const result = await buildResult("stuck", runCtx, stateName, error);
      return {
        ...result,
        intent: resolvedIntent.intent
      };
    }

    if (!spec.states[resolvedTransition.to]) {
      const error = createRuntimeError(
        RUNTIME_ERROR_CODES.TRANSITION_RESOLUTION_FAILED,
        `Transition target '${resolvedTransition.to}' does not exist.`,
        {
          stage: "transition.resolve",
          state: stateName,
          step: runCtx.step,
          details: { from: stateName, to: resolvedTransition.to }
        }
      );
      await emit("run.failed", {
        state: stateName,
        payload: {
          error: { code: error.code, message: error.message },
          stage: error.stage,
          ...governanceMeta,
          approvalSummary: extractApprovalSummary(runCtx.context)
        }
      });
      const result = await buildResult("failed", runCtx, stateName, error);
      return {
        ...result,
        intent: resolvedIntent.intent
      };
    }

    await emit("transition.resolved", {
      state: stateName,
      transition: `${stateName}->${resolvedTransition.to}`,
      payload: {
        to: resolvedTransition.to,
        guard: resolvedTransition.guard,
        when: resolvedTransition.when
      }
    });

    for (const actionName of state.on_exit ?? []) {
      const result = await runAction(actionName);
      if (!result.ok) {
        const error = result.error ?? createRuntimeError(RUNTIME_ERROR_CODES.ACTION_FAILED, "Action failed.", {
          stage: "action.execute",
          action: actionName,
          state: stateName,
          step: runCtx.step
        });
        if (error.code === RUNTIME_ERROR_CODES.POLICY_HANDOFF_REQUIRED) {
          const runtimeResult = await buildResult("handoff", runCtx, stateName, error);
          return {
            ...runtimeResult,
            intent: resolvedIntent.intent
          };
        }
        if (error.code !== RUNTIME_ERROR_CODES.MAX_EXTERNAL_CALLS_EXCEEDED) {
          await emit("run.failed", {
            state: stateName,
            action: actionName,
            payload: {
              error: { code: error.code, message: error.message },
              stage: error.stage,
              budgetType: error.budgetType,
              ...governanceMeta,
              approvalSummary: extractApprovalSummary(runCtx.context)
            }
          });
        }
        const runtimeResult = await buildResult("failed", runCtx, stateName, error);
        return {
          ...runtimeResult,
          intent: resolvedIntent.intent
        };
      }
    }

    await emit("state.exited", { state: stateName, payload: { to: resolvedTransition.to } });
    runCtx.currentState = resolvedTransition.to;
  }

  const error = createRuntimeError(RUNTIME_ERROR_CODES.MAX_STEPS_EXCEEDED, `Max steps ${maxSteps} exceeded.`, {
    stage: "run.loop",
    budgetType: "steps",
    details: {
      maxSteps
    }
  });
  await emit("run.failed", {
    state: runCtx.currentState,
    payload: {
      error: { code: error.code, message: error.message },
      stage: error.stage,
      budgetType: error.budgetType,
      ...governanceMeta,
      approvalSummary: extractApprovalSummary(runCtx.context)
    }
  });
  const result = await buildResult("failed", runCtx, runCtx.currentState, error);
  return {
    ...result,
    intent: resolvedIntent.intent
  };
}
