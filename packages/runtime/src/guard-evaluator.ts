import type { AgentSpec, StateSpec } from "@yutra/spec";
import { evaluateExpression } from "./expression";
import type { GuardEvaluationResult } from "./types";

export class GuardEvaluator {
  private readonly guardMap: Map<string, { expression?: string }>;

  public constructor(spec: AgentSpec) {
    this.guardMap = new Map((spec.guards ?? []).map((guard) => [guard.name, { expression: guard.expression }]));
  }

  public async evaluateGuard(
    guardName: string,
    ctx: Record<string, unknown>
  ): Promise<GuardEvaluationResult> {
    const guard = this.guardMap.get(guardName);
    if (!guard) {
      return {
        guardName,
        passed: false,
        reason: `Unknown guard '${guardName}'.`
      };
    }

    if (!guard.expression) {
      return {
        guardName,
        passed: true,
        expression: guard.expression
      };
    }

    const evaluated = evaluateExpression(guard.expression, ctx);
    return {
      guardName,
      passed: evaluated.ok && evaluated.value,
      expression: guard.expression,
      reason: evaluated.ok ? undefined : evaluated.reason
    };
  }

  public async evaluateStateGuards(
    state: StateSpec,
    ctx: Record<string, unknown>
  ): Promise<GuardEvaluationResult[]> {
    const guardNames = state.guards ?? [];
    const results: GuardEvaluationResult[] = [];

    for (const guardName of guardNames) {
      results.push(await this.evaluateGuard(guardName, ctx));
    }

    return results;
  }
}
