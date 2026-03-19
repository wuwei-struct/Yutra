import { loadDslFile } from "./loader";
import { normalizeDsl } from "./normalize";
import type { LoadedAndValidatedDslFile } from "./types";
import { validateDsl } from "./validator";

export function loadAndValidateDslFile(path: string): LoadedAndValidatedDslFile {
  const loaded = loadDslFile(path);
  const spec = normalizeDsl(loaded.raw);
  const validation = validateDsl(spec);

  return {
    ...loaded,
    spec,
    validation
  };
}
