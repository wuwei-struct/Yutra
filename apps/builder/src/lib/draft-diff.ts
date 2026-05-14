import type { BuilderFormConfig } from "@yutra/builder-core";
import type { DraftDiffItem } from "../types";

function sameJson(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function compareBuilderForms(currentForm: BuilderFormConfig, draftForm: BuilderFormConfig): DraftDiffItem[] {
  const entries: DraftDiffItem[] = [
    {
      field: "agentName",
      before: currentForm.agentName,
      after: draftForm.agentName,
      changed: currentForm.agentName !== draftForm.agentName
    },
    {
      field: "selectedIntentIds",
      before: currentForm.selectedIntentIds,
      after: draftForm.selectedIntentIds,
      changed: !sameJson(currentForm.selectedIntentIds, draftForm.selectedIntentIds)
    },
    {
      field: "selectedSkillNames",
      before: currentForm.selectedSkillNames,
      after: draftForm.selectedSkillNames,
      changed: !sameJson(currentForm.selectedSkillNames, draftForm.selectedSkillNames)
    },
    {
      field: "rules",
      before: currentForm.rules,
      after: draftForm.rules,
      changed: !sameJson(currentForm.rules, draftForm.rules)
    },
    {
      field: "handoffRules",
      before: currentForm.handoffRules,
      after: draftForm.handoffRules,
      changed: !sameJson(currentForm.handoffRules, draftForm.handoffRules)
    },
    {
      field: "responseStyle",
      before: currentForm.responseStyle,
      after: draftForm.responseStyle,
      changed: currentForm.responseStyle !== draftForm.responseStyle
    },
    {
      field: "language",
      before: currentForm.language,
      after: draftForm.language,
      changed: currentForm.language !== draftForm.language
    }
  ];

  return entries.filter((entry) => entry.changed);
}
