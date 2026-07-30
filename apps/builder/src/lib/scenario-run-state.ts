import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  ScenarioRunPreviewDemoCase,
  ScenarioRunPreviewResult
} from "../types";
import { runScenarioPreview } from "./scenario-run-client";

export type ScenarioRunStatus = "idle" | "running" | "success" | "error";

export const SCENARIO_RUN_CASES = Object.freeze({
  "customer-complaint-composition-demo": [
    "complaint_policy",
    "complaint_compensation",
    "complaint_handoff",
    "overlay_deny"
  ],
  "ecommerce-refund-composition-demo": ["refund_authorization"]
} satisfies Record<string, ScenarioRunPreviewDemoCase[]>);

function defaultCase(compositionId: string): ScenarioRunPreviewDemoCase {
  return compositionId === "ecommerce-refund-composition-demo"
    ? "refund_authorization"
    : "complaint_policy";
}

export function useScenarioRunState(
  selectedCompositionId: string,
  orchestratorReady: boolean
) {
  const [status, setStatus] = useState<ScenarioRunStatus>("idle");
  const [demoCase, setDemoCase] = useState<ScenarioRunPreviewDemoCase>(
    defaultCase(selectedCompositionId)
  );
  const [result, setResult] = useState<ScenarioRunPreviewResult>();
  const [errorCode, setErrorCode] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const availableCases = useMemo(
    () => SCENARIO_RUN_CASES[selectedCompositionId] ?? [],
    [selectedCompositionId]
  );

  const clearResult = useCallback(() => {
    setStatus("idle");
    setResult(undefined);
    setErrorCode("");
    setErrorMessage("");
  }, []);

  useEffect(() => {
    setDemoCase(defaultCase(selectedCompositionId));
    clearResult();
  }, [clearResult, selectedCompositionId]);

  useEffect(() => {
    if (!orchestratorReady) clearResult();
  }, [clearResult, orchestratorReady]);

  const selectDemoCase = useCallback(
    (nextCase: ScenarioRunPreviewDemoCase) => {
      if (!availableCases.includes(nextCase)) return;
      setDemoCase(nextCase);
      clearResult();
    },
    [availableCases, clearResult]
  );

  const runPreview = useCallback(async () => {
    if (!orchestratorReady || !availableCases.includes(demoCase)) return;
    setStatus("running");
    setResult(undefined);
    setErrorCode("");
    setErrorMessage("");
    try {
      const response = await runScenarioPreview(
        selectedCompositionId,
        demoCase
      );
      if (response.ok) {
        setResult(response.result);
        setStatus("success");
      } else {
        setErrorCode(response.error.code);
        setErrorMessage(response.error.message);
        setStatus("error");
      }
    } catch (error) {
      setErrorCode("SCENARIO_RUN_CLIENT_ERROR");
      setErrorMessage(
        error instanceof Error ? error.message : "Scenario Run Preview failed."
      );
      setStatus("error");
    }
  }, [
    availableCases,
    demoCase,
    orchestratorReady,
    selectedCompositionId
  ]);

  return {
    status,
    demoCase,
    availableCases,
    result,
    errorCode,
    errorMessage,
    selectDemoCase,
    runPreview
  };
}
