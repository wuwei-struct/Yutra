import type { ScenarioSlotInvocationResult } from "./types";

export type ScenarioSlotResultSignal =
  | {
      type: "slot_completed";
      outcome: string;
    }
  | {
      type: "handoff_required";
      outcome?: string;
      safeReason?: string;
    }
  | {
      type: "slot_failed";
      failureKind: "failed" | "cancelled" | "timed_out";
      code: string;
      safeMessage: string;
    };

export function mapSlotInvocationResultToSignal(
  result: ScenarioSlotInvocationResult
): ScenarioSlotResultSignal {
  if (result.status === "completed") {
    return {
      type: "slot_completed",
      outcome: result.outcome ?? "missing_outcome"
    };
  }
  if (result.status === "handoff_required") {
    return {
      type: "handoff_required",
      outcome: result.outcome,
      safeReason: result.error?.safeMessage
    };
  }
  return {
    type: "slot_failed",
    failureKind: result.status,
    code: result.error?.code ?? "RUNTIME_ADAPTER_RESULT_INVALID",
    safeMessage:
      result.error?.safeMessage ?? "Slot Runtime returned an invalid failure."
  };
}
