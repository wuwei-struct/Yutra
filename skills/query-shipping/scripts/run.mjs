export async function run(input, ctx) {
  return {
    ok: true,
    data: {
      status: "in_transit",
      carrier: "mock_carrier",
      estimatedDelivery: "2026-01-01"
    },
    meta: {
      stub: true,
      input,
      context: ctx
    }
  };
}
