import { describe, expect, it } from "vitest";
import {
  ALL_ARCHETYPE_IDS,
  BUILTIN_ARCHETYPE_MANIFESTS,
  CROSS_CUTTING_ARCHETYPE_IDS,
  MAIN_ARCHETYPE_IDS,
  createArchetypeRegistry,
  explainArchetype,
  isSideEffectAtLeast,
  validateArchetypeManifest,
  validateArchetypeRegistry
} from "../src";

describe("@yutra/archetype-core", () => {
  it("exports the 10 main, 4 cross-cutting, and 14 total archetype ids", () => {
    expect(MAIN_ARCHETYPE_IDS).toHaveLength(10);
    expect(CROSS_CUTTING_ARCHETYPE_IDS).toHaveLength(4);
    expect(ALL_ARCHETYPE_IDS).toHaveLength(14);
    expect(MAIN_ARCHETYPE_IDS).toContain("request-resolution");
    expect(CROSS_CUTTING_ARCHETYPE_IDS).toContain("human-handoff");
  });

  it("builtin manifests count is 14 and all validate successfully", () => {
    expect(BUILTIN_ARCHETYPE_MANIFESTS).toHaveLength(14);
    const validation = validateArchetypeRegistry(BUILTIN_ARCHETYPE_MANIFESTS);
    expect(validation.ok).toBe(true);
    expect(validation.issues).toEqual([]);
  });

  it("request-resolution and human-handoff have the expected kinds", () => {
    const registry = createArchetypeRegistry();
    expect(registry.get("request-resolution")?.kind).toBe("main");
    expect(registry.get("human-handoff")?.kind).toBe("cross_cutting");
  });

  it("request-resolution declares compatible governance-ready cross-cutting archetypes", () => {
    const requestResolution = createArchetypeRegistry().get("request-resolution");
    expect(requestResolution?.compatibleCrossCutting).toEqual(
      expect.arrayContaining(["human-handoff", "policy-guard", "adapter-connector"])
    );
  });

  it("invalid id and kind mismatch fail validation", () => {
    const base = BUILTIN_ARCHETYPE_MANIFESTS[0]!;
    expect(validateArchetypeManifest({ ...base, archetypeId: "unknown" }).ok).toBe(false);
    const mismatch = validateArchetypeManifest({ ...base, archetypeId: "human-handoff" });
    expect(mismatch.ok).toBe(false);
    expect(mismatch.issues.some((issue) => issue.code === "ARCHETYPE_KIND_MISMATCH")).toBe(true);
  });

  it("unsafe publicExposure fails validation", () => {
    const base = BUILTIN_ARCHETYPE_MANIFESTS[0]!;
    const validation = validateArchetypeManifest({
      ...base,
      publicExposure: {
        ...base.publicExposure,
        containsCustomerAssets: true
      }
    });
    expect(validation.ok).toBe(false);
    expect(validation.issues.some((issue) => issue.code === "ARCHETYPE_PUBLIC_EXPOSURE_UNSAFE")).toBe(true);
  });

  it("duplicate registry ids fail validation and registry construction", () => {
    const duplicate = [BUILTIN_ARCHETYPE_MANIFESTS[0]!, BUILTIN_ARCHETYPE_MANIFESTS[0]!];
    const validation = validateArchetypeRegistry(duplicate);
    expect(validation.ok).toBe(false);
    expect(validation.issues.some((issue) => issue.code === "ARCHETYPE_DUPLICATE_ID")).toBe(true);
    expect(() => createArchetypeRegistry(duplicate)).toThrow(/Invalid archetype registry/);
  });

  it("default governance is conservative", () => {
    for (const manifest of BUILTIN_ARCHETYPE_MANIFESTS) {
      expect(isSideEffectAtLeast(manifest.defaultGovernance.sideEffectPolicy.maxAutoSideEffect, "write")).toBe(false);
      expect(manifest.defaultGovernance.failurePolicy).toBe("fail_closed_to_handoff");
      expect(manifest.publicExposure).toEqual({
        level: "base",
        containsCustomerAssets: false,
        containsRealEndpoints: false,
        containsCommercialSop: false
      });
    }
  });

  it("registry lists and explains archetypes deterministically", () => {
    const registry = createArchetypeRegistry();
    expect(registry.listMain()).toHaveLength(10);
    expect(registry.listCrossCutting()).toHaveLength(4);
    expect(registry.has("request-resolution")).toBe(true);
    expect(registry.getCompatibleCrossCutting("request-resolution").map((manifest) => manifest.archetypeId)).toEqual([
      "human-handoff",
      "policy-guard",
      "adapter-connector"
    ]);

    const english = registry.explain("request-resolution", "en");
    const chinese = registry.explain("request-resolution", "zh-CN");
    expect(english).toContain("Request Resolution");
    expect(english).toContain("This is an archetype manifest, not an executable Agent");
    expect(chinese).toContain("请求处理型");
    expect(chinese).toContain("这只是 archetype manifest");
  });

  it("public API exports explainArchetype", () => {
    const manifest = BUILTIN_ARCHETYPE_MANIFESTS.find((item) => item.archetypeId === "human-handoff")!;
    expect(explainArchetype(manifest, { locale: "en" })).toContain("Human Handoff");
  });
});
