import type {
  ArchetypeLayer,
  BehaviorPrimitiveId,
  CrossCuttingArchetypeId,
  MainArchetypeId,
  TriggerPattern
} from "@yutra/archetype-core";
import type { ScenarioPatternId } from "./ids";

export type ProductArchetypeId = MainArchetypeId;

export type LocalizedScenarioText = {
  en: string;
  zhCN: string;
};

export type ScenarioPatternPublicExposure = {
  mode: "demo_only";
  containsCustomerData: false;
  containsRealEndpoint: false;
  containsSecret: false;
  containsCustomerSop: false;
  containsCommercialDeliveryAsset: false;
};

export type ScenarioPatternManifest = {
  schemaVersion: "1.0.0";
  patternId: ScenarioPatternId;
  version: string;
  name: LocalizedScenarioText;
  summary: LocalizedScenarioText;
  primaryArchetypeId: ProductArchetypeId;
  supportingArchetypeIds: ProductArchetypeId[];
  crossCuttingArchetypeIds: CrossCuttingArchetypeId[];
  triggerPattern: TriggerPattern;
  compositionRationale: LocalizedScenarioText;
  acceptanceSummary: LocalizedScenarioText;
  scenarioTags: string[];
  publicExposure: ScenarioPatternPublicExposure;
};

export type ScenarioPatternSupportContext = {
  compilerEnabledArchetypeIds: string[];
  workbenchEnabledArchetypeIds: string[];
};

export type ScenarioPatternSupportStatus = "fully_supported" | "partially_supported" | "contract_only";

export type ScenarioPatternArchetypeSummary = {
  archetypeId: ProductArchetypeId | CrossCuttingArchetypeId;
  name: LocalizedScenarioText;
  layer: ArchetypeLayer;
};

export type ScenarioPatternCompositionSummary = {
  patternId: ScenarioPatternId;
  primaryArchetype: ScenarioPatternArchetypeSummary;
  supportingArchetypes: ScenarioPatternArchetypeSummary[];
  crossCuttingArchetypes: ScenarioPatternArchetypeSummary[];
  triggerPattern: TriggerPattern;
  primaryOutput: LocalizedScenarioText;
  acceptanceObject: LocalizedScenarioText;
  primitiveCoverage: BehaviorPrimitiveId[];
  governanceFocus: {
    en: string[];
    zhCN: string[];
  };
  compilerSupport: ScenarioPatternSupportStatus;
  workbenchSupport: ScenarioPatternSupportStatus;
};
