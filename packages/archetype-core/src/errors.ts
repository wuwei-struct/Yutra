export type ArchetypeIssueCode =
  | "ARCHETYPE_INVALID_ID"
  | "ARCHETYPE_KIND_MISMATCH"
  | "ARCHETYPE_VERSION_INVALID"
  | "ARCHETYPE_PUBLIC_EXPOSURE_UNSAFE"
  | "ARCHETYPE_COMPOSITION_INVALID"
  | "ARCHETYPE_CONTEXT_POLICY_UNSAFE"
  | "ARCHETYPE_SIDE_EFFECT_POLICY_UNSAFE"
  | "ARCHETYPE_DUPLICATE_ID"
  | "ARCHETYPE_UNKNOWN_CROSS_CUTTING"
  | "ARCHETYPE_TAXONOMY_MISSING"
  | "ARCHETYPE_PRIMITIVE_REF_INVALID"
  | "ARCHETYPE_LAYER_MISMATCH"
  | "ARCHETYPE_PRIMARY_OUTPUT_MISSING"
  | "ARCHETYPE_ACCEPTANCE_OBJECT_MISSING"
  | "ARCHETYPE_GOVERNANCE_FOCUS_MISSING"
  | "ARCHETYPE_SCHEMA_INVALID";

export type ArchetypeIssue = {
  code: ArchetypeIssueCode;
  severity: "error" | "warning";
  message: string;
  path?: string[];
  hint?: string;
};

export type ArchetypeValidationResult = {
  ok: boolean;
  issues: ArchetypeIssue[];
};

export function makeResult(issues: ArchetypeIssue[]): ArchetypeValidationResult {
  return {
    ok: !issues.some((issue) => issue.severity === "error"),
    issues
  };
}
