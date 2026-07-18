# Studio Scenario Composition Compile Preview

Yutra Studio now includes an independent **Scenario Composition** Workbench for
inspecting canonical Scenario Patterns and their Composition Plans. It is
separate from Creator Workbench and does not change the three existing
Product Archetype creation flows.

A scenario pattern is a composition preset, not a new archetype.

## Supported Catalog

The Builder Runner exposes a read-only canonical catalog and detail view:

- `GET /creator/scenario-compositions`
- `GET /creator/scenario-compositions/:compositionId`
- `POST /creator/scenario-compositions/compile-preview`

The Compile Preview request accepts only a built-in `compositionId`. It does
not accept arbitrary client Plan JSON.

Two demo compositions support in-memory Compile Preview:

- `customer-complaint-composition-demo`
- `ecommerce-refund-composition-demo`

`renewal-churn-warning-composition-demo` remains contract-only. Its
`monitoring-response`, `data-insight`, and `lead-engagement` Product
Archetypes do not have the required individual compiler support, so the
Compile Preview action is disabled and its blockers remain visible.

## Workbench Views

The workbench displays:

- Primary and Supporting Product Archetypes;
- Cross-cutting Overlays;
- explicit Routes and identity Data Bindings;
- the complete fail-closed Precedence policy;
- primary output, acceptance object, primitive coverage, and governance focus;
- demo-only public exposure;
- Composition Readiness.

Pack Configs remain namespaced. There is no deep merge, implicit adapter
inheritance, or secret merge. The Primary Slot owns the terminal response.

## Composition Readiness

Composition Readiness reports contract validity, Pattern alignment, individual
Product Archetype compiler and Workbench support, Cross-cutting availability,
and Composition Compiler availability.

Compile-ready does not mean Runtime-executable.

The UI always distinguishes:

```text
previewOnly=true
runtimeExecutable=false
```

Composition Readiness is not Certification Readiness and is not a production
certification claim.

## Compile Preview Artifacts

A successful preview exposes seven read-only composition-level artifacts:

1. `composition.manifest.json`
2. `composition.routes.json`
3. `composition.bindings.json`
4. `composition.overlays.json`
5. `composition.precedence.json`
6. `composition.slot-index.json`
7. `composition-report.json`

Each Slot remains in its own namespace and exposes six canonical artifacts:

1. `agent.yutra.yaml`
2. `policy.yaml`
3. `adapter.config.json`
4. `templates.json`
5. `test-cases.json`
6. `trace.expectation.json`

The preview is compiled in memory. Studio does not download, save, publish, or
write these artifacts to disk.

## Slot DSL Editor Bridge

`Send Slot DSL to Editor` sends one selected Slot's `agent.yutra.yaml` to the
existing DSL Editor. Metadata records the `compositionId`, `slotId`,
`archetypeId`, and `configHash`.

This sends one namespaced slot DSL for inspection. It does not represent or
execute the full scenario composition.

Sending does not automatically Inspect, Apply, or Run. If a user later chooses
to Apply and Run from the existing DSL Editor, that action concerns only the
single Slot DSL. It does not run the Scenario Composition and does not create
Composition Run Evidence.

## Public Boundary

Scenario Composition Compile Preview is demo/mock only:

- no Pack Config deep merge;
- no top-level `orchestrator.yutra.yaml`;
- no runnable Scenario DSL;
- no multi-Slot scheduling;
- no Runtime execution;
- no real adapter or endpoint;
- no LLM, RAG, or knowledge base integration;
- no customer data, customer SOP, or commercial delivery asset;
- not production ready.

Composition Preview can now be followed by a separate, explicit
[Studio Scenario Orchestrator Preview](./studio-scenario-orchestrator-preview.md).
The Orchestrator view remains read-only, non-executable, and separate from the
Agent DSL Editor. Plan Authoring is still not implemented.

The read-only governed contract is now available in
[Scenario Orchestrator DSL Contract](./scenario-orchestrator-contract.md).
Studio does not compile, edit, apply, or run that contract in this iteration.

The CLI/core path can generate a preview-only Orchestrator contract through
[Scenario Orchestrator Compiler Preview](./scenario-orchestrator-compiler-preview.md).
Studio now exposes the same canonical preview in memory after an explicit
Composition Preview. It does not add an Orchestrator Apply or Run button and
remains unsupported by the current Runtime.
