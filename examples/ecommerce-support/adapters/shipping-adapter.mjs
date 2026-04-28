import * as mockAdapter from "./mock/shipping-adapter.mjs";
import * as realAdapter from "./real/shipping-adapter.real.example.mjs";
import { resolveAdapterMode } from "./mode.mjs";

function choose(options = {}) {
  return resolveAdapterMode(options) === "real" ? realAdapter : mockAdapter;
}

export async function getShippingStatus(input, options = {}) {
  return choose(options).getShippingStatus(input, options);
}
