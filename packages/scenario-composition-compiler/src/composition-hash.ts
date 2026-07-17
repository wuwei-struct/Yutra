import { sha256, stableJson } from "@yutra/rule-compiler";

export function createCompositionPlanHash(plan: unknown): string {
  return sha256(stableJson(plan));
}

export function createCompositionArtifactHash(content: string): string {
  return sha256(content);
}

export function createCompositionBundleHash(input: {
  planHash: string;
  slotArtifactHashes: Array<{ slotId: string; artifactHashes: Record<string, string> }>;
  compositionArtifactHashes: Record<string, string>;
}): string {
  return sha256(stableJson(input));
}
