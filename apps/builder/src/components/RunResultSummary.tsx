import type { BuilderRunPreviewResponse } from "../types";

interface RunResultSummaryProps {
  response: BuilderRunPreviewResponse;
}

export function RunResultSummary(props: RunResultSummaryProps) {
  const { response } = props;
  if (!response.ok || !response.run) {
    return null;
  }

  return (
    <section className="panel-section" aria-label="Run Summary">
      <h4>Run Summary</h4>
      <div>status: {response.run.status}</div>
      <div>runId: {response.run.runId}</div>
      <div>agent: {response.run.agent}</div>
      <div>matchedIntent: {response.run.matchedIntent ?? "-"}</div>
      <div>initialState: {response.run.initialState ?? "-"}</div>
      <div>finalState: {response.run.finalState ?? "-"}</div>
      <div>steps: {response.run.steps}</div>
    </section>
  );
}
