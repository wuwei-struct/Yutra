import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import {
  builderFormSchema,
  ecommerceSupportTemplate,
  formConfigToAgentSpec,
  validateGeneratedSpec,
  type BuilderValidationResult
} from "@yutra/builder-core";
import { executeRun } from "@yutra/runtime";
import { MemoryTraceStorage, buildAuditBundle } from "@yutra/trace";
import type { RuntimeInput } from "@yutra/runtime";
import type { BuilderRunPreviewRequest, BuilderRunPreviewResponse } from "./types";
import { buildTimeline, sanitizeErrorMessage, toTraceJsonl } from "./response-formatters";

const DEFAULT_SKILLS_DIR = "examples/ecommerce-support/skills";

function findWorkspaceRoot(start: string): string {
  let current = start;
  while (true) {
    if (existsSync(resolve(current, "pnpm-workspace.yaml"))) {
      return current;
    }
    const parent = dirname(current);
    if (parent === current) {
      return start;
    }
    current = parent;
  }
}

function resolveSkillsDir(pathLike?: string): string {
  const root = findWorkspaceRoot(process.cwd());
  const raw = pathLike ?? DEFAULT_SKILLS_DIR;
  return resolve(root, raw);
}

function validationFailedResult(validation: BuilderValidationResult, code: string, message: string): BuilderRunPreviewResponse {
  return {
    ok: false,
    error: { code, message },
    validation,
    events: []
  };
}

function resolveRuntimeInput(request: BuilderRunPreviewRequest): RuntimeInput {
  const ctx = { ...(request.input?.context ?? {}) };
  const intentFromContext = typeof ctx.issue_type === "string" ? ctx.issue_type : undefined;
  const resolvedIntent = request.input?.intent ?? intentFromContext;
  if (resolvedIntent && !Object.prototype.hasOwnProperty.call(ctx, "intent")) {
    ctx.intent = resolvedIntent;
  }
  if (!Object.prototype.hasOwnProperty.call(ctx, "adapter_mode")) {
    ctx.adapter_mode = "mock";
  }
  return {
    text: request.input?.text,
    intent: resolvedIntent,
    context: ctx
  };
}

function normalizeSpecForRuntime<T extends object>(spec: T): T {
  const typedSpec = spec as T & {
    context?: { fields?: Record<string, { default?: unknown }> };
    states?: Record<string, { transitions?: Array<{ when?: string }> }>;
  };
  const fields = typedSpec.context?.fields;
  for (const field of Object.values(fields ?? {})) {
    if (field && typeof field === "object" && "default" in field && field.default === undefined) {
      delete field.default;
    }
  }
  for (const state of Object.values(typedSpec.states ?? {})) {
    for (const transition of state.transitions ?? []) {
      if (transition.when === "otherwise") {
        delete transition.when;
        continue;
      }
      if (typeof transition.when === "string") {
        transition.when = transition.when.replace(/\bintent\b/g, "ctx.intent");
      }
    }
  }
  return typedSpec;
}

export async function runBuilderPreview(request: BuilderRunPreviewRequest): Promise<BuilderRunPreviewResponse> {
  const parsedForm = builderFormSchema.safeParse(request.form);
  if (!parsedForm.success) {
    return validationFailedResult(
      {
        ok: false,
        issues: parsedForm.error.issues.map((issue) => ({
          code: "BUILDER_FORM_INVALID",
          severity: "error",
          message: issue.message,
          path: issue.path.map((part) => String(part))
        }))
      },
      "BUILDER_FORM_INVALID",
      "Builder form validation failed."
    );
  }

  let spec;
  try {
    spec = normalizeSpecForRuntime(formConfigToAgentSpec(parsedForm.data, ecommerceSupportTemplate));
  } catch (error) {
    return validationFailedResult(
      { ok: false, issues: [] },
      "BUILDER_SPEC_INVALID",
      sanitizeErrorMessage(error instanceof Error ? error.message : "Failed to generate AgentSpec.")
    );
  }

  const validation = validateGeneratedSpec(spec);
  if (!validation.ok) {
    return validationFailedResult(validation, "BUILDER_SPEC_INVALID", "Generated AgentSpec validation failed.");
  }

  try {
    const traceStorage = new MemoryTraceStorage();
    const runtimeResult = await executeRun({
      spec,
      input: resolveRuntimeInput(request),
      options: {
        actionRegistry: {},
        skillSearchPaths: [resolveSkillsDir(request.options?.skillsDir)],
        traceStorage
      }
    });
    const events = runtimeResult.traceEvents ?? [];
    const timeline = buildTimeline(events);
    const auditBundle = await buildAuditBundle(traceStorage, runtimeResult.runId);

    return {
      ok: true,
      run: {
        runId: runtimeResult.runId,
        status: runtimeResult.status,
        agent: runtimeResult.agent,
        initialState: runtimeResult.visitedStates[0],
        finalState: runtimeResult.finalState,
        matchedIntent: runtimeResult.intent,
        steps: runtimeResult.steps,
        errorCode: runtimeResult.error?.code,
        errorMessage: runtimeResult.error?.message,
        errorDetails:
          runtimeResult.error?.details && typeof runtimeResult.error.details === "object"
            ? (runtimeResult.error.details as Record<string, unknown>)
            : undefined
      },
      spec,
      validation,
      events: events as unknown as Array<Record<string, unknown>>,
      timeline,
      traceJsonl: toTraceJsonl(events),
      auditBundle: auditBundle as unknown as Record<string, unknown>
    };
  } catch (error) {
    return validationFailedResult(
      validation,
      "BUILDER_RUN_PREVIEW_FAILED",
      sanitizeErrorMessage(error instanceof Error ? error.message : "Run preview failed.")
    );
  }
}
