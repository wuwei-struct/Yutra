import { useMemo, useState } from "react";
import type { BuilderFormConfig } from "@yutra/builder-core";
import { AiDraftPanel } from "./components/AiDraftPanel";
import { AgentBasicsForm } from "./components/AgentBasicsForm";
import { AuditBundlePanel } from "./components/AuditBundlePanel";
import { IntentSelector } from "./components/IntentSelector";
import { PreviewTabs } from "./components/PreviewTabs";
import { RunPreviewPanel } from "./components/RunPreviewPanel";
import { RulesForm } from "./components/RulesForm";
import { SkillSelector } from "./components/SkillSelector";
import { TemplateSelector } from "./components/TemplateSelector";
import { TraceEventDetail } from "./components/TraceEventDetail";
import { TraceTimeline } from "./components/TraceTimeline";
import { collectPreviewIssues, prettyJson } from "./lib/formatters";
import { BUILDER_TEMPLATES, generateBuilderPreview } from "./lib/builder-state";
import { runPreview } from "./lib/runner-client";
import { runPreviewSamples } from "./lib/run-samples";
import { defaultBuilderUiState } from "./lib/sample-form";
import type { BuilderRunPreviewResponse, BuilderUiState } from "./types";
import { mapDraftFormToRuleValues } from "./lib/ai-draft-formatters";

function toggleSelection(values: string[], item: string, checked: boolean): string[] {
  if (checked) {
    return values.includes(item) ? values : [...values, item];
  }
  return values.filter((value) => value !== item);
}

function copyText(content: string): Promise<boolean> {
  if (typeof navigator === "undefined" || !navigator.clipboard || typeof navigator.clipboard.writeText !== "function") {
    return Promise.resolve(false);
  }
  return navigator.clipboard
    .writeText(content)
    .then(() => true)
    .catch(() => false);
}

