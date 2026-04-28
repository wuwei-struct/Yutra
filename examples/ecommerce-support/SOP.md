# SOP - E-commerce Support Pack (P3-03)

## Shipping SOP

`triage -> fetch_order -> answer_shipping -> resolved|handoff_human`

Handoff triggers:
- order missing
- shipping exception
- missing tracking

## Return SOP

`triage -> fetch_order -> check_return_eligibility -> create_return_request|inform_policy|handoff_human`

Handoff triggers:
- missing required info
- damaged goods under manual-review policy

## Refund SOP

`triage -> fetch_order -> check_refund_eligibility -> create_refund_request|inform_policy|handoff_human`

Handoff triggers:
- high-risk/high-amount refund
- policy requiring manual review after delivery
- missing required info

## Handoff SOP

`handoff_human` is the explicit escalation state.
Escalation adapter contract governs ticket payload shape and queue metadata.

## Execution vs wording boundary

- State/Guard/Action/Transition controls execution.
- `response-templates/*` + channel output contract controls customer-facing text.
