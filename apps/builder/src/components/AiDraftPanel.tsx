import {
  explainFlowDraft,
  flowDraftToBuilderFormConfig,
  mockAiDraftProvider,
  naturalLanguageBriefSchema,
  tagSelectionSchema,
  validateFlowDraft
} from "@yutra/builder-ai-core";
import type { AgentTemplateConfig, BuilderFormConfig } from "@yutra/builder-core";
import { useMemo, useState } from "react";
import type { AiDraftUiState } from "../types";
import { generateDraftPreview } from "../lib/ai-draft-client";
import { CapabilityTagSelector } from "./CapabilityTagSelector";
import { DraftApplyPreview } from "./DraftApplyPreview";
import { DraftWarningsPanel } from "./DraftWarningsPanel";
import { FlowDraftExplanation } from "./FlowDraftExplanation";
import { FlowDraftPreview } from "./FlowDraftPreview";
import { NaturalLanguageBriefEditor } from "./NaturalLanguageBriefEditor";
import { ScenarioTagSelector } from "./ScenarioTagSelector";
import { StrategyTagSelector } from "./StrategyTagSelector";
import { toReadableIssues } from "../lib/ai-draft-formatters";
import { compareBuilderForms } from "../lib/draft-diff";
import {
  aiDraftScenarioOptions,
  capabilityTagOptions,
  defaultAiDraftState,
  strategyTagOptions,
  toggleTag
} from "../lib/ai-draft-state";
import { useI18n } from "../i18n";

interface AiDraftPanelProps {
  currentForm: BuilderFormConfig;
  template: AgentTemplateConfig;
  onApplyDraft: (form: BuilderFormConfig) => void;
  defaultOpen?: boolean;
}

export function AiDraftPanel(props: AiDraftPanelProps) {
  const { currentForm, template, onApplyDraft } = props;
  const { t } = useI18n();
  const [open, setOpen] = useState<boolean>(props.defaultOpen ?? false);
  const [state, setState] = useState<AiDraftUiState>(defaultAiDraftState);

  const warningList = useMemo(() => {
    const result: string[] = [];
    if (state.draft?.warnings) {
      result.push(...state.draft.warnings);
    }
    if (state.validation?.issues) {
      result.push(...toReadableIssues(state.validation.issues.filter((item) => item.severity === "warning")));
    }
    return result;
  }, [state.draft?.warnings, state.validation?.issues]);

  const onGenerateDraft = async () => {
    setState((prev) => ({ ...prev, generating: true, errorMessage: undefined, applyMessage: undefined }));
    try {
      const parsedTags = tagSelectionSchema.safeParse({
        scenario: state.scenario,
        capabilities: state.capabilities,
        strategies: state.strategies,
        language: "zh-CN"
      });
      if (!parsedTags.success) {
        setState((prev) => ({
          ...prev,
          generating: false,
          errorMessage: parsedTags.error.issues[0]?.message ?? "Tag selection is invalid."
        }));
        return;
      }

      const parsedBrief = naturalLanguageBriefSchema.safeParse({
        text: state.briefText,
        locale: "zh-CN"
      });
      if (!parsedBrief.success) {
        setState((prev) => ({
          ...prev,
          generating: false,
          errorMessage: parsedBrief.error.issues[0]?.message ?? "Brief is invalid."
        }));
        return;
      }

      if (state.scenario !== "ecommerce_support") {
        setState((prev) => ({
          ...prev,
          generating: false,
          errorMessage: "Selected scenario is coming later. Use ecommerce_support for now."
        }));
        return;
      }

      if (state.providerMode === "real") {
        const preview = await generateDraftPreview({
          providerMode: "real",
          tags: parsedTags.data,
          brief: parsedBrief.data
        });
        if (!preview.ok || !preview.draft || !preview.validation || !preview.explanation || !preview.draftForm) {
          throw new Error(preview.error?.message ?? "Real provider draft generation failed.");
        }
        const draftForm = preview.draftForm;
        setState((prev) => ({
          ...prev,
          generating: false,
          draft: preview.draft,
          validation: preview.validation,
          explanation: preview.explanation,
          draftForm,
          diff: compareBuilderForms(currentForm, draftForm)
        }));
      } else {
        const draft = await mockAiDraftProvider({
          tags: parsedTags.data,
          brief: parsedBrief.data,
          template
        });
        const validation = validateFlowDraft(draft, template);
        const explanation = explainFlowDraft(draft);
        const draftForm = flowDraftToBuilderFormConfig(draft, template);
        const diff = compareBuilderForms(currentForm, draftForm);
        setState((prev) => ({
          ...prev,
          generating: false,
          draft,
          validation,
          explanation,
          draftForm,
          diff
        }));
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        generating: false,
        errorMessage: error instanceof Error ? error.message : "Draft generation failed."
      }));
    }
  };

  const onApply = () => {
    if (!state.draftForm) {
      return;
    }
    onApplyDraft(state.draftForm);
    setState((prev) => ({
      ...prev,
      applyMessage: "Draft applied to Builder form. Please review Validation and run preview manually."
    }));
  };

  return (
    <section className="panel-section" aria-label="AI Draft Assistant">
      <div className="tabs">
        <button type="button" onClick={() => setOpen((prev) => !prev)}>
          {open ? t("draft.hideAssistant") : t("draft.showAssistant")}
        </button>
      </div>
      {!open ? <p className="hint">{t("draft.optional")}</p> : null}
      {open ? (
        <>
          <ScenarioTagSelector
            options={[...aiDraftScenarioOptions]}
            value={state.scenario}
            onChange={(value) => setState((prev) => ({ ...prev, scenario: value as AiDraftUiState["scenario"] }))}
          />
          <CapabilityTagSelector
            options={[...capabilityTagOptions]}
            selectedValues={state.capabilities}
            onToggle={(value, checked) =>
              setState((prev) => ({ ...prev, capabilities: toggleTag(prev.capabilities, value, checked) }))
            }
          />
          <StrategyTagSelector
            options={[...strategyTagOptions]}
            selectedValues={state.strategies}
            onToggle={(value, checked) =>
              setState((prev) => ({ ...prev, strategies: toggleTag(prev.strategies, value, checked) }))
            }
          />
          <NaturalLanguageBriefEditor value={state.briefText} onChange={(briefText) => setState((prev) => ({ ...prev, briefText }))} />
          <section className="panel-section" aria-label="Provider Mode">
            <h4>{t("draft.providerMode")}</h4>
            <label className="field">
              <span>{t("draft.provider")}</span>
              <select
                aria-label="AI Draft Provider Mode"
                value={state.providerMode}
                onChange={(event) => setState((prev) => ({ ...prev, providerMode: event.target.value as "mock" | "real" }))}
              >
                <option value="mock">{t("draft.mockProvider")}</option>
                <option value="real">{t("draft.realProvider")}</option>
              </select>
            </label>
            {state.providerMode === "real" ? (
              <p className="hint">{t("draft.realProviderHint")}</p>
            ) : null}
          </section>
          <button type="button" aria-label="Generate Draft" disabled={state.generating} onClick={() => void onGenerateDraft()}>
            {state.generating ? t("draft.generating") : t("draft.generate")}
          </button>
          {state.errorMessage ? <p className="error-text">{state.errorMessage}</p> : null}
          <FlowDraftPreview draft={state.draft} />
          <FlowDraftExplanation text={state.explanation} />
          <DraftWarningsPanel warnings={warningList} />
          <DraftApplyPreview changes={state.diff ?? []} canApply={Boolean(state.draftForm)} applyMessage={state.applyMessage} onApply={onApply} />
        </>
      ) : null}
    </section>
  );
}
