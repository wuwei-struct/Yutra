interface CapabilityOption {
  value: string;
  description: string;
}

interface CapabilityTagSelectorProps {
  options: CapabilityOption[];
  selectedValues: string[];
  onToggle: (value: string, checked: boolean) => void;
}

export function CapabilityTagSelector(props: CapabilityTagSelectorProps) {
  const { options, selectedValues, onToggle } = props;
  return (
    <section className="panel-section" aria-label="Capability Tags">
      <h4>Capabilities</h4>
      <div className="list">
        {options.map((item) => (
          <label key={item.value} className="checkbox-item">
            <input
              type="checkbox"
              aria-label={`capability-${item.value}`}
              checked={selectedValues.includes(item.value)}
              onChange={(event) => onToggle(item.value, event.target.checked)}
            />
            <span>
              {item.value}
              <small className="hint"> - {item.description}</small>
            </span>
          </label>
        ))}
      </div>
    </section>
  );
}
