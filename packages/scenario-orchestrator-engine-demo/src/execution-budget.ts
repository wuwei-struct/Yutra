import { DEMO_ORCHESTRATOR_ENGINE_ERROR_CODES, DemoOrchestratorEngineError } from "./errors";
import type { ScenarioBudgetUsage, ScenarioRunRequest } from "./types";

export class ExecutionBudget {
  readonly usage: ScenarioBudgetUsage = { slotInvocations: 0, routeEvaluations: 0, bindingApplications: 0 };
  readonly limits: Required<NonNullable<ScenarioRunRequest["budget"]>>;

  constructor(request: ScenarioRunRequest, contract: { maxSlotInvocations: number; maxRouteEvaluations: number; maxBindingApplications: number; timeoutMsPerSlot: number }) {
    const requested = request.budget ?? {};
    this.limits = {
      maxSlotInvocations: Math.min(requested.maxSlotInvocations ?? contract.maxSlotInvocations, contract.maxSlotInvocations),
      maxRouteEvaluations: Math.min(requested.maxRouteEvaluations ?? contract.maxRouteEvaluations, contract.maxRouteEvaluations),
      maxBindingApplications: Math.min(requested.maxBindingApplications ?? contract.maxBindingApplications, contract.maxBindingApplications),
      timeoutMsPerSlot: Math.min(requested.timeoutMsPerSlot ?? contract.timeoutMsPerSlot, contract.timeoutMsPerSlot)
    };
  }
  consume(kind: keyof ScenarioBudgetUsage): void {
    const limitKey = kind === "slotInvocations" ? "maxSlotInvocations" : kind === "routeEvaluations" ? "maxRouteEvaluations" : "maxBindingApplications";
    if (this.usage[kind] >= this.limits[limitKey]) {
      throw new DemoOrchestratorEngineError(DEMO_ORCHESTRATOR_ENGINE_ERROR_CODES.BUDGET_EXHAUSTED, `Scenario ${kind} budget is exhausted.`);
    }
    this.usage[kind] += 1;
  }
}
