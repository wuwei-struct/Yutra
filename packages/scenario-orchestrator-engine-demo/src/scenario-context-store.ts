import { DEMO_ORCHESTRATOR_ENGINE_ERROR_CODES, DemoOrchestratorEngineError } from "./errors";

const SAFE_SEGMENT = /^[A-Za-z_][A-Za-z0-9_]*$/;
const UNSAFE = new Set(["__proto__", "prototype", "constructor"]);

function segments(path: string): string[] {
  const values = path.split(".");
  if (values.some((value) => !SAFE_SEGMENT.test(value) || UNSAFE.has(value))) {
    throw new DemoOrchestratorEngineError(
      DEMO_ORCHESTRATOR_ENGINE_ERROR_CODES.BINDING_TARGET_INVALID,
      "Scenario Context path is unsafe."
    );
  }
  return values;
}

export class ScenarioContextStore {
  readonly #values = new Map<string, unknown>();

  constructor(input: unknown, slotIds: readonly string[]) {
    this.#values.set("scenario.input", structuredClone(input));
    this.#values.set("scenario.shared", {});
    for (const slotId of slotIds) {
      this.#values.set(`slots.${slotId}.state`, {});
    }
  }

  read(namespace: string): unknown {
    return structuredClone(this.#values.get(namespace));
  }

  writeNamespace(namespace: string, value: unknown): void {
    if (namespace === "scenario.input") {
      throw new DemoOrchestratorEngineError(DEMO_ORCHESTRATOR_ENGINE_ERROR_CODES.BINDING_TARGET_INVALID, "scenario.input is read-only.");
    }
    this.#values.set(namespace, structuredClone(value));
  }

  readPath(namespace: string, path: string): unknown {
    let value = this.#values.get(namespace);
    for (const segment of segments(path)) {
      if (!value || typeof value !== "object" || Array.isArray(value) || !Object.prototype.hasOwnProperty.call(value, segment)) return undefined;
      value = (value as Record<string, unknown>)[segment];
    }
    return structuredClone(value);
  }

  writePath(namespace: string, path: string, value: unknown): void {
    if (!/^slots\.[A-Za-z_][A-Za-z0-9_]*\.(input|state)$/.test(namespace)) {
      throw new DemoOrchestratorEngineError(DEMO_ORCHESTRATOR_ENGINE_ERROR_CODES.BINDING_TARGET_INVALID, "Binding target namespace is forbidden.");
    }
    const root = structuredClone(this.#values.get(namespace) ?? {}) as Record<string, unknown>;
    const pathSegments = segments(path);
    let cursor = root;
    for (const [index, segment] of pathSegments.entries()) {
      if (index === pathSegments.length - 1) {
        cursor[segment] = structuredClone(value);
      } else {
        const next = cursor[segment];
        if (next !== undefined && (!next || typeof next !== "object" || Array.isArray(next))) {
          throw new DemoOrchestratorEngineError(DEMO_ORCHESTRATOR_ENGINE_ERROR_CODES.BINDING_TARGET_INVALID, "Binding target collides with a scalar value.");
        }
        cursor[segment] = structuredClone(next ?? {});
        cursor = cursor[segment] as Record<string, unknown>;
      }
    }
    this.#values.set(namespace, root);
  }
}
