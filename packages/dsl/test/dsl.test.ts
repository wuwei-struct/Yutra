import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  explainDsl,
  inspectDsl,
  loadAndValidateDslFile,
  loadDslFile,
  normalizeDsl,
  type DslValidationIssue
} from "../src/index";

function fixturePath(name: string): string {
  return resolve(workspaceRoot(), "packages", "dsl", "test", "fixtures", name);
}

function workspacePath(path: string): string {
  return resolve(workspaceRoot(), path);
}

function workspaceRoot(): string {
  let current = process.cwd();
  while (true) {
    if (existsSync(resolve(current, "pnpm-workspace.yaml"))) {
      return current;
    }

    const parent = resolve(current, "..");
    if (parent === current) {
      return process.cwd();
    }
    current = parent;
  }
}

function hasIssue(issues: DslValidationIssue[], code: string): boolean {
  return issues.some((issue) => issue.code === code);
}

describe("@yutra/dsl", () => {
  it("can load .yutra.yaml", () => {
    const loaded = loadDslFile(fixturePath("minimal-agent.yutra.yaml"));
    expect(loaded.format).toBe("yaml");
    expect(typeof loaded.raw).toBe("object");
  });

  it("can load .yutra.json", () => {
    const loaded = loadDslFile(fixturePath("minimal-agent.yutra.json"));
    expect(loaded.format).toBe("json");
    expect(typeof loaded.raw).toBe("object");
  });

  it("chinese field aliases normalize to canonical english keys", () => {
    const loaded = loadDslFile(fixturePath("chinese-alias.yutra.yaml"));
    const normalized = normalizeDsl(loaded.raw);

    expect(normalized.agent).toBe("cn_agent");
    expect(normalized.initial_state).toBe("u_5206_6d41");
    expect(Object.keys(normalized.states)).toContain("u_5206_6d41");
    expect(normalized.states["u_5206_6d41"]?.transitions?.[0]?.to).toBe("u_5b8c_6210");
    expect(normalized.states["u_5206_6d41"]?.transitions?.[0]?.when).toBe("ctx.ticket_has_solution == true");
  });

  it("chinese state/action/intent/context names canonicalize deterministically", () => {
    const loaded = loadDslFile(workspacePath("examples/it-helpdesk/agent.zh-CN.yutra.yaml"));
    const normalized = normalizeDsl(loaded.raw);

    expect(normalized.agent).toBe("it_helpdesk_agent");
    expect(normalized.initial_state).toBe("triage");
    expect(normalized.intents?.[0]?.name).toBe("resolve_ticket");
    expect(Object.keys(normalized.states)).toEqual(["triage", "resolved"]);
    expect(normalized.states.triage?.actions).toEqual(["lookup_ticket"]);
    expect(normalized.states.triage?.transitions?.[0]?.to).toBe("resolved");
  });

  it("explain api returns raw -> normalized -> canonical structure", () => {
    const loaded = loadDslFile(workspacePath("examples/it-helpdesk/agent.zh-CN.yutra.yaml"));
    const explained = explainDsl(loaded.raw);

    expect(explained.raw).toBeDefined();
    expect(explained.normalizedInput).toBeDefined();
    expect(explained.canonicalIR.agent).toBe("it_helpdesk_agent");
    expect(explained.fieldAliasMappings.length).toBeGreaterThan(0);
    expect(explained.nameCanonicalizations.some((item) => item.from === "诊断" && item.to === "triage")).toBe(true);
  });

  it("inspect output includes mapping provenance", () => {
    const loaded = loadDslFile(workspacePath("examples/it-helpdesk/agent.zh-CN.yutra.yaml"));
    const inspected = inspectDsl(loaded.raw, { path: loaded.path, format: loaded.format });

    expect(inspected.mappings.fieldAliases.length).toBeGreaterThan(0);
    expect(inspected.mappings.fieldAliases.every((mapping) => mapping.provenance === "alias_map")).toBe(true);
    expect(inspected.mappings.canonicalNames.every((mapping) => Boolean(mapping.strategy))).toBe(true);
  });

  it("invalid initial_state should fail", () => {
    const result = loadAndValidateDslFile(fixturePath("invalid-initial.yutra.yaml"));
    expect(result.validation.valid).toBe(false);
    expect(hasIssue(result.validation.errors, "DSL_INITIAL_STATE_MISSING")).toBe(true);
  });

  it("transition to missing state should fail", () => {
    const result = loadAndValidateDslFile(fixturePath("invalid-transition.yutra.yaml"));
    expect(result.validation.valid).toBe(false);
    expect(hasIssue(result.validation.errors, "DSL_UNKNOWN_STATE")).toBe(true);
  });

  it("unsupported chinese terms produce structured issues rather than silent corruption", () => {
    const loaded = loadDslFile(fixturePath("chinese-alias.yutra.yaml"));
    const inspected = inspectDsl(loaded.raw, { path: loaded.path, format: loaded.format });
    expect(inspected.warnings.length).toBeGreaterThan(0);
    expect(inspected.warnings.every((issue) => issue.severity === "warning")).toBe(true);
  });

  it("mixed zh/en authoring works deterministically", () => {
    const spec = normalizeDsl({
      agent: "mixed-agent",
      初始状态: "triage",
      状态集: {
        triage: {
          动作: ["lookup_ticket"],
          转移: [{ 到: "resolved", 条件: "ctx.ticket_has_solution == true" }]
        },
        resolved: {
          final: true
        }
      },
      动作: [{ name: "lookup_ticket" }]
    });

    expect(spec.initial_state).toBe("triage");
    expect(spec.states.triage?.actions?.[0]).toBe("lookup_ticket");
    expect(spec.states.triage?.transitions?.[0]?.to).toBe("resolved");
  });

  it("chinese it-helpdesk example can validate", () => {
    const result = loadAndValidateDslFile(workspacePath("examples/it-helpdesk/agent.zh-CN.yutra.yaml"));
    expect(result.validation.valid).toBe(true);
  });

  it("canonical IR generated from zh example matches expected stable names", () => {
    const result = loadAndValidateDslFile(workspacePath("examples/it-helpdesk/agent.zh-CN.yutra.yaml"));

    expect(result.spec.agent).toBe("it_helpdesk_agent");
    expect(result.spec.initial_state).toBe("triage");
    expect(Object.keys(result.spec.states)).toEqual(["triage", "resolved"]);
    expect(result.spec.actions?.map((item) => item.name)).toEqual(["lookup_ticket", "close_ticket"]);
  });
});
