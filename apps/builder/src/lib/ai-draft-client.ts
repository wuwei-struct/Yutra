import type { AiDraftPreviewRequest, AiDraftPreviewResponse } from "../types";
import { getBuilderRunnerBaseUrl } from "./runner-client";

export async function generateDraftPreview(request: AiDraftPreviewRequest): Promise<AiDraftPreviewResponse> {
  const url = `${getBuilderRunnerBaseUrl()}/ai-draft-preview`;
  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request)
    });
  } catch {
    throw new Error("Builder Runner is not running. Start it with pnpm builder:runner.");
  }

  let body: AiDraftPreviewResponse;
  try {
    body = (await response.json()) as AiDraftPreviewResponse;
  } catch {
    throw new Error("Builder Runner returned invalid AI draft JSON response.");
  }

  if (!response.ok && body?.error?.message) {
    throw new Error(body.error.message);
  }
  if (!response.ok) {
    throw new Error("AI draft preview request failed.");
  }
  return body;
}
