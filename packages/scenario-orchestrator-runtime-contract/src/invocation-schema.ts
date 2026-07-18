import { z } from "zod";

export const canonicalSha256Schema = z
  .string()
  .regex(/^sha256:[a-f0-9]{64}$/);

export const scenarioSideEffectLevelSchema = z.enum([
  "none",
  "read",
  "write",
  "external",
  "financial",
  "approval"
]);

const namespacedValueSchema = z
  .object({
    namespace: z.string().min(1),
    value: z.unknown(),
    byteLength: z.number().int().nonnegative(),
    redactionApplied: z.literal(true)
  })
  .strict();

export const scenarioSlotInvocationRequestSchema = z
  .object({
    schemaVersion: z.literal("1.0.0-preview"),
    orchestratorRunId: z.string().min(1),
    invocationId: z.string().min(1),
    invocationIndex: z.number().int().positive(),
    idempotencyKey: z.string().min(1),
    orchestratorId: z.string().min(1),
    compositionId: z.string().min(1),
    slotId: z.string().min(1),
    archetypeId: z.string().min(1),
    artifactRef: z
      .object({
        agentArtifactPath: z.string().min(1),
        agentArtifactHash: canonicalSha256Schema,
        configHash: canonicalSha256Schema
      })
      .strict(),
    traceParent: z
      .object({
        orchestratorRunId: z.string().min(1),
        parentSequence: z.number().int().nonnegative(),
        parentSpanId: z.string().min(1)
      })
      .strict(),
    input: namespacedValueSchema,
    budget: z
      .object({
        timeoutMs: z.number().int().positive(),
        maxRuntimeSteps: z.number().int().positive()
      })
      .strict(),
    sideEffectPolicy: z
      .object({
        maximumAllowedLevel: scenarioSideEffectLevelSchema,
        requireExplicitDeclaration: z.literal(true)
      })
      .strict(),
    retryPolicy: z
      .object({
        orchestratorRetryAllowed: z.literal(false),
        invocationAttempt: z.literal(1)
      })
      .strict()
  })
  .strict();

export const scenarioSlotInvocationResultSchema = z
  .object({
    schemaVersion: z.literal("1.0.0-preview"),
    invocationId: z.string().min(1),
    idempotencyKey: z.string().min(1),
    runtimeRunId: z.string().min(1),
    status: z.enum([
      "completed",
      "handoff_required",
      "failed",
      "cancelled",
      "timed_out"
    ]),
    projectionEvidence: z
      .object({
        runtimeStatus: z.enum([
          "completed",
          "handoff_required",
          "failed",
          "cancelled",
          "timed_out"
        ]),
        runtimeFinalState: z.string().min(1).optional(),
        outputMarkers: z.record(
          z.string(),
          z.union([z.string(), z.number(), z.boolean(), z.null()])
        ),
        controlSignal: z.enum(["handoff_required", "fail_closed"]).optional(),
        errorCode: z.string().min(1).optional()
      })
      .strict(),
    outcome: z.string().min(1).optional(),
    output: namespacedValueSchema.optional(),
    error: z
      .object({
        code: z.string().min(1),
        safeMessage: z.string().min(1),
        retryable: z.literal(false)
      })
      .strict()
      .optional(),
    traceReference: z
      .object({
        runtimeRunId: z.string().min(1),
        parentOrchestratorRunId: z.string().min(1),
        firstSequence: z.number().int().nonnegative(),
        lastSequence: z.number().int().nonnegative(),
        eventCount: z.number().int().nonnegative()
      })
      .strict(),
    auditReference: z
      .object({
        runtimeRunId: z.string().min(1),
        status: z.enum(["available", "unavailable"]),
        redacted: z.literal(true)
      })
      .strict(),
    sideEffectSummary: z
      .object({
        declaredLevel: scenarioSideEffectLevelSchema,
        externalEffectsOccurred: z.boolean(),
        effectCount: z.number().int().nonnegative()
      })
      .strict(),
    resourceUsage: z
      .object({
        runtimeSteps: z.number().int().nonnegative(),
        elapsedMs: z.number().int().nonnegative()
      })
      .strict()
  })
  .strict();

export const scenarioSlotCancellationRequestSchema = z
  .object({
    schemaVersion: z.literal("1.0.0-preview"),
    orchestratorRunId: z.string().min(1),
    invocationId: z.string().min(1),
    idempotencyKey: z.string().min(1),
    reasonCode: z.string().min(1)
  })
  .strict();

export const scenarioSlotCancellationResultSchema = z
  .object({
    schemaVersion: z.literal("1.0.0-preview"),
    invocationId: z.string().min(1),
    status: z.enum(["cancelled", "not_cancellable", "already_terminal"])
  })
  .strict();
