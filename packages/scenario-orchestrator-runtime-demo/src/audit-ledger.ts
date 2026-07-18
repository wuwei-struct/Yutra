import type { DemoAdapterAuditRecord } from "./types";

function clone(record: DemoAdapterAuditRecord): DemoAdapterAuditRecord {
  return structuredClone(record);
}

export class DemoAdapterAuditLedger {
  private readonly records = new Map<string, DemoAdapterAuditRecord>();

  public record(record: DemoAdapterAuditRecord): void {
    this.records.set(record.invocationId, clone(record));
  }

  public get(invocationId: string): DemoAdapterAuditRecord | undefined {
    const record = this.records.get(invocationId);
    return record ? clone(record) : undefined;
  }

  public list(): DemoAdapterAuditRecord[] {
    return [...this.records.values()]
      .sort((left, right) => left.invocationId.localeCompare(right.invocationId))
      .map(clone);
  }

  public clear(): void {
    this.records.clear();
  }
}
