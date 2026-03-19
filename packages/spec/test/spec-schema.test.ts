import { describe, expect, it } from "vitest";
import { agentSpecSchema, itHelpdeskAgentFixture, minimalAgentFixture } from "../src/index";

describe("@yutra/spec agentSpecSchema", () => {
  it("valid minimal agent spec can parse", () => {
    const result = agentSpecSchema.safeParse(minimalAgentFixture);
    expect(result.success).toBe(true);
  });

  it("valid it-helpdesk spec can parse", () => {
    const result = agentSpecSchema.safeParse(itHelpdeskAgentFixture);
    expect(result.success).toBe(true);
  });

  it("invalid missing required field should fail", () => {
    const invalid = {
      agent: "broken-agent",
      states: {
        idle: {}
      }
    };

    const result = agentSpecSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});
