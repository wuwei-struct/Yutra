import { useI18n } from "../i18n";

interface TraceEventDetailProps {
  event?: Record<string, unknown>;
}

export function TraceEventDetail(props: TraceEventDetailProps) {
  const { event } = props;
  const { t } = useI18n();
  return (
    <section className="panel-section" aria-label="Trace Event Detail">
      <h4>{t("trace.eventDetail")}</h4>
      <pre>{JSON.stringify(event ?? { message: t("trace.selectEvent") }, null, 2)}</pre>
    </section>
  );
}
