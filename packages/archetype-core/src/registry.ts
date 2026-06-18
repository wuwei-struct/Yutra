import { BUILTIN_ARCHETYPE_MANIFESTS } from "./builtin-archetypes";
import { explainArchetype } from "./explain-archetype";
import type { ArchetypeId } from "./ids";
import type { ArchetypeKind, ArchetypeManifest } from "./types";
import { validateArchetypeRegistry } from "./validate-archetype";

export type ArchetypeRegistry = {
  list(): ArchetypeManifest[];
  listMain(): ArchetypeManifest[];
  listCrossCutting(): ArchetypeManifest[];
  get(id: ArchetypeId): ArchetypeManifest | undefined;
  has(id: ArchetypeId): boolean;
  filterByKind(kind: ArchetypeKind): ArchetypeManifest[];
  getCompatibleCrossCutting(id: ArchetypeId): ArchetypeManifest[];
  validateAll(): ReturnType<typeof validateArchetypeRegistry>;
  explain(id: ArchetypeId, locale?: "en" | "zh-CN"): string | undefined;
};

export function createArchetypeRegistry(manifests: ArchetypeManifest[] = BUILTIN_ARCHETYPE_MANIFESTS): ArchetypeRegistry {
  const validation = validateArchetypeRegistry(manifests);
  if (!validation.ok) {
    const message = validation.issues.map((issue) => `${issue.code}: ${issue.message}`).join("; ");
    throw new Error(`Invalid archetype registry: ${message}`);
  }

  const ordered = [...manifests];
  const byId = new Map<ArchetypeId, ArchetypeManifest>();
  for (const manifest of ordered) {
    byId.set(manifest.archetypeId, manifest);
  }

  return {
    list: () => [...ordered],
    listMain: () => ordered.filter((manifest) => manifest.kind === "main"),
    listCrossCutting: () => ordered.filter((manifest) => manifest.kind === "cross_cutting"),
    get: (id) => byId.get(id),
    has: (id) => byId.has(id),
    filterByKind: (kind) => ordered.filter((manifest) => manifest.kind === kind),
    getCompatibleCrossCutting: (id) => {
      const manifest = byId.get(id);
      return (manifest?.compatibleCrossCutting ?? []).map((crossId) => byId.get(crossId)).filter(Boolean) as ArchetypeManifest[];
    },
    validateAll: () => validateArchetypeRegistry(ordered),
    explain: (id, locale) => {
      const manifest = byId.get(id);
      return manifest ? explainArchetype(manifest, { locale }) : undefined;
    }
  };
}
