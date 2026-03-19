export interface LLMRequest {
  prompt: string;
  system?: string;
  metadata?: Record<string, unknown>;
}

export interface LLMResponse {
  ok: boolean;
  text?: string;
  error?: {
    code: string;
    message: string;
    retryable?: boolean;
  };
  meta?: Record<string, unknown>;
}

export interface LLMProvider {
  name: string;
  generate(input: LLMRequest): Promise<LLMResponse>;
}
