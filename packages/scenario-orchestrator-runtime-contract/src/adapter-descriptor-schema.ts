import { z } from "zod";
import { RUNTIME_ADAPTER_CAPABILITY_IDS } from "./capability";

const strictVersionSchema = z
  .string()
  .min(1)
  .refine((value) => !value.includes("*"), {
    message: "Wildcard versions are forbidden."
  });

const capabilitiesShape = Object.fromEntries(
  RUNTIME_ADAPTER_CAPABILITY_IDS.map((capabilityId) => [
    capabilityId,
    z.boolean().optional().default(false)
  ])
) as Record<(typeof RUNTIME_ADAPTER_CAPABILITY_IDS)[number], z.ZodDefault<z.ZodOptional<z.ZodBoolean>>>;

export const runtimeAdapterPublicExposureSchema = z
  .object({
    mode: z.enum(["demo_only", "contract_only"]),
    containsCustomerData: z.literal(false),
    containsRealEndpoint: z.literal(false),
    containsSecret: z.literal(false),
    containsCustomerSop: z.literal(false),
    containsCommercialDeliveryAsset: z.literal(false)
  })
  .strict();

export const scenarioRuntimeAdapterDescriptorSchema = z
  .object({
    schemaVersion: z.literal("1.0.0-preview"),
    adapterId: z.string().min(1),
    adapterVersion: strictVersionSchema,
    protocolVersion: z.literal("1.0.0-preview"),
    implementationStatus: z.enum(["contract_only", "available", "disabled"]),
    supportedOrchestratorSchemaVersions: z.array(strictVersionSchema).min(1),
    supportedExecutionModels: z.tuple([
      z.literal("single_active_slot_call_return")
    ]),
    supportedAgentDslVersions: z.array(strictVersionSchema).min(1),
    capabilities: z.object(capabilitiesShape).strict(),
    limits: z
      .object({
        maxInvocationInputBytes: z.number().int().positive(),
        maxInvocationOutputBytes: z.number().int().positive(),
        maxTimeoutMs: z.number().int().positive(),
        maxConcurrentSlotInvocations: z.literal(1)
      })
      .strict(),
    publicExposure: runtimeAdapterPublicExposureSchema
  })
  .strict();
