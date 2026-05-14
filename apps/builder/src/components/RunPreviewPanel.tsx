import { RunResultSummary } from "./RunResultSummary";
import { TestInputEditor } from "./TestInputEditor";
import type { BuilderRunPreviewResponse } from "../types";

interface RunPreviewPanelProps {
  sampleOptions: Array<{ id: string; label: string; input: unknown }>;
  selectedSampleId: string;
  inputJson: string;
  inputJsonError?: string;
  loading: boolean;
  errorMessage?: string;
  response?: BuilderRunPreviewResponse;
  onSampleChange: (sampleId: string) => void;
  onInputJsonChange: (value: string) => void;
  onRunPreview: () => void;
  onDownloadTrace: () => void;
}

export function RunPreviewPanel(props: RunPreviewPanelProps) {
  const {
    sampleOptions,
    selectedSampleId,
    inputJson,
    inputJsonError,
    loading,
    errorMessage,
    response,
    onSampleChange,
    onInputJsonChange,
    onRunPreview,
    onDownloadTrace
  } = props;

  return (
    <section className="preview">
      <h3>Run Preview</h3>
      <TestInputEditor
        samples={sampleOptions}
        selectedSampleId={selectedSampleId}
        jsonText={inputJson}
        jsonError={inputJsonError}
        onSampleChange={onSampleChange}
        onJsonTextChange={onInputJsonChange}
      />
      <button type="button" onClick={onRunPreview} disabled={loading}>
        {loading ? "Running..." : "Run Preview"}
      </button>
      <button type="button" onClick={onDownloadTrace} disabled={!response?.ok || !response.traceJsonl}>
        Download Trace JSONL
      </button>
      {errorMessage ? <p className="error-text">{errorMessage}</p> : null}
      {response ? <RunResultSummary response={response} /> : null}
    </section>
  );
}
