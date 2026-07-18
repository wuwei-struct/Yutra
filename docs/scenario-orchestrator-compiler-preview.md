# Scenario Orchestrator Compiler Preview

`@yutra/scenario-orchestrator-compiler` turns a validated Scenario Composition
Plan, its deterministic Composition Preview Bundle, and an explicit
Orchestrator Compile Profile into an inspectable Orchestrator Preview Bundle.

```text
Scenario Composition Plan
+ Scenario Composition Preview Bundle
+ Explicit Orchestrator Compile Profile
-> Scenario Orchestrator Document
-> Six Orchestrator Preview Artifacts
```

Every result is fixed to:

```text
previewOnly=true
runtimeExecutable=false
currentRuntimeSupported=false
```

This is a preview-only scenario orchestrator contract. It is not executable by the current Yutra Runtime.

这是仅用于预览和检查的场景编排合同，当前不能由 Yutra Runtime 执行。

## Composition Bundle and Orchestrator Document

The Composition Compiler remains responsible for the seven top-level
Composition artifacts and six canonical artifacts under every
`slots/<slotId>/` namespace. The Orchestrator Compiler does not alter those
files or hashes. It binds each Slot through:

- `slots/<slotId>/agent.yutra.yaml`;
- the Slot config hash;
- the agent artifact hash;
- the Product Archetype and Pack Config identity.

The resulting `scenario.orchestrator.yaml` has
`kind=scenario_orchestrator`. It is not `agent.yutra.yaml`, does not use the
current Agent DSL kind, and does not embed Slot DSL or Pack Config content.

## Why an Explicit Compile Profile Is Required

The Composition Plan does not fully define outcomes, route priorities,
call/resume effects, accepted outcomes, callable Slot relationships, or fixed
terminal mappings. The Compiler therefore requires a
`ScenarioOrchestratorCompileProfile`.

Profiles must:

- exactly match the Composition ID and Slot set;
- cover every Composition Route exactly once;
- add no undeclared Route;
- assign a unique safe-integer priority explicitly;
- map every Route to an explicit `invoke_slot`, `resume_caller`, `terminate`,
  `request_handoff`, or `fail_closed` effect;
- preserve the fixed demo-only public boundary.

The Compiler never guesses priority or effect from array order, route names,
or business wording. A missing, extra, or contradictory Profile entry fails
closed without a partial result.

## Execution and Context Contract

The generated document uses
`single_active_slot_call_return`. The unique Primary Slot is the entry and may
invoke a Supporting Slot. Supporting Slots return through `resume_caller` and
identity Data Bindings. Supporting Slots cannot call one another.

Context remains isolated:

```text
scenario.input
scenario.shared
scenario.output
slots.<slotId>.input
slots.<slotId>.state
slots.<slotId>.output
```

There is no deep merge, implicit cross-Slot read/write, adapter inheritance,
endpoint propagation, or secret propagation. Primary owns the final outward
response.

## Terminals, Failure, and Handoff

The complete fixed terminal set is:

- `$scenario_done`
- `$human_handoff`
- `$fail_closed`

Only Primary may complete the Scenario. Missing or ambiguous Routes, Binding
failure, budget exhaustion, and unresolved conflicts fail closed. Handoff
requires source and redacted audit context. No Orchestrator Runtime behavior
is implemented.

## Six Orchestrator Artifacts

The Compiler generates:

1. `scenario.orchestrator.yaml`
2. `orchestrator.routes.json`
3. `orchestrator.context-policy.json`
4. `orchestrator.trace-contract.json`
5. `orchestrator.provenance.json`
6. `orchestrator-report.json`

The complete exported directory is:

```text
<out>/
  composition.manifest.json
  composition.routes.json
  composition.bindings.json
  composition.overlays.json
  composition.precedence.json
  composition.slot-index.json
  composition-report.json
  slots/
    <slotId>/
      agent.yutra.yaml
      policy.yaml
      adapter.config.json
      templates.json
      test-cases.json
      trace.expectation.json
  scenario.orchestrator.yaml
  orchestrator.routes.json
  orchestrator.context-policy.json
  orchestrator.trace-contract.json
  orchestrator.provenance.json
  orchestrator-report.json
```

