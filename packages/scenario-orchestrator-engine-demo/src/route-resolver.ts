import type { ScenarioOrchestratorRoute } from "@yutra/scenario-orchestrator-core";
import { DEMO_ORCHESTRATOR_ENGINE_ERROR_CODES, DemoOrchestratorEngineError } from "./errors";
import type { ExplicitScenarioRouteConditionRegistry, ScenarioRouteConditionContext } from "./types";

export function resolveScenarioRoute(input: {
  routes: readonly ScenarioOrchestratorRoute[];
  activeSlotId: string;
  semanticOutcome: string;
  registry: ExplicitScenarioRouteConditionRegistry;
  context: ScenarioRouteConditionContext;
  onEvaluated(route: ScenarioOrchestratorRoute, matched: boolean): void;
}): ScenarioOrchestratorRoute {
  const candidates = input.routes
    .filter((route) => route.fromSlotId === input.activeSlotId && route.outcome === input.semanticOutcome)
    .sort((a, b) => b.priority - a.priority || a.routeId.localeCompare(b.routeId));
  if (candidates.length === 0) {
    throw new DemoOrchestratorEngineError(DEMO_ORCHESTRATOR_ENGINE_ERROR_CODES.ROUTE_NOT_FOUND, "No explicit Scenario Route matches the projected outcome.");
  }
  const matches: ScenarioOrchestratorRoute[] = [];
  for (const route of candidates) {
    const evaluator = input.registry[route.conditionRef];
    if (!evaluator) throw new DemoOrchestratorEngineError(DEMO_ORCHESTRATOR_ENGINE_ERROR_CODES.CONDITION_UNKNOWN, `Route condition ${route.conditionRef} is not registered.`);
    const matched = evaluator(structuredClone(input.context));
    input.onEvaluated(route, matched);
    if (matched) matches.push(route);
  }
  if (matches.length === 0) throw new DemoOrchestratorEngineError(DEMO_ORCHESTRATOR_ENGINE_ERROR_CODES.ROUTE_NOT_FOUND, "No explicit Scenario Route condition matched.");
  const top = matches[0]!.priority;
  if (matches.filter((route) => route.priority === top).length !== 1) {
    throw new DemoOrchestratorEngineError(DEMO_ORCHESTRATOR_ENGINE_ERROR_CODES.ROUTE_AMBIGUOUS, "Scenario Route selection is ambiguous.");
  }
  return structuredClone(matches[0]!);
}
