import type { KnowledgeProvider, KnowledgeQueryInput, KnowledgeResult } from "../types";

export interface MemoryKnowledgeItem {
  id: string;
  content: string;
  metadata?: Record<string, unknown>;
}

export class MemoryKnowledgeProvider implements KnowledgeProvider {
  public readonly name = "memory_kb";
  private readonly items: MemoryKnowledgeItem[];

  public constructor(items: MemoryKnowledgeItem[]) {
    this.items = items;
  }

  public async query(input: KnowledgeQueryInput): Promise<KnowledgeResult[]> {
    const q = input.query.toLowerCase();
    const matched = this.items
      .filter((item) => item.content.toLowerCase().includes(q))
      .map((item, index) => ({
        id: item.id,
        content: item.content,
        score: 1 - index * 0.01,
        source: "memory",
        metadata: item.metadata
      }));

    return matched.slice(0, input.topK ?? 5);
  }
}
