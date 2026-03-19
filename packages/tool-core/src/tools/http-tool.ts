import type { Tool, ToolResult } from "../types";

export interface HttpToolInput {
  url: string;
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  headers?: Record<string, string>;
  body?: unknown;
}

export interface HttpToolOutput {
  status: number;
  headers: Record<string, string>;
  body: unknown;
}

export const httpTool: Tool<HttpToolInput, HttpToolOutput> = {
  name: "http_tool",
  description: "Minimal fetch wrapper tool.",
  sideEffect: "external",
  async run(input): Promise<ToolResult<HttpToolOutput>> {
    try {
      const response = await fetch(input.url, {
        method: input.method ?? "GET",
        headers: input.headers,
        body: input.body ? JSON.stringify(input.body) : undefined
      });

      const text = await response.text();
      let parsed: unknown = text;
      try {
        parsed = JSON.parse(text);
      } catch {
        // Keep raw text when not JSON.
      }

      return {
        ok: response.ok,
        data: {
          status: response.status,
          headers: Object.fromEntries(response.headers.entries()),
          body: parsed
        },
        error: response.ok
          ? undefined
          : {
              code: "HTTP_TOOL_FAILED",
              message: `HTTP request failed with status ${response.status}`,
              retryable: response.status >= 500
            }
      };
    } catch (error) {
      return {
        ok: false,
        error: {
          code: "HTTP_TOOL_ERROR",
          message: (error as Error).message,
          retryable: true
        }
      };
    }
  }
};
