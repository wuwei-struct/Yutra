import type { PackConfig } from "@yutra/pack-config-core";

export function PackConfigPreviewPanel(props: { config: PackConfig }) {
  return (
    <section className="creator-section" aria-label="PackConfig Preview">
      <h3>PackConfig Preview</h3>
      <div className="status-row wrap-row">
        <span className="status-pill ok">demo/mock</span>
        <span className="status-pill">archetype: {props.config.archetypeId}</span>
        <span className="status-pill">environment: {props.config.governance.environment}</span>
        <span className="status-pill">adapters: mock</span>
      </div>
      <pre>{JSON.stringify(props.config, null, 2)}</pre>
    </section>
  );
}
