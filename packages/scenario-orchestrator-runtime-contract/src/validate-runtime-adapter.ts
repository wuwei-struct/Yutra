import type { z } from "zod";
import { scenarioRuntimeAdapterDescriptorSchema } from "./adapter-descriptor-schema";
import type {
  RuntimeAdapterContractIssue,
  RuntimeAdapterValidationResult
} from "./errors";
import type { ScenarioRuntimeAdapterDescriptor } from "./types";

function schemaIssueToContractIssue(
  schemaIssue: z.ZodIssue
): RuntimeAdapterContractIssue {
  const path = schemaIssue.path.map(String);
  const publicBoundary = path[0] === "publicExposure";
  return {
    code: publicBoundary
      ? "RUNTIME_ADAPTER_PUBLIC_BOUNDARY_INVALID"
      : "RUNTIME_ADAPTER_DESCRIPTOR_INVALID",
    message: schemaIssue.message,
    path
  };
}

export function validateRuntimeAdapterDescriptor(
  input: unknown
): RuntimeAdapterValidationResult<ScenarioRuntimeAdapterDescriptor> {
  const parsed = scenarioRuntimeAdapterDescriptorSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      issues: parsed.error.issues.map(schemaIssueToContractIssue)
    };
  }
  return {
    ok: true,
    value: parsed.data as ScenarioRuntimeAdapterDescriptor,
    issues: []
  };
}
