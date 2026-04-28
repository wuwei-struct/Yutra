# CONFIG - E-commerce Support Pack (P3-05)

## 1) Adapter mode switch

Supported adapter modes:
- `mock` (default)
- `real` (implementation skeleton)

Switch options:
1. environment variable:
   - `YUTRA_ECOM_ADAPTER_MODE=mock|real`
2. runtime context override in input:
   - `context.adapter_mode`
3. integration profile:
   - `integrations/generic-shop-profile/profile.json`

Dry-run switch:
- `YUTRA_ECOM_ADAPTER_DRY_RUN=true|false`
- `context.adapter_dry_run`

## 2) .env configuration keys

See `.env.example` for full list.

Core keys:
- `YUTRA_ECOM_API_BASE_URL`
- `YUTRA_ECOM_AUTH_TOKEN`
- `YUTRA_ECOM_API_KEY`
- `YUTRA_ECOM_TIMEOUT_MS`
- `YUTRA_ECOM_RETRY_MAX_ATTEMPTS`
- `YUTRA_ECOM_RETRY_BACKOFF_MS`
- `YUTRA_ECOM_ENVIRONMENT`

Adapter-specific base URLs (optional):
- `YUTRA_ECOM_ORDER_API_BASE_URL`
- `YUTRA_ECOM_SHIPPING_API_BASE_URL`
- `YUTRA_ECOM_RETURN_API_BASE_URL`
- `YUTRA_ECOM_REFUND_API_BASE_URL`
- `YUTRA_ECOM_ESCALATION_API_BASE_URL`
- `YUTRA_ECOM_CHANNEL_API_BASE_URL`

## 3) Policy profile and parameters

Policy files:
- `policies/default.demo.json`
- `policies/prod-like.example.json`
- `integrations/generic-shop-profile/policy.override.json`

Core parameters:
- `returnWindowDays`
- `refundAutoApproveBeforeShipment`
- `delayedShipmentThresholdDays`
- `allowPartialRefund`
- `highRiskAmountThreshold`
- `requireHumanForDamagedGoods`
- `requireHumanForRefundAfterDelivery`

## 4) Adapter replacement guide

Facade entrypoints kept stable for runtime/tool calls:
- `adapters/order-adapter.mjs`
- `adapters/shipping-adapter.mjs`
- `adapters/return-adapter.mjs`
- `adapters/refund-adapter.mjs`
- `adapters/escalation-adapter.mjs`

Customer should replace these real skeleton files first:
- `adapters/real/order-adapter.real.example.mjs`
- `adapters/real/shipping-adapter.real.example.mjs`
- `adapters/real/return-adapter.real.example.mjs`
- `adapters/real/refund-adapter.real.example.mjs`
- `adapters/real/escalation-adapter.real.example.mjs`
- `adapters/real/channel-response-adapter.real.example.mjs`

Required upstream data per adapter:
- order: order/payment/shipment facts
- shipping: tracking status and latest event
- return: eligibility + request endpoint
- refund: eligibility + request endpoint
- escalation: ticket queue and priority routing
- channel: target channel payload requirements

## 5) Fixtures mapping to real systems

- `fixtures/order-sample.json` -> order API payload sample
- `fixtures/shipping-sample.json` -> shipping API payload sample
- `fixtures/return-sample.json` -> return business sample
- `fixtures/refund-sample.json` -> refund business sample

## 6) Template and channel output

Templates:
- `response-templates/shipping.md`
- `response-templates/return.md`
- `response-templates/refund.md`
- `response-templates/handoff.md`

Channel output contract:
- `contracts/channel-contract.md`
- renderers:
  - `adapters/mock/channel-response-adapter.mjs`
  - `adapters/real/channel-response-adapter.real.example.mjs`

## 7) Business-owner confirmations required

- final policy parameter values
- brand/customer-service tone in templates
- handoff rules and queue ownership
- auth owner and secret management process

## 8) Commercial delivery references

- `docs/ecommerce-scope-checklist.md`
- `docs/ecommerce-pricing-scope.md`
- `docs/ecommerce-delivery-plan-template.md`
- `docs/ecommerce-delivery-risks.md`
- `docs/ecommerce-uat-plan.md`
- `docs/ecommerce-joint-debug-checklist.md`
- `docs/ecommerce-rollout-checklist.md`
