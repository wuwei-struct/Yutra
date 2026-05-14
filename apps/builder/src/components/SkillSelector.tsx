import type { TemplateSkillConfig } from "@yutra/builder-core";

interface SkillSelectorProps {
  skills: TemplateSkillConfig[];
  selectedSkillNames: string[];
  onToggle: (skillName: string, checked: boolean) => void;
  warning?: string;
}

export function SkillSelector(props: SkillSelectorProps) {
  const { skills, selectedSkillNames, onToggle, warning } = props;
  return (
    <section className="panel-section">
      <h3>Skill 选择</h3>
      <div className="list">
        {skills.map((skill) => (
          <label key={skill.name} className="checkbox-item">
            <input
              type="checkbox"
              aria-label={`skill-${skill.name}`}
              checked={selectedSkillNames.includes(skill.name)}
              disabled={skill.required === true}
              onChange={(event) => onToggle(skill.name, event.target.checked)}
            />
            <span>
              {skill.label ?? skill.name} ({skill.name}) | sideEffect={skill.sideEffect ?? "none"} | riskLevel=
              {skill.riskLevel ?? "low"} | requiresApproval={String(skill.requiresApproval ?? false)}
            </span>
          </label>
        ))}
      </div>
      {warning ? <p className="warning-text">{warning}</p> : null}
    </section>
  );
}
