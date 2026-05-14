import type { TemplateIntentConfig } from "@yutra/builder-core";

interface IntentSelectorProps {
  intents: TemplateIntentConfig[];
  selectedIntentIds: string[];
  onToggle: (intentId: string, checked: boolean) => void;
}

export function IntentSelector(props: IntentSelectorProps) {
  const { intents, selectedIntentIds, onToggle } = props;
  return (
    <section className="panel-section">
      <h3>Intent 选择</h3>
      <div className="list">
        {intents.map((intent) => (
          <label key={intent.id} className="checkbox-item">
            <input
              type="checkbox"
              aria-label={`intent-${intent.id}`}
              checked={selectedIntentIds.includes(intent.id)}
              onChange={(event) => onToggle(intent.id, event.target.checked)}
            />
            <span>
              {intent.label} ({intent.id}) - {intent.description ?? ""}
            </span>
          </label>
        ))}
      </div>
      <p className="hint">至少选择一个 intent。</p>
    </section>
  );
}
