import type { CapabilityAtom, LocalizedText } from "./capability-atom";
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
