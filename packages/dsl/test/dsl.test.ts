import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  loadAndValidateDslFile,
  loadDslFile,
  normalizeDsl,
  type DslValidationIssue
} from "../src/index";

function fixturePath(name: string): string {
  return resolve(process.cwd(), "packages", "dsl", "test", "fixtures", name);
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

  it("chinese alias can normalize to canonical english fields", () => {
    const loaded = loadDslFile(fixturePath("chinese-alias.yutra.yaml"));
    const normalized = normalizeDsl(loaded.raw);

    expect(normalized.agent).toBe("cn-agent");
    expect(normalized.initial_state).toBe("\u5206\u6D41");
    expect(Object.keys(normalized.states)).toContain("\u5206\u6D41");
    expect(normalized.states["\u5206\u6D41"]?.transitions?.[0]?.to).toBe("\u5B8C\u6210");
    expect(normalized.states["\u5206\u6D41"]?.transitions?.[0]?.when).toBe("ctx.ticket_has_solution == true");
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

  it("unreachable state should be reported", () => {
    const result = loadAndValidateDslFile(fixturePath("unreachable-state.yutra.yaml"));
    expect(hasIssue(result.validation.warnings, "DSL_UNREACHABLE_STATE")).toBe(true);
  });
});
