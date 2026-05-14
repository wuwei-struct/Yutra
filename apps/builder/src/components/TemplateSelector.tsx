import type { AgentTemplateConfig } from "@yutra/builder-core";

interface TemplateSelectorProps {
  templates: AgentTemplateConfig[];
  selectedTemplateId: string;
  onChange: (templateId: string) => void;
}

export function TemplateSelector(props: TemplateSelectorProps) {
  const { templates, selectedTemplateId, onChange } = props;
  return (
    <section className="panel-section">
      <h3>模板选择</h3>
      <label className="field">
        <span>模板</span>
        <select
          aria-label="Template"
          value={selectedTemplateId}
          onChange={(event) => onChange(event.target.value)}
        >
          {templates.map((template) => (
            <option key={template.templateId} value={template.templateId}>
              {template.name} ({template.templateId})
            </option>
          ))}
        </select>
      </label>
      {templates
        .filter((template) => template.templateId === selectedTemplateId)
        .map((template) => (
          <div key={template.templateId} className="card">
            <div>domain: {template.domain}</div>
            <div>{template.description}</div>
            <div>supported intents: {template.supportedIntents.length}</div>
            <div>available skills: {template.availableSkills.length}</div>
          </div>
        ))}
    </section>
  );
}
