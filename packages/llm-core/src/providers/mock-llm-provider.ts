import type { LLMProvider, LLMRequest, LLMResponse } from "../types";

export interface MockLLMRule {
  contains: string;
  response: string;
}

export interface MockLLMProviderOptions {
  rules?: MockLLMRule[];
  fallback?: string;
}

export class MockLLMProvider implements LLMProvider {
  public readonly name = "mock_llm_provider";
  private readonly rules: MockLLMRule[];
  private readonly fallback: string;

  public constructor(options: MockLLMProviderOptions = {}) {
    this.rules = options.rules ?? [];
    this.fallback = options.fallback ?? "mock:default";
  }

  public async generate(input: LLMRequest): Promise<LLMResponse> {
    if (!input.prompt || input.prompt.trim().length === 0) {
      return {
        ok: false,
        error: {
          code: "LLM_PROMPT_EMPTY",
          message: "Prompt must not be empty.",
          retryable: false
        }
      };
    }

    const matched = this.rules.find((rule) => input.prompt.includes(rule.contains));

    return {
      ok: true,
      text: matched?.response ?? this.fallback,
      meta: {
        provider: this.name,
        matchedRule: matched?.contains
      }
    };
  }
}
