import { loadDslFile } from "./loader";
import { normalizeDslWithDetails } from "./normalize";
import type { LoadedAndValidatedDslFile } from "./types";
import { validateDsl } from "./validator";

export function loadAndValidateDslFile(path: string): LoadedAndValidatedDslFile {
  const loaded = loadDslFile(path);
  const normalized = normalizeDslWithDetails(loaded.raw);
  const spec = normalized.spec;
  const validation = validateDsl(spec);
  validation.warnings = [...normalized.issues, ...validation.warnings];

  return {
    ...loaded,
    spec,
    validation
  };
}
