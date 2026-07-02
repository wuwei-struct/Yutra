# Knowledge-answering Basic Demo

This example is a public demo/mock Pack Config for the `knowledge-answering` archetype.

It demonstrates how Yutra can compile a governed knowledge-answering configuration into the same six artifact types used by the other demo archetypes:

- `agent.yutra.yaml`
- `policy.yaml`
- `adapter.config.json`
- `templates.json`
- `test-cases.json`
- `trace.expectation.json`

## Boundaries

This example does not include:

- real answer generation
- real knowledge base content
- real retrieval provider configuration
- real search or source endpoints
- credentials
- customer data
- customer SOP
- commercial delivery assets

All adapters are `mock`, `containsRealEndpoint=false`, and `containsSecret=false`.

## Compile

Dry-run without writing artifacts:

```bash
yutra compile examples/knowledge-answering-basic/pack.config.json --out .tmp/knowledge-answering-basic --dry-run
```

Write local demo artifacts:

```bash
yutra compile examples/knowledge-answering-basic/pack.config.json --out .tmp/knowledge-answering-basic --force
```

Generated artifacts are local outputs only and should not be committed.
