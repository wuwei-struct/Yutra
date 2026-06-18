import type { PackConfig } from "@yutra/pack-config-core";

export function compileTestCasesArtifact(config: PackConfig): Record<string, unknown> {
  return {
    generatedFrom: {
      packConfigId: config.packConfigId,
      source: "public_demo"
    },
    testCases: [
      {
        testCaseId: "shipping_lookup_normal",
        title: "Shipping lookup normal path",
        input: { request_type: "shipping", order_id: "DEMO-ORDER-001" },
        expectedPath: ["classify_request", "collect_required_info", "check_order", "evaluate_rules", "execute_resolution", "done"],
        expectedOutcome: "completed",
        tags: ["demo", "shipping", "mock"]
      },
      {
        testCaseId: "refund_high_value_handoff",
        title: "High value refund should fail closed to handoff",
        input: { request_type: "refund", order_id: "DEMO-ORDER-002", amount: 9999 },
        expectedPath: ["classify_request", "check_order", "evaluate_rules", "handoff"],
        expectedOutcome: "handoff",
        tags: ["demo", "refund", "handoff"]
      },
      {
        testCaseId: "missing_order_id",
        title: "Missing order id asks for more information",
        input: { request_type: "refund" },
        expectedPath: ["classify_request", "collect_required_info"],
        expectedOutcome: "needs_more_info",
        tags: ["demo", "missing_info"]
      },
      {
        testCaseId: "api_failure_fail_closed",
        title: "API failure moves to fail-closed handoff",
        input: { request_type: "return", order_id: "DEMO-ORDER-003", simulate_api_failure: true },
        expectedPath: ["classify_request", "check_order", "handoff"],
        expectedOutcome: "handoff",
        tags: ["demo", "api_failure", "fail_closed"]
      }
    ]
  };
}
