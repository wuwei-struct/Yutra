interface StrategyOption {
  value: string;
  description: string;
}

interface StrategyTagSelectorProps {
  options: StrategyOption[];
  selectedValues: string[];
  onToggle: (value: string, checked: boolean) => void;
}

export function StrategyTagSelector(props: StrategyTagSelectorProps) {
  const { options, selectedValues, onToggle } = props;
  return (
    <section className="panel-section" aria-label="Strategy Tags">
      <h4>Strategies</h4>
      <div className="list">
        {options.map((item) => (
          <label key={item.value} className="checkbox-item">
            <input
              type="checkbox"
              aria-label={`strategy-${item.value}`}
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
