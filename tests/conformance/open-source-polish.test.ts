import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const workspaceRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");

function read(path: string): string {
  return readFileSync(path, "utf8");
}

function collectMarkdownLinks(content: string): string[] {
  const matches = [...content.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)];
  return matches
    .map((m) => m[1]!)
    .filter((href) => !href.startsWith("http"))
    .filter((href) => !href.startsWith("#"));
}

describe("P4-08 open source repository polish", () => {
  it("github repo settings doc exists", () => {
    expect(existsSync(resolve(workspaceRoot, "docs/github-repo-settings.md"))).toBe(true);
  });

  it("issue templates and PR template exist", () => {
    const required = [
      ".github/ISSUE_TEMPLATE/bug_report.yml",
      ".github/ISSUE_TEMPLATE/feature_request.yml",
      ".github/ISSUE_TEMPLATE/question.yml",
      ".github/ISSUE_TEMPLATE/skill_pack_feedback.yml",
      ".github/ISSUE_TEMPLATE/config.yml",
      ".github/pull_request_template.md"
    ];
    for (const path of required) {
      expect(existsSync(resolve(workspaceRoot, path))).toBe(true);
    }
  });

  it("README and README.zh-CN keep aligned key entry sections", () => {
    const readme = read(resolve(workspaceRoot, "README.md"));
    const readmeZh = read(resolve(workspaceRoot, "README.zh-CN.md"));
    expect(readme.includes("## Quick Start")).toBe(true);
    expect(readme.includes("## Open Source Boundary")).toBe(true);
    expect(readme.includes("## vNext Direction")).toBe(true);
    expect(readme.includes("## Skill-based Demo")).toBe(true);
    expect(readme.includes("## Trace, Audit, Certification")).toBe(true);
    expect(readme.includes("## Non-goals")).toBe(true);
    expect(readme.includes("[![English]")).toBe(true);
    expect(readme.includes("[![简体中文]")).toBe(true);

    expect(readmeZh.includes("## 快速开始")).toBe(true);
    expect(readmeZh.includes("## 开源边界")).toBe(true);
    expect(readmeZh.includes("## 下一阶段方向")).toBe(true);
    expect(readmeZh.includes("## Skill-based Demo")).toBe(true);
    expect(readmeZh.includes("## Trace / Audit / Certification")).toBe(true);
    expect(readmeZh.includes("## 非目标")).toBe(true);
    expect(readmeZh.includes("[![English]")).toBe(true);
    expect(readmeZh.includes("[![简体中文]")).toBe(true);
  });

  it("README local markdown links resolve", () => {
    const targets = ["README.md", "README.zh-CN.md"];
    for (const file of targets) {
      const content = read(resolve(workspaceRoot, file));
      const links = collectMarkdownLinks(content);
      for (const href of links) {
        const target = resolve(workspaceRoot, href);
        expect(existsSync(target)).toBe(true);
      }
    }
  });

  it("release docs include new, excluded, quick commands, and limitations", () => {
    const releaseMain = read(resolve(workspaceRoot, "docs/release-notes-v0.2.0-rc.1.md"));
    const releaseMilestone = read(resolve(workspaceRoot, "docs/release-notes-skill-based-runtime.md"));
    const changelog = read(resolve(workspaceRoot, "CHANGELOG.md"));

    for (const content of [releaseMain, releaseMilestone]) {
      expect(content.includes("## What's New")).toBe(true);
      expect(content.includes("## What")).toBe(true);
      expect(content.includes("## Quick Commands")).toBe(true);
      expect(content.includes("## Known Limitations")).toBe(true);
    }
    expect(changelog.includes("## v0.2.0-rc.1")).toBe(true);
    expect(changelog.includes("### Quick Commands")).toBe(true);
  });

  it("security and gitignore include sensitive data boundaries", () => {
    const security = read(resolve(workspaceRoot, "SECURITY.md"));
    const ignore = read(resolve(workspaceRoot, ".gitignore"));

    expect(security.includes("Do not commit `.env`")).toBe(true);
    expect(security.includes("Do not commit real secrets")).toBe(true);
    expect(security.includes("demo-artifacts/")).toBe(true);

    for (const line of [".env", ".env.*", ".yutra/traces/*", ".yutra/audit/*"]) {
      expect(ignore.includes(line)).toBe(true);
    }
  });

  it("open source boundary doc and README non-goals clarify OSS/commercial split", () => {
    const boundary = read(resolve(workspaceRoot, "docs/open-source-boundary.md"));
    const readme = read(resolve(workspaceRoot, "README.md"));
    const readmeZh = read(resolve(workspaceRoot, "README.zh-CN.md"));

    expect(existsSync(resolve(workspaceRoot, "docs/open-source-boundary.md"))).toBe(true);
    expect(boundary.includes("Open-source Core")).toBe(true);
    expect(boundary.includes("Future Commercial or Private Layer")).toBe(true);
    expect(boundary.includes("MIT")).toBe(true);
    expect(boundary.includes("not legal advice")).toBe(true);

    for (const phrase of ["marketplace", "remote skill registry", "multi-tenant SaaS", "real customer API integration package"]) {
      expect(readme.includes(phrase)).toBe(true);
    }
    for (const phrase of ["Marketplace", "远程 Skill Registry", "多租户 SaaS", "真实客户 API 接入包"]) {
      expect(readmeZh.includes(phrase)).toBe(true);
    }
  });
});
