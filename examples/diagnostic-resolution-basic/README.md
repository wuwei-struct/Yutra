# diagnostic-resolution basic demo

This example is the public `diagnostic-resolution` Pack Config for a generic diagnostic disposition.

It is demo/mock only. It performs no real diagnostics, device access, shell execution, external API call, endpoint connection, or production remediation.

Compile without writing files:

```bash
pnpm exec yutra compile examples/diagnostic-resolution-basic/pack.config.json --out .tmp/diagnostic-resolution --dry-run
```

Compile the six canonical artifacts and compile report:

```bash
pnpm exec yutra compile examples/diagnostic-resolution-basic/pack.config.json --out .tmp/diagnostic-resolution --force
pnpm exec yutra dsl inspect .tmp/diagnostic-resolution/agent.yutra.yaml
```

The generated DSL is inspectable mock output only. Studio and Runtime are not enabled for this archetype, and no generated Action performs a real repair.
