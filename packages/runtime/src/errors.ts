import type { RuntimeError } from "./types";

export function createRuntimeError(
  code: string,
  message: string,
  extras?: Partial<Omit<RuntimeError, "code" | "message">>
): RuntimeError {
  return {
    code,
    message,
    ...extras
  };
}
