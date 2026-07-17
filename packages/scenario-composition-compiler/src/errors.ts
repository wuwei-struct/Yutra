export type ScenarioCompositionCompileIssueCode =
  | "COMPOSITION_COMPILE_INPUT_INVALID"
  | "COMPOSITION_NOT_COMPILE_READY"
  | "COMPOSITION_COMPILER_NOT_AVAILABLE"
  | "COMPOSITION_EXECUTION_MODEL_UNSUPPORTED"
  | "COMPOSITION_SLOT_COMPILE_FAILED"
  | "COMPOSITION_SLOT_ARTIFACT_MISSING"
  | "COMPOSITION_SLOT_NAMESPACE_COLLISION"
  | "COMPOSITION_ARTIFACT_HASH_FAILED"
  | "COMPOSITION_OUTPUT_PATH_UNSAFE"
  | "COMPOSITION_PARTIAL_RESULT_NOT_ALLOWED";

export type ScenarioCompositionCompileIssue = {
  code: ScenarioCompositionCompileIssueCode;
  severity: "error" | "warning";
  message: string;
  compositionId?: string;
  slotId?: string;
  path?: string[];
};
