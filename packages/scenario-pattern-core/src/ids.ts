export const SCENARIO_PATTERN_IDS = [
  "ecommerce-refund-demo",
  "customer-complaint-demo",
  "renewal-churn-warning-demo"
] as const;

export type ScenarioPatternId = (typeof SCENARIO_PATTERN_IDS)[number];

export function isScenarioPatternId(input: string): input is ScenarioPatternId {
  return (SCENARIO_PATTERN_IDS as readonly string[]).includes(input);
}
