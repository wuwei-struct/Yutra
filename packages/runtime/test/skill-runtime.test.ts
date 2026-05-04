import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { ActionImplementationSpec, AgentSpec } from "@yutra/spec";
import { createSkillRegistry, loadSkillFromDir, skillToAction } from "@yutra/skill-core";
import { describe, expect, it } from "vitest";
import { RUNTIME_ERROR_CODES } from "../src/error-codes";
import { executeRun } from "../src/execute-run";

const workspaceRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const queryShippingDir = resolve(workspaceRoot, "skills", "query-shipping");

function buildSkillAgent(actionName: string, implementation: ActionImplementationSpec, actionMeta?: Record<string, unknown>): AgentSpec {
  return {
    agent: `skill-agent-${actionName}`,
    version: "0.1.0",
    initial_state: "check",
    context: {
      fields: {
        order_id: { type: "string" }
      }
    },
    states: {
      check: {
        actions: [actionName],
        transitions: [{ to: "done" }]
      },
      done: {
        final: true
      }
    },
    actions: [
      {
        name: actionName,
        ...(actionMeta ?? {}),
        implementation
      }
    ]
  };
}

async function createTempSkill(options: {
  name: string;
  inputSchema?: Record<string, unknown>;
  outputSchema?: Record<string, unknown>;
  sideEffect?: "none" | "read" | "write" | "external";
  riskLevel?: "low" | "medium" | "high";
  requiresApproval?: boolean;
  entry?: string;
  script?: string;
}) {
  const root = await mkdtemp(join(tmpdir(), "yutra-skill-runtime-"));
  const skillDir = join(root, options.name);
  await mkdir(join(skillDir, "scripts"), { recursive: true });
  const entry = options.entry ?? "scripts/run.mjs";
  await writeFile(
    join(skillDir, "skill.json"),
    JSON.stringify(
      {
        name: options.name,
        version: "0.1.0",
        type: "tool",
        inputSchema:
          options.inputSchema ??
          {
            type: "object",
            required: ["order_id"],
            properties: {
              order_id: { type: "string" }
            }
          },
        outputSchema:
          options.outputSchema ??
          {
            type: "object",
            required: ["status"],
            properties: {
              status: { type: "string" }
            }
          },
        sideEffect: options.sideEffect ?? "read",
        riskLevel: options.riskLevel ?? "low",
        requiresApproval: options.requiresApproval ?? false,
        entry
      },
      null,
      2
    ),
    "utf8"
  );
  await writeFile(join(skillDir, "SKILL.md"), `# ${options.name}`, "utf8");
  if (options.script) {
    await writeFile(join(skillDir, entry), options.script, "utf8");
  }
  return { root, skillDir };
}

