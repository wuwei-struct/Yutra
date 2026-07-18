import type { SlotTraceParentBindingRecord } from "./types";

function clone(
  record: SlotTraceParentBindingRecord
): SlotTraceParentBindingRecord {
  return structuredClone(record);
}

export class SlotTraceParentLedger {
  private readonly records = new Map<string, SlotTraceParentBindingRecord>();

  public bind(record: SlotTraceParentBindingRecord): void {
    this.records.set(record.invocationId, clone(record));
  }

  public get(invocationId: string): SlotTraceParentBindingRecord | undefined {
    const record = this.records.get(invocationId);
    return record ? clone(record) : undefined;
  }

  public list(): SlotTraceParentBindingRecord[] {
    return [...this.records.values()]
      .sort((left, right) => left.invocationIndex - right.invocationIndex)
      .map(clone);
  }

  public clear(): void {
    this.records.clear();
  }
}
