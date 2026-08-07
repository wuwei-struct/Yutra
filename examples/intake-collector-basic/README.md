# intake-collector basic demo

This example is the public `intake-collector` Pack Config used to compile a structured demo intake record.

It is demo/mock only. It contains no real personal data, customer form, database connection, CRM/ERP integration, endpoint, credential, or production collection workflow.

Compile without writing files:

```bash
pnpm exec yutra compile examples/intake-collector-basic/pack.config.json --out .tmp/intake-collector --dry-run
```

Compile the six canonical artifacts and the compile report:

```bash
pnpm exec yutra compile examples/intake-collector-basic/pack.config.json --out .tmp/intake-collector --force
```

The generated artifacts are inspectable compiler output. This iteration does not enable `intake-collector` in Studio and does not connect it to Runtime or a real data system.
