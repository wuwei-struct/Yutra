# E-commerce Joint Debug Checklist (P3-05)

## Before joint debug

- [ ] customer API docs are available
- [ ] auth owner is assigned
- [ ] .env keys are prepared (no real secret committed)
- [ ] adapter mode strategy is agreed (`mock`/`real`/dry-run)

## Adapter readiness checks

- [ ] order adapter maps required fields
- [ ] shipping adapter maps delay/exception correctly
- [ ] return adapter maps eligibility and request creation
- [ ] refund adapter maps risk and status transitions
- [ ] escalation adapter maps ticket queue/priority
- [ ] channel adapter maps message contract by channel type

## Field mapping checks

- [ ] order_id and customer_id consistently mapped
- [ ] status/payment/shipment semantics aligned
- [ ] reason_code dictionary aligned with business team
- [ ] nullable fields handled explicitly

## Policy/template checks

- [ ] policy parameters frozen for current iteration
- [ ] response templates reviewed by business/legal
- [ ] handoff rules and queue owner confirmed

## Error/retry/timeout checks

- [ ] auth failure path validated
- [ ] rate-limit (429) behavior validated
- [ ] upstream timeout path validated
- [ ] retry/backoff settings agreed
- [ ] idempotency note applied for write actions (return/refund/escalation)

## Joint debug done criteria

- [ ] mock mode still green
- [ ] real skeleton dry-run validated
- [ ] at least one end-to-end handoff case verified
- [ ] trace and audit bundle available for reviewed run
