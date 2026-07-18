import { useCallback, useEffect, useState } from "react";
import type { ScenarioOrchestratorCompileResult } from "../types";
import { compileScenarioOrchestratorPreview } from "./scenario-orchestrator-client";

export type ScenarioOrchestratorStatus =
  | "idle"
  | "compiling"
  | "success"
  | "error";

export function useScenarioOrchestratorState(selectedCompositionId: string) {
  const [status, setStatus] = useState<ScenarioOrchestratorStatus>("idle");
  const [result, setResult] = useState<ScenarioOrchestratorCompileResult>();
  const [selectedArtifact, setSelectedArtifact] = useState(
    "scenario.orchestrator.yaml"
  );
  const [selectedProfileSection, setSelectedProfileSection] =
    useState("slots");
  const [errorCode, setErrorCode] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    setStatus("idle");
    setResult(undefined);
    setSelectedArtifact("scenario.orchestrator.yaml");
    setSelectedProfileSection("slots");
    setErrorCode("");
    setErrorMessage("");
  }, [selectedCompositionId]);

  const compilePreview = useCallback(async () => {
    if (!selectedCompositionId) return;
    setStatus("compiling");
    setResult(undefined);
    setErrorCode("");
    setErrorMessage("");
    try {
      const response = await compileScenarioOrchestratorPreview(
        selectedCompositionId
      );
      if (response.ok) {
        setResult(response.result);
        setSelectedArtifact("scenario.orchestrator.yaml");
        setSelectedProfileSection("slots");
        setStatus("success");
      } else {
        setErrorCode(response.error.code);
        setErrorMessage(response.error.message);
        setStatus("error");
      }
    } catch (error) {
      setErrorCode("SCENARIO_ORCHESTRATOR_CLIENT_ERROR");
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Scenario Orchestrator Compile Preview failed."
      );
      setStatus("error");
    }
  }, [selectedCompositionId]);

  return {
    status,
    selectedCompositionId,
    result,
    selectedArtifact,
    selectedProfileSection,
    errorCode,
    errorMessage,
    setSelectedArtifact,
    setSelectedProfileSection,
    compilePreview
  };
}
