import type { DslValidationIssue } from "./errors";

export type CanonicalNameKind = "agent" | "intent" | "context_field" | "state" | "action" | "guard";

export interface NameCanonicalizationRecord {
  kind: CanonicalNameKind;
  from: string;
  to: string;
  strategy: "dictionary" | "slug" | "codepoint_fallback" | "existing";
  path?: string[];
}

interface CanonicalizeNameArgs {
  kind: CanonicalNameKind;
  value: string;
  path?: string[];
}

const explicitNameDictionary: Readonly<Record<string, string>> = {
  "it支持": "it_helpdesk_agent",
  "vpn问题": "vpn_issue",
  "用户id": "user_id",
  "设备类型": "device_type",
  "错误码": "error_code",
  "诊断": "triage",
  "检查网络": "lookup_ticket",
  "检查账户": "check_account",
  "检查证书": "check_certificate",
  "更新证书": "renew_certificate",
  "解锁账户": "unlock_account",
  "通知用户": "notify_user",
  "处理工单": "resolve_ticket",
  "已解决": "resolved"
};

function normalizeDictionaryKey(value: string): string {
  return value.trim().toLowerCase();
}

function slugifyAscii(value: string): string {
  const normalized = value
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/[\s\-./]+/g, "_")
    .replace(/[^\w]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase();
  return normalized || "item";
}

function hasNonAscii(value: string): boolean {
  return /[^\x00-\x7f]/.test(value);
}

function toCodepointFallback(value: string): string {
  const codepoints = Array.from(value).map((char) => char.codePointAt(0)?.toString(16) ?? "0");
  return `u_${codepoints.join("_")}`;
}

function preferredBaseName(rawValue: string): { base: string; strategy: NameCanonicalizationRecord["strategy"] } {
  const value = rawValue.trim();
  const dictionaryHit = explicitNameDictionary[normalizeDictionaryKey(value)];
  if (dictionaryHit) {
    return { base: dictionaryHit, strategy: "dictionary" };
  }

  if (!hasNonAscii(value)) {
    return { base: slugifyAscii(value), strategy: "slug" };
  }

  return { base: toCodepointFallback(value), strategy: "codepoint_fallback" };
}

export class NameNormalizer {
  private readonly perKindMaps: Record<CanonicalNameKind, Map<string, string>> = {
    agent: new Map<string, string>(),
    intent: new Map<string, string>(),
    context_field: new Map<string, string>(),
    state: new Map<string, string>(),
    action: new Map<string, string>(),
    guard: new Map<string, string>()
  };

  private readonly perKindUsedNames: Record<CanonicalNameKind, Set<string>> = {
    agent: new Set<string>(),
    intent: new Set<string>(),
    context_field: new Set<string>(),
    state: new Set<string>(),
    action: new Set<string>(),
    guard: new Set<string>()
  };

  public readonly issues: DslValidationIssue[] = [];
  public readonly mappings: NameCanonicalizationRecord[] = [];

  public lookup(kind: CanonicalNameKind, value: string): string | undefined {
    return this.perKindMaps[kind].get(value);
  }

  public canonicalize(args: CanonicalizeNameArgs): string {
    const raw = args.value.trim();
    const existing = this.perKindMaps[args.kind].get(raw);
    if (existing) {
      return existing;
    }

    const preferred = preferredBaseName(raw);
    const unique = this.ensureUnique(args.kind, preferred.base);
    this.perKindMaps[args.kind].set(raw, unique);
    this.perKindUsedNames[args.kind].add(unique);

    this.mappings.push({
      kind: args.kind,
      from: raw,
      to: unique,
      strategy: preferred.strategy,
      path: args.path
    });

    if (preferred.strategy === "codepoint_fallback") {
      this.issues.push({
        code: "DSL_SCHEMA_INVALID",
        message: `Name '${raw}' does not have a dictionary mapping. Canonicalized with deterministic fallback '${unique}'.`,
        severity: "warning",
        path: args.path,
        hint: "Add an explicit dictionary entry for a more readable canonical name."
      });
    }

    return unique;
  }

  private ensureUnique(kind: CanonicalNameKind, base: string): string {
    const used = this.perKindUsedNames[kind];
    if (!used.has(base)) {
      return base;
    }

    let suffix = 2;
    while (used.has(`${base}_${suffix}`)) {
      suffix += 1;
    }

    return `${base}_${suffix}`;
  }
}

