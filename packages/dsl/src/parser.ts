import { parse as parseYaml } from "yaml";
import { DslError } from "./errors";
import type { DslFormat } from "./types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseDsl(source: string, format: DslFormat): Record<string, unknown> {
  try {
    const parsed = format === "json" ? JSON.parse(source) : parseYaml(source);

    if (!isRecord(parsed)) {
      throw new DslError({
        code: "DSL_SCHEMA_INVALID",
        message: "Parsed DSL must be an object.",
        severity: "error"
      });
    }

    return parsed;
  } catch (error) {
    if (error instanceof DslError) {
      throw error;
    }

    throw new DslError({
      code: "DSL_PARSE_ERROR",
      message: `Failed to parse ${format.toUpperCase()} DSL source: ${(error as Error).message}`,
      severity: "error"
    });
  }
}
