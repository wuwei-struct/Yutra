export interface KnowledgeContext {
  runId: string;
  agent: string;
  state?: string;
  context: Record<string, unknown>;
}

export interface KnowledgeQueryInput {
  query: string;
  topK?: number;
  filters?: Record<string, unknown>;
}

export interface KnowledgeResult {
  id: string;
  content: string;
  score?: number;
  source?: string;
  metadata?: Record<string, unknown>;
}

export interface KnowledgeProvider {
  name: string;
  query(input: KnowledgeQueryInput, ctx: KnowledgeContext): Promise<KnowledgeResult[]>;
}
