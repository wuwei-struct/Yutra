import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  CUSTOMER_COMPLAINT_ORCHESTRATOR_PROFILE,
  ECOMMERCE_REFUND_ORCHESTRATOR_PROFILE
} from "../../packages/scenario-orchestrator-compiler/src";
import {
  evaluateSlotOutcomeProjection
} from "../../packages/scenario-orchestrator-core/src";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "../..");
const read = (path: string): string =>
  readFileSync(resolve(root, path), "utf8");
const docsPath =
  "docs/slot-outcome-projection-and-side-effect-alignment.md";

describe("P6-11D.1.1 Slot outcome and side-effect alignment conformance", () => {
  it("ships the explicit Slot Outcome Projection Contract and evaluator", () => {
    expect(typeof evaluateSlotOutcomeProjection).toBe("function");
    expect(
      existsSync(
        resolve(
          root,
          "packages/scenario-orchestrator-core/src/outcome-projection.ts"
        )
      )
    ).toBe(true);
  });

  it("covers the five canonical Slots with explicit Projection Profiles", () => {
    const profiles = [
      ...CUSTOMER_COMPLAINT_ORCHESTRATOR_PROFILE.slotProfiles,
      ...ECOMMERCE_REFUND_ORCHESTRATOR_PROFILE.slotProfiles
    ];
    expect(profiles).toHaveLength(5);
    for (const profile of profiles) {
      expect(profile.outcomeProjection.slotId).toBe(profile.slotId);
      expect(new Set(profile.outcomeProjection.rules.map((rule) => rule.outcome))).toEqual(
        new Set(profile.acceptedOutcomes)
      );
    }
  });

  it("documents that finalState is not a semantic outcome and guessing is forbidden", () => {
    const docs = read(docsPath);
    expect(docs).toContain("Runtime finalState");
    expect(docs).toContain("Semantic Slot outcome");
    expect(docs).toMatch(/do\s+not infer/);
    expect(docs).toContain("finalState=done");
  });

  it("keeps Projection and Route ownership with the future Engine", () => {
    const docs = read(docsPath);
    expect(docs).toContain("Engine owns Outcome Projection and Route Selection");
    expect(docs).toContain("Adapter returns evidence");
    expect(docs).toContain("does not execute Routes");
  });

  it("separates classification coverage from actual dispatch enforcement", () => {
    const docs = read(docsPath);
    expect(docs).toContain("Classification Coverage Preflight");
    expect(docs).toContain("Actual Dispatch Enforcement");
    expect(docs).toContain("unexecuted high-risk Action");
    expect(docs).toContain("before the handler");
  });

  it("documents control-only handoff separately from external dispatch", () => {
    const docs = read(docsPath);
    expect(docs).toContain("control signal");
    expect(docs).toMatch(/do\s+not create a ticket/);
    expect(docs).toContain("externalEffectsOccurred=false");
  });

  it("keeps Studio without Orchestrator Run", () => {
    const studioDocs = read("docs/studio-scenario-orchestrator-preview.md");
    expect(studioDocs).toMatch(/does\s+not expose Apply, Run/);
  });

  it("links the alignment document from both READMEs", () => {
    expect(read("README.md")).toContain(docsPath);
    expect(read("README.zh-CN.md")).toContain(docsPath);
  });

  it("preserves the published release record", () => {
    const publication = read("docs/vnext-preview-release-candidate.md");
    expect(publication).toContain("releasedTag: v0.3.0-vnext-preview.1");
    expect(publication).toContain(
      "releaseCommit: 90c006e3caddeb2395c0badb2d2dfb9c18b91451"
    );
  });
});
