import type {
  ScenarioRunPreviewDemoCase,
  ScenarioRunPreviewResponse
} from "../types";
import { getBuilderRunnerBaseUrl } from "./runner-client";

export async function runScenarioPreview(
  compositionId: string,
  demoCase: ScenarioRunPreviewDemoCase
): Promise<ScenarioRunPreviewResponse> {
  let response: Response;
  try {
    response = await fetch(
      `${getBuilderRunnerBaseUrl()}/creator/scenario-runs/preview`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ compositionId, demoCase })
      }
    );
  } catch {
    throw new Error(
      "Builder Runner is not running. Start it with pnpm builder:runner."
    );
  }
  let body: ScenarioRunPreviewResponse;
  try {
    body = (await response.json()) as ScenarioRunPreviewResponse;
  } catch {
    throw new Error("Builder Runner returned invalid Scenario Run Preview JSON.");
  }
  if (!response.ok && !("error" in body)) {
    throw new Error("Scenario Run Preview request failed.");
  }
  return body;
}
