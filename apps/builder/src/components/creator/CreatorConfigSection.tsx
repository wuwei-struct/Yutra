import type { PackConfig } from "@yutra/pack-config-core";
import { ApprovalDecisionConfigEditor } from "./ApprovalDecisionConfigEditor";
import { KnowledgeAnsweringConfigEditor } from "./KnowledgeAnsweringConfigEditor";
import { RequestResolutionConfigEditor } from "./RequestResolutionConfigEditor";

export function CreatorConfigSection(props: {
  config: PackConfig;
  onChange: (config: PackConfig) => void;
  onSelectImpact: (fieldPath: string) => void;
}) {
  if (props.config.archetypeId === "approval-decision") {
    return <ApprovalDecisionConfigEditor config={props.config} onChange={props.onChange} onSelectImpact={props.onSelectImpact} />;
  }
  if (props.config.archetypeId === "knowledge-answering") {
    return <KnowledgeAnsweringConfigEditor config={props.config} onChange={props.onChange} onSelectImpact={props.onSelectImpact} />;
  }
  if (props.config.archetypeId === "request-resolution") {
    return <RequestResolutionConfigEditor config={props.config} onChange={props.onChange} onSelectImpact={props.onSelectImpact} />;
  }
  return null;
}
