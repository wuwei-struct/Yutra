# Business Rule Configuration

Business Rule Configuration is the product layer between customer SOP and Yutra executable assets.

It is not a generic form. It is a structured representation of business decisions, thresholds, exception paths, adapter needs, templates, and certification cases. Customers should configure rules in their own business language; Yutra compiles those rules into DSL, policy, templates, and tests.

This document describes vNext direction. Pack Config schema and UI schema are not implemented in this iteration.

## Why This Layer Exists

Yutra already has DSL and Runtime. However, most customers should not need to understand Agent, Intent, State, Action, Guard, and Transition before they can configure a business agent.

The rule configuration layer lowers the authoring interface:

```text
Customer SOP / natural requirement
-> Business Rule Config
-> Rule Compiler
-> Yutra executable assets
```

## Pack Config Objects

A Pack Config should contain these objects:

- `capabilities`: enabled business capabilities, such as refund, return, shipping query, handoff.
- `businessObjects`: domain objects the agent operates on, such as order, shipment, refund request, return request, customer.
- `rules`: business decision rules, thresholds, routing conditions, and exception handling.
- `policies`: governance constraints, approval requirements, action allow/deny, environment differences.
- `adapters`: required customer system integration points and contract mapping.
- `templates`: response templates and channel output styles.
- `tests`: normal, exception, boundary, and handoff cases used for preview and certification.

## First Field Types

The first version should support a small field type library:

- Boolean
- Enum
- Multi-select
- Number
- Text
- Condition Table
- Priority
- Mapping

This is intentionally smaller than a full form-builder platform. The goal is to express business rules that can compile deterministically.

## Public Schematic Pack Config

The public repository should show the shape of a Pack Config, not customer-ready SOP, threshold values, adapter mappings, or reusable commercial templates. Detailed domain rules and customer-specific values belong in private implementation assets.

```json
{
  "pack": "example-request-resolution-pack",
  "archetype": "request-resolution",
  "capabilities": ["request_triage", "eligibility_check", "business_action", "handoff"],
  "businessObjects": ["request", "business_record", "external_case"],
  "rules": {
    "autoActionEnabled": "<boolean>",
    "actionThreshold": "<number configured privately>",
    "recordStatusStrategy": "<complete | request_more_info | handoff>",
    "exceptionStrategy": "<deny | retry | handoff>",
    "missingRecordStrategy": "<request_more_info | handoff>",
    "responseStyle": "<neutral | service_oriented>"
  },
  "policies": {
    "environment": "<dev | demo | prod-like>",
    "requireHumanForRiskyAction": "<boolean>"
  },
  "adapters": {
    "primaryRecord": "<adapter contract id>",
    "businessAction": "<adapter contract id>",
    "escalation": "<adapter contract id>"
  },
  "templates": {
    "success": "<template id>",
    "denied": "<template id>",
    "handoff": "<template id>"
  },
  "tests": ["happy-path", "boundary-path", "handoff-path"]
}
```

## Mapping Business Questions to Executable Structure

| Business question | Pack Config concept | Generated structure |
| --- | --- | --- |
| Is automatic handling allowed for this request type? | auto-action flag | Guard + action + transition |
| What threshold requires human review? | private threshold | Policy threshold + handoff rule |
| What happens when the source record is missing? | missing-record strategy | Transition + template + optional handoff |
| What happens when an external adapter fails? | exception strategy | Error transition + retry or handoff path |
| Which response style should be used? | response style | Template variant selection |

## Authoring Discipline

- Customers should see business rules and examples.
- Implementers should see adapter contracts and policy consequences.
- Advanced users can inspect generated DSL.
- Runtime only sees canonical IR.
- LLM can draft Pack Config, but it must not bypass compiler, validation, preview, trace, or audit.

## Current Non-implementation Boundary

This document does not implement:

- Pack Config schema
- UI Schema
- Rule Compiler
- Creator Workbench rule forms
- automatic DSL generation from Pack Config

Those are vNext roadmap items.
