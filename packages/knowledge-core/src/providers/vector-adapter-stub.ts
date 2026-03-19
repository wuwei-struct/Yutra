import type { KnowledgeProvider, KnowledgeQueryInput, KnowledgeResult } from "../types";

export class VectorAdapterStubProvider implements KnowledgeProvider {
  public readonly name = "vector_adapter_stub";

  public async query(input: KnowledgeQueryInput): Promise<KnowledgeResult[]> {
    return [
      {
        id: "vector-stub",
        content: "vector_adapter_stub does not perform semantic search in v0.1",
        source: "stub",
        metadata: {
          stub: true,
          query: input.query
        }
      }
    ];
  }
}
