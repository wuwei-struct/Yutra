import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import type { AgentSpec, TraceEvent } from "@yutra/spec";
import { RUNTIME_ERROR_CODES } from "../src/error-codes";
import { executeRun } from "../src/execute-run";
import { loadPolicyPackFile, parsePolicyPack } from "../src/policy";
import type { PolicyPack } from "../src/types";

const policySpec: AgentSpec = {
  agent: "governance-agent",
  initial_state: "start",
  actions: [
    { name: "safe_action", side_effect: "none" },
    { name: "dangerous_action", side_effect: "external" }
  ],
  states: {
    start: {
      actions: ["safe_action", "dangerous_action"],
      transitions: [{ to: "done" }]
    },
    done: {
      final: true
    }
  }
};

function getEventsByType(events: TraceEvent[] | undefined, type: TraceEvent["type"]): TraceEvent[] {
  return (events ?? []).filter((event) => event.type === type);
}

describe("@yutra/runtime governance core", () => {
  it("policy pack can be loaded and applied", async () => {
    const dir = await mkdtemp(join(tmpdir(), "yutra-policy-pack-"));
    const jsonPath = join(dir, "policy.json");
    const yamlPath = join(dir, "policy.yaml");
    const policy = {
      name: "demo-governance",
      version: "0.1.0",
      actionRules: [{ action: "safe_action", allow: true }]
    };

    await writeFile(jsonPath, JSON.stringify(policy, null, 2), "utf8");
    await writeFile(
      yamlPath,
      ["name: demo-governance-yaml", "version: 0.1.0", "actionRules:", "  - action: safe_action", "    allow: true"].join(
        "\n"
      ),
      "utf8"
    );

    const loadedJson = loadPolicyPackFile(jsonPath);
    const loadedYaml = loadPolicyPackFile(yamlPath);
    await rm(dir, { recursive: true, force: true });

    expect(loadedJson.name).toBe("demo-governance");
    expect(loadedYaml.name).toBe("demo-governance-yaml");
  });

  it("allowed action still executes", async () => {
    const result = await executeRun({
      spec: policySpec,
      options: {
        policyPack: parsePolicyPack({
          name: "allow-all",
          actionRules: [{ action: "dangerous_action", allow: true }]
        }),
        actionRegistry: {
          safe_action: async () => ({ ok: true, contextPatch: { safe: true } }),
          dangerous_action: async () => ({ ok: true, contextPatch: { externalDone: true } })
        }
      }
    });

    expect(result.status).toBe("completed");
    expect(result.context.safe).toBe(true);
    expect(result.context.externalDone).toBe(true);
  });

  it("denied action fails with POLICY_ACTION_DENIED", async () => {
    const result = await executeRun({
      spec: policySpec,
      options: {
        environment: "prod-like",
        policyPack: parsePolicyPack({
          name: "prod-lockdown",
          version: "1.0.0",
          actionRules: [
            {
              action: "dangerous_action",
              allow: false,
              reason: "External action blocked in prod-like.",
              reasonCode: "external_blocked",
              environments: ["prod-like"]
            }
          ]
        }),
        actionRegistry: {
          safe_action: async () => ({ ok: true, contextPatch: { safe: true } }),
          dangerous_action: async () => ({ ok: true, contextPatch: { externalDone: true } })
        }
      }
    });

    expect(result.status).toBe("failed");
    expect(result.error?.code).toBe(RUNTIME_ERROR_CODES.POLICY_ACTION_DENIED);
    const actionFailed = getEventsByType(result.traceEvents, "action.failed")[0];
    expect((actionFailed.payload as Record<string, unknown>)?.environment).toBe("prod-like");
  });

  it("requireHandoff action emits handoff.requested with structured payload", async () => {
    const policyPack: PolicyPack = {
      name: "handoff-pack",
      version: "1.2.0",
      actionRules: [
        {
          action: "dangerous_action",
          requireHandoff: true,
          reason: "Needs human approval.",
          reasonCode: "approval_required"
        }
      ],
      handoffRules: [
        {
          action: "dangerous_action",
          reasonCode: "approval_required",
          summaryTemplate: "Action {action} requires manual approval in state {state}."
        }
      ]
    };

    const result = await executeRun({
      spec: policySpec,
      options: {
        environment: "demo",
        policyPack,
        actionRegistry: {
          safe_action: async () => ({ ok: true, contextPatch: { safe: true } }),
          dangerous_action: async () => ({ ok: true, contextPatch: { externalDone: true } })
        }
      }
    });

    expect(result.status).toBe("handoff");
    const handoff = getEventsByType(result.traceEvents, "handoff.requested")[0];
    const payload = (handoff?.payload ?? {}) as Record<string, unknown>;
    expect(payload.reasonCode).toBe("approval_required");
    expect(payload.source).toBe("policy");
    expect(payload.summary).toBe("Action dangerous_action requires manual approval in state start.");
    expect(payload.policyName).toBe("handoff-pack");
  });

  it("environment profile changes policy behavior deterministically", async () => {
    const policyPack: PolicyPack = {
      name: "env-aware",
      actionRules: [
        {
          action: "dangerous_action",
          allow: false,
          reason: "Denied in prod-like.",
          environments: ["prod-like"]
        }
      ]
    };

    const dev = await executeRun({
      spec: policySpec,
      options: {
        environment: "dev",
        policyPack,
        actionRegistry: {
          safe_action: async () => ({ ok: true }),
          dangerous_action: async () => ({ ok: true })
        }
      }
    });

    const prodLike = await executeRun({
      spec: policySpec,
      options: {
        environment: "prod-like",
        policyPack,
        actionRegistry: {
          safe_action: async () => ({ ok: true }),
          dangerous_action: async () => ({ ok: true })
        }
      }
    });

    expect(dev.status).toBe("completed");
    expect(prodLike.status).toBe("failed");
    expect(prodLike.error?.code).toBe(RUNTIME_ERROR_CODES.POLICY_ACTION_DENIED);
  });

  it("sideEffect rule can block external/write action", async () => {
    const result = await executeRun({
      spec: policySpec,
      options: {
        environment: "prod-like",
        policyPack: parsePolicyPack({
          name: "sideeffect-guard",
          sideEffectRules: [
            {
              sideEffect: "external",
              allow: false,
              reason: "External calls disabled.",
              reasonCode: "external_disabled",
              environments: ["prod-like"]
            }
          ]
        }),
        actionRegistry: {
          safe_action: async () => ({ ok: true }),
          dangerous_action: async () => ({ ok: true })
        }
      }
    });

    expect(result.status).toBe("failed");
    expect(result.error?.code).toBe(RUNTIME_ERROR_CODES.POLICY_SIDEEFFECT_DENIED);
  });

  it("handoff payload contains reasonCode/source/summary", async () => {
    const result = await executeRun({
      spec: {
        agent: "state-handoff",
        initial_state: "handoff_state",
        states: {
          handoff_state: {
            handoff: true
          }
        }
      },
      options: {
        environment: "demo",
        actionRegistry: {}
      }
    });

    expect(result.status).toBe("handoff");
    const handoff = getEventsByType(result.traceEvents, "handoff.requested")[0];
    const payload = (handoff?.payload ?? {}) as Record<string, unknown>;
    expect(payload.reasonCode).toBe("state_handoff");
    expect(payload.source).toBe("runtime");
    expect(typeof payload.summary).toBe("string");
  });
});
