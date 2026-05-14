import { ecommerceSupportTemplate } from "@yutra/builder-core";
import {
  AI_DRAFT_ERROR_CODES,
  createFlowDraftProvider,
  explainFlowDraft,
  flowDraftToBuilderFormConfig,
  validateFlowDraft
} from "@yutra/builder-ai-core";
import { sanitizeErrorMessage } from "./response-formatters";
import type { AiDraftPreviewRequest, AiDraftPreviewResponse } from "./types";

function envOrString(value: string | undefined, envName: string): string | undefined {
  return value?.trim() ? value.trim() : process.env[envName]?.trim();
}

function toNumber(value: number | undefined, envName: string): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  const raw = process.env[envName];
  if (!raw) return undefined;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function isRealProviderEnabled(): boolean {
  return (process.env.YUTRA_BUILDER_AI_PROVIDER ?? "mock").trim() === "real";
}

export async function buildAiDraftPreview(request: AiDraftPreviewRequest): Promise<AiDraftPreviewResponse> {
  const providerMode = request.providerMode ?? "mock";
  const provider = createFlowDraftProvider({
    mode: providerMode,
    realProviderEnabled: isRealProviderEnabled(),
    llmConfig: {
      provider: request.options?.provider ?? "generic-http",
      baseUrl: envOrString(request.options?.baseUrl, "YUTRA_BUILDER_AI_BASE_URL"),
      model: envOrString(request.options?.model, "YUTRA_BUILDER_AI_MODEL"),
      timeoutMs: toNumber(request.options?.timeoutMs, "YUTRA_BUILDER_AI_TIMEOUT_MS"),
      temperature: request.options?.temperature,
      apiKeyEnv: "YUTRA_BUILDER_AI_API_KEY"
    }
  });

  try {
    const generated = await provider.generate({
      tags: request.tags,
      brief: request.brief,
      template: ecommerceSupportTemplate
    });

    if (!generated.ok || !generated.draft) {
      const firstIssue = generated.issues[0];
      return {
        ok: false,
        error: {
          code: firstIssue?.code ?? AI_DRAFT_ERROR_CODES.PROVIDER_REQUEST_FAILED,
          message: firstIssue?.message ?? "Draft generation failed."
        },
        issues: generated.issues,
        meta: {
          providerMode,
          provider: generated.meta?.provider ?? "unknown",
          model: generated.meta?.model,
          parsed: generated.meta?.parsed ?? false,
          validated: generated.meta?.validated ?? false,
          promptChars: generated.meta?.promptChars,
          responseChars: generated.meta?.responseChars
        }
      };
    }

    const validation = validateFlowDraft(generated.draft, ecommerceSupportTemplate);
    if (!validation.ok) {
      return {
        ok: false,
        error: {
          code: validation.issues[0]?.code ?? AI_DRAFT_ERROR_CODES.DRAFT_INVALID,
          message: validation.issues[0]?.message ?? "FlowDraft validation failed."
        },
        issues: validation.issues,
        meta: {
          providerMode,
          provider: generated.meta?.provider ?? "unknown",
          model: generated.meta?.model,
          parsed: generated.meta?.parsed ?? true,
          validated: false,
          promptChars: generated.meta?.promptChars,
          responseChars: generated.meta?.responseChars
        }
      };
    }

    const explanation = explainFlowDraft(generated.draft);
    const draftForm = flowDraftToBuilderFormConfig(generated.draft, ecommerceSupportTemplate);
    return {
      ok: true,
      draft: generated.draft,
      explanation,
      validation,
      draftForm,
      issues: generated.issues,
      meta: {
        providerMode,
        provider: generated.meta?.provider ?? "unknown",
        model: generated.meta?.model,
        parsed: generated.meta?.parsed ?? true,
        validated: true,
        promptChars: generated.meta?.promptChars,
        responseChars: generated.meta?.responseChars
      }
    };
  } catch (error) {
    return {
      ok: false,
      error: {
        code: AI_DRAFT_ERROR_CODES.PROVIDER_REQUEST_FAILED,
        message: sanitizeErrorMessage(error instanceof Error ? error.message : "Draft generation failed.")
      },
      issues: [],
      meta: {
        providerMode,
        provider: request.options?.provider ?? "generic-http",
        model: request.options?.model,
        parsed: false,
        validated: false
      }
    };
  }
}

