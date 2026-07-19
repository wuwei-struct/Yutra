import { DEMO_ORCHESTRATOR_ENGINE_ERROR_CODES, DemoOrchestratorEngineError } from "./errors";

export type ScenarioCallFrame = {
  callerSlotId: string;
  calleeSlotId: string;
  invokedByRouteId: string;
  returnToSlotId: string;
  invocationIndex: number;
};

export class ScenarioCallStack {
  readonly #frames: ScenarioCallFrame[] = [];
  push(frame: ScenarioCallFrame): void {
    if (this.#frames.length >= 1) {
      throw new DemoOrchestratorEngineError(DEMO_ORCHESTRATOR_ENGINE_ERROR_CODES.CALL_DEPTH_EXCEEDED, "Scenario call depth exceeds the demo contract.");
    }
    this.#frames.push(structuredClone(frame));
  }
  pop(): ScenarioCallFrame {
    const frame = this.#frames.pop();
    if (!frame) throw new DemoOrchestratorEngineError(DEMO_ORCHESTRATOR_ENGINE_ERROR_CODES.RESUME_WITHOUT_CALLER, "Supporting Slot has no caller to resume.");
    return frame;
  }
  peek(): ScenarioCallFrame | undefined {
    return this.#frames[0] ? structuredClone(this.#frames[0]) : undefined;
  }
  get depth(): number { return this.#frames.length; }
}
