import { createHash } from "node:crypto";
import type { ConfigField } from "./provenance";
import type { PackConfig } from "./pack-config-schema";

function stable(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(stable);
  }

  if (value && typeof value === "object") {
    const input = value as Record<string, unknown>;
    const output: Record<string, unknown> = {};
    for (const key of Object.keys(input).sort()) {
      if (key === "updatedAt" || key === "updatedBy") {
        continue;
      }
      if (key === "metadata") {
        const metadata = input[key] as Record<string, unknown> | undefined;
        output[key] = stable(Object.fromEntries(Object.entries(metadata ?? {}).filter(([metaKey]) => metaKey !== "generatedAt")));
        continue;
      }
      output[key] = stable(input[key]);
    }
    return output;
  }

  return value;
}

export function createPackConfigFingerprint(config: PackConfig): string {
  const json = JSON.stringify(stable(config));
  return `sha256:${createHash("sha256").update(json).digest("hex")}`;
}

export function stripFieldVolatileMetadata<T>(field: ConfigField<T>): ConfigField<T> {
  const stableField = { ...field };
  delete stableField.updatedAt;
  delete stableField.updatedBy;
  return stableField;
}
