import type { OrchestratorTraceEvent } from "./types";

export class OrchestratorTraceLedger {
  readonly #events = new Map<string, OrchestratorTraceEvent[]>();
  emit(base: Omit<OrchestratorTraceEvent, "sequence" | "type" | "details">, type: string, details: OrchestratorTraceEvent["details"] = {}): OrchestratorTraceEvent {
    const events = this.#events.get(base.orchestratorRunId) ?? [];
    const event = { ...base, sequence: events.length + 1, type, details: Object.freeze({ ...details }) };
    events.push(event);
    this.#events.set(base.orchestratorRunId, events);
    return structuredClone(event);
  }
  list(runId: string): OrchestratorTraceEvent[] { return structuredClone(this.#events.get(runId) ?? []); }
}
