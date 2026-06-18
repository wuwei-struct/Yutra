# Rule Compiler CLI

The Rule Compiler CLI exports deterministic demo/mock artifacts from a Pack Config JSON file.

It is a local developer tool for inspecting compiler output. It does not run Runtime, publish an Agent, or connect to real customer systems. It also does not automatically run generated `agent.yutra.yaml`.

## Command

```bash
pnpm exec yutra compile examples/request-resolution-ecommerce-basic/pack.config.json --out .tmp/compiled-request-resolution
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

The public example config is:

```text
examples/request-resolution-ecommerce-basic/pack.config.json
```

It is demo/mock only:

- adapters are `mock`
- `containsRealEndpoint=false`
- `containsSecret=false`
- no customer names
- no real API endpoints
- no customer SOP

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
