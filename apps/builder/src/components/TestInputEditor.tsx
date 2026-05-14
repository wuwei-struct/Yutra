interface TestInputEditorProps {
  samples: Array<{ id: string; label: string; input: unknown }>;
  selectedSampleId: string;
  jsonText: string;
  jsonError?: string;
  onSampleChange: (sampleId: string) => void;
  onJsonTextChange: (value: string) => void;
}

export function TestInputEditor(props: TestInputEditorProps) {
  const { samples, selectedSampleId, jsonText, jsonError, onSampleChange, onJsonTextChange } = props;
  return (
    <section className="panel-section">
      <h4>Test Input</h4>
      <label className="field">
        <span>Sample Input</span>
        <select aria-label="Sample Input" value={selectedSampleId} onChange={(event) => onSampleChange(event.target.value)}>
          {samples.map((sample) => (
            <option key={sample.id} value={sample.id}>
              {sample.label}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>Context JSON</span>
        <textarea
          aria-label="Context JSON"
          value={jsonText}
          onChange={(event) => onJsonTextChange(event.target.value)}
          rows={10}
        />
      </label>
      {jsonError ? <p className="error-text">{jsonError}</p> : null}
    </section>
  );
}
