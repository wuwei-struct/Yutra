import { createHash } from "node:crypto";
import type { IdempotencyRecord, IdempotencyStore, RuntimeRunContext } from "./types";

export class InMemoryIdempotencyStore implements IdempotencyStore {
  private readonly records = new Map<string, IdempotencyRecord>();

  public has(key: string): boolean {
    return this.records.has(key);
  }

  public get(key: string): IdempotencyRecord | undefined {
    return this.records.get(key);
  }

  public set(record: IdempotencyRecord): void {
    this.records.set(record.key, record);
  }

  public list(): IdempotencyRecord[] {
    return [...this.records.values()];
  }
}

export interface BuildIdempotencyKeyArgs {
  actionName: string;
  stateName: string;
  ctx: RuntimeRunContext;
  explicitKey?: string;
}

export function buildIdempotencyKey(args: BuildIdempotencyKeyArgs): string {
  if (args.explicitKey && args.explicitKey.trim().length > 0) {
    return args.explicitKey.trim();
  }

  const fingerprintInput = JSON.stringify({
    action: args.actionName,
    state: args.stateName,
    text: args.ctx.input.text,
    intent: args.ctx.input.intent,
    context: args.ctx.input.context ?? {}
  });
  const fingerprint = createHash("sha1").update(fingerprintInput).digest("hex");
  return `${args.ctx.idempotencyScopeId}:${args.stateName}:${args.actionName}:${fingerprint}`;
}
