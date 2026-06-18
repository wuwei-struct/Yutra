import { createHash } from "node:crypto";
import type { ArtifactKind, CompiledArtifact } from "./artifacts";

export function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(stableValue);
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(value as Record<string, unknown>).sort()) {
      out[key] = stableValue((value as Record<string, unknown>)[key]);
    }
    return out;
  }
  return value;
}

export function stableJson(value: unknown): string {
  return `${JSON.stringify(stableValue(value), null, 2)}\n`;
}

function yamlScalar(value: unknown): string {
  if (typeof value === "string") {
    if (/^[A-Za-z0-9_.\/:-]+$/.test(value)) {
      return value;
    }
    return JSON.stringify(value);
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (value === null) {
    return "null";
  }
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
  if (value && typeof value === "object") {
    for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
      if (Array.isArray(raw)) {
        lines.push(`${pad}${key}:`);
        writeYaml(lines, raw, indent + 2);
      } else if (raw && typeof raw === "object") {
        lines.push(`${pad}${key}:`);
        writeYaml(lines, raw, indent + 2);
      } else {
        lines.push(`${pad}${key}: ${yamlScalar(raw)}`);
      }
    }
  }
}

export function stableYaml(value: Record<string, unknown>): string {
  const lines: string[] = [];
  writeYaml(lines, value, 0);
  return `${lines.join("\n")}\n`;
}

export function sha256(content: string): string {
  return `sha256:${createHash("sha256").update(content).digest("hex")}`;
}

export function createJsonArtifact<T extends Record<string, unknown>>(filename: string, kind: ArtifactKind, data: T): CompiledArtifact<T> {
  const content = stableJson(data);
  return {
    filename,
    kind,
    data,
    content,
    contentType: "application/json",
    hash: sha256(content)
  };
}

export function createYamlArtifact<T extends Record<string, unknown>>(filename: string, kind: ArtifactKind, data: T): CompiledArtifact<T> {
  const content = stableYaml(data);
  return {
    filename,
    kind,
    data,
    content,
    contentType: "text/yaml",
    hash: sha256(content)
  };
}

export function createYamlTextArtifact(filename: string, kind: ArtifactKind, data: Record<string, unknown>): CompiledArtifact<string> {
  const content = stableYaml(data);
  return {
    filename,
    kind,
    data: content,
    content,
    contentType: "text/yaml",
    hash: sha256(content)
  };
}
