# Shipping Adapter Contract (v0.1)

Interface:
- `getShippingStatus(orderOrTracking)`

Required output fields:
- `tracking_no`
- `shipping_status`
- `carrier`
- `estimated_delivery_at` (optional)
- `latest_event`
- `is_delayed`
- `is_exception`

Notes:
- Mock implementation: `adapters/shipping-adapter.mjs`
- Runtime glue: `tools/check-shipping.mjs`

## Implementation Notes (P3-05)

- Real integration skeleton: `adapters/real/shipping-adapter.real.example.mjs`
- Contract mapping point: `mapShippingResponse(...)`
- Delay/exception normalization:
  - delayed threshold from `policyParams.delayedShipmentThresholdDays`
  - upstream exceptions normalized into `is_exception`
- Missing ETA/latest event should return safe defaults, not crash
