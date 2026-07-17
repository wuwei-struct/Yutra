import type { ScenarioLocalizedText } from "../../types";
import type { StudioLocale } from "../../i18n";

export const COMPOSITION_ARTIFACT_FILENAMES = [
  "composition.manifest.json",
  "composition.routes.json",
  "composition.bindings.json",
  "composition.overlays.json",
  "composition.precedence.json",
  "composition.slot-index.json",
  "composition-report.json"
] as const;

export const SLOT_ARTIFACT_FILENAMES = [
  "agent.yutra.yaml",
  "policy.yaml",
  "adapter.config.json",
  "templates.json",
  "test-cases.json",
  "trace.expectation.json"
] as const;

export function localized(value: ScenarioLocalizedText, locale: StudioLocale): string {
  return locale === "zh-CN" ? value.zhCN : value.en;
}

export function readinessClass(status: string): string {
  if (status === "compile_ready") return "ok";
  if (status === "invalid") return "blocked";
  return "warning";
}

export function scopeLabel(scope: { type: string; slotId?: string; routeId?: string }): string {
  if (scope.type === "slot") return `slot:${scope.slotId ?? "-"}`;
  if (scope.type === "route") return `route:${scope.routeId ?? "-"}`;
  return "scenario";
}
