# E-commerce Support Pack Delivery Risks (P3-04)

## 1) Interface risks

- upstream APIs are unstable or undocumented
- required fields are missing for order/shipping/refund decisions
- order, shipping, and refund systems return inconsistent facts

Mitigation:
- contract-first mapping
- fixture parity checks
- joint integration test with explicit mismatch log

## 2) Policy risks

- policy thresholds are not frozen before integration
- legal/business wording is not finalized
- refund exception rules keep changing during UAT

Mitigation:
- enforce policy freeze checkpoint
- require business/legal sign-off on templates
- classify each late change as scope or defect

## 3) Channel risks

- output format varies by channel
- platform constraints differ (length, structure, escalation mechanics)
- handoff routing differs across customer teams

Mitigation:
- keep ChannelMessage contract stable
- isolate channel formatter from SOP logic
- define queue ownership before UAT

## 4) Engineering risks

- mock behavior differs from production behavior
- auth/rate-limit/error-code alignment issues appear late
- edge-case volume grows quickly in UAT

Mitigation:
- run certification + targeted integration cases continuously
- include trace/audit evidence in defect triage
- keep clear rollback and escalation criteria