No top-level `agent.yutra.yaml` or Runtime adapter is generated.

## Hash and Provenance

The Compiler uses canonical serialization and SHA-256:

- `planHash` and `compositionBundleHash` come from a fresh canonical
  Composition compilation;
- `orchestratorHash` covers the canonical Orchestrator Document while
  excluding its self-referential provenance field;
- `previewBundleHash` covers the Composition Bundle hash, Orchestrator hash,
  and five non-report Orchestrator artifact hashes;
- `orchestrator-report.json` is excluded from its own Bundle hash input;
- dynamic timestamps and local output paths are excluded.

Supplied Composition results are not trusted. They must exactly match a fresh
canonical compilation, including every Slot content and artifact hash.
Provenance closes over every Slot, Route, Binding, Overlay, Plan hash, Bundle
hash, and Orchestrator hash.

## Trace Contract

`orchestrator.trace-contract.json` declares all 13 mandatory Orchestrator event
types, common fields, redaction requirements, and the Plan, Bundle, and
Orchestrator hashes. It explicitly states
`eventsEmittedInPreview=false`. No Trace events are fabricated or emitted.

## Built-in Preview Profiles

### Customer complaint

`customer-complaint-orchestrator-profile` covers the three-Slot
`customer-complaint-composition-demo`. Primary explicitly calls policy
explanation or compensation decision, Supporting results resume Primary,
handoff is explicit, and only Primary completes.

### Ecommerce refund

`ecommerce-refund-orchestrator-profile` covers
`ecommerce-refund-composition-demo` using the existing
`refund_resolution` and `refund_authorization` Slot IDs. Authorization returns
through the declared identity Binding. No real threshold, order, payment, or
refund rule is included.

### Renewal churn warning

Renewal churn remains contract-only. Its Product Archetypes do not have the
required Pack Config and compiler support, and no Compile Profile is
fabricated. Compilation fails with
`ORCHESTRATOR_COMPOSITION_NOT_READY` and returns no partial artifacts.

## CLI

```bash
pnpm exec yutra orchestrator compile examples/customer-complaint-composition/plan.json --out .tmp/customer-complaint-orchestrator --dry-run
pnpm exec yutra orchestrator compile examples/customer-complaint-composition/plan.json --out .tmp/customer-complaint-orchestrator --force
pnpm exec yutra orchestrator compile examples/ecommerce-refund-composition/plan.json --out .tmp/ecommerce-refund-orchestrator --force
```

Use `--json` for a machine-readable summary. Existing output is rejected unless
`--force` is supplied. Parent-directory traversal is rejected. The command has
no `run`, `apply`, `execute`, `deploy`, or `publish` surface.

## Current Boundary

This package and its examples are demo/mock only. They contain no real
customer data, customer SOP, endpoint, secret, adapter, LLM, RAG, knowledge
base, or commercial delivery asset.

This iteration:

- does not modify `@yutra/dsl`;
- does not connect Runtime;
- does not emit Trace;
- exposes its canonical built-in previews through the read-only
  [Studio Scenario Orchestrator Preview](./studio-scenario-orchestrator-preview.md);
- does not execute a composed Agent;
- does not publish npm.

The separate
[Scenario Orchestrator Runtime Adapter Contract](./scenario-orchestrator-runtime-adapter-contract.md)
defines a future capability handshake, artifact and Action Closure preflight,
and one-Slot invocation boundary. The
[In-memory Demo Runtime Adapter](./scenario-orchestrator-in-memory-runtime-adapter.md)
implements only that one-Slot boundary for deterministic mock smoke. The
Compiler still does not run it, and no Route, Binding, Scenario terminal, or
composed execution is performed.
