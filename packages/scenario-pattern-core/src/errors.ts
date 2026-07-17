export type ScenarioPatternIssueCode =
  | "SCENARIO_PATTERN_SCHEMA_INVALID"
  | "SCENARIO_PATTERN_PRIMARY_ARCHETYPE_INVALID"
  | "SCENARIO_PATTERN_PRIMARY_NOT_PRODUCT"
  | "SCENARIO_PATTERN_SUPPORTING_ARCHETYPE_INVALID"
  | "SCENARIO_PATTERN_SUPPORTING_NOT_PRODUCT"
  | "SCENARIO_PATTERN_CROSS_CUTTING_INVALID"
  | "SCENARIO_PATTERN_CROSS_CUTTING_LAYER_MISMATCH"
  | "SCENARIO_PATTERN_DUPLICATE_ARCHETYPE"
  | "SCENARIO_PATTERN_PRIMARY_DUPLICATED_AS_SUPPORTING"
  | "SCENARIO_PATTERN_PUBLIC_BOUNDARY_INVALID"
  | "SCENARIO_PATTERN_TRIGGER_INVALID";

export type ScenarioPatternIssue = {
  code: ScenarioPatternIssueCode;
  severity: "error";
  message: string;
  path?: string[];
};

export type ScenarioPatternValidationResult = {
  ok: boolean;
  issues: ScenarioPatternIssue[];
};

export function makeScenarioPatternValidationResult(issues: ScenarioPatternIssue[]): ScenarioPatternValidationResult {
  return {
    ok: issues.length === 0,
    issues
  };
}
