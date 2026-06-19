import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const workspaceRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");

function read(path: string): string {
  return readFileSync(resolve(workspaceRoot, path), "utf8");
}

describe("public demo boundary cleanup", () => {
  it("public demo boundary doc exists and excludes private delivery assets", () => {
    const path = "docs/public-demo-boundary.md";
    expect(existsSync(resolve(workspaceRoot, path))).toBe(true);
    const content = read(path);
    expect(content.includes("mock/demo examples")).toBe(true);
    expect(content.includes("pricing, quotation, or proposal material")).toBe(true);
    expect(content.includes("real customer endpoints")).toBe(true);
    expect(content.includes("private repositories")).toBe(true);
  });

  it("README files link to the public demo boundary", () => {
    expect(read("README.md").includes("docs/public-demo-boundary.md")).toBe(true);
    expect(read("README.zh-CN.md").includes("docs/public-demo-boundary.md")).toBe(true);
  });

  it("pricing and proposal docs are boundary notes only", () => {
    for (const path of ["docs/ecommerce-pricing-scope.md", "docs/ecommerce-proposal-outline.md"]) {
      const content = read(path);
      expect(content.includes("reserved for private implementation assets")).toBe(true);
      expect(content.includes("Public Boundary")).toBe(true);
      expect(content.includes("Not included here")).toBe(true);
    }
  });

  it("ecommerce delivery and SOP docs declare mock/demo boundaries", () => {
    for (const path of ["examples/ecommerce-support/DELIVERY.md", "examples/ecommerce-support/SOP.md"]) {
      const content = read(path);
      expect(content.includes("public mock/demo document")).toBe(true);
      expect(content.includes("not a customer delivery playbook")).toBe(true);
      expect(content.includes("does not include real customer SOP")).toBe(true);
    }
  });
});
