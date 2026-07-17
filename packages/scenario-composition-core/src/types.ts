import type { CrossCuttingArchetypeId } from "@yutra/archetype-core";
import type { PackConfig } from "@yutra/pack-config-core";
import type { ProductArchetypeId, ScenarioPatternId } from "@yutra/scenario-pattern-core";
import type { ScenarioCompositionDraftId, ScenarioCompositionId } from "./ids";

export type SupportedPackConfig = PackConfig;
export type CompositionExecutionModel = "orchestrated_subflows";
export type CompositionSlotRole = "primary" | "supporting";

export type LocalizedCompositionText = {
  en: string;
  zhCN: string;
};

export type CompositionSlot = {
  slotId: string;
  role: CompositionSlotRole;
  archetypeId: ProductArchetypeId;
  packConfigId: string;
  packConfig: SupportedPackConfig;
  purpose: LocalizedCompositionText;
};

export type CompositionScope =
  | { type: "scenario" }
  | { type: "slot"; slotId: string }
  | { type: "route"; routeId: string };

export type CrossCuttingEnforcementMode =
  | "deny_override"
  | "require_handoff"
  | "audit_required"
  | "adapter_boundary"
  | "feedback_capture";

export type CrossCuttingOverlay = {
  overlayId: string;
  archetypeId: CrossCuttingArchetypeId;
  scopes: CompositionScope[];
  enforcementMode: CrossCuttingEnforcementMode;
};

export type CompositionRouteTarget = string | "$scenario_done" | "$human_handoff" | "$fail_closed";

export type CompositionRoute = {
  routeId: string;
  fromSlotId: string;
  toSlotId: CompositionRouteTarget;
  trigger: "on_result" | "on_guard" | "on_handoff" | "on_failure";
  conditionRef: string;
  returnMode: "return_to_caller" | "replace_current_flow" | "terminate_scenario";
};

export type CompositionDataBinding = {
  bindingId: string;
  fromSlotId: string;
  fromPath: string;
  toSlotId: string;
  toPath: string;
  required: boolean;
  transform: "identity";
};

export type CompositionPrecedenceRule =
  | "hard_boundary_first"
  | "deny_overrides"
  | "human_review_over_automation"
  | "higher_risk_over_lower_risk"
  | "explicit_route_over_local_default"
  | "primary_owns_terminal_response"
  | "namespaced_supporting_configs"
  | "no_implicit_adapter_inheritance"
  | "no_secret_merge"
  | "fail_on_ambiguous_conflict";

export type CompositionPrecedencePolicy = {
  rules: CompositionPrecedenceRule[];
  conflictMode: "fail_closed";
};

export type CompositionPublicExposure = {
  mode: "demo_only";
  containsCustomerData: false;
  containsRealEndpoint: false;
  containsSecret: false;
  containsCustomerSop: false;
  containsCommercialDeliveryAsset: false;
};

export type ScenarioCompositionPlan = {
  schemaVersion: "1.0.0";
  compositionId: ScenarioCompositionId | string;
  version: string;
  patternRef: {
    patternId: ScenarioPatternId;
    version: string;
  };
  executionModel: CompositionExecutionModel;
  primarySlotId: string;
  slots: CompositionSlot[];
  crossCuttingOverlays: CrossCuttingOverlay[];
  routes: CompositionRoute[];
  dataBindings: CompositionDataBinding[];
  precedencePolicy: CompositionPrecedencePolicy;
  publicExposure: CompositionPublicExposure;
};

export type ScenarioCompositionDraft = {
  schemaVersion: "1.0.0";
  compositionId: ScenarioCompositionDraftId | string;
  patternRef: { patternId: ScenarioPatternId; version: string };
  executionModel: CompositionExecutionModel;
  primaryArchetypeId: ProductArchetypeId;
  supportingArchetypeIds: ProductArchetypeId[];
  crossCuttingArchetypeIds: CrossCuttingArchetypeId[];
  status: "contract_only";
  eligibleForCompilerInput: false;
  blockers: string[];
  publicExposure: CompositionPublicExposure;
};

export type CompositionSupportContext = {
  compilerEnabledArchetypeIds: ProductArchetypeId[];
  workbenchEnabledArchetypeIds: ProductArchetypeId[];
  availableCrossCuttingArchetypeIds: CrossCuttingArchetypeId[];
  compositionCompilerAvailable?: boolean;
};

export type CompositionReadinessStatus = "compile_ready" | "partially_supported" | "contract_only" | "invalid";

export type CompositionReadiness = {
  contractValid: boolean;
  patternAligned: boolean;
  allProductArchetypesCompilerEnabled: boolean;
  allProductArchetypesWorkbenchEnabled: boolean;
  allCrossCuttingAvailable: boolean;
  compositionCompilerAvailable: boolean;
  status: CompositionReadinessStatus;
  blockers: string[];
};
