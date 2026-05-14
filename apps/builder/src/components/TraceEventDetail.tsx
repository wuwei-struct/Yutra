interface TraceEventDetailProps {
  event?: Record<string, unknown>;
}

export function TraceEventDetail(props: TraceEventDetailProps) {
  const { event } = props;
  return (
    <section className="panel-section" aria-label="Trace Event Detail">
      <h4>Trace Event Detail</h4>
      <pre>{JSON.stringify(event ?? { message: "Select an event from timeline." }, null, 2)}</pre>
    </section>
  );
}
