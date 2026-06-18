import type { BuilderDslInspectResponse, BuilderRunPreviewRequest, BuilderRunPreviewResponse } from "../types";

const DEFAULT_RUNNER_URL = "http://127.0.0.1:8788";

export function getBuilderRunnerBaseUrl(): string {
  const envUrl = import.meta.env.VITE_YUTRA_BUILDER_RUNNER_URL as string | undefined;
  return envUrl?.trim() ? envUrl.trim() : DEFAULT_RUNNER_URL;
}

export async function runPreview(request: BuilderRunPreviewRequest): Promise<BuilderRunPreviewResponse> {
  const url = `${getBuilderRunnerBaseUrl()}/run-preview`;
  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(request)
    });
  } catch {
    throw new Error("Builder Runner is not running. Start it with pnpm builder:runner.");
  }

  let body: BuilderRunPreviewResponse;
  try {
    body = (await response.json()) as BuilderRunPreviewResponse;
  } catch {
    throw new Error("Builder Runner returned invalid JSON response.");
  }

  if (!response.ok && body?.error?.message) {
    throw new Error(body.error.message);
  }
  if (!response.ok) {
    throw new Error("Run preview request failed.");
  }
  return body;
}

export async function inspectDsl(dslText: string, format: "yaml" | "json" = "yaml"): Promise<BuilderDslInspectResponse> {
  const url = `${getBuilderRunnerBaseUrl()}/dsl/inspect`;
  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ dslText, format })
    });
  } catch {
    throw new Error("Builder Runner is not running. Start it with pnpm builder:runner.");
  }

  let body: BuilderDslInspectResponse;
  try {
    body = (await response.json()) as BuilderDslInspectResponse;
  } catch {
    throw new Error("Builder Runner returned invalid JSON response.");
  }

  if (!response.ok && body?.error?.message) {
    return body;
  }
  if (!response.ok) {
    throw new Error("DSL inspect request failed.");
  }
  return body;
}
