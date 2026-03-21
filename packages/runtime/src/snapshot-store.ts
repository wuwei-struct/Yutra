import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import type { RuntimeSnapshot, SnapshotStore } from "./types";

export class InMemorySnapshotStore implements SnapshotStore {
  private readonly snapshots = new Map<string, RuntimeSnapshot>();

  public save(snapshot: RuntimeSnapshot): void {
    this.snapshots.set(snapshot.snapshotId, snapshot);
  }

  public load(snapshotId: string): RuntimeSnapshot | undefined {
    return this.snapshots.get(snapshotId);
  }

  public latestByRun(runId: string): RuntimeSnapshot | undefined {
    const candidates = [...this.snapshots.values()]
      .filter((snapshot) => snapshot.runId === runId)
      .sort((a, b) => (a.ts < b.ts ? 1 : -1));
    return candidates[0];
  }

  public list(runId?: string): RuntimeSnapshot[] {
    const all = [...this.snapshots.values()].sort((a, b) => (a.ts > b.ts ? 1 : -1));
    if (!runId) {
      return all;
    }
    return all.filter((snapshot) => snapshot.runId === runId);
  }
}

export class JsonFileSnapshotStore implements SnapshotStore {
  private readonly filePath: string;

  public constructor(filePath: string) {
    this.filePath = filePath;
  }

  public save(snapshot: RuntimeSnapshot): void {
    const current = this.readAll();
    const next = [...current.filter((item) => item.snapshotId !== snapshot.snapshotId), snapshot];
    this.writeAll(next);
  }

  public load(snapshotId: string): RuntimeSnapshot | undefined {
    return this.readAll().find((snapshot) => snapshot.snapshotId === snapshotId);
  }

  public latestByRun(runId: string): RuntimeSnapshot | undefined {
    return this.list(runId)[0];
  }

  public list(runId?: string): RuntimeSnapshot[] {
    const all = this.readAll().sort((a, b) => (a.ts > b.ts ? -1 : 1));
    if (!runId) {
      return all;
    }
    return all.filter((snapshot) => snapshot.runId === runId);
  }

  private readAll(): RuntimeSnapshot[] {
    if (!existsSync(this.filePath)) {
      return [];
    }
    const raw = readFileSync(this.filePath, "utf8");
    if (!raw.trim()) {
      return [];
    }
    return JSON.parse(raw) as RuntimeSnapshot[];
  }

  private writeAll(snapshots: RuntimeSnapshot[]): void {
    const parentDir = dirname(this.filePath);
    if (!existsSync(parentDir)) {
      mkdirSync(parentDir, { recursive: true });
    }
    writeFileSync(this.filePath, JSON.stringify(snapshots, null, 2), "utf8");
  }
}
