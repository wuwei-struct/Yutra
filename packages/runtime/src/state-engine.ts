import type { AgentSpec } from "@yutra/spec";
import { createRuntimeError } from "./errors";
import type { RuntimeError } from "./types";

export class StateEngine {
  private readonly spec: AgentSpec;
  private readonly maxSteps: number;
  private _steps = 0;
  private readonly _visitedStates: string[] = [];

  public constructor(spec: AgentSpec, maxSteps: number) {
    this.spec = spec;
    this.maxSteps = maxSteps;
  }

  public enterState(stateName: string): RuntimeError | null {
    if (!this.spec.states[stateName]) {
      return createRuntimeError("RUNTIME_STATE_NOT_FOUND", `State '${stateName}' not found.`, {
        state: stateName
      });
    }

    this._steps += 1;
    this._visitedStates.push(stateName);
    return null;
  }

  public canContinue(): boolean {
    return this._steps < this.maxSteps;
  }

  public get steps(): number {
    return this._steps;
  }

  public get visitedStates(): string[] {
    return this._visitedStates;
  }
}
