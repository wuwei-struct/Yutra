# Request-resolution E-commerce Basic Demo Config

This directory contains a public demo Pack Config for the Rule Compiler CLI.

It is intentionally mock-only:

- no customer data
- no real endpoints
- no secrets
- no customer SOP
- no production adapter mapping

Compile it locally:

```bash
pnpm exec yutra compile examples/request-resolution-ecommerce-basic/pack.config.json --out .tmp/compiled-request-resolution
```

Dry run without writing files:

```bash
pnpm exec yutra compile examples/request-resolution-ecommerce-basic/pack.config.json --out .tmp/compiled-request-resolution --dry-run
```

Generated artifacts are local outputs and should not be committed.
