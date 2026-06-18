import { compilePackConfig } from "@yutra/rule-compiler";
import type { CreatorCompilePreviewRequest, CreatorCompilePreviewResponse } from "./types";

export function buildCreatorCompilePreview(request: CreatorCompilePreviewRequest): CreatorCompilePreviewResponse {
  const locale = request.locale ?? (request.config.locale === "zh-CN" ? "zh-CN" : "en");
  const output = compilePackConfig({
    config: request.config,
    mode: request.mode ?? "preview",
    locale
  });

  if (!output.ok || !output.artifacts) {
    const firstIssue = output.issues[0];
    return {
      ok: false,
      error: {
        code: firstIssue?.code ?? "CREATOR_COMPILE_FAILED",
        message: firstIssue?.message ?? "Creator compile preview failed."
      },
      issues: output.issues,
      report: output.report
    };
  }

  return {
    ok: true,
    compileId: output.compileId,
    compilerVersion: output.compilerVersion,
    mode: output.mode,
    artifacts: output.artifacts,
    report: output.report,
    issues: output.issues
  };
}
