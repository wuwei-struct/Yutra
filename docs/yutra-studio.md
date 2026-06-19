# Yutra Studio

Yutra Studio is the local single-user workbench for building Skill-based agents with Yutra.

It is a builder shell around existing layers:

```text
Builder Core
-> AI Draft Core
-> DSL / AgentSpec preview
-> Creator Compile Preview
-> Builder Runner
-> Runtime
-> Trace / Audit
```

## What P5-06 Supports

- Sidebar navigation shell.
- Top operation bar with draft status and placeholder save/publish controls.
- AI Draft Assistant with mock provider by default.
- Manual Apply to Editor.
- DSL editor with Validate DSL, Inspect DSL, Apply DSL as Run Source, Reset from Builder, and Copy DSL.
- Creator Workbench Compile Preview for public `request-resolution` and `approval-decision` demo Pack Configs.
- Rule Impact Explanation for public `request-resolution` and `approval-decision` demo fields.
- Certification Readiness Preview for demo/mock compile output.
- Manual Run Preview Evidence for showing user-triggered run evidence in the readiness panel.
- Manual bridge from compiled `agent.yutra.yaml` to the DSL Editor.
- Creator Workflow guidance for Select archetype -> Configure business rules -> Review rule impact -> Compile preview -> Send to DSL editor -> Inspect DSL manually -> Apply DSL manually -> Run Preview manually -> Review Trace / Audit.
- AgentSpec JSON preview.
- Inspect panel for validation, normalized DSL structure, canonical IR, and structure overview.
- Run Preview through local builder-runner.
- Embedded trace timeline, event detail, and audit summary.
- English / 中文 UI switching from the top bar.

The language switch only affects Studio UI labels. DSL text, Trace event type strings, payload raw fields, file paths, code blocks, and canonical IR are not translated or rewritten.

## How to Start

Terminal 1:

```bash
pnpm builder:runner
```

Terminal 2:

```bash
pnpm builder:dev
```

## Current Limits

- No real save or publish.
- No login, teams, permissions, database, or SaaS backend.
- No DSL-to-BuilderFormConfig backfill.
- No drag-and-drop flow editing.
- No real customer API integration.
- AI Draft does not auto-run Runtime.
- Creator Compile Preview does not auto-run Runtime, does not write artifacts, and does not publish an Agent.
- Creator Compile Preview is demo/mock only and does not include real adapters, real endpoints, customer SOP, or customer configuration.
- Rule Impact Explanation is demo/basic metadata only and does not change compiler output or Runtime behavior.
- Certification Readiness Preview is not official certification, does not run Runtime, does not execute test cases, and does not claim production readiness.
- Compiled DSL sent to the editor is not trusted until it passes Inspect DSL.
- Creator Workflow is a UI guide only; it does not automate Runtime, Inspect, Apply, or Run Preview steps.

DSL Source execution is now supported:

```text
DSL text -> /dsl/inspect -> normalized structure -> canonical AgentSpec -> Runtime Preview
```

This is intentionally not a full form roundtrip. Applying DSL as run source does not rewrite the BuilderFormConfig form fields.

## vNext: Toward Creator Workbench

Current Yutra Studio is the early form of Creator Workbench.

Today, the workbench exposes Builder config, AI Draft, DSL inspect, Run Preview, Trace, and Audit in one local single-user UI.

vNext moves the primary authoring entry upward:

```text
Archetype Selection
-> Business Rule Configuration
-> Rule Compiler
-> Generated DSL / Policy / Templates / Tests
-> Run Preview
-> Trace / Audit / Certification
```

The DSL Editor remains valuable as an advanced inspection and override surface, but the default customer-facing entry should become archetype selection plus business rule configuration.

P6-05A is the first step in that direction:

```text
request-resolution or approval-decision Pack Config
-> /creator/compile-preview
-> six demo/mock compiler artifacts
-> compile report
```

The generated `agent.yutra.yaml` is shown for inspection only. Users must still explicitly inspect/apply DSL before using any existing Run Preview path.

P6-05B adds the manual bridge:

```text
compiled agent.yutra.yaml
-> Send to DSL Editor
-> Inspect DSL
-> Apply DSL as Run Source
-> manual Run Preview
```

The bridge does not call Runtime, does not call `/dsl/inspect` automatically, does not auto-apply source mode, and does not write artifacts to disk.

P6-06A adds Rule Impact Explanation:

```text
Pack Config field
-> affected Guard / Action / Transition / Policy / Template / Test Case / Trace Expectation
-> affected compiler artifacts
```

This explanation layer helps users understand generated behavior for request-resolution and approval-decision demo configs. It does not run Runtime, does not auto-apply DSL, and does not include customer SOP or real approval procedures.

P6-06B adds Certification Readiness Preview:

```text
Compile Preview output
-> readiness gates
-> artifact status
-> boundary notes
```

P6-06C lets Studio display manual Run Preview Evidence in this panel after the user manually runs the compiled DSL path.
The evidence can show runId, event count, trace presence, audit bundle presence, and compiled DSL metadata.

This panel is a preview only. It does not automatically execute Runtime, does not execute test cases, does not run official certification, and does not declare production readiness.
Manual Run Preview evidence does not make the official certification gate ready.
If the DSL changes after evidence capture, the evidence becomes stale.

P6-08A polishes the Creator Workbench information architecture into five visible areas:

- Header / current workbench status
- Archetype & Business Rules
- Rule Explanation
- Compile Preview
- Readiness & Evidence

See [Creator Workbench UI](creator-workbench-ui.md).

Relevant vNext docs:

- [vNext Charter](vnext-charter.md)
- [Agent Archetype Library](archetype-library.md)
- [Business Rule Config](business-rule-config.md)
- [Rule Compiler Overview](rule-compiler-overview.md)
- [Creator Workbench](creator-workbench.md)
- [Creator Workbench UI](creator-workbench-ui.md)
- [vNext Roadmap](vnext-roadmap.md)

## Roadmap

- P5-07: Visual Flow Preview
- P5-08: Save / Export Pack
