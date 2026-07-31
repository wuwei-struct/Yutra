import { scenarioRunEvidenceBundleSchema } from "./evidence-schema";
import { createScenarioEvidenceHash } from "./evidence-hash";
import { SCENARIO_EVIDENCE_ERROR_CODES, ScenarioEvidenceError } from "./errors";
import type { ScenarioRunEvidenceBundle, ScenarioRunEvidenceDraft } from "./types";
import { validateScenarioEvidenceBundle } from "./validate-evidence-bundle";

const EMPTY_HASH = `sha256:${"0".repeat(64)}`;

export function createScenarioRunEvidenceBundle(
  input: ScenarioRunEvidenceDraft
): ScenarioRunEvidenceBundle {
  const parsed = scenarioRunEvidenceBundleSchema.safeParse({
    ...structuredClone(input),
    evidenceHash: EMPTY_HASH
  });
  if (!parsed.success) {
    throw new ScenarioEvidenceError(
      SCENARIO_EVIDENCE_ERROR_CODES.CREATION_FAILED,
      "Scenario evidence source data does not satisfy the strict public contract."
    );
  }
  const bundle: ScenarioRunEvidenceBundle = {
    ...parsed.data,
    evidenceHash: createScenarioEvidenceHash(parsed.data)
  };
  const integrity = validateScenarioEvidenceBundle(bundle);
  if (!integrity.valid) {
    throw new ScenarioEvidenceError(
      integrity.blockers[0]?.code ?? SCENARIO_EVIDENCE_ERROR_CODES.CREATION_FAILED,
      integrity.blockers[0]?.message ?? "Scenario evidence integrity validation failed."
    );
  }
  return structuredClone(bundle);
}
