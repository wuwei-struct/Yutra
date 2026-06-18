import type { CreatorCompilePreviewRequest, CreatorCompilePreviewResponse } from "../types";
import { getBuilderRunnerBaseUrl } from "./runner-client";

export async function compileCreatorPreview(request: CreatorCompilePreviewRequest): Promise<CreatorCompilePreviewResponse> {
  const url = `${getBuilderRunnerBaseUrl()}/creator/compile-preview`;
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

  let body: CreatorCompilePreviewResponse;
  try {
    body = (await response.json()) as CreatorCompilePreviewResponse;
  } catch {
    throw new Error("Builder Runner returned invalid JSON response.");
  }

  if (!response.ok && body?.error?.message) {
    return body;
  }
  if (!response.ok) {
    throw new Error("Creator compile preview request failed.");
  }
  return body;
}
