import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";
import {
  compileScenarioCompositionPreview,
  COMPOSITION_ARTIFACT_FILENAMES,
} from "../../packages/scenario-composition-compiler/src";
import {
  CUSTOMER_COMPLAINT_COMPOSITION_DEMO,
  RENEWAL_CHURN_WARNING_COMPOSITION_DRAFT,
} from "../../packages/scenario-composition-core/src";

const root = resolve(import.meta.dirname, "../..");
const read = (path: string): string =>
  readFileSync(resolve(root, path), "utf8");

describe("scenario composition compile preview conformance", () => {
  it("exposes the compiler package and preview API", () => {
    expect(
      existsSync(resolve(root, "packages/scenario-composition-compiler/package.json")),
    ).toBe(true);
    expect(compileScenarioCompositionPreview).toBeTypeOf("function");
  });

  it("ships customer complaint and ecommerce refund examples", () => {
    expect(
      existsSync(resolve(root, "examples/customer-complaint-composition/plan.json")),
    ).toBe(true);
    expect(
      existsSync(resolve(root, "examples/ecommerce-refund-composition/plan.json")),
    ).toBe(true);
  });

  it("documents namespaced Slot artifacts and forbids deep merge", () => {
    const docs = read("docs/scenario-composition-compile-preview.md");
    expect(docs).toContain("slots/<slotId>/");
    expect(docs).toContain("does not deep-merge Pack Configs");
  });

  it("produces seven top-level preview-only artifacts", () => {
    const result = compileScenarioCompositionPreview(
      CUSTOMER_COMPLAINT_COMPOSITION_DEMO,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(COMPOSITION_ARTIFACT_FILENAMES).toHaveLength(7);
    expect(result.result.previewOnly).toBe(true);
    expect(result.result.runtimeExecutable).toBe(false);
  });

  it("documents that no executable top-level DSL is generated", () => {
    const docs = read("docs/scenario-composition-compile-preview.md");
    expect(docs).toContain("does not generate an executable top-level DSL");
    expect(docs).toContain("does not create `orchestrator.yutra.yaml`");
  });

  it("rejects renewal churn as not compile-ready", () => {
    const result = compileScenarioCompositionPreview(
      RENEWAL_CHURN_WARNING_COMPOSITION_DRAFT,
    );
    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }
    expect(result.issues[0]?.code).toBe("COMPOSITION_NOT_COMPILE_READY");
  });

  it("documents the composition compile CLI", () => {
    expect(read("docs/scenario-composition-compile-preview.md")).toContain(
      "yutra composition compile",
    );
  });

  it("links the preview documentation from both READMEs", () => {
    expect(read("README.md")).toContain(
      "docs/scenario-composition-compile-preview.md",
    );
    expect(read("README.zh-CN.md")).toContain(
      "docs/scenario-composition-compile-preview.md",
    );
  });

  it("keeps the published release record unchanged", () => {
    const publication = read("docs/vnext-preview-release-candidate.md");
    expect(publication).toContain("releasedTag: v0.3.0-vnext-preview.1");
    expect(publication).toContain("tagCreated: true");
  });
});
