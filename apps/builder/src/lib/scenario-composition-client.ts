import type {
  ScenarioCompositionCatalogItem,
  ScenarioCompositionCompilePreviewResponse,
  ScenarioCompositionDetailResponse
} from "../types";
import { getBuilderRunnerBaseUrl } from "./runner-client";

async function readJson<T>(response: Response, fallbackMessage: string): Promise<T> {
  try {
    return (await response.json()) as T;
  } catch {
    throw new Error(fallbackMessage);
  }
}

async function request(url: string, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(url, init);
  } catch {
    throw new Error("Builder Runner is not running. Start it with pnpm builder:runner.");
  }
}

export async function fetchScenarioCompositionCatalog(): Promise<ScenarioCompositionCatalogItem[]> {
  const response = await request(`${getBuilderRunnerBaseUrl()}/creator/scenario-compositions`);
  const body = await readJson<{ compositions?: ScenarioCompositionCatalogItem[] }>(
    response,
    "Builder Runner returned invalid Scenario Composition catalog JSON."
  );
  if (!response.ok || !Array.isArray(body.compositions)) {
    throw new Error("Scenario Composition catalog request failed.");
  }
  return body.compositions;
}

export async function fetchScenarioCompositionDetail(
  compositionId: string
): Promise<ScenarioCompositionDetailResponse> {
  const response = await request(
    `${getBuilderRunnerBaseUrl()}/creator/scenario-compositions/${encodeURIComponent(compositionId)}`
  );
  const body = await readJson<ScenarioCompositionDetailResponse & { error?: { message?: string } }>(
    response,
    "Builder Runner returned invalid Scenario Composition detail JSON."
  );
  if (!response.ok) {
    throw new Error(body.error?.message ?? "Scenario Composition detail request failed.");
  }
  return body;
}

export async function compileScenarioCompositionPreview(
  compositionId: string
): Promise<ScenarioCompositionCompilePreviewResponse> {
  const response = await request(
    `${getBuilderRunnerBaseUrl()}/creator/scenario-compositions/compile-preview`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ compositionId })
    }
  );
  const body = await readJson<ScenarioCompositionCompilePreviewResponse>(
    response,
    "Builder Runner returned invalid Scenario Composition Compile Preview JSON."
  );
  if (!response.ok && !("error" in body)) {
    throw new Error("Scenario Composition Compile Preview request failed.");
  }
  return body;
}
