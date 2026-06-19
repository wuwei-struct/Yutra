# Approval Decision Basic Demo

This is a public mock/demo Pack Config for the `approval-decision` archetype.

It demonstrates the second archetype core chain:

- Pack Config validation
- Rule Impact metadata
- Rule Compiler output
- CLI artifact export

It does not include real approval systems, real endpoints, real credentials, real organization data, customer SOP, pricing, UAT, rollout, or private delivery assets.

Example:

```bash
yutra compile examples/approval-decision-basic/pack.config.json --out .tmp/approval-decision-basic --dry-run
yutra compile examples/approval-decision-basic/pack.config.json --out .tmp/approval-decision-basic --force
```

Generated artifacts are local outputs only and should not be committed.
