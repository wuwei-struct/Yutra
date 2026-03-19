import type { LLMProvider, LLMRequest, LLMResponse } from "../types";

export class NoopLLMProvider implements LLMProvider {
  public readonly name = "noop_llm_provider";

  public async generate(input: LLMRequest): Promise<LLMResponse> {
    void input;
    return {
      ok: false,
      error: {
        code: "LLM_NOOP",
        message: "NoopLLMProvider is disabled by design.",
        retryable: false
      },
      meta: {
        provider: this.name
      }
    };
  }
}
