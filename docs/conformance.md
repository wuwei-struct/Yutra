# Conformance and Golden Trace

## What Conformance Means in Yutra

Conformance checks that behavior stays stable across five layers:
- Spec schema behavior
- DSL normalize/canonicalize behavior (English + Chinese authoring)
- Runtime execution behavior
- Trace/replay/audit structure behavior
- Example-level expected outcomes

Yutra conformance is local-first and deterministic. It is not a remote certification service.

## Golden Trace Strategy

Golden traces are stored in `testdata/golden-traces/` as stable projections, not raw full events.

Why projections:
- raw events include volatile fields (`runId`, `ts`, `snapshotId`)
- certification should fail on semantic drift, not timestamp drift

Compared stable fields include:
- event type sequence
- state path
- action sequence
- final status/final state
- handoff reason codes
- error codes
- approval statuses
- human review sources
- context changed keys

Ignored volatile fields include:
- `runId`
- `ts`
- `snapshotId`
- non-deterministic IDs (for example generated decision/review IDs)
- local absolute paths

## Certification Command

Run full certification suite:

```bash
pnpm certify
```

Machine-readable summary output:
- `.yutra/certification/summary.json`

Update golden baselines intentionally:

```bash
UPDATE_GOLDEN=1 pnpm certify
```

PowerShell equivalent:

```powershell
$env:UPDATE_GOLDEN='1'; pnpm certify
```

(Use only when behavior change is intentional and reviewed.)

## Covered Scenarios

- `it-helpdesk-happy`
- `ecommerce-happy`
- `approval-approved`
- `approval-denied`
- `approval-handoff`
- `it-helpdesk-zh`
- `resumed-run`

Pack-level checks are also included via `tests/conformance/scenario-packs.test.ts`:
- every scenario pack has a valid manifest and entrypoint
- scenario packs can validate/run on core paths
- starter packs are internally consistent

## Certification Scope Boundaries

This suite does not introduce new runtime/viewer capabilities.
It only verifies conformance and regression stability on existing behavior.
