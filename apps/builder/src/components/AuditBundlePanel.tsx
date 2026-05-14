import type { BuilderRunPreviewResponse } from "../types";

interface AuditBundlePanelProps {
  response?: BuilderRunPreviewResponse;
  onDownloadAudit: () => void;
}

export function AuditBundlePanel(props: AuditBundlePanelProps) {
  const { response, onDownloadAudit } = props;
  const bundle = response?.ok ? response.auditBundle ?? null : null;
  const run = response?.ok ? response.run : undefined;
  const eventCount = response?.ok ? response.events?.length ?? 0 : 0;
  const handoff = bundle && typeof bundle === "object" ? (bundle as Record<string, unknown>).handoffOrErrorSummary : undefined;

  return (
    <section className="panel-section" aria-label="Audit Panel">
      <h4>Audit Bundle</h4>
      {!bundle ? <p className="hint">No audit bundle.</p> : null}
      {bundle ? (
        <>
          <div>runId: {run?.runId ?? "-"}</div>
          <div>status: {run?.status ?? "-"}</div>
          <div>agent: {run?.agent ?? "-"}</div>
          <div>trace event count: {eventCount}</div>
          <div>handoff/error summary: {JSON.stringify(handoff ?? {})}</div>
          <button type="button" onClick={onDownloadAudit}>
            Download Audit JSON
          </button>
          <pre>{JSON.stringify(bundle, null, 2)}</pre>
        </>
      ) : null}
    </section>
  );
}
