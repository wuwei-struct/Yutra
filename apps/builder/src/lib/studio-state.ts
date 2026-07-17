import { useEffect, useMemo, useRef, useState } from "react";
import type { BuilderFormConfig } from "@yutra/builder-core";
import type { BuilderDslInspectResponse, BuilderRunPreviewResponse, BuilderUiState, RunPreviewEvidence } from "../types";
import { mapDraftFormToRuleValues } from "./ai-draft-formatters";
import { BUILDER_TEMPLATES, generateBuilderPreview } from "./builder-state";
import { collectPreviewIssues, prettyJson } from "./formatters";
import { runPreviewSamples } from "./run-samples";
import { inspectDsl, runPreview } from "./runner-client";
import { defaultBuilderUiState } from "./sample-form";

export type StudioNavItem =
  | "dashboard"
  | "my-agent"
  | "scenario-composition"
  | "templates"
  | "packs"
  | "tools"
  | "knowledge"
  | "runs"
  | "traces"
  | "env"
  | "docs";

export type StudioTabState = {
  dsl: "dsl" | "json" | "flow";
  inspect: "validation" | "normalized" | "canonical" | "overview" | "flow";
  trace: "timeline" | "state" | "event" | "context" | "logs";
};

export type StudioRunOptions = {
  environment: "mock" | "demo" | "prod-like";
  llmProvider: "mock" | "real";
  maxDurationMs: number;
  maxExternalCalls: number;
  timeoutMs: number;
  retryAttempts: number;
};

export type StudioSourceMode = "builder" | "dsl";

export type CompiledDslMeta = {
  sourceKind?: "creator_compile" | "scenario_slot";
  compileId?: string;
  compilerVersion?: string;
  configHash?: string;
  artifactHash?: string;
  compositionId?: string;
  slotId?: string;
  archetypeId?: string;
  singleSlotOnly?: boolean;
  sentAt: string;
  inspected: boolean;
};

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

export function toggleSelection(values: string[], item: string, checked: boolean): string[] {
  if (checked) {
    return values.includes(item) ? values : [...values, item];
  }
  return values.filter((value) => value !== item);
}

export function copyText(content: string): Promise<boolean> {
  if (typeof navigator === "undefined" || !navigator.clipboard || typeof navigator.clipboard.writeText !== "function") {
    return Promise.resolve(false);
  }
  return navigator.clipboard
    .writeText(content)
    .then(() => true)
    .catch(() => false);
}

