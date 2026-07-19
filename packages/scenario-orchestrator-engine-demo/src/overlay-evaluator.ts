import type { ScenarioOverlayRef } from "@yutra/scenario-orchestrator-core";
import { DEMO_ORCHESTRATOR_ENGINE_ERROR_CODES, DemoOrchestratorEngineError } from "./errors";
import type {
  ExplicitScenarioOverlayEvaluatorRegistry,
  ScenarioOverlayDecision,
  ScenarioOverlayEvaluationContext
} from "./types";

function applies(
  overlay: ScenarioOverlayRef,
  context: ScenarioOverlayEvaluationContext
): boolean {
  return overlay.scopes.some((scope) => {
    if (scope.type === "scenario") return true;
    if (scope.type === "slot") return context.stage === "slot_before" && scope.slotId === context.activeSlotId;
    return context.stage === "route_before" && scope.routeId === context.routeId;
  });
}

export function evaluateScenarioOverlays(input: {
  overlays: readonly ScenarioOverlayRef[];
  registry: ExplicitScenarioOverlayEvaluatorRegistry;
  context: Omit<ScenarioOverlayEvaluationContext, "overlayId">;
  onEvaluated(overlayId: string, decision: ScenarioOverlayDecision): void;
}): ScenarioOverlayDecision {
  let finalDecision: ScenarioOverlayDecision = "allow";
  for (const overlay of input.overlays.filter((candidate) =>
    applies(candidate, { ...input.context, overlayId: candidate.overlayId })
  )) {
    const evaluator = input.registry[overlay.overlayId];
    if (!evaluator) {
      throw new DemoOrchestratorEngineError(
        DEMO_ORCHESTRATOR_ENGINE_ERROR_CODES.OVERLAY_UNKNOWN,
        `Overlay ${overlay.overlayId} has no explicit evaluator.`
      );
    }
    const contractDecision =
      overlay.enforcementMode === "audit_required" && input.context.auditAvailable !== true
        ? "deny"
        : overlay.enforcementMode === "adapter_boundary" &&
            input.context.adapterMode !== "demo_only"
          ? "deny"
          : undefined;
    const decision =
      contractDecision ??
      evaluator({ ...input.context, overlayId: overlay.overlayId });
    input.onEvaluated(overlay.overlayId, decision);
    if (decision === "deny") return "deny";
    if (decision === "handoff") finalDecision = "handoff";
  }
  return finalDecision;
}
