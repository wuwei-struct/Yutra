import { readFileSync } from "node:fs";
import { extname } from "node:path";
import { DslError } from "./errors";
import { parseDsl } from "./parser";
import type { DslFormat, LoadedDslFile } from "./types";

function detectDslFormat(path: string): DslFormat {
  if (path.endsWith(".yutra.yaml")) {
    return "yaml";
  }

  if (path.endsWith(".yutra.json")) {
    return "json";
  }

  throw new DslError({
    code: "DSL_UNSUPPORTED_EXTENSION",
    message: `Unsupported DSL extension: ${extname(path) || path}`,
    severity: "error",
    hint: "Use .yutra.yaml or .yutra.json"
  });
}

export function loadDslFile(path: string): LoadedDslFile {
  const format = detectDslFormat(path);
  const source = readFileSync(path, "utf8");
  const raw = parseDsl(source, format);

  return {
    path,
    format,
    source,
    raw
  };
}
