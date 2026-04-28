import * as mockAdapter from "./mock/order-adapter.mjs";
import * as realAdapter from "./real/order-adapter.real.example.mjs";
import { resolveAdapterMode } from "./mode.mjs";

function choose(options = {}) {
  return resolveAdapterMode(options) === "real" ? realAdapter : mockAdapter;
}

export async function getOrderById(orderId, options = {}) {
  return choose(options).getOrderById(orderId, options);
}

export async function getOrderByCustomer(customerId, orderId, options = {}) {
  return choose(options).getOrderByCustomer(customerId, orderId, options);
}
