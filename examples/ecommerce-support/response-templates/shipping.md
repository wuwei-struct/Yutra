# Shipping Response Templates

## neutral

Order {{order_id}} shipping status: {{shipping_status}}.
If delayed: {{shipping_delay_days}} day(s).
Next update: {{shipping_note}}.

## service

Thanks for waiting. I checked order {{order_id}} for you.
Current logistics status is {{shipping_status}}.
Delay window: {{shipping_delay_days}} day(s), and we will keep tracking this for you.

## handoff

We need manual support for this shipping request.
Reason: {{handoff_reason}}.
A human support agent will follow up on order {{order_id}}.
