import type { AgentTemplateConfig } from "@yutra/builder-core";
import type { AiDraftIssue, FlowDraft, NaturalLanguageBrief, TagSelection } from "./types";

export type DraftProviderMode = "mock" | "real";

export type LlmDraftProviderConfig = {
  provider: "generic-http" | "openai-compatible" | "custom";
  baseUrl?: string;
  apiKeyEnv?: string;
  model?: string;
  timeoutMs?: number;
  temperature?: number;
};

export type GenerateFlowDraftInput = {
  tags: TagSelection;
  brief: NaturalLanguageBrief;
  template: AgentTemplateConfig;
};

export type GenerateFlowDraftResult = {
  ok: boolean;
  draft?: FlowDraft;
  rawText?: string;
  issues: AiDraftIssue[];
  meta?: {
    provider: string;
    model?: string;
    promptChars?: number;
    responseChars?: number;
    parsed: boolean;
    validated: boolean;
  };
};

export interface FlowDraftProvider {
  generate(input: GenerateFlowDraftInput): Promise<GenerateFlowDraftResult>;
}
