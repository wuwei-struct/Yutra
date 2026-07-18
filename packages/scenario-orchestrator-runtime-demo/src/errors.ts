export const DEMO_RUNTIME_ERROR_CODES = {
  NOT_AVAILABLE: "DEMO_RUNTIME_ADAPTER_NOT_AVAILABLE",
  BUSY: "DEMO_RUNTIME_ADAPTER_BUSY",
  ARTIFACT_NOT_FOUND: "DEMO_RUNTIME_ARTIFACT_NOT_FOUND",
  ARTIFACT_PATH_INVALID: "DEMO_RUNTIME_ARTIFACT_PATH_INVALID",
  ARTIFACT_HASH_MISMATCH: "DEMO_RUNTIME_ARTIFACT_HASH_MISMATCH",
  CONFIG_HASH_MISMATCH: "DEMO_RUNTIME_CONFIG_HASH_MISMATCH",
  DSL_INVALID: "DEMO_RUNTIME_DSL_INVALID",
  ACTION_CLOSURE_INCOMPLETE: "DEMO_RUNTIME_ACTION_CLOSURE_INCOMPLETE",
  ACTION_SIDE_EFFECT_UNCLASSIFIED:
    "DEMO_RUNTIME_ACTION_SIDE_EFFECT_UNCLASSIFIED",
  SIDE_EFFECT_LEVEL_EXCEEDED: "DEMO_RUNTIME_SIDE_EFFECT_LEVEL_EXCEEDED",
  IDEMPOTENCY_CONFLICT: "DEMO_RUNTIME_IDEMPOTENCY_CONFLICT",
  INPUT_NAMESPACE_INVALID: "DEMO_RUNTIME_INPUT_NAMESPACE_INVALID",
  OUTPUT_NAMESPACE_INVALID: "DEMO_RUNTIME_OUTPUT_NAMESPACE_INVALID",
  INPUT_TOO_LARGE: "DEMO_RUNTIME_INPUT_TOO_LARGE",
  OUTPUT_TOO_LARGE: "DEMO_RUNTIME_OUTPUT_TOO_LARGE",
  TIMEOUT: "DEMO_RUNTIME_TIMEOUT",
  RESULT_INVALID: "DEMO_RUNTIME_RESULT_INVALID",
  AUDIT_RECORD_FAILED: "DEMO_RUNTIME_AUDIT_RECORD_FAILED"
} as const;

export type DemoRuntimeAdapterErrorCode =
  (typeof DEMO_RUNTIME_ERROR_CODES)[keyof typeof DEMO_RUNTIME_ERROR_CODES];

export class DemoRuntimeAdapterError extends Error {
  public readonly code: DemoRuntimeAdapterErrorCode;
  public readonly safeContext?: Readonly<Record<string, string>>;

  public constructor(
    code: DemoRuntimeAdapterErrorCode,
    message: string,
    safeContext?: Record<string, string>
  ) {
    super(`${code}: ${message}`);
    this.name = "DemoRuntimeAdapterError";
    this.code = code;
    this.safeContext = safeContext ? Object.freeze({ ...safeContext }) : undefined;
  }
}

export function asDemoRuntimeError(
  error: unknown,
  fallbackCode: DemoRuntimeAdapterErrorCode,
  safeMessage: string
): DemoRuntimeAdapterError {
  return error instanceof DemoRuntimeAdapterError
    ? error
    : new DemoRuntimeAdapterError(fallbackCode, safeMessage);
}
