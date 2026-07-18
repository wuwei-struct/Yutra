# Studio Scenario Orchestrator Preview

## Positioning

Studio Scenario Orchestrator Preview is a read-only, demo/mock inspection
surface inside the Scenario Composition Workbench. It follows, but does not
replace, Composition Preview:

```text
Select Scenario
-> Review Composition Plan
-> Compile Composition Preview
-> Compile Orchestrator Preview
-> Inspect Orchestrator Contract artifacts
```

The result is a preview-only Scenario Orchestrator Contract:

```text
previewOnly=true
runtimeExecutable=false
currentRuntimeSupported=false
```

This is a preview-only scenario orchestrator contract. It cannot be executed
by the current Yutra Runtime.

这是仅用于预览和检查的场景编排合同，当前不能由 Yutra Runtime 执行。

## Runner API

Builder Runner exposes:

```text
POST /creator/scenario-orchestrators/compile-preview
```

The request accepts only a canonical `compositionId`. It does not accept an
arbitrary Composition Plan, Compile Profile, hash, Route, Slot, or artifact.
The Runner resolves the canonical built-in Plan and explicit built-in Compile
Profile, then calls `compileScenarioOrchestratorPreview()` in memory.

The endpoint does not write files, inspect Agent DSL, call Runtime, emit Trace
events, or return internal stack and filesystem details. Unknown IDs, malformed
requests, and unsupported compositions fail with stable, sanitized errors.

Catalog and Detail responses expose:

- `compositionPreviewAvailable`;
- `orchestratorPreviewAvailable`;
- `orchestratorCompileProfileId`;
- `orchestratorRuntimeSupported=false`;
- `orchestratorBlockers`.

## Supported Previews

The following canonical demos support Composition Preview followed by
Orchestrator Preview:

- `customer-complaint-composition-demo`, using
  `customer-complaint-orchestrator-profile`;
- `ecommerce-refund-composition-demo`, using
  `ecommerce-refund-orchestrator-profile`.

`renewal-churn-warning-composition-demo` remains contract-only. Its Product
Archetype compilers are incomplete and it has no Compile Profile, so both the
Composition and Orchestrator actions remain disabled. Studio displays the
blockers and cannot manufacture a preview request.

## Explicit Compile Profile

Route outcomes, priorities, effects, callable Slot relationships, accepted
outcomes, and terminal mappings come from an explicit, read-only Compile
Profile. The Compiler does not infer these semantics from names, array order,
or UI state. The Profile is not editable and contains no adapter, endpoint, or
secret configuration.

## Contract Views

The read-only Orchestrator Contract Inspector presents:

- `single_active_slot_call_return`;
- the Primary entry Slot and Supporting Slots;
- `maxCallDepth=1`, disabled parallelism, and disabled recursion;
- `scenario.input`, `scenario.shared`, `scenario.output`, and isolated
  `slots.<slotId>.*` namespaces;
- `implicitMergeAllowed=false`;
- `adapterInheritanceAllowed=false`;
- `secretPropagationAllowed=false`;
- explicit `invoke_slot`, `resume_caller`, `terminate`,
  `request_handoff`, and `fail_closed` effects;
- `$scenario_done`, `$human_handoff`, and `$fail_closed` terminals;
- all 13 mandatory Orchestrator event types;
- `eventsEmittedInPreview=false`;
- Composition, Pattern, Slot, Route, Binding, Overlay, and artifact
  provenance.

No execution evidence is fabricated.

## Six Orchestrator Artifacts

The preview exposes six UTF-8, read-only artifacts with their hashes:

1. `scenario.orchestrator.yaml`
2. `orchestrator.routes.json`
3. `orchestrator.context-policy.json`
4. `orchestrator.trace-contract.json`
5. `orchestrator.provenance.json`
6. `orchestrator-report.json`

`scenario.orchestrator.yaml` is a Scenario Orchestrator Contract artifact. It
is not `agent.yutra.yaml`, is not current Agent DSL, and cannot be sent to the
existing Agent DSL Editor. Studio does not call `/dsl/inspect` for it and does
not expose Apply, Run, Save, Download, Deploy, or Publish actions.

The existing Slot DSL bridge remains separate. A Slot's namespaced
`agent.yutra.yaml` may still be sent manually for single-Slot inspection; that
does not represent or execute the full Scenario Composition.

## Public Boundary

This workbench is demo/mock only:

- no Agent DSL is generated at the Orchestrator level;
- no Runtime execution or Orchestrator Trace Evidence;
- no Pack Config deep merge;
- no implicit adapter inheritance;
- no secret propagation;
- no real adapter, endpoint, LLM, RAG, or knowledge base connection;
- no customer data, customer SOP, or commercial delivery asset;
- not production ready.

The separate
[Orchestrator Runtime Adapter Contract](./scenario-orchestrator-runtime-adapter-contract.md)
defines the future capability and one-Slot invocation boundary. Its current
Yutra descriptor is `contract_only`; Studio still has no Orchestrator Apply or
Run action.

The separate
[In-memory Demo Runtime Adapter](./scenario-orchestrator-in-memory-runtime-adapter.md)
can execute one canonical Slot in package tests and smoke only. It is not
wired into Builder Runner or Studio. This workbench still has no Orchestrator
Run, does not call the Adapter, and keeps
`orchestratorRuntimeSupported=false`.
