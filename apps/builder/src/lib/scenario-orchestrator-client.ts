import type { ScenarioOrchestratorCompilePreviewResponse } from "../types";
import { getBuilderRunnerBaseUrl } from "./runner-client";

export async function compileScenarioOrchestratorPreview(
  compositionId: string
): Promise<ScenarioOrchestratorCompilePreviewResponse> {
  let response: Response;
  try {
    response = await fetch(
      `${getBuilderRunnerBaseUrl()}/creator/scenario-orchestrators/compile-preview`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ compositionId })
      }
    );
  } catch {
    throw new Error("Builder Runner is not running. Start it with pnpm builder:runner.");
  }

  let body: ScenarioOrchestratorCompilePreviewResponse;
  try {
    body = (await response.json()) as ScenarioOrchestratorCompilePreviewResponse;
  } catch {
    throw new Error("Builder Runner returned invalid Scenario Orchestrator Preview JSON.");
  }
  if (!response.ok && !("error" in body)) {
    throw new Error("Scenario Orchestrator Compile Preview request failed.");
  }
  return body;
}
