import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { buildAuditBundle } from "../../packages/trace/src/audit-bundle";
import { MemoryTraceStorage } from "../../packages/trace/src/memory-storage";
import { loadAndExecuteDslFile } from "../../packages/runtime/src/load-and-execute";

const workspaceRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const packDir = resolve(workspaceRoot, "examples", "ecommerce-support");

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8").replace(/^\uFEFF/, ""));
}

describe("P3-03 ecommerce adapter integration readiness", () => {
  it("order adapter mock output matches contract shape", async () => {
    const mod = await import(resolve(packDir, "adapters", "order-adapter.mjs"));
    const order = await mod.getOrderById("EC-SHIP-NORMAL", { policyParams: {} });
    expect(typeof order.order_id).toBe("string");
    expect(typeof order.customer_id).toBe("string");
    expect(typeof order.status).toBe("string");
    expect(typeof order.shipment_status).toBe("string");
    expect(typeof order.payment_status).toBe("string");
    expect(typeof order.created_at).toBe("string");
    expect(Array.isArray(order.items)).toBe(true);
    expect(typeof order.amount).toBe("number");
    expect(typeof order.currency).toBe("string");
  });

  it("shipping adapter mock output matches contract shape", async () => {
    const mod = await import(resolve(packDir, "adapters", "shipping-adapter.mjs"));
    const shipping = await mod.getShippingStatus({ shipment_status: "in_transit", delayed_days: 5, tracking_number: "T1" }, { policyParams: { delayedShipmentThresholdDays: 3 } });
    expect(["string", "object"]).toContain(typeof shipping.tracking_no);
    expect(typeof shipping.shipping_status).toBe("string");
    expect(typeof shipping.carrier).toBe("string");
    expect(typeof shipping.latest_event).toBe("string");
    expect(typeof shipping.is_delayed).toBe("boolean");
    expect(typeof shipping.is_exception).toBe("boolean");
  });

  it("return adapter mock output matches contract shape", async () => {
    const mod = await import(resolve(packDir, "adapters", "return-adapter.mjs"));
    const decision = await mod.checkReturnEligibility({ found: true, return_window_expired: true }, { policyParams: { returnWindowDays: 7 } });
    expect(typeof decision.eligible).toBe("boolean");
    expect(typeof decision.reason_code).toBe("string");
    expect(typeof decision.reason).toBe("string");
    expect(typeof decision.next_step).toBe("string");

    const created = await mod.createReturnRequest({ order_id: "EC-RET-ELIGIBLE" }, "customer_request");
    expect(typeof created.request_id).toBe("string");
  });

  it("refund adapter mock output matches contract shape", async () => {
    const mod = await import(resolve(packDir, "adapters", "refund-adapter.mjs"));
    const decision = await mod.checkRefundEligibility({ found: true, status: "unshipped", amount: 100 }, { policyParams: { refundAutoApproveBeforeShipment: true } });
    expect(typeof decision.eligible).toBe("boolean");
    expect(typeof decision.reason_code).toBe("string");
    expect(typeof decision.reason).toBe("string");
    expect(typeof decision.refund_status).toBe("string");
    expect(typeof decision.next_step).toBe("string");

    const created = await mod.createRefundRequest({ order_id: "EC-RFD-BEFORE", amount: 100 }, 100, "customer_request");
    expect(typeof created.refund_request_id).toBe("string");
  });

  it("escalation adapter mock output matches contract shape", async () => {
    const mod = await import(resolve(packDir, "adapters", "escalation-adapter.mjs"));
    const ticket = await mod.createEscalationTicket({ order_id: "EC-1", reason_code: "high_risk_refund" });
    expect(typeof ticket.ticket_id).toBe("string");
    expect(typeof ticket.queue).toBe("string");
    expect(typeof ticket.priority).toBe("string");
    expect(typeof ticket.handoff_status).toBe("string");
    expect(typeof ticket.next_step).toBe("string");
  });

  it("channel response contract output is stable", async () => {
    const mod = await import(resolve(packDir, "adapters", "channel-response-adapter.mjs"));
    const message = mod.renderResponseTemplateToChannelMessage({
      channel: "generic",
      templateKey: "handoff",
      runId: "run-1",
      state: "handoff_human",
      variables: { order_id: "EC-1", handoff_reason: "high_risk_refund" }
    });

    expect(["taobao", "douyin", "wechat", "webchat", "generic"]).toContain(message.channel);
    expect(["text", "handoff_notice", "structured"]).toContain(message.message_type);
    expect(typeof message.text).toBe("string");
    expect(typeof message.metadata).toBe("object");
  });

  it("integration docs exist and reference actual adapter files", () => {
    const integration = readFileSync(resolve(packDir, "INTEGRATION.md"), "utf8");
    const config = readFileSync(resolve(packDir, "CONFIG.md"), "utf8");

    const required = [
      "adapters/order-adapter.mjs",
      "adapters/shipping-adapter.mjs",
      "adapters/return-adapter.mjs",
      "adapters/refund-adapter.mjs",
      "adapters/escalation-adapter.mjs"
    ];

    for (const item of required) {
      expect(existsSync(resolve(packDir, item))).toBe(true);
      expect(integration.includes(item)).toBe(true);
      expect(config.includes(item)).toBe(true);
    }

    expect(existsSync(resolve(workspaceRoot, "docs", "ecommerce-client-onboarding-checklist.md"))).toBe(true);
  });

  it("pack manifest stays valid after adapterization", () => {
    const manifest = readJson(resolve(packDir, "pack.manifest.json"));
    expect(manifest.pack).toBe("ecommerce-support-pack");
    expect(Array.isArray(manifest.includes.docs)).toBe(true);
    expect(manifest.includes.docs.includes("INTEGRATION.md")).toBe(true);
    expect(manifest.includes.docs.includes("contracts/order-contract.md")).toBe(true);
  });

  it("audit bundle still exports after adapterization", async () => {
    const { actionRegistry } = await import(resolve(packDir, "actions.mjs"));
    const traceStorage = new MemoryTraceStorage();
    const input = readJson(resolve(packDir, "demo-inputs", "handoff-case.json"));

    const result = await loadAndExecuteDslFile(resolve(packDir, "agent.yutra.yaml"), { actionRegistry, traceStorage }, input);
    expect(["completed", "handoff"]).toContain(result.status);

    const audit = await buildAuditBundle(traceStorage, result.runId);
    expect(typeof audit.meta.runId).toBe("string");
    expect(audit.traceEvents.length).toBeGreaterThan(0);
  });
});


