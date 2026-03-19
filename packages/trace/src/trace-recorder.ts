import type { TraceEvent } from "@yutra/spec";
import type { TraceStorage } from "./types";

export class TraceRecorder {
  public readonly storage: TraceStorage;
  private readonly buffer: TraceEvent[] = [];
  private isClosed = false;

  public constructor(storage: TraceStorage) {
    this.storage = storage;
  }

  public async append(event: TraceEvent): Promise<void> {
    if (this.isClosed) {
      throw new Error("TraceRecorder is closed.");
    }

    this.buffer.push(event);
    await this.flush();
  }

  public async appendMany(events: TraceEvent[]): Promise<void> {
    if (this.isClosed) {
      throw new Error("TraceRecorder is closed.");
    }

    this.buffer.push(...events);
    await this.flush();
  }

  public async flush(): Promise<void> {
    while (this.buffer.length > 0) {
      const next = this.buffer.shift();
      if (!next) {
        continue;
      }
      await this.storage.append(next);
    }
  }

  public async close(): Promise<void> {
    if (this.isClosed) {
      return;
    }

    await this.flush();
    this.isClosed = true;
  }
}
