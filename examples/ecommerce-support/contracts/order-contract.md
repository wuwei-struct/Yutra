# Order Adapter Contract (v0.1)

Interface:
- `getOrderById(orderId)`
- `getOrderByCustomer(customerId, orderId?)`

Required output fields:
- `order_id`
- `customer_id`
- `status`
- `shipment_status`
- `payment_status`
- `created_at`
- `delivered_at` (optional)
- `items[]`
- `amount`
- `currency`

Notes:
- Mock implementation: `adapters/order-adapter.mjs`
- Runtime glue: `tools/lookup-order.mjs`

## Implementation Notes (P3-05)

- Real integration skeleton: `adapters/real/order-adapter.real.example.mjs`
- Auth entry: `YUTRA_ECOM_AUTH_TOKEN` / `YUTRA_ECOM_API_KEY`
- Timeout/retry entry: `YUTRA_ECOM_TIMEOUT_MS`, `YUTRA_ECOM_RETRY_MAX_ATTEMPTS`, `YUTRA_ECOM_RETRY_BACKOFF_MS`
- Contract mapping point: `mapOrderResponse(...)`
- Missing required fields fail with `ADAPTER_CONTRACT_FIELD_MISSING`
- Common upstream mapping expectations:
  - order_status -> `status`
  - payment_status -> `payment_status`
  - shipment_status -> `shipment_status`
