function parseValue(raw: string): unknown {
  const trimmed = raw.trim();

  if (trimmed === "true") {
    return true;
  }

  if (trimmed === "false") {
    return false;
  }

  if ((trimmed.startsWith("\"") && trimmed.endsWith("\"")) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1);
  }

  const asNumber = Number(trimmed);
  if (!Number.isNaN(asNumber) && trimmed !== "") {
    return asNumber;
  }

  return trimmed;
}

function getPathValue(ctx: Record<string, unknown>, path: string): unknown {
  const normalizedPath = path.replace(/^ctx\./, "");
  const segments = normalizedPath.split(".").filter(Boolean);
  let current: unknown = ctx;

  for (const segment of segments) {
    if (typeof current !== "object" || current === null || !(segment in current)) {
      return undefined;
    }

    current = (current as Record<string, unknown>)[segment];
  }

  return current;
}

export interface ExpressionEvaluation {
  ok: boolean;
  value: boolean;
  reason?: string;
}

export function evaluateExpression(expression: string, ctx: Record<string, unknown>): ExpressionEvaluation {
  const normalized = expression.trim();

  if (normalized === "true") {
    return { ok: true, value: true };
  }

  if (normalized === "false") {
    return { ok: true, value: false };
  }

  const compareMatch = normalized.match(/^ctx\.([a-zA-Z0-9_.]+)\s*(==|!=)\s*(.+)$/);
  if (compareMatch) {
    const [, path, operator, rawRight] = compareMatch;
    const left = getPathValue(ctx, path);
    const right = parseValue(rawRight);
    const isEqual = left === right;
    return {
      ok: true,
      value: operator === "==" ? isEqual : !isEqual
    };
  }

  const truthyMatch = normalized.match(/^ctx\.([a-zA-Z0-9_.]+)$/);
  if (truthyMatch) {
    const value = getPathValue(ctx, truthyMatch[1]);
    return {
      ok: true,
      value: Boolean(value)
    };
  }

  return {
    ok: false,
    value: false,
    reason: `Unsupported expression syntax: '${expression}'.`
  };
}
