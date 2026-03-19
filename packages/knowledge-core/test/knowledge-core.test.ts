import { describe, expect, it } from "vitest";
import { FileKnowledgeProvider, MemoryKnowledgeProvider, VectorAdapterStubProvider } from "../src/index";

const ctx = {
  runId: "run-kb",
  agent: "agent-kb",
  context: {}
};

describe("@yutra/knowledge-core", () => {
  it("memory_kb can return query results", async () => {
    const provider = new MemoryKnowledgeProvider([
      { id: "k1", content: "Reset password in AD" },
      { id: "k2", content: "VPN setup manual" }
    ]);

    const results = await provider.query({ query: "password", topK: 2 }, ctx);
    expect(results.length).toBe(1);
    expect(results[0]?.id).toBe("k1");
  });

  it("file_kb can load local file and return matched results", async () => {
    const provider = new FileKnowledgeProvider({
      files: ["packages/knowledge-core/test/fixtures/helpdesk.md"]
    });

    const results = await provider.query({ query: "oncall" }, ctx);
    expect(results.length).toBe(1);
    expect(results[0]?.source).toContain("helpdesk.md");
  });

  it("vector_adapter_stub clearly behaves as stub", async () => {
    const provider = new VectorAdapterStubProvider();
    const results = await provider.query({ query: "incident" }, ctx);

    expect(results[0]?.metadata?.stub).toBe(true);
    expect(results[0]?.content).toContain("does not perform semantic search");
  });
});
