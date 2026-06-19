import { BUILTIN_ARCHETYPE_MANIFESTS } from "./builtin-archetypes";
import { explainArchetype } from "./explain-archetype";
import type { BehaviorPrimitiveId } from "./behavior-primitive";
import type { ArchetypeId } from "./ids";
import type { ArchetypeKind, ArchetypeManifest, TriggerPattern } from "./types";
import { validateArchetypeRegistry } from "./validate-archetype";

export type ArchetypeRegistry = {
  list(): ArchetypeManifest[];
  listMain(): ArchetypeManifest[];
  listCrossCutting(): ArchetypeManifest[];
  listProductArchetypes(): ArchetypeManifest[];
  listCrossCuttingArchetypes(): ArchetypeManifest[];
  listByPrimitive(primitiveId: BehaviorPrimitiveId): ArchetypeManifest[];
  listByTriggerPattern(triggerPattern: TriggerPattern): ArchetypeManifest[];
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
    listProductArchetypes: () => ordered.filter((manifest) => manifest.taxonomy.layer === "product_archetype"),
    listCrossCuttingArchetypes: () => ordered.filter((manifest) => manifest.taxonomy.layer === "cross_cutting_archetype"),
    listByPrimitive: (primitiveId) => ordered.filter((manifest) => manifest.taxonomy.primitiveRefs.includes(primitiveId)),
    listByTriggerPattern: (triggerPattern) => ordered.filter((manifest) => manifest.taxonomy.triggerPattern === triggerPattern),
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
