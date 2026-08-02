import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const workspaceRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const targetVersion = "0.4.0-vnext-preview.1";
const candidateTag = `v${targetVersion}`;
const readinessPath = "docs/v0.4-preview-release-readiness.md";

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

describe("P6-12B fixed v0.4 Preview version alignment", () => {
  it("aligns the root package and every workspace package", () => {
    const paths = packageJsonPaths();
    expect(paths).toHaveLength(27);

    for (const path of paths) {
      const packageJson = JSON.parse(read(path)) as { version?: string };
      expect(packageJson.version, path).toBe(targetVersion);
      expect(packageJson.version, path).not.toBe("0.1.0-rc.1");
    }
  });

  it("aligns the candidate tag with the root package version", () => {
    const rootPackage = JSON.parse(read("package.json")) as { version: string };
    expect(`v${rootPackage.version}`).toBe(candidateTag);

    const candidate = read(readinessPath);
    expect(candidate.includes(`Candidate tag: \`${candidateTag}\``)).toBe(true);
  });

  it("keeps release publication fail-closed after version alignment", () => {
    const candidate = read(readinessPath);
    expect(candidate.includes("versionAligned: true")).toBe(true);
    expect(candidate.includes("releaseTagReady: false")).toBe(true);
    expect(
      candidate.includes("releaseTagBlocker: release_notes_and_publication_prep")
    ).toBe(true);
  });

  it("does not claim tag, GitHub Release, or npm publication", () => {
    const candidate = read(readinessPath);
    expect(candidate.includes("tagCreated: false")).toBe(true);
    expect(candidate.includes("githubReleaseCreated: false")).toBe(true);
    expect(candidate.includes("npmPublished: false")).toBe(true);
  });

  it("preserves the published v0.3 release record", () => {
    const publication = read("docs/vnext-preview-release-candidate.md");
    expect(publication).toContain("releasedTag: v0.3.0-vnext-preview.1");
    expect(publication).toContain(
      "releaseCommit: 90c006e3caddeb2395c0badb2d2dfb9c18b91451"
    );
  });
});
