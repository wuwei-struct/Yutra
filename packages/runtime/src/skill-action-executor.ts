import { existsSync } from "node:fs";
import { isAbsolute, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { createSkillRegistry, loadSkillFromDir, validateLoadedSkill } from "@yutra/skill-core";
import type { ActionRiskLevel, ActionSideEffect } from "@yutra/spec";
import { RUNTIME_ERROR_CODES } from "./error-codes";
import type { ActionExecutionPolicy, RuntimeRunContext, RuntimeError, RuntimeOptions } from "./types";

type JsonSchemaLike = Record<string, unknown>;

export type SkillExecutionMetadata = {
  implementationType: "skill";
  skillName: string;
  skillVersion?: string;
  skillEntry?: string;
  riskLevel?: ActionRiskLevel;
  requiresApproval?: boolean;
  inputValidated: boolean;
  outputValidated: boolean;
  sideEffect: ActionSideEffect;
  allowedEnvironments?: string[];
  maxCallsPerRun?: number;
};

export type SkillActionExecutionResult = {
  ok: boolean;
  output?: unknown;
  contextPatch?: Record<string, unknown>;
  error?: RuntimeError;
  meta?: Record<string, unknown>;
  details: SkillExecutionMetadata;
};

interface ExecuteSkillActionInput {
  actionName: string;
  ctx: RuntimeRunContext;
  actionPolicy?: ActionExecutionPolicy;
  actionDefinition?: {
    inputSchema?: Record<string, unknown>;
    outputSchema?: Record<string, unknown>;
    sideEffect?: ActionSideEffect;
    riskLevel?: ActionRiskLevel;
    requiresApproval?: boolean;
    implementation?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
  };
  runtimeOptions?: Pick<RuntimeOptions, "skillRegistry" | "skillSearchPaths">;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function schemaTypeName(value: unknown): string {
  if (Array.isArray(value)) return "array";
  if (value === null) return "null";
  return typeof value;
}

function validateSchemaValue(schema: JsonSchemaLike | undefined, value: unknown, path: string): string[] {
  if (!schema) {
    return [];
  }
  const errors: string[] = [];
  const type = typeof schema.type === "string" ? schema.type : undefined;

  if (type === "object") {
    if (!isPlainObject(value)) {
      errors.push(`${path} should be object, got ${schemaTypeName(value)}`);
      return errors;
    }
    const required = Array.isArray(schema.required) ? schema.required.filter((item) => typeof item === "string") : [];
    for (const key of required) {
      if (!(key in value)) {
        errors.push(`${path}.${key} is required`);
      }
    }
    const properties = isPlainObject(schema.properties) ? schema.properties : {};
    for (const [prop, propSchema] of Object.entries(properties)) {
      if (!(prop in value)) {
        continue;
      }
      if (isPlainObject(propSchema)) {
        errors.push(...validateSchemaValue(propSchema, value[prop], `${path}.${prop}`));
      }
    }
    return errors;
  }

  if (type === "array") {
    if (!Array.isArray(value)) {
      errors.push(`${path} should be array, got ${schemaTypeName(value)}`);
    }
    return errors;
  }

  if (type === "string" && typeof value !== "string") {
    errors.push(`${path} should be string, got ${schemaTypeName(value)}`);
  } else if (type === "number" && typeof value !== "number") {
    errors.push(`${path} should be number, got ${schemaTypeName(value)}`);
  } else if (type === "boolean" && typeof value !== "boolean") {
    errors.push(`${path} should be boolean, got ${schemaTypeName(value)}`);
  }
  return errors;
}

function runtimeError(code: string, message: string, details?: Record<string, unknown>): RuntimeError {
  return {
    code,
    message,
    stage: "action.execute",
    retryable: false,
    details
  };
}

function isRuntimeError(value: unknown): value is RuntimeError {
  return isPlainObject(value) && typeof value.code === "string" && typeof value.message === "string";
}

async function resolveLoadedSkill(input: ExecuteSkillActionInput) {
  const implementation = (input.actionPolicy?.implementation ??
    input.actionDefinition?.implementation ??
    {}) as Record<string, unknown>;
  const skillName = typeof implementation.skillName === "string" ? implementation.skillName : input.actionName;
  const skillDir = typeof implementation.skillDir === "string" ? implementation.skillDir : undefined;

  if (skillDir) {
    return await loadSkillFromDir(skillDir);
  }

  if (input.runtimeOptions?.skillRegistry) {
    const found = await input.runtimeOptions.skillRegistry.get(skillName);
    if (found) {
      return found;
    }
  }

  if (input.runtimeOptions?.skillSearchPaths?.length) {
    const fallbackRegistry = createSkillRegistry({
      paths: input.runtimeOptions.skillSearchPaths
    });
    const found = await fallbackRegistry.get(skillName);
    if (found) {
      return found;
    }
  }

  throw runtimeError(
    RUNTIME_ERROR_CODES.SKILL_MANIFEST_INVALID,
    `Skill '${skillName}' not found for action '${input.actionName}'.`,
    { actionName: input.actionName, skillName }
  );
}

export async function executeSkillAction(input: ExecuteSkillActionInput): Promise<SkillActionExecutionResult> {
  let loadedSkill;
  try {
    loadedSkill = await resolveLoadedSkill(input);
  } catch (error) {
    return {
      ok: false,
      error: isRuntimeError(error) ? error : runtimeError(RUNTIME_ERROR_CODES.SKILL_MANIFEST_INVALID, String(error)),
      details: {
        implementationType: "skill",
        skillName: input.actionName,
        inputValidated: false,
        outputValidated: false,
        sideEffect: input.actionPolicy?.sideEffect ?? input.actionDefinition?.sideEffect ?? "none"
      }
    };
  }

  const validation = validateLoadedSkill(loadedSkill);
  if (!validation.ok) {
    const firstError = validation.issues.find((item) => item.severity === "error");
    const errorCode =
      firstError?.code === "SKILL_ENTRY_MISSING" ? RUNTIME_ERROR_CODES.SKILL_ENTRY_MISSING : RUNTIME_ERROR_CODES.SKILL_MANIFEST_INVALID;
    return {
      ok: false,
      error: runtimeError(errorCode, "Skill manifest validation failed.", {
        issues: validation.issues.filter((item) => item.severity === "error")
      }),
      details: {
        implementationType: "skill",
        skillName: loadedSkill.manifest.name,
        skillVersion: loadedSkill.manifest.version,
        skillEntry: loadedSkill.manifest.entry,
        inputValidated: false,
        outputValidated: false,
        sideEffect: loadedSkill.manifest.sideEffect ?? "none"
      }
    };
  }

  const entry = loadedSkill.manifest.entry;
  if (!entry || !loadedSkill.files.entryExists) {
    return {
      ok: false,
      error: runtimeError(RUNTIME_ERROR_CODES.SKILL_ENTRY_MISSING, `Skill entry is missing for '${loadedSkill.manifest.name}'.`, {
        skillName: loadedSkill.manifest.name,
        entry
      }),
      details: {
        implementationType: "skill",
        skillName: loadedSkill.manifest.name,
        skillVersion: loadedSkill.manifest.version,
        skillEntry: entry,
        inputValidated: false,
        outputValidated: false,
        sideEffect: loadedSkill.manifest.sideEffect ?? "none"
      }
    };
  }

  if (!entry.endsWith(".mjs") && !entry.endsWith(".js")) {
    return {
      ok: false,
      error: runtimeError(RUNTIME_ERROR_CODES.SKILL_ENTRY_INVALID, `Skill entry must be .js or .mjs: '${entry}'.`, {
        entry
      }),
      details: {
        implementationType: "skill",
        skillName: loadedSkill.manifest.name,
        skillVersion: loadedSkill.manifest.version,
        skillEntry: entry,
        inputValidated: false,
        outputValidated: false,
        sideEffect: loadedSkill.manifest.sideEffect ?? "none"
      }
    };
  }

  const resolvedEntry = isAbsolute(entry) ? entry : resolve(loadedSkill.dir, entry);
  if (!existsSync(resolvedEntry)) {
    return {
      ok: false,
      error: runtimeError(RUNTIME_ERROR_CODES.SKILL_ENTRY_MISSING, `Skill entry file does not exist: '${entry}'.`, {
        entry,
        resolvedEntry
      }),
      details: {
        implementationType: "skill",
        skillName: loadedSkill.manifest.name,
        skillVersion: loadedSkill.manifest.version,
        skillEntry: entry,
        inputValidated: false,
        outputValidated: false,
        sideEffect: loadedSkill.manifest.sideEffect ?? "none"
      }
    };
  }

  const invocationInput = input.ctx.context;
  const inputSchema = loadedSkill.manifest.inputSchema ?? input.actionDefinition?.inputSchema;
  const inputErrors = validateSchemaValue(inputSchema, invocationInput, "$input");
  if (inputErrors.length > 0) {
    return {
      ok: false,
      error: runtimeError(RUNTIME_ERROR_CODES.SKILL_INPUT_INVALID, "Skill input validation failed.", {
        skillName: loadedSkill.manifest.name,
        errors: inputErrors
      }),
      details: {
        implementationType: "skill",
        skillName: loadedSkill.manifest.name,
        skillVersion: loadedSkill.manifest.version,
        skillEntry: entry,
        inputValidated: false,
        outputValidated: false,
        sideEffect: loadedSkill.manifest.sideEffect ?? "none",
        riskLevel: loadedSkill.manifest.riskLevel,
        requiresApproval: loadedSkill.manifest.requiresApproval
      }
    };
  }

  let runFn: ((runInput: unknown, runCtx: RuntimeRunContext) => Promise<unknown>) | undefined;
  try {
    const mod = (await import(pathToFileURL(resolvedEntry).href)) as { run?: typeof runFn };
    runFn = mod.run;
  } catch (error) {
    return {
      ok: false,
      error: runtimeError(RUNTIME_ERROR_CODES.SKILL_ENTRY_INVALID, `Failed to load skill entry '${entry}'.`, {
        skillName: loadedSkill.manifest.name,
        cause: error instanceof Error ? error.message : String(error)
      }),
      details: {
        implementationType: "skill",
        skillName: loadedSkill.manifest.name,
        skillVersion: loadedSkill.manifest.version,
        skillEntry: entry,
        inputValidated: true,
        outputValidated: false,
        sideEffect: loadedSkill.manifest.sideEffect ?? "none"
      }
    };
  }

  if (typeof runFn !== "function") {
    return {
      ok: false,
      error: runtimeError(RUNTIME_ERROR_CODES.SKILL_ENTRY_INVALID, `Skill entry '${entry}' must export async function run(input, ctx).`),
      details: {
        implementationType: "skill",
        skillName: loadedSkill.manifest.name,
        skillVersion: loadedSkill.manifest.version,
        skillEntry: entry,
        inputValidated: true,
        outputValidated: false,
        sideEffect: loadedSkill.manifest.sideEffect ?? "none"
      }
    };
  }

  let raw: unknown;
  try {
    raw = await runFn(invocationInput, input.ctx);
  } catch (error) {
    return {
      ok: false,
      error: runtimeError(
        RUNTIME_ERROR_CODES.SKILL_EXECUTION_FAILED,
        `Skill '${loadedSkill.manifest.name}' threw during execution.`,
        {
          skillName: loadedSkill.manifest.name,
          cause: error instanceof Error ? error.message : String(error)
        }
      ),
      details: {
        implementationType: "skill",
        skillName: loadedSkill.manifest.name,
        skillVersion: loadedSkill.manifest.version,
        skillEntry: entry,
        inputValidated: true,
        outputValidated: false,
        sideEffect: loadedSkill.manifest.sideEffect ?? "none"
      }
    };
  }

  if (!isPlainObject(raw) || typeof raw.ok !== "boolean") {
    return {
      ok: false,
      error: runtimeError(
        RUNTIME_ERROR_CODES.SKILL_EXECUTION_FAILED,
        `Skill '${loadedSkill.manifest.name}' returned invalid result shape.`
      ),
      details: {
        implementationType: "skill",
        skillName: loadedSkill.manifest.name,
        skillVersion: loadedSkill.manifest.version,
        skillEntry: entry,
        inputValidated: true,
        outputValidated: false,
        sideEffect: loadedSkill.manifest.sideEffect ?? "none"
      }
    };
  }

  if (raw.ok === false) {
    const errorObj = isPlainObject(raw.error) ? raw.error : {};
    return {
      ok: false,
      error: runtimeError(
        typeof errorObj.code === "string" ? errorObj.code : RUNTIME_ERROR_CODES.SKILL_EXECUTION_FAILED,
        typeof errorObj.message === "string" ? errorObj.message : `Skill '${loadedSkill.manifest.name}' failed.`,
        isPlainObject(errorObj.details) ? errorObj.details : undefined
      ),
      details: {
        implementationType: "skill",
        skillName: loadedSkill.manifest.name,
        skillVersion: loadedSkill.manifest.version,
        skillEntry: entry,
        inputValidated: true,
        outputValidated: false,
        sideEffect: loadedSkill.manifest.sideEffect ?? "none"
      }
    };
  }

  const outputValue = "data" in raw ? raw.data : "output" in raw ? raw.output : raw;
  const outputSchema = loadedSkill.manifest.outputSchema ?? input.actionDefinition?.outputSchema;
  const outputErrors = validateSchemaValue(outputSchema, outputValue, "$output");
  if (outputErrors.length > 0) {
    return {
      ok: false,
      error: runtimeError(RUNTIME_ERROR_CODES.SKILL_OUTPUT_INVALID, "Skill output validation failed.", {
        skillName: loadedSkill.manifest.name,
        errors: outputErrors
      }),
      details: {
        implementationType: "skill",
        skillName: loadedSkill.manifest.name,
        skillVersion: loadedSkill.manifest.version,
        skillEntry: entry,
        inputValidated: true,
        outputValidated: false,
        sideEffect: loadedSkill.manifest.sideEffect ?? "none"
      }
    };
  }

  const contextPatch = isPlainObject(raw.contextPatch) ? raw.contextPatch : undefined;
  const skillMeta = isPlainObject(raw.meta) ? raw.meta : undefined;
  return {
    ok: true,
    output: outputValue,
    contextPatch,
    meta: {
      ...skillMeta,
      implementationType: "skill",
      skillName: loadedSkill.manifest.name,
      skillVersion: loadedSkill.manifest.version,
      skillEntry: entry,
      allowedEnvironments: loadedSkill.manifest.allowedEnvironments,
      maxCallsPerRun: loadedSkill.manifest.maxCallsPerRun
    },
    details: {
      implementationType: "skill",
      skillName: loadedSkill.manifest.name,
      skillVersion: loadedSkill.manifest.version,
      skillEntry: entry,
      inputValidated: true,
      outputValidated: true,
      sideEffect: loadedSkill.manifest.sideEffect ?? "none",
      riskLevel: loadedSkill.manifest.riskLevel,
      requiresApproval: loadedSkill.manifest.requiresApproval,
      allowedEnvironments: loadedSkill.manifest.allowedEnvironments,
      maxCallsPerRun: loadedSkill.manifest.maxCallsPerRun
    }
  };
}