export function downloadTextAsFile(fileName: string, content: string): void {
  const blob = new Blob([content], { type: "application/octet-stream;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

export function useStudioState() {
  const [navItem, setNavItem] = useState<StudioNavItem>("my-agent");
  const [formState, setFormState] = useState<BuilderUiState>(defaultBuilderUiState);
  const [tabs, setTabs] = useState<StudioTabState>({ dsl: "dsl", inspect: "validation", trace: "timeline" });
  const [copyMessage, setCopyMessage] = useState<string>("");
  const [dslBuffer, setDslBuffer] = useState<string>("");
  const [dslDirty, setDslDirty] = useState<boolean>(false);
  const [dslInspectResult, setDslInspectResult] = useState<BuilderDslInspectResponse | undefined>(undefined);
  const [dslInspectLoading, setDslInspectLoading] = useState<boolean>(false);
  const [dslApplied, setDslApplied] = useState<boolean>(false);
  const [compiledDslMeta, setCompiledDslMeta] = useState<CompiledDslMeta | undefined>(undefined);
  const [sourceMode, setSourceMode] = useState<StudioSourceMode>("builder");
  const [lastValidDslSpec, setLastValidDslSpec] = useState<unknown>(undefined);
  const [builderChangedWhileDslActive, setBuilderChangedWhileDslActive] = useState<boolean>(false);
  const [selectedSampleId, setSelectedSampleId] = useState<string>(runPreviewSamples[0]?.id ?? "shippingCase");
  const [inputJson, setInputJson] = useState<string>(JSON.stringify(runPreviewSamples[0]?.input ?? { context: {} }, null, 2));
  const [inputJsonError, setInputJsonError] = useState<string>("");
  const [runLoading, setRunLoading] = useState<boolean>(false);
  const [runError, setRunError] = useState<string>("");
  const [runResponse, setRunResponse] = useState<BuilderRunPreviewResponse | undefined>(undefined);
  const [runPreviewEvidence, setRunPreviewEvidence] = useState<RunPreviewEvidence | undefined>(undefined);
  const [selectedEventIndex, setSelectedEventIndex] = useState<number>(0);
  const [runOptions, setRunOptions] = useState<StudioRunOptions>({
    environment: "mock",
    llmProvider: "mock",
    maxDurationMs: 15000,
    maxExternalCalls: 10,
    timeoutMs: 5000,
    retryAttempts: 1
  });

  const selectedTemplate = BUILDER_TEMPLATES.find((item) => item.templateId === formState.templateId) ?? BUILDER_TEMPLATES[0];
  const preview = useMemo(() => generateBuilderPreview(formState), [formState]);
  const issueList = useMemo(() => collectPreviewIssues(preview), [preview]);
  const validationOk = issueList.every((item) => item.severity !== "error");
  const specJson = preview.spec ? prettyJson(preview.spec) : prettyJson({ error: "AgentSpec generation failed.", issues: issueList });
  const generatedDsl = preview.dsl ?? "DSL generation failed. Fix Builder configuration issues first.";
  const firstUiWarning = preview.uiWarnings[0];
  const selectedEvent =
    runResponse?.ok && runResponse.events && runResponse.events.length > 0 ? runResponse.events[selectedEventIndex] : undefined;

  const previousGeneratedDsl = useRef<string>("");
  useEffect(() => {
    if (!previousGeneratedDsl.current) {
      previousGeneratedDsl.current = generatedDsl;
      setDslBuffer(generatedDsl);
      return;
    }

    if (previousGeneratedDsl.current === generatedDsl) {
      return;
    }

    previousGeneratedDsl.current = generatedDsl;
    if (sourceMode === "builder") {
      setDslBuffer(generatedDsl);
      setDslDirty(false);
      setDslInspectResult(undefined);
      setLastValidDslSpec(undefined);
      setBuilderChangedWhileDslActive(false);
      return;
    }

    setBuilderChangedWhileDslActive(true);
  }, [generatedDsl, sourceMode]);

  const updateDslBuffer = (value: string) => {
    setDslBuffer(value);
    setDslDirty(value !== generatedDsl);
    setDslInspectResult(undefined);
    setLastValidDslSpec(undefined);
    setDslApplied(false);
    setCompiledDslMeta(undefined);
    setRunPreviewEvidence((prev) =>
      prev && prev.status !== "none"
        ? {
            ...prev,
            status: "stale",
            capturedAt: new Date().toISOString(),
            reason: "DSL changed after run evidence was captured."
          }
        : prev
    );
  };

  const inspectCurrentDsl = async () => {
    setDslInspectLoading(true);
    setRunError("");
    try {
      const result = await inspectDsl(dslBuffer, "yaml");
      setDslInspectResult(result);
      if (result.ok && result.validation.ok) {
        setLastValidDslSpec(result.canonical);
        setCompiledDslMeta((prev) => (prev ? { ...prev, inspected: true } : prev));
      }
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : "DSL inspect failed.";
      const result: BuilderDslInspectResponse = {
        ok: false,
        error: { code: "DSL_INSPECT_CLIENT_ERROR", message },
        validation: {
          ok: false,
          issues: [{ code: "DSL_INSPECT_CLIENT_ERROR", severity: "error", message }]
        }
      };
      setDslInspectResult(result);
      return result;
    } finally {
      setDslInspectLoading(false);
    }
  };

  const applyDslAsRunSource = async () => {
    const result = dslInspectResult?.ok && dslInspectResult.validation.ok ? dslInspectResult : await inspectCurrentDsl();
    if (!result.ok || !result.validation.ok) {
      setRunError("Apply DSL requires a successful inspect.");
      return false;
    }

    setLastValidDslSpec(result.canonical);
    setSourceMode("dsl");
    setDslApplied(true);
    setBuilderChangedWhileDslActive(false);
    return true;
  };

  const resetDslFromBuilder = () => {
    setDslBuffer(generatedDsl);
    setDslDirty(false);
    setDslInspectResult(undefined);
    setLastValidDslSpec(undefined);
    setSourceMode("builder");
    setDslApplied(false);
    setCompiledDslMeta(undefined);
    setRunPreviewEvidence(undefined);
    setBuilderChangedWhileDslActive(false);
    setRunError("");
  };

  const sendCompiledDslToEditor = (
    dslText: string,
    meta?: {
      sourceKind?: "creator_compile" | "scenario_slot";
      compileId?: string;
      compilerVersion?: string;
      configHash?: string;
      artifactHash?: string;
      compositionId?: string;
      slotId?: string;
      archetypeId?: string;
      singleSlotOnly?: boolean;
    }
  ) => {
    setDslBuffer(dslText);
    setDslDirty(true);
    setDslInspectResult(undefined);
    setLastValidDslSpec(undefined);
    setDslApplied(false);
    setCompiledDslMeta({
      sourceKind: meta?.sourceKind ?? "creator_compile",
      ...meta,
      sentAt: new Date().toISOString(),
      inspected: false
    });
    setRunPreviewEvidence((prev) =>
      prev && prev.status !== "none"
        ? {
            ...prev,
            status: "stale",
            capturedAt: new Date().toISOString(),
            reason: "Compiled DSL was sent to the editor after run evidence was captured."
          }
        : prev
    );
    setRunError("Compiled DSL sent to editor. Inspect it before using as run source.");
  };

  const recordRunPreviewEvidence = (response: BuilderRunPreviewResponse) => {
    const eventCount = response.events?.length ?? 0;
    const runId = response.run?.runId;
    const hasTraceEvents = eventCount > 0;
    const hasAuditBundle = Boolean(response.auditBundle);
    const inspected = Boolean(dslInspectResult?.ok && dslInspectResult.validation.ok);
    const canTrustManualDslRun =
      sourceMode === "dsl" && inspected && response.ok && Boolean(runId) && hasTraceEvents && Boolean(compiledDslMeta ?? lastValidDslSpec);

    setRunPreviewEvidence({
      status: canTrustManualDslRun ? "ready" : response.ok ? "failed" : "failed",
      runId,
      runStatus: response.run?.status ?? response.error?.code,
      sourceMode,
      capturedAt: new Date().toISOString(),
      eventCount,
      hasTraceEvents,
      hasAuditBundle,
      compiledDsl: compiledDslMeta
        ? {
            compileId: compiledDslMeta.compileId,
            compilerVersion: compiledDslMeta.compilerVersion,
            configHash: compiledDslMeta.configHash,
            artifactHash: compiledDslMeta.artifactHash,
            inspected: compiledDslMeta.inspected
          }
        : undefined,
      reason: canTrustManualDslRun
        ? undefined
        : response.error?.message ??
          (sourceMode !== "dsl"
            ? "Builder source Run Preview does not count as compiled DSL readiness evidence."
            : !inspected
              ? "DSL was not inspected successfully before Run Preview evidence capture."
              : !runId
                ? "Run Preview did not return a runId."
                : !hasTraceEvents
                  ? "Run Preview did not return trace events."
                  : "Run Preview evidence is incomplete.")
    });
  };

  const runCurrentPreview = async () => {
    setRunLoading(true);
    setRunError("");
    setInputJsonError("");
    try {
      const parsed = JSON.parse(inputJson) as { context?: Record<string, unknown>; intent?: string; text?: string };
      if (sourceMode === "dsl" && !lastValidDslSpec) {
        throw new Error("DSL source must be inspected successfully before running.");
      }
      if (compiledDslMeta && !compiledDslMeta.inspected) {
        throw new Error("Compiled DSL must be inspected before running.");
      }
      const response = await runPreview(
        sourceMode === "dsl"
          ? {
              sourceMode: "dsl",
              dslText: dslBuffer,
              format: "yaml",
              input: parsed,
              options: {
                skillsDir: "examples/ecommerce-support/skills",
                trace: true
              }
            }
          : {
              sourceMode: "builder",
              form: preview.formConfig,
              input: parsed,
              options: {
                skillsDir: "examples/ecommerce-support/skills",
                trace: true
              }
            }
      );
      setRunResponse(response);
      setSelectedEventIndex(0);
      recordRunPreviewEvidence(response);
      if (!response.ok) {
        setRunError(response.error?.message ?? "Run preview failed.");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Run preview failed.";
      if (message.includes("JSON")) {
        setInputJsonError("Invalid JSON input.");
      } else {
        setRunError(message);
        setRunPreviewEvidence({
          status: "failed",
          sourceMode,
          capturedAt: new Date().toISOString(),
          hasTraceEvents: false,
          hasAuditBundle: false,
          compiledDsl: compiledDslMeta
            ? {
                compileId: compiledDslMeta.compileId,
                compilerVersion: compiledDslMeta.compilerVersion,
                configHash: compiledDslMeta.configHash,
                artifactHash: compiledDslMeta.artifactHash,
                inspected: compiledDslMeta.inspected
              }
            : undefined,
          reason: message
        });
      }
    } finally {
      setRunLoading(false);
    }
  };

  return {
    navItem,
    setNavItem,
    formState,
    setFormState,
    tabs,
    setTabs,
    copyMessage,
    setCopyMessage,
    dslBuffer,
    setDslBuffer: updateDslBuffer,
    dslDirty,
    dslInspectResult,
    dslInspectLoading,
    dslApplied,
    compiledDslMeta,
    sourceMode,
    setSourceMode,
    lastValidDslSpec,
    builderChangedWhileDslActive,
    selectedSampleId,
    setSelectedSampleId,
    inputJson,
    setInputJson,
    inputJsonError,
    setInputJsonError,
    runLoading,
    runError,
    runResponse,
    runPreviewEvidence,
    selectedEventIndex,
    setSelectedEventIndex,
    runOptions,
    setRunOptions,
    selectedTemplate,
    preview,
    issueList,
    validationOk,
    specJson,
    generatedDsl,
    firstUiWarning,
    selectedEvent,
    sampleOptions: [...runPreviewSamples],
    applyDraftForm: (draftForm: BuilderFormConfig) => setFormState((prev) => applyFormToUiState(draftForm, prev)),
    inspectCurrentDsl,
    applyDslAsRunSource,
    resetDslFromBuilder,
    sendCompiledDslToEditor,
    runCurrentPreview,
    resetRunInput: () => {
      const sample = runPreviewSamples.find((item) => item.id === selectedSampleId) ?? runPreviewSamples[0];
      setInputJson(JSON.stringify(sample?.input ?? { context: {} }, null, 2));
      setInputJsonError("");
      setRunError("");
    }
  };
}

export type StudioStateController = ReturnType<typeof useStudioState>;
