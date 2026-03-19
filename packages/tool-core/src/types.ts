export type ToolSideEffect = "none" | "read" | "write" | "external";

export interface ToolError {
  code: string;
  message: string;
  retryable?: boolean;
}

export interface ToolResult<T> {
  ok: boolean;
  data?: T;
  error?: ToolError;
  meta?: Record<string, unknown>;
}

export interface ToolRunContext {
  runId: string;
  agent: string;
  state?: string;
  context: Record<string, unknown>;
  now?: string;
  trace?: {
    event: string;
    payload?: Record<string, unknown>;
  };
}

export interface Tool<Input = unknown, Output = unknown> {
  name: string;
  description?: string;
  inputSchema?: object;
  outputSchema?: object;
  sideEffect?: ToolSideEffect;
  run(input: Input, ctx: ToolRunContext): Promise<ToolResult<Output>>;
}
