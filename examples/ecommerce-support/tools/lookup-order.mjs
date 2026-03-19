import { createFunctionTool } from "@yutra/tool-core";

const ORDER_DB = {
  "EC-1001": { orderId: "EC-1001", status: "shipped", shippingStatus: "in_transit", returnEligible: true, refundEligible: true },
  "EC-1002": { orderId: "EC-1002", status: "delivered", shippingStatus: "delivered", returnEligible: true, refundEligible: true },
  "EC-404": { orderId: "EC-404", status: "missing", shippingStatus: "unknown", returnEligible: false, refundEligible: false }
};

export const lookupOrderTool = createFunctionTool({
  name: "lookup_order_tool",
  sideEffect: "read",
  description: "Lookup order information by order_id.",
  handler: async (_input, ctx) => {
    const orderId = String(ctx.context.order_id ?? "");
    const record = ORDER_DB[orderId];

    if (!record || record.status === "missing") {
      return {
        ok: true,
        data: {
          orderFound: false,
          orderId
        }
      };
    }

    return {
      ok: true,
      data: {
        orderFound: true,
        ...record
      }
    };
  }
});
