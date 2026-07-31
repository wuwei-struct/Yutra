import { sha256BrowserSafe } from "@yutra/scenario-orchestrator-runtime-contract";
import type { ScenarioRunEvidenceBundle } from "./types";

function canonicalValue(value: unknown, seen: WeakSet<object>): unknown {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "boolean"
  ) {
    return value;
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error("Evidence contains a non-finite number.");
    return value;
  }
  if (
    value === undefined ||
    typeof value === "function" ||
    typeof value === "symbol" ||
    typeof value === "bigint" ||
    value instanceof Date
  ) {
    throw new Error("Evidence is not canonical JSON.");
  }
  if (seen.has(value)) throw new Error("Evidence contains a cycle.");
  seen.add(value);
  if (Array.isArray(value)) {
    const result = value.map((item) => canonicalValue(item, seen));
    seen.delete(value);
    return result;
  }
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(value as Record<string, unknown>).sort()) {
    if (key === "localPath" || key === "uiState") continue;
    result[key] = canonicalValue((value as Record<string, unknown>)[key], seen);
  }
  seen.delete(value);
  return result;
}

export function canonicalScenarioEvidence(value: unknown): string {
  return JSON.stringify(canonicalValue(value, new WeakSet<object>()));
}

export function createScenarioEvidenceHash(
  bundle: Omit<ScenarioRunEvidenceBundle, "evidenceHash"> | ScenarioRunEvidenceBundle
): string {
  const payload: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(bundle)) {
    if (key !== "evidenceHash") payload[key] = value;
  }
  return sha256BrowserSafe(canonicalScenarioEvidence(payload));
}
