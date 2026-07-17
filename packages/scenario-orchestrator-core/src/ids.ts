export const SCENARIO_ORCHESTRATOR_CONTRACT_IDS = [
  "customer-complaint-orchestrator-contract",
  "ecommerce-refund-orchestrator-contract"
] as const;

export type ScenarioOrchestratorContractId = (typeof SCENARIO_ORCHESTRATOR_CONTRACT_IDS)[number];
