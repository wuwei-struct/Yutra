# Studio Manual Scenario Run Preview

Studio Manual Scenario Run Preview connects the canonical, in-memory
`@yutra/scenario-orchestrator-engine-demo` to Builder Runner and the Scenario
Composition Workbench. It is an explicitly triggered demo surface, not a
production Runtime capability.

## Manual Flow

The only supported flow is:

```text
Select Scenario
-> Compile Composition Preview
-> Compile Orchestrator Preview
-> Select canonical demo case
-> click Run Scenario Preview
-> inspect safe evidence
```

Page initialization, Scenario selection, Composition compilation, and
Orchestrator compilation do not start a run. Changing the Scenario or demo
case clears the previous result. There is no automatic retry, Apply, Deploy,
Publish, recovery, or resume action.

## Runner API

Builder Runner exposes:

```text
POST /creator/scenario-runs/preview
```

The request contains exactly `compositionId` and `demoCase`. The endpoint
accepts only these canonical combinations:

| Composition | Demo case |
| --- | --- |
| `customer-complaint-composition-demo` | `complaint_policy` |
| `customer-complaint-composition-demo` | `complaint_compensation` |
| `customer-complaint-composition-demo` | `complaint_handoff` |
| `customer-complaint-composition-demo` | `overlay_deny` |
| `ecommerce-refund-composition-demo` | `refund_authorization` |

Clients cannot submit input JSON, Composition Plans, Compile Profiles, hashes,
Routes, Bindings, Slot artifacts, or Adapter configuration. The Runner obtains
the canonical Plan, explicit Compile Profile, compiled artifacts, Demo Runtime
Adapter, execution fixture, and Scenario Engine on the server. Each request
runs once in memory and writes no file or persistent record.

## Safe Evidence

The response and Studio view expose only:

- status, fixed terminal, and `scenarioCompleted`;
- safe Slot invocation references;
- explicit semantic Outcome Projection evidence;
- selected Route summaries;
- applied identity Binding IDs;
- evaluated Overlay IDs, stages, and decisions;
- budget usage;
- an ordered, safe Scenario Timeline;
- Trace counts and sequence range;
- a redacted Audit summary;
- `externalEffectsOccurred=false`.

The response excludes complete Scenario Context, complete Slot input/output,
Slot DSL, handler implementations, complete Trace/Audit records, Adapter
configuration, credentials, endpoints, and local paths. Projection rows in the
UI Timeline are explicitly identified as derived projection evidence; they do
not add or rename Trace event types.

## Canonical Results

Customer complaint supports:

- policy explanation, with Supporting call-return and identity Binding;
- compensation, with Supporting authorization and identity Binding;
- handoff to `$human_handoff`;
- Overlay deny before Slot invocation, ending at `$fail_closed`.

Ecommerce refund supports the authorization call-return path and completes
through `$scenario_done`. A completed Slot never implies Scenario completion;
only the explicit Primary terminal Route can set `scenarioCompleted=true`.

## Boundary

This is a manual, in-memory, mock-only Scenario Run Preview. It does not
connect real systems, persist execution state, or represent production Runtime
readiness.

- manual trigger only;
- canonical demo cases only;
- demo/mock Actions only;
- no real write, external, financial, or approval side effect;
- no network, LLM, RAG, knowledge base, database, or real Adapter;
- no persistence, retry, recovery, parallelism, or distributed execution;
- no Runtime, DSL, Trace, Composition Compiler, or Orchestrator Compiler
  semantic change;
- not production ready.
