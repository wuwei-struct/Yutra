import { createCompositionArtifactHash } from "@yutra/scenario-composition-compiler";
import type { ScenarioOrchestratorDocument } from "@yutra/scenario-orchestrator-core";

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value as Record<string, unknown>)
        .sort()
        .map((key) => [
          key,
          stableValue((value as Record<string, unknown>)[key])
        ])
    );
  }
  return value;
}

export function canonicalJson(value: unknown): string {
  return `${JSON.stringify(stableValue(value), null, 2)}\n`;
}

function yamlScalar(value: unknown): string {
  if (typeof value === "string") {
    return /^[A-Za-z0-9_.$/:-]+$/.test(value)
      ? value
      : JSON.stringify(value);
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (value === null) return "null";
  return JSON.stringify(value);
}

function writeYaml(lines: string[], value: unknown, indent = 0): void {
  const pad = " ".repeat(indent);
  if (Array.isArray(value)) {
    for (const item of value) {
      if (item && typeof item === "object") {
        lines.push(`${pad}-`);
        writeYaml(lines, item, indent + 2);
      } else {
        lines.push(`${pad}- ${yamlScalar(item)}`);
      }
    }
    return;
  }
  if (!value || typeof value !== "object") return;
  for (const [key, nested] of Object.entries(
    value as Record<string, unknown>
  )) {
    if (nested && typeof nested === "object") {
      lines.push(`${pad}${key}:`);
      writeYaml(lines, nested, indent + 2);
    } else {
      lines.push(`${pad}${key}: ${yamlScalar(nested)}`);
    }
  }
}

export function canonicalYaml(value: Record<string, unknown>): string {
  const lines = [
    "# This is a preview-only scenario orchestrator contract. It is not executable by the current Yutra Runtime.",
    "# 这是仅用于预览和检查的场景编排合同，当前不能由 Yutra Runtime 执行。"
  ];
  writeYaml(lines, value);
  return `${lines.join("\n")}\n`;
}

export function artifactHash(content: string): string {
  return createCompositionArtifactHash(content);
}

export function createOrchestratorHash(
  document: ScenarioOrchestratorDocument
): string {
  const clone = structuredClone(document);
  const provenanceWithoutOrchestratorHash = {
    ...clone.provenance
  } as Record<string, unknown>;
  delete provenanceWithoutOrchestratorHash.orchestratorHash;
  return artifactHash(
    canonicalJson({
      ...clone,
      provenance: provenanceWithoutOrchestratorHash
    })
  );
}

export function createPreviewBundleHash(input: {
  compositionBundleHash: string;
  orchestratorHash: string;
  artifactHashesWithoutReport: Record<string, string>;
}): string {
  return artifactHash(canonicalJson(input));
}
