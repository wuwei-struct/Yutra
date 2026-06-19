import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { BEHAVIOR_PRIMITIVE_IDS, BUILTIN_ARCHETYPE_MANIFESTS } from "../../packages/archetype-core/src";

const root = resolve(__dirname, "..", "..");

function read(path: string): string {
  return readFileSync(resolve(root, path), "utf8");
}

describe("P6-08C archetype taxonomy conformance", () => {
  it("archetype taxonomy doc exists", () => {
    expect(existsSync(resolve(root, "docs/archetype-taxonomy.md"))).toBe(true);
  });

  it("taxonomy defines the three layers", () => {
    const taxonomy = read("docs/archetype-taxonomy.md");
    expect(taxonomy).toContain("Behavior Primitives");
    expect(taxonomy).toContain("Product Archetypes");
    expect(taxonomy).toContain("Scenario Patterns");
  });

  it("taxonomy contains all behavior primitives", () => {
    const taxonomy = read("docs/archetype-taxonomy.md");
    for (const primitive of ["collect", "retrieve", "evaluate", "execute", "generate", "route", "monitor", "handoff", "audit", "feedback"]) {
      expect(taxonomy).toContain(`\`${primitive}\``);
    }
  });

  it("taxonomy states main archetypes are not primitive behavior atoms", () => {
    const taxonomy = read("docs/archetype-taxonomy.md");
    expect(taxonomy).toContain("The 10 main archetypes are not primitive behavior atoms");
  });

  it("taxonomy includes fit test and customer complaint as scenario pattern", () => {
    const taxonomy = read("docs/archetype-taxonomy.md");
    expect(taxonomy).toContain("Archetype Fit Test");
    expect(taxonomy).toContain("Customer complaint");
    expect(taxonomy).toContain("scenario pattern");
  });

  it("README and archetype library link to the taxonomy", () => {
    expect(read("README.md")).toContain("docs/archetype-taxonomy.md");
    expect(read("README.zh-CN.md")).toContain("docs/archetype-taxonomy.md");
    expect(read("docs/archetype-library.md")).toContain("./archetype-taxonomy.md");
  });

  it("archetype-core exports taxonomy metadata", () => {
    expect(BEHAVIOR_PRIMITIVE_IDS).toHaveLength(10);
    expect(BUILTIN_ARCHETYPE_MANIFESTS.every((manifest) => manifest.taxonomy)).toBe(true);
    expect(BUILTIN_ARCHETYPE_MANIFESTS.find((manifest) => manifest.archetypeId === "request-resolution")?.taxonomy.layer).toBe(
      "product_archetype"
    );
    expect(BUILTIN_ARCHETYPE_MANIFESTS.find((manifest) => manifest.archetypeId === "human-handoff")?.taxonomy.layer).toBe(
      "cross_cutting_archetype"
    );
    expect(BUILTIN_ARCHETYPE_MANIFESTS.find((manifest) => manifest.archetypeId === "approval-decision")?.taxonomy.primaryOutput?.en).toContain(
      "decision"
    );
    expect(BUILTIN_ARCHETYPE_MANIFESTS.find((manifest) => manifest.archetypeId === "monitoring-response")?.taxonomy.triggerPattern).toBe(
      "system_event"
    );
  });
});
