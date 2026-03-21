import type { AgentSpec } from "@yutra/spec";
import { agentSpecSchema } from "@yutra/spec";
import { canonicalizeDslNames } from "./canonicalize";
import { DslError } from "./errors";
import type { DslNormalizationResult, FieldAliasMappingRecord } from "./types";

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

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeStructurally(
  value: unknown,
  path: string[] = [],
  aliasMappings: FieldAliasMappingRecord[] = []
): unknown {
  if (Array.isArray(value)) {
    return value.map((item, index) => normalizeStructurally(item, [...path, String(index)], aliasMappings));
  }

  if (!isPlainObject(value)) {
    return value;
  }

  const normalized: Record<string, unknown> = {};
  for (const [rawKey, rawValue] of Object.entries(value)) {
    const canonicalKey = aliasKeyMap[rawKey] ?? rawKey;
    if (canonicalKey !== rawKey) {
      aliasMappings.push({
        from: rawKey,
        to: canonicalKey,
        provenance: "alias_map",
        path: [...path, rawKey]
      });
    }

    normalized[canonicalKey] = normalizeStructurally(rawValue, [...path, canonicalKey], aliasMappings);
  }

  return normalized;
}

function parseAgentSpec(normalized: unknown): AgentSpec {
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

export function normalizeDslWithDetails(input: unknown): DslNormalizationResult {
  const fieldAliasMappings: FieldAliasMappingRecord[] = [];
  const structurallyNormalized = normalizeStructurally(input, [], fieldAliasMappings);
  const parsed = parseAgentSpec(structurallyNormalized);
  const canonicalized = canonicalizeDslNames(parsed);

  return {
    normalizedInput: structurallyNormalized,
    spec: canonicalized.spec,
    fieldAliasMappings,
    nameCanonicalizations: canonicalized.mappings,
    issues: canonicalized.issues
  };
}

export function normalizeDsl(input: unknown): AgentSpec {
  return normalizeDslWithDetails(input).spec;
}

export const DSL_ALIAS_KEY_MAP = aliasKeyMap;
