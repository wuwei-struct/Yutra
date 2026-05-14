import { BuilderAiCoreError, aiDraftIssue } from "./errors";
import { mockAiDraftProvider } from "./mock-draft-provider";
import { validateFlowDraft } from "./validate-flow-draft";
import { AI_DRAFT_ERROR_CODES } from "./types";
import type { DraftProviderMode, FlowDraftProvider, GenerateFlowDraftResult, LlmDraftProviderConfig } from "./provider-types";
import { GenericHttpFlowDraftProvider } from "./providers/generic-http-flow-draft-provider";

interface CreateFlowDraftProviderOptions {
  mode: DraftProviderMode;
  llmConfig?: LlmDraftProviderConfig;
  realProviderEnabled?: boolean;
}

class MockFlowDraftProvider implements FlowDraftProvider {
  public async generate(input: Parameters<typeof mockAiDraftProvider>[0]): Promise<GenerateFlowDraftResult> {
    try {
      const draft = await mockAiDraftProvider(input);
      const validation = validateFlowDraft(draft, input.template);
      return {
        ok: validation.ok,
        draft: validation.ok ? draft : undefined,
        issues: validation.issues,
        meta: {
          provider: "mock",
          model: "mock-rule-v1",
          parsed: true,
          validated: validation.ok
        }
      };
    } catch (error) {
      if (error instanceof BuilderAiCoreError) {
        return {
          ok: false,
          issues: error.issues,
          meta: {
            provider: "mock",
            model: "mock-rule-v1",
            parsed: false,
            validated: false
          }
        };
      }
      throw error;
    }
  }
}

class DisabledRealFlowDraftProvider implements FlowDraftProvider {
  public async generate(): Promise<GenerateFlowDraftResult> {
    return {
      ok: false,
      issues: [aiDraftIssue(AI_DRAFT_ERROR_CODES.REAL_PROVIDER_DISABLED, "Real provider mode is disabled by environment.")],
      meta: {
        provider: "real",
        parsed: false,
        validated: false
      }
    };
  }
}

export function createFlowDraftProvider(options: CreateFlowDraftProviderOptions): FlowDraftProvider {
  if (options.mode === "mock") {
    return new MockFlowDraftProvider();
  }
  if (!options.realProviderEnabled) {
    return new DisabledRealFlowDraftProvider();
  }
  const config: LlmDraftProviderConfig = options.llmConfig ?? {
    provider: "generic-http"
  };
  return new GenericHttpFlowDraftProvider(config);
}
