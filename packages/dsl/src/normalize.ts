import type { AgentSpec } from "@yutra/spec";
import { agentSpecSchema } from "@yutra/spec";
import { DslError } from "./errors";

const aliasKeyMap: Readonly<Record<string, string>> = {
  "\u667A\u80FD\u4F53": "agent",
  "\u7248\u672C": "version",
  "\u610F\u56FE": "intents",
  "\u4E0A\u4E0B\u6587": "context",
  "\u521D\u59CB\u72B6\u6001": "initial_state",
  "\u72B6\u6001": "states",
  "\u72B6\u6001\u96C6": "states",
  "\u52A8\u4F5C": "actions",
  "\u5B88\u536B": "guards",
  "\u6761\u4EF6\u5B88\u536B": "guards",
  "\u8F6C\u79FB": "transitions",
  "\u8FDB\u5165\u65F6": "on_enter",
  on_enter_cn: "on_enter",
  "\u9000\u51FA\u65F6": "on_exit",
  on_exit_cn: "on_exit",
  "\u5230": "to",
  "\u6761\u4EF6": "when"
};

const canonicalKeys = new Set<string>([
  "agent",
  "version",
  "intents",
  "context",
  "initial_state",
  "states",
  "actions",
  "guards",
  "transitions",
  "on_enter",
  "on_exit",
  "to",
  "when",
  "description",
  "entry_state",
  "fields",
  "type",
  "required",
  "default",
  "final",
  "handoff",
  "name",
  "input",
  "output",
  "side_effect",
  "expression",
  "guard",
  "action",
  "payload"
]);

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toCanonicalKey(key: string): string {
  return aliasKeyMap[key] ?? key;
}

function normalizeValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => normalizeValue(item));
  }

  if (!isPlainObject(value)) {
    return value;
  }

  const normalized: Record<string, unknown> = {};

  for (const [key, entry] of Object.entries(value)) {
    const canonicalKey = toCanonicalKey(key);
    const normalizedEntry = normalizeValue(entry);

    if (canonicalKeys.has(canonicalKey)) {
      normalized[canonicalKey] = normalizedEntry;
      continue;
    }

    normalized[canonicalKey] = normalizedEntry;
  }

  return normalized;
}

export function normalizeDsl(input: unknown): AgentSpec {
  const normalized = normalizeValue(input);
  const parsed = agentSpecSchema.safeParse(normalized);

  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    throw new DslError({
      code: "DSL_SCHEMA_INVALID",
      message: issue?.message ?? "DSL schema is invalid.",
      path: issue?.path.map((part) => String(part)),
      severity: "error"
    });
  }

  return parsed.data;
}

export const DSL_ALIAS_KEY_MAP = aliasKeyMap;
