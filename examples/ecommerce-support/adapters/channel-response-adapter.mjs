import * as mockAdapter from "./mock/channel-response-adapter.mjs";
import * as realAdapter from "./real/channel-response-adapter.real.example.mjs";
import { resolveAdapterMode } from "./mode.mjs";

function choose(options = {}) {
  return resolveAdapterMode(options) === "real" ? realAdapter : mockAdapter;
}

export function renderResponseTemplateToChannelMessage(input, options = {}) {
  return choose(options).renderResponseTemplateToChannelMessage(input, options);
}
