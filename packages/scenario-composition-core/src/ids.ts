export const SCENARIO_COMPOSITION_IDS = [
  "ecommerce-refund-composition-demo",
  "customer-complaint-composition-demo"
] as const;

export type ScenarioCompositionId = (typeof SCENARIO_COMPOSITION_IDS)[number];

export const SCENARIO_COMPOSITION_DRAFT_IDS = ["renewal-churn-warning-composition-demo"] as const;

export type ScenarioCompositionDraftId = (typeof SCENARIO_COMPOSITION_DRAFT_IDS)[number];
