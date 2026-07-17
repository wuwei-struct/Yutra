# Scenario Composition Compile Preview

`@yutra/scenario-composition-compiler` turns a validated, contract-layer
`compile_ready` Scenario Composition Plan into an inspectable preview Bundle.
The Bundle preserves every Pack Config and compiler output in an isolated Slot
namespace.

The compilation chain is:

```text
Scenario Composition Plan
-> Contract Validation
-> Readiness Check
-> Per-slot Rule Compiler
-> Namespaced Slot Artifacts
-> Composition Preview Artifacts
-> Composition Compile Report
```

The result always declares:

```text
previewOnly=true
runtimeExecutable=false
```

It does not generate an executable top-level DSL or run a composed Agent.

Studio can now inspect this same preview Bundle through the independent
[Studio Scenario Composition Compile Preview](./studio-scenario-composition-preview.md)
workbench. The Studio integration remains read-only, compiles in memory, and
does not make the Bundle Runtime executable.

## Contract and Readiness

The compiler consumes `ScenarioCompositionPlan` from
`@yutra/scenario-composition-core`. It reuses the existing fail-closed
validation and readiness checks rather than copying them.

Contract-layer `compile_ready` means every participating Product Archetype has
an individual Rule Compiler. A preview is allowed only when the caller also
sets `compositionCompilerAvailable=true`. The default in the contract package
remains `false`.

## Per-slot Compilation

Each Slot is compiled independently through the existing
`compilePackConfig`. The compiler requires exactly the six canonical
artifacts:

```text
slots/<slotId>/
  agent.yutra.yaml
  policy.yaml
  adapter.config.json
  templates.json
  test-cases.json
  trace.expectation.json
```

Primary is compiled first. Supporting Slots follow their stable Plan order.
The compiler does not deep-merge Pack Configs, adapters, policies, templates,
states, or DSL. It does not create `orchestrator.yutra.yaml`.

## Composition Preview Artifacts

The Bundle also contains seven top-level preview artifacts:

1. `composition.manifest.json`
2. `composition.routes.json`
3. `composition.bindings.json`
4. `composition.overlays.json`
5. `composition.precedence.json`
6. `composition.slot-index.json`
7. `composition-report.json`

These files describe the composition relationship and provenance. They are not
Runtime input.

## Hashes and Provenance

The compiler reuses the canonical stable JSON and SHA-256 helpers from
`@yutra/rule-compiler`.

- `planHash` binds the input Composition Plan.
- Each Slot retains its Pack Config hash and six artifact hashes.
- `bundleHash` binds the Plan hash, Slot artifact hashes, and the six
  relationship-artifact hashes.
- `composition-report.json` is excluded from its own hash input to avoid a
  recursive hash.
- No dynamic timestamp participates in deterministic output.

The Slot index retains `slotId`, role, Archetype ID, Pack Config ID, namespace,
artifact paths, and artifact hashes.

## Fail-closed Behavior

Compilation fails without a partial Bundle when:

- the Plan is invalid or Pattern alignment fails;
- readiness is not `compile_ready`;
- the composition compiler is not explicitly available;
- a Slot compiler fails;
- any canonical Slot artifact is missing;
- Slot namespaces collide;
- a Slot ID would create an unsafe output path;
- the execution model is not `orchestrated_subflows`.

The compiler does not skip failed Slots, infer Routes or bindings, relax
policies, inherit adapters, or create secrets or endpoints.

## CLI

Dry run validates and compiles without writing:

```bash
pnpm exec yutra composition compile examples/customer-complaint-composition/plan.json --out .tmp/customer-complaint --dry-run
```

Explicit export:

```bash
pnpm exec yutra composition compile examples/customer-complaint-composition/plan.json --out .tmp/customer-complaint --force
pnpm exec yutra composition compile examples/ecommerce-refund-composition/plan.json --out .tmp/ecommerce-refund --force
```

Use `--json` for a machine-readable summary. Existing output is rejected unless
`--force` is supplied. Output paths are constrained to the requested output
directory, and path traversal is rejected.

The CLI reports `previewOnly=true`, `runtimeExecutable=false`, and that no
orchestrator DSL was generated.

## Built-in Demo Results

### Customer complaint

`customer-complaint-composition-demo` compiles three isolated Slots:

- Primary: `request-resolution`
- Supporting: `knowledge-answering`
- Supporting: `approval-decision`

### Ecommerce refund

`ecommerce-refund-composition-demo` compiles two isolated Slots:

- Primary: `request-resolution`
- Supporting: `approval-decision`

### Renewal churn warning

`renewal-churn-warning-composition-demo` remains contract-only. Its Product
Archetypes do not have the required Pack Config and compiler support, so the
compiler rejects it with `COMPOSITION_NOT_COMPILE_READY` and emits no partial
artifacts.

## Public Boundary and Non-goals

The examples are demo/mock only. They contain no real customer data, endpoint,
secret, customer SOP, pricing, proposal, rollout playbook, or production
integration.

This iteration does not:

- generate a runnable top-level Orchestrator DSL;
- execute a composed Agent;
- connect Runtime;
- connect Creator Workbench;
- change DSL or Trace semantics;
- publish npm packages.

Studio exposes this preview Bundle without making it Runtime executable.
Future work may define Plan Authoring or a governed Orchestrator contract.

The governed contract is now documented in
[Scenario Orchestrator DSL Contract](./scenario-orchestrator-contract.md).
It references this Bundle's Slot paths and hashes without changing the seven
preview artifacts or generating a runnable top-level DSL.

The separate
[Scenario Orchestrator Compiler Preview](./scenario-orchestrator-compiler-preview.md)
can consume this unchanged Bundle plus an explicit Compile Profile and produce
six additional contract artifacts. The Composition Compiler itself still does
not generate Orchestrator output, and neither package executes Runtime.