describe("@yutra/runtime skill execution", () => {
  it("runtime executes skill action from skillDir", async () => {
    const spec = buildSkillAgent("query_shipping_status", {
      type: "skill",
      skillName: "query_shipping_status",
      skillDir: queryShippingDir
    });
    const result = await executeRun({
      spec,
      input: { context: { order_id: "ORDER-1001" } },
      options: {
        actionRegistry: {}
      }
    });
    expect(result.status).toBe("completed");
    const succeeded = result.traceEvents?.find((event) => event.type === "action.succeeded");
    expect((succeeded?.payload as Record<string, unknown>)?.implementationType).toBe("skill");
  });

  it("runtime executes skill action from skillSearchPaths", async () => {
    const spec = buildSkillAgent("query_shipping_status", {
      type: "skill",
      skillName: "query_shipping_status"
    });
    const result = await executeRun({
      spec,
      input: { context: { order_id: "ORDER-1002" } },
      options: {
        actionRegistry: {},
        skillSearchPaths: [resolve(workspaceRoot, "skills")]
      }
    });
    expect(result.status).toBe("completed");
  });

  it("runtime executes skill action from injected skillRegistry", async () => {
    const spec = buildSkillAgent("query_shipping_status", {
      type: "skill",
      skillName: "query_shipping_status"
    });
    const skillRegistry = createSkillRegistry({
      paths: [resolve(workspaceRoot, "skills")],
      baseDir: workspaceRoot
    });
    const result = await executeRun({
      spec,
      input: { context: { order_id: "ORDER-1003" } },
      options: {
        actionRegistry: {},
        skillRegistry
      }
    });
    expect(result.status).toBe("completed");
  });

  it("skill input schema invalid returns SKILL_INPUT_INVALID", async () => {
    const spec = buildSkillAgent("query_shipping_status", {
      type: "skill",
      skillName: "query_shipping_status",
      skillDir: queryShippingDir
    });
    const result = await executeRun({
      spec,
      input: { context: {} },
      options: {
        actionRegistry: {}
      }
    });
    expect(result.status).toBe("failed");
    expect(result.error?.code).toBe(RUNTIME_ERROR_CODES.SKILL_INPUT_INVALID);
  });

  it("skill output schema invalid returns SKILL_OUTPUT_INVALID", async () => {
    const temp = await createTempSkill({
      name: "bad_output_skill",
      script: `
export async function run() {
  return { ok: true, data: { status: 123 } };
}
`
    });
    const spec = buildSkillAgent("bad_output_skill", {
      type: "skill",
      skillName: "bad_output_skill",
      skillDir: temp.skillDir
    });
    const result = await executeRun({
      spec,
      input: { context: { order_id: "ORDER-1004" } },
      options: { actionRegistry: {} }
    });
    expect(result.status).toBe("failed");
    expect(result.error?.code).toBe(RUNTIME_ERROR_CODES.SKILL_OUTPUT_INVALID);
    await rm(temp.root, { recursive: true, force: true });
  });

  it("missing skill entry returns SKILL_ENTRY_MISSING", async () => {
    const temp = await createTempSkill({
      name: "missing_entry_skill",
      entry: "scripts/missing.mjs"
    });
    const spec = buildSkillAgent("missing_entry_skill", {
      type: "skill",
      skillName: "missing_entry_skill",
      skillDir: temp.skillDir
    });
    const result = await executeRun({
      spec,
      input: { context: { order_id: "ORDER-1005" } },
      options: { actionRegistry: {} }
    });
    expect(result.status).toBe("failed");
    expect(result.error?.code).toBe(RUNTIME_ERROR_CODES.SKILL_ENTRY_MISSING);
    await rm(temp.root, { recursive: true, force: true });
  });

  it("skill entry throw returns SKILL_EXECUTION_FAILED", async () => {
    const temp = await createTempSkill({
      name: "throw_skill",
      script: `
export async function run() {
  throw new Error("boom");
}
`
    });
    const spec = buildSkillAgent("throw_skill", {
      type: "skill",
      skillName: "throw_skill",
      skillDir: temp.skillDir
    });
    const result = await executeRun({
      spec,
      input: { context: { order_id: "ORDER-1006" } },
      options: { actionRegistry: {} }
    });
    expect(result.status).toBe("failed");
    expect(result.error?.code).toBe(RUNTIME_ERROR_CODES.SKILL_EXECUTION_FAILED);
    await rm(temp.root, { recursive: true, force: true });
  });

  it("skill output can produce contextPatch", async () => {
    const temp = await createTempSkill({
      name: "context_patch_skill",
      script: `
export async function run(input) {
  return {
    ok: true,
    data: { status: "in_transit" },
    contextPatch: {
      shipping_status: "in_transit",
      shipping_order: input.order_id
    }
  };
}
`
    });
    const spec = buildSkillAgent(
      "context_patch_skill",
      {
        type: "skill",
        skillName: "context_patch_skill",
        skillDir: temp.skillDir
      },
      {
        sideEffect: "external"
      }
    );
    const result = await executeRun({
      spec,
      input: { context: { order_id: "ORDER-1007" } },
      options: { actionRegistry: {} }
    });
    expect(result.status).toBe("completed");
    expect(result.context.shipping_status).toBe("in_transit");
    expect(result.context.shipping_order).toBe("ORDER-1007");
    const started = result.traceEvents?.find((event) => event.type === "action.started");
    expect((started?.payload as Record<string, unknown>)?.sideEffect).toBe("external");
    await rm(temp.root, { recursive: true, force: true });
  });

  it("skill action trace payload contains implementationType=skill", async () => {
    const spec = buildSkillAgent("query_shipping_status", {
      type: "skill",
      skillName: "query_shipping_status",
      skillDir: queryShippingDir
    });
    const result = await executeRun({
      spec,
      input: { context: { order_id: "ORDER-1008" } },
      options: { actionRegistry: {} }
    });
    expect(result.status).toBe("completed");
    const started = result.traceEvents?.find((event) => event.type === "action.started");
    expect((started?.payload as Record<string, unknown>)?.implementationType).toBe("skill");
    expect((started?.payload as Record<string, unknown>)?.skillName).toBe("query_shipping_status");
  });

  it("sideEffect/risk/requiresApproval from skill metadata are visible in action trace payload", async () => {
    const loaded = await loadSkillFromDir(queryShippingDir);
    const skillAction = skillToAction(loaded);
    const spec: AgentSpec = {
      agent: "skill-trace-agent",
      version: "0.1.0",
      initial_state: "s1",
      states: {
        s1: {
          actions: [skillAction.name],
          transitions: [{ to: "done" }]
        },
        done: { final: true }
      },
      actions: [skillAction]
    };
    const result = await executeRun({
      spec,
      input: { context: { order_id: "ORDER-1009" } },
      options: {
        actionRegistry: {},
        skillSearchPaths: [resolve(workspaceRoot, "skills")]
      }
    });
    expect(result.status).toBe("completed");
    const started = result.traceEvents?.find((event) => event.type === "action.started");
    const payload = started?.payload as Record<string, unknown>;
    expect(payload.sideEffect).toBe("read");
    expect(payload.riskLevel).toBe("low");
    expect(payload.requiresApproval).toBe(false);
  });
});
