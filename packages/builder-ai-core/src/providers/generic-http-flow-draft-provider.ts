import { buildFlowDraftPrompt } from "../prompt-template";
import { parseFlowDraftResponse } from "../parse-flow-draft-response";
import { validateFlowDraft } from "../validate-flow-draft";
import { aiDraftIssue, zodToAiDraftIssues } from "../errors";
import { tagSelectionSchema } from "../tag-schema";
import { naturalLanguageBriefSchema } from "../brief-schema";
import {
  AI_DRAFT_ERROR_CODES,
  type FlowDraft,
  type NaturalLanguageBrief,
  type TagSelection
} from "../types";
import type { FlowDraftProvider, GenerateFlowDraftInput, GenerateFlowDraftResult, LlmDraftProviderConfig } from "../provider-types";
import type { AgentTemplateConfig } from "@yutra/builder-core";

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function resolveApiKey(config: LlmDraftProviderConfig): string | undefined {
  const keyName = asString(config.apiKeyEnv) ?? "YUTRA_BUILDER_AI_API_KEY";
  return asString(process.env[keyName]);
}

function parseTimeout(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return value;
  }
  const fromEnv = Number(process.env.YUTRA_BUILDER_AI_TIMEOUT_MS ?? "30000");
  return Number.isFinite(fromEnv) && fromEnv > 0 ? fromEnv : 30000;
}

function parseTemperature(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  return 0.2;
}

function resolveConfig(config: LlmDraftProviderConfig): { baseUrl: string; model: string; apiKey: string; timeoutMs: number; temperature: number } | null {
  const baseUrl = asString(config.baseUrl) ?? asString(process.env.YUTRA_BUILDER_AI_BASE_URL);
  const model = asString(config.model) ?? asString(process.env.YUTRA_BUILDER_AI_MODEL);
  const apiKey = resolveApiKey(config);
  const timeoutMs = parseTimeout(config.timeoutMs);
  const temperature = parseTemperature(config.temperature);
  if (!baseUrl || !model || !apiKey) {
    return null;
  }
  return { baseUrl, model, apiKey, timeoutMs, temperature };
}

export interface GenericHttpFlowDraftProviderRequest {
  model: string;
  temperature: number;
  messages: Array<{ role: string; content: string }>;
}

function extractResponseText(payload: unknown): string | undefined {
  const obj = payload as {
    output_text?: string;
    text?: string;
    content?: string;
    choices?: Array<{ message?: { content?: string }; text?: string }>;
  };
  if (asString(obj.output_text)) return obj.output_text;
  if (asString(obj.text)) return obj.text;
  if (asString(obj.content)) return obj.content;
  const choice = obj.choices?.[0];
  if (choice) {
    if (asString(choice.message?.content)) return choice.message?.content;
    if (asString(choice.text)) return choice.text;
  }
  return undefined;
}

export class GenericHttpFlowDraftProvider implements FlowDraftProvider {
  private readonly config: LlmDraftProviderConfig;

  public constructor(config: LlmDraftProviderConfig) {
    this.config = config;
  }

