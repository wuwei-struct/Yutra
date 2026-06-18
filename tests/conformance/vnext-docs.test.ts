import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const workspaceRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");

function read(path: string): string {
  return readFileSync(resolve(workspaceRoot, path), "utf8");
}

const vNextDocs = [
  "docs/vnext-charter.md",
  "docs/archetype-library.md",
  "docs/business-rule-config.md",
  "docs/rule-compiler-overview.md",
  "docs/creator-workbench.md",
  "docs/vnext-roadmap.md"
];

describe("P6-01 vNext docs", () => {
  it("vNext docs exist", () => {
    for (const path of vNextDocs) {
      expect(existsSync(resolve(workspaceRoot, path))).toBe(true);
    }
  });

  it("README files link to vNext docs", () => {
    const readme = read("README.md");
    const readmeZh = read("README.zh-CN.md");
    for (const path of vNextDocs) {
      expect(readme.includes(path)).toBe(true);
      expect(readmeZh.includes(path)).toBe(true);
      expect(existsSync(resolve(workspaceRoot, path))).toBe(true);
    }
  });

  it("archetype library includes 10 main archetypes and 4 cross-cutting archetypes", () => {
    const content = read("docs/archetype-library.md");
    const main = [
      "intake-collector",
      "knowledge-answering",
      "request-resolution",
      "approval-decision",
      "diagnostic-resolution",
      "process-orchestration",
      "content-production",
      "data-insight",
      "lead-engagement",
      "monitoring-response"
    ];
    const crossCutting = ["human-handoff", "policy-guard", "adapter-connector", "feedback-optimization"];
    for (const archetype of [...main, ...crossCutting]) {
      expect(content.includes(archetype)).toBe(true);
    }
    expect(content.includes("not an industry template")).toBe(true);
  });

  it("vNext roadmap includes U0 through U7 and first priority archetypes", () => {
    const content = read("docs/vnext-roadmap.md");
    for (const stage of ["U0", "U1", "U2", "U3", "U4", "U5", "U6", "U7"]) {
      expect(content.includes(stage)).toBe(true);
    }
    for (const archetype of ["request-resolution", "approval-decision", "knowledge-answering", "intake-collector", "human-handoff"]) {
      expect(content.includes(archetype)).toBe(true);
    }
  });

  it("rule compiler overview includes all required output artifacts", () => {
    const content = read("docs/rule-compiler-overview.md");
    for (const artifact of [
      "agent.yutra.yaml",
      "policy.yaml",
      "adapter.config.json",
      "templates.json",
      "test-cases.json",
      "trace.expectation.json"
    ]) {
      expect(content.includes(artifact)).toBe(true);
    }
    expect(content.includes("deterministic")).toBe(true);
    expect(content.includes("AI may draft")).toBe(true);
  });

  it("vNext non-goals include marketplace, multi-tenant SaaS, and direct LLM execution boundaries", () => {
    const charter = read("docs/vnext-charter.md");
    expect(charter.includes("marketplace")).toBe(true);
    expect(charter.includes("remote registry")).toBe(true);
    expect(charter.includes("multi-tenant SaaS")).toBe(true);
    expect(charter.includes("LLM directly generates unaudited execution")).toBe(true);
  });

  it("vNext docs explicitly mark unimplemented capabilities as direction", () => {
    const charter = read("docs/vnext-charter.md");
    const compiler = read("docs/rule-compiler-overview.md");
    const config = read("docs/business-rule-config.md");
    expect(charter.includes("does not claim that archetype-core, pack-config-core, or rule-compiler are implemented today")).toBe(true);
    expect(compiler.includes("not implemented in this iteration")).toBe(true);
    expect(config.includes("are not implemented in this iteration")).toBe(true);
  });

  it("public vNext docs avoid commercially reusable customer implementation details", () => {
    const readme = read("README.md");
    const readmeZh = read("README.zh-CN.md");
    const config = read("docs/business-rule-config.md");
    const compiler = read("docs/rule-compiler-overview.md");
    const roadmap = read("docs/vnext-roadmap.md");
    const archetypes = read("docs/archetype-library.md");
    const boundary = read("docs/open-source-boundary.md");

    for (const content of [readme, readmeZh]) {
      expect(content.includes("docs/ecommerce-pricing-scope.md")).toBe(false);
      expect(content.includes("docs/ecommerce-proposal-outline.md")).toBe(false);
    }

    for (const content of [config, compiler]) {
      expect(content.includes("autoRefundWhenNotShipped")).toBe(false);
      expect(content.includes("autoRefundMaxAmount")).toBe(false);
      expect(content.includes("highValueRefund")).toBe(false);
    }

    expect(config.includes("<number configured privately>")).toBe(true);
    expect(roadmap.includes("Request-resolution Creator MVP")).toBe(true);
    expect(roadmap.includes("ecommerce refund / return / shipping / handoff")).toBe(false);
    expect(archetypes.includes("customer-specific SOP or implementation playbooks")).toBe(true);
    expect(boundary.includes("private implementation repositories")).toBe(true);
    expect(boundary.includes("customer-ready pricing proposals")).toBe(true);
  });
});
