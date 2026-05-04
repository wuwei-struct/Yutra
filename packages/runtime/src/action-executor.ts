import type { ActionImplementationSpec, ActionRiskLevel, ActionSideEffect, AgentSpec } from "@yutra/spec";
import { mergeContextPatch } from "./context-merge";
import { ACTION_ERROR_CODES, RUNTIME_ERROR_CODES } from "./error-codes";
import { createRuntimeError } from "./errors";
import { buildIdempotencyKey, InMemoryIdempotencyStore } from "./idempotency";
import { executeSkillAction, type SkillExecutionMetadata } from "./skill-action-executor";
import type {
  ActionAttemptResultInfo,
  ActionAttemptStartInfo,
  ActionExecutionPolicy,
  ActionExecutionResult,
  ActionHandlerResult,
  ActionRegistry,
  ContextMergePolicy,
  IdempotencyStore,
  IdempotencyRecord,
  RetryPolicy,
  RuntimeOptions,
  RuntimeRunContext
} from "./types";

interface ActionExecutorOptions {
  defaultTimeoutMs?: number;
  defaultRetryPolicy?: RetryPolicy;
  actionPolicies?: Record<string, ActionExecutionPolicy>;
  contextMergePolicy?: ContextMergePolicy;
  idempotencyStore?: IdempotencyStore;
  spec?: AgentSpec;
  skillRegistry?: RuntimeOptions["skillRegistry"];
  skillSearchPaths?: string[];
}

interface ExecuteActionHooks {
  onAttemptStart?: (info: ActionAttemptStartInfo) => Promise<void> | void;
  onAttemptResult?: (info: ActionAttemptResultInfo) => Promise<void> | void;
}

export class ActionExecutor {
  private readonly actionRegistry: ActionRegistry;
  private readonly defaultTimeoutMs: number;
  private readonly defaultRetryPolicy: Required<Pick<RetryPolicy, "maxAttempts" | "backoffMs">> &
    Pick<RetryPolicy, "retryOn">;
  private readonly actionPolicies: Record<string, ActionExecutionPolicy>;
  private readonly actionSideEffects: Record<string, ActionSideEffect>;
  private readonly actionRiskLevels: Record<string, ActionRiskLevel | undefined>;
  private readonly actionRequiresApproval: Record<string, boolean | undefined>;
  private readonly actionImplementations: Record<string, ActionImplementationSpec | undefined>;
  private readonly actionDefinitions: Record<string, NonNullable<AgentSpec["actions"]>[number] | undefined>;
  private readonly contextMergePolicy: ContextMergePolicy;
  private readonly idempotencyStore: IdempotencyStore;
  private readonly skillRegistry: ActionExecutorOptions["skillRegistry"];
  private readonly skillSearchPaths: string[] | undefined;

  public constructor(actionRegistry: ActionRegistry = {}, options: ActionExecutorOptions = {}) {
    this.actionRegistry = actionRegistry;
    this.defaultTimeoutMs = options.defaultTimeoutMs ?? 5000;
    this.defaultRetryPolicy = {
      maxAttempts: options.defaultRetryPolicy?.maxAttempts ?? 1,
      backoffMs: options.defaultRetryPolicy?.backoffMs ?? 0,
      retryOn: options.defaultRetryPolicy?.retryOn
    };
    this.actionPolicies = options.actionPolicies ?? {};
    this.actionDefinitions = Object.fromEntries((options.spec?.actions ?? []).map((action) => [action.name, action]));
    this.actionSideEffects = Object.fromEntries(
      (options.spec?.actions ?? []).map((action) => [action.name, action.side_effect ?? action.sideEffect ?? "none"])
    );
    this.actionRiskLevels = Object.fromEntries((options.spec?.actions ?? []).map((action) => [action.name, action.riskLevel]));
    this.actionRequiresApproval = Object.fromEntries(
      (options.spec?.actions ?? []).map((action) => [action.name, action.requiresApproval])
    );
    this.actionImplementations = Object.fromEntries(
      (options.spec?.actions ?? []).map((action) => [action.name, action.implementation])
    );
    this.contextMergePolicy = options.contextMergePolicy ?? { strategy: "shallow", allowNull: false };
    this.idempotencyStore = options.idempotencyStore ?? new InMemoryIdempotencyStore();
    this.skillRegistry = options.skillRegistry;
    this.skillSearchPaths = options.skillSearchPaths;
  }

