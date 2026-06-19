import type { PackConfig } from "@yutra/pack-config-core";
import { ApprovalDecisionConfigEditor } from "./ApprovalDecisionConfigEditor";
import { RequestResolutionConfigEditor } from "./RequestResolutionConfigEditor";

export function CreatorConfigSection(props: {
  config: PackConfig;
  onChange: (config: PackConfig) => void;
  onSelectImpact: (fieldPath: string) => void;
}) {
  return props.config.archetypeId === "approval-decision" ? (
    <ApprovalDecisionConfigEditor config={props.config} onChange={props.onChange} onSelectImpact={props.onSelectImpact} />
  ) : (
    <RequestResolutionConfigEditor config={props.config} onChange={props.onChange} onSelectImpact={props.onSelectImpact} />
  );
}
