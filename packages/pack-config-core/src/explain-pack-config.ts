import { canPublishPackConfig } from "./validate-pack-config";
import type { PackConfig } from "./pack-config-schema";

export function explainPackConfig(config: PackConfig, options: { locale?: "en" | "zh-CN" } = {}): string {
  const zh = options.locale === "zh-CN";
  const publish = canPublishPackConfig(config);
  const enabled = Object.entries(config.capabilities)
    .filter(([, field]) => field.value === true)
    .map(([id]) => id)
    .sort();

  const label = {
    archetype: zh ? "母型" : "Archetype",
    capabilities: zh ? "启用能力" : "Enabled Capabilities",
    objects: zh ? "业务对象" : "Business Objects",
    rules: zh ? "规则数量" : "Rule Count",
    policies: zh ? "策略数量" : "Policy Count",
    adapters: zh ? "Adapter 模式" : "Adapter Modes",
    templates: zh ? "模板数量" : "Template Count",
    tests: zh ? "测试用例数量" : "Test Case Count",
    governance: zh ? "治理摘要" : "Governance Summary",
    publish: zh ? "发布门禁" : "Publish Gate",
    note: zh ? "说明" : "Note"
  };

  return [
    `# ${config.packConfigId} (${config.packConfigVersion})`,
    `${label.archetype}: ${config.archetypeId}@${config.archetypeVersion}`,
    "",
    `## ${label.capabilities}`,
    ...(enabled.length > 0 ? enabled.map((id) => `- ${id}`) : ["- none"]),
    "",
    `## ${label.objects}`,
    ...config.businessObjects.map((object) => `- ${object.objectId}`),
    "",
    `## ${label.rules}`,
    `${Object.keys(config.rules).length}`,
    "",
    `## ${label.policies}`,
    `${Object.keys(config.policies).length}`,
    "",
    `## ${label.adapters}`,
    ...config.adapters.map((adapter) => `- ${adapter.adapterId}: ${adapter.mode}`),
    "",
    `## ${label.templates}`,
    `${config.templates.length}`,
    "",
    `## ${label.tests}`,
    `${config.tests.length}`,
    "",
    `## ${label.governance}`,
    `- environment: ${config.governance.environment}`,
    `- publishable: ${config.governance.publishable}`,
    `- requiresHumanReview: ${config.governance.requiresHumanReview}`,
    `- unconfirmedFieldPolicy: ${config.governance.unconfirmedFieldPolicy}`,
    "",
    `## ${label.publish}`,
    `- ok: ${publish.ok}`,
    `- issues: ${publish.issues.length}`,
    "",
    `${label.note}: ${zh ? "这是 Pack Config contract，不是已编译 DSL，也不是 Runtime Agent。" : "This is a Pack Config contract, not compiled DSL or a Runtime Agent."}`
  ].join("\n");
}
