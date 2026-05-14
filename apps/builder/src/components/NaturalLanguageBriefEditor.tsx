interface NaturalLanguageBriefEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export function NaturalLanguageBriefEditor(props: NaturalLanguageBriefEditorProps) {
  const { value, onChange } = props;
  return (
    <section className="panel-section" aria-label="Natural Language Brief">
      <h4>Natural Language Brief</h4>
      <label className="field">
        <span>Brief Text</span>
        <textarea
          aria-label="AI Draft Brief"
          rows={8}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Describe your flow requirements..."
        />
      </label>
    </section>
  );
}
