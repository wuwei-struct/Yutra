import type { BuilderRunPreviewResponse } from "../types";
import { useI18n } from "../i18n";

interface AuditBundlePanelProps {
  response?: BuilderRunPreviewResponse;
  onDownloadAudit: () => void;
}

export function AuditBundlePanel(props: AuditBundlePanelProps) {
  const { response, onDownloadAudit } = props;
  const { t } = useI18n();
  const bundle = response?.ok ? response.auditBundle ?? null : null;
  const run = response?.ok ? response.run : undefined;
  const eventCount = response?.ok ? response.events?.length ?? 0 : 0;
  const handoff = bundle && typeof bundle === "object" ? (bundle as Record<string, unknown>).handoffOrErrorSummary : undefined;

  return (
    <section className="panel-section" aria-label="Audit Panel">
      <h4>{t("audit.title")}</h4>
      {!bundle ? <p className="hint">{t("audit.noBundle")}</p> : null}
      {!bundle ? (
        <button type="button" onClick={onDownloadAudit} disabled>
          {t("audit.download")}
        </button>
      ) : null}
      {bundle ? (
        <>
          <div>runId: {run?.runId ?? "-"}</div>
          <div>status: {run?.status ?? "-"}</div>
          <div>agent: {run?.agent ?? "-"}</div>
          <div>{t("audit.eventCount")}: {eventCount}</div>
          <div>{t("audit.handoffSummary")}: {JSON.stringify(handoff ?? {})}</div>
          <button type="button" onClick={onDownloadAudit}>
            {t("audit.download")}
          </button>
          <pre>{JSON.stringify(bundle, null, 2)}</pre>
        </>
      ) : null}
    </section>
  );
}
