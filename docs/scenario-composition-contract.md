# Scenario Composition Contract

`@yutra/scenario-composition-core` defines the contract between a static Scenario Pattern and a future composition compiler:

```text
Scenario Pattern
-> Scenario Composition Plan
-> Future Composition Compiler
-> Orchestrator + Namespaced Subflows
```

It is a browser-safe, deterministic contract package. It does not compile DSL, execute an Agent, call Runtime, or connect Creator Workbench.

## Pattern and Plan

A **Scenario Pattern** identifies a reusable combination: one primary Product Archetype, optional supporting Product Archetypes, and Cross-cutting Archetypes. It does not contain Pack Configs, routes, or data bindings.

A **Scenario Composition Plan** binds that pattern to explicit, independently validated demo Pack Configs. It declares namespaces, routing, data binding, governance overlays, and fail-closed precedence before any future compiler is allowed to consume the plan.

A Scenario Composition Plan is not a new Product Archetype and is not an executable Agent.

## Execution Model

Version `1.0.0` supports exactly one execution model: `orchestrated_subflows`.

The future output model is an orchestrator connected to namespaced subflows. The contract deliberately rejects a general JSON deep merge.

## Why Deep Merge Is Forbidden

Generic Pack Config deep merge is unsafe because:

- fields can share names while carrying different archetype semantics;
- state, Action, Policy, Template, and adapter identifiers can conflict;
- merged values lose the Slot and field provenance that produced them;
- independent audit and certification of subflows becomes ambiguous;
- a supporting flow can accidentally override the primary acceptance object;
- implicit inheritance can propagate an adapter, endpoint, or secret boundary;
- ambiguous merge order weakens fail-closed behavior;
- future subflow upgrades and recertification cannot remain isolated.

The contract has no `mergedPackConfig`, `flattenedConfig`, or `deepMerge` field. Those fields are rejected explicitly.

## Composition Roles

### Primary

The Primary Slot owns the scenario identity, entry, main business object, final acceptance object, default outward response, and scenario completion decision. There must be exactly one Primary Slot, and it must match the Scenario Pattern primary Product Archetype.

### Supporting

Supporting Slots retain independent Product Archetype identity and Pack Configs. They return structured subflow results through explicit routes and bindings. They cannot override the Primary archetype, Pack Config identity, environment, public exposure, or terminal acceptance semantics.

Only an explicit route with `terminate_scenario` can allow a supporting result to end a scenario.

### Cross-cutting

Cross-cutting Archetypes are declarative overlays, not complete business subflows. An overlay has explicit scenario, Slot, or route scopes and one enforcement mode such as `deny_override`, `require_handoff`, `audit_required`, `adapter_boundary`, or `feedback_capture`.

## Namespace Isolation

Every Slot remains isolated conceptually as:

```text
slots.<slotId>.config
slots.<slotId>.artifacts
slots.<slotId>.trace
```

The contract never flattens config roots, automatically overwrites same-named fields, merges adapters, merges templates, or merges response styles. Adapter ownership remains with a Slot. A supporting Slot cannot inherit the Primary adapter, and a Cross-cutting Overlay cannot inject a secret or propagate an endpoint.

## Routing Contract

Routes are the only way to connect subflows. Every route has an explicit source Slot, target Slot or governed terminal, trigger, condition reference, and return mode.

Allowed terminals are `$scenario_done`, `$human_handoff`, and `$fail_closed`. Unknown source or target Slots and direct self-routes fail validation. Human handoff may terminate the automated flow, but the future compiler must preserve the audit record.

## Data Binding Contract

Bindings explicitly map one namespaced output path to one namespaced input path. Version `1.0.0` supports only the deterministic `identity` transform. Functions, scripts, expression code, and dynamic execution content are not allowed.

Required bindings must fail closed when their source value is unavailable. The contract does not infer field mappings.

## Precedence and Conflict Policy

The only built-in precedence set is ordered from highest to lowest:

1. `hard_boundary_first`
2. `deny_overrides`
3. `human_review_over_automation`
4. `higher_risk_over_lower_risk`
5. `explicit_route_over_local_default`
6. `primary_owns_terminal_response`
7. `namespaced_supporting_configs`
8. `no_implicit_adapter_inheritance`
9. `no_secret_merge`
10. `fail_on_ambiguous_conflict`

`conflictMode` is always `fail_closed`.

The semantic decision order is: schema and hard public boundaries; secret, endpoint, and side-effect boundaries; explicit deny; mandatory human review; higher risk; explicit Composition Route; Primary terminal ownership; Supporting local rules; Template or response-style preference; and finally defaults.

An Allow cannot override a Deny. Automation cannot override required human review. Supporting rules cannot redefine the Primary acceptance object. A Cross-cutting allow cannot relax a Product Archetype deny. Adapter configuration is never merged through precedence. An ambiguous conflict fails rather than being guessed.

## Built-in Demo Compositions

### Customer complaint

`customer-complaint-composition-demo` uses:

- Primary: `request-resolution`
- Supporting: `knowledge-answering`, `approval-decision`
- Cross-cutting: `human-handoff`, `policy-guard`

It uses the three existing public demo Pack Configs in separate Slots. Explicit routes request a policy explanation, request an authorization decision, return structured results to the Primary, or require human handoff. The Primary owns the final response.

With the current support context this plan is contract-layer `compile_ready`, while `compositionCompilerAvailable` remains `false`. This status means every participating Product Archetype has an individual compiler and Workbench flow; it does not mean a composition compiler exists.

### Ecommerce refund

`ecommerce-refund-composition-demo` keeps `request-resolution` primary, uses `approval-decision` as a supporting authorization flow, and scopes `policy-guard`, `adapter-connector`, and `human-handoff` overlays explicitly. It contains no real order, payment, or refund integration.

### Renewal churn warning

`renewal-churn-warning-composition-demo` is exported only as a contract-only draft. `monitoring-response`, `data-insight`, and `lead-engagement` do not yet have the required Pack Config and compiler support, so the fixture sets `eligibleForCompilerInput: false` and must never be reported as `compile_ready`.

## Readiness

`resolveCompositionReadiness` reports contract and Pattern alignment, individual Product Archetype compiler and Workbench support, Cross-cutting availability, explicit blockers, and `compositionCompilerAvailable: false`.

Contract-layer `compile_ready` is an input-readiness statement only. No composition DSL or Runtime execution is produced.

## Provenance Requirement

A future composition compiler must retain the source Slot, Pack Config ID, Archetype ID, field provenance, Overlay, and Route for every generated rule and artifact. This package defines that requirement but does not implement compilation precedence or artifact generation.

## Public Demo Boundary

Every validated built-in Plan is `demo_only`, uses mock adapters, and declares all exposure risk flags `false`. The package contains no real endpoint, secret, customer data, customer SOP, organization structure, commercial delivery asset, or production integration.

## Current Non-goals

- no Scenario Composition Compiler;
- no combined DSL or artifact generation;
- no Pack Config deep merge;
- no composed Agent execution;
- no Runtime integration;
- no Creator Workbench integration;
- no remote registry or install flow.

The next possible stage is a Scenario Composition Compile Preview that consumes this contract without weakening namespace isolation or fail-closed governance.
