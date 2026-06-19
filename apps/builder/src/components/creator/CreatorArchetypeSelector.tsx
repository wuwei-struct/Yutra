import { creatorArchetypes, type SupportedCreatorArchetype } from "../../lib/creator-state";
import { isSupportedCreatorArchetype } from "./creator-ui-helpers";

export function CreatorArchetypeSelector(props: {
  currentArchetypeId: string;
  onSelectArchetype: (archetypeId: SupportedCreatorArchetype) => void;
}) {
  return (
    <section className="creator-section" aria-label="Archetype Selector">
      <h3>Archetype Selector</h3>
      <p className="hint">request-resolution and approval-decision are enabled for demo/mock Compile Preview.</p>
      <div className="creator-archetype-list">
        {creatorArchetypes.map((item) => (
          <button
            key={item.id}
            type="button"
            disabled={!item.enabled}
            className={item.enabled ? "creator-archetype enabled" : "creator-archetype"}
            aria-pressed={props.currentArchetypeId === item.id}
            onClick={() => {
              if (isSupportedCreatorArchetype(item.id)) {
                props.onSelectArchetype(item.id);
              }
            }}
          >
            <strong>{item.label}</strong>
            <span>{props.currentArchetypeId === item.id ? "selected" : item.enabled ? "enabled" : "coming soon"}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
