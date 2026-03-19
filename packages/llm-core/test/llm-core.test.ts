import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { MockLLMProvider, NoopLLMProvider } from "../src/index";

describe("@yutra/llm-core", () => {
  it("mock_llm_provider returns deterministic response", async () => {
    const provider = new MockLLMProvider({
      rules: [{ contains: "resolve", response: "intent:resolve_ticket" }],
      fallback: "intent:unknown"
    });

    const result = await provider.generate({ prompt: "please resolve this" });
    expect(result.ok).toBe(true);
    expect(result.text).toBe("intent:resolve_ticket");
  });

  it("llm response error shape is stable when failing", async () => {
    const provider = new NoopLLMProvider();
    const result = await provider.generate({ prompt: "anything" });

    expect(result.ok).toBe(false);
    expect(result.error).toEqual({
      code: "LLM_NOOP",
      message: "NoopLLMProvider is disabled by design.",
      retryable: false
    });
  });

  it("no runtime control logic is moved into llm-core", () => {
    const source = readFileSync(resolve(process.cwd(), "packages/llm-core/src/index.ts"), "utf8");
    expect(source.includes("runtime")).toBe(false);
  });
});
