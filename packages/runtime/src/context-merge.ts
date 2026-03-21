import { RUNTIME_ERROR_CODES } from "./error-codes";
import { createRuntimeError } from "./errors";
import type { ContextMergeErrorDetail, ContextMergePolicy, RuntimeError } from "./types";

function getTypeTag(value: unknown): string {
  if (value === null) {
    return "null";
  }
  if (Array.isArray(value)) {
    return "array";
  }
  return typeof value;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function createMergeError(code: string, message: string, details: ContextMergeErrorDetail): RuntimeError {
  return createRuntimeError(code, message, {
    stage: "action.context_merge",
    retryable: false,
    details: details as Record<string, unknown>
  });
}

export type MergeContextPatchResult = {
  ok: true;
} | {
  ok: false;
  error: RuntimeError;
};

export function mergeContextPatch(
  target: Record<string, unknown>,
  patch: Record<string, unknown>,
  policy: ContextMergePolicy = {}
): MergeContextPatchResult {
  const strategy = policy.strategy ?? "shallow";
  const allowNull = policy.allowNull ?? false;

  if (!isPlainObject(patch)) {
    return {
      ok: false,
      error: createMergeError(
        RUNTIME_ERROR_CODES.CONTEXT_PATCH_INVALID,
        "Context patch must be a plain object.",
        {
          actualType: getTypeTag(patch),
          mergeStrategy: strategy
        }
      )
    };
  }

  for (const [field, incoming] of Object.entries(patch)) {
    if (typeof incoming === "undefined") {
      return {
        ok: false,
        error: createMergeError(
          RUNTIME_ERROR_CODES.CONTEXT_PATCH_INVALID,
          `Context patch field '${field}' contains undefined value.`,
          {
            field,
            actualType: "undefined",
            mergeStrategy: strategy
          }
        )
      };
    }

    if (incoming === null && !allowNull) {
      return {
        ok: false,
        error: createMergeError(
          RUNTIME_ERROR_CODES.CONTEXT_PATCH_INVALID,
          `Context patch field '${field}' contains null value while allowNull is false.`,
          {
            field,
            actualType: "null",
            mergeStrategy: strategy
          }
        )
      };
    }

    const existing = target[field];
    if (typeof existing === "undefined") {
      target[field] = incoming;
      continue;
    }

    const existingTag = getTypeTag(existing);
    const incomingTag = getTypeTag(incoming);

    if (existingTag !== incomingTag) {
      return {
        ok: false,
        error: createMergeError(
          RUNTIME_ERROR_CODES.CONTEXT_MERGE_CONFLICT,
          `Context merge type conflict on field '${field}'.`,
          {
            field,
            expectedType: existingTag,
            actualType: incomingTag,
            mergeStrategy: strategy
          }
        )
      };
    }

    if (strategy === "shallow_object_merge" && isPlainObject(existing) && isPlainObject(incoming)) {
      target[field] = {
        ...existing,
        ...incoming
      };
      continue;
    }

    target[field] = incoming;
  }

  return { ok: true };
}
