import { randomUUID } from "node:crypto";
import type { AgentSpec, TraceEventType } from "@yutra/spec";
import { MemoryTraceStorage, TraceRecorder } from "@yutra/trace";
import { ActionExecutor } from "./action-executor";
import { createRuntimeError } from "./errors";
import { GuardEvaluator } from "./guard-evaluator";
import { deterministicIntentResolver } from "./intent-resolver";
import { TransitionResolver } from "./transition-resolver";
import type {
  ActionExecutionResult,
  RuntimeInput,
  RuntimeOptions,
  RuntimeResult,
  RuntimeRunContext,
  RuntimeStatus
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

export interface ExecuteRunArgs {
  spec: AgentSpec;
  input?: RuntimeInput;
  options?: RuntimeOptions;
}

export async function executeRun(args: ExecuteRunArgs): Promise<RuntimeResult> {
  const spec = args.spec;
  const input = args.input ?? {};
  const options = args.options ?? {};
  const maxSteps = options.maxSteps ?? 50;

  const runId = randomUUID();
  const baseContext = defaultContextFromSpec(spec);
  const runtimeContext: Record<string, unknown> = {
    ...baseContext,
    ...(input.context ?? {})
  };

  const recorder =
    options.traceRecorder ?? new TraceRecorder(options.traceStorage ?? new MemoryTraceStorage());

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

  const buildResult = async (
    status: RuntimeStatus,
    ctx: RuntimeRunContext,
    finalState: string,
    error?: ReturnType<typeof createRuntimeError>
  ): Promise<RuntimeResult> => {
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

  await emit("run.started", {
    payload: {
      input: {
        text: input.text,
        intent: input.intent,
        context: input.context ?? {}
      }
    }
  });

  const seedContext: RuntimeRunContext = {
    runId,
    spec,
    input,
    context: runtimeContext,
    currentState: spec.initial_state,
    step: 0,
    visitedStates: []
  };

  const intentResolver = options.intentResolver ?? deterministicIntentResolver;
  const resolvedIntent = await intentResolver.resolve(input, spec, seedContext);
  const initialState = resolveInitialState(spec, resolvedIntent);

  await emit("intent.resolved", {
    payload: {
      intent: resolvedIntent.intent,
      entryState: initialState,
      meta: resolvedIntent.meta
    }
  });

  if (!spec.states[initialState]) {
    const error = createRuntimeError("RUNTIME_INITIAL_STATE_INVALID", `Initial state '${initialState}' not found.`, {
      initialState
    });
    await emit("run.failed", {
      state: initialState,
      payload: { error }
    });
    const result = await buildResult("failed", seedContext, initialState, error);
    return {
      ...result,
      intent: resolvedIntent.intent
    };
  }

  const guardEvaluator = new GuardEvaluator(spec);
  const actionExecutor = new ActionExecutor(options.actionRegistry);
  const transitionResolver = new TransitionResolver(guardEvaluator);

  const runCtx: RuntimeRunContext = {
    ...seedContext,
    currentState: initialState
  };

  while (runCtx.step < maxSteps) {
    runCtx.step += 1;
    const stateName = runCtx.currentState;
    const state = spec.states[stateName];
    if (!state) {
      const error = createRuntimeError("RUNTIME_STATE_NOT_FOUND", `State '${stateName}' not found.`, {
        state: stateName
      });
      await emit("run.failed", { state: stateName, payload: { error } });
      const result = await buildResult("failed", runCtx, stateName, error);
      return {
        ...result,
        intent: resolvedIntent.intent
      };
    }

    runCtx.visitedStates.push(stateName);
    await emit("state.entered", { state: stateName });

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
          "RUNTIME_GUARD_NOT_PASSED",
          `Guard '${guardResult.guardName}' did not pass in state '${stateName}'.`,
          { state: stateName, guard: guardResult.guardName, reason: guardResult.reason }
        );
        await emit("run.failed", { state: stateName, payload: { error } });
        const result = await buildResult("failed", runCtx, stateName, error);
        return {
          ...result,
          intent: resolvedIntent.intent
        };
      }
    }

    const runAction = async (actionName: string): Promise<ActionExecutionResult> => {
      await emit("action.started", {
        state: stateName,
        action: actionName,
        payload: {
          context: { ...runCtx.context }
        }
      });

      const result = await actionExecutor.executeAction(actionName, runCtx);
      if (result.ok) {
        await emit("action.succeeded", {
          state: stateName,
          action: actionName,
          payload: {
            output: result.output,
            contextDelta: result.contextPatch,
            meta: result.meta
          }
        });
      } else {
        await emit("action.failed", {
          state: stateName,
          action: actionName,
          payload: {
            error: result.error,
            meta: result.meta
          }
        });
      }

      return result;
    };

    for (const actionName of state.on_enter ?? []) {
      const result = await runAction(actionName);
      if (!result.ok) {
        const error = result.error ?? createRuntimeError("RUNTIME_ACTION_FAILED", "Action failed.");
        await emit("run.failed", { state: stateName, action: actionName, payload: { error } });
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
        const error = result.error ?? createRuntimeError("RUNTIME_ACTION_FAILED", "Action failed.");
        await emit("run.failed", { state: stateName, action: actionName, payload: { error } });
        const runtimeResult = await buildResult("failed", runCtx, stateName, error);
        return {
          ...runtimeResult,
          intent: resolvedIntent.intent
        };
      }
    }

    const transitionResult = await transitionResolver.resolveNextTransition(stateName, state, runCtx.context);
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
          const error = result.error ?? createRuntimeError("RUNTIME_ACTION_FAILED", "Action failed.");
          await emit("run.failed", { state: stateName, action: actionName, payload: { error } });
          const runtimeResult = await buildResult("failed", runCtx, stateName, error);
          return {
            ...runtimeResult,
            intent: resolvedIntent.intent
          };
        }
      }

      await emit("state.exited", { state: stateName, payload: { reason: transitionResult.reason } });

      if (state.final) {
        await emit("run.completed", { state: stateName, payload: { steps: runCtx.step } });
        const result = await buildResult("completed", runCtx, stateName);
        return {
          ...result,
          intent: resolvedIntent.intent
        };
      }

      if (state.handoff) {
        await emit("handoff.requested", { state: stateName, payload: { steps: runCtx.step } });
        const result = await buildResult("handoff", runCtx, stateName);
        return {
          ...result,
          intent: resolvedIntent.intent
        };
      }

      const error = createRuntimeError(
        "RUNTIME_STUCK",
        `No valid transition from non-final state '${stateName}'.`,
        { state: stateName }
      );
      await emit("run.failed", { state: stateName, payload: { error } });
      const result = await buildResult("stuck", runCtx, stateName, error);
      return {
        ...result,
        intent: resolvedIntent.intent
      };
    }

    if (!spec.states[resolvedTransition.to]) {
      const error = createRuntimeError(
        "RUNTIME_INVALID_TRANSITION",
        `Transition target '${resolvedTransition.to}' does not exist.`,
        { from: stateName, to: resolvedTransition.to }
      );
      await emit("run.failed", { state: stateName, payload: { error } });
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
        const error = result.error ?? createRuntimeError("RUNTIME_ACTION_FAILED", "Action failed.");
        await emit("run.failed", { state: stateName, action: actionName, payload: { error } });
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

  const error = createRuntimeError("RUNTIME_MAX_STEPS_EXCEEDED", `Max steps ${maxSteps} exceeded.`, {
    maxSteps
  });
  await emit("run.failed", { state: runCtx.currentState, payload: { error } });
  const result = await buildResult("failed", runCtx, runCtx.currentState, error);
  return {
    ...result,
    intent: resolvedIntent.intent
  };
}
