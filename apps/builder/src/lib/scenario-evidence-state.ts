import { useCallback, useEffect, useState } from "react";
import {
  replayScenarioEvidence,
  type ScenarioEvidenceReplayResult,
  type ScenarioRunEvidenceBundle
} from "@yutra/scenario-run-evidence-core";

export type ScenarioEvidenceReplayStatus =
  | "idle"
  | "replaying"
  | "success"
  | "error";

export function useScenarioEvidenceState(
  evidenceBundle: ScenarioRunEvidenceBundle | undefined
) {
  const [status, setStatus] = useState<ScenarioEvidenceReplayStatus>("idle");
  const [result, setResult] = useState<ScenarioEvidenceReplayResult>();

  useEffect(() => {
    setStatus("idle");
    setResult(undefined);
  }, [evidenceBundle]);

  const replay = useCallback(() => {
    if (!evidenceBundle) return;
    setStatus("replaying");
    const next = replayScenarioEvidence(evidenceBundle);
    setResult(next);
    setStatus(next.valid ? "success" : "error");
  }, [evidenceBundle]);

  return { status, result, replay };
}
