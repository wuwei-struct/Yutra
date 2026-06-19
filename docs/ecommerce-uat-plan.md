# E-commerce Public Demo Validation Plan

This is a public mock/demo validation note. It is not a production UAT plan and is not a customer acceptance playbook.

## Scope

Public validation covers only local demo assets:

- mock adapters
- demo inputs
- generated trace/audit examples
- certification checks
- non-production Rule Compiler artifacts

## Demo Checks

- Validate the example DSL.
- Run representative mock shipping, return, refund, and handoff cases.
- Inspect trace and audit output generated locally.
- Confirm mock/demo policies do not contain secrets, real endpoints, or customer data.

## Not Included

- production UAT criteria
- customer sign-off process
- rollout schedule
- production system integration
- private customer SOP
- commercial delivery commitments

Use private implementation repositories for real customer UAT material.
