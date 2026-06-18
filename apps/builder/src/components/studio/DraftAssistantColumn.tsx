import { AgentBasicsForm } from "../AgentBasicsForm";
import { AiDraftPanel } from "../AiDraftPanel";
import { IntentSelector } from "../IntentSelector";
import { RulesForm } from "../RulesForm";
import { SkillSelector } from "../SkillSelector";
import { TemplateSelector } from "../TemplateSelector";
import { CreatorWorkbenchPanel } from "../creator/CreatorWorkbenchPanel";
import { BUILDER_TEMPLATES } from "../../lib/builder-state";
import { toggleSelection, type StudioStateController } from "../../lib/studio-state";
import { useI18n } from "../../i18n";

interface DraftAssistantColumnProps {
  studio: StudioStateController;
}

export function DraftAssistantColumn(props: DraftAssistantColumnProps) {
  const { studio } = props;
  const { formState, selectedTemplate, preview, firstUiWarning, setFormState } = studio;
  const { t } = useI18n();

  return (
    <section className="studio-column draft-column" aria-label="Draft Assistant Column">
      <CreatorWorkbenchPanel
        onSendCompiledDslToEditor={(dslText, meta) => studio.sendCompiledDslToEditor(dslText, meta)}
      />
      <div className="panel-title">
        <h2>{t("draft.title")}</h2>
        <span>{t("draft.providerDefault")}</span>
      </div>
      <AiDraftPanel currentForm={preview.formConfig} template={selectedTemplate} onApplyDraft={studio.applyDraftForm} defaultOpen />

      <section className="panel-section compact-config" aria-label="Structured Builder Config">
        <h3>{t("draft.structuredConfig")}</h3>
        <TemplateSelector
          templates={[...BUILDER_TEMPLATES]}
          selectedTemplateId={formState.templateId}
          onChange={(templateId) => setFormState((prev) => ({ ...prev, templateId }))}
        />
        <AgentBasicsForm state={formState} onChange={(patch) => setFormState((prev) => ({ ...prev, ...patch }))} />
        <IntentSelector
          intents={selectedTemplate.supportedIntents}
          selectedIntentIds={formState.selectedIntentIds}
          onToggle={(intentId, checked) =>
            setFormState((prev) => ({
              ...prev,
              selectedIntentIds: toggleSelection(prev.selectedIntentIds, intentId, checked)
            }))
          }
        />
        <SkillSelector
          skills={selectedTemplate.availableSkills}
          selectedSkillNames={formState.selectedSkillNames}
          warning={firstUiWarning}
          onToggle={(skillName, checked) =>
            setFormState((prev) => ({
              ...prev,
              selectedSkillNames: toggleSelection(prev.selectedSkillNames, skillName, checked)
            }))
          }
        />
        <RulesForm rules={formState.rules} onChange={(rules) => setFormState((prev) => ({ ...prev, rules }))} />
      </section>
    </section>
  );
}
