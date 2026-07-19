import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const workspaceRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const targetVersion = "0.3.0-vnext-preview.1";
const candidateTag = `v${targetVersion}`;

function read(path: string): string {
  return readFileSync(resolve(workspaceRoot, path), "utf8");
}

function packageJsonPaths(): string[] {
  const paths = ["package.json"];

  for (const workspaceDir of ["apps", "packages"]) {
    const absoluteDir = resolve(workspaceRoot, workspaceDir);
    for (const entry of readdirSync(absoluteDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const relativePath = `${workspaceDir}/${entry.name}/package.json`;
      if (existsSync(resolve(workspaceRoot, relativePath))) paths.push(relativePath);
    }
  }

  return paths.sort();
}

describe("P6-10C.1 fixed release version alignment", () => {
  it("aligns the root package and every workspace package", () => {
    const paths = packageJsonPaths();
    expect(paths).toHaveLength(26);

    for (const path of paths) {
      const packageJson = JSON.parse(read(path)) as { version?: string };
      expect(packageJson.version, path).toBe(targetVersion);
      expect(packageJson.version, path).not.toBe("0.1.0-rc.1");
    }
  });

  it("aligns the candidate tag with the root package version", () => {
    const rootPackage = JSON.parse(read("package.json")) as { version: string };
    expect(`v${rootPackage.version}`).toBe(candidateTag);

    const candidate = read("docs/vnext-preview-release-candidate.md");
    expect(candidate.includes(`candidateTag: ${candidateTag}`)).toBe(true);
  });

  it("marks the release candidate tag as ready without a blocker", () => {
    const candidate = read("docs/vnext-preview-release-candidate.md");
    expect(candidate.includes("releaseSmokeReady: true")).toBe(true);
    expect(candidate.includes("releaseTagReady: true")).toBe(true);
    expect(candidate.includes("releaseTagBlocker: none")).toBe(true);
  });

  it("records prerelease publication while npm remains unpublished", () => {
    const candidate = read("docs/vnext-preview-release-candidate.md");
    expect(candidate.includes("tagCreated: true")).toBe(true);
    expect(candidate.includes("githubReleaseCreated: true")).toBe(true);
    expect(candidate.includes("githubReleaseType: prerelease")).toBe(true);
    expect(candidate.includes("npmPublished: false")).toBe(true);
  });

  it("keeps the release smoke evidence linked and present", () => {
    const candidate = read("docs/vnext-preview-release-candidate.md");
    expect(candidate.includes("./vnext-preview-release-smoke.md")).toBe(true);
    expect(existsSync(resolve(workspaceRoot, "docs/vnext-preview-release-smoke.md"))).toBe(true);
  });
});
