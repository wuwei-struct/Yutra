import type { AgentSpec } from "@yutra/spec";

function scalar(value: unknown): string {
  if (typeof value === "string") {
    if (/^[A-Za-z0-9_.-]+$/.test(value)) {
      return value;
    }
    return JSON.stringify(value);
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (value === null) {
    return "null";
  }
  return JSON.stringify(value);
}

function writeObject(lines: string[], value: Record<string, unknown>, indent = 0): void {
  const pad = " ".repeat(indent);
  for (const [key, rawValue] of Object.entries(value)) {
    if (rawValue === undefined) {
      continue;
    }
    if (Array.isArray(rawValue)) {
      lines.push(`${pad}${key}:`);
      for (const item of rawValue) {
        if (item && typeof item === "object" && !Array.isArray(item)) {
          lines.push(`${pad}  -`);
          writeObject(lines, item as Record<string, unknown>, indent + 4);
        } else {
          lines.push(`${pad}  - ${scalar(item)}`);
        }
      }
      continue;
    }
    if (rawValue && typeof rawValue === "object") {
      lines.push(`${pad}${key}:`);
      writeObject(lines, rawValue as Record<string, unknown>, indent + 2);
      continue;
    }
    lines.push(`${pad}${key}: ${scalar(rawValue)}`);
  }
}

function actionToDsl(action: NonNullable<AgentSpec["actions"]>[number]): Record<string, unknown> {
  return {
    name: action.name,
    description: action.description,
    sideEffect: action.sideEffect ?? action.side_effect,
    riskLevel: action.riskLevel,
    requiresApproval: action.requiresApproval,
    implementation: action.implementation,
    metadata: action.metadata
  };
}

export function agentSpecToChineseDsl(spec: AgentSpec): string {
  const lines: string[] = [];
  lines.push(`智能体: ${scalar(spec.agent)}`);
  lines.push(`版本: ${scalar(spec.version ?? "0.1.0")}`);

  if (spec.intents && spec.intents.length > 0) {
    lines.push("意图:");
    for (const intent of spec.intents) {
      lines.push("  -");
      writeObject(lines, intent as unknown as Record<string, unknown>, 4);
    }
  }

  if (spec.context?.fields && Object.keys(spec.context.fields).length > 0) {
    lines.push("上下文:");
    lines.push("  fields:");
    writeObject(lines, spec.context.fields, 4);
  }

  lines.push(`初始状态: ${scalar(spec.initial_state)}`);
  lines.push("状态集:");
  writeObject(lines, spec.states, 2);

  if (spec.actions && spec.actions.length > 0) {
    lines.push("动作:");
    for (const action of spec.actions) {
      lines.push("  -");
      writeObject(lines, actionToDsl(action), 4);
    }
  }

  if (spec.guards && spec.guards.length > 0) {
    lines.push("守卫:");
    for (const guard of spec.guards) {
      lines.push("  -");
      writeObject(lines, guard as unknown as Record<string, unknown>, 4);
    }
  }

  return lines.join("\n");
}