  public async generate(input: GenerateFlowDraftInput): Promise<GenerateFlowDraftResult> {
    const parsedTags = tagSelectionSchema.safeParse(input.tags);
    if (!parsedTags.success) {
      return {
        ok: false,
        issues: zodToAiDraftIssues(AI_DRAFT_ERROR_CODES.TAG_SELECTION_INVALID, parsedTags.error),
        meta: { provider: this.config.provider, model: this.config.model, parsed: false, validated: false }
      };
    }
    const parsedBrief = naturalLanguageBriefSchema.safeParse(input.brief);
    if (!parsedBrief.success) {
      return {
        ok: false,
        issues: zodToAiDraftIssues(AI_DRAFT_ERROR_CODES.BRIEF_INVALID, parsedBrief.error),
        meta: { provider: this.config.provider, model: this.config.model, parsed: false, validated: false }
      };
    }

    const resolved = resolveConfig(this.config);
    if (!resolved) {
      return {
        ok: false,
        issues: [aiDraftIssue(AI_DRAFT_ERROR_CODES.PROVIDER_CONFIG_MISSING, "Real provider config missing: baseUrl/model/apiKey.")],
        meta: {
          provider: this.config.provider,
          model: this.config.model,
          parsed: false,
          validated: false
        }
      };
    }

    const prompt = buildFlowDraftPrompt(input);
    const requestBody: GenericHttpFlowDraftProviderRequest = {
      model: resolved.model,
      temperature: resolved.temperature,
      messages: [
        { role: "system", content: "You must output only FlowDraft JSON." },
        { role: "user", content: prompt }
      ]
    };
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), resolved.timeoutMs);
    let rawText = "";
    try {
      const response = await fetch(resolved.baseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${resolved.apiKey}`
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });
      clearTimeout(timer);

      const payload = (await response.json()) as unknown;
      const content = extractResponseText(payload);
      if (!response.ok) {
        return {
          ok: false,
          issues: [
            aiDraftIssue(
              AI_DRAFT_ERROR_CODES.PROVIDER_REQUEST_FAILED,
              `Provider request failed with status ${response.status}.`
            )
          ],
          meta: {
            provider: this.config.provider,
            model: resolved.model,
            promptChars: prompt.length,
            parsed: false,
            validated: false
          }
        };
      }
      if (!content) {
        return {
          ok: false,
          issues: [aiDraftIssue(AI_DRAFT_ERROR_CODES.PROVIDER_RESPONSE_EMPTY, "Provider returned empty response content.")],
          meta: {
            provider: this.config.provider,
            model: resolved.model,
            promptChars: prompt.length,
            parsed: false,
            validated: false
          }
        };
      }

      rawText = content;
      const parsed = parseFlowDraftResponse(content);
      if (!parsed.ok || !parsed.draft) {
        return {
          ok: false,
          rawText: parsed.rawText,
          issues: parsed.issues,
          meta: {
            provider: this.config.provider,
            model: resolved.model,
            promptChars: prompt.length,
            responseChars: content.length,
            parsed: false,
            validated: false
          }
        };
      }

      const validation = validateFlowDraft(parsed.draft, input.template);
      if (!validation.ok) {
        return {
          ok: false,
          rawText: parsed.rawText,
          issues: validation.issues,
          meta: {
            provider: this.config.provider,
            model: resolved.model,
            promptChars: prompt.length,
            responseChars: content.length,
            parsed: true,
            validated: false
          }
        };
      }

      return {
        ok: true,
        draft: parsed.draft,
        rawText: parsed.rawText,
        issues: validation.issues,
        meta: {
          provider: this.config.provider,
          model: resolved.model,
          promptChars: prompt.length,
          responseChars: content.length,
          parsed: true,
          validated: true
        }
      };
    } catch (error) {
      clearTimeout(timer);
      const isAbort = error instanceof Error && error.name === "AbortError";
      return {
        ok: false,
        rawText,
        issues: [
          aiDraftIssue(
            isAbort ? AI_DRAFT_ERROR_CODES.PROVIDER_TIMEOUT : AI_DRAFT_ERROR_CODES.PROVIDER_REQUEST_FAILED,
            isAbort ? "Provider request timeout." : "Provider request failed."
          )
        ],
        meta: {
          provider: this.config.provider,
          model: resolved.model,
          promptChars: prompt.length,
          responseChars: rawText.length,
          parsed: false,
          validated: false
        }
      };
    }
  }
}

export function buildProviderInput(tags: TagSelection, brief: NaturalLanguageBrief, template: AgentTemplateConfig): GenerateFlowDraftInput {
  return { tags, brief, template };
}

export function withMockSource(draft: FlowDraft): FlowDraft {
  return {
    ...draft,
    source: {
      type: "mock",
      provider: draft.source.provider ?? "mockAiDraftProvider",
      model: draft.source.model
    }
  };
}
