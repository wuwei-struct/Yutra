# Security

Yutra is a local-first reference implementation project.

## Security Scope

- This repository does not claim production-grade security hardening.
- Examples and stubs are for demonstration and developer onboarding.
- No hosted multi-tenant service is provided in this repository.
- No real customer API keys or production credentials should be stored in repo.

## Repository Hygiene Requirements

- Do not commit `.env` or `.env.*` files.
- Do not commit real secrets or customer data.
- Treat `.yutra/traces/*` and `.yutra/audit/*` as local runtime artifacts by default.
- Share trace/audit only via sanitized files in `demo-artifacts/`.

## Reporting a Vulnerability

Please open a private security report to project maintainers (or file an issue
with minimal repro details if private reporting is unavailable).

Include:

- affected package/file,
- reproduction steps,
- expected vs actual behavior,
- risk assessment.
