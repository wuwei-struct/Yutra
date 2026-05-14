interface ScenarioOption {
  value: string;
  label: string;
  description: string;
  supported: boolean;
}

interface ScenarioTagSelectorProps {
  options: ScenarioOption[];
  value: string;
  onChange: (value: string) => void;
}

export function ScenarioTagSelector(props: ScenarioTagSelectorProps) {
  const { options, value, onChange } = props;
  return (
    <section className="panel-section" aria-label="Scenario Tags">
      <h4>Scenario</h4>
      <label className="field">
        <span>Scenario Tag</span>
        <select aria-label="AI Draft Scenario" value={value} onChange={(event) => onChange(event.target.value)}>
          {options.map((item) => (
            <option key={item.value} value={item.value} disabled={!item.supported}>
              {item.label}
            </option>
          ))}
        </select>
      </label>
      <p className="hint">{options.find((item) => item.value === value)?.description ?? ""}</p>
    </section>
  );
}
