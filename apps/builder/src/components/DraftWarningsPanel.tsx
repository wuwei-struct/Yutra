interface DraftWarningsPanelProps {
  warnings: string[];
}

export function DraftWarningsPanel(props: DraftWarningsPanelProps) {
  const { warnings } = props;
  return (
    <section className="panel-section" aria-label="Draft Warnings">
      <h4>Draft Warnings</h4>
      {warnings.length === 0 ? (
        <p className="hint">No warnings.</p>
      ) : (
        <ul>
          {warnings.map((warning) => (
            <li key={warning} className="warning-text">
              {warning}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
