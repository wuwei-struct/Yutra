import { z } from "zod";

const hashSchema = z.string().regex(/^sha256:[a-f0-9]{64}$/);
const requiredString = z.string().min(1);

export const scenarioEvidenceTimelineItemSchema = z
  .object({
    index: z.number().int().positive(),
    source: z.enum(["orchestrator_trace", "projection_evidence"]),
    type: requiredString,
    sequence: z.number().int().positive().optional(),
    invocationIndex: z.number().int().positive().optional(),
    slotId: requiredString.optional(),
    routeId: requiredString.optional(),
    bindingId: requiredString.optional(),
    overlayId: requiredString.optional(),
    decision: requiredString.optional(),
    semanticOutcome: requiredString.optional(),
    projectionId: requiredString.optional(),
    runtimeStatus: requiredString.optional(),
    terminalId: requiredString.optional(),
    errorCode: requiredString.optional()
  })
  .strict();

export const scenarioRunEvidenceBundleSchema = z
  .object({
    schemaVersion: z.literal("1.0.0-preview"),
    evidenceId: requiredString,
    evidenceHash: hashSchema,
    run: z
      .object({
        orchestratorRunId: requiredString,
        orchestratorId: requiredString,
        compositionId: requiredString,
        demoCase: requiredString,
        status: z.enum(["completed", "handoff_required", "failed"]),
        terminalId: z.enum([
          "$scenario_done",
          "$human_handoff",
          "$fail_closed"
        ]),
        scenarioCompleted: z.boolean()
      })
      .strict(),
    sources: z
      .object({
        planHash: hashSchema,
        compositionBundleHash: hashSchema,
        orchestratorHash: hashSchema,
        previewBundleHash: hashSchema
      })
      .strict(),
    slotInvocations: z.array(
      z
        .object({
          invocationIndex: z.number().int().positive(),
          invocationId: requiredString,
          slotId: requiredString,
          runtimeStatus: requiredString,
          runtimeFinalState: requiredString.optional(),
          semanticOutcome: requiredString.optional(),
          projectionId: requiredString.optional(),
          runtimeRunId: requiredString.optional(),
          traceReferenceStatus: z.enum(["available", "unavailable"]),
          auditReferenceStatus: z.enum(["available", "unavailable"])
        })
        .strict()
    ),
    decisions: z
      .object({
        projections: z.array(
          z
            .object({
              invocationIndex: z.number().int().positive(),
              slotId: requiredString,
              semanticOutcome: requiredString,
              projectionId: requiredString
            })
            .strict()
        ),
        routes: z.array(
          z.object({ routeId: requiredString, effect: requiredString }).strict()
        ),
        bindings: z.array(
          z.object({ bindingId: requiredString }).strict()
        ),
        overlays: z.array(
          z
            .object({
              overlayId: requiredString,
              stage: requiredString,
              decision: requiredString
            })
            .strict()
        )
      })
      .strict(),
    timeline: z.array(scenarioEvidenceTimelineItemSchema).min(2),
    budgetUsage: z
      .object({
        slotInvocations: z.number().int().nonnegative(),
        routeEvaluations: z.number().int().nonnegative(),
        bindingApplications: z.number().int().nonnegative()
      })
      .strict(),
    auditSummary: z
      .object({
        status: z.literal("available"),
        redacted: z.literal(true),
        externalEffectsOccurred: z.literal(false)
      })
      .strict(),
    redactionSummary: z
      .object({
        redacted: z.literal(true),
        completeInputIncluded: z.literal(false),
        completeOutputIncluded: z.literal(false),
        completeSlotTraceIncluded: z.literal(false),
        completeAuditIncluded: z.literal(false)
      })
      .strict(),
    publicExposure: z
      .object({
        mode: z.literal("demo_only"),
        containsCustomerData: z.literal(false),
        containsRealEndpoint: z.literal(false),
        containsSecret: z.literal(false),
        containsCustomerSop: z.literal(false),
        containsCommercialDeliveryAsset: z.literal(false)
      })
      .strict()
  })
  .strict();
