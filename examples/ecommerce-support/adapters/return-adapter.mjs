import * as mockAdapter from "./mock/return-adapter.mjs";
import * as realAdapter from "./real/return-adapter.real.example.mjs";
import { resolveAdapterMode } from "./mode.mjs";

function choose(options = {}) {
  return resolveAdapterMode(options) === "real" ? realAdapter : mockAdapter;
}

export async function checkReturnEligibility(order, input = {}) {
  return choose(input).checkReturnEligibility(order, input);
}

export async function createReturnRequest(order, reason = "customer_request", input = {}) {
  return choose(input).createReturnRequest(order, reason, input);
}
