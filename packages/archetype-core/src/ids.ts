export const MAIN_ARCHETYPE_IDS = [
  "intake-collector",
  "knowledge-answering",
  "request-resolution",
  "approval-decision",
  "diagnostic-resolution",
  "process-orchestration",
  "content-production",
  "data-insight",
  "lead-engagement",
  "monitoring-response"
] as const;

export const CROSS_CUTTING_ARCHETYPE_IDS = [
  "human-handoff",
  "policy-guard",
  "adapter-connector",
  "feedback-optimization"
] as const;

export const ALL_ARCHETYPE_IDS = [...MAIN_ARCHETYPE_IDS, ...CROSS_CUTTING_ARCHETYPE_IDS] as const;

export type MainArchetypeId = (typeof MAIN_ARCHETYPE_IDS)[number];
export type CrossCuttingArchetypeId = (typeof CROSS_CUTTING_ARCHETYPE_IDS)[number];
export type ArchetypeId = MainArchetypeId | CrossCuttingArchetypeId;

export function isMainArchetypeId(id: string): id is MainArchetypeId {
  return (MAIN_ARCHETYPE_IDS as readonly string[]).includes(id);
}

export function isCrossCuttingArchetypeId(id: string): id is CrossCuttingArchetypeId {
  return (CROSS_CUTTING_ARCHETYPE_IDS as readonly string[]).includes(id);
}

export function isArchetypeId(id: string): id is ArchetypeId {
  return (ALL_ARCHETYPE_IDS as readonly string[]).includes(id);
}
