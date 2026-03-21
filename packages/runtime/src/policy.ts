import { readFileSync } from "node:fs";
import { extname } from "node:path";
import { parse as parseYaml } from "yaml";
import type { EnvironmentProfile, PolicyPack } from "./types";

export function resolveEnvironmentProfile(
  policyPack?: Pick<PolicyPack, "environment">,
  requestedEnvironment?: EnvironmentProfile
): EnvironmentProfile {
  return requestedEnvironment ?? policyPack?.environment ?? "dev";
}

export function loadPolicyPackFile(path: string): PolicyPack {
  const raw = readFileSync(path, "utf8");
  const extension = extname(path).toLowerCase();
  let parsed: unknown;

  if (extension === ".json") {
    parsed = JSON.parse(raw) as unknown;
  } else if (extension === ".yaml" || extension === ".yml") {
    parsed = parseYaml(raw) as unknown;
  } else {
    throw new Error(`Unsupported policy file extension '${extension}'. Expected .json/.yaml/.yml.`);
  }

  return parsePolicyPack(parsed);
}

export function parsePolicyPack(input: unknown): PolicyPack {
  if (!input || typeof input !== "object") {
    throw new Error("Invalid policy pack: expected object.");
  }

  const candidate = input as Partial<PolicyPack>;
  if (typeof candidate.name !== "string" || candidate.name.trim().length === 0) {
    throw new Error("Invalid policy pack: 'name' is required.");
  }

  return {
    name: candidate.name,
    version: typeof candidate.version === "string" ? candidate.version : undefined,
    environment:
      candidate.environment === "dev" || candidate.environment === "demo" || candidate.environment === "prod-like"
        ? candidate.environment
        : undefined,
    actionRules: Array.isArray(candidate.actionRules) ? candidate.actionRules : [],
    sideEffectRules: Array.isArray(candidate.sideEffectRules) ? candidate.sideEffectRules : [],
    handoffRules: Array.isArray(candidate.handoffRules) ? candidate.handoffRules : []
  };
}
