# Rule Compiler CLI

The Rule Compiler CLI exports deterministic demo/mock artifacts from a Pack Config JSON file.

It is a local developer tool for inspecting compiler output. It does not run Runtime, publish an Agent, or connect to real customer systems. It also does not automatically run generated `agent.yutra.yaml`.

Yutra Studio also has a Creator Workbench Compile Preview. That preview shows the same kind of demo/mock artifacts in the browser, but it does not write files. The CLI remains the explicit local artifact export path.

## Command

```bash
pnpm exec yutra compile examples/request-resolution-ecommerce-basic/pack.config.json --out .tmp/compiled-request-resolution
pnpm exec yutra compile examples/approval-decision-basic/pack.config.json --out .tmp/compiled-approval-decision
pnpm exec yutra compile examples/knowledge-answering-basic/pack.config.json --out .tmp/compiled-knowledge-answering
```

Options:

| Option | Purpose |
|---|---|
| `--out <dir>` | Required output directory |
| `--mode <preview\|publish>` | Compile gate mode, defaults to `preview` |
| `--locale <en\|zh-CN>` | Output locale preference, defaults to config locale or `en` |
| `--force` | Overwrite existing known artifact files |
| `--dry-run` | Compile and print a summary without writing files |
| `--json` | Print machine-readable JSON summary |

## Input

The CLI accepts local JSON Pack Config files only.

It does not support:

- YAML Pack Config input
- remote URLs
- stdin streaming
- `.env` loading
- secrets or real endpoints

## Output Artifacts

Successful export writes seven files:

```text
<out>/
  agent.yutra.yaml
  policy.yaml
  adapter.config.json
  templates.json
  test-cases.json
  trace.expectation.json
  compile-report.json
```

The first six files come from `@yutra/rule-compiler`. `compile-report.json` contains compiler metadata, issues, config hash, and artifact hash summary.

All JSON files are UTF-8 and deterministically formatted. The generated YAML content is the deterministic compiler output.

## Preview and Publish Mode

`preview` is the default and is intended for local inspection.

`publish` applies stricter gates, including blocking unconfirmed AI-inferred fields and non-publishable placeholder adapters in production-like environments.

Neither mode executes the generated Agent.

## Dry Run

```bash
pnpm exec yutra compile examples/request-resolution-ecommerce-basic/pack.config.json --out .tmp/compiled-request-resolution --dry-run
```

Dry run:

- reads and validates the config
- compiles in memory
- prints compile id, compiler version, config hash, artifact filenames, artifact hashes, and issue summary
- does not create the output directory
- does not write files

With `--json`, the summary is stable JSON.

## Overwrite Rule

If the output directory already contains one of the known artifact filenames, the CLI fails by default.

Use `--force` to overwrite only the known artifact files. The CLI does not delete unrelated files and does not recursively clear the output directory.

## Demo Boundary

The public example configs are:

```text
examples/request-resolution-ecommerce-basic/pack.config.json
examples/approval-decision-basic/pack.config.json
examples/knowledge-answering-basic/pack.config.json
```

It is demo/mock only:

- adapters are `mock`
- `containsRealEndpoint=false`
- `containsSecret=false`
- no customer names
- no real API endpoints
- no customer SOP
- no real organization data or approval hierarchy
- no real knowledge base content, real retrieval provider configuration, or real source endpoints

`approval-decision` is supported by the compiler core, CLI, and Creator Workbench demo UI. The UI remains demo/mock only and does not connect a real approval system.

`knowledge-answering` is supported by the compiler core, CLI, and Creator Workbench demo UI. It remains demo/mock only and does not call a real LLM or connect a real retrieval provider.

## Scenario Composition Compile Preview

The CLI also exposes a separate preview-only composition command:

```bash
pnpm exec yutra composition compile examples/customer-complaint-composition/plan.json --out .tmp/customer-complaint --dry-run
pnpm exec yutra composition compile examples/ecommerce-refund-composition/plan.json --out .tmp/ecommerce-refund --force
```

This command validates the Composition Plan, calls the existing Rule Compiler
for every Slot, and writes six canonical artifacts under each
`slots/<slotId>/` namespace plus seven top-level composition relationship
artifacts. It does not deep-merge Pack Configs, generate an executable
Orchestrator DSL, or run Runtime.

See
[Scenario Composition Compile Preview](./scenario-composition-compile-preview.md).

## Scenario Orchestrator Compiler Preview

An explicit downstream command validates a Composition Bundle against a
built-in Orchestrator Compile Profile and exports the Composition artifacts,
namespaced Slot artifacts, and six Orchestrator contract artifacts:

```bash
pnpm exec yutra orchestrator compile examples/customer-complaint-composition/plan.json --out .tmp/customer-complaint-orchestrator --dry-run
pnpm exec yutra orchestrator compile examples/ecommerce-refund-composition/plan.json --out .tmp/ecommerce-refund-orchestrator --force
```

The command outputs `scenario.orchestrator.yaml`, not a top-level
`agent.yutra.yaml`. It reports `previewOnly=true`,
`runtimeExecutable=false`, and `currentRuntimeSupported=false`. It has no
`run`, `apply`, `execute`, `deploy`, or `publish` subcommand.

See
[Scenario Orchestrator Compiler Preview](./scenario-orchestrator-compiler-preview.md).

## Non-goals

The Rule Compiler CLI does not:

- connect Runtime
- automatically run generated `agent.yutra.yaml`
- connect Studio UI
- call an LLM
- read `.env`
- include real adapters or endpoints
- include customer SOP
- include commercial delivery playbooks
- implement marketplace or remote registry
