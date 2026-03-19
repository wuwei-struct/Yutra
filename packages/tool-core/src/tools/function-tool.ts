import type { Tool, ToolRunContext, ToolResult } from "../types";

export interface FunctionToolOptions<Input = unknown, Output = unknown> {
  name: string;
  description?: string;
  sideEffect?: Tool["sideEffect"];
  handler: (input: Input, ctx: ToolRunContext) => Promise<ToolResult<Output>> | ToolResult<Output>;
}

export function createFunctionTool<Input = unknown, Output = unknown>(
  options: FunctionToolOptions<Input, Output>
): Tool<Input, Output> {
  return {
    name: options.name,
    description: options.description,
    sideEffect: options.sideEffect ?? "none",
    async run(input: Input, ctx: ToolRunContext): Promise<ToolResult<Output>> {
      try {
        return await options.handler(input, ctx);
      } catch (error) {
        return {
          ok: false,
          error: {
            code: "FUNCTION_TOOL_ERROR",
            message: (error as Error).message
          }
        };
      }
    }
  };
}
