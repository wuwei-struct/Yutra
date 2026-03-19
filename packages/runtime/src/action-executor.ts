import { createRuntimeError } from "./errors";
import type { ActionExecutionResult, ActionRegistry, RuntimeRunContext } from "./types";

export class ActionExecutor {
  private readonly actionRegistry: ActionRegistry;

  public constructor(actionRegistry: ActionRegistry = {}) {
    this.actionRegistry = actionRegistry;
  }

  public async executeAction(actionName: string, ctx: RuntimeRunContext): Promise<ActionExecutionResult> {
    const handler = this.actionRegistry[actionName];
    if (!handler) {
      return {
        actionName,
        ok: false,
        error: createRuntimeError("RUNTIME_ACTION_NOT_FOUND", `Action '${actionName}' is not registered.`, {
          action: actionName
        })
      };
    }

    const result = await handler(ctx);
    if (!result.ok) {
      return {
        actionName,
        ok: false,
        error: {
          code: result.error?.code ?? "RUNTIME_ACTION_FAILED",
          message: result.error?.message ?? `Action '${actionName}' failed.`,
          details: result.error?.details,
          action: actionName,
          state: ctx.currentState,
          step: ctx.step
        },
        meta: result.meta
      };
    }

    if (result.contextPatch) {
      Object.assign(ctx.context, result.contextPatch);
    }

    return {
      actionName,
      ok: true,
      output: result.output,
      contextPatch: result.contextPatch,
      meta: result.meta
    };
  }
}
