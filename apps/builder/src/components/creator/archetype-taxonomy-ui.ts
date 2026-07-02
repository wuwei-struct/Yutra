import { BUILTIN_ARCHETYPE_MANIFESTS } from "../../../../../packages/archetype-core/src/builtin-archetypes";
import type { ArchetypeManifest } from "../../../../../packages/archetype-core/src/types";

export type CreatorArchetypeOption = {
  id: string;
  label: string;
  enabled: boolean;
  manifest: ArchetypeManifest;
};

export const creatorArchetypeOptions: CreatorArchetypeOption[] = BUILTIN_ARCHETYPE_MANIFESTS.map((manifest) => ({
  id: manifest.archetypeId,
  label: `${manifest.archetypeId} / ${manifest.name.zhCN}`,
  enabled: manifest.archetypeId === "request-resolution" || manifest.archetypeId === "approval-decision",
  manifest
}));

export function getCreatorArchetypeManifest(archetypeId: string): ArchetypeManifest | undefined {
  return creatorArchetypeOptions.find((item) => item.id === archetypeId)?.manifest;
}