function downloadTextAsFile(fileName: string, content: string): void {
  const blob = new Blob([content], { type: "application/octet-stream;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

function applyFormToUiState(draftForm: BuilderFormConfig, prev: BuilderUiState): BuilderUiState {
  return {
    ...prev,
    templateId: draftForm.templateId,
    agentName: draftForm.agentName,
    version: draftForm.version ?? prev.version,
    selectedIntentIds: [...draftForm.selectedIntentIds],
    selectedSkillNames: [...draftForm.selectedSkillNames],
    responseStyle: draftForm.responseStyle ?? prev.responseStyle,
    language: draftForm.language ?? prev.language,
    rules: mapDraftFormToRuleValues(draftForm, prev.rules),
    handoffRules: draftForm.handoffRules
  };
}

export default function App() {
  const [state, setState] = useState<BuilderUiState>(defaultBuilderUiState);
  const [copyMessage, setCopyMessage] = useState<string>("");
  const [selectedSampleId, setSelectedSampleId] = useState<string>(runPreviewSamples[0]?.id ?? "shippingCase");
  const [inputJson, setInputJson] = useState<string>(JSON.stringify(runPreviewSamples[0]?.input ?? { context: {} }, null, 2));
  const [inputJsonError, setInputJsonError] = useState<string>("");
  const [runLoading, setRunLoading] = useState<boolean>(false);
  const [runError, setRunError] = useState<string>("");
  const [runResponse, setRunResponse] = useState<BuilderRunPreviewResponse | undefined>(undefined);
  const [selectedEventIndex, setSelectedEventIndex] = useState<number>(0);
  const selectedTemplate = BUILDER_TEMPLATES.find((item) => item.templateId === state.templateId) ?? BUILDER_TEMPLATES[0];

  const preview = useMemo(() => generateBuilderPreview(state), [state]);
  const issueList = useMemo(() => collectPreviewIssues(preview), [preview]);
  const validationOk = issueList.every((item) => item.severity !== "error");
  const specJson = preview.spec ? prettyJson(preview.spec) : prettyJson({ error: "AgentSpec generation failed.", issues: issueList });
  const dslText = preview.dsl ?? "生成失败，请先修复左侧配置问题。";
  const firstUiWarning = preview.uiWarnings[0];
  const selectedEvent =
    runResponse?.ok && runResponse.events && runResponse.events.length > 0 ? runResponse.events[selectedEventIndex] : undefined;

  const onRunPreview = async () => {
    setRunLoading(true);
    setRunError("");
    setInputJsonError("");
    try {
      const parsed = JSON.parse(inputJson) as { context?: Record<string, unknown>; intent?: string; text?: string };
      const response = await runPreview({
        form: preview.formConfig,
        input: parsed,
        options: {
          skillsDir: "examples/ecommerce-support/skills",
          trace: true
        }
      });
      setRunResponse(response);
      setSelectedEventIndex(0);
      if (!response.ok) {
        setRunError(response.error?.message ?? "Run preview failed.");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Run preview failed.";
      if (message.includes("JSON")) {
        setInputJsonError("Invalid JSON input.");
      } else {
        setRunError(message);
      }
    } finally {
      setRunLoading(false);
    }
  };

  return (
    <div className="builder-page">
      <header className="builder-header">
        <h1>Yutra Agent Builder</h1>
        <p>Build a Skill-based Agent from templates, skills, and rules.</p>
      </header>

      <main className="builder-layout">
        <section className="left-panel">
          <AiDraftPanel
            currentForm={preview.formConfig}
            template={selectedTemplate}
            onApplyDraft={(draftForm) => {
              setState((prev) => applyFormToUiState(draftForm, prev));
            }}
          />
          <TemplateSelector
            templates={[...BUILDER_TEMPLATES]}
            selectedTemplateId={state.templateId}
            onChange={(templateId) => setState((prev) => ({ ...prev, templateId }))}
          />
          <AgentBasicsForm state={state} onChange={(patch) => setState((prev) => ({ ...prev, ...patch }))} />
          <IntentSelector
            intents={selectedTemplate.supportedIntents}
            selectedIntentIds={state.selectedIntentIds}
            onToggle={(intentId, checked) =>
              setState((prev) => ({
                ...prev,
                selectedIntentIds: toggleSelection(prev.selectedIntentIds, intentId, checked)
              }))
            }
          />
          <SkillSelector
            skills={selectedTemplate.availableSkills}
            selectedSkillNames={state.selectedSkillNames}
            warning={firstUiWarning}
            onToggle={(skillName, checked) =>
              setState((prev) => ({
                ...prev,
                selectedSkillNames: toggleSelection(prev.selectedSkillNames, skillName, checked)
              }))
            }
          />
          <RulesForm rules={state.rules} onChange={(rules) => setState((prev) => ({ ...prev, rules }))} />
        </section>

        <section className="right-panel">
          <PreviewTabs
            specJson={specJson}
            dslText={dslText}
            issues={issueList}
            uiWarnings={preview.uiWarnings}
            ok={validationOk}
            copyMessage={copyMessage}
            onCopySpec={() => {
              void copyText(specJson).then((ok) =>
                setCopyMessage(ok ? "Copied AgentSpec JSON." : "Clipboard not available in this browser.")
              );
            }}
            onCopyDsl={() => {
              void copyText(dslText).then((ok) =>
                setCopyMessage(ok ? "Copied Chinese DSL." : "Clipboard not available in this browser.")
              );
            }}
          />
          <RunPreviewPanel
            sampleOptions={[...runPreviewSamples]}
            selectedSampleId={selectedSampleId}
            inputJson={inputJson}
            inputJsonError={inputJsonError}
            loading={runLoading}
            errorMessage={runError}
            response={runResponse}
            onSampleChange={(sampleId) => {
              setSelectedSampleId(sampleId);
              const sample = runPreviewSamples.find((item) => item.id === sampleId);
              setInputJson(JSON.stringify(sample?.input ?? { context: {} }, null, 2));
              setInputJsonError("");
            }}
            onInputJsonChange={(value) => {
              setInputJson(value);
              setInputJsonError("");
            }}
            onRunPreview={() => {
              void onRunPreview();
            }}
            onDownloadTrace={() => {
              if (runResponse?.ok && runResponse.traceJsonl) {
                downloadTextAsFile("yutra-trace-preview.jsonl", runResponse.traceJsonl);
              }
            }}
          />
          <TraceTimeline response={runResponse} selectedIndex={selectedEventIndex} onSelect={setSelectedEventIndex} />
          <TraceEventDetail event={selectedEvent as Record<string, unknown> | undefined} />
          <AuditBundlePanel
            response={runResponse}
            onDownloadAudit={() => {
              if (runResponse?.ok && runResponse.auditBundle) {
                downloadTextAsFile("yutra-audit-preview.json", JSON.stringify(runResponse.auditBundle, null, 2));
              }
            }}
          />
        </section>
      </main>
    </div>
  );
}
