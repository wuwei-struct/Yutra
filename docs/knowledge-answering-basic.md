# Knowledge-answering Basic Demo

`knowledge-answering` is the third public demo archetype core chain in Yutra.

It demonstrates that Yutra is not hard-coded to request handling or approval decisions. It covers governed knowledge answering where answers must respect confidence, source citation, no-answer fallback, and sensitive question boundaries.

## Current Support

The current public support includes:

- Pack Config contract
- Rule Impact metadata
- deterministic Rule Compiler
- Rule Compiler CLI export
- Creator Workbench demo UI integration
- six demo/mock artifacts

Creator Workbench can select `knowledge-answering`, edit the basic demo fields, explain Rule Impact, run Compile Preview, show Certification Readiness, and send `agent.yutra.yaml` to the DSL Editor. It still does not inspect, apply, or run automatically.

## Artifacts

The compiler produces:

- `agent.yutra.yaml`
- `policy.yaml`
- `adapter.config.json`
- `templates.json`
- `test-cases.json`
- `trace.expectation.json`

## Demo Boundary

This is public demo/mock support only.

It does not:

- connect Runtime
- execute generated DSL
- call a real LLM
- connect a real retrieval provider
- connect real RAG or vector database infrastructure
- include real knowledge base content
- include real FAQ or document snippets
- include real source endpoints
- include customer SOP
- include commercial delivery assets

All adapters in the example config are `mock`, `containsRealEndpoint=false`, and `containsSecret=false`.

## CLI

Dry-run without writing artifacts:

```bash
pnpm exec yutra compile examples/knowledge-answering-basic/pack.config.json --out .tmp/knowledge-answering-basic --dry-run
```

Write local demo artifacts:

```bash
pnpm exec yutra compile examples/knowledge-answering-basic/pack.config.json --out .tmp/knowledge-answering-basic --force
```

Generated artifacts are local outputs only and should not be committed.

## Why It Matters

`knowledge-answering` proves the vNext creation chain can express governed answer generation patterns:

```text
Pack Config
-> Rule Impact
-> Rule Compiler
-> DSL / Policy / Templates / Test Cases / Trace Expectations
```

This remains a standard-layer demo. It does not implement a production knowledge service.
