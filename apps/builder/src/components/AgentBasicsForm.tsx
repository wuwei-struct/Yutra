import type { BuilderUiState } from "../types";

interface AgentBasicsFormProps {
  state: BuilderUiState;
  onChange: (patch: Partial<BuilderUiState>) => void;
}

export function AgentBasicsForm(props: AgentBasicsFormProps) {
  const { state, onChange } = props;
  return (
    <section className="panel-section">
      <h3>基础信息</h3>
      <label className="field">
        <span>Agent Name</span>
        <input
          aria-label="Agent Name"
          value={state.agentName}
          onChange={(event) => onChange({ agentName: event.target.value })}
        />
      </label>
      <label className="field">
        <span>Version</span>
        <input aria-label="Version" value={state.version} onChange={(event) => onChange({ version: event.target.value })} />
      </label>
      <label className="field">
        <span>Response Style</span>
        <select
          aria-label="Response Style"
          value={state.responseStyle}
          onChange={(event) => onChange({ responseStyle: event.target.value as BuilderUiState["responseStyle"] })}
        >
          <option value="neutral">neutral</option>
          <option value="service_oriented">service_oriented</option>
          <option value="concise">concise</option>
          <option value="custom">custom</option>
        </select>
      </label>
      <label className="field">
        <span>Language</span>
        <select
          aria-label="Language"
          value={state.language}
          onChange={(event) => onChange({ language: event.target.value as BuilderUiState["language"] })}
        >
          <option value="zh-CN">zh-CN</option>
          <option value="en">en</option>
        </select>
      </label>
    </section>
  );
}
