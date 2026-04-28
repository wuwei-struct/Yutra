import * as mockAdapter from "./mock/refund-adapter.mjs";
import * as realAdapter from "./real/refund-adapter.real.example.mjs";
import { resolveAdapterMode } from "./mode.mjs";

function choose(options = {}) {
  return resolveAdapterMode(options) === "real" ? realAdapter : mockAdapter;
}

export async function checkRefundEligibility(order, input = {}) {
  return choose(input).checkRefundEligibility(order, input);
}

export async function createRefundRequest(order, amount, reason = "customer_request", input = {}) {
  return choose(input).createRefundRequest(order, amount, reason, input);
}
