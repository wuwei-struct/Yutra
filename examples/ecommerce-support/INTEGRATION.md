# INTEGRATION - E-commerce Support Pack (P3-05)

## 1) Customer integration prerequisites

Customer should provide:
- order query API
- shipping tracking API
- return eligibility and request API
- refund eligibility and request API
- escalation/ticket API
- target channel mapping strategy

## 2) Adapter layers and replacement map

Current layers:
- `adapters/mock/*` -> runnable baseline
- `adapters/real/*.real.example.mjs` -> real integration skeleton
- `adapters/*.mjs` -> mode-aware facade (mock/real switch)

Facade entrypoints referenced by runtime glue:
- `adapters/order-adapter.mjs`
- `adapters/shipping-adapter.mjs`
- `adapters/return-adapter.mjs`
- `adapters/refund-adapter.mjs`
- `adapters/escalation-adapter.mjs`

Replace these skeleton files with customer implementations:
- `adapters/real/order-adapter.real.example.mjs`
- `adapters/real/shipping-adapter.real.example.mjs`
- `adapters/real/return-adapter.real.example.mjs`
- `adapters/real/refund-adapter.real.example.mjs`
- `adapters/real/escalation-adapter.real.example.mjs`
- `adapters/real/channel-response-adapter.real.example.mjs`

## 3) Auth / timeout / retry alignment

Auth placeholders:
- bearer token: `YUTRA_ECOM_AUTH_TOKEN`
- API key: `YUTRA_ECOM_API_KEY`

Timeout/retry placeholders:
- `YUTRA_ECOM_TIMEOUT_MS`
- `YUTRA_ECOM_RETRY_MAX_ATTEMPTS`
- `YUTRA_ECOM_RETRY_BACKOFF_MS`

Expected mapping into runtime behavior:
- timeout -> `ADAPTER_UPSTREAM_TIMEOUT`
- auth failure -> `ADAPTER_AUTH_FAILED`
- rate limit -> `ADAPTER_RATE_LIMITED`
- upstream error -> `ADAPTER_UPSTREAM_ERROR`
- network failure -> `ADAPTER_NETWORK_ERROR`

## 4) Recommended integration sequence

1. Keep mode=`mock` and baseline certification green.
2. Enable mode=`real` with `dryRun=true` and validate contract mapping.
3. Replace order/shipping adapters and run shipping scenarios.
4. Replace return/refund adapters and run return/refund scenarios.
5. Replace escalation/channel adapters and verify handoff output contract.
6. Run joint debug checklist and UAT plan.

## 5) Integration profile sample

Profile path:
- `integrations/generic-shop-profile/profile.json`

Related files:
- `integrations/generic-shop-profile/adapter-map.json`
- `integrations/generic-shop-profile/policy.override.json`
- `integrations/generic-shop-profile/template.override.md`

## 6) Minimum joint test cases

- shipping normal
- shipping exception
- return expired
- refund high-risk
- handoff policy-required

## 7) Risks and non-goals

- This pack does not include seat management, BI dashboard, or multitenant backend.
- This pack does not include real channel SDK sending logic in P3-05.
- Customer-specific legal/policy wording must be reviewed by business owner.

## 8) Public demo boundary

- `docs/public-demo-boundary.md`
- `docs/ecommerce-deliverables.md`

This public integration note is for mock/demo validation. Customer onboarding, production rollout, UAT, private SOP, and production adapter mapping belong in private implementation repositories.
