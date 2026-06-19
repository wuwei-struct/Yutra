# Project Charter

## 1. Project Positioning

Yutra is an open-source governed Agent Creation & Execution Framework.

Yutra turns business rules into executable, traceable, and auditable agents through:

- Agent Archetypes
- Pack Config
- Rule Compiler
- DSL / Canonical IR
- Runtime
- Trace / Audit
- Certification
- Creator Workbench

## 2. Current Open-source Core

The public repository currently provides the open-source core:

- DSL and Canonical IR
- Reference Runtime
- Trace / Audit / Certification
- Skill Core and Skill Runtime
- Archetype Core
- Pack Config Core
- Rule Compiler Core
- Rule Compiler CLI
- Yutra Studio
- Creator Workbench demo flows
- Mock / demo examples

## 3. Core Principle

Yutra is not a prompt-first agent framework.

Yutra follows an execution-first architecture:

```text
Business Rules
-> Pack Config
-> Rule Compiler
-> DSL / Policy / Templates / Test Cases / Trace Expectations
-> Runtime
-> Trace / Audit / Certification
```

LLM can assist with drafts, but it must not bypass schema validation, compiler gates, runtime governance, trace, or certification.

## 4. What Yutra Is For

Yutra is designed to answer:

- How is an agent behavior defined?
- Which business rule produced which Guard / Action / Transition?
- Which DSL / Policy / Template / Test Case was generated?
- Why did the agent enter a state?
- Why did it execute an action?
- Why did it request handoff?
- Can the execution be traced, audited, replayed, and certified?

## 5. What Yutra Is Not

Yutra is currently not:

- a marketplace
- a remote registry
- an install workflow
- a multi-tenant SaaS platform
- a customer service backend
- a BI / analytics platform
- a full no-code workflow platform
- a real customer API integration package
- a hosted enterprise console

## 6. Open-source Boundary

The public repository contains open-source core and mock/demo examples.

The following are not part of the public core:

- real customer adapters
- customer-specific SOP
- production integration assets
- pricing / proposal templates
- UAT / rollout playbooks
- private deployment assets
- enterprise policy packs
- hosted enterprise dashboards

## 7. Supported Creation Flow

The current Creator Workbench flow supports:

- request-resolution
- approval-decision

Both are demo/mock flows.

The workbench can:

- select an archetype
- edit demo Pack Config
- explain rule impact
- compile preview artifacts
- show certification readiness preview
- send generated `agent.yutra.yaml` to DSL Editor
- inspect DSL manually
- apply DSL as run source manually
- run preview manually
- inspect Trace / Audit evidence

It does not automatically run Runtime, publish agents, or claim production readiness.

## 8. Development Discipline

Every future module must answer:

- Does it strengthen the execution standard?
- Does it preserve traceability?
- Does it improve governance?
- Does it keep LLM as assistant rather than runtime decision maker?
- Does it avoid turning Yutra into a generic SaaS platform?

## 9. Next Direction

Near-term development should focus on:

- Creator Workbench polish
- rule explanation and readiness UX
- second / third archetype validation
- public demo boundary
- private commercial implementation assets outside the public repo
