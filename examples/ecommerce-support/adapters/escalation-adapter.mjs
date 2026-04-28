import * as mockAdapter from "./mock/escalation-adapter.mjs";
import * as realAdapter from "./real/escalation-adapter.real.example.mjs";
import { resolveAdapterMode } from "./mode.mjs";

function choose(options = {}) {
  return resolveAdapterMode(options) === "real" ? realAdapter : mockAdapter;
}

export async function createEscalationTicket(payload, options = {}) {
  return choose(options).createEscalationTicket(payload, options);
}
