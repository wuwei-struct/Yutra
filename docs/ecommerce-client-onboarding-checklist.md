# E-commerce Client Onboarding Checklist

## Integration assets required from customer

- Order API (by order_id / customer)
- Shipping API (status, latest event)
- Return API (eligibility + request)
- Refund API (eligibility + request)
- Escalation/Ticket API
- Channel mapping strategy (taobao/douyin/wechat/webchat/generic)
- Auth strategy (token/api key rotation owner)

## Policy decisions to confirm

- `returnWindowDays`
- `refundAutoApproveBeforeShipment`
- `delayedShipmentThresholdDays`
- `allowPartialRefund`
- `highRiskAmountThreshold`
- `requireHumanForDamagedGoods`
- `requireHumanForRefundAfterDelivery`

## Response template confirmations

- shipping template wording
- return template wording
- refund template wording
- handoff notice wording

## Handoff rule confirmations

- missing order or missing tracking behavior
- damaged goods manual review
- high-risk / high-amount refund escalation
- policy-required manual review queue and priority

## Acceptance checklist

1. Shipping path validates and runs (normal + exception)
2. Return path validates and runs (eligible + expired/damaged)
3. Refund path validates and runs (before-shipment + high-risk)
4. At least one handoff path emits structured handoff payload
5. Trace export and audit bundle export are available

## Out of scope for this onboarding

- Customer service backend construction
- Seat management / assignment engine
- BI/quality-inspection platforms
- Full OMS/ERP/CRM platform integration
- Multitenant SaaS platform features

## Related implementation documents

- `docs/ecommerce-scope-checklist.md`
- `docs/ecommerce-delivery-plan-template.md`
- `docs/ecommerce-delivery-risks.md`
- `docs/ecommerce-deliverables.md`
- `docs/ecommerce-uat-plan.md`
- `docs/ecommerce-joint-debug-checklist.md`
- `docs/ecommerce-rollout-checklist.md`
- `examples/ecommerce-support/.env.example`
- `examples/ecommerce-support/integrations/generic-shop-profile/profile.json`
