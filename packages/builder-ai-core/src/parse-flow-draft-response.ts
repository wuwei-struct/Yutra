import { aiDraftIssue, zodToAiDraftIssues } from "./errors";
import { flowDraftSchema } from "./flow-draft-schema";
import { AI_DRAFT_ERROR_CODES, type AiDraftIssue, type FlowDraft } from "./types";

export interface ParseFlowDraftResponseResult {
  ok: boolean;
  draft?: FlowDraft;
  issues: AiDraftIssue[];
  rawText: string;
}

function extractJsonCandidate(text: string): string {
  const trimmed = text.trim();
  const fenceMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (fenceMatch?.[1]) {
    return fenceMatch[1].trim();
  }
  return trimmed;
}

export function parseFlowDraftResponse(text: string): ParseFlowDraftResponseResult {
  const rawText = text;
  const candidate = extractJsonCandidate(text);
  if (!candidate) {
    return {
      ok: false,
      rawText,
      issues: [aiDraftIssue(AI_DRAFT_ERROR_CODES.PROVIDER_RESPONSE_EMPTY, "Provider response is empty.")]
    };
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(candidate);
  } catch {
    return {
      ok: false,
      rawText,
      issues: [aiDraftIssue(AI_DRAFT_ERROR_CODES.PARSE_FAILED, "Failed to parse provider response as JSON.")]
    };
  }

  const parsedDraft = flowDraftSchema.safeParse(parsedJson);
  if (!parsedDraft.success) {
    return {
      ok: false,
      rawText,
      issues: zodToAiDraftIssues(AI_DRAFT_ERROR_CODES.DRAFT_INVALID, parsedDraft.error)
    };
  }

  return {
    ok: true,
    rawText,
    draft: parsedDraft.data,
    issues: []
  };
}
