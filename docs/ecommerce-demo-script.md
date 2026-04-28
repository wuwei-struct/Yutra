# E-commerce Support Demo Script (Customer-facing, P3-04)

## Segment 1: Business context (30-45s)

This pack is designed for small-to-mid merchants with high-frequency post-sale support:
- shipping inquiries
- return requests
- refund requests
- human handoff for risky cases

Positioning:
- this is a delivery pack, not a customer-service SaaS platform
- this runs on deterministic state-machine execution

## Segment 2: Happy path run (60-90s)

Run:
- shipping normal case
- one return/refund completed case

Explain:
- where the request enters the SOP
- which actions are called
- why it reaches completed deterministically

## Segment 3: Exception and handoff (45-60s)

Run:
- refund high-risk or shipping exception case

Explain:
- which policy/risk rule triggers handoff
- what handoff payload and reasonCode look like

## Segment 4: Evidence and delivery model (45-60s)

Show:
- trace timeline
- audit bundle JSON
- adapter contracts and replacement points
- policy profile files

Close with:
- what is included in standard delivery
- what requires customer-system integration in next phase
