import type { OrchestratorAuditSummary } from "./types";

export class OrchestratorAuditLedger {
  readonly #records = new Map<string, OrchestratorAuditSummary>();
  record(summary: OrchestratorAuditSummary): void { this.#records.set(summary.orchestratorRunId, structuredClone(summary)); }
  get(runId: string): OrchestratorAuditSummary | undefined {
    const value = this.#records.get(runId);
    return value ? structuredClone(value) : undefined;
  }
}
