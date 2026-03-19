import type { StateSpec } from "@yutra/spec";
import { evaluateExpression } from "./expression";
import type { GuardEvaluator } from "./guard-evaluator";
import type { GuardEvaluationResult, ResolvedTransition, TransitionResolutionResult } from "./types";

export class TransitionResolver {
  private readonly guardEvaluator: GuardEvaluator;

  public constructor(guardEvaluator: GuardEvaluator) {
    this.guardEvaluator = guardEvaluator;
  }

  public async resolveNextTransition(
    stateName: string,
    state: StateSpec,
    ctx: Record<string, unknown>
  ): Promise<TransitionResolutionResult> {
    const transitions = state.transitions ?? [];
    const guardEvaluations: GuardEvaluationResult[] = [];

    for (const transition of transitions) {
      if (transition.guard) {
        const guardResult = await this.guardEvaluator.evaluateGuard(transition.guard, ctx);
        guardEvaluations.push(guardResult);
        if (!guardResult.passed) {
          continue;
        }
      }

      if (transition.when) {
        const whenResult = evaluateExpression(transition.when, ctx);
        if (!whenResult.ok || !whenResult.value) {
          continue;
        }
      }

      const resolved: ResolvedTransition = {
        from: stateName,
        to: transition.to,
        guard: transition.guard,
        when: transition.when,
        description: transition.description
      };

      return {
        transition: resolved,
        guardEvaluations
      };
    }

    return {
      transition: null,
      reason: "No transition matched.",
      guardEvaluations
    };
  }
}
