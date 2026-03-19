import type { RuntimeError } from "./types";

export function createRuntimeError(
  code: string,
  message: string,
  details?: Record<string, unknown>
): RuntimeError {
  return {
    code,
    message,
    details
  };
}