  public async executeAction(
    actionName: string,
    ctx: RuntimeRunContext,
    hooks: ExecuteActionHooks = {}
  ): Promise<ActionExecutionResult> {
    const actionDefinition = this.actionDefinitions[actionName];
    const handler = this.actionRegistry[actionName];
    const policy = this.actionPolicies[actionName] ?? {};
    const implementation = (policy.implementation ?? this.actionImplementations[actionName]) as
      | ActionImplementationSpec
      | undefined;
    const implementationType = implementation?.type;
    const isSkillAction = implementationType === "skill";
    const implementationSkillName =
      typeof implementation?.skillName === "string" ? implementation.skillName : isSkillAction ? actionName : undefined;
    const implementationSkillVersion = typeof implementation?.skillVersion === "string" ? implementation.skillVersion : undefined;
    const implementationSkillEntry = typeof implementation?.entry === "string" ? implementation.entry : undefined;
    const retryPolicy = {
      maxAttempts: policy.retryPolicy?.maxAttempts ?? this.defaultRetryPolicy.maxAttempts,
      backoffMs: policy.retryPolicy?.backoffMs ?? this.defaultRetryPolicy.backoffMs,
      retryOn: policy.retryPolicy?.retryOn ?? this.defaultRetryPolicy.retryOn
    };
    const timeoutMs = policy.timeoutMs ?? this.defaultTimeoutMs;
    let sideEffect = policy.sideEffect ?? this.actionSideEffects[actionName] ?? "none";
    const riskLevel = policy.riskLevel ?? this.actionRiskLevels[actionName];
    const requiresApproval = policy.requiresApproval ?? this.actionRequiresApproval[actionName];
    const explicitIdempotencyKey = policy.idempotencyKey;
    const useIdempotency = sideEffect === "write" || sideEffect === "external";
    const idempotencyKey = buildIdempotencyKey({
      actionName,
      stateName: ctx.currentState,
      ctx,
      explicitKey: explicitIdempotencyKey
    });

    if (useIdempotency) {
      const existing = await this.idempotencyStore.get(idempotencyKey);
      if (existing) {
        if (existing.actionName !== actionName) {
          const conflictError = createRuntimeError(
            RUNTIME_ERROR_CODES.IDEMPOTENCY_CONFLICT,
            `Idempotency key '${idempotencyKey}' is already bound to action '${existing.actionName}'.`,
            {
              stage: "action.idempotency",
              action: actionName,
              state: ctx.currentState,
              step: ctx.step,
              details: {
                idempotencyKey,
                existingAction: existing.actionName
              }
            }
          );
          return {
            actionName,
            ok: false,
            error: conflictError,
            attempt: 1,
            maxAttempts: retryPolicy.maxAttempts,
            finalAttempt: true,
            durationMs: 0,
            timeoutMs,
            retryable: false,
            sideEffect,
            externalCallCount: 0,
            idempotencyKey,
            idempotencyHit: true
          };
        }

        await hooks.onAttemptStart?.({
          actionName,
          attempt: 1,
          maxAttempts: retryPolicy.maxAttempts,
          timeoutMs,
          sideEffect,
          idempotencyKey,
          idempotencyHit: true,
          resumedRun: ctx.isResumed,
          implementationType,
          skillName: implementationSkillName,
          skillVersion: implementationSkillVersion,
          skillEntry: implementationSkillEntry,
          riskLevel,
          requiresApproval
        });
        await hooks.onAttemptResult?.({
          actionName,
          attempt: 1,
          maxAttempts: retryPolicy.maxAttempts,
          timeoutMs,
          sideEffect,
          ok: true,
          output: existing.output,
          contextPatch: existing.contextPatch,
          meta: {
            ...(existing.meta ?? {}),
            idempotencyHit: true
          },
          durationMs: 0,
          retryable: false,
          finalAttempt: true,
          idempotencyKey,
          idempotencyHit: true,
          resumedRun: ctx.isResumed,
          implementationType,
          skillName: implementationSkillName,
          skillVersion: implementationSkillVersion,
          skillEntry: implementationSkillEntry,
          riskLevel,
          requiresApproval
        });

        return {
          actionName,
          ok: true,
          output: existing.output,
          contextPatch: existing.contextPatch,
          meta: {
            ...(existing.meta ?? {}),
            idempotencyHit: true
          },
          attempt: 1,
          maxAttempts: retryPolicy.maxAttempts,
          finalAttempt: true,
          durationMs: 0,
          timeoutMs,
          retryable: false,
          sideEffect,
          externalCallCount: 0,
          idempotencyKey,
          idempotencyHit: true
        };
      }
    }

    if (!handler && !isSkillAction) {
      const error = createRuntimeError(
        RUNTIME_ERROR_CODES.ACTION_NOT_FOUND,
        `Action '${actionName}' is not registered.`,
        {
          stage: "action.resolve",
          action: actionName,
          state: ctx.currentState,
          step: ctx.step,
          retryable: false,
          details: { action: actionName }
        }
      );
      const failure: ActionExecutionResult = {
        actionName,
        ok: false,
        error,
        attempt: 1,
        maxAttempts: retryPolicy.maxAttempts,
        finalAttempt: true,
        durationMs: 0,
        timeoutMs,
        retryable: false,
        sideEffect,
        externalCallCount: 0,
        idempotencyKey,
        idempotencyHit: false
      };
      await hooks.onAttemptStart?.({
        actionName,
        attempt: 1,
        maxAttempts: retryPolicy.maxAttempts,
        timeoutMs,
        sideEffect,
        idempotencyKey,
        idempotencyHit: false,
        resumedRun: ctx.isResumed,
        implementationType,
        skillName: implementationSkillName,
        skillVersion: implementationSkillVersion,
        skillEntry: implementationSkillEntry,
        riskLevel,
        requiresApproval
      });
      await hooks.onAttemptResult?.({
        actionName,
        attempt: 1,
        maxAttempts: retryPolicy.maxAttempts,
        timeoutMs,
        sideEffect,
        ok: false,
        error,
        durationMs: 0,
        retryable: false,
        finalAttempt: true,
        idempotencyKey,
        idempotencyHit: false,
        resumedRun: ctx.isResumed,
        implementationType,
        skillName: implementationSkillName,
        skillVersion: implementationSkillVersion,
        skillEntry: implementationSkillEntry,
        riskLevel,
        requiresApproval
      });
      return failure;
    }

    let accumulatedExternalCalls = 0;
    let lastFailure: ActionExecutionResult | undefined;
    for (let attempt = 1; attempt <= retryPolicy.maxAttempts; attempt += 1) {
      if (sideEffect === "external") {
        accumulatedExternalCalls += 1;
      }
      await hooks.onAttemptStart?.({
        actionName,
        attempt,
        maxAttempts: retryPolicy.maxAttempts,
        timeoutMs,
        sideEffect,
        idempotencyKey,
        idempotencyHit: false,
        resumedRun: ctx.isResumed,
        implementationType,
        skillName: implementationSkillName,
        skillVersion: implementationSkillVersion,
        skillEntry: implementationSkillEntry,
        riskLevel,
        requiresApproval,
        inputValidated: isSkillAction ? false : undefined
      });

      const startedAt = Date.now();
      let rawResult: ActionHandlerResult;
      let skillDetails: SkillExecutionMetadata | undefined;
      try {
        if (isSkillAction) {
          const skillResult = await this.withTimeout(
            executeSkillAction({
              actionName,
              ctx,
              actionPolicy: policy,
              actionDefinition,
              runtimeOptions: {
                skillRegistry: this.skillRegistry,
                skillSearchPaths: this.skillSearchPaths
              }
            }),
            timeoutMs
          );
          skillDetails = skillResult.details;
          sideEffect = skillDetails.sideEffect ?? sideEffect;
          rawResult = skillResult.ok
            ? {
                ok: true,
                output: skillResult.output,
                contextPatch: skillResult.contextPatch,
                meta: skillResult.meta
              }
            : {
                ok: false,
                error: {
                  code: skillResult.error?.code ?? RUNTIME_ERROR_CODES.SKILL_EXECUTION_FAILED,
                  message: skillResult.error?.message ?? "Skill action failed.",
                  retryable: false,
                  details: skillResult.error?.details
                },
                meta: skillResult.meta
              };
        } else {
          rawResult = await this.withTimeout(handler!(ctx), timeoutMs);
        }
      } catch (error) {
        const runtimeError = this.classifyExecutionException(actionName, ctx, error);
        const retryable = this.shouldRetry(runtimeError, retryPolicy);
        const finalAttempt = !retryable || attempt >= retryPolicy.maxAttempts;
        const durationMs = Date.now() - startedAt;
        lastFailure = {
          actionName,
          ok: false,
          error: runtimeError,
          attempt,
          maxAttempts: retryPolicy.maxAttempts,
          finalAttempt,
          durationMs,
          timeoutMs,
          retryable,
          sideEffect,
          externalCallCount: accumulatedExternalCalls
        };

        await hooks.onAttemptResult?.({
          actionName,
          attempt,
          maxAttempts: retryPolicy.maxAttempts,
          timeoutMs,
          sideEffect,
          ok: false,
          error: runtimeError,
          durationMs,
          retryable,
          finalAttempt,
          idempotencyKey,
          idempotencyHit: false,
          resumedRun: ctx.isResumed,
          implementationType,
          skillName: skillDetails?.skillName ?? implementationSkillName,
          skillVersion: skillDetails?.skillVersion ?? implementationSkillVersion,
          skillEntry: skillDetails?.skillEntry ?? implementationSkillEntry,
          riskLevel: skillDetails?.riskLevel ?? riskLevel,
          requiresApproval: skillDetails?.requiresApproval ?? requiresApproval,
          inputValidated: skillDetails?.inputValidated,
          outputValidated: skillDetails?.outputValidated
        });

        if (finalAttempt) {
          return lastFailure;
        }

        if (retryPolicy.backoffMs > 0) {
          await this.delay(retryPolicy.backoffMs);
        }
        continue;
      }

      if (!rawResult.ok) {
        const runtimeError = createRuntimeError(
          rawResult.error?.code ?? RUNTIME_ERROR_CODES.ACTION_FAILED,
          rawResult.error?.message ?? `Action '${actionName}' failed.`,
          {
            stage: "action.execute",
            action: actionName,
            state: ctx.currentState,
            step: ctx.step,
            retryable: rawResult.error?.retryable,
            details: rawResult.error?.details
          }
        );
        const retryable = this.shouldRetry(runtimeError, retryPolicy);
        const finalAttempt = !retryable || attempt >= retryPolicy.maxAttempts;
        const durationMs = Date.now() - startedAt;

        lastFailure = {
          actionName,
          ok: false,
          error: runtimeError,
          meta: rawResult.meta,
          attempt,
          maxAttempts: retryPolicy.maxAttempts,
          finalAttempt,
          durationMs,
          timeoutMs,
          retryable,
          sideEffect,
          externalCallCount: accumulatedExternalCalls,
          idempotencyKey,
          idempotencyHit: false
        };

        await hooks.onAttemptResult?.({
          actionName,
          attempt,
          maxAttempts: retryPolicy.maxAttempts,
          timeoutMs,
          sideEffect,
          ok: false,
          error: runtimeError,
          meta: rawResult.meta,
          durationMs,
          retryable,
          finalAttempt,
          idempotencyKey,
          idempotencyHit: false,
          resumedRun: ctx.isResumed,
          implementationType,
          skillName: skillDetails?.skillName ?? implementationSkillName,
          skillVersion: skillDetails?.skillVersion ?? implementationSkillVersion,
          skillEntry: skillDetails?.skillEntry ?? implementationSkillEntry,
          riskLevel: skillDetails?.riskLevel ?? riskLevel,
          requiresApproval: skillDetails?.requiresApproval ?? requiresApproval,
          inputValidated: skillDetails?.inputValidated,
          outputValidated: skillDetails?.outputValidated
        });

        if (finalAttempt) {
          return lastFailure;
        }

        if (retryPolicy.backoffMs > 0) {
          await this.delay(retryPolicy.backoffMs);
        }
        continue;
      }

      try {
        if (rawResult.contextPatch) {
          const mergeResult = mergeContextPatch(ctx.context, rawResult.contextPatch, this.contextMergePolicy);
          if (!mergeResult.ok) {
            const durationMs = Date.now() - startedAt;
            await hooks.onAttemptResult?.({
              actionName,
              attempt,
              maxAttempts: retryPolicy.maxAttempts,
              timeoutMs,
              sideEffect,
              ok: false,
              error: mergeResult.error,
              durationMs,
              retryable: false,
              finalAttempt: true,
              idempotencyKey,
              idempotencyHit: false,
              resumedRun: ctx.isResumed,
              implementationType,
              skillName: skillDetails?.skillName ?? implementationSkillName,
              skillVersion: skillDetails?.skillVersion ?? implementationSkillVersion,
              skillEntry: skillDetails?.skillEntry ?? implementationSkillEntry,
              riskLevel: skillDetails?.riskLevel ?? riskLevel,
              requiresApproval: skillDetails?.requiresApproval ?? requiresApproval,
              inputValidated: skillDetails?.inputValidated,
              outputValidated: skillDetails?.outputValidated
            });
            return {
              actionName,
              ok: false,
              error: mergeResult.error,
              attempt,
              maxAttempts: retryPolicy.maxAttempts,
              finalAttempt: true,
              durationMs,
              timeoutMs,
              retryable: false,
              sideEffect,
              externalCallCount: accumulatedExternalCalls,
              idempotencyKey,
              idempotencyHit: false
            };
          }
        }
      } catch (error) {
        const mergeError = createRuntimeError(
          RUNTIME_ERROR_CODES.CONTEXT_MERGE_FAILED,
          `Failed to merge context patch for action '${actionName}'.`,
          {
            stage: "action.context_merge",
            action: actionName,
            state: ctx.currentState,
            step: ctx.step,
            retryable: false,
            cause: {
              message: error instanceof Error ? error.message : String(error)
            }
          }
        );
        const durationMs = Date.now() - startedAt;
        await hooks.onAttemptResult?.({
          actionName,
          attempt,
          maxAttempts: retryPolicy.maxAttempts,
          timeoutMs,
          sideEffect,
          ok: false,
          error: mergeError,
          durationMs,
          retryable: false,
          finalAttempt: true,
          idempotencyKey,
          idempotencyHit: false,
          resumedRun: ctx.isResumed,
          implementationType,
          skillName: skillDetails?.skillName ?? implementationSkillName,
          skillVersion: skillDetails?.skillVersion ?? implementationSkillVersion,
          skillEntry: skillDetails?.skillEntry ?? implementationSkillEntry,
          riskLevel: skillDetails?.riskLevel ?? riskLevel,
          requiresApproval: skillDetails?.requiresApproval ?? requiresApproval,
          inputValidated: skillDetails?.inputValidated,
          outputValidated: skillDetails?.outputValidated
        });
        return {
          actionName,
          ok: false,
          error: mergeError,
          attempt,
          maxAttempts: retryPolicy.maxAttempts,
          finalAttempt: true,
          durationMs,
          timeoutMs,
          retryable: false,
          sideEffect,
          externalCallCount: accumulatedExternalCalls,
          idempotencyKey,
          idempotencyHit: false
        };
      }

      const runtimeMeta = {
        ...(rawResult.meta ?? {}),
        idempotencyHit: false
      };
      const effectiveIdempotencyKey = rawResult.idempotencyKey ?? idempotencyKey;
      if (useIdempotency) {
        const record: IdempotencyRecord = {
          key: effectiveIdempotencyKey,
          actionName,
          state: ctx.currentState,
          scopeId: ctx.idempotencyScopeId,
          output: rawResult.output,
          contextPatch: rawResult.contextPatch,
          meta: runtimeMeta,
          ts: new Date().toISOString()
        };
        await this.idempotencyStore.set(record);
      }

      const durationMs = Date.now() - startedAt;
      await hooks.onAttemptResult?.({
        actionName,
        attempt,
        maxAttempts: retryPolicy.maxAttempts,
        timeoutMs,
        sideEffect,
        ok: true,
        output: rawResult.output,
        contextPatch: rawResult.contextPatch,
        meta: runtimeMeta,
        durationMs,
        retryable: false,
        finalAttempt: true,
        idempotencyKey: effectiveIdempotencyKey,
        idempotencyHit: false,
        resumedRun: ctx.isResumed,
        implementationType,
        skillName: skillDetails?.skillName ?? implementationSkillName,
        skillVersion: skillDetails?.skillVersion ?? implementationSkillVersion,
        skillEntry: skillDetails?.skillEntry ?? implementationSkillEntry,
        riskLevel: skillDetails?.riskLevel ?? riskLevel,
        requiresApproval: skillDetails?.requiresApproval ?? requiresApproval,
        inputValidated: skillDetails?.inputValidated,
        outputValidated: skillDetails?.outputValidated
      });

      return {
        actionName,
        ok: true,
        output: rawResult.output,
        contextPatch: rawResult.contextPatch,
        meta: runtimeMeta,
        attempt,
        maxAttempts: retryPolicy.maxAttempts,
        finalAttempt: true,
        durationMs,
        timeoutMs,
        retryable: false,
        sideEffect,
        externalCallCount: accumulatedExternalCalls,
        idempotencyKey: effectiveIdempotencyKey,
        idempotencyHit: false
      };
    }

    return (
      lastFailure ?? {
        actionName,
        ok: false,
        error: createRuntimeError(RUNTIME_ERROR_CODES.ACTION_FAILED, `Action '${actionName}' failed.`, {
          stage: "action.execute",
          action: actionName,
          state: ctx.currentState,
          step: ctx.step
        }),
        attempt: 1,
        maxAttempts: retryPolicy.maxAttempts,
        finalAttempt: true,
        durationMs: 0,
        timeoutMs,
        retryable: false,
        sideEffect,
        externalCallCount: accumulatedExternalCalls,
        idempotencyKey,
        idempotencyHit: false
      }
    );
  }

