import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { KnowledgeProvider, KnowledgeQueryInput, KnowledgeResult } from "../types";

export interface FileKnowledgeProviderOptions {
  files: string[];
}

export class FileKnowledgeProvider implements KnowledgeProvider {
  public readonly name = "file_kb";
  private readonly files: string[];

  public constructor(options: FileKnowledgeProviderOptions) {
    this.files = options.files;
  }

  public async query(input: KnowledgeQueryInput): Promise<KnowledgeResult[]> {
    const q = input.query.toLowerCase();
    const results: KnowledgeResult[] = [];

    for (const file of this.files) {
      const path = resolve(process.cwd(), file);
      const content = readFileSync(path, "utf8");
      if (!content.toLowerCase().includes(q)) {
        continue;
      }

      results.push({
        id: path,
        content,
        source: path,
        score: 0.5
      });
    }

    return results.slice(0, input.topK ?? 5);
  }
}
