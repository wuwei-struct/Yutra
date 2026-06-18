import { inspectDsl, parseDsl } from "@yutra/dsl";
import type { RuleCompilerOutput } from "./types";
import type { RuleCompilerIssue } from "./errors";

export function validateCompileOutput(output: RuleCompilerOutput): RuleCompilerIssue[] {
  const issues: RuleCompilerIssue[] = [];
  const artifacts = output.artifacts;
  if (!artifacts) {
    return issues;
  }

  if (artifacts.templates.filename !== "templates.json" || !Object.prototype.hasOwnProperty.call(artifacts.templates.data, "ask_missing_info")) {
    issues.push({
      code: "RULE_COMPILER_TEMPLATE_MISSING",
      severity: "error",
      message: "templates.json must include ask_missing_info."
    });
  }

  const testCaseList = (artifacts.testCases.data.testCases as unknown[]) ?? [];
  if (testCaseList.length === 0) {
    issues.push({
      code: "RULE_COMPILER_TEST_CASE_MISSING",
      severity: "error",
      message: "test-cases.json must include at least one test case."
    });
  }

  const expectedEvents = (artifacts.traceExpectation.data.expectedEventTypes as unknown[]) ?? [];
  if (expectedEvents.length === 0 || !expectedEvents.includes("handoff.requested")) {
    issues.push({
      code: "RULE_COMPILER_TRACE_EXPECTATION_MISSING",
      severity: "error",
      message: "trace.expectation.json must include handoff.requested expectation."
    });
  }

  try {
    const raw = parseDsl(artifacts.agent.content, "yaml");
    const inspected = inspectDsl(raw, { format: "yaml" });
    if (inspected.issues.length > 0) {
      for (const issue of inspected.issues) {
        issues.push({
          code: "RULE_COMPILER_DSL_INVALID",
          severity: "error",
          message: issue.message,
          path: issue.path
        });
      }
    }
    const hasHandoff = Object.values(inspected.canonical.states).some((state) => state.handoff === true);
    if (!hasHandoff) {
      issues.push({
        code: "RULE_COMPILER_FAIL_CLOSED",
        severity: "error",
        message: "Generated DSL must include a handoff state."
      });
    }
  } catch (error) {
    issues.push({
      code: "RULE_COMPILER_DSL_INVALID",
      severity: "error",
      message: (error as Error).message
    });
  }

  return issues;
}