  private shouldRetry(error: { code: string; retryable?: boolean }, policy: RetryPolicy): boolean {
    if (error.retryable === true) {
      return true;
    }
    if (policy.retryOn && policy.retryOn.includes(error.code)) {
      return true;
    }
    return false;
  }

  private async withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    let timeoutHandle: NodeJS.Timeout | undefined;
    return await new Promise<T>((resolve, reject) => {
      timeoutHandle = setTimeout(() => {
        reject(
          createRuntimeError(ACTION_ERROR_CODES.TIMEOUT, `Action execution timed out after ${timeoutMs}ms.`, {
            stage: "action.execute",
            retryable: true
          })
        );
      }, timeoutMs);

      promise
        .then((value) => resolve(value))
        .catch((error) => reject(error))
        .finally(() => {
          if (timeoutHandle) {
            clearTimeout(timeoutHandle);
          }
        });
    });
  }

  private classifyExecutionException(actionName: string, ctx: RuntimeRunContext, error: unknown) {
    if (error && typeof error === "object" && "code" in error && "message" in error) {
      const typed = error as { code: string; message: string; retryable?: boolean };
      if (typed.code === ACTION_ERROR_CODES.TIMEOUT) {
        return createRuntimeError(RUNTIME_ERROR_CODES.ACTION_TIMEOUT, typed.message, {
          stage: "action.execute",
          action: actionName,
          state: ctx.currentState,
          step: ctx.step,
          retryable: true,
          cause: {
            code: typed.code,
            message: typed.message
          }
        });
      }
      return createRuntimeError(typed.code ?? RUNTIME_ERROR_CODES.ACTION_FAILED, typed.message, {
        stage: "action.execute",
        action: actionName,
        state: ctx.currentState,
        step: ctx.step,
        retryable: typed.retryable
      });
    }

    return createRuntimeError(RUNTIME_ERROR_CODES.ACTION_FAILED, `Action '${actionName}' failed with exception.`, {
      stage: "action.execute",
      action: actionName,
      state: ctx.currentState,
      step: ctx.step,
      retryable: false,
      cause: {
        message: error instanceof Error ? error.message : String(error)
      }
    });
  }

  private async delay(ms: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }
}
