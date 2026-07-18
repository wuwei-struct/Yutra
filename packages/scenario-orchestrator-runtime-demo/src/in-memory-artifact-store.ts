import {
  canonicalSha256Schema,
  sha256BrowserSafe
} from "@yutra/scenario-orchestrator-runtime-contract";
import {
  DEMO_RUNTIME_ERROR_CODES,
  DemoRuntimeAdapterError
} from "./errors";
import type {
  InMemorySlotArtifactRecord,
  StoredSlotArtifactRecord
} from "./types";

const SLOT_ARTIFACT_PATH =
  /^slots\/([A-Za-z0-9][A-Za-z0-9_-]*)\/agent\.yutra\.yaml$/;

function normalizeArtifactPath(path: string): string {
  const normalized = path.replaceAll("\\", "/");
  if (
    normalized.includes("..") ||
    normalized.startsWith("/") ||
    !SLOT_ARTIFACT_PATH.test(normalized)
  ) {
    throw new DemoRuntimeAdapterError(
      DEMO_RUNTIME_ERROR_CODES.ARTIFACT_PATH_INVALID,
      "Agent artifact path must remain in a canonical Slot namespace."
    );
  }
  return normalized;
}

function cloneRecord(
  record: StoredSlotArtifactRecord
): StoredSlotArtifactRecord {
  return Object.freeze({ ...record });
}

export class InMemorySlotArtifactStore {
  private readonly records = new Map<string, StoredSlotArtifactRecord>();

  public register(input: InMemorySlotArtifactRecord): StoredSlotArtifactRecord {
    const artifactPath = normalizeArtifactPath(input.artifactPath);
    if (
      !canonicalSha256Schema.safeParse(input.artifactHash).success ||
      sha256BrowserSafe(input.artifactContent) !== input.artifactHash
    ) {
      throw new DemoRuntimeAdapterError(
        DEMO_RUNTIME_ERROR_CODES.ARTIFACT_HASH_MISMATCH,
        "Agent artifact hash does not match its canonical content."
      );
    }
    if (!canonicalSha256Schema.safeParse(input.configHash).success) {
      throw new DemoRuntimeAdapterError(
        DEMO_RUNTIME_ERROR_CODES.CONFIG_HASH_MISMATCH,
        "Slot config hash is not canonical."
      );
    }
    const record = cloneRecord({ ...input, artifactPath });
    const existing = this.records.get(artifactPath);
    if (
      existing &&
      (existing.artifactHash !== record.artifactHash ||
        existing.configHash !== record.configHash ||
        existing.artifactContent !== record.artifactContent)
    ) {
      throw new DemoRuntimeAdapterError(
        DEMO_RUNTIME_ERROR_CODES.ARTIFACT_HASH_MISMATCH,
        "A different Agent artifact is already registered for this Slot path."
      );
    }
    this.records.set(artifactPath, record);
    return cloneRecord(record);
  }

  public get(path: string): StoredSlotArtifactRecord | undefined {
    const record = this.records.get(normalizeArtifactPath(path));
    return record ? cloneRecord(record) : undefined;
  }

  public has(path: string): boolean {
    return this.records.has(normalizeArtifactPath(path));
  }

  public list(): StoredSlotArtifactRecord[] {
    return [...this.records.values()]
      .sort((left, right) => left.artifactPath.localeCompare(right.artifactPath))
      .map(cloneRecord);
  }

  public clear(): void {
    this.records.clear();
  }
}
