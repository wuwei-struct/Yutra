import type { CapabilityAtom, LocalizedText } from "./capability-atom";
import type { BehaviorPrimitiveId } from "./behavior-primitive";
import type {
  CompositionMode,
  ContextPolicy,
  FailurePolicy,
  GuardPolicy,
  SideEffectPolicy,
  TracePolicy
} from "./composition-contract";
import type { ArchetypeId, CrossCuttingArchetypeId } from "./ids";

export type ArchetypeKind = "main" | "cross_cutting";

export type ArchetypeLayer = "product_archetype" | "cross_cutting_archetype";

export type TriggerPattern = "user_request" | "system_event" | "scheduled" | "human_initiated" | "mixed";

export type ArchetypeTaxonomy = {
  layer: ArchetypeLayer;
  primitiveRefs: BehaviorPrimitiveId[];
  primaryOutput?: LocalizedText;
  acceptanceObject?: LocalizedText;
  governanceFocus?: {
    en: string[];
    zhCN: string[];
  };
  triggerPattern?: TriggerPattern;
  scenarioPatternHints?: {
    en?: string[];
    zhCN?: string[];
  };
};

export type PublicExposure = {
  level: "base" | "demo";
  containsCustomerAssets: false;
  containsRealEndpoints: false;
  containsCommercialSop: false;
};

export type ArchetypeManifest = {
  archetypeId: ArchetypeId;
  archetypeVersion: string;
  kind: ArchetypeKind;
  name: LocalizedText;
  summary: LocalizedText;
  description?: {
    en?: string;
    zhCN?: string;
  };
  coreFlow: string[];
  commonScenarios: string[];
  commonRules: string[];
  capabilities: CapabilityAtom[];
  inputs: string[];
  outputs: string[];
  compatibleCrossCutting?: CrossCuttingArchetypeId[];
  recommendedCompositions?: CompositionMode[];
  taxonomy: ArchetypeTaxonomy;
  defaultGovernance: {
    contextPolicy: ContextPolicy;
    guardPolicy: GuardPolicy;
    failurePolicy: FailurePolicy;
    tracePolicy: TracePolicy;
    sideEffectPolicy: SideEffectPolicy;
  };
  publicExposure: PublicExposure;
  metadata?: Record<string, unknown>;
};
