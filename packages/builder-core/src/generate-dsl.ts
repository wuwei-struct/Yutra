import type { AgentSpec, TransitionSpec } from "@yutra/spec";

function formatTransition(transition: TransitionSpec): string[] {
  const lines: string[] = [];
  if (transition.when) {
    lines.push(`      - 条件: ${transition.when}`);
    lines.push(`        到: ${transition.to}`);
    return lines;
  }
  if (transition.guard) {
    lines.push(`      - 守卫: ${transition.guard}`);
    lines.push(`        到: ${transition.to}`);
    return lines;
  }
  lines.push("      - 条件: 默认");
  lines.push(`        到: ${transition.to}`);
  return lines;
}

function requiredText(required?: boolean): string {
  return required ? "必填" : "可选";
}

export function agentSpecToChineseDsl(spec: AgentSpec): string {
  const lines: string[] = [];
  const intents = [...(spec.intents ?? [])].sort((a, b) => a.name.localeCompare(b.name));
  const contextEntries = Object.entries(spec.context?.fields ?? {}).sort(([a], [b]) => a.localeCompare(b));
  const actionEntries = [...(spec.actions ?? [])].sort((a, b) => a.name.localeCompare(b.name));
  const stateEntries = Object.entries(spec.states).sort(([a], [b]) => a.localeCompare(b));
  const guardEntries = [...(spec.guards ?? [])].sort((a, b) => a.name.localeCompare(b.name));

  lines.push(`智能体: ${spec.agent}`);
  lines.push(`版本: ${spec.version ?? "0.1.0"}`);
  lines.push("");
  lines.push("意图:");
  if (intents.length === 0) {
    lines.push("  - 无");
  } else {
    for (const intent of intents) {
      lines.push(`  - ${intent.name}${intent.description ? `（${intent.description}）` : ""}`);
    }
  }
  lines.push("");
  lines.push("上下文:");
  if (contextEntries.length === 0) {
    lines.push("  - 无");
  } else {
    for (const [name, field] of contextEntries) {
      lines.push(`  - ${name}: ${field.type ?? "any"} (${requiredText(field.required)})`);
    }
  }
  lines.push("");
  lines.push(`初始状态: ${spec.initial_state}`);
  lines.push("");
  lines.push("状态集:");
  for (const [stateName, state] of stateEntries) {
    lines.push(`  ${stateName}:`);
    if (state.final) {
      lines.push("    终态: true");
    }
    if (state.handoff) {
      lines.push("    转人工: true");
    }
    lines.push("    动作:");
    if (!state.actions || state.actions.length === 0) {
      lines.push("      - 无");
    } else {
      for (const action of [...state.actions].sort((a, b) => a.localeCompare(b))) {
        lines.push(`      - ${action}`);
      }
    }
    lines.push("    转移:");
    if (!state.transitions || state.transitions.length === 0) {
      lines.push("      - 条件: 无");
      lines.push("        到: 无");
    } else {
      for (const transition of state.transitions) {
        lines.push(...formatTransition(transition));
      }
    }
  }
  lines.push("");
  lines.push("动作:");
  if (actionEntries.length === 0) {
    lines.push("  - 无");
  } else {
    for (const action of actionEntries) {
      const actionType = typeof action.implementation?.type === "string" ? action.implementation.type : "unknown";
      lines.push(`  - ${action.name} [${actionType}]`);
    }
  }
  lines.push("");
  lines.push("守卫/条件:");
  if (guardEntries.length === 0) {
    lines.push("  - 无");
  } else {
    for (const guard of guardEntries) {
      lines.push(`  - ${guard.name}${guard.expression ? `: ${guard.expression}` : ""}`);
    }
  }

  return lines.join("\n");
}
