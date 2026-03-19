import { createFunctionTool } from "@yutra/tool-core";

export const checkShippingTool = createFunctionTool({
  name: "check_shipping_tool",
  sideEffect: "read",
  description: "Return current shipping status.",
  handler: async (_input, ctx) => {
    const shippingStatus = String(ctx.context.shipping_status ?? "unknown");

    return {
      ok: true,
      data: {
        shippingStatus,
        note: shippingStatus === "in_transit" ? "Package is still in transit." : "Shipping status available."
      }
    };
  }
});
