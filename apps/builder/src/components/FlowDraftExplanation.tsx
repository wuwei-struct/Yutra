interface FlowDraftExplanationProps {
  text?: string;
}

export function FlowDraftExplanation(props: FlowDraftExplanationProps) {
  const { text } = props;
  return (
    <section className="panel-section" aria-label="FlowDraft Explanation">
      <h4>FlowDraft Explanation</h4>
      {text ? (
        <pre aria-label="FlowDraft Explanation Text">{text}</pre>
      ) : (
        <p className="hint">Generate a draft to view explanation.</p>
      )}
    </section>
  );
}
