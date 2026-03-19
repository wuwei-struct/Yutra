# Demo Script

## 0:00-0:30 Positioning

"Yutra is an Agent Execution Standard and Reference Runtime. We model agent behavior as explicit state/action/transition execution, not prompt chaining."

## 0:30-1:30 Run one example

"I will run IT Helpdesk. It validates a DSL spec, executes actions, and returns a structured result with trace."

Command:

```bash
pnpm yutra run examples/it-helpdesk/agent.yutra.yaml --input examples/it-helpdesk/demo-inputs/case1.json --trace-file .yutra/traces/demo-it.jsonl
```

## 1:30-2:30 Open Trace Viewer and explain execution

"Now I open the local viewer. Left is run list, middle is timeline, right is event detail."

Command:

```bash
pnpm --filter @yutra/viewer dev
```

Talking points:
- point to `state.entered`, `action.started/succeeded`, `transition.resolved`
- show payload has context delta and structured metadata

## 2:30-3:00 Why this is not a prompt script

"State transitions are explicit and inspectable. Guards/handoff are deterministic branches, not opaque model decisions."

## 3:00-3:30 Summary

"Yutra gives a minimal, execution-first standard/runtime/tooling path: validate DSL, run state machine, inspect trace end-to-end."
