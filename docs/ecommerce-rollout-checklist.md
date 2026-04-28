# E-commerce Rollout Checklist (P3-05)

## Pre-rollout

- [ ] UAT sign-off completed
- [ ] policy/template freeze confirmed
- [ ] adapter config reviewed (env/auth/timeout/retry)
- [ ] handoff owner and queue confirmed

## Grey rollout plan

- [ ] select low-risk traffic subset
- [ ] define observation window and rollback owner
- [ ] confirm trace file location and audit export path
- [ ] confirm manual fallback process

## Rollback criteria

Rollback immediately if:
- adapter contract mismatch blocks key path
- repeated auth/rate-limit failures prevent service continuity
- handoff route is unavailable for high-risk requests
- output message contract breaks channel delivery constraints

## Runtime evidence checks during rollout

- [ ] completed path traces are readable
- [ ] handoff path traces contain reasonCode/source/summary
- [ ] audit bundle export works for at least one run
- [ ] no uncontrolled state drift in core SOP path

## Post-rollout review

- [ ] summarize defects and policy adjustments
- [ ] update integration profile overrides if needed
- [ ] record next-step scope (without expanding beyond frozen paths)
